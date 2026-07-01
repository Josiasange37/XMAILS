import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "10minutemail.com",
  "throwaway.email", "yopmail.com", "trashmail.com", "sharklasers.com",
  "burnermail.io", "spamgourmet.com", "mailnator.com", "dispostable.com",
  "temp-mail.org", "fakeinbox.com", "getnada.com", "tempmail.net",
  "mailexpire.com", "tempemail.net", "spambox.us", "mintemail.com",
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const clean = email.toLowerCase().trim();
    const issues: string[] = [];
    let domain: string | null = null;
    let mxRecords: string[] | null = null;

    // Format check
    if (!EMAIL_REGEX.test(clean)) {
      issues.push("Invalid email format");
      return NextResponse.json({ valid: false, issues, format: false, disposable: false, mx: false });
    }

    domain = clean.split("@")[1];

    // Disposable check
    const disposable = DISPOSABLE_DOMAINS.has(domain);

    // MX record check
    try {
      const mx = await dns.resolveMx(domain);
      mxRecords = mx.sort((a, b) => a.priority - b.priority).map((m) => m.exchange);
    } catch {
      issues.push("Domain has no mail servers (MX records)");
    }

    if (disposable) issues.push("Disposable email domain");

    return NextResponse.json({
      valid: issues.length === 0,
      email: clean,
      domain,
      format: true,
      disposable,
      mx: mxRecords !== null,
      mxRecords,
      issues,
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
