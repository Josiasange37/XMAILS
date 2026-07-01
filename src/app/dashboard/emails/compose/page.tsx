"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Send, ArrowLeft, Save, Eye, Smartphone, Monitor, Clock, FileText, X } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/page-transition";

const DRAFT_KEY = "compose_draft";

function ComposeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showDrafts, setShowDrafts] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const [form, setForm] = useState({
    from: "Xmailo <noreply@xmailo.com>",
    to: "",
    subject: "",
    html: "",
    text: "",
  });

  useEffect(() => {
    fetch("/api/settings/signature")
      .then((r) => r.json())
      .then((d) => {
        if (d.signature_name) {
          setSignature(`\n\n--\n${d.signature_name}\n${d.signature_title || ""}${d.signature_company ? `, ${d.signature_company}` : ""}`);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const to = searchParams.get("to");
    const subject = searchParams.get("subject");
    if (to || subject) {
      setForm((prev) => ({ ...prev, to: to || prev.to, subject: subject || prev.subject }));
    }
  }, [searchParams]);

  const loadDrafts = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setDrafts(Array.isArray(parsed) ? parsed : [parsed]);
      }
    } catch {}
  };

  useEffect(() => { loadDrafts(); }, []);

  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (form.to || form.subject || form.html) {
        try {
          const existing = JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]");
          const arr = Array.isArray(existing) ? existing : [existing];
          const now = Date.now();
          const idx = arr.findIndex((d: any) => d.auto);
          const entry = { ...form, auto: true, savedAt: now };
          if (idx >= 0) arr[idx] = entry;
          else arr.unshift(entry);
          localStorage.setItem(DRAFT_KEY, JSON.stringify(arr.slice(0, 10)));
          loadDrafts();
        } catch {}
      }
    }, 15000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.to || !form.subject) {
      addToast({ title: "Error", description: "To and Subject are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const body: any = {
        ...form,
        to: form.to.split(",").map((s) => s.trim()),
        html: form.html + signature,
        text: form.text + signature,
      };
      if (scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString();

      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to send");
      addToast({ title: scheduledAt ? "Email scheduled" : "Email sent successfully", variant: "success" });
      try {
        const existing = JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]");
        const arr = Array.isArray(existing) ? existing : [];
        localStorage.setItem(DRAFT_KEY, JSON.stringify(arr.filter((d: any) => !d.auto)));
      } catch {}
      router.push("/dashboard/emails");
    } catch {
      addToast({ title: "Failed to send email", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = (d: any) => {
    setForm({ from: d.from || form.from, to: d.to || "", subject: d.subject || "", html: d.html || "", text: d.text || "" });
    setShowDrafts(false);
    addToast({ title: "Draft loaded" });
  };

  const deleteDraft = (idx: number) => {
    try {
      const existing = JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]");
      const arr = Array.isArray(existing) ? existing : [];
      arr.splice(idx, 1);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(arr));
      loadDrafts();
    } catch {}
  };

  const fullHtml = form.html + signature;

  return (
    <PageTransition>
      <div className="max-w-6xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/emails">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-[28px] font-bold tracking-tight">Compose</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Write and send an email</p>
            </div>
          </div>
          {drafts.length > 0 && (
            <Button variant="ghost" size="sm" className="h-9 rounded-xl" onClick={() => setShowDrafts(!showDrafts)}>
              <FileText className="h-4 w-4 mr-1.5" />Drafts ({drafts.length})
            </Button>
          )}
        </div>

        {showDrafts && drafts.length > 0 && (
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
              {drafts.map((d: any, i: number) => (
                <div key={i} onClick={() => loadDraft(d)} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{d.subject || "(no subject)"}</p>
                    <p className="text-xs text-muted-foreground truncate">To: {d.to || "(no recipient)"}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteDraft(i); }} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 shrink-0 ml-2"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">From</Label><Input value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className="rounded-xl h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">To (comma separated)</Label><Input placeholder="user@example.com" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className="rounded-xl h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="rounded-xl h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">HTML Body</Label><Textarea rows={8} placeholder="<h1>Hello!</h1><p>Your HTML content here...</p>" value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Plain Text (optional)</Label><Textarea rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Schedule send (optional)</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="rounded-xl h-9" />
              </div>
              <div className="flex justify-between gap-2 pt-2">
                <Link href="/dashboard/emails"><Button variant="ghost" type="button" className="rounded-xl">Cancel</Button></Link>
                <Button type="submit" disabled={loading} className="rounded-xl shadow-sm">
                  <Send className="h-4 w-4 mr-1.5" />{loading ? "Sending..." : scheduledAt ? "Schedule" : "Send"}
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />Preview</span>
              <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5">
                <button onClick={() => setPreviewMode("desktop")} className={`p-1.5 rounded ${previewMode === "desktop" ? "bg-background shadow-sm" : ""}`}><Monitor className="h-3.5 w-3.5" /></button>
                <button onClick={() => setPreviewMode("mobile")} className={`p-1.5 rounded ${previewMode === "mobile" ? "bg-background shadow-sm" : ""}`}><Smartphone className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="p-5 pt-2">
              {form.html || form.text ? (
                <div className={`rounded-xl overflow-hidden bg-white border border-border/40 ${previewMode === "mobile" ? "max-w-[375px] mx-auto" : ""}`}>
                  <iframe srcDoc={fullHtml || `<pre style="font-family:sans-serif;padding:16px;white-space:pre-wrap">${form.text || ""}</pre>`} className="w-full h-[500px] border-0" title="Preview" sandbox="allow-same-origin" />
                </div>
              ) : (
                <div className="h-[500px] flex items-center justify-center text-sm text-muted-foreground">Start writing to see a live preview</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function ComposeEmailPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="h-64" />;
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <ComposeForm />
    </Suspense>
  );
}
