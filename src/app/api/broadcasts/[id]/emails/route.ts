import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: emails, error } = await db
      .from("emails")
      .select("*")
      .eq("related_id", params.id)
      .eq("type", "broadcast")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(emails || []);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch campaign emails" },
      { status: 500 }
    );
  }
}
