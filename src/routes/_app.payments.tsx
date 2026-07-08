import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { MEMBERS, PLAN_PRICE, formatPKR, initials } from "@/lib/mock-data";
import { StatCard } from "@/components/stat-card";
import { Wallet, CheckCircle2, AlertCircle, HandCoins, Printer, Pencil, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/payments")({
  head: () => ({ meta: [{ title: "Payments — GymOS" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const [tab, setTab] = useState("all");
  const paid = MEMBERS.filter(m => m.remaining === 0);
  const pending = MEMBERS.filter(m => m.remaining > 0 && m.amountPaid === 0);
  const partial = MEMBERS.filter(m => m.remaining > 0 && m.amountPaid > 0);
  const totalCollected = MEMBERS.reduce((s, m) => s + m.amountPaid, 0);
  const totalPending = MEMBERS.reduce((s, m) => s + m.remaining, 0);

  const list = tab === "paid" ? paid : tab === "pending" ? pending : tab === "partial" ? partial : MEMBERS;

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Collect, track and reconcile membership payments." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Collected" value={formatPKR(totalCollected)} tone="gold" trend={6.4} />
        <StatCard icon={CheckCircle2} label="Fully Paid" value={paid.length.toString()} tone="success" />
        <StatCard icon={AlertCircle} label="Pending Payments" value={pending.length.toString()} tone="danger" />
        <StatCard icon={Wallet} label="Outstanding Balance" value={formatPKR(totalPending)} tone="warning" />
      </div>

      <div className="glass rounded-2xl p-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/40">
            <TabsTrigger value="all">All ({MEMBERS.length})</TabsTrigger>
            <TabsTrigger value="paid">Paid ({paid.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="partial">Partial ({partial.length})</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            <div className="rounded-xl border border-border/60 overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-transparent">
                    <TableHead>Member</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.slice(0, 20).map((m) => {
                    const price = PLAN_PRICE[m.plan];
                    const status = m.remaining === 0 ? "Paid" : m.amountPaid === 0 ? "Pending" : "Partial";
                    return (
                      <TableRow key={m.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: m.photo }}>
                              {initials(m.name)}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{m.name}</div>
                              <div className="text-[11px] text-muted-foreground">{m.phone}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="bg-muted/40 border-border/60">{m.plan}</Badge></TableCell>
                        <TableCell className="text-right text-sm">{formatPKR(price)}</TableCell>
                        <TableCell className="text-right text-sm text-[color:var(--success)]">{formatPKR(m.amountPaid)}</TableCell>
                        <TableCell className="text-right text-sm text-[color:var(--warning)]">{formatPKR(m.remaining)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            status === "Paid" ? "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20" :
                            status === "Pending" ? "bg-destructive/10 text-destructive border-destructive/20" :
                            "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20"
                          }>{status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-1">
                            <Button size="sm" variant="outline" className="h-8"><HandCoins className="h-3.5 w-3.5 mr-1" />Receive</Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8"><Printer className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
