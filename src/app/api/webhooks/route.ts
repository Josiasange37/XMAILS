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

    const body = JSON.parse(raw);
    const { type, data } = body;

    const { error: insertError } = await db.from("webhook_events").insert({
      event: type,
      payload: body,
      processed: false,
    });

    if (insertError) throw insertError;

    if (type === "email.delivered" && data?.email_id) {
      const { error } = await db
        .from("emails")
        .update({ status: "delivered" })
        .eq("tracking_id", data.email_id);
      if (error) throw error;
    }

    if (type === "email.opened" && data?.email_id) {
      const { error } = await db
        .from("emails")
        .update({ status: "opened", opened: true })
        .eq("tracking_id", data.email_id);
      if (error) throw error;
    }

    if (type === "email.clicked" && data?.email_id) {
      const { error } = await db
        .from("emails")
        .update({ status: "clicked", clicked: true })
        .eq("tracking_id", data.email_id);
      if (error) throw error;
    }

    if (type === "email.bounced" && data?.email_id) {
      const { error } = await db
        .from("emails")
        .update({ status: "bounced" })
        .eq("tracking_id", data.email_id);
      if (error) throw error;
    }

    if (type === "email.sent" && data?.email_id) {
      const { error } = await db
        .from("emails")
        .update({ status: "sent" })
        .eq("tracking_id", data.email_id);
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
