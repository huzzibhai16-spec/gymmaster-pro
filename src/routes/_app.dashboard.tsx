import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users, UserCheck, UserX, Wallet, CalendarClock, AlertTriangle, TrendingUp, Bell,
  UserPlus, ClipboardCheck, CreditCard, BarChart3, Activity, Heart, CheckCircle2,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import {
  MEMBERS, MONTHLY_REVENUE, DAILY_SALES, totalMembers, activeMembers, inactiveMembers, expiringSoon,
  pendingDuesTotal, pendingDuesCount, todaysRevenue, yesterdayRevenue, monthlyRevenueTotal,
  formatPKR, initials, formatDate, daysBetween,
} from "@/lib/mock-data";
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GymOS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const today = todaysRevenue();
  const yest = yesterdayRevenue();
  const trend = ((today - yest) / yest) * 100;

  const inactive30 = MEMBERS.filter(m => daysBetween(m.lastVisit) > 30).length;

  const todaysTasks = [
    { icon: Wallet, tone: "warning" as const, title: `Collect payments from ${pendingDuesCount()} members`, desc: `${formatPKR(pendingDuesTotal())} outstanding across active plans.` },
    { icon: CalendarClock, tone: "danger" as const, title: `${expiringSoon()} memberships expire this week`, desc: "Reach out for renewals before they lapse." },
    { icon: UserX, tone: "warning" as const, title: `${inactive30} members haven't visited in 30+ days`, desc: "Consider a win-back message or free session." },
    { icon: TrendingUp, tone: trend >= 0 ? "success" as const : "danger" as const, title: trend >= 0 ? `Revenue up ${trend.toFixed(1)}% vs yesterday` : `Revenue down ${Math.abs(trend).toFixed(1)}% vs yesterday`, desc: `Today ${formatPKR(today)} · Yesterday ${formatPKR(yest)}` },
    { icon: AlertTriangle, tone: "danger" as const, title: "3 members flagged with unpaid dues over 30 days", desc: "Fines have been automatically applied." },
  ];

  const quickActions = [
    { icon: UserPlus, label: "Add Member", to: "/members" },
    { icon: ClipboardCheck, label: "Mark Attendance", to: "/attendance" },
    { icon: CreditCard, label: "Receive Payment", to: "/payments" },
    { icon: BarChart3, label: "View Reports", to: "/reports" },
  ];

  const recent = [...MEMBERS].slice(0, 6);

  // Recent payments — derive from members with payments made
  const recentPayments = [...MEMBERS]
    .filter(m => m.amountPaid > 0)
    .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
    .slice(0, 6)
    .map((m, i) => ({
      id: m.id,
      name: m.name,
      photo: m.photo,
      amount: Math.round(m.amountPaid / (1 + (i % 3))),
      method: i % 2 === 0 ? "Cash" : "Online",
      date: DAILY_SALES[DAILY_SALES.length - 1 - (i % DAILY_SALES.length)].date,
    }));

  // Recent attendance — members with most recent visits
  const recentAttendance = [...MEMBERS]
    .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())
    .slice(0, 6);

  // Expiring soon list
  const expiringList = MEMBERS
    .filter(m => {
      const d = (new Date(m.expiryDate).getTime() - Date.now()) / 86400000;
      return d >= -1 && d <= 14;
    })
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 6);

  // Gym Health Score — composite metric out of 100
  const total = totalMembers();
  const activePct = (activeMembers() / total) * 100;
  const collectionRate = (MEMBERS.reduce((s, m) => s + m.amountPaid, 0) /
    MEMBERS.reduce((s, m) => s + m.amountPaid + m.remaining, 0)) * 100;
  const attendanceHealth = 100 - (inactive30 / total) * 100;
  const retentionHealth = 100 - (expiringSoon() / total) * 100;
  const healthScore = Math.round(activePct * 0.3 + collectionRate * 0.3 + attendanceHealth * 0.25 + retentionHealth * 0.15);
  const healthTone = healthScore >= 80 ? "success" : healthScore >= 60 ? "warning" : "danger";
  const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Healthy" : "Needs Attention";

  const healthBreakdown = [
    { label: "Active Members", value: Math.round(activePct) },
    { label: "Collection Rate", value: Math.round(collectionRate) },
    { label: "Attendance", value: Math.round(attendanceHealth) },
    { label: "Retention", value: Math.round(retentionHealth) },
  ];

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
        <StatCard icon={Users} label="Total Members" value={totalMembers().toString()} tone="gold" trend={4.2} hint="All-time roster" />
        <StatCard icon={UserCheck} label="Active Members" value={activeMembers().toString()} tone="success" trend={2.1} />
        <StatCard icon={UserX} label="Inactive Members" value={inactiveMembers().toString()} tone="danger" trend={-1.4} />
        <StatCard icon={Wallet} label="Today's Revenue" value={formatPKR(today)} tone="gold" trend={trend} />
        <StatCard icon={TrendingUp} label="Monthly Revenue" value={formatPKR(MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].revenue)} tone="success" trend={8.6} />
        <StatCard icon={AlertTriangle} label="Pending Dues" value={formatPKR(pendingDuesTotal())} tone="warning" hint={`${pendingDuesCount()} members`} />
        <StatCard icon={CalendarClock} label="Expiring Soon" value={expiringSoon().toString()} tone="warning" hint="Next 7 days" />
        <StatCard icon={TrendingUp} label="Yearly Revenue" value={formatPKR(monthlyRevenueTotal())} tone="gold" trend={12.4} />
      </div>

      {/* Revenue Trend + Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

        {/* Action Center — Today's Tasks */}
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
      </div>

      {/* Monthly Revenue bar chart + Gym Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold">Monthly Revenue</h3>
              <p className="text-xs text-muted-foreground">Month-by-month collection performance</p>
            </div>
            <Badge className="bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20">
              +8.6% MoM
            </Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_REVENUE} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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

        {/* Gym Health Score */}
        <div className="glass rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Gym Health Score</h3>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                healthTone === "success" && "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20",
                healthTone === "warning" && "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20",
                healthTone === "danger" && "bg-destructive/10 text-destructive border-destructive/20",
              )}
            >
              {healthLabel}
            </Badge>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-2">
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
      </div>

      {/* Recent Payments + Recent Attendance + Expiring Soon */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Payments */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Recent Payments</h3>
            </div>
            <Link to="/payments" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentPayments.length === 0 && <EmptyState label="No payments yet" />}
            {recentPayments.map((p) => (
              <div key={p.id + p.date} className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-primary/30 transition-colors">
                <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: p.photo }}>
                  {initials(p.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{formatDate(p.date)} · {p.method}</div>
                </div>
                <div className="text-sm font-semibold text-primary shrink-0">{formatPKR(p.amount)}</div>
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
              const d = daysBetween(m.lastVisit);
              const rel = d <= 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-primary/30 transition-colors">
                  <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: m.photo }}>
                    {initials(m.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground">{m.plan} · {m.attendanceCount} visits</div>
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
              const days = Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / 86400000);
              const tone = days <= 0 ? "danger" : days <= 3 ? "danger" : days <= 7 ? "warning" : "default";
              const label = days <= 0 ? "Expired" : days === 1 ? "1 day left" : `${days} days left`;
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-3 hover:border-primary/30 transition-colors">
                  <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: m.photo }}>
                    {initials(m.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground">{m.plan} · {formatDate(m.expiryDate)}</div>
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

      {/* Recently added members (existing) */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Recently Added Members</h3>
          <Link to="/members" className="text-xs text-primary hover:underline">View all</Link>
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
