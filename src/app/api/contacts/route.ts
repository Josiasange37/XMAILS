import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    const tag = searchParams.get("tag");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const offset = (page - 1) * limit;

    const { count: total } = await db
      .from("contacts")
      .select("*", { count: "exact", head: true });

    if (email) {
      const { data: contact, error } = await db
        .from("contacts")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (error) throw error;

      return NextResponse.json({
        contacts: contact ? [contact] : [],
        total: contact ? 1 : 0,
        page: 1,
        limit,
        pages: 1,
      });
    }

    if (tag) {
      const { data: contacts, error } = await db
        .from("contacts")
        .select("*")
        .contains("tags", [tag])
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return NextResponse.json({
        contacts: contacts || [],
        total: total || 0,
        page,
        limit,
        pages: Math.ceil((total || 0) / limit),
      });
    }

    const { data: contacts, error } = await db
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      contacts: contacts || [],
      total: total || 0,
      page,
      limit,
      pages: Math.ceil((total || 0) / limit),
    });
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
    const { email, first_name, last_name, company, tags } = body;

    if (!email || !validateEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (tags && (!Array.isArray(tags) || tags.some((t: any) => typeof t !== "string"))) {
      return NextResponse.json({ error: "Tags must be an array of strings" }, { status: 400 });
    }

    if (first_name && typeof first_name !== "string") {
      return NextResponse.json({ error: "first_name must be a string" }, { status: 400 });
    }

    if (last_name && typeof last_name !== "string") {
      return NextResponse.json({ error: "last_name must be a string" }, { status: 400 });
    }

    const { data: contact, error: insertError } = await db
      .from("contacts")
      .insert({
        email: email.toLowerCase().trim(),
        first_name: first_name || null,
        last_name: last_name || null,
        company: company || null,
        tags: tags || [],
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
