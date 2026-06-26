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

    const fromEmail = payload.from || payload.From || "";
    const toEmail = (payload.to || payload.To || []).join(", ");
    const subject = payload.subject || payload.Subject || "";
    const html = payload.html || payload.Html || "";
    const text = payload.text || payload.Text || "";
    const rawAttachments = payload.attachments || payload.Attachments || [];

    const attachments = rawAttachments.map((att: any) => ({
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
