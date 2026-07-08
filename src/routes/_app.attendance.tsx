import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Check, Calendar, User, Loader2 } from "lucide-react";
import { useMembers, useAttendance, useMarkAttendance, formatDate, initials } from "@/hooks/use-data";

export const Route = createFileRoute("/_app/attendance")({
  head: () => ({ meta: [{ title: "Attendance — GymOS" }] }),
  component: AttendancePage,
});

function AttendancePage() {
  const [q, setQ] = useState("");

  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: todayAttendance, isLoading: attendanceLoading } = useAttendance();
  const markAttendance = useMarkAttendance();

  const results = q ? (members || []).filter(m =>
    m.full_name.toLowerCase().includes(q.toLowerCase()) ||
    m.phone.includes(q) ||
    m.id.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 6) : [];

  const todayList = (todayAttendance || []).map(a => ({
    ...a,
    member: members?.find(m => m.id === a.member_id)
  }));

  const randomColor = (id: string) => {
    const hash = id.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return `hsl(${hash % 360} 60% 55%)`;
  };

  const isLoading = membersLoading || attendanceLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Search a member and mark them present." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search member by name, phone or ID…"
              className="pl-9 h-12 text-base bg-muted/40"
            />
          </div>

          <div className="mt-4 space-y-2">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && results.map((m) => {
              const isMarked = todayAttendance?.some(a => a.member_id === m.id);
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:border-primary/40 transition-colors">
                  <div className="h-11 w-11 rounded-full grid place-items-center text-sm font-semibold text-primary-foreground" style={{ background: randomColor(m.id) }}>
                    {initials(m.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{m.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.membership_plan} · Expires {formatDate(m.expiry_date)} · Last visit {m.last_visit ? formatDate(m.last_visit) : "Never"}
                    </div>
                  </div>
                  <Badge variant="outline" className={
                    m.status === "Active" ? "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20" :
                    "bg-destructive/10 text-destructive border-destructive/20"
                  }>{m.status}</Badge>
                  <Button
                    disabled={isMarked || markAttendance.isPending}
                    onClick={() => markAttendance.mutate({ memberId: m.id })}
                    className={isMarked ? "" : "gold-gradient text-primary-foreground"}
                    variant={isMarked ? "outline" : "default"}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {isMarked ? "Marked" : "Mark Present"}
                  </Button>
                </div>
              );
            })}
            {!isLoading && !q && (
              <div className="text-center py-16 text-muted-foreground">
                <User className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Start typing to search members</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Today's Attendance</h3>
            <Badge className="ml-auto bg-primary/10 text-primary border-primary/20" variant="outline">{todayList.length}</Badge>
          </div>
          <div className="space-y-2 max-h-96 overflow-auto pr-1">
            {todayList.length === 0 && (
              <p className="text-xs text-muted-foreground py-8 text-center">No check-ins yet today.</p>
            )}
            {todayList.map((a) => (
              a.member && (
                <div key={a.id} className="flex items-center gap-2.5 rounded-lg bg-muted/30 p-2.5">
                  <div className="h-8 w-8 rounded-full grid place-items-center text-[10px] font-semibold text-primary-foreground" style={{ background: randomColor(a.member.id) }}>
                    {initials(a.member.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{a.member.full_name}</div>
                    <div className="text-[10px] text-muted-foreground">{a.check_in_time.slice(0, 5)}</div>
                  </div>
                  <Check className="h-4 w-4 text-[color:var(--success)]" />
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
