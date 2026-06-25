const PROVIDERS = [
  {
    name: "openrouter2",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: () => process.env.OPENROUTER_API_KEY_2,
    model: "openai/gpt-oss-120b:free",
  },
  {
    name: "openrouter1",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: () => process.env.OPENROUTER_API_KEY,
    model: "google/gemma-4-31b-it:free",
  },
  {
    name: "groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: () => process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
  },
];

function isRetryable(status: number): boolean {
  return [400, 401, 402, 403, 429, 500, 502, 503].includes(status);
}

const JSON_INSTRUCTION = `You MUST respond with ONLY valid JSON. No markdown formatting, no code blocks, no explanation. Start with { and end with }. The JSON must have exactly these fields: "subject" (string), "html" (string - the email body HTML), "text" (string - plain text version).`;

function extractJson(raw: string): any {
  const cleaned = raw.trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}
  }

  const noTicks = cleaned
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .replace(/`/g, "")
    .trim();
  try {
    return JSON.parse(noTicks);
  } catch {}

  throw new Error("Could not extract valid JSON from response");
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
    const timeout = setTimeout(() => controller.abort(), 30000);
    const combinedSignal = outerSignal
      ? combineAbortSignals(outerSignal, controller.signal)
      : controller.signal;

    try {
      const msgs = structuredClone(messages);
      const last = msgs[msgs.length - 1];
      if (typeof last.content === "string") {
        last.content += `\n\n${JSON_INSTRUCTION}`;
      } else if (Array.isArray(last.content)) {
        const textPart = last.content.find((p: any) => p.type === "text");
        if (textPart) {
          textPart.text += `\n\n${JSON_INSTRUCTION}`;
        } else {
          last.content.push({ type: "text", text: JSON_INSTRUCTION });
        }
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
      if (provider.name.startsWith("openrouter")) {
        headers["HTTP-Referer"] =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      }

      const res = await fetch(provider.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: provider.model,
          messages: msgs,
          max_tokens: 2000,
        }),
        signal: combinedSignal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg =
          typeof errorData?.error?.message === "string"
            ? errorData.error.message
            : typeof errorData?.error === "string"
              ? errorData.error
              : `HTTP ${res.status}`;
        lastError.push(`${provider.name} (${res.status}): ${errMsg}`);
        if (isRetryable(res.status)) continue;
        throw new Error(`${provider.name} (${res.status}): ${errMsg}`);
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) {
        lastError.push(`${provider.name}: empty response`);
        continue;
      }

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
        lastError.push(`${provider.name}: timeout (30s)`);
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
