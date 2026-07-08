import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { MEMBERS, formatDate, formatPKR, initials, pendingDuesTotal, pendingDuesCount } from "@/lib/mock-data";
import { StatCard } from "@/components/stat-card";
import { AlertCircle, Users, Wallet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/pending-dues")({
  head: () => ({ meta: [{ title: "Pending Dues — GymOS" }] }),
  component: PendingDuesPage,
});

function PendingDuesPage() {
  const list = MEMBERS.filter(m => m.remaining > 0).sort((a, b) => b.remaining - a.remaining);
  return (
    <div className="space-y-6">
      <PageHeader title="Pending Dues" description="Members with outstanding balances awaiting collection." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Members with dues" value={pendingDuesCount().toString()} tone="warning" />
        <StatCard icon={Wallet} label="Total outstanding" value={formatPKR(pendingDuesTotal())} tone="danger" />
        <StatCard icon={AlertCircle} label="Average due" value={formatPKR(Math.round(pendingDuesTotal() / Math.max(1, pendingDuesCount())))} tone="gold" />
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="rounded-xl border border-border/60 overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-transparent">
                <TableHead>Member</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Fine</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((m) => (
                <TableRow key={m.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: m.photo }}>{initials(m.name)}</div>
                      <div>
                        <div className="text-sm font-medium">{m.name}</div>
                        <div className="text-[11px] text-muted-foreground">{m.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.phone}</TableCell>
                  <TableCell className="text-sm">{m.plan}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(m.expiryDate)}</TableCell>
                  <TableCell className="text-right text-sm text-[color:var(--warning)] font-medium">{formatPKR(m.remaining)}</TableCell>
                  <TableCell className="text-right text-sm text-destructive">{m.fine ? formatPKR(m.fine) : "—"}</TableCell>
                  <TableCell className="text-right"><Button size="sm" className="gold-gradient text-primary-foreground h-8">Remind</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
