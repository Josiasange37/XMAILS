import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sendEmail } from "@/lib/resend";
import { injectBranding } from "@/lib/email-brand";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 200);

    let query = db
      .from("emails")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = db
        .from("emails")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(limit);
    }

    const { data: emails, error } = await query;
    if (error) throw error;

    const parseTo = (val: string): string[] => {
      if (!val) return [];
      try { const p = JSON.parse(val); return Array.isArray(p) ? p : [p]; }
      catch { return val.split(",").map((s) => s.trim()).filter(Boolean); }
    };

    const mapped = (emails || []).map((e: any) => ({
      id: e.id,
      from: e.from_email,
      to: parseTo(e.to_email),
      subject: e.subject,
      status: e.status,
      createdAt: e.created_at,
      sentAt: e.created_at,
      opened: e.opened,
      clicked: e.clicked,
      html: e.html,
      text: e.text,
      trackingId: e.tracking_id,
      scheduledAt: e.scheduled_at,
    }));

    return NextResponse.json({ emails: mapped });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}

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

    const { data: email, error: insertError } = await db
      .from("emails")
      .insert({
        from_email: from,
        to_email: to,
        subject,
        html,
        text,
        status: "queued",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    try {
      const brandedHtml = html ? await injectBranding(html) : html;
      const result = await sendEmail({ from, to: Array.isArray(to) ? to : [to], subject, html: brandedHtml, text });
      const { data: updated } = await db
        .from("emails")
        .update({ tracking_id: result?.id, status: "sent" })
        .eq("id", email.id)
        .select()
        .single();
      return NextResponse.json(updated || email, { status: 201 });
    } catch {
      await db
        .from("emails")
        .update({ status: "failed" })
        .eq("id", email.id);
      return NextResponse.json(email, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
