import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const { data: audienceContacts, error: joinError } = await db
      .from("audience_contacts")
      .select("added_at, contact_id(id, email, first_name, last_name, company)")
      .eq("audience_id", params.id);

    if (joinError) throw joinError;

    const contactsList = (audienceContacts || []).map((ac: any) => ({
      id: ac.contact_id.id,
      email: ac.contact_id.email,
      firstName: ac.contact_id.first_name,
      lastName: ac.contact_id.last_name,
      company: ac.contact_id.company,
      addedAt: ac.added_at,
    }));

    return NextResponse.json({ ...audience, contacts: contactsList });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch audience" },
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

    const { data: audience, error } = await db
      .from("audiences")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!audience) {
      return NextResponse.json(
        { error: "Audience not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(audience);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update audience" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: audience, error } = await db
      .from("audiences")
      .delete()
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!audience) {
      return NextResponse.json(
        { error: "Audience not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Audience deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete audience" },
      { status: 500 }
    );
  }
}
