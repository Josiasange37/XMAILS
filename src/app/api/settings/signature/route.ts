import { NextResponse } from "next/server";
import { db } from "@/db";

export async function GET() {
  try {
    const { data, error } = await db
      .from("settings")
      .select("*")
      .in("key", ["signature_name", "signature_title", "signature_company", "signature_logo"])
      .limit(10);

    if (error) throw error;

    const map: Record<string, string> = {
      signature_name: "",
      signature_title: "",
      signature_company: "",
      signature_logo: "",
    };
    for (const row of data || []) {
      const v = row.value;
      map[row.key] = typeof v === "object" ? v.value ?? "" : String(v ?? "");
    }

    return NextResponse.json(map);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const allowed = ["signature_name", "signature_title", "signature_company", "signature_logo"];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        const val = body[key] as string;
        const { error: upsertError } = await db
          .from("settings")
          .upsert({ key, value: val }, { onConflict: "key" });
        if (upsertError) throw upsertError;
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
