import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceISO = since.toISOString();

    const { count: contactsCount, error: contactsError } = await db
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sinceISO)
      .eq("unsubscribed", false);

    if (contactsError) throw contactsError;

    const { count: sentCount, error: sentError } = await db
      .from("emails")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sinceISO)
      .eq("status", "sent");

    if (sentError) throw sentError;

    const { count: deliveredCount, error: deliveredError } = await db
      .from("emails")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sinceISO)
      .in("status", ["sent"]);

    if (deliveredError) throw deliveredError;

    const { count: openedCount, error: openedError } = await db
      .from("emails")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sinceISO)
      .eq("opened", true);

    if (openedError) throw openedError;

    const { count: bouncedCount, error: bouncedError } = await db
      .from("emails")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sinceISO)
      .eq("status", "failed");

    if (bouncedError) throw bouncedError;

    const totalSent = sentCount ?? 0;
    const totalDelivered = deliveredCount ?? 0;
    const totalOpened = openedCount ?? 0;
    const totalBounced = bouncedCount ?? 0;
    const totalContacts = contactsCount ?? 0;

    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

    return NextResponse.json({
      period: "last_30_days",
      totalContacts,
      totalSent,
      totalDelivered,
      totalOpened,
      totalBounced,
      openRate: Math.round(openRate * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics overview" },
      { status: 500 }
    );
  }
}
