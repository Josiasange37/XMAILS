"use client";
import { PageTransition } from "@/components/page-transition";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, Megaphone, BarChart3, Plus, Send, FileText, Zap } from "lucide-react";

interface OverviewStats {
  totalContacts: number;
  totalSent: number;
  openRate: number;
  bounceRate: number;
}

interface RecentEmail {
  id: string;
  subject: string;
  to: string[];
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/analytics/overview").then((r) => r.json()).catch(() => ({})),
      fetch("/api/emails?limit=5").then((r) => r.json()).catch(() => ({ emails: [] })),
    ]).then(([overview, emails]) => {
      if (cancelled) return;
      if (!overview.error) setStats(overview);
      if (!emails.error) setRecentEmails(emails.emails || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const statCards = [
    { title: "Total Contacts", value: stats?.totalContacts ?? 0, icon: Users, color: "text-foreground", bg: "bg-muted" },
    { title: "Emails Sent", value: stats?.totalSent ?? 0, icon: Send, color: "text-green-600", bg: "bg-green-50" },
    { title: "Open Rate", value: `${stats?.openRate ?? 0}%`, icon: Eye, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Bounce Rate", value: `${stats?.bounceRate ?? 0}%`, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const quickActions = [
    { label: "Compose Email", href: "/dashboard/emails/compose", icon: Plus },
    { label: "Contacts", href: "/dashboard/contacts", icon: Users },
    { label: "Broadcasts", href: "/dashboard/broadcasts", icon: Megaphone },
    { label: "Templates", href: "/dashboard/templates", icon: FileText },
    { label: "Automations", href: "/dashboard/automations", icon: Zap },
  ];

  return (
    <PageTransition>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here&apos;s your email overview.</p>
        </div>
        <Link href="/dashboard/emails/compose">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Compose Email
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {loading ? "..." : card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Emails</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : recentEmails.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
                  <p className="text-muted-foreground">No emails yet</p>
                  <Link href="/dashboard/emails/compose">
                    <Button variant="outline" className="mt-3">
                      <Plus className="h-4 w-4 mr-2" />
                      Send your first email
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEmails.map((email) => (
                    <div key={email.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{email.subject}</p>
                        <p className="text-sm text-muted-foreground truncate">To: {Array.isArray(email.to) ? email.to.join(", ") : email.to}</p>
                      </div>
                      <Badge variant={email.status === "sent" ? "success" : email.status === "failed" ? "destructive" : "secondary"}>
                        {email.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href}>
                    <Button variant="outline" className="w-full justify-start">
                      <action.icon className="h-4 w-4 mr-3" />
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </PageTransition>
  );
}

function Eye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function AlertTriangle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    </svg>
  );
}
