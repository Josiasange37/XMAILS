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

  const name = companyName || "Xyberclan";

  const signature = `
    <div style="margin-top:32px;padding-top:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:#6b7280;">
      <img src="${logoUrl}" alt="${name}" style="width:20px;height:20px;border-radius:4px;vertical-align:middle;margin-right:6px;" />
      <span style="font-weight:600;color:#374151;">${name}</span>
      ${tagline ? `<span style="color:#9ca3af;"> &mdash; ${tagline}</span>` : ""}
    </div>
  `;

  const bodyEndMatch = html.match(/<\/body>/i);
  if (bodyEndMatch) {
    return html.replace(/<\/body>/i, `${signature}\n</body>`);
  }

  const htmlEndMatch = html.match(/<\/html>/i);
  if (htmlEndMatch) {
    return html.replace(/<\/html>/i, `${signature}\n</html>`);
  }

  return `${html}${signature}`;
}

export async function injectBranding(html?: string): Promise<string> {
  if (!html) return html || "";

  const brand = await getBrandSettings();
  if (brand.logoUrl) {
    return injectLogoIntoHtml(html, brand.logoUrl, brand.companyName, brand.tagline);
  }

  return html;
}
