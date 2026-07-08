import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useMembers, formatDate, formatPKR, initials } from "@/hooks/use-data";

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
  const { data: members, isLoading } = useMembers();

  const bucket = BUCKETS.find(b => b.key === tab)!;

  const list = useMemo(() => {
    return (members || [])
      .filter(m => m.last_visit)
      .map(m => ({
        m,
        days: Math.floor((Date.now() - new Date(m.last_visit!).getTime()) / 86400000)
      }))
      .filter(({ days }) => days >= bucket.min && days <= bucket.max)
      .sort((a, b) => b.days - a.days);
  }, [members, bucket]);

  const bucketCounts = useMemo(() => {
    return BUCKETS.map(b => ({
      key: b.key,
      count: (members || [])
        .filter(m => m.last_visit)
        .filter(m => {
          const days = Math.floor((Date.now() - new Date(m.last_visit!).getTime()) / 86400000);
          return days >= b.min && days <= b.max;
        }).length
    }));
  }, [members]);

  const randomColor = (id: string) => {
    const hash = id.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return `hsl(${hash % 360} 60% 55%)`;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Inactive Members" description="Automatically categorised by days since last visit." />

      <div className="glass rounded-2xl p-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/40">
            {BUCKETS.map(b => {
              const count = bucketCounts.find(c => c.key === b.key)?.count || 0;
              return (
                <TabsTrigger key={b.key} value={b.key}>
                  {b.label} <Badge variant="outline" className="ml-2 bg-muted/60 border-border/60 text-[10px]">{count}</Badge>
                </TabsTrigger>
              );
            })}
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
                            <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground" style={{ background: randomColor(m.id) }}>{initials(m.full_name)}</div>
                            <div>
                              <div className="text-sm font-medium">{m.full_name}</div>
                              <div className="text-[11px] text-muted-foreground">{m.id.slice(0, 8)}…</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.phone}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-[color:var(--warning)]">{days} days</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(m.last_visit!)}</TableCell>
                        <TableCell className="text-right text-sm">{formatPKR(m.pending_dues)}</TableCell>
                        <TableCell className="text-right text-sm text-destructive">{m.fine_amount ? formatPKR(m.fine_amount) : "—"}</TableCell>
                      </TableRow>
                    ))}
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
