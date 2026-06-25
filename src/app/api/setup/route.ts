import { NextResponse } from "next/server";

const SQL = `-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/addklmtbybzgbyevvdqa/sql/new

CREATE TABLE IF NOT EXISTS inbound_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT,
  text TEXT,
  attachments JSONB DEFAULT '[]',
  read BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT now()
);

-- Seed data
INSERT INTO inbound_emails (from_email, to_email, subject, html, text) VALUES
('john.doe@example.com', 'contact@xyberclan.dev', 'Partnership Inquiry', '<h1>Hello</h1><p>I would like to discuss a partnership with XYBERCLAN.</p>', 'Hello, I would like to discuss a partnership with XYBERCLAN.'),
('sarah@acme.com', 'hello@xyberclan.dev', 'Speaker Confirmation', '<h1>Confirmed</h1><p>I confirm my participation as a speaker.</p>', 'I confirm my participation as a speaker.')
ON CONFLICT DO NOTHING;

UPDATE settings SET value = '{"name":"Xyberclan","tagline":"Email Management Platform","logo_url":""}'::jsonb WHERE key = 'brand'
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`;

export async function GET() {
  return NextResponse.json({
    status: "tables_missing",
    missingTables: ["inbound_emails"],
    sql: SQL,
    supabaseSQLEditor:
      "https://supabase.com/dashboard/project/addklmtbybzgbyevvdqa/sql/new",
  });
}

export async function POST() {
  return NextResponse.json({ message: "Run SQL manually in Supabase SQL Editor" });
}
