import { db } from "@/db";
import { supabase } from "@/db";

const STORAGE_BUCKET = "logos";

export async function getBrandSettings() {
  try {
    const { data, error } = await db
      .from("settings")
      .select("value")
      .eq("key", "brand")
      .single();

    if (error && error.code !== "PGRST116") return {};
    return data?.value || {};
  } catch {
    return {};
  }
}

export async function uploadLogoToStorage(
  base64: string,
  filename: string
): Promise<string | null> {
  try {
    const mime = filename?.endsWith(".svg")
      ? "image/svg+xml"
      : filename?.endsWith(".webp")
        ? "image/webp"
        : "image/png";

    const ext = filename?.split(".").pop() || "png";
    const filePath = `logo.${ext}`;

    const buffer = Buffer.from(base64, "base64");

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: mime,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  } catch {
    return null;
  }
}

export async function deleteLogoFromStorage(filename?: string) {
  try {
    const ext = filename?.split(".").pop() || "png";
    const filePath = `logo.${ext}`;
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
  } catch {
    // ignore
  }
}

export function injectLogoIntoHtml(html: string, logoUrl: string, companyName?: string, tagline?: string): string {
  if (!logoUrl) return html;

  const name = companyName || "Xmailo";
  const desc = tagline || "Email Management Platform";

  const logoHtml = `
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e5e7eb;">
      <tr>
        <td style="width:56px;vertical-align:middle;">
          <img src="${logoUrl}"
               alt="${name}"
               style="width:48px;height:48px;border-radius:50%;display:block;object-fit:cover;"
          />
        </td>
        <td style="vertical-align:middle;padding-left:12px;">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:18px;font-weight:700;color:#1f2937;line-height:1.3;">
            ${name}
          </div>
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#6b7280;line-height:1.4;margin-top:2px;">
            ${desc}
          </div>
        </td>
      </tr>
    </table>
  `;

  const bodyMatch = html.match(/<body[^>]*>/i);
  if (bodyMatch) {
    const bodyTag = bodyMatch[0];
    return html.replace(bodyTag, bodyTag + logoHtml);
  }

  const headEndMatch = html.match(/<\/head>/i);
  if (headEndMatch) {
    return html.replace(
      /<\/head>/i,
      `</head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f2937;">${logoHtml}`
    );
  }

  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f2937;">${logoHtml}${html}</div>`;
}

export async function injectBranding(html?: string): Promise<string> {
  if (!html) return html || "";

  const brand = await getBrandSettings();
  if (brand.logoUrl) {
    return injectLogoIntoHtml(html, brand.logoUrl, brand.companyName, brand.tagline);
  }

  return html;
}
