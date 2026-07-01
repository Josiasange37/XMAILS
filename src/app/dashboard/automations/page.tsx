"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { Plus, RefreshCw, Zap, Trash2, Power, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PageTransition } from "@/components/page-transition";

interface Automation {
  id: string;
  name: string;
  description: string | null;
  trigger: { type: string; audienceId?: string; tag?: string };
  actions: { type: string; templateId?: string; tag?: string; audienceId?: string; delayDays?: number }[];
  active: boolean;
  createdAt: string;
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: "", description: "", triggerType: "contact_added",
    triggerAudienceId: "", triggerTag: "", active: true,
  });
  const [actions, setActions] = useState([{ type: "send_email", templateId: "", tag: "", audienceId: "", delayDays: 0 }]);

  const fetchAutomations = useCallback(() => {
    setLoading(true);
    fetch("/api/automations")
      .then((r) => r.json())
      .then((data) => { setAutomations(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  useEffect(() => { fetchAutomations(); }, [fetchAutomations]);

  const handleCreate = async () => {
    if (!form.name) return;
    const res = await fetch("/api/automations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        trigger: { type: form.triggerType, audienceId: form.triggerAudienceId || undefined, tag: form.triggerTag || undefined },
        actions,
        active: form.active,
      }),
    });
    if (res.ok) {
      addToast({ title: "Automation created", variant: "success" });
      setShowCreate(false);
      setForm({ name: "", description: "", triggerType: "contact_added", triggerAudienceId: "", triggerTag: "", active: true });
      setActions([{ type: "send_email", templateId: "", tag: "", audienceId: "", delayDays: 0 }]);
      fetchAutomations();
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/automations/${id}`, { method: "DELETE" });
    addToast({ title: "Automation deleted", variant: "success" });
    fetchAutomations();
  };

  const toggleActive = async (a: Automation) => {
    await fetch(`/api/automations/${a.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !a.active }),
    });
    fetchAutomations();
  };

  const addAction = () => setActions([...actions, { type: "send_email", templateId: "", tag: "", audienceId: "", delayDays: 0 }]);
  const updateAction = (i: number, field: string, value: string | number) => {
    const newActions = [...actions];
    (newActions[i] as any)[field] = value;
    setActions(newActions);
  };
  const removeAction = (i: number) => { if (actions.length > 1) setActions(actions.filter((_, idx) => idx !== i)); };

  const triggerLabels: Record<string, string> = {
    contact_added: "Contact Added", tag_added: "Tag Added", email_opened: "Email Opened",
    email_clicked: "Email Clicked", schedule: "Schedule",
  };

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Automations</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Trigger-based email automations</p>
          </div>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" className="h-9 rounded-xl" onClick={fetchAutomations}><RefreshCw className="h-4 w-4" /></Button>
            <Button size="sm" className="h-9 rounded-xl shadow-sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1.5" />New</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="p-2">
            {loading ? <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
            : automations.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No automations yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {automations.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${a.active ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-muted/60 text-muted-foreground"}`}>{a.active ? "Active" : "Inactive"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{triggerLabels[a.trigger?.type] || a.trigger?.type} · {a.actions?.length || 0} actions · {formatDate(a.createdAt)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => toggleActive(a)} className={`p-1.5 rounded-lg hover:bg-muted ${a.active ? "text-green-500" : "text-muted-foreground"}`}><Power className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>New Automation</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Trigger</Label>
                <Select value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value })}
                  options={[
                    { value: "contact_added", label: "Contact Added" },
                    { value: "tag_added", label: "Tag Added" },
                    { value: "email_opened", label: "Email Opened" },
                    { value: "email_clicked", label: "Email Clicked" },
                  ]} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
                <Label className="text-xs text-muted-foreground">Active on creation</Label>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><Label className="text-xs text-muted-foreground">Actions</Label><Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs" onClick={addAction}>+ Add</Button></div>
                {actions.map((action, i) => (
                  <div key={i} className="px-3 py-2.5 border border-border/40 rounded-xl bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Action {i + 1}</span>
                      {actions.length > 1 && <button onClick={() => removeAction(i)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>}
                    </div>
                    <Select value={action.type} onChange={(e) => updateAction(i, "type", e.target.value)}
                      options={[
                        { value: "send_email", label: "Send Email" },
                        { value: "add_tag", label: "Add Tag" },
                        { value: "remove_tag", label: "Remove Tag" },
                        { value: "add_to_audience", label: "Add to Audience" },
                        { value: "wait", label: "Wait" },
                      ]} />
                    <div className="space-y-1"><Label className="text-[10px] text-muted-foreground">Delay (days)</Label>
                      <Input type="number" min={0} value={action.delayDays} onChange={(e) => updateAction(i, "delayDays", parseInt(e.target.value) || 0)} className="rounded-xl h-8 text-xs" /></div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" className="rounded-xl" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="rounded-xl" onClick={handleCreate} disabled={!form.name}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
