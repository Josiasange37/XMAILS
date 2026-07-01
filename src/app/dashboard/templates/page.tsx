"use client";
import { PageTransition } from "@/components/page-transition";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Plus, FileText, Trash2, Copy, RefreshCw } from "lucide-react";
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
        name: form.name, subject: form.subject, html: form.html,
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

  const interpolatePreview = (html: string) => html.replace(/\{\{(\w+)\}\}/g, "[$1]");

  return (
    <PageTransition>
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Reusable email templates with variables</p>
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" className="h-9 rounded-xl" onClick={fetchTemplates}><RefreshCw className="h-4 w-4" /></Button>
          <Button size="sm" className="h-9 rounded-xl shadow-sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />New
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="p-2">
          {loading ? <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
          : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No templates yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.subject} · {formatDate(t.createdAt)}</p>
                    {(t.variables || []).length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-0.5">
                        {(t.variables || []).map((v) => <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">{`{{${v}}}`}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setPreview(t)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Copy className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>New Template</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Hello {{firstName}}!" className="rounded-xl h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">HTML Body *</Label><Textarea rows={8} value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} placeholder="<h1>Hi {{firstName}}!</h1>" className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Plain Text</Label><Textarea rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Variables (comma separated)</Label><Input value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} placeholder="firstName, lastName, company" className="rounded-xl h-9" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={handleCreate} disabled={!form.name || !form.subject || !form.html}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(o) => { if (!o) setPreview(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{preview?.subject}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="p-4 border border-border/40 rounded-2xl bg-white dark:bg-card/50">
              <div dangerouslySetInnerHTML={{ __html: interpolatePreview(preview?.html || "") }} />
            </div>
            {preview?.text && <div className="p-4 border border-border/40 rounded-2xl bg-muted/30"><pre className="text-sm whitespace-pre-wrap">{preview.text}</pre></div>}
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setPreview(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageTransition>
  );
}
