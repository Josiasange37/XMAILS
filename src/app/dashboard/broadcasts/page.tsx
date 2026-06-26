"use client";
import { PageTransition } from "@/components/page-transition";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import ContactSelect from "@/components/contact-select";
import {
  Megaphone, Sparkles, Send, Loader2, Upload, X, FileText, FileImage, File,
  Trash2, ChevronDown, ChevronUp, Eye
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function BroadcastsPage() {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<{ name: string; mime: string; content: string; size: number }[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [campaignName, setCampaignName] = useState("");
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
    fetch("/api/broadcasts")
      .then((r) => r.json())
      .then((data) => {
        setBroadcasts(Array.isArray(data) ? data : []);
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
    const sampleContext = c
      ? `This email will be sent to multiple contacts. Use "${sampleName}" as a sample recipient for personalization and {{first_name}} as a placeholder for contact names.\n\n`
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
    if (!result || selectedContacts.length === 0 || !campaignName.trim()) return;
    setSending(true);
    try {
      const recipients = selectedContacts.map((c: any) => ({
        email: c.email,
        first_name: c.first_name,
        last_name: c.last_name,
        company: c.company,
      }));
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName.trim(),
          subject: editSubject,
          html: editHtml,
          text: editText,
          from: "Xyberclan <noreply@xyberclan.dev>",
          sendNow: true,
          customRecipients: recipients,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      addToast({ title: `Broadcast sent to ${recipients.length} recipient(s)`, variant: "success" });
      setShowCreate(false);
      setPrompt("");
      setFiles([]);
      setSelectedContacts([]);
      setResult(null);
      setCampaignName("");
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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Broadcasts</h1>
          <p className="text-muted-foreground mt-1">
            {broadcasts.length} campaign{broadcasts.length !== 1 ? "s" : ""} sent
          </p>
        </div>
        <Button onClick={() => { setShowCreate(!showCreate); if (showCreate) { setResult(null); setPrompt(""); setFiles([]); setSelectedContacts([]); setCampaignName(""); } }}>
          {showCreate ? <ChevronUp className="h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {showCreate ? "Close" : "New Broadcast"}
        </Button>
      </div>

      {/* Create panel */}
      {showCreate && (
        <Card className="border-primary/20 shadow-md">
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left: Form */}
              <div className="lg:col-span-3 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">Create Broadcast</h2>
                  <p className="text-sm text-muted-foreground">AI generates a professional email from your description</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Campaign name</label>
                  <Input
                    placeholder="e.g. Q3 Product Launch"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">What is this broadcast about?</label>
                  <Textarea
                    placeholder="Describe the email you want. AI already knows who the recipients are."
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Recipients</label>
                  <ContactSelect
                    multiple
                    selected={selectedContacts}
                    onChange={setSelectedContacts}
                    placeholder="Search and select contacts..."
                  />
                  {selectedContacts.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedContacts.length} contact(s) selected
                      {selectedContacts.length > 0 && (
                        <> — e.g. <span className="font-medium text-foreground">
                          {[selectedContacts[0].first_name, selectedContacts[0].last_name].filter(Boolean).join(" ") || selectedContacts[0].email}
                        </span></>
                      )}
                    </p>
                  )}
                </div>

                {/* Files */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Attachments (optional)</label>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.txt" />
                  <div className="flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-sm">
                        {fileIcon(f.mime)}
                        <span className="text-foreground truncate max-w-[120px]">{f.name}</span>
                        <button onClick={() => removeFile(i)} className="hover:text-destructive ml-1"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                    {files.length < 5 && (
                      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Upload className="h-4 w-4" /> Add file
                      </button>
                    )}
                  </div>
                </div>

                <Button
                  onClick={generateEmail}
                  disabled={generating || !prompt.trim() || selectedContacts.length === 0 || !campaignName.trim()}
                  size="lg"
                  className="w-full"
                >
                  {generating ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="h-5 w-5 mr-2" />Generate Broadcast</>
                  )}
                </Button>
              </div>

              {/* Right: Preview */}
              <div className="lg:col-span-2">
                <div className="sticky top-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Preview
                  </h3>
                  {result ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Subject</label>
                        <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="text-sm font-medium" />
                      </div>
                      <iframe srcDoc={editHtml} className="w-full h-60 rounded-lg border" title="Preview" sandbox="allow-same-origin" />
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">HTML</label>
                        <Textarea value={editHtml} onChange={(e) => setEditHtml(e.target.value)} rows={6} className="text-xs font-mono" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Plain text</label>
                        <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="text-xs font-mono" />
                      </div>
                      <Button onClick={sendBroadcast} disabled={sending} className="w-full" size="lg">
                        {sending ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending to {selectedContacts.length} contact(s)...</>
                        ) : (
                          <><Send className="h-4 w-4 mr-2" />Send to {selectedContacts.length} contact(s)</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed p-8 text-center">
                      <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-2 dark:text-gray-600" />
                      <p className="text-sm text-muted-foreground">
                        {generating ? "Generating your email..." : "Generated preview will appear here"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past broadcasts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Past Campaigns</h2>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : broadcasts.length === 0 && !showCreate ? (
          <Card>
            <CardContent className="text-center py-16">
              <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
              <p className="text-muted-foreground mb-1">No broadcasts yet</p>
              <p className="text-xs text-muted-foreground mb-4">Create your first campaign to reach your audience</p>
              <Button onClick={() => setShowCreate(true)}>
                <Sparkles className="h-4 w-4 mr-2" />Create Broadcast
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {broadcasts.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-foreground truncate">{b.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      b.status === "sent" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      b.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}>{b.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {b.subject} — {b.total_sent || 0} sent, {b.total_opened || 0} opened
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(b.sent_at || b.created_at)}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </PageTransition>
  );
}
