"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Plus, RefreshCw, ArrowLeft } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/emails"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Scheduled</h1>
            <p className="text-muted-foreground mt-1">Emails scheduled to send later</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchEmails}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? <div className="text-center py-12 text-muted-foreground">Loading...</div>
          : emails.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
              <p className="text-muted-foreground">No scheduled emails</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.subject}</TableCell>
                    <TableCell className="text-muted-foreground">{Array.isArray(e.to) ? e.to.join(", ") : e.to}</TableCell>
                    <TableCell><Badge variant="warning">{e.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(e.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
