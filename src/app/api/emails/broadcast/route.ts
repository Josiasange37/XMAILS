import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sendEmail } from "@/lib/resend";
import { injectBranding } from "@/lib/email-brand";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, subject, html, text } = body;

    if (!from || !to || !subject) {
      return NextResponse.json(
        { error: "from, to, and subject are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(to) || to.length === 0) {
      return NextResponse.json(
        { error: "to must be a non-empty array of email addresses" },
        { status: 400 }
      );
    }

    const brandedHtml = html ? await injectBranding(html) : html;

    let sent = 0;
    let failed = 0;

    for (const recipient of to) {
      try {
        const { data: email, error: insertError } = await db
          .from("emails")
          .insert({
            from_email: from,
            to_email: [recipient],
            subject,
            html,
            text,
            status: "queued",
          })
          .select()
          .single();

        if (insertError) {
          failed++;
          continue;
        }

        const result = await sendEmail({
          from,
          to: [recipient],
          subject,
          html: brandedHtml,
          text,
        });

        await db
          .from("emails")
          .update({ tracking_id: result?.id, status: "sent" })
          .eq("id", email.id);

        sent++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({
      sent,
      failed,
      total: to.length,
      message: `Sent to ${sent} recipient(s)${failed > 0 ? `, ${failed} failed` : ""}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send broadcast" },
      { status: 500 }
    );
  }
}
