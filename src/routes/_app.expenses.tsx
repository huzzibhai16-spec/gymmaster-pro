import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Receipt, Plus, Trash2, Loader as Loader2, DollarSign, Calendar, TrendingDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useExpenses, useCreateExpense, useDashboardStats, formatPKR, formatDate } from "@/hooks/use-data";

export const Route = createFileRoute("/_app/expenses")({
  head: () => ({ meta: [{ title: "Expenses — GymOS" }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const [addOpen, setAddOpen] = useState(false);

  const { data: expenses, isLoading } = useExpenses();
  const { data: stats } = useDashboardStats();
  const createExpense = useCreateExpense();

  const monthlyExpenses = stats?.monthlyExpenses || 0;
  const totalExpenses = useMemo(() => {
    return (expenses || []).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthExpenses = (expenses || []).filter(e => e.expense_date.startsWith(thisMonth));

  const handleAddExpense = async (data: { title: string; amount: number; notes?: string }) => {
    await createExpense.mutateAsync(data);
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and manage gym operational expenses."
        actions={
          <Button onClick={() => setAddOpen(true)} className="gold-gradient text-primary-foreground hover:opacity-95">
            <Plus className="h-4 w-4 mr-1" /> Add Expense
          </Button>
        }
      />

      {/* Add Expense Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md bg-popover border-border">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleAddExpense({
              title: formData.get("title") as string,
              amount: parseInt(formData.get("amount") as string) || 0,
              notes: (formData.get("notes") as string) || undefined,
            });
          }}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Title *</Label>
                <Input name="title" required placeholder="e.g., Rent, Utilities, Equipment" className="h-10 bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (PKR) *</Label>
                <Input name="amount" type="number" required min="1" className="h-10 bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes (optional)</Label>
                <Input name="notes" placeholder="Additional details" className="h-10 bg-muted/40" />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createExpense.isPending} className="gold-gradient text-primary-foreground">
                {createExpense.isPending ? "Saving…" : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          label="This Month"
          value={formatPKR(monthlyExpenses)}
          tone="warning"
          hint={`${thisMonthExpenses.length} transactions`}
        />
        <StatCard
          icon={TrendingDown}
          label="Total Expenses"
          value={formatPKR(totalExpenses)}
          tone="default"
          hint="All time"
        />
        <StatCard
          icon={Calendar}
          label="Records"
          value={(expenses?.length || 0).toString()}
          tone="gold"
          hint="Total entries"
        />
      </div>

      <div className="glass rounded-2xl p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(expenses || []).map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/20">
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(expense.expense_date)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{expense.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{expense.notes || "—"}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-[color:var(--warning)]">
                      {formatPKR(expense.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {(expenses || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-12">
                      No expenses recorded yet. Add your first expense above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
