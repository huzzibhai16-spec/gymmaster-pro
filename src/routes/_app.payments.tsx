import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Wallet, CheckCircle2, AlertCircle, HandCoins, Printer, Pencil, DollarSign, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMembers, usePayments, useCreatePayment, formatPKR, initials, PLAN_PRICES } from "@/hooks/use-data";

export const Route = createFileRoute("/_app/payments")({
  head: () => ({ meta: [{ title: "Payments — GymOS" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const [tab, setTab] = useState("all");

  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const createPayment = useCreatePayment();

  const paid = (members || []).filter(m => m.pending_dues === 0);
  const pending = (members || []).filter(m => m.pending_dues > 0 && m.amount_paid === 0);
  const partial = (members || []).filter(m => m.pending_dues > 0 && m.amount_paid > 0);
  const totalCollected = (members || []).reduce((s, m) => s + m.amount_paid, 0);
  const totalPending = (members || []).reduce((s, m) => s + m.pending_dues, 0);

  const list = tab === "paid" ? paid : tab === "pending" ? pending : tab === "partial" ? partial : (members || []);

  const randomColor = (id: string) => {
    const hash = id.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return `hsl(${hash % 360} 60% 55%)`;
  };

  const isLoading = membersLoading || paymentsLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Collect, track and reconcile membership payments." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Collected" value={formatPKR(totalCollected)} tone="gold" />
        <StatCard icon={CheckCircle2} label="Fully Paid" value={paid.length.toString()} tone="success" />
        <StatCard icon={AlertCircle} label="Pending Payments" value={pending.length.toString()} tone="danger" />
        <StatCard icon={Wallet} label="Outstanding Balance" value={formatPKR(totalPending)} tone="warning" />
      </div>

      <div className="glass rounded-2xl p-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/40">
            <TabsTrigger value="all">All ({(members || []).length})</TabsTrigger>
            <TabsTrigger value="paid">Paid ({paid.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="partial">Partial ({partial.length})</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
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
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Fee</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.slice(0, 20).map((m) => {
                      const status = m.pending_dues === 0 ? "Paid" : m.amount_paid === 0 ? "Pending" : "Partial";
                      return (
                        <TableRow key={m.id} className="hover:bg-muted/20">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: randomColor(m.id) }}>
                                {initials(m.full_name)}
                              </div>
                              <div>
                                <div className="text-sm font-medium">{m.full_name}</div>
                                <div className="text-[11px] text-muted-foreground">{m.phone}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="bg-muted/40 border-border/60">{m.membership_plan}</Badge></TableCell>
                          <TableCell className="text-right text-sm">{formatPKR(m.monthly_fee)}</TableCell>
                          <TableCell className="text-right text-sm text-[color:var(--success)]">{formatPKR(m.amount_paid)}</TableCell>
                          <TableCell className="text-right text-sm text-[color:var(--warning)]">{formatPKR(m.pending_dues)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              status === "Paid" ? "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20" :
                              status === "Pending" ? "bg-destructive/10 text-destructive border-destructive/20" :
                              "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20"
                            }>{status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex gap-1">
                              {m.pending_dues > 0 && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-8">
                                      <HandCoins className="h-3.5 w-3.5 mr-1" />Receive
                                    </Button>
                                  </DialogTrigger>
                                  <ReceivePaymentDialog
                                    member={m}
                                    onSubmit={async (amount, method, notes) => {
                                      await createPayment.mutateAsync({
                                        memberId: m.id,
                                        amount,
                                        method,
                                        notes,
                                      });
                                    }}
                                  />
                                </Dialog>
                              )}
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
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ReceivePaymentDialog({
  member,
  onSubmit,
}: {
  member: { id: string; full_name: string; pending_dues: number };
  onSubmit: (amount: number, method: "Cash" | "Online", notes?: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const amount = parseInt(formData.get("amount") as string) || 0;
    const method = formData.get("method") as "Cash" | "Online";
    const notes = formData.get("notes") as string | undefined;

    await onSubmit(amount, method, notes);
    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md bg-popover border-border">
        <DialogHeader>
          <DialogTitle>Receive Payment from {member.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 p-3 bg-muted/20">
              <div className="text-xs text-muted-foreground">Pending Dues</div>
              <div className="text-xl font-semibold text-[color:var(--warning)]">{formatPKR(member.pending_dues)}</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount to Receive</Label>
              <Input name="amount" type="number" required defaultValue={member.pending_dues} max={member.pending_dues} className="h-10 bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Method</Label>
              <Select name="method" required defaultValue="Cash">
                <SelectTrigger className="h-10 bg-muted/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Input name="notes" className="h-10 bg-muted/40" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gold-gradient text-primary-foreground">
              {loading ? "Processing…" : "Receive Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
