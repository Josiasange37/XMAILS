"use client";
import { PageTransition } from "@/components/page-transition";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, Users, Send, Eye, AlertTriangle, Megaphone, FileText, Zap, Upload, Edit, BarChart3, Circle, Mail, Activity } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";

interface TimelineDay {
  day: string;
  Sent: number;
  Delivered: number;
  Opened: number;
  Bounced: number;
  "Open Rate": number;
  "Bounce Rate": number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics/overview").then((r) => r.json()).catch(() => ({})),
      fetch("/api/analytics/timeline").then((r) => r.json()).catch(() => ({ timeline: [] })),
    ]).then(([overview, tl]) => {
      if (!overview.error) setStats(overview);
      if (!tl.error && tl.timeline) setTimeline(tl.timeline);
      setLoading(false);
    });
  }, []);

  const hasData = stats?.totalSent > 0;
  const sentDisplay = stats?.totalSent
    ? (stats.totalSent >= 1000 ? `${(stats.totalSent / 1000).toFixed(1)}k` : String(stats.totalSent))
    : "0";

  const openRateDisplay = hasData ? `${stats.openRate}%` : "—";
  const bounceRateDisplay = hasData ? `${stats.bounceRate}%` : "—";
  const deliverabilityScore = hasData && stats.totalSent > 0
    ? Math.round((stats.totalDelivered / stats.totalSent) * 100)
    : null;

  const statCards = [
    {
      title: "Emails Sent",
      metric: sentDisplay,
      icon: Send,
      color: "green",
    },
    {
      title: "Delivered",
      metric: hasData ? String(stats.totalDelivered) : "—",
      icon: Mail,
      color: "green",
    },
    {
      title: "Open Rate",
      metric: openRateDisplay,
      icon: Eye,
      color: hasData && stats.openRate > 30 ? "green" : "muted",
    },
    {
      title: "Bounce Rate",
      metric: bounceRateDisplay,
      icon: AlertTriangle,
      color: hasData && stats.bounceRate > 5 ? "red" : "muted",
    },
  ];

  const quickActions = [
    { label: "Create Campaign", icon: Megaphone, href: "/dashboard/broadcasts" },
    { label: "Import Contacts", icon: Upload, href: "/dashboard/contacts" },
    { label: "Design Template", icon: Edit, href: "/dashboard/templates" },
    { label: "View Reports", icon: BarChart3, href: "/dashboard/analytics" },
  ];

  const totalWeekly = useMemo(() => timeline.reduce((s, d) => s + d.Sent, 0), [timeline]);

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your email performance.</p>
        </div>
        <Link href="/dashboard/emails/compose">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Compose Email
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <div className={`p-2 rounded-lg ${card.color === "green" ? "bg-green-50" : card.color === "red" ? "bg-red-50" : "bg-muted"}`}>
                  <card.icon className={`h-4 w-4 ${card.color === "green" ? "text-green-600" : card.color === "red" ? "text-red-500" : "text-muted-foreground"}`} />
                </div>
              </div>
              <p className="text-2xl font-bold mt-2">{loading ? "..." : card.metric}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign Performance chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Campaign Performance</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {hasData ? `${totalWeekly} emails sent in the last 7 days` : "Send your first email to see performance data."}
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Last 7 days</span>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 || !hasData ? (
            <div className="h-56 flex flex-col items-center justify-center text-muted-foreground">
              <Activity className="h-10 w-10 mb-2 text-gray-300" />
              <p className="text-sm">No campaign data yet</p>
              <p className="text-xs mt-1">Emails you send will appear here.</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="Sent" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Sent" />
                  <Bar dataKey="Delivered" fill="#22c55e" radius={[3, 3, 0, 0]} name="Delivered" />
                  <Bar dataKey="Opened" fill="#a855f7" radius={[3, 3, 0, 0]} name="Opened" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quick links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((a) => (
              <Link key={a.label} href={a.href}>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                  <a.icon className="h-3.5 w-3.5 mr-2 shrink-0" />
                  {a.label}
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Deliverability */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Deliverability</CardTitle>
          </CardHeader>
          <CardContent>
            {deliverabilityScore !== null ? (
              <>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold">{deliverabilityScore}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
                <p className="text-xs text-green-600 mb-3">
                  {deliverabilityScore >= 80 ? "Your inbox placement is healthy." :
                   deliverabilityScore >= 50 ? "Room for improvement." :
                   "Needs attention."}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground mb-3">No data yet</p>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Circle className="h-2 w-2 fill-red-500 text-red-500" />
                  <span>Spam complaints</span>
                </div>
                <span className="font-medium">Low</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Circle className={`h-2 w-2 ${hasData && stats.bounceRate > 5 ? "fill-orange-400 text-orange-400" : "fill-green-500 text-green-500"}`} />
                  <span>Bounce rate</span>
                </div>
                <span className="font-medium">{hasData ? `${stats.bounceRate}%` : "—"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                  <span>Domain auth</span>
                </div>
                <span className="font-medium">Verified</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length > 0 && hasData ? (
              <>
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline}>
                      <defs>
                        <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="Sent" stroke="#3b82f6" fill="url(#weeklyGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total sent</span>
                    <span className="font-medium">{totalWeekly}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Avg per day</span>
                    <span className="font-medium">{Math.round(totalWeekly / timeline.length)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-20 flex items-center justify-center text-muted-foreground text-xs">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 shrink-0" />
              <div className="text-xs">
                <p className="font-medium">Email Service</p>
                <p className="text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 shrink-0" />
              <div className="text-xs">
                <p className="font-medium">API</p>
                <p className="text-muted-foreground">All systems normal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 shrink-0" />
              <div className="text-xs">
                <p className="font-medium">Domain</p>
                <p className="text-muted-foreground">xyberclan.dev verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </PageTransition>
  );
}
