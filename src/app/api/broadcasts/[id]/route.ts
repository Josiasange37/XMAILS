import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: broadcast, error } = await db
      .from("broadcasts")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (error) throw error;

    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(broadcast);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch broadcast" },
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
    const { audienceId, scheduledAt, sentAt, totalSent, totalOpened, totalClicked, totalBounced, ...rest } = body;

    const { data: broadcast, error } = await db
      .from("broadcasts")
      .update({
        ...rest,
        ...(audienceId !== undefined && { audience_id: audienceId }),
        ...(scheduledAt !== undefined && { scheduled_at: scheduledAt }),
        ...(sentAt !== undefined && { sent_at: sentAt }),
        ...(totalSent !== undefined && { total_sent: totalSent }),
        ...(totalOpened !== undefined && { total_opened: totalOpened }),
        ...(totalClicked !== undefined && { total_clicked: totalClicked }),
        ...(totalBounced !== undefined && { total_bounced: totalBounced }),
      })
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(broadcast);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update broadcast" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: broadcast, error } = await db
      .from("broadcasts")
      .delete()
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Broadcast deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete broadcast" },
      { status: 500 }
    );
  }
}
