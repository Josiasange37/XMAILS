"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, Mail, Send, Eye, AlertTriangle, Users, TrendingUp, MousePointerClick } from "lucide-react";

interface OverviewStats {
  totalContacts: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalBounced: number;
  openRate: number;
  bounceRate: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    fetch("/api/analytics/overview")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); });
  }, []);

  const statCards = [
    { title: "Total Contacts", value: stats?.totalContacts ?? 0, icon: Users, color: "text-foreground", bg: "bg-muted" },
    { title: "Emails Sent", value: stats?.totalSent ?? 0, icon: Send, color: "text-green-600", bg: "bg-green-50" },
    { title: "Delivered", value: stats?.totalDelivered ?? 0, icon: Mail, color: "text-teal-600", bg: "bg-teal-50" },
    { title: "Opened", value: stats?.totalOpened ?? 0, icon: Eye, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Bounced", value: stats?.totalBounced ?? 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Email performance and engagement metrics</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview" isActive={tab === "overview"} onClick={() => setTab("overview")}>Overview</TabsTrigger>
          <TabsTrigger value="engagement" isActive={tab === "engagement"} onClick={() => setTab("engagement")}>Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statCards.map((card) => (
              <Card key={card.title}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {loading ? "..." : card.value?.toLocaleString()}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${card.bg}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Open Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-5xl font-bold text-foreground">{loading ? "..." : `${stats?.openRate ?? 0}%`}</p>
                  <p className="text-muted-foreground mt-2">of delivered emails were opened</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Bounce Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-5xl font-bold text-foreground">{loading ? "..." : `${stats?.bounceRate ?? 0}%`}</p>
                  <p className="text-muted-foreground mt-2">of sent emails bounced</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4 dark:text-gray-600" />
              <p className="text-muted-foreground text-lg">Detailed engagement analytics coming soon</p>
              <p className="text-muted-foreground text-sm mt-2">Track opens, clicks, and conversions over time</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
