import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { MEMBERS, MONTHLY_REVENUE, activeMembers, formatPKR, monthlyRevenueTotal, pendingDuesTotal, todaysRevenue, weeklyRevenue } from "@/lib/mock-data";
import { Users, TrendingUp, UserPlus, UserX, Wallet, CalendarCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — GymOS" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const newThisMonth = MEMBERS.filter(m => {
    const d = (Date.now() - new Date(m.joinDate).getTime()) / 86400000;
    return d < 30;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Snapshot views of daily, weekly and monthly performance."
        actions={<Button variant="outline"><Download className="h-4 w-4 mr-1" /> Export</Button>}
      />

      <Tabs defaultValue="today">
        <TabsList className="bg-muted/40">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Wallet} label="Revenue" value={formatPKR(todaysRevenue())} tone="gold" trend={5.2} />
            <StatCard icon={CalendarCheck} label="Attendance" value="47" tone="success" />
            <StatCard icon={UserPlus} label="New Members" value="3" tone="gold" />
            <StatCard icon={Users} label="Renewals" value="2" tone="success" />
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Wallet} label="Weekly Revenue" value={formatPKR(weeklyRevenue())} tone="gold" trend={3.4} />
            <StatCard icon={CalendarCheck} label="Attendance" value="284" tone="success" />
            <StatCard icon={UserPlus} label="New Members" value="12" tone="gold" />
            <StatCard icon={UserX} label="Inactive" value="8" tone="danger" />
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Wallet} label="Monthly Revenue" value={formatPKR(MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].revenue)} tone="gold" trend={8.6} />
            <StatCard icon={Users} label="Active Members" value={activeMembers().toString()} tone="success" />
            <StatCard icon={UserPlus} label="New Members" value={newThisMonth.toString()} tone="gold" />
            <StatCard icon={TrendingUp} label="YTD Revenue" value={formatPKR(monthlyRevenueTotal())} tone="success" />
          </div>
        </TabsContent>
      </Tabs>

      <div className="glass rounded-2xl p-5">
        <h3 className="text-base font-semibold mb-4">Revenue Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MONTHLY_REVENUE} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="oklch(0.72 0.012 80)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.72 0.012 80)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "oklch(0.19 0.007 65)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [formatPKR(v), "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="oklch(0.82 0.145 88)" strokeWidth={2.5} dot={{ r: 4, fill: "oklch(0.82 0.145 88)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-base font-semibold mb-1">Pending Payments</h3>
          <p className="text-sm text-muted-foreground mb-4">Total outstanding across members.</p>
          <div className="text-3xl font-semibold text-[color:var(--warning)]">{formatPKR(pendingDuesTotal())}</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-base font-semibold mb-1">Membership Renewals</h3>
          <p className="text-sm text-muted-foreground mb-4">Members renewed in the last 30 days.</p>
          <div className="text-3xl font-semibold text-[color:var(--success)]">{Math.floor(activeMembers() * 0.18)}</div>
        </div>
      </div>
    </div>
  );
}
