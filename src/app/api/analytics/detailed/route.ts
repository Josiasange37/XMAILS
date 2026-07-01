import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        totals: { total: 0, sent: 0, delivered: 0, bounced: 0, opened: 0, clicked: 0 },
        rates: { deliveryRate: 0, openRate: 0, clickRate: 0, bounceRate: 0 },
        week: { sent: 0, delivered: 0, opened: 0, bounced: 0, avgPerDay: 0 },
        byType: {},
        contacts: 0,
        dailyTimeline: [],
      });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      { data: allEmails, error: e1 },
      { data: weekEmails, error: e2 },
      { count: contactsCount },
    ] = await Promise.all([
      db.from("emails").select("*"),
      db.from("emails").select("*").gte("created_at", sevenDaysAgo.toISOString()),
      db.from("contacts").select("*", { count: "exact", head: true }).eq("unsubscribed", false),
    ]);

    if (e1) throw e1;

    const total = allEmails?.length || 0;
    const sent = allEmails?.filter((e: any) => e.status === "sent" || e.status === "delivered").length || 0;
    const delivered = allEmails?.filter((e: any) => e.status === "delivered").length || 0;
    const bounced = allEmails?.filter((e: any) => e.status === "bounced").length || 0;
    const opened = allEmails?.filter((e: any) => e.opened).length || 0;
    const clicked = allEmails?.filter((e: any) => e.clicked).length || 0;

    const weekSent = weekEmails?.filter((e: any) => e.status === "sent" || e.status === "delivered").length || 0;
    const weekDelivered = weekEmails?.filter((e: any) => e.status === "delivered").length || 0;
    const weekOpened = weekEmails?.filter((e: any) => e.opened).length || 0;
    const weekBounced = weekEmails?.filter((e: any) => e.status === "bounced").length || 0;

    const byType: Record<string, number> = {};
    for (const e of allEmails || []) {
      const t = (e as any).type || "single";
      byType[t] = (byType[t] || 0) + 1;
    }

    const byDay: Record<string, any> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      byDay[key] = { day: label, sent: 0, delivered: 0, opened: 0, bounced: 0 };
    }
    for (const e of weekEmails || []) {
      const day = (e as any).created_at?.slice(0, 10);
      if (byDay[day]) {
        byDay[day].sent++;
        if ((e as any).status === "delivered") byDay[day].delivered++;
        if ((e as any).status === "bounced") byDay[day].bounced++;
        if ((e as any).opened) byDay[day].opened++;
      }
    }

    const dailyTimeline = Object.values(byDay);

    return NextResponse.json({
      totals: {
        total,
        sent,
        delivered,
        bounced,
        opened,
        clicked,
      },
      rates: {
        deliveryRate: sent > 0 ? Math.round((delivered / sent) * 10000) / 100 : 0,
        openRate: delivered > 0 ? Math.round((opened / delivered) * 10000) / 100 : 0,
        clickRate: opened > 0 ? Math.round((clicked / opened) * 10000) / 100 : 0,
        bounceRate: sent > 0 ? Math.round((bounced / sent) * 10000) / 100 : 0,
      },
      week: {
        sent: weekSent,
        delivered: weekDelivered,
        opened: weekOpened,
        bounced: weekBounced,
        avgPerDay: Math.round(weekSent / 7),
      },
      byType,
      contacts: contactsCount || 0,
      dailyTimeline,
    });
  } catch {
    return NextResponse.json({
      totals: { total: 0, sent: 0, delivered: 0, bounced: 0, opened: 0, clicked: 0 },
      rates: { deliveryRate: 0, openRate: 0, clickRate: 0, bounceRate: 0 },
      week: { sent: 0, delivered: 0, opened: 0, bounced: 0, avgPerDay: 0 },
      byType: {},
      contacts: 0,
      dailyTimeline: [],
    });
  }
}
