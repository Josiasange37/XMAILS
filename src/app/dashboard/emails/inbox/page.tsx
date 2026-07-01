"use client";
import { PageTransition } from "@/components/page-transition";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { InboxListSkeleton } from "@/components/ui/skeleton";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Inbox as InboxIcon,
  RefreshCw,
  ChevronLeft,
  Paperclip,
  Download,
  Trash2,
  Mail,
  FileText,
  Image as FileImage,
  File,
  Archive,
  Trash,
  Search,
  Reply,
  X,
  Eye,
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
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchEmails = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/inbox")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load inbox");
        return r.json();
      })
      .then((data) => {
        setEmails(data.emails || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredEmails.length) setSelected(new Set());
    else setSelected(new Set(filteredEmails.map((e: any) => e.id)));
  };

  const bulkDelete = () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const prev = emails;
    setEmails((e: any[]) => e.filter((m: any) => !ids.includes(m.id)));
    if (ids.includes(selectedId || "")) { setSelectedId(null); setSelectedEmail(null); }
    setSelected(new Set());
    addToast({ title: `${ids.length} email(s) deleted`, undo: () => setEmails(prev) });
    Promise.all(ids.map((id) => fetch(`/api/inbox/${id}`, { method: "DELETE" }))).catch(() => {
      setEmails(prev);
      addToast({ title: "Bulk delete failed", variant: "destructive" });
    });
  };

  const bulkMarkRead = () => {
    if (selected.size === 0) return;
    setEmails((e: any[]) => e.map((m: any) => selected.has(m.id) ? { ...m, read: true } : m));
    setSelected(new Set());
    addToast({ title: `Marked ${selected.size} as read`, variant: "success" });
    Promise.all(
      Array.from(selected).map((id) =>
        fetch(`/api/inbox/${id}`, { method: "PATCH", body: JSON.stringify({ read: true }) })
      )
    ).catch(() => {});
  };

  const filteredEmails = useMemo(() => {
    if (!search) return emails;
    const q = search.toLowerCase();
    return emails.filter(
      (e: any) =>
        (e.from || "").toLowerCase().includes(q) ||
        (e.subject || "").toLowerCase().includes(q) ||
        (e.to || "").toLowerCase().includes(q)
    );
  }, [emails, search]);

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

  const deleteEmail = (id: string) => {
    const prev = emails;
    const wasSelected = selectedId === id;
    setEmails((e: any[]) => e.filter((m: any) => m.id !== id));
    if (wasSelected) { setSelectedId(null); setSelectedEmail(null); }
    addToast({ title: "Email deleted", undo: () => { setEmails(prev); } });
    fetch(`/api/inbox/${id}`, { method: "DELETE" }).catch(() => {
      setEmails(prev);
      addToast({ title: "Failed to delete", variant: "destructive" });
    });
  };

  const clearInbox = () => {
    const prev = emails;
    setEmails([]);
    setSelectedId(null);
    setSelectedEmail(null);
    addToast({ title: "Inbox cleared", undo: () => { setEmails(prev); } });
    fetch("/api/inbox", { method: "DELETE" }).catch(() => {
      setEmails(prev);
      addToast({ title: "Failed to clear", variant: "destructive" });
    });
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
    if (contentType.includes("word") || contentType.includes("document")) return <FileText className="h-4 w-4 text-muted-foreground" />;
    if (contentType.includes("zip") || contentType.includes("rar")) return <Archive className="h-4 w-4 text-yellow-600" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "r") { fetchEmails(); }
      if (e.key === "n") { window.location.href = "/dashboard/emails/compose"; }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") { setSelectedId(null); setSelectedEmail(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fetchEmails]);

  return (
    <PageTransition>
    <div className="flex gap-4 lg:gap-5 h-[calc(100vh-8rem)]">
      {/* Email list panel */}
      <div className={`${selectedId ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-96 flex-shrink-0`}>
          <div className="space-y-3 h-full flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <h1 className="text-xl font-bold tracking-tight">Inbox</h1>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" className="h-8 rounded-xl text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={clearInbox}>
                  <Trash className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 rounded-xl" onClick={fetchEmails}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
              <Input
                ref={searchRef}
                placeholder="Search sender or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm rounded-xl bg-muted/30 border-border/40 focus-visible:ring-1"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {error && !loading && <ErrorBanner message={error} onRetry={fetchEmails} />}

            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-xl border border-border/40 text-sm">
                <span className="text-xs font-medium text-muted-foreground">{selected.size} selected</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg" onClick={bulkMarkRead}>
                  <Eye className="h-3 w-3 mr-1" /> Mark read
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg text-red-500" onClick={bulkDelete}>
                  <Trash className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            )}

            {/* Email list */}
            <div ref={listRef} className="flex-1 overflow-y-auto space-y-1 pr-0.5">
              {loading ? (
                <InboxListSkeleton />
              ) : filteredEmails.length === 0 ? (
                <div className="text-center py-12">
                  <InboxIcon className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {search ? "No emails match your search" : "No received emails yet"}
                  </p>
                  {!search && (
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      Configure MX records for xmailo.com to receive emails
                    </p>
                  )}
                </div>
              ) : (
                filteredEmails.map((e: any) => (
                  <div key={e.id} className="flex items-start gap-1.5 group">
                    <div className="pt-3 pl-1">
                      <Checkbox
                        checked={selected.has(e.id)}
                        onCheckedChange={() => toggleSelect(e.id)}
                        className="rounded-md data-[state=checked]:bg-primary border-muted-foreground/30"
                      />
                    </div>
                    <button
                      onClick={() => openEmail(e.id)}
                      className={`flex-1 text-left p-3 rounded-xl border transition-all duration-150 ${
                        selectedId === e.id
                          ? "bg-primary/5 border-primary/30 shadow-sm"
                          : "border-transparent hover:bg-muted/40 hover:border-border/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm truncate flex-1 ${!e.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                          {e.from}
                        </span>
                        <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">
                          {formatDateTime(e.receivedAt)}
                        </span>
                      </div>
                      <p className={`text-sm truncate mt-0.5 ${!e.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                        {e.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {e.hasAttachments && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                            <Paperclip className="h-3 w-3" />
                            {e.attachmentCount}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      {/* Email detail panel */}
      <div className={`${!selectedId ? "hidden lg:flex" : "flex-1"} flex flex-col`}>
        {selectedId && detailLoading ? (
          <div className="flex items-center justify-center h-full">
            <InboxListSkeleton />
          </div>
        ) : selectedEmail ? (
          <div className="flex-1 flex flex-col rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-border/40 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 rounded-xl" onClick={() => { setSelectedId(null); setSelectedEmail(null); }}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <span className="text-xs text-muted-foreground/50 hidden sm:inline">Esc to close</span>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/emails/compose?to=${encodeURIComponent(selectedEmail.from)}&subject=${encodeURIComponent("Re: " + selectedEmail.subject)}`}
                  >
                    <Button variant="outline" size="sm" className="h-8 rounded-xl">
                      <Reply className="h-3.5 w-3.5 mr-1" />
                      Reply
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="h-8 rounded-xl text-red-500" onClick={() => deleteEmail(selectedEmail.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <h2 className="text-base font-semibold">{selectedEmail.subject}</h2>
              <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                <p><span className="font-medium text-foreground">From:</span> {selectedEmail.from}</p>
                <p><span className="font-medium text-foreground">To:</span> {selectedEmail.to}</p>
                <p><span className="font-medium text-foreground">Date:</span> {formatDateTime(selectedEmail.receivedAt)}</p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedEmail.html ? (
                <iframe
                  srcDoc={selectedEmail.html}
                  className="w-full h-full min-h-[300px] border-0 rounded-xl"
                  title="Email body"
                  sandbox="allow-same-origin"
                />
              ) : (
                <p className="text-foreground whitespace-pre-wrap text-sm">{selectedEmail.text}</p>
              )}
            </div>

            {/* Attachments */}
            {selectedEmail.attachments.length > 0 && (
              <div className="border-t border-border/40 p-4 shrink-0">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Paperclip className="h-3.5 w-3.5" />
                  Attachments ({selectedEmail.attachments.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEmail.attachments.map((att) => (
                    <button
                      key={att.index}
                      onClick={() => downloadAttachment(att.downloadUrl, att.filename)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors text-left"
                    >
                      {fileIcon(att.content_type)}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate max-w-[160px]">{att.filename}</p>
                        <p className="text-[11px] text-muted-foreground">{formatSize(att.size)}</p>
                      </div>
                      <Download className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex items-center justify-center h-full">
            <div className="text-center">
              <Mail className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select an email to read</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Press / to search, r to refresh, n to compose</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
