import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    const { data: audiences, error } = await db
      .from("audiences")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json(audiences || []);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch audiences" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data: audience, error } = await db
      .from("audiences")
      .insert({ name, description })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(audience, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create audience" },
      { status: 500 }
    );
  }
}
