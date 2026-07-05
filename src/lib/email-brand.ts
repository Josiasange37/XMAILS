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

const FALLBACK_LOGO_URL = "https://addklmtbybzgbyevvdqa.supabase.co/storage/v1/object/public/logos/logo.png";

export function injectLogoIntoHtml(html: string, logoUrl: string | null, companyName?: string, tagline?: string): string {
  const name = companyName || "Xyberclan";
  const url = logoUrl || FALLBACK_LOGO_URL;

  const logoImg = url
    ? `<img src="${url}" alt="${name}" style="width:48px;height:48px;border-radius:8px;vertical-align:middle;margin-right:14px;" />`
    : `<span style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:10px;background:#374151;color:#fff;font-size:18px;font-weight:700;margin-right:14px;vertical-align:middle;">${name.charAt(0).toUpperCase()}</span>`;

  const taglineHtml = tagline
    ? `<span style="color:#9ca3af;margin-left:6px;font-size:16px;">&mdash; ${tagline}</span>`
    : "";

  const header = `
    <div style="margin-bottom:28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      ${logoImg}
      <span style="font-size:22px;font-weight:600;color:#374151;vertical-align:middle;">${name}</span>
      ${taglineHtml}
    </div>
  `;

  const bodyMatch = html.match(/<body[^>]*>/i);
  if (bodyMatch) {
    const bodyTag = bodyMatch[0];
    return html.replace(bodyTag, bodyTag + "\n" + header);
  }

  const htmlMatch = html.match(/<html[^>]*>/i);
  if (htmlMatch) {
    return html.replace(htmlMatch[0], htmlMatch[0] + "\n" + header);
  }

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:24px;color:#374151;">${header}${html}</div>`;
}

export async function injectBranding(html?: string): Promise<string> {
  if (!html) return html || "";

  let brand;
  try {
    brand = await getBrandSettings();
  } catch {
    brand = {};
  }

  return injectLogoIntoHtml(
    html,
    brand.logoSrc || brand.logoUrl || null,
    brand.companyName,
    brand.tagline
  );
}
