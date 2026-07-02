"use client";
import { PageTransition } from "@/components/page-transition";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  Plus, Search, RefreshCw, Users, Trash2, Upload, Loader2, X, Mail,
  ClipboardPaste, AlertCircle, CheckCircle2, Ban, Pencil, ChevronDown, Tags, ChevronRight, AlertTriangle
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Contact } from "@/types/contact";
import { Select } from "@/components/ui/select";

const CATEGORIES = ["follower", "sponsor", "partner", "friend", "enterprise"] as const;
type Category = (typeof CATEGORIES)[number];
const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }));

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [showDeduplicate, setShowDeduplicate] = useState(false);
  const [showFixUncategorized, setShowFixUncategorized] = useState(false);
  const [showDeleteOne, setShowDeleteOne] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importFullData, setImportFullData] = useState<any[]>([]);
  const [importCategory, setImportCategory] = useState<string>("follower");
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const { addToast } = useToast();

  // Edit
  const [showEdit, setShowEdit] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState({ email: "", first_name: "", last_name: "", company: "", tags: "", category: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [showEditCustomTags, setShowEditCustomTags] = useState(false);

  // Single add form
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", company: "", tags: "", category: "" });
  const [emailCheck, setEmailCheck] = useState<"idle" | "checking" | "exists" | "new" | "invalid">("idle");
  const [showCustomTags, setShowCustomTags] = useState(false);

  // Bulk add
  const [bulkRaw, setBulkRaw] = useState("");
  const [bulkPreview, setBulkPreview] = useState<{ email: string; exists: boolean | null; valid: boolean | null }[]>([]);
  const [bulkChecking, setBulkChecking] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);

  // Delete all
  const [deletingAll, setDeletingAll] = useState(false);

  const fetchContacts = useCallback((pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    const params = new URLSearchParams();
    params.set("page", String(pageNum));
    params.set("limit", "50");
    if (activeTag) params.set("tag", activeTag);
    fetch(`/api/contacts?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const d = data as { contacts: Contact[]; total: number; page: number; pages: number };
        setContacts((prev) => append ? [...prev, ...d.contacts] : d.contacts);
        setTotal(d.total);
        setPages(d.pages);
        setPage(d.page);
        setLoading(false);
        setLoadingMore(false);
      })
      .catch(() => { setLoading(false); setLoadingMore(false); });
  }, [activeTag]);

  useEffect(() => { fetchContacts(1); }, [fetchContacts]);

  // Check email existence on input
  const checkEmail = useCallback(async (email: string) => {
    if (!email.trim()) { setEmailCheck("idle"); return; }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email.trim())) { setEmailCheck("invalid"); return; }
    setEmailCheck("checking");
    try {
      const res = await fetch("/api/contacts/exists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [email.trim()] }),
      });
      const data = await res.json();
      setEmailCheck(data.existing?.[email.trim().toLowerCase()] ? "exists" : "new");
    } catch { setEmailCheck("new"); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => checkEmail(form.email), 500);
    return () => clearTimeout(t);
  }, [form.email, checkEmail]);

  // Single add
  const handleAdd = async () => {
    if (!form.email) return;
    const customTags = form.tags ? form.tags.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const allTags = [...(form.category ? [form.category] : []), ...customTags];
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        first_name: form.first_name || undefined,
        last_name: form.last_name || undefined,
        company: form.company || undefined,
        tags: allTags,
      }),
    });
    if (res.ok) {
      addToast({ title: "Contact added", variant: "success" });
      setShowAdd(false);
      setForm({ email: "", first_name: "", last_name: "", company: "", tags: "", category: "" });
      setShowCustomTags(false);
      setEmailCheck("idle");
      fetchContacts(1);
    } else {
      const err = await res.json();
      addToast({ title: "Error", description: err.error, variant: "destructive" });
    }
  };

  // Count per category for the filter bar
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = contacts.filter((c) => (c.tags || []).includes(cat)).length;
    return acc;
  }, {} as Record<string, number>);

  // Filter (client-side)
  const filtered = contacts.filter(
    (c) =>
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.last_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.company || "").toLowerCase().includes(search.toLowerCase())
  );

  // Delete single
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (res.ok) {
      addToast({ title: "Contact deleted", variant: "success" });
      setShowDeleteOne(null);
      fetchContacts(1);
    }
  };

  // Edit
  const openEdit = (c: Contact) => {
    setEditContact(c);
    const mainCat = CATEGORIES.find((cat) => (c.tags || []).includes(cat));
    setEditForm({
      email: c.email,
      first_name: c.first_name || "",
      last_name: c.last_name || "",
      company: c.company || "",
      tags: (c.tags || []).join(", "),
      category: mainCat || "",
    });
    setShowEditCustomTags(false);
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!editContact) return;
    setEditSaving(true);
    const customTags = editForm.tags ? editForm.tags.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const allTags = [...(editForm.category ? [editForm.category] : []), ...customTags];
    const res = await fetch(`/api/contacts/${editContact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: editForm.email,
        first_name: editForm.first_name || undefined,
        last_name: editForm.last_name || undefined,
        company: editForm.company || undefined,
        tags: allTags,
      }),
    });
    if (res.ok) {
      addToast({ title: "Contact updated", variant: "success" });
      setShowEdit(false);
      setEditContact(null);
      fetchContacts(1);
    } else {
      const err = await res.json();
      addToast({ title: "Error", description: err.error || "Failed to update", variant: "destructive" });
    }
    setEditSaving(false);
  };

  // Delete all
  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const res = await fetch("/api/contacts/delete-all", { method: "DELETE" });
      if (res.ok) {
        addToast({ title: "All contacts deleted", variant: "success" });
        setShowDeleteAll(false);
        fetchContacts(1);
      }
    } catch {} finally { setDeletingAll(false); }
  };

  // Deduplicate
  const [deduplicating, setDeduplicating] = useState(false);

  const handleDeduplicate = async () => {
    setDeduplicating(true);
    try {
      const res = await fetch("/api/contacts/deduplicate", { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        addToast({ title: data.message || `Removed ${data.deleted} duplicate(s)`, variant: "success" });
        setShowDeduplicate(false);
        fetchContacts(1);
      } else {
        const err = await res.json();
        addToast({ title: "Error", description: err.error || "Failed to deduplicate", variant: "destructive" });
      }
    } catch {
      addToast({ title: "Error", description: "Failed to deduplicate", variant: "destructive" });
    } finally { setDeduplicating(false); }
  };

  // Fix uncategorized contacts
  const [fixingUncategorized, setFixingUncategorized] = useState(false);

  const handleFixUncategorized = async () => {
    setFixingUncategorized(true);
    try {
      const res = await fetch("/api/contacts/fix-uncategorized", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        addToast({ title: data.message || `Fixed ${data.updated} uncategorized contact(s)`, variant: "success" });
        setShowFixUncategorized(false);
        fetchContacts(1);
      } else {
        const err = await res.json();
        addToast({ title: "Error", description: err.error || "Failed to fix uncategorized", variant: "destructive" });
      }
    } catch {
      addToast({ title: "Error", description: "Failed to fix uncategorized", variant: "destructive" });
    } finally { setFixingUncategorized(false); }
  };

  // === BULK ADD ===
  const parseBulkEmails = (raw: string) => {
    const lines = raw.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    const seen = new Set<string>();
    const unique: string[] = [];
    lines.forEach((e) => {
      const key = e.toLowerCase();
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!seen.has(key) && re.test(e)) { seen.add(key); unique.push(e); }
    });
    return unique;
  };

  const handleBulkParse = () => {
    const emails = parseBulkEmails(bulkRaw);
    if (emails.length === 0) {
      addToast({ title: "No valid emails found", variant: "destructive" });
      return;
    }
    setBulkPreview(emails.map((e) => ({ email: e, exists: null, valid: null })));
    setBulkChecking(true);
    fetch("/api/contacts/exists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails }),
    }).then((r) => r.json()).then((data) => {
      setBulkPreview((prev) => prev.map((p) => ({
        ...p,
        exists: data.existing?.[p.email.toLowerCase()] || false,
        valid: true,
      })));
      setBulkChecking(false);
    }).catch(() => { setBulkChecking(false); });
  };

  const handleBulkImport = async () => {
    const newContacts = bulkPreview.filter((p) => !p.exists);
    if (newContacts.length === 0) { addToast({ title: "No new contacts to add", variant: "destructive" }); return; }
    setBulkImporting(true);
    const results = await Promise.allSettled(
      newContacts.map((c) =>
        fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: c.email }),
        }).then((r) => r.ok)
      )
    );
    const added = results.filter((r) => r.status === "fulfilled" && r.value).length;
    addToast({ title: `Added ${added} contact(s)${newContacts.length - added > 0 ? `, ${newContacts.length - added} failed` : ""}`, variant: "success" });
    setBulkImporting(false);
    setShowBulk(false);
    setBulkRaw(""); setBulkPreview([]);
    fetchContacts(1);
  };

  // === IMPORT (CSV / Excel) ===
  const normalizeKey = (k: string): string | null => {
    const s = k.trim().toLowerCase().replace(/[\s_-]+/g, "");
    if (s === "email" || s === "e-mail" || s === "emailaddress" || s === "emailaddr") return "email";
    if (s === "adresseemail" || s === "adressemail" || s === "courriel" || s === "emailaddress") return "email";
    if (s === "firstname" || s === "firstname" || s === "first" || s === "givenname" || s === "givenname") return "first_name";
    if (s === "prénom" || s === "prenom" || s === "prénom" || s === "first") return "first_name";
    if (s === "lastname" || s === "lastname" || s === "last" || s === "surname" || s === "familyname") return "last_name";
    if (s === "nom" || s === "nomdefamille" || s === "surname" || s === "last") return "last_name";
    if (s === "company" || s === "organization" || s === "org" || s === "companyname" || s === "entreprise") return "company";
    if (s === "tags" || s === "tag" || s === "labels" || s === "label" || s === "categories" || s === "category") return "tags";
    if (s === "nomcomplet" || s === "fullname" || s === "fullname") return "full_name";
    return null;
  };

  const parseFileRows = (data: any[]): any[] =>
    data.map((r: any) => {
      const row: Record<string, any> = {};
      for (const [k, v] of Object.entries(r)) {
        const mapped = normalizeKey(k);
        if (!mapped) continue;
        row[mapped] = mapped === "email" ? String(v ?? "").trim().toLowerCase() : String(v ?? "").trim();
      }
      if (row.full_name && !row.first_name && !row.last_name) {
        const parts = row.full_name.trim().split(/\s+/);
        row.first_name = parts[0] || "";
        row.last_name = parts.slice(1).join(" ") || "";
        delete row.full_name;
      }
      return row;
    }).filter((r: any) => r.email);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    const onData = (allData: any[]) => {
      const parsed = parseFileRows(allData);
      if (!parsed.length) {
        addToast({ title: "No valid rows found – check that your file has an email column", variant: "destructive" });
        setImportPreview([]);
        setImportFullData([]);
        return;
      }
      setImportFullData(parsed);
      setImportPreview(parsed.slice(0, 10));
    };

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const workbook = XLSX.read(ev.target?.result, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          if (!json.length) {
            addToast({ title: "Excel file is empty", variant: "destructive" });
            return;
          }
          onData(json);
        } catch {
          addToast({ title: "Failed to parse Excel file", variant: "destructive" });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => onData(results.data),
        error: () => {
          addToast({ title: "Failed to parse CSV", variant: "destructive" });
        },
      });
    }
  };

  const handleImportFile = async () => {
    if (!importFile || importFullData.length === 0) return;
    setImporting(true);
    const rows = importFullData.map((r: any) => ({
      email: (r.email || "").trim(),
      first_name: r.first_name || undefined,
      last_name: r.last_name || undefined,
      company: r.company || undefined,
      tags: importCategory ? [importCategory, ...(r.tags || "").split(",").map((s: string) => s.trim()).filter(Boolean)] : (r.tags || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    })).filter((c: any) => c.email);

    const results = await Promise.allSettled(
      rows.map((c: any) =>
        fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(c),
        }).then(async (r) => {
          const body = r.ok ? null : await r.json().catch(() => null);
          return { ok: r.ok, status: r.status, email: c.email, error: body?.error || null };
        })
      )
    );
    const imported = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
    const duplicateList = results.filter((r) => r.status === "fulfilled" && r.value.status === 409).map((r: any) => r.value.email);
    const failedList = results.filter((r) => r.status === "fulfilled" && !r.value.ok && r.value.status !== 409).map((r: any) => `${r.value.email} (${r.value.error || r.value.status})`);
    const parts = [`Imported ${imported} contacts`];
    if (duplicateList.length) parts.push(`${duplicateList.length} already existed`);
    if (failedList.length) parts.push(`${failedList.length} failed: ${failedList.join(", ")}`);
    addToast({ title: parts.join(", "), variant: "success" });
    setShowImport(false); setImportFile(null); setImportPreview([]); setImportFullData([]); setImportCategory("follower");
    fetchContacts(1);
    setImporting(false);
  };

  const hasMore = page < pages;

  return (
    <PageTransition>
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} contact{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" className="h-9 rounded-xl" onClick={() => fetchContacts(1)}><RefreshCw className="h-4 w-4" /></Button>
          {contacts.length > 0 && (
            <>
              <Button variant="ghost" size="sm" className="h-9 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setShowDeleteAll(true)}>
                <Trash2 className="h-4 w-4 mr-1.5" />Delete All
              </Button>
              <Button variant="ghost" size="sm" className="h-9 rounded-xl" onClick={() => setShowDeduplicate(true)}>
                <RefreshCw className="h-4 w-4 mr-1.5" />Deduplicate
              </Button>
              <Button variant="ghost" size="sm" className="h-9 rounded-xl" onClick={() => setShowFixUncategorized(true)}>
                <AlertTriangle className="h-4 w-4 mr-1.5" />Fix Categories
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" className="h-9 rounded-xl" onClick={() => setShowBulk(true)}>
            <ClipboardPaste className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 rounded-xl" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-1.5" />Import
          </Button>
          <Button size="sm" className="h-9 rounded-xl shadow-sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1.5" />Add
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/30 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
              <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm rounded-xl bg-muted/30 border-border/40" />
            </div>
            <span className="text-[11px] text-muted-foreground/60">{filtered.length} / {total}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[{ label: "All", key: null, count: contacts.length }, ...CATEGORIES.map((t) => ({ label: t, key: t, count: categoryCounts[t] || 0 }))].map(({ label, key, count }) => (
              <button key={label} onClick={() => setActiveTag(key === activeTag ? null : key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize transition-all",
                  activeTag === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                {label}
                {count > 0 && <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  activeTag === key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/10 text-muted-foreground"
                )}>{count}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2">
          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{contacts.length === 0 ? "No contacts yet" : "No contacts match this filter"}</p>
              {contacts.length === 0 && (
                <div className="flex gap-2 justify-center mt-3">
                  <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1.5" />Add One</Button>
                  <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setShowBulk(true)}><ClipboardPaste className="h-4 w-4 mr-1.5" />Bulk Add</Button>
                  <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setShowImport(true)}><Upload className="h-4 w-4 mr-1.5" />Import CSV</Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((c) => (
                <div key={c.id} className="contact-row flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Mail className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{c.email}</span>
                      {c.unsubscribed && <span className="text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded shrink-0">Unsubscribed</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {c.first_name || c.last_name ? <span>{c.first_name || ""} {c.last_name || ""}</span> : null}
                      {c.company ? <span>· {c.company}</span> : null}
                      <span>· {formatDate(c.created_at)}</span>
                    </div>
                    {(c.tags || []).length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {(c.tags || []).map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">{t}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setShowDeleteOne(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
              {hasMore && (
                <div className="pt-2 pb-1 text-center">
                  <Button variant="ghost" size="sm" className="rounded-xl text-xs h-8" onClick={() => fetchContacts(page + 1, true)} disabled={loadingMore}>
                    {loadingMore ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ChevronDown className="h-3.5 w-3.5 mr-1.5" />}
                    Load more ({total - contacts.length} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === Add Contact Dialog === */}
      <Dialog open={showAdd} onOpenChange={(o) => { if (!o) { setShowAdd(false); setEmailCheck("idle"); setShowCustomTags(false); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email *</Label>
              <div className="relative">
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com" className="rounded-xl h-9 pr-9" />
                {emailCheck === "checking" && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                {emailCheck === "exists" && <Ban className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />}
                {emailCheck === "new" && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />}
                {emailCheck === "invalid" && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />}
              </div>
              {emailCheck === "exists" && <p className="text-[11px] text-red-500">Already in your contacts</p>}
              {emailCheck === "new" && <p className="text-[11px] text-green-500">New contact</p>}
              {emailCheck === "invalid" && <p className="text-[11px] text-amber-500">Invalid email format</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">First Name</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="rounded-xl h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Last Name</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="rounded-xl h-9" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="rounded-xl h-9" /></div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                <Tags className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                Category
              </Label>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                options={CATEGORY_OPTIONS}
                placeholder="Select a category..."
                className="rounded-xl h-9"
              />
              {form.category && (
                <div className="flex gap-1 flex-wrap mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {form.category.charAt(0).toUpperCase() + form.category.slice(1)}
                    <button onClick={() => setForm({ ...form, category: "" })} className="hover:text-destructive ml-0.5"><X className="h-3 w-3" /></button>
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowCustomTags(!showCustomTags)}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ChevronRight className={cn("h-3 w-3 transition-transform", showCustomTags && "rotate-90")} />
                {showCustomTags ? "Hide" : "Add"} custom tags
              </button>
              {showCustomTags && (
                <div>
                  <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="partner, sponsor, candidate..." className="rounded-xl h-9" />
                  {form.tags && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {form.tags.split(",").map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted/60 text-muted-foreground">
                          {t.trim()}
                          <button onClick={() => { const ts = form.tags.split(",").filter((_, j) => j !== i); setForm({ ...form, tags: ts.join(", ") }); }} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => { setShowAdd(false); setEmailCheck("idle"); setShowCustomTags(false); }}>Cancel</Button>
            <Button className="rounded-xl shadow-sm" onClick={handleAdd} disabled={!form.email || emailCheck === "exists" || emailCheck === "invalid" || emailCheck === "checking"}>
              {emailCheck === "checking" ? "Checking..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Edit Contact Dialog === */}
      <Dialog open={showEdit} onOpenChange={(o) => { if (!o) { setShowEdit(false); setEditContact(null); setShowEditCustomTags(false); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email *</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="email@example.com" className="rounded-xl h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">First Name</Label><Input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className="rounded-xl h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Last Name</Label><Input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className="rounded-xl h-9" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Company</Label><Input value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} className="rounded-xl h-9" /></div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                <Tags className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                Category
              </Label>
              <Select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                options={CATEGORY_OPTIONS}
                placeholder="Select a category..."
                className="rounded-xl h-9"
              />
              {editForm.category && (
                <div className="flex gap-1 flex-wrap mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {editForm.category.charAt(0).toUpperCase() + editForm.category.slice(1)}
                    <button onClick={() => setEditForm({ ...editForm, category: "" })} className="hover:text-destructive ml-0.5"><X className="h-3 w-3" /></button>
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowEditCustomTags(!showEditCustomTags)}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ChevronRight className={cn("h-3 w-3 transition-transform", showEditCustomTags && "rotate-90")} />
                {showEditCustomTags ? "Hide" : "Add"} custom tags
              </button>
              {showEditCustomTags && (
                <div>
                  <Input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    placeholder="partner, sponsor, candidate..." className="rounded-xl h-9" />
                  {editForm.tags && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {editForm.tags.split(",").map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted/60 text-muted-foreground">
                          {t.trim()}
                          <button onClick={() => { const ts = editForm.tags.split(",").filter((_, j) => j !== i); setEditForm({ ...editForm, tags: ts.join(", ") }); }} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => { setShowEdit(false); setEditContact(null); setShowEditCustomTags(false); }}>Cancel</Button>
            <Button className="rounded-xl shadow-sm" onClick={handleEdit} disabled={editSaving || !editForm.email}>
              {editSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Bulk Add Dialog === */}
      <Dialog open={showBulk} onOpenChange={(o) => { if (!o) { setShowBulk(false); setBulkRaw(""); setBulkPreview([]); } }}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>Bulk Add Contacts</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Paste emails separated by comma, newline, or semicolon. Duplicates and invalid formats are filtered automatically.</p>
            <Textarea placeholder={`john@example.com\njane@company.com\nbob@startup.io`} rows={5} value={bulkRaw}
              onChange={(e) => setBulkRaw(e.target.value)} className="rounded-xl" />
            <Button onClick={handleBulkParse} disabled={!bulkRaw.trim() || bulkChecking} className="w-full rounded-xl shadow-sm" size="sm">
              {bulkChecking ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Search className="h-4 w-4 mr-1.5" />}
              {bulkChecking ? "Checking..." : "Parse & Check"}
            </Button>

            {bulkPreview.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {bulkPreview.length} email{bulkPreview.length !== 1 ? "s" : ""} ·
                    {bulkPreview.filter((p) => !p.exists).length} new ·
                    {bulkPreview.filter((p) => p.exists).length} existing
                  </span>
                  {bulkPreview.some((p) => p.exists !== null) && (
                    <Button size="sm" className="h-8 rounded-lg text-xs shadow-sm" onClick={handleBulkImport} disabled={bulkImporting || bulkPreview.filter((p) => !p.exists).length === 0}>
                      {bulkImporting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                      Add {bulkPreview.filter((p) => !p.exists).length} new
                    </Button>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {bulkPreview.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-muted/20">
                      {p.exists === null ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
                        : p.exists ? <Ban className="h-3 w-3 text-red-400 shrink-0" />
                        : <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                      <span className="flex-1 truncate">{p.email}</span>
                      {p.exists !== null && <span className={`shrink-0 ${p.exists ? "text-red-400" : "text-green-500"}`}>{p.exists ? "exists" : "new"}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => { setShowBulk(false); setBulkRaw(""); setBulkPreview([]); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Import Dialog (CSV / Excel) === */}
      <Dialog open={showImport} onOpenChange={(o) => { if (!o) { setShowImport(false); setImportFile(null); setImportPreview([]); setImportFullData([]); setImportCategory("follower"); } }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Import Contacts</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border/40 rounded-2xl p-6 text-center bg-muted/20">
              <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Upload a CSV or Excel file (.csv, .xlsx, .xls) with email, first_name, last_name, company, tags columns</p>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect}
                className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
            </div>
            {importPreview.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Preview ({importPreview.length} rows):</p>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {importPreview.map((r, i) => (
                    <div key={i} className="flex gap-2 p-2 rounded-lg bg-muted/30 text-xs">
                      {Object.entries(r as Record<string, unknown>).slice(0, 4).map(([k, v]) => (
                        <span key={k} className="truncate text-muted-foreground"><span className="font-medium text-foreground">{k}:</span> {String(v)}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                <Tags className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                Default Category for Imported Contacts
              </Label>
              <Select
                value={importCategory}
                onChange={(e) => setImportCategory(e.target.value)}
                options={CATEGORY_OPTIONS}
                placeholder="Select a category..."
                className="rounded-xl h-9"
              />
              <p className="text-[11px] text-muted-foreground">All imported contacts will be tagged with this category</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => { setShowImport(false); setImportFile(null); setImportPreview([]); setImportFullData([]); setImportCategory("follower"); }}>Cancel</Button>
            <Button className="rounded-xl shadow-sm" onClick={handleImportFile} disabled={importFullData.length === 0 || importing}>
              {importing ? "Importing..." : `Import ${importFullData.length}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Delete Single Confirmation Dialog === */}
      <Dialog open={!!showDeleteOne} onOpenChange={(o) => { if (!o) setShowDeleteOne(null); }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>Delete Contact?</DialogTitle></DialogHeader>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">This will permanently delete this contact. This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setShowDeleteOne(null)}>Cancel</Button>
            <Button variant="ghost" className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => showDeleteOne && handleDelete(showDeleteOne)}>
              <Trash2 className="h-4 w-4 mr-1.5" />Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Delete All Dialog === */}
      <Dialog open={showDeleteAll} onOpenChange={setShowDeleteAll}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>Delete All Contacts?</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">This will permanently delete all {total} contact{total !== 1 ? "s" : ""}. This action cannot be undone.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setShowDeleteAll(false)}>Cancel</Button>
            <Button variant="ghost" className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleDeleteAll} disabled={deletingAll}>
              {deletingAll ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Deduplicate Dialog === */}
      <Dialog open={showDeduplicate} onOpenChange={setShowDeduplicate}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>Deduplicate Contacts?</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-600 dark:text-amber-400">This will remove duplicate contacts (same email), keeping the oldest entry for each email. This action cannot be undone.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setShowDeduplicate(false)}>Cancel</Button>
            <Button variant="ghost" className="rounded-xl text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" onClick={handleDeduplicate} disabled={deduplicating}>
              {deduplicating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
              Deduplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Fix Uncategorized Dialog === */}
      <Dialog open={showFixUncategorized} onOpenChange={setShowFixUncategorized}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle>Fix Uncategorized Contacts?</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30">
              <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
              <p className="text-sm text-blue-600 dark:text-blue-400">This will assign "follower" category to all contacts that don't have any category tag. Contacts with existing categories (sponsor, partner, friend, enterprise) are not affected.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setShowFixUncategorized(false)}>Cancel</Button>
            <Button variant="ghost" className="rounded-xl text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={handleFixUncategorized} disabled={fixingUncategorized}>
              {fixingUncategorized ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Tags className="h-4 w-4 mr-1.5" />}
              Fix Uncategorized
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageTransition>
  );
}
