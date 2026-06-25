"use client";
import { PageTransition } from "@/components/page-transition";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import ContactSelect from "@/components/contact-select";
import {
  Sparkles,
  Send,
  Loader2,
  Upload,
  X,
  FileText,
  Image as FileImage,
  File,
  Trash2,
} from "lucide-react";

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

  useEffect(() => {
    if (result) {
      setEditSubject(result.subject);
      setEditHtml(result.html);
      setEditText(result.text);
    }
  }, [result]);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
      const timeout = setTimeout(() => controller.abort(), 60000);
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
          from: "Xyberclan <noreply@xyberclan.dev>",
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

  const loadHistory = () => {
    setHistoryLoading(true);
    setShowHistory(!showHistory);
    if (!showHistory) {
      fetch("/api/emails?status=sent")
        .then((r) => r.json())
        .then((data) => { setHistory(data.emails || []); setHistoryLoading(false); })
        .catch(() => setHistoryLoading(false));
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
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      {/* AI Compose Panel */}
      <div className="xl:col-span-3 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Email Composer</h1>
          <p className="text-muted-foreground mt-1">Describe the email you want, AI generates it</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Prompt */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">What email do you want to send?</label>
              <Textarea
                placeholder="Describe what the email should say. No need to mention the recipient — AI already knows who they are."
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Reference files (optional)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Click to upload images, PDFs, or documents</p>
                <p className="text-xs text-muted-foreground mt-0.5">Max 5 files</p>
              </div>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.txt" />
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card text-sm">
                      {fileIcon(f.mime)}
                      <span className="text-foreground truncate max-w-[120px]">{f.name}</span>
                      <span className="text-xs text-muted-foreground">({formatSize(f.size)})</span>
                      <button onClick={() => removeFile(i)} className="hover:text-destructive ml-1">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Recipient</label>
              <ContactSelect
                selected={selectedContacts}
                onChange={setSelectedContacts}
                placeholder="Search and select a contact..."
              />
              {selectedContacts.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  AI will address: <span className="font-medium text-foreground">
                    {[selectedContacts[0].first_name, selectedContacts[0].last_name].filter(Boolean).join(" ") || selectedContacts[0].email}
                  </span>
                </p>
              )}
            </div>

            {/* Generate button */}
            <Button
              onClick={generateEmail}
              disabled={generating || !prompt.trim() || selectedContacts.length === 0}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating email...</>
              ) : (
                <><Sparkles className="h-5 w-5 mr-2" />Generate Email</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Send History */}
        <div>
          <Button variant="outline" onClick={loadHistory} className="w-full">
            {showHistory ? "Hide" : "Show"} Sent History
          </Button>
          {showHistory && (
            <Card className="mt-3">
              <CardContent className="p-4 max-h-60 overflow-y-auto">
                {historyLoading ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">Loading...</div>
                ) : history.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">No sent emails yet</div>
                ) : (
                  <div className="space-y-2">
                    {history.map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{e.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            To: {Array.isArray(e.to) ? e.to.join(", ") : e.to}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(e.sentAt || e.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview Panel */}
      <div className="xl:col-span-2">
        <div className="sticky top-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Preview</h2>
            <p className="text-sm text-muted-foreground">AI-generated email preview</p>
          </div>

          <Card>
            <CardContent className="p-4">
              {!result ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
                  <p className="text-sm text-muted-foreground">
                    {generating ? "Generating..." : "Your email will appear here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Subject</label>
                    <Input
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="text-sm font-medium"
                    />
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 border-b flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Email body (preview)</p>
                    </div>
                    <iframe
                      srcDoc={editHtml}
                      className="w-full h-[300px]"
                      title="Email preview"
                      sandbox="allow-same-origin"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">HTML</label>
                    <Textarea
                      value={editHtml}
                      onChange={(e) => setEditHtml(e.target.value)}
                      rows={8}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Plain text</label>
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={4}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={sendEmail} disabled={sending || selectedContacts.length === 0} className="flex-1">
                      {sending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                      ) : (
                        <><Send className="h-4 w-4 mr-2" />Send to {selectedContacts[0]?.email}</>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setResult(null)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </PageTransition>
  );
}
