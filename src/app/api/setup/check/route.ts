import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(req: NextRequest) {
  const table = req.nextUrl.searchParams.get("table");
  if (!table) {
    return NextResponse.json({ error: "table param required" }, { status: 400 });
  }
  try {
    const { error } = await db.from(table).select("id").limit(1);
    return NextResponse.json({ exists: !error, error: error?.message || null });
  } catch {
    return NextResponse.json({ exists: false, error: "connection failed" });
  }
}
