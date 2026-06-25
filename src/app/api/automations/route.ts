import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    const { data: automations, error } = await db
      .from("automations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json(automations || []);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch automations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, trigger, actions, active } = body;

    if (!name || !trigger || !actions) {
      return NextResponse.json(
        { error: "name, trigger, and actions are required" },
        { status: 400 }
      );
    }

    const { data: automation, error } = await db
      .from("automations")
      .insert({
        name,
        description,
        trigger,
        actions,
        active: active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create automation" },
      { status: 500 }
    );
  }
}
