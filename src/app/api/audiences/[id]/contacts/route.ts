import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { contactId } = body;

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId is required" },
        { status: 400 }
      );
    }

    const { data: audience, error: audienceError } = await db
      .from("audiences")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (audienceError) throw audienceError;

    if (!audience) {
      return NextResponse.json(
        { error: "Audience not found" },
        { status: 404 }
      );
    }

    const { data: contact, error: contactError } = await db
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .maybeSingle();

    if (contactError) throw contactError;

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    const { data: existing, error: existingError } = await db
      .from("audience_contacts")
      .select("*")
      .eq("audience_id", params.id)
      .eq("contact_id", contactId)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        { error: "Contact already in audience" },
        { status: 409 }
      );
    }

    const { data: entry, error: insertError } = await db
      .from("audience_contacts")
      .insert({ audience_id: params.id, contact_id: contactId })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add contact to audience" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId query parameter is required" },
        { status: 400 }
      );
    }

    const { data: entry, error } = await db
      .from("audience_contacts")
      .delete()
      .eq("audience_id", params.id)
      .eq("contact_id", contactId)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!entry) {
      return NextResponse.json(
        { error: "Contact not found in audience" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Contact removed from audience" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove contact from audience" },
      { status: 500 }
    );
  }
}
