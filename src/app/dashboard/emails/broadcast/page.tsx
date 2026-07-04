"use client";
import { PageTransition } from "@/components/page-transition";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import ContactSelect from "@/components/contact-select";
import {
  Sparkles, Send, Loader2, Upload, X, FileText, Trash2, History,
  ChevronDown, ChevronRight, Monitor, Smartphone, Copy, RotateCcw,
  Image as FileImage, File, Plus, Search, ArrowLeft, Users
} from "lucide-react";
import Link from "next/link";

export default function BroadcastSentPage() {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<{ name: string; mime: string; content: string; size: number }[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ subject: string; html: string; text: string } | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [editText, setEditText] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showFiles, setShowFiles] = useState(false);
  const [previewTab, setPreviewTab] = useState<"preview" | "html" | "text">("preview");

  useEffect(() => {
    if (result) {
      setEditSubject(result.subject);
      setEditHtml(result.html);
      setEditText(result.text);
    }
  }, [result]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded) return;
    Array.from(uploaded).forEach((file) => {
      if (files.length + Array.from(uploaded).indexOf(file) >= 5) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setFiles((prev) => [
          ...prev,
          { name: file.name, mime: file.type, content: base64, size: file.size },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

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
    const sampleContext = c
      ? `This email will be sent to ${selectedContacts.length} contacts. Use "${sampleName}" as a sample recipient and {{first_name}} as a placeholder for personalization.\n\n`
      : "";
    const fullPrompt = sampleContext + prompt.trim();
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
        throw new Error(text ? `Server error: ${text.slice(0, 200)}` : "Could not parse server response (server may be restarting)");
      }
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setResult(data);
    } catch (err: any) {
      if (err.name === "AbortError") {
        addToast({ title: "Request timed out", description: "AI generation took too long. Try again.", variant: "destructive" });
      } else {
        addToast({ title: "AI generation failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!result || selectedContacts.length === 0) return;
    setSending(true);
    try {
      const toEmails = selectedContacts.map((c: any) => c.email);
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Xmailo <noreply@xmailo.com>",
          to: toEmails,
          subject: editSubject,
          html: editHtml,
          text: editText,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      addToast({ title: `Email sent to ${selectedContacts.length} recipient(s)`, variant: "success" });
      setResult(null);
      setPrompt("");
      setFiles([]);
      setSelectedContacts([]);
    } catch {
      addToast({ title: "Failed to send", variant: "destructive" });
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/emails">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Broadcast Send</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Send the same email to multiple contacts at once</p>
          </div>
        </div>
        {selectedContacts.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-sm font-medium">
            <Users className="h-4 w-4" />
            {selectedContacts.length} selected
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Recipients</label>
              <ContactSelect multiple selected={selectedContacts} onChange={setSelectedContacts} placeholder="Search and select contacts..." />
              {selectedContacts.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedContacts.map((c: any) => (
                    <span key={c.id} className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                      {c.first_name || c.last_name ? `${c.first_name || ""} ${c.last_name || ""}`.trim() : c.email}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">What should this email say?</label>
              <Textarea placeholder="Describe the email content. AI will generate it for all recipients." rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <button onClick={() => setShowFiles(!showFiles)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {showFiles ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                <Upload className="h-3.5 w-3.5" />Attachments{files.length > 0 && <span className="text-primary font-medium"> ({files.length})</span>}
              </button>
              {showFiles && (
                <div className="mt-2 space-y-2">
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer hover:bg-muted/40 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Click to upload images, PDFs, or documents</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Max 5 files</p>
                  </div>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.txt" />
                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-border/40 bg-card/60 text-xs">
                          {fileIcon(f.mime)}
                          <span className="text-foreground truncate max-w-[100px]">{f.name}</span>
                          <button onClick={() => removeFile(i)} className="hover:text-destructive ml-0.5"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button onClick={generateEmail} disabled={generating || !prompt.trim() || selectedContacts.length === 0} className="w-full rounded-xl shadow-sm" size="lg">
              {generating ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-5 w-5 mr-2" />Generate Email</>}
            </Button>
          </div>
        </div>

        <div className="xl:col-span-3">
          <div className="sticky top-6 rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
            {!result ? (
              <div className="text-center py-16 px-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted/60 mb-4"><Sparkles className="h-7 w-7 text-muted-foreground/40" /></div>
                <p className="text-sm text-muted-foreground">{generating ? "Generating your email..." : "Your email preview will appear here"}</p>
                <p className="text-xs text-muted-foreground mt-1">{generating ? "This may take up to a minute" : "Select contacts, describe your email, and click Generate"}</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Subject</label>
                  <div className="relative">
                    <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="text-sm font-medium rounded-xl h-9 pr-8" />
                    <button onClick={() => { navigator.clipboard.writeText(editSubject); addToast({ title: "Subject copied", variant: "success" }); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><Copy className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5">
                    {(["preview", "html", "text"] as const).map((tab) => (
                      <button key={tab} onClick={() => setPreviewTab(tab)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${previewTab === tab ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                  {previewTab === "preview" && (
                    <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5">
                      <button onClick={() => setPreviewMode("desktop")} className={`p-1.5 rounded-md transition-colors ${previewMode === "desktop" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Monitor className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setPreviewMode("mobile")} className={`p-1.5 rounded-md transition-colors ${previewMode === "mobile" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Smartphone className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-border/40 overflow-hidden">
                  {previewTab === "preview" ? (
                    <div className={previewMode === "mobile" ? "mx-auto max-w-[375px]" : "w-full"}>
                      <iframe srcDoc={editHtml} className={`w-full border-0 ${previewMode === "mobile" ? "h-[500px]" : "h-[350px]"}`} title="Email preview" sandbox="allow-same-origin" />
                    </div>
                  ) : previewTab === "html" ? (
                    <Textarea value={editHtml} onChange={(e) => setEditHtml(e.target.value)} rows={12} className="text-xs font-mono border-0 rounded-none resize-y" />
                  ) : (
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={8} className="text-xs font-mono border-0 rounded-none resize-y" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={sendEmail} disabled={sending || selectedContacts.length === 0} className="flex-1 rounded-xl shadow-sm">
                    {sending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Sending to {selectedContacts.length} contact(s)...</> : <><Send className="h-4 w-4 mr-1.5" />Send to {selectedContacts.length} contact(s)</>}
                  </Button>
                  <Button variant="ghost" onClick={() => setResult(null)} disabled={sending} className="rounded-xl"><Trash2 className="h-4 w-4 mr-1.5" />Discard</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </PageTransition>
  );
}
