"use client";
import { PageTransition } from "@/components/page-transition";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import ContactSelect from "@/components/contact-select";
import {
  Sparkles, Send, Loader2, Upload, X, FileText, FileImage, File,
  Trash2, Megaphone, Eye, ChevronUp, Tag
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function PromotionsPage() {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<{ name: string; mime: string; content: string; size: number }[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ subject: string; html: string; text: string } | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (result) {
      setEditSubject(result.subject);
      setEditHtml(result.html);
      setEditText(result.text);
    }
  }, [result]);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/promotions")
      .then((r) => r.json())
      .then((data) => {
        setPromotions(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded) return;
    Array.from(uploaded).forEach((file) => {
      if (files.length >= 5) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setFiles((prev) => [...prev, { name: file.name, mime: file.type, content: base64, size: file.size }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const generateEmail = async () => {
    if (!prompt.trim()) return;
    if (selectedContacts.length === 0) {
      addToast({ title: "Select at least one contact", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setResult(null);
    const c = selectedContacts[0];
    const sampleName = c ? [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email : "a contact";
    const fullPrompt = `This is a promotional email sent to multiple contacts. Use "${sampleName}" as a sample recipient. Use {{first_name}} as a placeholder for each contact's name.\n\n${prompt.trim()}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      const res = await fetch("/api/ai/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          files: files.length > 0 ? files : undefined,
          contact: selectedContacts.length === 1 ? selectedContacts[0] : null,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      let data;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        throw new Error(text ? `Server error: ${text.slice(0, 200)}` : "Could not parse server response");
      }
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setResult(data);
    } catch (err: any) {
      if (err.name === "AbortError") {
        addToast({ title: "Request timed out", variant: "destructive" });
      } else {
        addToast({ title: "AI generation failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setGenerating(false);
    }
  };

  const sendPromotion = async () => {
    if (!result || selectedContacts.length === 0) return;
    setSending(true);
    try {
      const recipients = selectedContacts.map((c: any) => ({
        email: c.email,
        first_name: c.first_name,
        last_name: c.last_name,
        company: c.company,
      }));

      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editSubject,
          html: editHtml,
          text: editText,
          from: "Xmailo <noreply@xmailo.com>",
          to: recipients,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      const sent = (data.results || []).filter((r: any) => r.status === "sent").length;
      addToast({ title: `Promotion sent to ${sent} recipient(s)`, variant: "success" });
      setShowCreate(false);
      setPrompt(""); setFiles([]); setSelectedContacts([]); setResult(null);
      fetchData();
    } catch (err: any) {
      addToast({ title: "Failed to send promotion", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const fileIcon = (mime: string) => {
    if (mime.startsWith("image/")) return <FileImage className="h-4 w-4 text-muted-foreground" />;
    if (mime.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  return (
    <PageTransition>
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Promotions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{promotions.length} campaign{promotions.length !== 1 ? "s" : ""} sent</p>
        </div>
        <Button size="sm" className="h-9 rounded-xl shadow-sm" onClick={() => { setShowCreate(!showCreate); if (showCreate) { setResult(null); setPrompt(""); setFiles([]); setSelectedContacts([]); } }}>
          {showCreate ? <ChevronUp className="h-4 w-4 mr-1.5" /> : <Tag className="h-4 w-4 mr-1.5" />}
          {showCreate ? "Close" : "New"}
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Describe your promotion</label>
                <Textarea placeholder="Describe the promotional offer. AI already knows the recipients." rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Recipients</label>
                <ContactSelect multiple selected={selectedContacts} onChange={setSelectedContacts} placeholder="Search and select contacts..." />
                {selectedContacts.length > 0 && <p className="text-xs text-muted-foreground">{selectedContacts.length} contact(s) selected</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Attachments (optional)</label>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.txt" />
                <div className="flex flex-wrap gap-1.5">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-border/40 bg-card/60 text-xs">
                      {fileIcon(f.mime)}
                      <span className="text-foreground truncate max-w-[120px]">{f.name}</span>
                      <button onClick={() => removeFile(i)} className="hover:text-destructive ml-0.5"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  {files.length < 5 && (
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Upload className="h-3.5 w-3.5" /> Add file
                    </button>
                  )}
                </div>
              </div>
              <Button onClick={generateEmail} disabled={generating || !prompt.trim() || selectedContacts.length === 0} size="lg" className="w-full rounded-xl shadow-sm">
                {generating ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-5 w-5 mr-2" />Generate Promotion</>}
              </Button>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-6">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-3"><Eye className="h-3.5 w-3.5" />Preview</span>
                {result ? (
                  <div className="space-y-4">
                    <div><label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Subject</label><Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="text-sm font-medium rounded-xl h-9" /></div>
                    <iframe srcDoc={editHtml} className="w-full h-48 rounded-xl border border-border/40" title="Preview" sandbox="allow-same-origin" />
                    <div><label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">HTML</label><Textarea value={editHtml} onChange={(e) => setEditHtml(e.target.value)} rows={4} className="text-xs font-mono rounded-xl" /></div>
                    <div><label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Plain text</label><Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} className="text-xs font-mono rounded-xl" /></div>
                    <Button onClick={sendPromotion} disabled={sending} className="w-full rounded-xl shadow-sm" size="lg">
                      {sending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Sending to {selectedContacts.length} contact(s)...</> : <><Send className="h-4 w-4 mr-1.5" />Send to {selectedContacts.length} contact(s)</>}
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-border/40 p-8 text-center">
                    <Tag className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{generating ? "Generating..." : "Preview will appear here"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground/80">Past Promotions</h2>
        {loading ? <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
        : promotions.length === 0 && !showCreate ? (
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm text-center py-12">
            <Tag className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No promotions yet</p>
            <Button size="sm" className="h-9 rounded-xl shadow-sm" onClick={() => setShowCreate(true)}><Sparkles className="h-4 w-4 mr-1.5" />Create</Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="p-2 space-y-1">
              {promotions.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0"><Tag className="h-4 w-4 text-rose-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.status} · To: {p.to}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatDateTime(p.sentAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </PageTransition>
  );
}
