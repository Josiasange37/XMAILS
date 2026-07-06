const MAX_TOKENS = 4096;
const GROQ_MAX_TOKENS = 8192;
const PER_ATTEMPT_TIMEOUT_MS = 25000;
const MAX_TOTAL_TIMEOUT_MS = 90000;
const MAX_RETRIES = 1;
const PROVIDER_COOLDOWN_MS = 30000;
const OR_REFERER = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const providerCooldown = new Map<string, number>();

function isProviderOnCooldown(name: string): boolean {
  const until = providerCooldown.get(name);
  if (!until) return false;
  if (Date.now() > until) {
    providerCooldown.delete(name);
    return false;
  }
  return true;
}

const PROVIDERS = [
  {
    name: "bigmodel",
    endpoint: "https://api.z.ai/api/paas/v4/chat/completions",
    apiKey: () => process.env.BIGMODEL_API_KEY,
    model: "glm-5.1",
  },
  {
    name: "bigmodel-legacy",
    endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    apiKey: () => process.env.BIGMODEL_API_KEY,
    model: "glm-4-flash",
  },
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
    model: "qwen/qwen3-coder:free",
  },
  {
    name: "groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: () => process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
  },
];

const JSON_INSTRUCTION = `OUTPUT FORMAT: Your entire response must be ONLY a JSON object with exactly 3 fields. No greeting. No explanation. No markdown. No code fences. No thinking. Use DOUBLE QUOTES for all strings, never backticks. Start with { and end with }.

{"subject": "your subject line here", "html": "<p>your email HTML here</p>", "text": "your plain text here"}

Fields:
- subject: compelling subject line (under 60 chars, no ALL CAPS)
- html: email body HTML as a double-quoted string (content only — no logo, header, or footer)
- text: plain text version as a double-quoted string

Again: respond with ONLY the JSON using double quotes. Start with {. End with }. Nothing else.`;

function extractRetryAfter(body: string): number | null {
  const match = body.match(/try again in (\d+(?:\.\d+)?)\s*s/);
  if (match) {
    const seconds = parseFloat(match[1]);
    return Math.min(Math.max(seconds + 0.5, 1), 15);
  }
  return null;
}

function extractJson(raw: string): any {
  const cleaned = raw.trim();

  const tryParse = (s: string) => { try { return JSON.parse(s); } catch { return null; } };

  let result = tryParse(cleaned);
  if (result) return result;

  const jsonBlock = cleaned.match(/\{[\s\S]*\}/);
  if (jsonBlock) {
    result = tryParse(jsonBlock[0]);
    if (result) return result;
  }

  const unmarked = cleaned.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
  result = tryParse(unmarked);
  if (result) return result;

  const backtickFixed = unmarked.replace(/(:\s*?)`([^`]*)`/g, (_, p, v) => p + '"' + v.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"');
  result = tryParse(backtickFixed);
  if (result) return result;

  const allQuotes = unmarked.replace(/`/g, '"');
  result = tryParse(allQuotes);
  if (result) return result;

  const partialMatch = cleaned.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/);
  if (partialMatch) {
    result = tryParse(partialMatch[0]);
    if (result) return result;
  }

  const lastBrace = cleaned.lastIndexOf("{");
  if (lastBrace !== -1) {
    const partial = cleaned.slice(lastBrace);
    result = tryParse(partial + '"}');
    if (result) return result;
    result = tryParse(partial.replace(/["\s]*$/, '"}'));
    if (result) return result;
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
  overallSignal: AbortSignal,
): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const attemptController = new AbortController();
    const attemptTimeout = setTimeout(() => attemptController.abort(), PER_ATTEMPT_TIMEOUT_MS);
    const combinedSignal = overallSignal
      ? combineAbortSignals(overallSignal, attemptController.signal)
      : attemptController.signal;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
        }),
        signal: combinedSignal,
      });

      clearTimeout(attemptTimeout);

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

      if (res.status === 429) {
        const wait = extractRetryAfter(body) ?? 0;
        throw new Error(`HTTP 429: ${detail}`);
      }

      throw new Error(`HTTP ${res.status}: ${detail}`);
    } catch (err: any) {
      clearTimeout(attemptTimeout);
      if (err.name === "AbortError" && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }

  throw new Error("max retries exceeded");
}

const modelProviderMap: Record<string, string> = {
  "meta-llama/llama-3.3-70b-instruct:free": "openrouter1",
  "openai/gpt-oss-120b:free": "openrouter1",
  "qwen/qwen3-next-80b-a3b-instruct:free": "openrouter1",
  "nousresearch/hermes-3-llama-3.1-405b:free": "openrouter1",
  "google/gemma-4-26b-a4b-it:free": "openrouter1",
  "google/gemma-4-31b-it:free": "openrouter1",
  "nvidia/nemotron-3-super-120b-a12b:free": "openrouter1",
  "openai/gpt-oss-20b:free": "openrouter1",
  "openrouter/free": "openrouter1",
  "qwen/qwen3-32b": "groq",
  "llama-3.3-70b-versatile": "groq",
  "meta-llama/llama-4-scout-17b-16e-instruct": "groq",
  "openai/gpt-oss-120b": "groq",
  "glm-5.1": "bigmodel",
  "glm-5": "bigmodel",
  "glm-5-turbo": "bigmodel",
  "glm-4.7": "bigmodel-legacy",
  "glm-4.7-flash": "bigmodel-legacy",
  "glm-4-flash": "bigmodel-legacy",
};

