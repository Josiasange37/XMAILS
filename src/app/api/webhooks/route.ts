import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    const { error: insertError } = await db.from("webhooks").insert({
      event: type,
      payload: body,
      processed: false,
    });

    if (insertError) throw insertError;

    if (type === "email.delivered" && data?.email_id) {
      const { error } = await db
        .from("emails")
        .update({ status: "delivered", delivered_at: new Date().toISOString() })
        .eq("resend_id", data.email_id);
      if (error) throw error;
    }

    if (type === "email.opened" && data?.email_id) {
      const { error } = await db
        .from("emails")
        .update({ status: "opened", opened_at: new Date().toISOString() })
        .eq("resend_id", data.email_id);
      if (error) throw error;
    }

    if (type === "email.clicked" && data?.email_id) {
      const { error } = await db
        .from("emails")
        .update({ status: "clicked" })
        .eq("resend_id", data.email_id);
      if (error) throw error;
    }

    if (type === "email.bounced" && data?.email_id) {
      const { error } = await db
        .from("emails")
        .update({ status: "bounced" })
        .eq("resend_id", data.email_id);
      if (error) throw error;
    }

    if (type === "email.sent" && data?.email_id) {
      const { error } = await db
        .from("emails")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("resend_id", data.email_id);
      if (error) throw error;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
