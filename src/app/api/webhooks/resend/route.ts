import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { verifyWebhook } from "@/lib/webhook";

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((v, k) => { headers[k] = v; });

    if (!verifyWebhook(raw, headers)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(raw);
    const d = payload.data || payload;

    const { data: event, error: insertError } = await db
      .from("webhook_events")
      .insert({
        event: "inbound_email",
        payload,
        processed: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const fromEmail = d.from || d.From || "";
    const toEmail = (d.to || d.To || []).join(", ");
    const subject = d.subject || d.Subject || "";
    let html = d.html || d.Html || "";
    let text = d.text || d.Text || "";
    let rawAttachments = d.attachments || d.Attachments || [];

    // Webhook payload doesn't include body content — fetch it from Resend API
    if (!html && !text && d.email_id) {
      try {
        const apiKey = process.env.RESEND_API_KEY;
        if (apiKey) {
          const res = await fetch(
            `https://api.resend.com/emails/receiving/${d.email_id}`,
            { headers: { Authorization: `Bearer ${apiKey}` } }
          );
          if (res.ok) {
            const full = await res.json();
            html = full.html || full.Html || html;
            text = full.text || full.Text || text;
            rawAttachments = full.attachments || full.Attachments || rawAttachments;
          }
        }
      } catch {
        // non-critical — metadata is enough for inbox list
      }
    }

    const attachments = (rawAttachments || []).map((att: any) => ({
      filename: att.filename || att.Filename || "attachment",
      content_type: att.content_type || att.ContentType || "application/octet-stream",
      size: att.size || att.Size || 0,
      content: att.content || att.Content || "",
    }));

    const { error } = await db.from("inbound_emails").insert({
      from_email: fromEmail,
      to_email: toEmail,
      subject,
      html,
      text,
      attachments,
    });

    if (error) throw error;

    await db
      .from("webhook_events")
      .update({ processed: true })
      .eq("id", event.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
