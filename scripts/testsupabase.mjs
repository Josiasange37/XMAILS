import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jgisgrkbrxyuebjdunpr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnaXNncmticnh5ZXViamR1bnByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI0ODcxOCwiZXhwIjoyMDk3ODI0NzE4fQ.X-d3f9IlGuRz0_Jd7Wk3QZ1xNCSRY7XFHyLCBZXasQo"
);

try {
  const { data, error } = await supabase.from("contacts").select("*").limit(1);
  console.log("contacts query:", JSON.stringify(data), JSON.stringify(error));
} catch (e) {
  console.log("error:", e.message);
}
process.exit(0);
