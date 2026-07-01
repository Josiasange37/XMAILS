"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Plus, ArrowLeft } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { PageTransition } from "@/components/page-transition";

export default function ScheduledEmailsPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmails = () => {
    setLoading(true);
    fetch("/api/emails?status=scheduled")
      .then((r) => r.json())
      .then((data) => { setEmails(data.emails || []); setLoading(false); });
  };

  useEffect(() => { fetchEmails(); }, []);

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/emails">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-[28px] font-bold tracking-tight">Scheduled</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Emails scheduled to send later</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-9 rounded-xl" onClick={fetchEmails}>
            <Clock className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="p-2">
            {loading ? <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
            : emails.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No scheduled emails</p>
              </div>
            ) : (
              <div className="space-y-1">
                {emails.map((e: any) => (
                  <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.subject || "(no subject)"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        To: {Array.isArray(e.to) ? e.to.join(", ") : e.to} · {formatDateTime(e.createdAt)}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 shrink-0">{e.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
