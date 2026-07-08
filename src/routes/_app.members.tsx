import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Pencil, Trash2, ListFilter as Filter, Loader as Loader2, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  useMembers, useCreateMember, useUpdateMember, useDeleteMember,
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
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [addOpen, setAddOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [viewMember, setViewMember] = useState<Member | null>(null);

  const filtered = members || [];
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const randomColor = (id: string) => {
    const hash = id.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return `hsl(${hash % 360} 60% 55%)`;
  };

  const handleAddMember = async (data: Record<string, unknown>) => {
    await createMember.mutateAsync(data as Omit<Member, "id" | "gym_id" | "created_at">);
    setAddOpen(false);
  };

  const handleEditMember = async (data: Partial<Member>) => {
    if (!editMember) return;
    await updateMember.mutateAsync({ id: editMember.id, updates: data });
    setEditMember(null);
  };

  const handleDeleteMember = (id: string) => {
    if (confirm("Are you sure you want to delete this member? This action cannot be undone.")) {
      deleteMember.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description={`${filtered.length} members found`}
        actions={
          <Button onClick={() => setAddOpen(true)} className="gold-gradient text-primary-foreground hover:opacity-95">
            <Plus className="h-4 w-4 mr-1" /> Add Member
          </Button>
        }
      />

      {/* Add Member Dialog */}
      <MemberFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddMember}
        title="Add New Member"
        loading={createMember.isPending}
      />

      {/* Edit Member Dialog */}
      {editMember && (
        <MemberFormDialog
          open={!!editMember}
          onOpenChange={(open) => !open && setEditMember(null)}
          onSubmit={handleEditMember}
          title="Edit Member"
          initialData={editMember}
          loading={updateMember.isPending}
        />
      )}

      {/* View Member Dialog */}
      {viewMember && (
        <Dialog open={!!viewMember} onOpenChange={(open) => !open && setViewMember(null)}>
          <DialogContent className="max-w-lg bg-popover border-border">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full grid place-items-center text-lg font-semibold text-primary-foreground" style={{ background: randomColor(viewMember.id) }}>
                  {initials(viewMember.full_name)}
                </div>
                <div>
                  <div className="text-lg font-semibold">{viewMember.full_name}</div>
                  <div className="text-sm text-muted-foreground">{viewMember.phone}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DetailItem label="Member ID" value={viewMember.id.slice(0, 8) + "…"} />
                <DetailItem label="Status" value={viewMember.status} />
                <DetailItem label="Plan" value={viewMember.membership_plan} />
                <DetailItem label="Monthly Fee" value={formatPKR(viewMember.monthly_fee)} />
                <DetailItem label="Joining Date" value={formatDate(viewMember.joining_date)} />
                <DetailItem label="Expiry Date" value={formatDate(viewMember.expiry_date)} />
                <DetailItem label="Amount Paid" value={formatPKR(viewMember.amount_paid)} />
                <DetailItem label="Pending Dues" value={formatPKR(viewMember.pending_dues)} />
                <DetailItem label="Last Visit" value={viewMember.last_visit ? formatDate(viewMember.last_visit) : "Never"} />
                <DetailItem label="Visits" value={viewMember.attendance_count.toString()} />
                {viewMember.age && <DetailItem label="Age" value={viewMember.age.toString()} />}
                {viewMember.gender && <DetailItem label="Gender" value={viewMember.gender} />}
                {viewMember.address && <DetailItem label="Address" value={viewMember.address} className="col-span-2" />}
                {viewMember.emergency_contact && <DetailItem label="Emergency Contact" value={viewMember.emergency_contact} className="col-span-2" />}
                {viewMember.notes && <DetailItem label="Notes" value={viewMember.notes} className="col-span-2" />}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewMember(null)}>Close</Button>
              <Button onClick={() => { setViewMember(null); setEditMember(viewMember); }} className="gold-gradient text-primary-foreground">
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewMember(m)}><Eye className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditMember(m)}><Pencil className="h-4 w-4" /></Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:text-destructive"
                              onClick={() => handleDeleteMember(m.id)}
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

function MemberFormDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  initialData,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  title: string;
  initialData?: Member | null;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const resetForm = () => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name || "",
        phone: initialData.phone || "",
        age: initialData.age || null,
        gender: initialData.gender || null,
        address: initialData.address || null,
        emergency_contact: initialData.emergency_contact || null,
        membership_plan: initialData.membership_plan || "Monthly",
        joining_date: initialData.joining_date || new Date().toISOString().split("T")[0],
        expiry_date: initialData.expiry_date || "",
        monthly_fee: initialData.monthly_fee || PLAN_PRICES.Monthly,
        amount_paid: initialData.amount_paid || 0,
        pending_dues: initialData.pending_dues || PLAN_PRICES.Monthly,
        notes: initialData.notes || null,
        status: initialData.status || "Active",
      });
    } else {
      setFormData({
        full_name: "",
        phone: "",
        age: null,
        gender: null,
        address: null,
        emergency_contact: null,
        membership_plan: "Monthly",
        joining_date: new Date().toISOString().split("T")[0],
        expiry_date: "",
        monthly_fee: PLAN_PRICES.Monthly,
        amount_paid: 0,
        pending_dues: PLAN_PRICES.Monthly,
        notes: null,
        status: "Active",
      });
    }
  };

  useState(() => {
    resetForm();
  });

  // Update form when initialData changes
  if (initialData && open && Object.keys(formData).length === 0) {
    resetForm();
  }
  if (!initialData && open && Object.keys(formData).length === 0) {
    resetForm();
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const plan = formData.membership_plan as string;
    const price = PLAN_PRICES[plan as keyof typeof PLAN_PRICES] || 0;
    const amountPaid = (formData.amount_paid as number) || 0;

    await onSubmit({
      ...formData,
      membership_plan: plan,
      monthly_fee: price,
      pending_dues: price - amountPaid,
    });
    setFormData({});
    onOpenChange(false);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isOpen) resetForm();
      else setFormData({});
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl bg-popover border-border">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name *</Label>
              <Input
                required
                value={(formData.full_name as string) || ""}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="h-10 bg-muted/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone Number *</Label>
              <Input
                type="tel"
                required
                value={(formData.phone as string) || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-10 bg-muted/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Age</Label>
              <Input
                type="number"
                value={(formData.age as number) || ""}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || null })}
                className="h-10 bg-muted/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <Select
                value={(formData.gender as string) || ""}
                onValueChange={(v) => setFormData({ ...formData, gender: v || null })}
              >
                <SelectTrigger className="h-10 bg-muted/40"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Address</Label>
              <Input
                value={(formData.address as string) || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value || null })}
                className="h-10 bg-muted/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Emergency Contact</Label>
              <Input
                type="tel"
                value={(formData.emergency_contact as string) || ""}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value || null })}
                className="h-10 bg-muted/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Membership Plan *</Label>
              <Select
                value={(formData.membership_plan as string) || "Monthly"}
                onValueChange={(v) => setFormData({ ...formData, membership_plan: v, monthly_fee: PLAN_PRICES[v as keyof typeof PLAN_PRICES] })}
              >
                <SelectTrigger className="h-10 bg-muted/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLAN_PRICES).map(([plan, price]) => (
                    <SelectItem key={plan} value={plan}>{plan} — {formatPKR(price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Joining Date *</Label>
              <Input
                type="date"
                required
                value={(formData.joining_date as string) || today}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                className="h-10 bg-muted/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Expiry Date *</Label>
              <Input
                type="date"
                required
                value={(formData.expiry_date as string) || ""}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="h-10 bg-muted/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount Paid</Label>
              <Input
                type="number"
                value={(formData.amount_paid as number) || 0}
                onChange={(e) => setFormData({ ...formData, amount_paid: parseInt(e.target.value) || 0 })}
                className="h-10 bg-muted/40"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Input
                value={(formData.notes as string) || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                className="h-10 bg-muted/40"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => { setFormData({}); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gold-gradient text-primary-foreground">
              {loading ? "Saving…" : initialData ? "Update Member" : "Save Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
