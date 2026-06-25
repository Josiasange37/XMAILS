import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

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
    const { firstName, lastName, customFields, ...rest } = body;

    const { data: contact, error } = await db
      .from("contacts")
      .update({
        ...rest,
        ...(firstName !== undefined && { first_name: firstName }),
        ...(lastName !== undefined && { last_name: lastName }),
        ...(customFields !== undefined && { custom_fields: customFields }),
        updated_at: new Date().toISOString(),
      })
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
