import { NextRequest, NextResponse } from "next/server";
import { getBrandSettings } from "@/lib/email-brand";
import { callAI } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, files, contact, model } = body;

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
- subject: compelling subject line (under 60 chars, no ALL CAPS, no spammy words like "guarantee" or "limited time")
- html: email body HTML (content only — NO logo, NO header, NO company name banner, NO footer — those are added automatically server-side)
- text: plain text version

Tone: professional, warm, on-brand for ${companyName}.
Structure: start with a greeting, body paragraphs, clear single call to action if appropriate, then sign-off.
Style: clean inline CSS, responsive-friendly, max 600px width. Use <Row> and <Column> pattern instead of flexbox/grid (poor email client support).
Use standard HTML elements (tables for layout, not CSS grid/flexbox).

Email best practices:
- Single CTA per email (one button, one link to click)
- Text-to-image ratio: at least 60% text
- Include alt text on any images
- Use plain UTF-8 links (no URL shorteners)
- Preview text optimized for inbox display

Do NOT include any <img>, header banner, logo, or footer — only the email body content.
Do NOT ask for personal information you already have from the recipient details.`;

    const messages: any[] = [{ role: "system", content: systemPrompt }];

    const userContent: any[] = [];

    if (files && Array.isArray(files) && files.length > 0) {
      const fileContext = files.map((f: any) => `[Attached file: ${f.name} (${f.type})]`).join("\n");
      userContent.push({
        type: "text",
        text: `${prompt}\n\nThe user has attached the following files for reference:\n${fileContext}\n\nUse them as context to write the email.`,
      });
      files.forEach((f: any) => {
        if (f.mime?.startsWith("image/") && f.content) {
          userContent.push({
            type: "image_url",
            image_url: { url: `data:${f.mime};base64,${f.content}` },
          });
        }
      });
    } else {
      userContent.push({ type: "text", text: prompt });
    }

    messages.push({ role: "user", content: userContent });

    const result = await callAI({ messages, providerName: model });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "AI generation failed" },
      { status: 500 }
    );
  }
}