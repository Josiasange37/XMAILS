"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Database, Copy, ExternalLink, Loader2 } from "lucide-react";

export default function SetupPage() {
  const [status, setStatus] = useState<Record<string, "checking" | "exists" | "missing">>({});
  const [copied, setCopied] = useState(false);
  const [inserting, setInserting] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const tables = ["contacts", "emails", "broadcasts", "inbound_emails", "settings"];

  const checkTable = async (table: string) => {
    setStatus((s) => ({ ...s, [table]: "checking" }));
    try {
      const res = await fetch(`/api/setup/check?table=${table}`);
      const data = await res.json();
      setStatus((s) => ({ ...s, [table]: data.exists ? "exists" : "missing" }));
    } catch {
      setStatus((s) => ({ ...s, [table]: "missing" }));
    }
  };

  const checkAll = () => tables.forEach(checkTable);

  useEffect(() => { checkAll(); }, []);

  const sql = `CREATE TABLE IF NOT EXISTS inbound_emails (
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

INSERT INTO inbound_emails (from_email, to_email, subject, html, text) VALUES
('john.doe@example.com', 'contact@xyberclan.dev', 'Partnership Inquiry', '<h1>Hello</h1><p>I would like to discuss a partnership with XYBERCLAN.</p>', 'Hello, I would like to discuss a partnership with XYBERCLAN.'),
('sarah@acme.com', 'hello@xyberclan.dev', 'Speaker Confirmation', '<h1>Confirmed</h1><p>I confirm my participation as a speaker.</p>', 'I confirm my participation as a speaker.')
ON CONFLICT DO NOTHING;`;

  const copySQL = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertSeed = async () => {
    setInserting(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/setup/seed", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setSeedResult(`Error: ${data.error}`);
      } else {
        setSeedResult(`Inserted ${data.count} sample inbound emails!`);
        checkTable("inbound_emails");
      }
    } catch (e) {
      setSeedResult(`Error: ${e}`);
    }
    setInserting(false);
  };

  const allExist = tables.every((t) => status[t] === "exists");
  const anyMissing = tables.some((t) => status[t] === "missing");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Setup &amp; Diagnostics</h1>
        <p className="text-muted-foreground mt-1">Verify your Supabase database tables and seed test data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Tables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tables.map((table) => (
              <div key={table} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <span className="font-mono text-sm">{table}</span>
                {status[table] === "checking" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : status[table] === "exists" ? (
                  <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Exists</Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Missing</Badge>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={checkAll}>
              Refresh Status
            </Button>
            {anyMissing && (
              <a
                href="https://supabase.com/dashboard/project/addklmtbybzgbyevvdqa/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 rounded-md px-3 bg-accent text-accent-foreground hover:opacity-90 shadow dark:bg-accent dark:hover:opacity-90"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open Supabase SQL Editor
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {anyMissing && (
        <Card>
          <CardHeader>
            <CardTitle>Required SQL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy and paste this SQL into the Supabase SQL Editor, then click <strong>Run</strong>.
            </p>
            <pre className="p-4 rounded-lg bg-gray-900 text-gray-100 text-sm overflow-x-auto whitespace-pre-wrap">{sql}</pre>
            <div className="flex gap-2">
              <Button onClick={copySQL}>
                {copied ? "Copied!" : <><Copy className="h-4 w-4 mr-1" /> Copy SQL</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {allExist && (
        <Card>
          <CardHeader>
            <CardTitle>Seed Test Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Insert sample inbound emails so you can test the Inbox feature right away.
            </p>
            <Button onClick={insertSeed} disabled={inserting}>
              {inserting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Database className="h-4 w-4 mr-1" />}
              Insert Sample Data
            </Button>
            {seedResult && (
              <p className={`text-sm ${seedResult.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>
                {seedResult}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
