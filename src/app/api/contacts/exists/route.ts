import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function POST(request: NextRequest) {
  try {
    const { emails } = await request.json();
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Array of emails required" }, { status: 400 });
    }

    const unique = [...new Set(emails.map((e: string) => e.toLowerCase().trim()).filter(Boolean))];

    const { data, error } = await db
      .from("contacts")
      .select("email")
      .in("email", unique);

    if (error) throw error;

    const existing = new Set((data || []).map((c: any) => c.email.toLowerCase()));
    const result: Record<string, boolean> = {};
    unique.forEach((e) => { result[e] = existing.has(e); });

    return NextResponse.json({
      existing: result,
      total: unique.length,
      found: existing.size,
      new: unique.length - existing.size,
    });
  } catch {
    return NextResponse.json({ error: "Failed to check contacts" }, { status: 500 });
  }
}
