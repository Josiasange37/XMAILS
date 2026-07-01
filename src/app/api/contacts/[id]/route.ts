import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: contact, error } = await db
      .from("contacts")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (error) throw error;

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { email, first_name, last_name, company, tags } = body;

    if (email !== undefined && !validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (tags !== undefined && (!Array.isArray(tags) || tags.some((t: any) => typeof t !== "string"))) {
      return NextResponse.json({ error: "Tags must be an array of strings" }, { status: 400 });
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (company !== undefined) updateData.company = company;
    if (tags !== undefined) updateData.tags = tags;

    const { data: contact, error } = await db
      .from("contacts")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: contact, error } = await db
      .from("contacts")
      .delete()
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Contact deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
