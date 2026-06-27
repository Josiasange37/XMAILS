import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, company } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const name = [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
    const domain = email.split("@")[1]?.toLowerCase() || "";

    const prompt = `Categorize this contact into 1-3 relevant tags from this list: partner, sponsor, follower, candidate, team, investor, customer, vendor, media, alumni, advisor, board, trial, vip, enterprise.
    
Contact details:
- Name: ${name}
- Email: ${email}
- Domain: ${domain}
${company ? `- Company: ${company}` : ""}

Return ONLY valid JSON with a single field "tags" which is an array of 1-3 tag strings from the list above. Example: {"tags":["partner","vip"]}

Consider:
- Email domain: if it's gmail/yahoo/outlook, lean toward "follower" or "candidate"
- If there's a company name, lean toward "partner", "vendor", or "enterprise" if it looks corporate
- Common patterns: "@" + company-like domains suggest "partner" or "vendor"
- Otherwise default to ["follower"]`;

    const result = await callAI({
      messages: [
        { role: "system", content: "You classify contacts into tags. Return ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
    });

    let tags: string[];
    try {
      const parsed = JSON.parse(result.text);
      tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : ["follower"];
    } catch {
      tags = ["follower"];
    }

    return NextResponse.json({ tags });
  } catch (error: any) {
    return NextResponse.json({ tags: ["follower"] });
  }
}
