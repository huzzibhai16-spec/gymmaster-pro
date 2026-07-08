import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Users, TrendingUp, UserPlus, UserX, Wallet, CalendarCheck, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useMembers, useDashboardStats, useRevenueData, useAttendance, formatPKR } from "@/hooks/use-data";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — GymOS" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: revenueData, isLoading: revenueLoading } = useRevenueData();
  const { data: todayAttendance } = useAttendance();

  const isLoading = membersLoading || statsLoading || revenueLoading;

  const newThisMonth = (members || []).filter(m => {
    const d = (Date.now() - new Date(m.joining_date).getTime()) / 86400000;
    return d < 30;
  }).length;

  const weeklyRevenue = revenueData?.daily.slice(-7).reduce((s, d) => s + d.revenue, 0) || 0;
  const weeklyAttendance = 0; // Would need to aggregate attendance for the week

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" description="Snapshot views of daily, weekly and monthly performance." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

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
            <StatCard icon={Wallet} label="Revenue" value={formatPKR(stats?.todayRevenue || 0)} tone="gold" />
            <StatCard icon={CalendarCheck} label="Attendance" value={(todayAttendance?.length || 0).toString()} tone="success" />
            <StatCard icon={UserPlus} label="New Members" value={newThisMonth.toString()} tone="gold" />
            <StatCard icon={Users} label="Active" value={(stats?.activeMembers || 0).toString()} tone="success" />
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Wallet} label="Weekly Revenue" value={formatPKR(weeklyRevenue)} tone="gold" />
            <StatCard icon={CalendarCheck} label="Attendance" value="—" tone="success" />
            <StatCard icon={UserPlus} label="New Members" value={newThisMonth.toString()} tone="gold" />
            <StatCard icon={UserX} label="Inactive" value={(stats?.inactiveMembers || 0).toString()} tone="danger" />
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Wallet} label="Monthly Revenue" value={formatPKR(stats?.monthlyRevenue || 0)} tone="gold" />
            <StatCard icon={Users} label="Active Members" value={(stats?.activeMembers || 0).toString()} tone="success" />
            <StatCard icon={UserPlus} label="New Members" value={newThisMonth.toString()} tone="gold" />
            <StatCard icon={TrendingUp} label="YTD Revenue" value={formatPKR(revenueData?.yearlyRevenueTotal || 0)} tone="success" />
          </div>
        </TabsContent>
      </Tabs>

      <div className="glass rounded-2xl p-5">
        <h3 className="text-base font-semibold mb-4">Revenue Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData?.yearly || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
          <div className="text-3xl font-semibold text-[color:var(--warning)]">{formatPKR(stats?.pendingDuesTotal || 0)}</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-base font-semibold mb-1">Monthly Expenses</h3>
          <p className="text-sm text-muted-foreground mb-4">Operating costs this month.</p>
          <div className="text-3xl font-semibold text-destructive">{formatPKR(stats?.monthlyExpenses || 0)}</div>
        </div>
      </div>
    </div>
  );
}
