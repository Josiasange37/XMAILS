import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    await db.from("webhook_events").insert({
      event: "inbound_email",
      payload,
      processed: false,
    });

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
      .eq("event", "inbound_email")
      .is("processed", false);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
