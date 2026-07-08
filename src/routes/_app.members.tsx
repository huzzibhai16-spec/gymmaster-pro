import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Pencil, Trash2, Filter, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  useMembers, useCreateMember, useDeleteMember,
  formatPKR, formatDate, initials, PLAN_PRICES
} from "@/hooks/use-data";
import type { Member } from "@/lib/supabase";

export const Route = createFileRoute("/_app/members")({
  head: () => ({ meta: [{ title: "Members — GymOS" }] }),
  component: MembersPage,
});

function statusBadge(s: Member["status"]) {
  const cls =
    s === "Active" ? "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20"
    : s === "Expiring" ? "bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20"
    : "bg-destructive/10 text-destructive border-destructive/20";
  return <Badge variant="outline" className={cls}>{s}</Badge>;
}

function MembersPage() {
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data: members, isLoading } = useMembers({ plan, search: q });
  const createMember = useCreateMember();
  const deleteMember = useDeleteMember();

  const filtered = members || [];
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const randomColor = (id: string) => {
    const hash = id.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return `hsl(${hash % 360} 60% 55%)`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description={`${filtered.length} members found`}
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gold-gradient text-primary-foreground hover:opacity-95">
                <Plus className="h-4 w-4 mr-1" /> Add Member
              </Button>
            </DialogTrigger>
            <AddMemberDialog onSubmit={async (data) => {
              await createMember.mutateAsync(data as any);
            }} />
          </Dialog>
        }
      />

      <div className="glass rounded-2xl p-4 md:p-5">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, phone, ID…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9 h-10 bg-muted/40" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={plan} onValueChange={(v) => { setPlan(v); setPage(1); }}>
              <SelectTrigger className="w-44 h-10 bg-muted/40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                {Object.keys(PLAN_PRICES).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/30">
                      <TableHead>Member</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((m) => (
                      <TableRow key={m.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: randomColor(m.id) }}>
                              {initials(m.full_name)}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{m.full_name}</div>
                              <div className="text-[11px] text-muted-foreground">{m.id.slice(0, 8)}…</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.phone}</TableCell>
                        <TableCell><Badge variant="outline" className="bg-muted/40 border-border/60">{m.membership_plan}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(m.joining_date)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(m.expiry_date)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.last_visit ? formatDate(m.last_visit) : "—"}</TableCell>
                        <TableCell className="text-right text-sm">{formatPKR(m.amount_paid)}</TableCell>
                        <TableCell className={`text-right text-sm ${m.pending_dues > 0 ? "text-[color:var(--warning)]" : "text-muted-foreground"}`}>{formatPKR(m.pending_dues)}</TableCell>
                        <TableCell>{statusBadge(m.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:text-destructive"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this member?")) {
                                  deleteMember.mutate(m.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paged.length === 0 && (
                      <TableRow><TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-12">No members found. Add your first member above.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
              <div>Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AddMemberDialog({ onSubmit }: { onSubmit: (data: Record<string, unknown>) => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const plan = formData.get("plan") as string;
    const price = PLAN_PRICES[plan as keyof typeof PLAN_PRICES] || 0;
    const amountPaid = parseInt(formData.get("amountPaid") as string) || 0;

    await onSubmit({
      full_name: formData.get("fullName"),
      phone: formData.get("phone"),
      age: parseInt(formData.get("age") as string) || null,
      gender: formData.get("gender") || null,
      address: formData.get("address") || null,
      emergency_contact: formData.get("emergencyContact") || null,
      membership_plan: plan,
      joining_date: formData.get("joiningDate"),
      expiry_date: formData.get("expiryDate"),
      monthly_fee: price,
      amount_paid: amountPaid,
      pending_dues: price - amountPaid,
      status: "Active" as const,
    });

    setLoading(false);
    setOpen(false);
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl bg-popover border-border">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name *</Label>
              <Input name="fullName" required className="h-10 bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone Number *</Label>
              <Input name="phone" type="tel" required className="h-10 bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Age</Label>
              <Input name="age" type="number" className="h-10 bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <Select name="gender">
                <SelectTrigger className="h-10 bg-muted/40"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Address</Label>
              <Input name="address" className="h-10 bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Emergency Contact</Label>
              <Input name="emergencyContact" type="tel" className="h-10 bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Membership Plan *</Label>
              <Select name="plan" required>
                <SelectTrigger className="h-10 bg-muted/40"><SelectValue placeholder="Choose plan" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_PRICES).map(([plan, price]) => (
                    <SelectItem key={plan} value={plan}>{plan} — {formatPKR(price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Joining Date *</Label>
              <Input name="joiningDate" type="date" required defaultValue={today} className="h-10 bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Expiry Date *</Label>
              <Input name="expiryDate" type="date" required className="h-10 bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount Paid</Label>
              <Input name="amountPaid" type="number" defaultValue="0" className="h-10 bg-muted/40" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Input name="notes" className="h-10 bg-muted/40" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gold-gradient text-primary-foreground">
              {loading ? "Saving…" : "Save Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
