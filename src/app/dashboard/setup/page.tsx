"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, XCircle, Database, Copy, ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { PageTransition } from "@/components/page-transition";

export default function SetupPage() {
  const { addToast } = useToast();
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
('john.doe@example.com', 'contact@xmailo.com', 'Partnership Inquiry', '<h1>Hello</h1><p>I would like to discuss a partnership with XMAILO.</p>', 'Hello, I would like to discuss a partnership with XMAILO.'),
('sarah@acme.com', 'hello@xmailo.com', 'Speaker Confirmation', '<h1>Confirmed</h1><p>I confirm my participation as a speaker.</p>', 'I confirm my participation as a speaker.')
ON CONFLICT DO NOTHING;`;

  const copySQL = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    addToast({ title: "SQL copied to clipboard", variant: "success" });
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
    <PageTransition>
      <div className="space-y-5">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Setup</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Verify your Supabase database tables and seed test data</p>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5 text-foreground/60" />
            <h2 className="text-base font-semibold tracking-tight">Database Tables</h2>
          </div>
          <div className="space-y-1.5">
            {tables.map((table) => (
              <div key={table} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/20">
                <span className="font-mono text-sm">{table}</span>
                {status[table] === "checking" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : status[table] === "exists" ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400"><CheckCircle2 className="h-3.5 w-3.5" />Exists</span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-red-500"><XCircle className="h-3.5 w-3.5" />Missing</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="ghost" size="sm" className="h-9 rounded-xl" onClick={checkAll}><RefreshCw className="h-4 w-4 mr-1.5" />Refresh</Button>
            {anyMissing && (
              <a href="https://supabase.com/dashboard/project/addklmtbybzgbyevvdqa/sql/new" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-9 px-3 rounded-xl text-sm font-medium bg-accent text-accent-foreground hover:opacity-90 transition-colors">
                <ExternalLink className="h-4 w-4 mr-1.5" />Open Supabase SQL Editor
              </a>
            )}
          </div>
        </div>

        {anyMissing && (
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-foreground/60" />
              <h2 className="text-base font-semibold tracking-tight">Required SQL</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Copy and paste this SQL into the Supabase SQL Editor, then click <strong>Run</strong>.</p>
            <pre className="p-4 rounded-xl bg-muted/80 text-xs overflow-x-auto whitespace-pre-wrap mb-3 border border-border/40">{sql}</pre>
            <Button size="sm" className="h-9 rounded-xl shadow-sm" onClick={copySQL}><Copy className="h-4 w-4 mr-1.5" />{copied ? "Copied!" : "Copy SQL"}</Button>
          </div>
        )}

        {allExist && (
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-foreground/60" />
              <h2 className="text-base font-semibold tracking-tight">Seed Test Data</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Insert sample inbound emails so you can test the Inbox feature right away.</p>
            <Button size="sm" className="h-9 rounded-xl shadow-sm" onClick={insertSeed} disabled={inserting}>
              {inserting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Database className="h-4 w-4 mr-1.5" />}
              {inserting ? "Inserting..." : "Insert Sample Data"}
            </Button>
            {seedResult && (
              <p className={`text-xs mt-3 ${seedResult.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>{seedResult}</p>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
