const PROVIDERS = [
  {
    name: "openrouter1",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: () => process.env.OPENROUTER_API_KEY,
    model: "google/gemma-4-31b-it:free",
    supportsJsonMode: true,
  },
  {
    name: "openrouter2",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: () => process.env.OPENROUTER_API_KEY_2,
    model: "openai/gpt-oss-120b:free",
    supportsJsonMode: true,
  },
  {
    name: "groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: () => process.env.GROQ_API_KEY,
    model: "llama3-70b-8192",
    supportsJsonMode: false,
  },
];

function isRetryable(status: number): boolean {
  return [401, 402, 403, 429, 500, 502, 503].includes(status);
}

function extractErrorMessage(data: any): string {
  if (typeof data?.error?.message === "string") return data.error.message;
  if (typeof data?.error === "string") return data.error;
  return "Unknown API error";
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
      const body: Record<string, any> = {
        model: provider.model,
        messages,
        max_tokens: 2000,
      };

      if (provider.supportsJsonMode) {
        body.response_format = { type: "json_object" };
      } else {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content:
            typeof messages[messages.length - 1].content === "string"
              ? `${messages[messages.length - 1].content}\n\nRespond with valid JSON only.`
              : messages[messages.length - 1].content,
        };
      }

      const res = await fetch(provider.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(provider.name.startsWith("openrouter")
            ? { "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" }
            : {}),
        },
        body: JSON.stringify(body),
        signal: combinedSignal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = `${provider.name} (${res.status}): ${extractErrorMessage(errorData)}`;
        lastError.push(errMsg);

        if (isRetryable(res.status)) {
          continue;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();

      const raw = data.choices?.[0]?.message?.content;
      if (!raw) {
        lastError.push(`${provider.name}: empty response`);
        continue;
      }

      let parsed: any;
      try {
        const cleaned = raw
          .replace(/```json\s*/gi, "")
          .replace(/```\s*$/g, "")
          .trim();
        parsed = JSON.parse(cleaned);
      } catch {
        lastError.push(`${provider.name}: invalid JSON response`);
        continue;
      }

      return {
        subject: parsed.subject || "",
        html: parsed.html || "",
        text: parsed.text || "",
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

  throw new Error(
    `All AI providers failed:\n${lastError.join("\n")}`
  );
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
