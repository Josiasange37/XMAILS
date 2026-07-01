"use client";
import { PageTransition } from "@/components/page-transition";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { StatCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton";
import { Plus, Send, Eye, AlertTriangle, Mail, Activity, Circle, CheckCircle2, ArrowRight, BarChart3, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface TimelineDay {
  day: string;
  Sent: number;
  Delivered: number;
  Opened: number;
  Bounced: number;
}

function StatCard({ title, metric, icon: Icon, highlight }: { title: string; metric: string; icon: any; highlight?: "good" | "bad" | "none" }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{title}</span>
        <div className={`p-2 rounded-xl ${
          highlight === "good" ? "bg-emerald-50 dark:bg-emerald-900/20" :
          highlight === "bad" ? "bg-red-50 dark:bg-red-900/20" :
          "bg-muted/50"
        }`}>
          <Icon className={`h-4 w-4 ${
            highlight === "good" ? "text-emerald-600 dark:text-emerald-400" :
            highlight === "bad" ? "text-red-500 dark:text-red-400" :
            "text-muted-foreground"
          }`} />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{metric}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/analytics/overview").then((r) => r.json()).catch(() => ({ error: "Failed" })),
      fetch("/api/analytics/timeline").then((r) => r.json()).catch(() => ({ error: "Failed" })),
    ]).then(([overview, tl]) => {
      if (overview.error) { setError(overview.error); setStats(null); }
      else setStats(overview);
      if (tl.error || !tl.timeline) setTimeline([]);
      else setTimeline(tl.timeline);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const hasData = stats?.totalSent > 0;
  const sentDisplay = stats?.totalSent ? (stats.totalSent >= 1000 ? `${(stats.totalSent / 1000).toFixed(1)}k` : String(stats.totalSent)) : "0";
  const deliverabilityScore = hasData && stats.totalSent > 0 ? Math.round((stats.totalDelivered / stats.totalSent) * 100) : null;
  const totalWeekly = useMemo(() => timeline.reduce((s, d) => s + d.Sent, 0), [timeline]);

  return (
    <PageTransition>
      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor your email performance</p>
          </div>
          <Link href="/dashboard/emails/compose">
            <Button className="rounded-xl h-9 px-4 gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Compose</span>
            </Button>
          </Link>
        </div>

        {error && !loading && <ErrorBanner message={error} onRetry={load} />}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => <div key={i} className="rounded-2xl border border-border/40 bg-card/80 p-5"><StatCardSkeleton /></div>)}
            </>
          ) : (
            <>
              <StatCard title="Sent" metric={sentDisplay} icon={Send} highlight={hasData ? "good" : "none"} />
              <StatCard title="Delivered" metric={hasData ? String(stats.totalDelivered) : "—"} icon={Mail} highlight={hasData ? "good" : "none"} />
              <StatCard title="Open Rate" metric={hasData ? `${stats.openRate}%` : "—"} icon={Eye} highlight={hasData && stats.openRate > 30 ? "good" : stats.openRate > 0 && stats.openRate <= 30 ? "bad" : "none"} />
              <StatCard title="Bounce Rate" metric={hasData ? `${stats.bounceRate}%` : "—"} icon={AlertTriangle} highlight={hasData && stats.bounceRate > 5 ? "bad" : "good"} />
            </>
          )}
        </div>

        {/* Campaign Performance chart */}
        <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Campaign Performance
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasData ? `${totalWeekly} emails sent in the last 7 days` : "Your email activity will appear here"}
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">Last 7 days</span>
          </div>
          <div className="px-5 pb-5">
            {loading ? (
              <ChartSkeleton />
            ) : timeline.length === 0 || !hasData ? (
              <div className="h-56 flex flex-col items-center justify-center text-muted-foreground">
                <Activity className="h-8 w-8 mb-2 text-muted-foreground/40" />
                <p className="text-sm">No campaign data yet</p>
                <p className="text-xs mt-1 text-muted-foreground/60">Emails you send will appear here</p>
              </div>
            ) : (
              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.8} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", color: "hsl(var(--text))" }} />
                    <Bar dataKey="Sent" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Sent" />
                    <Bar dataKey="Delivered" fill="#22c55e" radius={[4, 4, 0, 0]} name="Delivered" />
                    <Bar dataKey="Opened" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Opened" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Quick Actions */}
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-3">Quick Actions</h3>
            <div className="space-y-1.5">
              {[
                { label: "Create Campaign", icon: Send, href: "/dashboard/broadcasts" },
                { label: "Import Contacts", icon: BarChart3, href: "/dashboard/contacts" },
                { label: "Design Template", icon: Activity, href: "/dashboard/templates" },
                { label: "View Reports", icon: TrendingUp, href: "/dashboard/analytics" },
              ].map((a) => (
                <Link key={a.label} href={a.href}>
                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer">
                    <a.icon className="h-4 w-4" />
                    <span>{a.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick-start checklist or Deliverability + Activity + Status */}
          {!hasData && !loading ? (
            <div className="lg:col-span-3 rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-5 shadow-sm">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-3">Quick Start</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: "Send your first email", href: "/dashboard/emails/compose", done: hasData },
                  { label: "Import contacts", href: "/dashboard/contacts", done: (stats?.totalContacts || 0) > 0 },
                  { label: "Create a broadcast", href: "/dashboard/broadcasts", done: false },
                  { label: "Design a template", href: "/dashboard/templates", done: false },
                ].map((s) => (
                  <Link key={s.label} href={s.href}>
                    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${s.done ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-border/40 hover:bg-muted/50"}`}>
                      {s.done ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={`text-sm flex-1 ${s.done ? "text-emerald-700 dark:text-emerald-300 line-through" : ""}`}>{s.label}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-3">Deliverability</h3>
                {deliverabilityScore !== null ? (
                  <>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-bold tracking-tight">{deliverabilityScore}</span>
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                    <p className={`text-xs mb-4 ${deliverabilityScore >= 80 ? "text-emerald-600 dark:text-emerald-400" : deliverabilityScore >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {deliverabilityScore >= 80 ? "Your inbox placement is healthy" :
                       deliverabilityScore >= 50 ? "Room for improvement" : "Needs attention"}
                    </p>
                  </>
                ) : <p className="text-sm text-muted-foreground mb-4">No data yet</p>}
                <div className="space-y-2.5">
                  {[
                    { label: "Spam complaints", status: "Low", color: "fill-emerald-500" },
                    { label: "Bounce rate", status: hasData ? `${stats.bounceRate}%` : "—", color: hasData && stats.bounceRate > 5 ? "fill-amber-400" : "fill-emerald-500" },
                    { label: "Domain auth", status: "Verified", color: "fill-emerald-500" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Circle className={`h-2 w-2 ${s.color} text-transparent`} />
                        <span className="text-muted-foreground">{s.label}</span>
                      </div>
                      <span className="font-medium">{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-3">Weekly Activity</h3>
                {timeline.length > 0 && hasData ? (
                  <>
                    <div className="h-16">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeline}>
                          <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                          <Area type="monotone" dataKey="Sent" stroke="hsl(var(--primary))" fill="url(#wg)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Total sent</span><span className="font-medium">{totalWeekly}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Avg per day</span><span className="font-medium">{Math.round(totalWeekly / Math.max(timeline.filter(d => d.Sent > 0).length, 1))}</span></div>
                    </div>
                  </>
                ) : <div className="h-16 flex items-center justify-center text-muted-foreground text-xs">No data yet</div>}
              </div>

              <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-3">System Status</h3>
                <div className="space-y-3">
                  {[
                    { label: "Email Service", status: "Operational" },
                    { label: "API", status: "All systems normal" },
                    { label: "Domain", status: "xmailo.com verified" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] shrink-0" />
                      <div className="text-xs">
                        <p className="font-medium text-foreground">{s.label}</p>
                        <p className="text-muted-foreground">{s.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
