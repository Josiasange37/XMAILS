import { NextResponse } from "next/server";

const MODELS = [
  // ── OpenRouter (FREE) ──────────────────────────────────
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    label: "Llama 3.3 70B (Free) ⭐ Best for emails",
    provider: "openrouter1",
    group: "OpenRouter",
    requiresApiKey: "OPENROUTER_API_KEY",
  },
  {
    id: "openai/gpt-oss-120b:free",
    label: "GPT-OSS 120B (Free)",
    provider: "openrouter1",
    group: "OpenRouter",
    requiresApiKey: "OPENROUTER_API_KEY",
  },
  {
    id: "qwen/qwen3-next-80b-a3b-instruct:free",
    label: "Qwen3 Next 80B (Free) ⭐",
    provider: "openrouter1",
    group: "OpenRouter",
    requiresApiKey: "OPENROUTER_API_KEY",
  },
  {
    id: "nousresearch/hermes-3-llama-3.1-405b:free",
    label: "Hermes 3 405B (Free) — smart but slow",
    provider: "openrouter1",
    group: "OpenRouter",
    requiresApiKey: "OPENROUTER_API_KEY",
  },
  {
    id: "google/gemma-4-26b-a4b-it:free",
    label: "Gemma 4 26B (Free)",
    provider: "openrouter1",
    group: "OpenRouter",
    requiresApiKey: "OPENROUTER_API_KEY",
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B (Free)",
    provider: "openrouter1",
    group: "OpenRouter",
    requiresApiKey: "OPENROUTER_API_KEY",
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "Nemotron 3 Super 120B (Free) — 1M context",
    provider: "openrouter1",
    group: "OpenRouter",
    requiresApiKey: "OPENROUTER_API_KEY",
  },
  {
    id: "openai/gpt-oss-20b:free",
    label: "GPT-OSS 20B (Free) — fast fallback",
    provider: "openrouter1",
    group: "OpenRouter",
    requiresApiKey: "OPENROUTER_API_KEY",
  },
  {
    id: "openrouter/free",
    label: "Auto: Best Free (let OpenRouter decide)",
    provider: "openrouter1",
    group: "OpenRouter",
    requiresApiKey: "OPENROUTER_API_KEY",
  },

  // ── OpenRouter (via 2nd key) ───────────────────────────
  {
    id: "qwen/qwen3-coder:free",
    label: "Qwen3 Coder 480B (Free) ⭐ Best structured output",
    provider: "openrouter2",
    group: "OpenRouter (2nd key)",
    requiresApiKey: "OPENROUTER_API_KEY_2",
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "Nemotron 3 Super 120B (Free) — 2nd key",
    provider: "openrouter2",
    group: "OpenRouter (2nd key)",
    requiresApiKey: "OPENROUTER_API_KEY_2",
  },

  // ── Groq ──────────────────────────────────────────────
  {
    id: "qwen-3-32b",
    label: "Qwen 3 32B (Groq) ⭐ Fast + quality",
    provider: "groq",
    group: "Groq",
    requiresApiKey: "GROQ_API_KEY",
  },
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B (Groq) — fast",
    provider: "groq",
    group: "Groq",
    requiresApiKey: "GROQ_API_KEY",
  },
  {
    id: "llama-4-scout-17b-16e-instruct",
    label: "Llama 4 Scout 17B (Groq) — fastest",
    provider: "groq",
    group: "Groq",
    requiresApiKey: "GROQ_API_KEY",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B (Groq)",
    provider: "groq",
    group: "Groq",
    requiresApiKey: "GROQ_API_KEY",
  },

  // ── BigModel / Zhipu AI ───────────────────────────────
  {
    id: "glm-5.1",
    label: "GLM-5.1 ⭐ Best reasoning + newest",
    provider: "bigmodel",
    group: "BigModel",
    requiresApiKey: "BIGMODEL_API_KEY",
  },
  {
    id: "glm-5",
    label: "GLM-5 — flagship",
    provider: "bigmodel",
    group: "BigModel",
    requiresApiKey: "BIGMODEL_API_KEY",
  },
  {
    id: "glm-5-turbo",
    label: "GLM-5 Turbo — fast thinking",
    provider: "bigmodel",
    group: "BigModel",
    requiresApiKey: "BIGMODEL_API_KEY",
  },
  {
    id: "glm-4.7",
    label: "GLM-4.7 — strong reasoning",
    provider: "bigmodel",
    group: "BigModel",
    requiresApiKey: "BIGMODEL_API_KEY",
  },
  {
    id: "glm-4.7-flash",
    label: "GLM-4.7 Flash — free, 203K context",
    provider: "bigmodel",
    group: "BigModel",
    requiresApiKey: "BIGMODEL_API_KEY",
  },
  {
    id: "glm-4-flash",
    label: "GLM-4 Flash — free forever",
    provider: "bigmodel",
    group: "BigModel",
    requiresApiKey: "BIGMODEL_API_KEY",
  },
];

export async function GET() {
  const available = MODELS.filter((m) => process.env[m.requiresApiKey]);

  return NextResponse.json({ models: available });
}
