import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    const { data: sequences, error } = await db
      .from("sequences")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json(sequences || []);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch sequences" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, from, audienceId, steps } = body;

    if (!name || !from) {
      return NextResponse.json(
        { error: "name and from are required" },
        { status: 400 }
      );
    }

    const { data: sequence, error } = await db
      .from("sequences")
      .insert({
        name,
        description,
        from,
        audience_id: audienceId,
        steps: steps || [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(sequence, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create sequence" },
      { status: 500 }
    );
  }
}
