import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const emailId = searchParams.get("emailId");
    const broadcastId = searchParams.get("broadcastId");
    const event = searchParams.get("event");
    const days = parseInt(searchParams.get("days") || "30");

    const since = new Date();
    since.setDate(since.getDate() - days);

    let query = db
      .from("analytics")
      .select("*")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(500);

    if (emailId) {
      query = query.eq("email_id", emailId);
    }
    if (broadcastId) {
      query = query.eq("broadcast_id", broadcastId);
    }
    if (event) {
      query = query.eq("event", event);
    }

    const { data: events, error } = await query;

    if (error) throw error;

    return NextResponse.json(events || []);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
