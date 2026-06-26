const MAX_TOKENS = 4096;
const GROQ_MAX_TOKENS = 8192;
const TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 1500;
const MAX_RETRIES = 2;
const OR_REFERER = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const PROVIDERS = [
  {
    name: "openrouter1",
    apiKey: () => process.env.OPENROUTER_API_KEY,
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: "meta-llama/llama-3.3-70b-instruct:free",
  },
  {
    name: "openrouter2",
    apiKey: () => process.env.OPENROUTER_API_KEY_2,
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: "mistralai/mistral-small-3.1-24b-instruct:free",
  },
  {
    name: "groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: () => process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
  },
];

const JSON_INSTRUCTION = `Respond with ONLY valid JSON. Think carefully, but output ONLY the JSON. No markdown, no code blocks, no explanations, no reasoning text. Start with { and end with }. The JSON must have exactly these fields: "subject" (string), "html" (string - email body HTML), "text" (string - plain text version).`;

function extractJson(raw: string): any {
  const cleaned = raw.trim();
  try { return JSON.parse(cleaned); } catch {}
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch {} }
  const noTicks = cleaned.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").replace(/`/g, "").trim();
  try { return JSON.parse(noTicks); } catch {}
  const partialMatch = cleaned.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/);
  if (partialMatch) { try { return JSON.parse(partialMatch[0]); } catch {} }
  const lastBrace = cleaned.lastIndexOf("{");
  if (lastBrace !== -1) {
    const partial = cleaned.slice(lastBrace);
    const repaired = partial + '" }';
    try { return JSON.parse(repaired); } catch {}
    const repaired2 = partial.replace(/["\s]*$/, '"}');
    try { return JSON.parse(repaired2); } catch {}
  }
  throw new Error("Could not extract valid JSON from response");
}

function appendJsonInstruction(msg: { role: string; content: string | any[] }) {
  if (typeof msg.content === "string") {
    msg.content += `\n\n${JSON_INSTRUCTION}`;
  } else if (Array.isArray(msg.content)) {
    const textPart = msg.content.find((p: any) => p.type === "text");
    if (textPart) {
      textPart.text += `\n\n${JSON_INSTRUCTION}`;
    } else {
      msg.content.push({ type: "text", text: JSON_INSTRUCTION });
    }
  }
}

function openRouterHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": OR_REFERER(),
    "X-Title": "Xyberclan",
  };
}

function groqHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function fetchCompletion(
  endpoint: string,
  headers: Record<string, string>,
  model: string,
  messages: any[],
  maxTokens: number,
  signal: AbortSignal,
): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
      }),
      signal,
    });

    if (res.ok) {
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) throw new Error("empty response");
      return raw;
    }

    const body = await res.text().catch(() => "");
    let detail: string;
    try {
      const json = JSON.parse(body);
      detail = json.error?.message || json.error || JSON.stringify(json).slice(0, 200);
    } catch {
      detail = body.slice(0, 200) || `HTTP ${res.status}`;
    }

    if (res.status === 429 && attempt < MAX_RETRIES) continue;
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }

  throw new Error("max retries exceeded");
}

export async function callAI({
  messages,
  signal: outerSignal,
}: {
  messages: { role: string; content: string | any[] }[];
  signal?: AbortSignal;
}) {
  const lastError: string[] = [];

  for (const provider of PROVIDERS) {
    const apiKey = provider.apiKey();
    if (!apiKey) {
      lastError.push(`${provider.name}: API key not configured`);
      continue;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const combinedSignal = outerSignal
      ? combineAbortSignals(outerSignal, controller.signal)
      : controller.signal;

    try {
      const msgs = structuredClone(messages);
      appendJsonInstruction(msgs[msgs.length - 1]);

      const maxTokens = provider.name === "groq" ? GROQ_MAX_TOKENS : MAX_TOKENS;
      const headers = provider.name.startsWith("openrouter")
        ? openRouterHeaders(apiKey)
        : groqHeaders(apiKey);

      const raw = await fetchCompletion(
        provider.endpoint,
        headers,
        provider.model,
        msgs,
        maxTokens,
        combinedSignal,
      );

      clearTimeout(timeout);

      let parsed: any;
      try {
        parsed = extractJson(raw);
      } catch (e: any) {
        lastError.push(`${provider.name}: ${e.message} — "${raw.slice(0, 120)}"`);
        continue;
      }

      return {
        subject: (parsed.subject || "").toString(),
        html: (parsed.html || "").toString(),
        text: (parsed.text || "").toString(),
        provider: provider.name,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        lastError.push(`${provider.name}: timeout (${TIMEOUT_MS / 1000}s)`);
        continue;
      }
      lastError.push(`${provider.name}: ${err.message}`);
      continue;
    }
  }

  throw new Error(`All AI providers failed:\n${lastError.join("\n")}`);
}

function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const sig of signals) {
    if (sig.aborted) {
      controller.abort(sig.reason);
      return controller.signal;
    }
    sig.addEventListener("abort", () => controller.abort(sig.reason), { once: true });
  }
  return controller.signal;
}
