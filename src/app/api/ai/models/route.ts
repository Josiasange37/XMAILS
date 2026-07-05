import { NextResponse } from "next/server";

const MODELS = [
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    label: "Llama 3.3 70B (Free)",
    provider: "openrouter1",
    group: "OpenRouter",
    requiresApiKey: "OPENROUTER_API_KEY",
  },
  {
    id: "qwen/qwen-2.5-72b-instruct:free",
    label: "Qwen 2.5 72B (Free)",
    provider: "openrouter2",
    group: "OpenRouter",
    requiresApiKey: "OPENROUTER_API_KEY_2",
  },
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B (Groq)",
    provider: "groq",
    group: "Groq",
    requiresApiKey: "GROQ_API_KEY",
  },
  {
    id: "glm-4-plus",
    label: "GLM-4 Plus",
    provider: "bigmodel",
    group: "BigModel",
    requiresApiKey: "BIGMODEL_API_KEY",
  },
];

export async function GET() {
  const available = MODELS.filter((m) => process.env[m.requiresApiKey]);

  return NextResponse.json({ models: available });
}
