import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
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
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}
