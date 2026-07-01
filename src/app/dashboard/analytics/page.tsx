"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { StatCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton";
import {
  Mail, Send, Eye, AlertTriangle, Users, TrendingUp, MousePointerClick,
  BarChart3, Activity, Target, CheckCircle2, XCircle,
  Download, Percent, Hash, FileDown,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
} from "recharts";
import { PageTransition } from "@/components/page-transition";

const COLORS = ["#7c3aed", "#22c55e", "#a78bfa", "#ef4444", "#eab308", "#f97316", "#06b6d4"];

function fmt(n: number | undefined | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}
function pct(n: number | undefined | null): string {
  if (n == null || n === 0) return "—";
  return `${n}%`;
}

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/80 backdrop-blur-xl p-4 shadow-sm transition-all hover:shadow-md">
      <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase mb-2">{label}</p>
      <p className="text-xl font-bold tracking-tight">{value}</p>
      <div className={`mt-2 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

function ChartCard({ title, icon: Icon, iconColor, children, height = "h-56" }: { title: string; icon: any; iconColor: string; children: React.ReactNode; height?: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-2">
        <h3 className="text-xs font-semibold flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          {title}
        </h3>
      </div>
      <div className="px-5 pb-5">
        {children}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/analytics/detailed")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); setData(null); }
        else setData(d);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load analytics"); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    if (!data || !hasData) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Emails", String(t?.total ?? 0)],
      ["Sent", String(t?.sent ?? 0)],
      ["Delivered", String(t?.delivered ?? 0)],
      ["Bounced", String(t?.bounced ?? 0)],
      ["Opened", String(t?.opened ?? 0)],
      ["Clicked", String(t?.clicked ?? 0)],
      ["Delivery Rate (%)", String(r?.deliveryRate ?? 0)],
      ["Open Rate (%)", String(r?.openRate ?? 0)],
      ["Click Rate (%)", String(r?.clickRate ?? 0)],
      ["Bounce Rate (%)", String(r?.bounceRate ?? 0)],
      ["Contacts", String(data?.contacts ?? 0)],
      ["Week Volume", String(data?.week?.sent ?? 0)],
      ["", ""],
      ["Daily Breakdown", "Sent,Delivered,Opened,Bounced"],
      ...timeline.map((d: any) => [`${d.day}`, `${d.sent},${d.delivered},${d.opened},${d.bounced}`]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  return (
    <PageTransition>
      <div className="space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {hasData
                ? `${fmt(t.sent)} emails sent · ${fmt(data.contacts)} contacts · ${pct(r.openRate)} open rate`
                : "Start sending emails to see detailed analytics"}
            </p>
          </div>
          {hasData && !loading && (
            <Button variant="outline" size="sm" className="rounded-xl h-9" onClick={exportCSV}>
              <FileDown className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          )}
        </div>

        {error && !loading && <ErrorBanner message={error} onRetry={load} />}

        {/* 7 KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {loading ? (
            Array.from({ length: 7 }).map((_, i) => <div key={i} className="rounded-xl border border-border/40 bg-card/80 p-4"><StatCardSkeleton /></div>)
          ) : (
            <>
              {[
                ["Total Sent", fmt(t?.sent), Mail, "text-muted-foreground/60"],
                ["Delivered", fmt(t?.delivered), CheckCircle2, "text-emerald-600"],
                ["Opened", fmt(t?.opened), Eye, "text-purple-600"],
                ["Clicked", fmt(t?.clicked), MousePointerClick, "text-violet-600"],
                ["Bounced", fmt(t?.bounced), XCircle, "text-red-500"],
                ["Contacts", fmt(data?.contacts), Users, "text-muted-foreground/60"],
                ["This Week", fmt(data?.week?.sent), Activity, "text-violet-500"],
              ].map(([label, value, Icon, color]) => (
                <KpiCard key={label as string} label={label as string} value={value as string} icon={Icon} color={color as string} />
              ))}
            </>
          )}
        </div>

        {/* Row 1: Timeline + Delivery pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <ChartCard title="Daily Email Volume (7 days)" icon={BarChart3} iconColor="text-violet-500" height="h-56">
            {loading ? <ChartSkeleton /> : timeline.length === 0 || !hasData ? (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "11px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }} />
                    <Bar dataKey="sent" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Sent" stackId="a" />
                    <Bar dataKey="delivered" fill="#22c55e" radius={[4, 4, 0, 0]} name="Delivered" stackId="a" />
                    <Bar dataKey="bounced" fill="#ef4444" radius={[4, 4, 0, 0]} name="Bounced" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Delivery Breakdown" icon={Download} iconColor="text-orange-500">
            {loading ? <ChartSkeleton /> : deliveryPie.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={deliveryPie} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                        {deliveryPie.map((_, i) => <Cell key={i} fill={[COLORS[1], COLORS[3], COLORS[4]][i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "11px" }} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-1">
                  {deliveryPie.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: [COLORS[1], COLORS[3], COLORS[4]][i] }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </ChartCard>
        </div>

        {/* Row 2: Engagement rate trend + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <ChartCard title="Engagement Rate Trend" icon={TrendingUp} iconColor="text-emerald-500">
            {loading ? <ChartSkeleton /> : timeline.length === 0 || !hasData ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "11px" }} />
                    <Line type="monotone" dataKey="Open Rate" stroke="#a855f7" strokeWidth={2} dot={{ r: 2 }} name="Open Rate" />
                    <Line type="monotone" dataKey="Bounce Rate" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name="Bounce Rate" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Engagement Funnel" icon={Target} iconColor="text-purple-500">
            {loading ? (
              <div className="h-48 space-y-4 pt-2"><ChartSkeleton /></div>
            ) : !hasData ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <div className="space-y-3 pt-1">
                {[
                  { label: "Sent", value: t.sent, pct: 100, color: "bg-violet-500" },
                  { label: "Delivered", value: t.delivered, pct: r?.deliveryRate || 0, color: "bg-emerald-500" },
                  { label: "Opened", value: t.opened, pct: t.delivered ? Math.round((t.opened / t.delivered) * 100) : 0, color: "bg-purple-500" },
                  { label: "Clicked", value: t.clicked, pct: t.opened ? Math.round((t.clicked / t.opened) * 100) : 0, color: "bg-orange-500" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{s.label}</span>
                      <span className="flex gap-2"><span>{fmt(s.value)}</span><span className="text-muted-foreground">{s.pct}%</span></span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${Math.max(s.pct, 2)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Row 3: Rates + By type + Weekly */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <ChartCard title="Key Rates" icon={Percent} iconColor="text-emerald-500">
            {loading ? <StatCardSkeleton /> : (
              <div className="space-y-3.5 pt-1">
                {[
                  { label: "Delivery Rate", value: pct(r?.deliveryRate), icon: CheckCircle2, color: "text-emerald-600" },
                  { label: "Open Rate", value: pct(r?.openRate), icon: Eye, color: "text-purple-600" },
                  { label: "Click Rate", value: pct(r?.clickRate), icon: MousePointerClick, color: "text-violet-600" },
                  { label: "Bounce Rate", value: pct(r?.bounceRate), icon: XCircle, color: "text-red-500" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                    </div>
                    <span className="text-sm font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title="By Type" icon={Hash} iconColor="text-cyan-500">
            {loading ? <StatCardSkeleton /> : !data?.byType || Object.keys(data.byType).length === 0 ? (
              <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <div className="space-y-3 pt-1">
                {Object.entries(data.byType).map(([type, count], i) => (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-muted-foreground">{type.replace("_", " ")}</span>
                      <span className="font-medium">{fmt(count as number)}</span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length], width: `${Math.max((count as number) / (data?.totals?.total || 1) * 100, 2)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title="Weekly Trend" icon={Activity} iconColor="text-violet-500">
            {loading ? <StatCardSkeleton /> : timeline.length === 0 || !hasData ? (
              <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <>
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline}>
                      <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={0.25} /><stop offset="100%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient></defs>
                      <Area type="monotone" dataKey="sent" stroke="#7c3aed" fill="url(#tg)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">This week</span><span className="font-medium">{fmt(data?.week?.sent)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Daily avg</span><span className="font-medium">{data?.week?.avgPerDay || 0}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Delivered</span><span className="font-medium">{fmt(data?.week?.delivered)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Opened</span><span className="font-medium">{fmt(data?.week?.opened)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Bounced</span><span className="font-medium">{fmt(data?.week?.bounced)}</span></div>
                </div>
              </>
            )}
          </ChartCard>
        </div>

        {/* Full report table */}
        {hasData && !loading && (
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Full Report</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
                <div key={label as string} className="flex justify-between items-center px-3 py-2 rounded-lg bg-muted/30 border border-border/20">
                  <span className="text-xs text-muted-foreground">{label as string}</span>
                  <span className="text-xs font-semibold">{value as string}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
