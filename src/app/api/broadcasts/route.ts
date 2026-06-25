import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sendEmail } from "@/lib/resend";
import { injectBranding } from "@/lib/email-brand";

export async function GET() {
  try {
    const { data: broadcasts, error } = await db
      .from("broadcasts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json(broadcasts || []);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch broadcasts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, html, text, from, audienceId, sendNow, customRecipients } = body;

    if (!name || !subject || !from) {
      return NextResponse.json(
        { error: "name, subject, and from are required" },
        { status: 400 }
      );
    }

    const { data: broadcast, error: insertError } = await db
      .from("broadcasts")
      .insert({
        name,
        subject,
        html,
        text,
        from_email: from,
        audience_id: audienceId,
        status: sendNow ? "queued" : "draft",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    type Recipient = { email: string; first_name?: string; last_name?: string; company?: string };
    let recipients: Recipient[] = [];

    if (customRecipients && Array.isArray(customRecipients)) {
      if (typeof customRecipients[0] === "string") {
        recipients = customRecipients.map((e: string) => ({ email: e }));
      } else {
        recipients = customRecipients;
      }
    } else if (sendNow && audienceId) {
      const { data: audienceContacts, error: joinError } = await db
        .from("audience_contacts")
        .select("contact_id(*)")
        .eq("audience_id", audienceId);

      if (joinError) throw joinError;

      recipients = (audienceContacts || [])
        .map((c: any) => {
          const contact = c.contact_id;
          return contact?.email
            ? { email: contact.email, first_name: contact.first_name, last_name: contact.last_name, company: contact.company }
            : null;
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
    }

    const personalize = (template: string, r: Recipient) =>
      (template || "")
        .replace(/\{\{first_name\}\}/g, r.first_name || "there")
        .replace(/\{\{last_name\}\}/g, r.last_name || "")
        .replace(/\{\{company\}\}/g, r.company || "")
        .replace(/\{\{email\}\}/g, r.email);

    if (sendNow && recipients.length > 0) {
      try {
        const brandedHtml = html ? await injectBranding(html) : html;

        let sent = 0;
        for (const r of recipients) {
          try {
            await sendEmail({
              from,
              to: [r.email],
              subject: personalize(subject, r),
              html: brandedHtml ? personalize(brandedHtml, r) : undefined,
              text: text ? personalize(text, r) : undefined,
              tags: audienceId
                ? [{ name: "audience_id", value: audienceId }]
                : [{ name: "broadcast", value: name }],
            });
            sent++;
          } catch {
            // individual send failure — continue with others
          }
        }

        await db
          .from("broadcasts")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            total_sent: sent,
          })
          .eq("id", broadcast.id);
      } catch (sendError) {
        await db
          .from("broadcasts")
          .update({ status: "failed" })
          .eq("id", broadcast.id);
      }
    }

    return NextResponse.json(broadcast, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create broadcast" },
      { status: 500 }
    );
  }
}
