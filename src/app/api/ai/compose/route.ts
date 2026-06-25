import { NextRequest, NextResponse } from "next/server";
import { getBrandSettings } from "@/lib/email-brand";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    const { prompt, contact } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const brand = await getBrandSettings();
    const companyName = brand.companyName || "Xyberclan";
    const tagline = brand.tagline || "";

    const contactInfo = contact
      ? `Recipient details:
- Name: ${[contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Valued Customer"}
- Email: ${contact.email}
${contact.company ? `- Company: ${contact.company}` : ""}
${contact.tags?.length ? `- Tags: ${contact.tags.join(", ")}` : ""}
${contact.custom_fields ? `- Custom fields: ${JSON.stringify(contact.custom_fields)}` : ""}

Use these recipient details to PERSONALIZE the email. Address them by name in the greeting. Reference their company if relevant. Do NOT ask for their name or company — you already have it.`
      : "No specific recipient — write a general email.";

    const systemPrompt = `You are a professional email writer for ${companyName}. ${tagline ? `${tagline}. ` : ""}Generate polished, well-structured emails.

${contactInfo}

Return valid JSON with:
- subject: compelling subject line
- html: email body HTML (content only — NO logo, NO header, NO company name banner — those are added automatically server-side)
- text: plain text version

Tone: professional, warm, on-brand for ${companyName}.
Structure: start with a greeting, body paragraphs, call to action if appropriate, then sign-off.
Style: clean inline CSS, responsive-friendly, max 600px width.

Do NOT include any <img>, header banner, or logo — only the body content.`;

    const res = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || "OpenRouter API error");
    }

    const content = JSON.parse(data.choices?.[0]?.message?.content || "{}");

    return NextResponse.json({
      subject: content.subject || "",
      html: content.html || "",
      text: content.text || "",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "AI generation failed" },
      { status: 500 }
    );
  }
}
