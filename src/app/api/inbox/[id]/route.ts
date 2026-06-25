import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url);
    const attachmentIndex = url.searchParams.get("attachment");

    if (attachmentIndex !== null) {
      const { data, error } = await db
        .from("inbound_emails")
        .select("attachments")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Email not found" }, { status: 404 });
      }

      const atts: any[] = data.attachments || [];
      const idx = parseInt(attachmentIndex);
      const att = atts[idx];

      if (!att) {
        return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
      }

      if (att.content) {
        const buffer = Buffer.from(att.content, "base64");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": att.content_type || "application/octet-stream",
            "Content-Disposition": `attachment; filename="${att.filename}"`,
            "Content-Length": buffer.length.toString(),
          },
        });
      }

      return NextResponse.json({
        filename: att.filename,
        contentType: att.content_type,
        size: att.size,
      });
    }

    const { data, error } = await db
      .from("inbound_emails")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    await db
      .from("inbound_emails")
      .update({ read: true })
      .eq("id", params.id);

    const email = {
      id: data.id,
      from: data.from_email,
      to: data.to_email,
      subject: data.subject,
      html: data.html,
      text: data.text,
      attachments: (data.attachments || []).map((a: any, i: number) => ({
        ...a,
        index: i,
        downloadUrl: `/api/inbox/${data.id}?attachment=${i}`,
      })),
      read: true,
      receivedAt: data.received_at,
    };

    return NextResponse.json(email);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch email" },
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
    const { data, error } = await db
      .from("inbound_emails")
      .update(body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update email" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await db
      .from("inbound_emails")
      .delete()
      .eq("id", params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete email" },
      { status: 500 }
    );
  }
}
