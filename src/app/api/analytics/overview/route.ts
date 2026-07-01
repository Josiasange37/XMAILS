import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        period: "last_30_days",
        totalContacts: 0,
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalBounced: 0,
        openRate: 0,
        bounceRate: 0,
        note: "Supabase not configured",
      });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceISO = since.toISOString();

    const { count: contactsCount, error: contactsError } = await db
      .from("contacts")
      .select("*", { count: "exact", head: true })
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
      .eq("status", "delivered");

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
      .eq("status", "bounced");

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
  } catch {
    return NextResponse.json({
      period: "last_30_days",
      totalContacts: 0,
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalBounced: 0,
      openRate: 0,
      bounceRate: 0,
    });
  }
}
