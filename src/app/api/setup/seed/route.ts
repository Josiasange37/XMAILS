import { NextResponse } from "next/server";
import { db } from "@/db";

export async function POST() {
  try {
    const { error: checkError } = await db.from("inbound_emails").select("id").limit(1);
    if (checkError) {
      return NextResponse.json(
        { error: "inbound_emails table does not exist. Run the SQL in /dashboard/setup first." },
        { status: 400 }
      );
    }
    const sample = [
      {
        from_email: "john.doe@example.com",
        to_email: "contact@xmailo.com",
        subject: "Partnership Inquiry",
        html: "<h1>Hello</h1><p>I would like to discuss a partnership with XMAILO.</p>",
        text: "Hello, I would like to discuss a partnership with XMAILO.",
      },
      {
        from_email: "sarah@acme.com",
        to_email: "hello@xmailo.com",
        subject: "Speaker Confirmation",
        html: "<h1>Confirmed</h1><p>I confirm my participation as a speaker at your upcoming event.</p>",
        text: "I confirm my participation as a speaker at your upcoming event.",
      },
    ];
    const { error } = await db.from("inbound_emails").insert(sample);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, count: sample.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
