import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ timeline: [] });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data: weekData, error } = await db
      .from("emails")
      .select("created_at, status, opened")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    const dayMap: Record<string, { sent: number; delivered: number; opened: number; bounced: number }> = {};
    const dayNames: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      dayNames.push(label);
      dayMap[key] = { sent: 0, delivered: 0, opened: 0, bounced: 0 };
    }

    for (const row of weekData || []) {
      const day = row.created_at?.slice(0, 10);
      if (dayMap[day]) {
        dayMap[day].sent++;
        if (row.status === "delivered") dayMap[day].delivered++;
        if (row.status === "bounced") dayMap[day].bounced++;
        if (row.opened) dayMap[day].opened++;
      }
    }

    const timeline = dayNames.map((label, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const counts = dayMap[key] || { sent: 0, delivered: 0, opened: 0, bounced: 0 };
      return {
        day: label,
        Sent: counts.sent,
        Delivered: counts.delivered,
        Opened: counts.opened,
        Bounced: counts.bounced,
        "Open Rate": counts.delivered > 0 ? Math.round((counts.opened / counts.delivered) * 100) : 0,
        "Bounce Rate": counts.sent > 0 ? Math.round((counts.bounced / counts.sent) * 100) : 0,
      };
    });

    return NextResponse.json({ timeline });
  } catch {
    return NextResponse.json({ timeline: [] });
  }
}
