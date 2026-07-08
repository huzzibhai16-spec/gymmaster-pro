import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, UserCheck, UserX, Wallet, CalendarClock, TriangleAlert as AlertTriangle, TrendingUp, Bell, UserPlus, ClipboardCheck, CreditCard, ChartBar as BarChart3, Activity, Heart, CircleCheck as CheckCircle2, Receipt } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { useDashboardStats, useMembers, usePayments, useRevenueData, formatPKR, initials, formatDate } from "@/hooks/use-data";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GymOS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: members } = useMembers();
  const { data: payments } = usePayments({ limit: 6 });
  const { data: revenueData } = useRevenueData();

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading your gym data…" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-2xl p-5 h-32 animate-pulse bg-muted/20" />
          ))}
        </div>
      </div>
    );
  }

  const inactive30 = members?.filter((m) => {
    if (!m.last_visit) return false;
    const days = Math.floor((Date.now() - new Date(m.last_visit).getTime()) / 86400000);
    return days > 30;
  }).length || 0;

  const expiringSoonCount = members?.filter((m) => {
    const days = Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 7;
  }).length || 0;

  const todaysTasks = [
    {
      icon: Wallet,
      tone: "warning" as const,
      title: `Collect payments from ${stats?.pendingDuesCount || 0} members`,
      desc: `${formatPKR(stats?.pendingDuesTotal || 0)} outstanding across active plans.`
    },
    {
      icon: CalendarClock,
      tone: "danger" as const,
      title: `${expiringSoonCount} memberships expire this week`,
      desc: "Reach out for renewals before they lapse."
    },
    {
      icon: UserX,
      tone: "warning" as const,
      title: `${inactive30} members haven't visited in 30+ days`,
      desc: "Consider a win-back message or free session."
    },
    {
      icon: TrendingUp,
      tone: "success" as const,
      title: `Monthly revenue: ${formatPKR(stats?.monthlyRevenue || 0)}`,
      desc: `Net profit: ${formatPKR(stats?.netProfit || 0)}`
    },
  ];

  const quickActions = [
    { icon: UserPlus, label: "Add Member", to: "/members" },
    { icon: ClipboardCheck, label: "Mark Attendance", to: "/attendance" },
    { icon: CreditCard, label: "Receive Payment", to: "/payments" },
    { icon: BarChart3, label: "View Reports", to: "/reports" },
  ];

  const recentMembers = members?.slice(0, 6) || [];
  const recentPaymentsList = payments?.slice(0, 6) || [];
  const recentAttendance = members
    ?.filter((m) => m.last_visit)
    .sort((a, b) => new Date(b.last_visit!).getTime() - new Date(a.last_visit!).getTime())
    .slice(0, 6) || [];

  const expiringList = members
    ?.filter((m) => {
      const days = Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / 86400000);
      return days >= -1 && days <= 14;
    })
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
    .slice(0, 6) || [];

  // Gym Health Score
  const total = stats?.totalMembers || 1;
  const activePct = ((stats?.activeMembers || 0) / total) * 100;
  const totalFees = members?.reduce((s, m) => s + m.monthly_fee, 0) || 1;
  const totalPaid = members?.reduce((s, m) => s + m.amount_paid, 0) || 0;
  const totalPending = members?.reduce((s, m) => s + m.pending_dues, 0) || 0;
  const collectionRate = (totalPaid / (totalPaid + totalPending || 1)) * 100;
  const attendanceHealth = 100 - (inactive30 / total) * 100;
  const retentionHealth = 100 - (expiringSoonCount / total) * 100;
  const healthScore = Math.round(activePct * 0.3 + collectionRate * 0.3 + attendanceHealth * 0.25 + retentionHealth * 0.15);
  const healthTone = healthScore >= 80 ? "success" : healthScore >= 60 ? "warning" : "danger";
  const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Healthy" : "Needs Attention";

  const healthBreakdown = [
    { label: "Active Members", value: Math.round(activePct) },
    { label: "Collection Rate", value: Math.round(collectionRate) },
    { label: "Attendance", value: Math.round(attendanceHealth) },
    { label: "Retention", value: Math.round(retentionHealth) },
  ];

  const randomColor = (id: string) => {
    const hash = id.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return `hsl(${hash % 360} 60% 55%)`;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"} — here's what's happening today.`}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="glass rounded-2xl p-4 flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 group"
          >
            <div className="h-10 w-10 rounded-xl grid place-items-center bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:bg-primary/15 transition-colors">
              <a.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">{a.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Quick action</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={(stats?.totalMembers || 0).toString()} tone="gold" hint="All-time roster" />
        <StatCard icon={UserCheck} label="Active Members" value={(stats?.activeMembers || 0).toString()} tone="success" />
        <StatCard icon={UserX} label="Inactive Members" value={(stats?.inactiveMembers || 0).toString()} tone="danger" />
        <StatCard icon={Wallet} label="Today's Revenue" value={formatPKR(stats?.todayRevenue || 0)} tone="gold" />
        <StatCard icon={TrendingUp} label="Monthly Revenue" value={formatPKR(stats?.monthlyRevenue || 0)} tone="success" />
        <StatCard icon={AlertTriangle} label="Pending Dues" value={formatPKR(stats?.pendingDuesTotal || 0)} tone="warning" hint={`${stats?.pendingDuesCount || 0} members`} />
        <StatCard icon={CalendarClock} label="Expiring Soon" value={expiringSoonCount.toString()} tone="warning" hint="Next 7 days" />
        <StatCard icon={Activity} label="Today's Attendance" value={(stats?.todayAttendance || 0).toString()} tone="success" />
      </div>

      {/* Revenue Trend */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">Revenue Trend</h3>
            <p className="text-xs text-muted-foreground">Monthly revenue overview</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">This Year</Badge>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData?.yearly || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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

      {/* Action Center + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Action Center */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Action Center</h3>
            </div>
            <Badge variant="outline" className="text-[10px]">{todaysTasks.length} tasks</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2 mb-3">Today's priority tasks</p>
          <div className="space-y-2.5 max-h-80 overflow-auto pr-1">
            {todaysTasks.map((a, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                <div className={cn(
                  "h-8 w-8 shrink-0 rounded-lg grid place-items-center",
                  a.tone === "danger" ? "bg-destructive/10 text-destructive" :
                  a.tone === "warning" ? "bg-[color:var(--warning)]/10 text-[color:var(--warning)]" :
                  "bg-[color:var(--success)]/10 text-[color:var(--success)]"
                )}>
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

        {/* Monthly Revenue Bar */}
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold">Monthly Revenue</h3>
              <p className="text-xs text-muted-foreground">Month-by-month collection performance</p>
            </div>
            <Badge className="bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20">
              YTD: {formatPKR(revenueData?.yearlyRevenueTotal || 0)}
            </Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData?.yearly || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.82 0.145 88)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="oklch(0.82 0.145 88)" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="oklch(0.72 0.012 80)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.72 0.012 80)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                  contentStyle={{ background: "oklch(0.19 0.007 65)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "oklch(0.72 0.012 80)" }}
                  formatter={(v: number) => [formatPKR(v), "Revenue"]}
                />
                <Bar dataKey="revenue" fill="url(#goldBar)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Monthly Revenue</h3>
          </div>
          <div className="text-3xl font-semibold text-primary">{formatPKR(stats?.monthlyRevenue || 0)}</div>
          <p className="text-xs text-muted-foreground mt-1">Collected this month</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="h-4 w-4 text-[color:var(--warning)]" />
            <h3 className="text-base font-semibold">Monthly Expenses</h3>
          </div>
          <div className="text-3xl font-semibold text-[color:var(--warning)]">{formatPKR(stats?.monthlyExpenses || 0)}</div>
          <p className="text-xs text-muted-foreground mt-1">Spent this month</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-4 w-4 text-[color:var(--success)]" />
            <h3 className="text-base font-semibold">Net Profit</h3>
          </div>
          <div className={cn("text-3xl font-semibold", (stats?.netProfit || 0) >= 0 ? "text-[color:var(--success)]" : "text-destructive")}>
            {formatPKR(stats?.netProfit || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Revenue minus expenses</p>
        </div>
      </div>

      {/* Gym Health Score + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gym Health Score */}
        <div className="glass rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Gym Health Score</h3>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <HealthRing score={healthScore} tone={healthTone} />
          </div>
          <div className="mt-4 space-y-2.5">
            {healthBreakdown.map((b) => (
              <div key={b.label}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-medium">{b.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      b.value >= 80 ? "bg-[color:var(--success)]" :
                      b.value >= 60 ? "bg-primary" :
                      "bg-destructive"
                    )}
                    style={{ width: `${Math.max(4, Math.min(100, b.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Recent Attendance</h3>
            </div>
            <Link to="/attendance" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentAttendance.length === 0 && <EmptyState label="No check-ins yet" />}
            {recentAttendance.map((m) => {
              const days = m.last_visit ? Math.floor((Date.now() - new Date(m.last_visit).getTime()) / 86400000) : 0;
              const rel = days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days}d ago`;
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-primary/30 transition-colors">
                  <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: randomColor(m.id) }}>
                    {initials(m.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{m.full_name}</div>
                    <div className="text-[11px] text-muted-foreground">{m.membership_plan} · {m.attendance_count} visits</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[color:var(--success)] shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {rel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Expiring Soon</h3>
            </div>
            <Link to="/members" className="text-xs text-primary hover:underline">Manage</Link>
          </div>
          <div className="space-y-2">
            {expiringList.length === 0 && <EmptyState label="No memberships expiring soon" />}
            {expiringList.map((m) => {
              const days = Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / 86400000);
              const tone = days <= 0 ? "danger" : days <= 3 ? "danger" : days <= 7 ? "warning" : "default";
              const label = days <= 0 ? "Expired" : days === 1 ? "1 day left" : `${days} days left`;
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-primary/30 transition-colors">
                  <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: randomColor(m.id) }}>
                    {initials(m.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{m.full_name}</div>
                    <div className="text-[11px] text-muted-foreground">{m.membership_plan} · {formatDate(m.expiry_date)}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] shrink-0",
                      tone === "danger" && "bg-destructive/10 text-destructive border-destructive/20",
                      tone === "warning" && "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20",
                      tone === "default" && "bg-muted/60 border-border/60",
                    )}
                  >
                    {label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recently Added Members */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Recently Added Members</h3>
          <Link to="/members" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-primary/30 transition-colors">
              <div className="h-10 w-10 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: randomColor(m.id) }}>
                {initials(m.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{m.full_name}</div>
                <div className="text-xs text-muted-foreground">{m.membership_plan} · Joined {formatDate(m.joining_date)}</div>
              </div>
              <Badge
                className={cn(
                  m.status === "Active" && "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20",
                  m.status === "Expiring" && "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20",
                  m.status === "Inactive" && "bg-destructive/10 text-destructive border-destructive/20"
                )}
                variant="outline"
              >
                {m.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthRing({ score, tone }: { score: number; tone: "success" | "warning" | "danger" }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;
  const stroke =
    tone === "success" ? "oklch(0.72 0.15 145)" :
    tone === "warning" ? "oklch(0.82 0.145 88)" :
    "oklch(0.62 0.22 25)";
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth="10" fill="none" />
        <circle
          cx="70" cy="70" r={r}
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-semibold tracking-tight">{score}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">out of 100</div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
      {label}
    </div>
  );
}
