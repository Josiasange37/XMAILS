import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    const tag = searchParams.get("tag");

    if (email) {
      const { data: contact, error } = await db
        .from("contacts")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (error) throw error;

      return NextResponse.json(contact ? [contact] : []);
    }

    if (tag) {
      const { data: contacts, error } = await db
        .from("contacts")
        .select("*")
        .eq("tags", [tag])
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return NextResponse.json(contacts || []);
    }

    const { data: contacts, error } = await db
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json(contacts || []);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, company, tags, customFields } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: contact, error: insertError } = await db
      .from("contacts")
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        company,
        tags: tags || [],
        custom_fields: customFields || {},
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Contact with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
