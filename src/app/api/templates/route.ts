import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    const { data: templates, error } = await db
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json(templates || []);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, html, text, variables } = body;

    if (!name || !subject || !html) {
      return NextResponse.json(
        { error: "name, subject, and html are required" },
        { status: 400 }
      );
    }

    const { data: template, error } = await db
      .from("templates")
      .insert({ name, subject, html, text, variables: variables || [] })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
