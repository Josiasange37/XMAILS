"use client";
import { PageTransition } from "@/components/page-transition";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Plus, Search, RefreshCw, Users, Mail, Trash2, Upload, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Contact {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  tags: string[];
  unsubscribed: boolean;
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const { addToast } = useToast();
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", company: "", tags: "" });

  const fetchContacts = useCallback(() => {
    setLoading(true);
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => { setContacts(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleAdd = async () => {
    if (!form.email) return;
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        company: form.company || undefined,
        tags: form.tags ? form.tags.split(",").map((s) => s.trim()) : [],
      }),
    });
    if (res.ok) {
      addToast({ title: "Contact added", variant: "success" });
      setShowAdd(false);
      setForm({ email: "", firstName: "", lastName: "", company: "", tags: "" });
      fetchContacts();
    } else {
      const err = await res.json();
      addToast({ title: "Error", description: err.error, variant: "destructive" });
    }
  };

  const handleImportCSV = () => {
    if (!importFile || importPreview.length === 0) return;
    setImporting(true);
    const contacts = importPreview.map((r: any) => ({
      email: r.email || r.Email || r.EMAIL || "",
      firstName: r.firstName || r.first_name || r["First Name"] || r.FirstName || "",
      lastName: r.lastName || r.last_name || r["Last Name"] || r.LastName || "",
      company: r.company || r.Company || "",
      tags: (r.tags || r.Tags || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    })).filter((c: any) => c.email);

    Promise.all(
      contacts.map((c: any) =>
        fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(c),
        }).catch(() => {})
      )
    ).then((results) => {
      const imported = results.filter((r) => r?.ok).length;
      const failed = results.length - imported;
      addToast({ title: `Imported ${imported} contacts${failed ? `, ${failed} failed` : ""}`, variant: "success" });
      setShowImport(false);
      setImportFile(null);
      setImportPreview([]);
      fetchContacts();
    }).finally(() => setImporting(false));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      if (lines.length < 2) { addToast({ title: "CSV must have a header row", variant: "destructive" }); return; }
      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"(.*)"$/, "$1"));
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.trim().replace(/^"(.*)"$/, "$1"));
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return obj;
      });
      setImportPreview(rows.slice(0, 10));
    };
    reader.readAsText(file);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (res.ok) {
      addToast({ title: "Contact deleted", variant: "success" });
      fetchContacts();
    }
  };

  const filtered = contacts.filter(
    (c) =>
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.firstName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.lastName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.company || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground mt-1">Manage your contact list</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchContacts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
              <p className="text-muted-foreground">No contacts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.email}</TableCell>
                    <TableCell className="text-muted-foreground">{c.firstName || c.lastName ? `${c.firstName || ""} ${c.lastName || ""}` : "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.company || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(c.tags || []).map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.unsubscribed ? <Badge variant="destructive">Unsubscribed</Badge> : <Badge variant="success">Active</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Contacts from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Upload a CSV file with email, firstName, lastName, company, tags columns</p>
              <input type="file" accept=".csv" onChange={handleFileSelect} className="text-sm" />
            </div>
            {importPreview.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Preview ({importPreview.length} rows):</p>
                <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                  {importPreview.map((r, i) => (
                    <div key={i} className="flex gap-2 p-1 border-b">
                      {Object.entries(r).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="truncate"><strong>{k}:</strong> {String(v)}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
            <Button onClick={handleImportCSV} disabled={importPreview.length === 0 || importing}>
              {importing ? "Importing..." : `Import ${importPreview.length} contacts`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="customer, vip, trial" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.email}>Add Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageTransition>
  );
}
