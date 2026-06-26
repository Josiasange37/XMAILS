import { OpenRouter } from "@openrouter/sdk";

const MAX_TOKENS = 2000;
const TIMEOUT_MS = 15000;
const OR_REFERER = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const PROVIDERS = [
  {
    name: "openrouter1",
    apiKey: () => process.env.OPENROUTER_API_KEY,
    model: "meta-llama/llama-3.3-70b-instruct:free",
  },
  {
    name: "openrouter2",
    apiKey: () => process.env.OPENROUTER_API_KEY_2,
    model: "openai/gpt-oss-120b:free",
  },
  {
    name: "groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: () => process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
  },
];

const JSON_INSTRUCTION = `First, reason step-by-step about the email content, tone, and structure. Think about what would be most effective for this recipient and context. Then respond with ONLY valid JSON. No markdown formatting, no code blocks, no explanation in the output. Start with { and end with }. The JSON must have exactly these fields: "subject" (string), "html" (string - the email body HTML), "text" (string - plain text version).`;

function extractJson(raw: string): any {
  const cleaned = raw.trim();
  try { return JSON.parse(cleaned); } catch {}
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch {} }
  const noTicks = cleaned.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").replace(/`/g, "").trim();
  try { return JSON.parse(noTicks); } catch {}
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

      let raw: string;

      if (provider.name.startsWith("openrouter")) {
        const client = new OpenRouter({
          apiKey,
          timeoutMs: TIMEOUT_MS,
        });

        let result: any;
        try {
          result = await client.chat.send({
            httpReferer: OR_REFERER(),
            chatRequest: {
              model: provider.model,
              messages: msgs as any,
              maxTokens: MAX_TOKENS,
              responseFormat: { type: "json_object" },
            },
          }, { signal: combinedSignal });
        } catch (fetchErr: any) {
          clearTimeout(timeout);
          const msg = fetchErr.message || "";
          if (msg.includes("402") || msg.includes("paid") || msg.includes("credits") || msg.includes("balance") || msg.includes("free") || msg.includes("not free") || msg.includes("payment")) {
            lastError.push(`${provider.name}: model not free or insufficient credits`);
            continue;
          }
          lastError.push(`${provider.name}: ${msg}`);
          continue;
        }

        clearTimeout(timeout);

        const choice = (result as any).choices?.[0];
        raw = choice?.message?.content ?? "";
        if (!raw) {
          lastError.push(`${provider.name}: empty response`);
          continue;
        }
      } else {
        const res = await fetch(provider.endpoint!, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: provider.model,
            messages: msgs,
            max_tokens: MAX_TOKENS,
          }),
          signal: combinedSignal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errMsg = typeof errorData?.error?.message === "string"
            ? errorData.error.message
            : typeof errorData?.error === "string"
              ? errorData.error
              : `HTTP ${res.status}`;
          lastError.push(`${provider.name} (${res.status}): ${errMsg}`);
          continue;
        }

        const data = await res.json();
        raw = data.choices?.[0]?.message?.content;
        if (!raw) {
          lastError.push(`${provider.name}: empty response`);
          continue;
        }
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
