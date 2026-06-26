"use client";
import { PageTransition } from "@/components/page-transition";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Inbox as InboxIcon,
  RefreshCw,
  ChevronLeft,
  Paperclip,
  Download,
  Trash2,
  Mail,
  ExternalLink,
  FileText,
  Image as FileImage,
  File,
  Archive,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Attachment {
  filename: string;
  content_type: string;
  size: number;
  index: number;
  downloadUrl: string;
}

interface InboxEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments: Attachment[];
  hasAttachments: boolean;
  attachmentCount: number;
  read: boolean;
  receivedAt: string;
}

export default function InboxPage() {
  const { addToast } = useToast();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchEmails = () => {
    setLoading(true);
    fetch("/api/inbox")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        setEmails(data.emails || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("inbox fetch error:", err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchEmails(); }, []);

  const openEmail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/inbox/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSelectedEmail(data);
    } catch {
      addToast({ title: "Failed to load email", variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  };

  const deleteEmail = async (id: string) => {
    try {
      await fetch(`/api/inbox/${id}`, { method: "DELETE" });
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedEmail(null);
      }
      fetchEmails();
      addToast({ title: "Email deleted", variant: "success" });
    } catch {
      addToast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const downloadAttachment = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      addToast({ title: "Download failed", variant: "destructive" });
    }
  };

  const fileIcon = (contentType: string) => {
    if (contentType.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
    if (contentType.includes("image")) return <FileImage className="h-4 w-4 text-muted-foreground" />;
    if (contentType.includes("word") || contentType.includes("document"))
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    if (contentType.includes("zip") || contentType.includes("rar"))
      return <Archive className="h-4 w-4 text-yellow-600" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <PageTransition>
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Email list */}
      <div className={`${selectedId ? "hidden lg:block" : "block"} w-full lg:w-96 flex-shrink-0`}>
        <div className="space-y-4 h-full flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
              <p className="text-sm text-muted-foreground">Received emails</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchEmails}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : emails.length === 0 ? (
              <div className="text-center py-12">
                <InboxIcon className="h-12 w-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
                <p className="text-muted-foreground">No received emails yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure MX records for xyberclan.dev to receive emails
                </p>
              </div>
            ) : (
              emails.map((e: any) => (
                <button
                  key={e.id}
                  onClick={() => openEmail(e.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedId === e.id
                      ? "bg-primary/5 border-primary/30 dark:bg-primary/10"
                      : "bg-card hover:bg-gray-50 dark:hover:bg-gray-800/50 border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm truncate flex-1 ${!e.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {e.from}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(e.receivedAt)}
                    </span>
                  </div>
                  <p className={`text-sm truncate mt-0.5 ${!e.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {e.subject}
                  </p>
                  {e.hasAttachments && (
                    <div className="flex items-center gap-1 mt-1">
                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{e.attachmentCount} file(s)</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Email detail */}
      <div className={`${!selectedId ? "hidden" : "flex-1"} flex flex-col`}>
        {selectedId && detailLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>
        ) : selectedEmail ? (
          <Card className="flex-1 flex flex-col">
            {/* Header */}
            <CardContent className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="sm" onClick={() => { setSelectedId(null); setSelectedEmail(null); }}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteEmail(selectedEmail.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <h2 className="text-lg font-semibold text-foreground">{selectedEmail.subject}</h2>
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <p><span className="font-medium text-foreground">From:</span> {selectedEmail.from}</p>
                <p><span className="font-medium text-foreground">To:</span> {selectedEmail.to}</p>
                <p><span className="font-medium text-foreground">Date:</span> {formatDateTime(selectedEmail.receivedAt)}</p>
              </div>
            </CardContent>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedEmail.html ? (
                <iframe
                  srcDoc={selectedEmail.html}
                  className="w-full h-full min-h-[300px] border-0"
                  title="Email body"
                  sandbox="allow-same-origin"
                />
              ) : (
                <p className="text-foreground whitespace-pre-wrap">{selectedEmail.text}</p>
              )}
            </div>

            {/* Attachments */}
            {selectedEmail.attachments.length > 0 && (
              <div className="border-t p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({selectedEmail.attachments.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEmail.attachments.map((att) => (
                    <button
                      key={att.index}
                      onClick={() => downloadAttachment(att.downloadUrl, att.filename)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                    >
                      {fileIcon(att.content_type)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                          {att.filename}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatSize(att.size)}</p>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
              <p>Select an email to read</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </PageTransition>
  );
}
