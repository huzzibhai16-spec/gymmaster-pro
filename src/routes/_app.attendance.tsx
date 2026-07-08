import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { MEMBERS, formatDate, initials } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Check, Calendar, User } from "lucide-react";

export const Route = createFileRoute("/_app/attendance")({
  head: () => ({ meta: [{ title: "Attendance — GymOS" }] }),
  component: AttendancePage,
});

function AttendancePage() {
  const [q, setQ] = useState("");
  const [marked, setMarked] = useState<string[]>([]);

  const results = q ? MEMBERS.filter(m =>
    m.name.toLowerCase().includes(q.toLowerCase()) || m.phone.includes(q) || m.id.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 6) : [];

  const todayList = MEMBERS.filter(m => marked.includes(m.id));

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Search a member and mark them present." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search member by name, phone or ID…" className="pl-9 h-12 text-base bg-muted/40" />
          </div>

          <div className="mt-4 space-y-2">
            {results.map((m) => {
              const isMarked = marked.includes(m.id);
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:border-primary/40 transition-colors">
                  <div className="h-11 w-11 rounded-full grid place-items-center text-sm font-semibold text-primary-foreground" style={{ background: m.photo }}>
                    {initials(m.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.plan} · Expires {formatDate(m.expiryDate)} · Last visit {formatDate(m.lastVisit)}</div>
                  </div>
                  <Badge variant="outline" className={
                    m.status === "Active" ? "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20" :
                    "bg-destructive/10 text-destructive border-destructive/20"
                  }>{m.status}</Badge>
                  <Button
                    disabled={isMarked}
                    onClick={() => setMarked([...marked, m.id])}
                    className={isMarked ? "" : "gold-gradient text-primary-foreground"}
                    variant={isMarked ? "outline" : "default"}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {isMarked ? "Marked" : "Mark Present"}
                  </Button>
                </div>
              );
            })}
            {!q && (
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
            {todayList.length === 0 && <p className="text-xs text-muted-foreground py-8 text-center">No check-ins yet today.</p>}
            {todayList.map(m => (
              <div key={m.id} className="flex items-center gap-2.5 rounded-lg bg-muted/30 p-2.5">
                <div className="h-8 w-8 rounded-full grid place-items-center text-[10px] font-semibold text-primary-foreground" style={{ background: m.photo }}>
                  {initials(m.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{m.name}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <Check className="h-4 w-4 text-[color:var(--success)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
