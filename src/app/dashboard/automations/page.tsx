"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Plus, RefreshCw, Zap, Trash2, Power } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
  const actionLabels: Record<string, string> = {
    send_email: "Send Email", add_tag: "Add Tag", remove_tag: "Remove Tag",
    add_to_audience: "Add to Audience", wait: "Wait",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automations</h1>
          <p className="text-muted-foreground mt-1">Trigger-based email automations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAutomations}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />New Automation</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? <div className="text-center py-12 text-muted-foreground">Loading...</div>
          : automations.length === 0 ? (
            <div className="text-center py-12"><Zap className="h-12 w-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" /><p className="text-muted-foreground">No automations yet</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automations.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-muted-foreground">{triggerLabels[a.trigger?.type] || a.trigger?.type}</TableCell>
                    <TableCell className="text-muted-foreground">{a.actions?.length || 0} actions</TableCell>
                    <TableCell>
                      <Badge variant={a.active ? "success" : "secondary"}>{a.active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(a)}>
                          <Power className={`h-4 w-4 ${a.active ? "text-green-600" : "text-gray-400"}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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
          <DialogHeader><DialogTitle>New Automation</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Trigger</Label>
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
              <Label>Active on creation</Label>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>Actions</Label><Button variant="outline" size="sm" onClick={addAction}>+ Add Action</Button></div>
              {actions.map((action, i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Action {i + 1}</span>
                    {actions.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeAction(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                  </div>
                  <Select value={action.type} onChange={(e) => updateAction(i, "type", e.target.value)}
                    options={[
                      { value: "send_email", label: "Send Email" },
                      { value: "add_tag", label: "Add Tag" },
                      { value: "remove_tag", label: "Remove Tag" },
                      { value: "add_to_audience", label: "Add to Audience" },
                      { value: "wait", label: "Wait" },
                    ]} />
                  <div className="space-y-2"><Label className="text-xs">Delay (days)</Label>
                    <Input type="number" min={0} value={action.delayDays} onChange={(e) => updateAction(i, "delayDays", parseInt(e.target.value) || 0)} /></div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
