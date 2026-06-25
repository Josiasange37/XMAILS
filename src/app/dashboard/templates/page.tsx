"use client";
import { PageTransition } from "@/components/page-transition";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Plus, RefreshCw, FileText, Trash2, Copy } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string | null;
  variables: string[];
  createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [preview, setPreview] = useState<Template | null>(null);
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: "", subject: "", html: "", text: "", variables: "" });

  const fetchTemplates = useCallback(() => {
    setLoading(true);
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => { setTemplates(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleCreate = async () => {
    if (!form.name || !form.subject || !form.html) return;
    const res = await fetch("/api/templates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        subject: form.subject,
        html: form.html,
        text: form.text || undefined,
        variables: form.variables ? form.variables.split(",").map((s) => s.trim()) : [],
      }),
    });
    if (res.ok) {
      addToast({ title: "Template created", variant: "success" });
      setShowCreate(false);
      setForm({ name: "", subject: "", html: "", text: "", variables: "" });
      fetchTemplates();
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    addToast({ title: "Template deleted", variant: "success" });
    fetchTemplates();
  };

  const interpolatePreview = (html: string) => {
    return html.replace(/\{\{(\w+)\}\}/g, "[$1]");
  };

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates</h1>
          <p className="text-muted-foreground mt-1">Reusable email templates with variables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTemplates}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />New Template</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? <div className="text-center py-12 text-muted-foreground">Loading...</div>
          : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
              <p className="text-muted-foreground">No templates yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.subject}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(t.variables || []).map((v) => <span key={v} className="text-xs bg-muted text-foreground rounded px-1.5 py-0.5">{`{{${v}}}`}</span>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(t.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setPreview(t)}><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Template</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Hello {{firstName}}!" /></div>
            <div className="space-y-2"><Label>HTML Body *</Label><Textarea rows={8} value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} placeholder="<h1>Hi {{firstName}}!</h1><p>Your content here...</p>" /></div>
            <div className="space-y-2"><Label>Plain Text</Label><Textarea rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></div>
            <div className="space-y-2"><Label>Variables (comma separated)</Label><Input value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} placeholder="firstName, lastName, company" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name || !form.subject || !form.html}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(o) => { if (!o) setPreview(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{preview?.subject}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="p-4 border rounded-lg bg-white dark:bg-card">
              <div dangerouslySetInnerHTML={{ __html: interpolatePreview(preview?.html || "") }} />
            </div>
            {preview?.text && <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"><pre className="text-sm whitespace-pre-wrap">{preview.text}</pre></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageTransition>
  );
}
