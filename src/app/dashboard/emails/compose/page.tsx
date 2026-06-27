"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ComposeEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    from: "Xyberclan <noreply@xyberclan.dev>",
    to: "",
    subject: "",
    html: "",
    text: "",
  });

  useEffect(() => {
    const to = searchParams.get("to");
    const subject = searchParams.get("subject");
    if (to || subject) {
      setForm((prev) => ({
        ...prev,
        to: to || prev.to,
        subject: subject || prev.subject,
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.to || !form.subject) {
      addToast({ title: "Error", description: "To and Subject are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          to: form.to.split(",").map((s) => s.trim()),
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      addToast({ title: "Email sent successfully", variant: "success" });
      router.push("/dashboard/emails");
    } catch {
      addToast({ title: "Failed to send email", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/emails">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compose Email</h1>
          <p className="text-muted-foreground mt-1">Write and send an email</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Input value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>To (comma separated)</Label>
              <Input placeholder="user@example.com, another@example.com" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>HTML Body</Label>
              <Textarea rows={12} placeholder="<h1>Hello!</h1><p>Your HTML content here...</p>" value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Plain Text Body (optional)</Label>
              <Textarea rows={6} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Link href="/dashboard/emails">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
