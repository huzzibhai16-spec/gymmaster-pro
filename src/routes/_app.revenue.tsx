import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DAILY_SALES, MONTHLY_REVENUE, formatDate, formatPKR, todaysRevenue, weeklyRevenue, monthlyRevenueTotal } from "@/lib/mock-data";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { TrendingUp, Calendar, CalendarDays, CalendarRange } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/revenue")({
  head: () => ({ meta: [{ title: "Revenue — GymOS" }] }),
  component: RevenuePage,
});

function RevenuePage() {
  const year = monthlyRevenueTotal();
  const month = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].revenue;
  const week = weeklyRevenue();
  const today = todaysRevenue();
  const maxMonth = Math.max(...MONTHLY_REVENUE.map(m => m.revenue));

  return (
    <div className="space-y-6">
      <PageHeader title="Revenue" description="Track cash flow across days, weeks, months and the year." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Today" value={formatPKR(today)} tone="gold" trend={5.2} />
        <StatCard icon={CalendarDays} label="This Week" value={formatPKR(week)} tone="success" trend={3.1} />
        <StatCard icon={CalendarRange} label="This Month" value={formatPKR(month)} tone="gold" trend={8.6} />
        <StatCard icon={TrendingUp} label="This Year" value={formatPKR(year)} tone="success" trend={14.9} />
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
            <BarChart data={MONTHLY_REVENUE} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="oklch(0.72 0.012 80)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.72 0.012 80)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                contentStyle={{ background: "oklch(0.19 0.007 65)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [formatPKR(v), "Revenue"]}
              />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                {MONTHLY_REVENUE.map((m, i) => (
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
                <TableHead className="text-right">Members Joined</TableHead>
                <TableHead>Payment Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...DAILY_SALES].reverse().map((d) => (
                <TableRow key={d.date} className="hover:bg-muted/20">
                  <TableCell className="text-sm">{formatDate(d.date)}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-primary">{formatPKR(d.revenue)}</TableCell>
                  <TableCell className="text-right text-sm">{d.joined}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={d.method === "Cash" ? "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20" : "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20"}>
                      {d.method}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
