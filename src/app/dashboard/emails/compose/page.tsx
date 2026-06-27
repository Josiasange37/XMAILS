"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Send, ArrowLeft, Save, Eye, Smartphone, Monitor, Clock, FileText } from "lucide-react";
import Link from "next/link";

const DRAFT_KEY = "compose_draft";

export default function ComposeEmailPage() {
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
    from: "Xyberclan <noreply@xyberclan.dev>",
    to: "",
    subject: "",
    html: "",
    text: "",
  });

  // Load signature
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

  // Pre-fill from searchParams (reply)
  useEffect(() => {
    const to = searchParams.get("to");
    const subject = searchParams.get("subject");
    if (to || subject) {
      setForm((prev) => ({ ...prev, to: to || prev.to, subject: subject || prev.subject }));
    }
  }, [searchParams]);

  // Load drafts
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

  // Auto-save draft every 15s
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
      // Clear auto-draft
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
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/emails">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Compose Email</h1>
            <p className="text-muted-foreground mt-1">Write and send an email</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {drafts.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowDrafts(!showDrafts)}>
              <FileText className="h-4 w-4 mr-1" />
              Drafts ({drafts.length})
            </Button>
          )}
        </div>
      </div>

      {/* Drafts sidebar */}
      {showDrafts && drafts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Save className="h-4 w-4" />
              Saved Drafts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-48 overflow-y-auto">
            {drafts.map((d: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded border hover:bg-muted/50 cursor-pointer" onClick={() => loadDraft(d)}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{d.subject || "(no subject)"}</p>
                  <p className="text-xs text-muted-foreground truncate">To: {d.to || "(no recipient)"}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteDraft(i); }} className="text-xs text-red-500 hover:underline shrink-0 ml-2">Delete</button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Input value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>To (comma separated)</Label>
                <Input placeholder="user@example.com" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>HTML Body</Label>
                <Textarea rows={10} placeholder="<h1>Hello!</h1><p>Your HTML content here...</p>" value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Plain Text (optional)</Label>
                <Textarea rows={5} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
              </div>
              {/* Scheduling */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Schedule send (optional)
                </Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div className="flex justify-between gap-2 pt-4">
                <Link href="/dashboard/emails">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? "Sending..." : scheduledAt ? "Schedule" : "Send Email"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview panel */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </CardTitle>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`p-1.5 rounded ${previewMode === "desktop" ? "bg-background shadow-sm" : ""}`}
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`p-1.5 rounded ${previewMode === "mobile" ? "bg-background shadow-sm" : ""}`}
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {form.html || form.text ? (
              <div className={`border rounded-lg overflow-hidden bg-white ${previewMode === "mobile" ? "max-w-[375px] mx-auto" : ""}`}>
                <iframe
                  srcDoc={fullHtml || `<pre style="font-family:sans-serif;padding:16px;white-space:pre-wrap">${form.text || ""}</pre>`}
                  className="w-full h-[500px] border-0"
                  title="Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground text-sm">
                Start writing to see a live preview
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