export async function callAI({
  messages,
  modelId,
  signal: outerSignal,
}: {
  messages: { role: string; content: string | any[] }[];
  modelId?: string;
  signal?: AbortSignal;
}) {
  const lastError: string[] = [];

  const overallController = new AbortController();
  const overallTimeout = setTimeout(() => overallController.abort(), MAX_TOTAL_TIMEOUT_MS);
  const overallSignal = outerSignal
    ? combineAbortSignals(outerSignal, overallController.signal)
    : overallController.signal;

  const providerName = modelId ? modelProviderMap[modelId] : undefined;
  let providers: typeof PROVIDERS;
  if (providerName) {
    const preferred = PROVIDERS.find((p) => p.name === providerName);
    providers = preferred ? [preferred] : PROVIDERS;
  } else {
    providers = PROVIDERS;
  }

  try {
    for (const provider of providers) {
      const apiKey = provider.apiKey();
      if (!apiKey) {
        lastError.push(`${provider.name}: API key not configured`);
        continue;
      }

      if (overallSignal.aborted) {
        lastError.push(`${provider.name}: overall timeout`);
        continue;
      }

      if (isProviderOnCooldown(provider.name)) {
        lastError.push(`${provider.name}: rate limited (skipped)`);
        continue;
      }

      try {
        const msgs = structuredClone(messages);
        appendJsonInstruction(msgs[msgs.length - 1]);

        const maxTokens = provider.name === "groq" ? GROQ_MAX_TOKENS : MAX_TOKENS;
        const headers = provider.name.startsWith("openrouter")
          ? openRouterHeaders(apiKey)
          : groqHeaders(apiKey);

        const isFallback = providerName && provider.name !== providerName;
        const actualModel = isFallback ? provider.model : (modelId || provider.model);

        const raw = await fetchCompletion(
          provider.endpoint,
          headers,
          actualModel,
          msgs,
          maxTokens,
          overallSignal,
        );

        let parsed: any;
        try {
          parsed = extractJson(raw);
        } catch (e: any) {
          lastError.push(`${provider.name}: ${e.message} — "${raw.slice(0, 120)}"`);
          continue;
        }

        clearTimeout(overallTimeout);
        return {
          subject: (parsed.subject || "").toString(),
          html: (parsed.html || "").toString(),
          text: (parsed.text || "").toString(),
          provider: provider.name,
          model: actualModel,
        };
      } catch (err: any) {
        if (err.name === "AbortError") {
          lastError.push(`${provider.name}: overall timeout`);
          continue;
        }
        if (err.message?.startsWith("HTTP 429")) {
          providerCooldown.set(provider.name, Date.now() + PROVIDER_COOLDOWN_MS);
        }
        lastError.push(`${provider.name}: ${err.message}`);
        continue;
      }
    }

    if (!modelId) {
      const discoveryKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY_2;
      if (discoveryKey) {
      try {
        const modelsRes = await fetch("https://openrouter.ai/api/v1/models", {
          signal: AbortSignal.timeout(5000),
        });
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          const data = modelsData.data || modelsData;
          const freeModels = (Array.isArray(data) ? data : [])
            .filter((m: { id?: string; pricing?: { prompt?: string; completion?: string } }) =>
              m.id?.endsWith(":free") &&
              parseFloat(m.pricing?.prompt || "1") === 0 &&
              parseFloat(m.pricing?.completion || "1") === 0
            )
            .map((m: { id: string }) => m.id)
            .filter((id: string) => !lastError.some((e) => e.includes(id)));

          for (let i = freeModels.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [freeModels[i], freeModels[j]] = [freeModels[j], freeModels[i]];
          }

          for (const modelId of freeModels.slice(0, 5)) {
            if (overallSignal.aborted) break;
            try {
              const msgs = structuredClone(messages);
              appendJsonInstruction(msgs[msgs.length - 1]);
              const raw = await fetchCompletion(
                "https://openrouter.ai/api/v1/chat/completions",
                openRouterHeaders(discoveryKey),
                modelId,
                msgs,
                MAX_TOKENS,
                overallSignal,
              );
              let parsed: any;
              try { parsed = extractJson(raw); } catch { continue; }
              clearTimeout(overallTimeout);
              return {
                subject: (parsed.subject || "").toString(),
                html: (parsed.html || "").toString(),
                text: (parsed.text || "").toString(),
                provider: "discovery",
                model: modelId,
              };
            } catch { continue; }
          }
          lastError.push("discovery: no working free model found");
        } else {
          lastError.push("discovery: failed to fetch model list");
        }
      } catch (e: any) {
        lastError.push(`discovery: ${e.message}`);
      }
      }
    }

    if (modelId) {
      throw new Error(lastError[0] || "unknown error");
    }
    throw new Error(`All AI providers failed:\n${lastError.join("\n")}`);
  } finally {
    clearTimeout(overallTimeout);
  }
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
