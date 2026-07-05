"use client";
import { PageTransition } from "@/components/page-transition";
import { useState, useRef, useEffect, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Megaphone, Sparkles, Send, Loader2, Upload, X, FileText, Trash2,
  ChevronDown, ChevronRight, Monitor, Smartphone, Copy, RotateCcw,
  Image as FileImage, File, Brain, Users, History,
  CheckCircle2, Circle
} from "lucide-react";
import ContactSelect from "@/components/contact-select";
import { formatDateTime } from "@/lib/utils";

export default function BroadcastsPage() {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactCount, setContactCount] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const [recipientMode, setRecipientMode] = useState<"all" | "select">("all");
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<{ name: string; mime: string; content: string; size: number }[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ subject: string; html: string; text: string } | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [editText, setEditText] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewTab, setPreviewTab] = useState<"preview" | "html" | "text">("preview");
  const [showFiles, setShowFiles] = useState(false);
  const [analyticsBroadcast, setAnalyticsBroadcast] = useState<any>(null);

  const [models, setModels] = useState<{ id: string; label: string; provider: string; group: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);

  const groupedModels = useMemo(() => {
    const map = new Map<string, typeof models>();
    for (const m of models) {
      const g = map.get(m.group) || [];
      g.push(m);
      map.set(m.group, g);
    }
    return Array.from(map.entries()).map(([group, models]) => ({ group, models }));
  }, [models]);

  useEffect(() => {
    fetch("/api/ai/models").then((r) => r.json()).then((d) => {
      if (d.models?.length) {
        setModels(d.models);
        if (!selectedModel) setSelectedModel(d.models[0].id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (result) {
      setEditSubject(result.subject);
      setEditHtml(result.html);
      setEditText(result.text);
    }
  }, [result]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/broadcasts").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()).catch(() => ({ contacts: [] })),
    ]).then(([broadcastsData, contactsData]) => {
      setBroadcasts(Array.isArray(broadcastsData) ? broadcastsData : []);
      setContactCount(contactsData?.contacts?.length || 0);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

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

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const generateEmail = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      const res = await fetch("/api/ai/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `This is a broadcast to all contacts. Do NOT use [[first_name]] placeholders — generate a single email that works for everyone.\n\n${prompt.trim()}`,
          files: files.length > 0 ? files : undefined,
          model: selectedModel,
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
        addToast({ title: "Request timed out", description: "AI generation took too long. Try again.", variant: "destructive" });
      } else {
        addToast({ title: "AI generation failed", description: err.message, variant: "destructive" });
      }
    } finally {
      setGenerating(false);
    }
  };

  const sendBroadcast = async () => {
    if (!result || !campaignName.trim()) return;
    if (recipientMode === "select" && selectedContacts.length === 0) {
      addToast({ title: "Select at least one contact", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const body: any = {
        name: campaignName.trim(),
        subject: editSubject,
        html: editHtml,
        text: editText,
        from: "Xyberclan <hello@xyberclan.dev>",
        sendNow: true,
      };
      if (recipientMode === "select") {
        body.customRecipients = selectedContacts.map((c: any) => ({
          email: c.email,
          first_name: c.first_name,
          last_name: c.last_name,
          company: c.company,
        }));
      }
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      const recipientLabel = recipientMode === "all" ? `all ${contactCount} contacts` : `${selectedContacts.length} contact(s)`;
      addToast({ title: `Broadcast sent to ${recipientLabel}`, variant: "success" });
      setShowCreate(false);
      setPrompt(""); setFiles([]); setResult(null); setCampaignName(""); setSelectedContacts([]);
      fetchData();
    } catch (err: any) {
      addToast({ title: "Failed to send broadcast", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/broadcasts/${id}`, { method: "DELETE" });
    addToast({ title: "Broadcast deleted", variant: "success" });
    fetchData();
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
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Broadcasts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{broadcasts.length} campaign{broadcasts.length !== 1 ? "s" : ""} sent</p>
          </div>
        </div>
        <Button size="sm" className="h-9 rounded-xl shadow-sm" onClick={() => { setShowCreate(!showCreate); if (showCreate) { setResult(null); setPrompt(""); setFiles([]); setCampaignName(""); setSelectedContacts([]); } }}>
          <Sparkles className="h-4 w-4 mr-1.5" />{showCreate ? "Close" : "New Broadcast"}
        </Button>
      </div>

      {showCreate && (
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Campaign name</label>
              <Input placeholder="e.g. Product Update — July 2026" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="rounded-xl h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Recipients</label>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => { setRecipientMode("all"); setSelectedContacts([]); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    recipientMode === "all"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {recipientMode === "all" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                  All contacts ({contactCount})
                </button>
                <button
                  onClick={() => setRecipientMode("select")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    recipientMode === "select"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {recipientMode === "select" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                  Select specific
                </button>
              </div>
              {recipientMode === "all" ? (
                <div className="flex items-center gap-2 h-9 rounded-xl border border-border/40 bg-muted/30 px-3 text-xs">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground">Everyone in your contact list</span>
                  <span className="text-muted-foreground">({contactCount})</span>
                </div>
              ) : (
                <ContactSelect multiple selected={selectedContacts} onChange={setSelectedContacts} placeholder="Search and select contacts..." />
              )}
              {recipientMode === "select" && selectedContacts.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedContacts.length} contact(s) selected</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">AI Model</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="flex items-center gap-2 w-full h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors hover:bg-muted/40"
                >
                  <Brain className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left truncate">
                    {models.find((m) => m.id === selectedModel)?.label?.replace(/[⭐].*$/, "").trim() || "Select a model..."}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
                {showModelPicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
                    <div className="absolute z-50 top-full mt-1 left-0 right-0 max-h-72 overflow-y-auto rounded-xl border border-border bg-card shadow-lg backdrop-blur-xl">
                      {groupedModels.map((group) => (
                        <div key={group.group}>
                          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 sticky top-0">
                            {group.group}
                          </div>
                          {group.models.map((m) => {
                            const isBest = m.label.includes("⭐ Best for emails") || m.label.includes("⭐ Fast + quality");
                            const isSelected = m.id === selectedModel;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                                  isSelected
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "hover:bg-muted/40 text-foreground"
                                }`}
                              >
                                <span className="flex-1 truncate">{m.label}</span>
                                {isBest && <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">Best for emails</span>}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">What should this broadcast say?</label>
              <Textarea placeholder="Describe the email for all your contacts. No placeholders needed — it's a single message for everyone." rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="rounded-xl" />
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
            <Button onClick={generateEmail} disabled={generating || !prompt.trim() || !campaignName.trim()} className="w-full rounded-xl shadow-sm" size="lg">
              {generating ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-5 w-5 mr-2" />Generate Broadcast</>}
            </Button>
          </div>
        </div>

        <div className="xl:col-span-3">
          <div className="sticky top-6 rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
            {!result ? (
              <div className="text-center py-16 px-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted/60 mb-4"><Sparkles className="h-7 w-7 text-muted-foreground/40" /></div>
                <p className="text-sm text-muted-foreground">{generating ? "Generating your broadcast..." : "Your broadcast preview will appear here"}</p>
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
                  <Button onClick={sendBroadcast} disabled={sending || !campaignName.trim()} className="flex-1 rounded-xl shadow-sm">
                    {sending
                      ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Sending to {recipientMode === "all" ? contactCount : selectedContacts.length} contact(s)...</>
                      : <><Send className="h-4 w-4 mr-1.5" />Send to {recipientMode === "all" ? `All Contacts (${contactCount})` : `${selectedContacts.length} Selected`}</>}
                  </Button>
                  <Button variant="ghost" onClick={() => setResult(null)} disabled={sending} className="rounded-xl"><Trash2 className="h-4 w-4 mr-1.5" />Discard</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground/80 flex items-center gap-1.5"><History className="h-4 w-4" />Past Campaigns</h2>
        {loading ? (
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm text-center py-12 text-sm text-muted-foreground">Loading...</div>
        ) : broadcasts.length === 0 && !showCreate ? (
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm text-center py-12">
            <Megaphone className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No broadcasts yet</p>
            <p className="text-xs text-muted-foreground mb-4">Create your first campaign to reach all your contacts</p>
            <Button size="sm" className="h-9 rounded-xl shadow-sm" onClick={() => setShowCreate(true)}><Sparkles className="h-4 w-4 mr-1.5" />Create</Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="p-2 space-y-1">
              {broadcasts.map((b: any) => (
                <button key={b.id} onClick={() => setAnalyticsBroadcast(b)} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Megaphone className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                        b.status === "sent" ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" :
                        b.status === "failed" ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
                        "bg-muted/60 text-muted-foreground"
                      }`}>{b.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{b.subject} — {b.total_sent || 0} sent, {b.total_opened || 0} opened</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{formatDateTime(b.sent_at || b.created_at)}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!analyticsBroadcast} onOpenChange={() => setAnalyticsBroadcast(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{analyticsBroadcast?.name || "Campaign Analytics"}</DialogTitle></DialogHeader>
          {analyticsBroadcast && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{analyticsBroadcast.subject}</p>
              <div className="grid grid-cols-2 gap-3">
                {[{ label: "Sent", value: analyticsBroadcast.total_sent || 0 }, { label: "Opened", value: analyticsBroadcast.total_opened || 0 },
                  { label: "Clicked", value: analyticsBroadcast.total_clicked || 0 },
                  { label: "Open Rate", value: analyticsBroadcast.total_sent > 0 ? `${Math.round((analyticsBroadcast.total_opened / analyticsBroadcast.total_sent) * 100)}%` : "—" },
                ].map((m) => (
                  <div key={m.label} className="p-3 rounded-xl bg-muted/40 text-center">
                    <p className="text-xl font-bold tracking-tight">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
              {analyticsBroadcast.sent_at && <p className="text-[10px] text-muted-foreground">Sent: {formatDateTime(analyticsBroadcast.sent_at)}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </PageTransition>
  );
}
