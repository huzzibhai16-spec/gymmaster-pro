import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { MEMBERS, PLAN_PRICE, formatDate, formatPKR, initials, type Member } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Pencil, Trash2, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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

  const filtered = useMemo(() => {
    return MEMBERS.filter((m) => {
      const matchesQ = !q || m.name.toLowerCase().includes(q.toLowerCase()) || m.phone.includes(q) || m.id.toLowerCase().includes(q.toLowerCase());
      const matchesPlan = plan === "all" || m.plan === plan;
      return matchesQ && matchesPlan;
    });
  }, [q, plan]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

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
            <AddMemberDialog />
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
                {Object.keys(PLAN_PRICE).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

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
                        <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: m.photo }}>
                          {initials(m.name)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{m.name}</div>
                          <div className="text-[11px] text-muted-foreground">{m.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.phone}</TableCell>
                    <TableCell><Badge variant="outline" className="bg-muted/40 border-border/60">{m.plan}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(m.joinDate)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(m.expiryDate)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(m.lastVisit)}</TableCell>
                    <TableCell className="text-right text-sm">{formatPKR(m.amountPaid)}</TableCell>
                    <TableCell className={`text-right text-sm ${m.remaining > 0 ? "text-[color:var(--warning)]" : "text-muted-foreground"}`}>{formatPKR(m.remaining)}</TableCell>
                    <TableCell>{statusBadge(m.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-12">No members match your search.</TableCell></TableRow>
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
      </div>
    </div>
  );
}

function AddMemberDialog() {
  return (
    <DialogContent className="max-w-2xl bg-popover border-border">
      <DialogHeader>
        <DialogTitle>Add New Member</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          ["Full Name", "text"], ["Phone Number", "tel"], ["Age", "number"], ["Gender", "text"],
          ["Address", "text"], ["Emergency Contact", "tel"], ["Joining Date", "date"], ["Expiry Date", "date"],
          ["Amount Paid", "number"], ["Remaining Amount", "number"],
        ].map(([label, type]) => (
          <div key={label} className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            <Input type={type} className="h-10 bg-muted/40" />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label className="text-xs">Membership Plan</Label>
          <Select><SelectTrigger className="h-10 bg-muted/40"><SelectValue placeholder="Choose plan" /></SelectTrigger>
            <SelectContent>{Object.keys(PLAN_PRICE).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-xs">Notes</Label>
          <Input className="h-10 bg-muted/40" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button className="gold-gradient text-primary-foreground">Save Member</Button>
      </DialogFooter>
    </DialogContent>
  );
}
