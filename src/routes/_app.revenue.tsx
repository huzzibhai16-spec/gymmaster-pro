import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { TrendingUp, Calendar, CalendarDays, CalendarRange, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRevenueData, useDashboardStats, formatDate, formatPKR } from "@/hooks/use-data";

export const Route = createFileRoute("/_app/revenue")({
  head: () => ({ meta: [{ title: "Revenue — GymOS" }] }),
  component: RevenuePage,
});

function RevenuePage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: revenueData, isLoading: revenueLoading } = useRevenueData();

  const isLoading = statsLoading || revenueLoading;
  const yearly = revenueData?.yearly || [];
  const maxMonth = Math.max(...yearly.map(m => m.revenue), 1);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Revenue" description="Track cash flow across days, weeks, months and the year." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Revenue" description="Track cash flow across days, weeks, months and the year." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Today" value={formatPKR(stats?.todayRevenue || 0)} tone="gold" />
        <StatCard icon={CalendarDays} label="This Week" value={formatPKR(revenueData?.daily.slice(-7).reduce((s, d) => s + d.revenue, 0) || 0)} tone="success" />
        <StatCard icon={CalendarRange} label="This Month" value={formatPKR(stats?.monthlyRevenue || 0)} tone="gold" />
        <StatCard icon={TrendingUp} label="This Year" value={formatPKR(revenueData?.yearlyRevenueTotal || 0)} tone="success" />
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">Monthly Revenue</h3>
            <p className="text-xs text-muted-foreground">Performance across the current year</p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">PKR</Badge>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="oklch(0.72 0.012 80)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.72 0.012 80)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                contentStyle={{ background: "oklch(0.19 0.007 65)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [formatPKR(v), "Revenue"]}
              />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                {yearly.map((m, i) => (
                  <Cell key={i} fill={m.revenue === maxMonth ? "oklch(0.82 0.145 88)" : "oklch(0.82 0.145 88 / 0.35)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">Daily Sales History</h3>
            <p className="text-xs text-muted-foreground">Last 14 days</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/60 overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Payments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(revenueData?.daily || []).reverse().map((d) => (
                <TableRow key={d.date} className="hover:bg-muted/20">
                  <TableCell className="text-sm">{formatDate(d.date)}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-primary">{formatPKR(d.revenue)}</TableCell>
                  <TableCell className="text-right text-sm">{d.payments}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
