import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { uploadLogoToStorage, deleteLogoFromStorage } from "@/lib/email-brand";

export async function GET() {
  try {
    const { data, error } = await db
      .from("settings")
      .select("value")
      .eq("key", "brand")
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return NextResponse.json(data?.value || { logoUrl: null, logoFilename: null });
  } catch {
    return NextResponse.json({ logoUrl: null, logoFilename: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logo, logoFilename, companyName, tagline } = body;

    let value: Record<string, any> = { companyName: companyName || "Xmailo", tagline: tagline || "" };

    if (logo) {
      const logoUrl = await uploadLogoToStorage(logo, logoFilename || "logo.png");
      if (!logoUrl) {
        return NextResponse.json(
          { error: "Failed to upload logo to storage" },
          { status: 500 }
        );
      }
      value.logoUrl = logoUrl;
      value.logoFilename = logoFilename || "logo.png";
    } else {
      const { data: existing } = await db
        .from("settings")
        .select("value")
        .eq("key", "brand")
        .single();

      if (existing?.value?.logoUrl) {
        value.logoUrl = existing.value.logoUrl;
        value.logoFilename = existing.value.logoFilename;
      }
    }

    const { error: upsertError } = await db
      .from("settings")
      .upsert({ key: "brand", value, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true, logoUrl: value.logoUrl });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save logo", detail: err?.message || err?.details || String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { data, error: fetchError } = await db
      .from("settings")
      .select("value")
      .eq("key", "brand")
      .single();

    if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

    const value = data?.value || {};
    await deleteLogoFromStorage(value.logoFilename);

    const { error } = await db
      .from("settings")
      .upsert({ key: "brand", value: {}, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete logo", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}
