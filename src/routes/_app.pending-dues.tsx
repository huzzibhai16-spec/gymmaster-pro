import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { CircleAlert as AlertCircle, Users, Wallet, Loader as Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useMembers, useDashboardStats, formatDate, formatPKR, initials } from "@/hooks/use-data";

export const Route = createFileRoute("/_app/pending-dues")({
  head: () => ({ meta: [{ title: "Pending Dues — GymOS" }] }),
  component: PendingDuesPage,
});

function PendingDuesPage() {
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const list = (members || [])
    .filter(m => m.pending_dues > 0)
    .sort((a, b) => b.pending_dues - a.pending_dues);

  const pendingDuesCount = stats?.pendingDuesCount || 0;
  const pendingDuesTotal = stats?.pendingDuesTotal || 0;

  const randomColor = (id: string) => {
    const hash = id.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return `hsl(${hash % 360} 60% 55%)`;
  };

  const isLoading = membersLoading || statsLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="Pending Dues" description="Members with outstanding balances awaiting collection." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Members with dues" value={pendingDuesCount.toString()} tone="warning" />
        <StatCard icon={Wallet} label="Total outstanding" value={formatPKR(pendingDuesTotal)} tone="danger" />
        <StatCard icon={AlertCircle} label="Average due" value={formatPKR(Math.round(pendingDuesTotal / Math.max(1, pendingDuesCount)))} tone="gold" />
      </div>

      <div className="glass rounded-2xl p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
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
                        <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: randomColor(m.id) }}>{initials(m.full_name)}</div>
                        <div>
                          <div className="text-sm font-medium">{m.full_name}</div>
                          <div className="text-[11px] text-muted-foreground">{m.id.slice(0, 8)}…</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.phone}</TableCell>
                    <TableCell className="text-sm">{m.membership_plan}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(m.expiry_date)}</TableCell>
                    <TableCell className="text-right text-sm text-[color:var(--warning)] font-medium">{formatPKR(m.pending_dues)}</TableCell>
                    <TableCell className="text-right text-sm text-destructive">{m.fine_amount ? formatPKR(m.fine_amount) : "—"}</TableCell>
                    <TableCell className="text-right"><Button size="sm" className="gold-gradient text-primary-foreground h-8">Remind</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
