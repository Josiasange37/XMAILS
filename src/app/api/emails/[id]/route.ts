import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(request: NextRequest) {
  try {
    const emailId = request.nextUrl.searchParams.get("emailId");
    if (!emailId) {
      return NextResponse.json({ error: "emailId required" }, { status: 400 });
    }

    const { data: email, error } = await db
      .from("emails")
      .select("*")
      .eq("id", emailId)
      .single();

    if (error || !email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: email.id,
      subject: email.subject,
      to: email.to_email,
      from: email.from_email,
      status: email.status,
      opened: email.opened,
      clicked: email.clicked,
      trackingId: email.tracking_id,
      createdAt: email.created_at,
      sentAt: email.created_at,
      html: email.html,
      text: email.text,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
