import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json([]);
    }

    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

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
  } catch {
    return NextResponse.json([]);
  }
}
