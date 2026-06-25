import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: email, error } = await db
      .from("emails")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (error) throw error;

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json(email);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch email" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { resendId, sentAt, deliveredAt, openedAt, ...rest } = body;

    const { data: email, error } = await db
      .from("emails")
      .update({
        ...rest,
        ...(resendId !== undefined && { resend_id: resendId }),
        ...(sentAt !== undefined && { sent_at: sentAt }),
        ...(deliveredAt !== undefined && { delivered_at: deliveredAt }),
        ...(openedAt !== undefined && { opened_at: openedAt }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json(email);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update email" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: email, error } = await db
      .from("emails")
      .delete()
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Email deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete email" },
      { status: 500 }
    );
  }
}
