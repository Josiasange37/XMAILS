const RESEND_API = "https://api.resend.com";
const apiKey = process.env.RESEND_API_KEY || "";

export async function sendEmail({
  from,
  to,
  subject,
  html,
  text,
  replyTo,
  tags,
}: {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}) {
  const res = await fetch(`${RESEND_API}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      reply_to: replyTo,
      tags,
    }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.message || body.error || "Failed to send email");
  return body;
}

export async function sendBroadcast({
  from,
  to,
  subject,
  html,
  text,
  audienceId,
  name,
}: {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  audienceId?: string;
  name: string;
}) {
  const batch = to.map((email) => ({
    from,
    to: [email],
    subject,
    html,
    text,
    tags: audienceId
      ? [{ name: "audience_id", value: audienceId }]
      : [{ name: "broadcast", value: name }],
  }));

  const res = await fetch(`${RESEND_API}/emails/batch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(batch),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.message || body.error || "Failed to send broadcast");
  return body;
}

export default { sendEmail, sendBroadcast };
