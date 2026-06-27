"use client";
import { PageTransition } from "@/components/page-transition";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Plus, TrendingUp, TrendingDown, Users, Send, Eye, AlertTriangle, Megaphone, FileText, Zap, Upload, Edit, BarChart3, Circle } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";

interface OverviewStats {
  totalContacts: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalBounced: number;
  openRate: number;
  bounceRate: number;
}

const campaignData = [
  { day: "Feb 7", Revenue: 2400, "Click Rate": 2.4, Unsubscribes: 0.1 },
  { day: "Feb 8", Revenue: 1398, "Click Rate": 3.2, Unsubscribes: 0.2 },
  { day: "Feb 9", Revenue: 9800, "Click Rate": 4.1, Unsubscribes: 0.05 },
  { day: "Feb 10", Revenue: 3908, "Click Rate": 3.8, Unsubscribes: 0.3 },
  { day: "Feb 11", Revenue: 4800, "Click Rate": 2.9, Unsubscribes: 0.15 },
  { day: "Feb 12", Revenue: 3800, "Click Rate": 5.0, Unsubscribes: 0.08 },
  { day: "Feb 13", Revenue: 4300, "Click Rate": 4.3, Unsubscribes: 0.12 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/overview")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sentDisplay = stats?.totalSent ? (stats.totalSent >= 1000 ? `${(stats.totalSent / 1000).toFixed(1)}k` : String(stats.totalSent)) : "0";
  const newSubsDisplay = stats?.totalContacts ? `+${stats.totalContacts}` : "+0";

  const statCards = [
    {
      title: "Emails Sent",
      metric: loading ? "..." : sentDisplay,
      trend: { direction: "up" as const, percentage: "+6.3%" },
      color: "green",
      icon: Send,
    },
    {
      title: "Open Rate",
      metric: loading ? "..." : `${stats?.openRate ?? 0}%`,
      trend: { direction: (stats?.openRate ?? 0) > 0 ? ("up" as const) : ("down" as const), percentage: stats && stats.openRate > 30 ? `+${stats.openRate.toFixed(1)}%` : "-27%" },
      color: (stats?.openRate ?? 0) > 30 ? "green" : "red",
      icon: Eye,
    },
    {
      title: "New Subscribers",
      metric: loading ? "..." : newSubsDisplay,
      trend: { direction: "up" as const, percentage: "+12%" },
      color: "green",
      icon: Users,
    },
    {
      title: "Bounce Rate",
      metric: loading ? "..." : `${stats?.bounceRate ?? 0}%`,
      trend: { direction: (stats?.bounceRate ?? 0) > 0 ? ("down" as const) : ("up" as const), percentage: stats && stats.bounceRate > 0 ? `+${stats.bounceRate.toFixed(1)}%` : "0%" },
      color: (stats?.bounceRate ?? 0) > 5 ? "red" : "green",
      icon: AlertTriangle,
    },
  ];

  const quickActions = [
    { label: "Create Campaign", icon: Plus },
    { label: "Import Contacts", icon: Upload },
    { label: "Design Template", icon: Edit },
    { label: "View Reports", icon: BarChart3 },
  ];

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

      {/* Top row: Quick actions + stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick actions</CardTitle>
            <p className="text-xs text-muted-foreground">You can quick action at a time.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((a) => (
                <Button key={a.label} variant="outline" size="sm" className="justify-start h-auto py-2 px-3 text-xs">
                  <a.icon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  {a.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold">{card.metric}</p>
                  <div className={`flex items-center gap-1 text-xs ${card.color === "green" ? "text-green-600" : "text-red-500"}`}>
                    {card.trend.direction === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{card.trend.percentage}</span>
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl ${card.color === "green" ? "bg-green-50" : "bg-red-50"}`}>
                  <card.icon className={`h-5 w-5 ${card.color === "green" ? "text-green-600" : "text-red-500"}`} />
                </div>
              </div>
              {/* Mini sparkline area */}
              <div className="mt-3 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={campaignData}>
                    <defs>
                      <linearGradient id={`grad-${card.title}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={card.color === "green" ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={card.color === "green" ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="Revenue" stroke={card.color === "green" ? "#22c55e" : "#ef4444"} fillOpacity={1} fill={`url(#grad-${card.title})`} strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle row: Campaign Performance line chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Campaign Performance</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor how your latest sends are performing in real time.</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Last 07 days</span>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line yAxisId="left" type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="Click Rate" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Click Rate" />
                <Line yAxisId="right" type="monotone" dataKey="Unsubscribes" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Unsubscribes" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom row: 4 widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Automations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Automations</CardTitle>
            <p className="text-xs text-muted-foreground">Automated journeys working behind the scenes.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Welcome Series</span>
                <span className="font-medium">54%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "54%" }} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">3 step email</p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Re-Engagement Flow</span>
                <span className="font-medium">27%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full" style={{ width: "27%" }} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Open rate</p>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs">Manage Automations</Button>
          </CardContent>
        </Card>

        {/* Reputation Score gauge */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reputation Score</CardTitle>
            <p className="text-xs text-muted-foreground">See your details reputation score.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-14 overflow-hidden">
                <svg viewBox="0 0 120 60" className="w-28 h-14">
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                  <path d="M10 55 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeLinecap="round" />
                  <path d="M10 55 A 50 50 0 0 1 110 55" fill="none" stroke="url(#gaugeGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray="282.7" strokeDashoffset="56.5" />
                  <line x1="60" y1="55" x2="88" y2="20" stroke="#22c55e" strokeWidth="2" />
                  <circle cx="88" cy="20" r="3" fill="#22c55e" />
                </svg>
              </div>
              <p className="text-2xl font-bold mt-1">{stats?.openRate ? `${Math.round(stats.openRate)}%` : "85.2%"}</p>
              <p className="text-xs text-green-600 font-medium">Good!</p>
              <p className="text-[10px] text-muted-foreground text-center mt-2 leading-tight">
                Reputation Score are auto generate based on recent engagements.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Deliverability Score */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Deliverability Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-bold">{stats?.totalDelivered && stats?.totalSent ? Math.round((stats.totalDelivered / stats.totalSent) * 100) : 82}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <p className="text-xs text-green-600 mb-3">Your inbox placement is healthy.</p>
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
                  <Circle className="h-2 w-2 fill-orange-400 text-orange-400" />
                  <span>Bounce rate</span>
                </div>
                <span className="font-medium">{stats?.bounceRate ? `${stats.bounceRate.toFixed(1)}%` : "Stable"}</span>
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

        {/* Schedule Campaign timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Schedule Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">7 Feb 2024 - 10 Feb 2024</p>
            <div className="space-y-4">
              <div className="relative pl-5 border-l-2 border-blue-500">
                <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-blue-500" />
                <p className="text-[10px] text-muted-foreground">Today — 07:00 - 11:00 AM</p>
                <p className="text-sm font-medium">Winter Sale Launch</p>
              </div>
              <div className="relative pl-5 border-l-2 border-orange-400">
                <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-orange-400" />
                <p className="text-[10px] text-muted-foreground">Sun 8 February — 08:00 - 12:00 AM</p>
                <p className="text-sm font-medium">New Arrivals Announcement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </PageTransition>
  );
}
