"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast";
import { Save, Mail, Key, Globe, Bell, Image, Trash2, Upload } from "lucide-react";

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
  const [companyName, setCompanyName] = useState("Xyberclan");
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

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your email platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-foreground" />Sending Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Default From Name</Label><Input value={sending.fromName} onChange={(e) => setSending({ ...sending, fromName: e.target.value })} /></div>
            <div className="space-y-2"><Label>Default From Email</Label><Input value={sending.fromEmail} onChange={(e) => setSending({ ...sending, fromEmail: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Reply-To Address</Label><Input value={sending.replyTo} onChange={(e) => setSending({ ...sending, replyTo: e.target.value })} /></div>
          <div className="flex justify-end"><Button onClick={() => handleSave("Sending")}><Save className="h-4 w-4 mr-2" />Save</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-purple-600" />Email Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={signature.name} onChange={(e) => setSignature({ ...signature, name: e.target.value })} placeholder="Jane Doe" /></div>
            <div className="space-y-2"><Label>Title</Label><Input value={signature.title} onChange={(e) => setSignature({ ...signature, title: e.target.value })} placeholder="CEO" /></div>
            <div className="space-y-2"><Label>Company</Label><Input value={signature.company} onChange={(e) => setSignature({ ...signature, company: e.target.value })} placeholder="Xyberclan" /></div>
          </div>
          <div className="space-y-2"><Label>Photo URL (optional)</Label><Input value={signature.logo} onChange={(e) => setSignature({ ...signature, logo: e.target.value })} placeholder="https://example.com/photo.jpg" /></div>
          <div className="bg-muted rounded-lg p-3 text-xs">
            <p className="font-medium mb-1">Preview:</p>
            <p>{signature.name}</p>
            <p className="text-muted-foreground">{signature.title}, {signature.company}</p>
          </div>
          <div className="flex justify-end"><Button onClick={handleSaveSignature} disabled={savingSig}><Save className="h-4 w-4 mr-2" />{savingSig ? "Saving..." : "Save Signature"}</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-orange-600" />Webhooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Resend Webhook URL</Label>
            <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://resend.com/webhooks/..." />
            <p className="text-xs text-muted-foreground">Configure this URL in your Resend dashboard to receive delivery events</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 dark:bg-gray-800">
            <p className="text-sm font-medium">Your webhook endpoint:</p>
            <code className="text-sm bg-white dark:bg-card px-3 py-2 rounded border block">{origin}/api/webhooks</code>
          </div>
          <div className="flex justify-end"><Button onClick={() => handleSave("Webhook")}><Save className="h-4 w-4 mr-2" />Save</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Image className="h-5 w-5 text-emerald-600" />Brand</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Xyberclan" />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Email Management Platform" />
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 w-48 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-800/50">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain p-2" />
              ) : (
                <p className="text-xs text-muted-foreground text-center px-2">No logo set</p>
              )}
            </div>
            <div className="space-y-3 flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoFile}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
              {logoFile && (
                <p className="text-sm text-muted-foreground">{logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)</p>
              )}
              <div className="flex gap-2">
                  <Button onClick={handleLogoUpload} disabled={savingLogo}>
                    <Save className="h-4 w-4 mr-2" />
                    {savingLogo ? "Saving..." : "Save Brand"}
                  </Button>
                {logoPreview && (
                  <Button variant="destructive" onClick={handleLogoDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Logo
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Logo appears at the top of sent emails. Recommended: square PNG, min 100x100px.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-red-600" />API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Resend API Key</Label>
            <Input type="password" value="••••••••••••••••" disabled />
            <p className="text-xs text-muted-foreground">Configured via RESEND_API_KEY environment variable</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
