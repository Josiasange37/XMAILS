import crypto from "crypto";

export function verifyWebhook(
  payload: string,
  headers: { [key: string]: string | string[] | undefined }
): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true; // skip if not configured

  const svixId = getHeader(headers, "svix-id");
  const svixTimestamp = getHeader(headers, "svix-timestamp");
  const svixSignature = getHeader(headers, "svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
  const raw = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const key = Buffer.from(raw, "base64");
  const expected = crypto
    .createHmac("sha256", key)
    .update(signedContent)
    .digest("base64");

  return svixSignature
    .split(" ")
    .some((sig) => {
      const parts = sig.split(",");
      return parts.length === 2 && parts[1] === expected;
    });
}

function getHeader(
  headers: { [key: string]: string | string[] | undefined },
  name: string
): string | undefined {
  const val = headers[name];
  if (Array.isArray(val)) return val[0];
  return val;
}
