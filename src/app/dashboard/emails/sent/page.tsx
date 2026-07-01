"use client";
import { PageTransition } from "@/components/page-transition";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import ContactSelect from "@/components/contact-select";
import {
  Sparkles, Send, Loader2, Upload, X, FileText, Trash2, History,
  ChevronDown, ChevronRight, Monitor, Smartphone, Copy, RotateCcw,
  Image as FileImage, File, Plus, Search, ArrowLeft
} from "lucide-react";
import Link from "next/link";

const PROMPT_HISTORY_KEY = "sent_prompt_history";

interface PromptEntry {
  id: string;
  prompt: string;
  subject: string;
  html: string;
  text: string;
  recipientName: string;
  recipientEmail: string;
  timestamp: number;
}

export default function SentPage() {
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

  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [promptHistory, setPromptHistory] = useState<PromptEntry[]>([]);

  useEffect(() => {
    if (result) {
      setEditSubject(result.subject);
      setEditHtml(result.html);
      setEditText(result.text);
    }
  }, [result]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROMPT_HISTORY_KEY);
      if (stored) setPromptHistory(JSON.parse(stored).slice(0, 50));
    } catch {}
  }, []);

  const saveToHistory = (entry: PromptEntry) => {
    const updated = [entry, ...promptHistory].slice(0, 50);
    setPromptHistory(updated);
    try { localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(updated)); } catch {}
  };

  const deleteHistoryEntry = (id: string) => {
    const updated = promptHistory.filter((e) => e.id !== id);
    setPromptHistory(updated);
    try { localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(updated)); } catch {}
  };

  const usePromptFromHistory = (entry: PromptEntry) => {
    setPrompt(entry.prompt);
    setResult({ subject: entry.subject, html: entry.html, text: entry.text });
    setEditSubject(entry.subject);
    setEditHtml(entry.html);
    setEditText(entry.text);
    setShowHistory(false);
  };

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
      addToast({ title: "Select a contact first", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setResult(null);
    const c = selectedContacts[0];
    const recipientName = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email;
    const fullPrompt = `Write an email to ${recipientName}${c.company ? ` at ${c.company}` : ""} (${c.email}).\n\n${prompt.trim()}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      const res = await fetch("/api/ai/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          files: files.length > 0 ? files : undefined,
          contact: c,
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
      saveToHistory({
        id: crypto.randomUUID?.() || Date.now().toString(),
        prompt: prompt.trim(),
        subject: data.subject,
        html: data.html,
        text: data.text,
        recipientName,
        recipientEmail: c.email,
        timestamp: Date.now(),
      });
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
      const contact = selectedContacts[0];
      const toEmail = contact.email;
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Xmailo <noreply@xmailo.com>",
          to: [toEmail],
          subject: editSubject,
          html: editHtml,
          text: editText,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      addToast({ title: "Email sent to " + toEmail, variant: "success" });
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

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const filteredHistory = promptHistory.filter(
    (e) =>
      e.prompt.toLowerCase().includes(historySearch.toLowerCase()) ||
      e.subject.toLowerCase().includes(historySearch.toLowerCase()) ||
      e.recipientName.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <PageTransition>
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/emails">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">AI Composer</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Describe the email, AI generates it</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className={cn("h-9 rounded-xl", showHistory && "bg-primary/10")} onClick={() => setShowHistory(!showHistory)}>
          <History className="h-4 w-4 mr-1.5" />History{promptHistory.length > 0 && <span className="ml-1.5 text-xs text-muted-foreground">({promptHistory.length})</span>}
        </Button>
      </div>

      {showHistory && (
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input placeholder="Search prompts, subjects, recipients..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="rounded-xl h-9 pl-9" />
            </div>
            {filteredHistory.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">{historySearch ? "No matching prompts" : "No prompt history yet"}</p>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {filteredHistory.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(entry.timestamp)}</span><span>→</span><span className="truncate">{entry.recipientName}</span>
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">{entry.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{entry.prompt}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => { navigator.clipboard.writeText(entry.prompt); addToast({ title: "Prompt copied", variant: "success" }); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Copy className="h-3.5 w-3.5" /></button>
                      <button onClick={() => usePromptFromHistory(entry)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><RotateCcw className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteHistoryEntry(entry.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Recipient</label>
              <ContactSelect selected={selectedContacts} onChange={setSelectedContacts} placeholder="Search and select a contact..." />
              {selectedContacts.length > 0 && (
                <p className="text-xs text-muted-foreground">To: <span className="font-medium text-foreground">{[selectedContacts[0].first_name, selectedContacts[0].last_name].filter(Boolean).join(" ") || selectedContacts[0].email}</span> — {selectedContacts[0].email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">What should this email say?</label>
              <Textarea placeholder="Describe the email content. AI will personalize it for the recipient." rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="rounded-xl" />
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
                <p className="text-xs text-muted-foreground mt-1">{generating ? "This may take up to a minute" : "Describe your email and click Generate"}</p>
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
                    {sending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Sending...</> : <><Send className="h-4 w-4 mr-1.5" />Send to {selectedContacts[0]?.email}</>}
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
