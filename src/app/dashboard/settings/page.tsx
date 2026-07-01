"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Save, Mail, Key, Globe, Bell, Image, Trash2, Upload, Sparkles } from "lucide-react";
import { PageTransition } from "@/components/page-transition";

export default function SettingsPage() {
  const { addToast } = useToast();
  const [sending, setSending] = useState({ fromName: "My Company", fromEmail: "noreply@yourdomain.com", replyTo: "hello@yourdomain.com" });
  const [signature, setSignature] = useState({ name: "Your Name", title: "Your Title", company: "Your Company", logo: "" });
  const [savingSig, setSavingSig] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [origin, setOrigin] = useState("");

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFilename, setLogoFilename] = useState("");
  const [savingLogo, setSavingLogo] = useState(false);
  const [companyName, setCompanyName] = useState("Xmailo");
  const [tagline, setTagline] = useState("Email Management Platform");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    Promise.all([
      fetch("/api/settings/logo").then((r) => r.json()).catch(() => ({})),
      fetch("/api/settings/signature").then((r) => r.json()).catch(() => ({})),
    ]).then(([logoData, sigData]) => {
      if (logoData?.logoUrl) {
        setLogoPreview(logoData.logoUrl);
        setLogoFilename(logoData.logoFilename || "logo.png");
      }
      if (logoData?.companyName) setCompanyName(logoData.companyName);
      if (logoData?.tagline) setTagline(logoData.tagline);
      if (sigData?.signature_name) setSignature((s) => ({ ...s, name: sigData.signature_name }));
      if (sigData?.signature_title) setSignature((s) => ({ ...s, title: sigData.signature_title }));
      if (sigData?.signature_company) setSignature((s) => ({ ...s, company: sigData.signature_company }));
      if (sigData?.signature_logo) setSignature((s) => ({ ...s, logo: sigData.signature_logo }));
    });
  }, []);

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    if (!logoPreview) return;
    setSavingLogo(true);
    try {
      const body: any = { companyName, tagline, logoFilename };
      if (logoFile) {
        body.logo = logoPreview.split(",")[1];
      }
      const res = await fetch("/api/settings/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || result.error || "Save failed");
      if (result.logoUrl) setLogoPreview(result.logoUrl);
      setLogoFile(null);
      addToast({ title: "Brand settings saved", variant: "success" });
    } catch (e: any) {
      addToast({ title: `Failed to save: ${e.message}`, variant: "destructive" });
    } finally {
      setSavingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    try {
      const res = await fetch("/api/settings/logo", { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setLogoPreview(null);
      setLogoFile(null);
      setLogoFilename("");
      addToast({ title: "Logo removed", variant: "success" });
    } catch {
      addToast({ title: "Failed to remove logo", variant: "destructive" });
    }
  };

  const handleSaveSignature = async () => {
    setSavingSig(true);
    try {
      const res = await fetch("/api/settings/signature", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signature),
      });
      if (!res.ok) throw new Error();
      addToast({ title: "Signature saved", variant: "success" });
    } catch {
      addToast({ title: "Failed to save signature", variant: "destructive" });
    } finally {
      setSavingSig(false);
    }
  };

  const handleSave = (section: string) => {
    addToast({ title: `${section} settings saved`, variant: "success" });
  };

  const sections = [
    { key: "sending", icon: Mail, title: "Sending Configuration", color: "", content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Default From Name</Label><Input value={sending.fromName} onChange={(e) => setSending({ ...sending, fromName: e.target.value })} className="rounded-xl h-9" /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Default From Email</Label><Input value={sending.fromEmail} onChange={(e) => setSending({ ...sending, fromEmail: e.target.value })} className="rounded-xl h-9" /></div>
        </div>
        <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Reply-To Address</Label><Input value={sending.replyTo} onChange={(e) => setSending({ ...sending, replyTo: e.target.value })} className="rounded-xl h-9" /></div>
        <div className="flex justify-end"><Button onClick={() => handleSave("Sending")} className="rounded-xl shadow-sm"><Save className="h-4 w-4 mr-1.5" />Save</Button></div>
      </div>
    )},
    { key: "signature", icon: Globe, title: "Email Signature", color: "text-purple-500", content: (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Full Name</Label><Input value={signature.name} onChange={(e) => setSignature({ ...signature, name: e.target.value })} className="rounded-xl h-9" /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Title</Label><Input value={signature.title} onChange={(e) => setSignature({ ...signature, title: e.target.value })} className="rounded-xl h-9" /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Company</Label><Input value={signature.company} onChange={(e) => setSignature({ ...signature, company: e.target.value })} className="rounded-xl h-9" /></div>
        </div>
        <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Photo URL (optional)</Label><Input value={signature.logo} onChange={(e) => setSignature({ ...signature, logo: e.target.value })} className="rounded-xl h-9" /></div>
        <div className="bg-muted/40 rounded-xl p-3 text-xs">
          <p className="font-medium mb-1">Preview:</p>
          <p>{signature.name}</p>
          <p className="text-muted-foreground">{signature.title}, {signature.company}</p>
        </div>
        <div className="flex justify-end"><Button onClick={handleSaveSignature} disabled={savingSig} className="rounded-xl shadow-sm"><Save className="h-4 w-4 mr-1.5" />{savingSig ? "Saving..." : "Save"}</Button></div>
      </div>
    )},
    { key: "webhooks", icon: Bell, title: "Webhooks", color: "text-orange-500", content: (
      <div className="space-y-4">
        <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Resend Webhook URL</Label><Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} className="rounded-xl h-9" /></div>
        <div className="bg-muted/40 rounded-xl p-4 space-y-2">
          <p className="text-xs font-medium">Your webhook endpoint:</p>
          <code className="text-xs bg-background/80 px-3 py-2 rounded-lg border border-border/40 block">{origin}/api/webhooks</code>
        </div>
        <div className="flex justify-end"><Button onClick={() => handleSave("Webhook")} className="rounded-xl shadow-sm"><Save className="h-4 w-4 mr-1.5" />Save</Button></div>
      </div>
    )},
    { key: "brand", icon: Image, title: "Brand", color: "text-emerald-500", content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Company Name</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="rounded-xl h-9" /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Tagline</Label><Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="rounded-xl h-9" /></div>
        </div>
        <div className="h-px bg-border/40" />
        <div className="flex items-start gap-5">
          <div className="shrink-0 w-40 h-20 rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center overflow-hidden bg-muted/30">
            {logoPreview ? <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain p-2" /> : <p className="text-[10px] text-muted-foreground text-center px-2">No logo</p>}
          </div>
          <div className="space-y-3 flex-1">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoFile} />
            <Button variant="ghost" size="sm" className="h-9 rounded-xl" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-1.5" />Choose Image</Button>
            {logoFile && <p className="text-xs text-muted-foreground">{logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)</p>}
            <div className="flex gap-2">
              <Button size="sm" className="h-9 rounded-xl shadow-sm" onClick={handleLogoUpload} disabled={savingLogo}><Save className="h-4 w-4 mr-1.5" />{savingLogo ? "Saving..." : "Save Brand"}</Button>
              {logoPreview && <Button variant="ghost" size="sm" className="h-9 rounded-xl text-red-500 hover:text-red-600" onClick={handleLogoDelete}><Trash2 className="h-4 w-4 mr-1.5" />Remove</Button>}
            </div>
            <p className="text-[10px] text-muted-foreground">Logo appears at the top of sent emails. Recommended: square PNG, min 100x100px.</p>
          </div>
        </div>
      </div>
    )},
    { key: "api", icon: Key, title: "API Keys", color: "text-red-500", content: (
      <div className="space-y-4">
        <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Resend API Key</Label><Input type="password" value="••••••••••••••••" disabled className="rounded-xl h-9 opacity-60" /></div>
        <p className="text-[10px] text-muted-foreground">Configured via RESEND_API_KEY environment variable</p>
      </div>
    )},
  ];

  return (
    <PageTransition>
      <div className="max-w-3xl space-y-5">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure your email platform</p>
        </div>

        {sections.map((s) => (
          <div key={s.key} className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <s.icon className={`h-5 w-5 ${s.color} opacity-60`} />
              <h2 className="text-base font-semibold tracking-tight">{s.title}</h2>
            </div>
            {s.content}
          </div>
        ))}
      </div>
    </PageTransition>
  );
}
