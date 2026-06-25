import { NextRequest, NextResponse } from "next/server";
import { getBrandSettings } from "@/lib/email-brand";
import { callAI } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
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

    const result = await callAI({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "AI generation failed" },
      { status: 500 }
    );
  }
}
