import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { MEMBERS, daysBetween, formatDate, formatPKR, initials } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const BUCKETS = [
  { key: "7", label: "7 Days", min: 7, max: 14 },
  { key: "15", label: "15 Days", min: 15, max: 29 },
  { key: "30", label: "30 Days", min: 30, max: 59 },
  { key: "60", label: "60 Days", min: 60, max: 89 },
  { key: "90", label: "90+ Days", min: 90, max: Infinity },
];

export const Route = createFileRoute("/_app/inactive")({
  head: () => ({ meta: [{ title: "Inactive Members — GymOS" }] }),
  component: InactivePage,
});

function InactivePage() {
  const [tab, setTab] = useState("7");
  const bucket = BUCKETS.find(b => b.key === tab)!;
  const list = MEMBERS
    .map(m => ({ m, days: daysBetween(m.lastVisit) }))
    .filter(({ days }) => days >= bucket.min && days <= bucket.max)
    .sort((a, b) => b.days - a.days);

  return (
    <div className="space-y-6">
      <PageHeader title="Inactive Members" description="Automatically categorised by days since last visit." />

      <div className="glass rounded-2xl p-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/40">
            {BUCKETS.map(b => {
              const count = MEMBERS.filter(m => {
                const d = daysBetween(m.lastVisit);
                return d >= b.min && d <= b.max;
              }).length;
              return <TabsTrigger key={b.key} value={b.key}>{b.label} <Badge variant="outline" className="ml-2 bg-muted/60 border-border/60 text-[10px]">{count}</Badge></TabsTrigger>;
            })}
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            <div className="rounded-xl border border-border/60 overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-transparent">
                    <TableHead>Member</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Days Absent</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Fine</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-12">No inactive members in this bucket.</TableCell></TableRow>}
                  {list.map(({ m, days }) => (
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
                      <TableCell className="text-right text-sm font-medium text-[color:var(--warning)]">{days} days</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(m.lastVisit)}</TableCell>
                      <TableCell className="text-right text-sm">{formatPKR(m.remaining)}</TableCell>
                      <TableCell className="text-right text-sm text-destructive">{m.fine ? formatPKR(m.fine) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
