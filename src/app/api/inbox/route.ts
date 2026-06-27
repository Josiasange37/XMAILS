import { NextResponse } from "next/server";
import { db } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await db
      .from("inbound_emails")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    const mapped = (data || []).map((e: any) => ({
      id: e.id,
      from: e.from_email,
      to: e.to_email,
      subject: e.subject,
      hasAttachments: Array.isArray(e.attachments) && e.attachments.length > 0,
      attachmentCount: Array.isArray(e.attachments) ? e.attachments.length : 0,
      read: e.read,
      receivedAt: e.received_at,
    }));

    return NextResponse.json({ emails: mapped });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch inbox" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { error } = await db
      .from("inbound_emails")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to clear inbox" },
      { status: 500 }
    );
  }
}
