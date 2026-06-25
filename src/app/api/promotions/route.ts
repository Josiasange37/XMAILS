import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sendEmail } from "@/lib/resend";
import { injectBranding } from "@/lib/email-brand";

export async function GET() {
  try {
    const { data: promotions, error } = await db
      .from("emails")
      .select("*")
      .eq("type", "promotion")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json(
      (promotions || []).map((e: any) => ({
        id: e.id,
        subject: e.subject,
        to: e.to_email,
        from: e.from_email,
        status: e.status,
        sentAt: e.created_at,
        createdAt: e.created_at,
      }))
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch promotions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, html, text, from, to } = body;

    if (!subject || !from || !to?.length) {
      return NextResponse.json(
        { error: "subject, from, and to are required" },
        { status: 400 }
      );
    }

    const brandedHtml = html ? await injectBranding(html) : html;

    const results = [];
    for (const recipient of to) {
      const personalizedSubject = subject
        .replace(/\{\{first_name\}\}/g, recipient.first_name || "there")
        .replace(/\{\{last_name\}\}/g, recipient.last_name || "")
        .replace(/\{\{company\}\}/g, recipient.company || "")
        .replace(/\{\{email\}\}/g, recipient.email);

      const personalizedHtml = brandedHtml
        ? brandedHtml
            .replace(/\{\{first_name\}\}/g, recipient.first_name || "there")
            .replace(/\{\{last_name\}\}/g, recipient.last_name || "")
            .replace(/\{\{company\}\}/g, recipient.company || "")
            .replace(/\{\{email\}\}/g, recipient.email)
        : undefined;

      const personalizedText = text
        ? text
            .replace(/\{\{first_name\}\}/g, recipient.first_name || "there")
            .replace(/\{\{last_name\}\}/g, recipient.last_name || "")
            .replace(/\{\{company\}\}/g, recipient.company || "")
            .replace(/\{\{email\}\}/g, recipient.email)
        : undefined;

      try {
        await sendEmail({
          from,
          to: [recipient.email],
          subject: personalizedSubject,
          html: personalizedHtml,
          text: personalizedText,
          tags: [{ name: "type", value: "promotion" }],
        });

        await db.from("emails").insert({
          to_email: recipient.email,
          from_email: from,
          subject: personalizedSubject,
          html: personalizedHtml || "",
          text: personalizedText || "",
          status: "sent",
          type: "promotion",
        });

        results.push({ email: recipient.email, status: "sent" });
      } catch (err: any) {
        results.push({ email: recipient.email, status: "failed", error: err.message });
      }
    }

    return NextResponse.json({ results }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to send promotion" },
      { status: 500 }
    );
  }
}
