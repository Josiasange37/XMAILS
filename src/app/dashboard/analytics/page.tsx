"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail, Send, Eye, AlertTriangle, Users, TrendingUp, MousePointerClick,
  BarChart3, PieChart, Activity, Target, ArrowUpRight, ArrowDownRight,
  Clock, Inbox, Smartphone, Monitor, Globe, Hash, CheckCircle2, XCircle,
  Download, TrendingDown, Percent,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#ef4444", "#eab308", "#f97316", "#06b6d4"];

function fmt(n: number | undefined | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

function pct(n: number | undefined | null): string {
  if (n == null || n === 0) return "—";
  return `${n}%`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/detailed")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const hasData = data?.totals?.total > 0;
  const t = data?.totals;
  const r = data?.rates;
  const timeline = data?.dailyTimeline || [];

  const deliveryPie = useMemo(() => {
    if (!t) return [];
    return [
      { name: "Delivered", value: t.delivered },
      { name: "Bounced", value: t.bounced },
      { name: "Pending", value: t.sent - t.delivered - t.bounced },
    ].filter((d) => d.value > 0);
  }, [t]);

  const engagementPie = useMemo(() => {
    if (!t) return [];
    return [
      { name: "Opened", value: t.opened },
      { name: "Clicked", value: t.clicked },
      { name: "No action", value: t.delivered - t.opened },
    ].filter((d) => d.value > 0);
  }, [t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            {hasData
              ? `${fmt(t.sent)} emails sent · ${fmt(data.contacts)} contacts · ${pct(r.openRate)} open rate`
              : "Start sending emails to see detailed analytics."}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Sent</p>
            <p className="text-xl font-bold mt-0.5">{fmt(t?.sent)}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-green-600">
              <Mail className="h-3 w-3" />
              <span>all time</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Delivered</p>
            <p className="text-xl font-bold mt-0.5 text-green-600">{fmt(t?.delivered)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {pct(r?.deliveryRate)} delivery rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Opened</p>
            <p className="text-xl font-bold mt-0.5 text-purple-600">{fmt(t?.opened)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {pct(r?.openRate)} open rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Clicked</p>
            <p className="text-xl font-bold mt-0.5 text-blue-600">{fmt(t?.clicked)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {pct(r?.clickRate)} click rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Bounced</p>
            <p className="text-xl font-bold mt-0.5 text-red-500">{fmt(t?.bounced)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {pct(r?.bounceRate)} bounce rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Contacts</p>
            <p className="text-xl font-bold mt-0.5">{fmt(data?.contacts)}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>in database</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">This Week</p>
            <p className="text-xl font-bold mt-0.5">{fmt(data?.week?.sent)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              ~{data?.week?.avgPerDay || 0}/day avg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Timeline + Delivery Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily timeline bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Daily Email Volume (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 || !hasData ? (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "11px",
                      }}
                    />
                    <Bar dataKey="sent" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Sent" stackId="a" />
                    <Bar dataKey="delivered" fill="#22c55e" radius={[2, 2, 0, 0]} name="Delivered" stackId="a" />
                    <Bar dataKey="bounced" fill="#ef4444" radius={[2, 2, 0, 0]} name="Bounced" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery breakdown pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-orange-500" />
              Delivery Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliveryPie.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={deliveryPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {deliveryPie.map((_, i) => (
                        <Cell key={i} fill={[COLORS[1], COLORS[3], COLORS[4]][i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "11px",
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-1">
              {deliveryPie.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: [COLORS[1], COLORS[3], COLORS[4]][i] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Open/Click rates + Engagement funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open & Click Rate line chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Engagement Rate Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 || !hasData ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "11px",
                      }}
                    />
                    <Line type="monotone" dataKey="Open Rate" stroke="#a855f7" strokeWidth={2} dot={{ r: 2 }} name="Open Rate" />
                    <Line type="monotone" dataKey="Bounce Rate" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name="Bounce Rate" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engagement funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Engagement Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasData ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {[
                  { label: "Sent", value: t.sent, pct: 100, color: "bg-blue-500" },
                  { label: "Delivered", value: t.delivered, pct: r?.deliveryRate || 0, color: "bg-green-500" },
                  { label: "Opened", value: t.opened, pct: data?.totals?.delivered ? Math.round((t.opened / t.delivered) * 100) : 0, color: "bg-purple-500" },
                  { label: "Clicked", value: t.clicked, pct: data?.totals?.opened ? Math.round((t.clicked / t.opened) * 100) : 0, color: "bg-orange-500" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{s.label}</span>
                      <span className="flex gap-2">
                        <span>{fmt(s.value)}</span>
                        <span className="text-muted-foreground">{s.pct}%</span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${Math.max(s.pct, 2)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3: Rate cards + By type + Weekly trend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Key rates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4 text-emerald-500" />
              Key Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Delivery Rate", value: pct(r?.deliveryRate), icon: CheckCircle2, color: "text-green-600" },
              { label: "Open Rate", value: pct(r?.openRate), icon: Eye, color: "text-purple-600" },
              { label: "Click Rate", value: pct(r?.clickRate), icon: MousePointerClick, color: "text-blue-600" },
              { label: "Bounce Rate", value: pct(r?.bounceRate), icon: XCircle, color: "text-red-500" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-sm">{s.label}</span>
                </div>
                <span className="text-sm font-bold">{s.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-cyan-500" />
              By Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.byType || Object.keys(data.byType).length === 0 ? (
              <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.byType).map(([type, count], i) => (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize">{type.replace("_", " ")}</span>
                      <span className="font-medium">{fmt(count as number)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length], width: `${Math.max((count as number) / (data?.totals?.total || 1) * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly trend sparkline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-500" />
              Weekly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 || !hasData ? (
              <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            ) : (
              <>
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="sent" stroke="#3b82f6" fill="url(#trendGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">This week</span>
                    <span className="font-medium">{fmt(data?.week?.sent)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Daily avg</span>
                    <span className="font-medium">{data?.week?.avgPerDay || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Delivered</span>
                    <span className="font-medium">{fmt(data?.week?.delivered)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Opened</span>
                    <span className="font-medium">{fmt(data?.week?.opened)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Bounced</span>
                    <span className="font-medium">{fmt(data?.week?.bounced)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom: All metrics flat table */}
      {hasData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Download className="h-4 w-4 text-gray-500" />
              Full Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                ["Total Emails", fmt(t.total)],
                ["Sent", fmt(t.sent)],
                ["Delivered", fmt(t.delivered)],
                ["Bounced", fmt(t.bounced)],
                ["Opened", fmt(t.opened)],
                ["Clicked", fmt(t.clicked)],
                ["Delivery Rate", pct(r?.deliveryRate)],
                ["Open Rate", pct(r?.openRate)],
                ["Click Rate", pct(r?.clickRate)],
                ["Bounce Rate", pct(r?.bounceRate)],
                ["Contacts", fmt(data?.contacts)],
                ["Week Volume", fmt(data?.week?.sent)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-muted pb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
