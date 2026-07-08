import { createFileRoute } from "@tanstack/react-router";
import { Users, UserCheck, UserX, Wallet, CalendarClock, AlertTriangle, TrendingUp, Bell } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import {
  MEMBERS, MONTHLY_REVENUE, totalMembers, activeMembers, inactiveMembers, expiringSoon,
  pendingDuesTotal, pendingDuesCount, todaysRevenue, yesterdayRevenue, monthlyRevenueTotal,
  formatPKR, initials, formatDate,
} from "@/lib/mock-data";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GymOS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const today = todaysRevenue();
  const yest = yesterdayRevenue();
  const trend = ((today - yest) / yest) * 100;

  const actions = [
    { icon: Wallet, tone: "warning" as const, title: `Collect payments from ${pendingDuesCount()} members`, desc: `${formatPKR(pendingDuesTotal())} outstanding across active plans.` },
    { icon: CalendarClock, tone: "danger" as const, title: `${expiringSoon()} memberships expire this week`, desc: "Reach out for renewals before they lapse." },
    { icon: UserX, tone: "warning" as const, title: `${MEMBERS.filter(m => (Date.now() - new Date(m.lastVisit).getTime()) / 86400000 > 30).length} members haven't visited in 30+ days`, desc: "Consider a win-back message or free session." },
    { icon: TrendingUp, tone: trend >= 0 ? "success" as const : "danger" as const, title: trend >= 0 ? `Revenue up ${trend.toFixed(1)}% vs yesterday` : `Revenue down ${Math.abs(trend).toFixed(1)}% vs yesterday`, desc: `Today ${formatPKR(today)} · Yesterday ${formatPKR(yest)}` },
    { icon: AlertTriangle, tone: "danger" as const, title: "3 members flagged with unpaid dues over 30 days", desc: "Fines have been automatically applied." },
  ];

  const recent = [...MEMBERS].slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"} — here's what's happening today.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={totalMembers().toString()} tone="gold" trend={4.2} hint="All-time roster" />
        <StatCard icon={UserCheck} label="Active Members" value={activeMembers().toString()} tone="success" trend={2.1} />
        <StatCard icon={UserX} label="Inactive Members" value={inactiveMembers().toString()} tone="danger" trend={-1.4} />
        <StatCard icon={Wallet} label="Today's Revenue" value={formatPKR(today)} tone="gold" trend={trend} />
        <StatCard icon={TrendingUp} label="Monthly Revenue" value={formatPKR(MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].revenue)} tone="success" trend={8.6} />
        <StatCard icon={AlertTriangle} label="Pending Dues" value={formatPKR(pendingDuesTotal())} tone="warning" hint={`${pendingDuesCount()} members`} />
        <StatCard icon={CalendarClock} label="Expiring Soon" value={expiringSoon().toString()} tone="warning" hint="Next 7 days" />
        <StatCard icon={TrendingUp} label="Yearly Revenue" value={formatPKR(monthlyRevenueTotal())} tone="gold" trend={12.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground">Monthly revenue overview</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">This Year</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_REVENUE} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.82 0.145 88)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.82 0.145 88)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.72 0.012 80)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.72 0.012 80)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.19 0.007 65)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "oklch(0.72 0.012 80)" }}
                  formatter={(v: number) => [formatPKR(v), "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="oklch(0.82 0.145 88)" strokeWidth={2} fill="url(#goldFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Center */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Action Center</h3>
            </div>
            <Badge variant="outline" className="text-[10px]">{actions.length} tasks</Badge>
          </div>
          <div className="space-y-2.5 max-h-80 overflow-auto pr-1">
            {actions.map((a, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                <div className={`h-8 w-8 shrink-0 rounded-lg grid place-items-center ${
                  a.tone === "danger" ? "bg-destructive/10 text-destructive" :
                  a.tone === "warning" ? "bg-[color:var(--warning)]/10 text-[color:var(--warning)]" :
                  "bg-[color:var(--success)]/10 text-[color:var(--success)]"
                }`}>
                  <a.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight">{a.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent members */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Recently Added Members</h3>
          <a href="/members" className="text-xs text-primary hover:underline">View all</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recent.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-primary/30 transition-colors">
              <div className="h-10 w-10 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: m.photo }}>
                {initials(m.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.plan} · Joined {formatDate(m.joinDate)}</div>
              </div>
              <Badge className={
                m.status === "Active" ? "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20" :
                m.status === "Expiring" ? "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20" :
                "bg-destructive/10 text-destructive border-destructive/20"
              } variant="outline">{m.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
