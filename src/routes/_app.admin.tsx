import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  useAdminDashboardStats,
  useAllGyms,
  useAllGymOwners,
  useGymOwnersDetailed,
  useUpdateUserProfile,
  formatPKR,
} from "@/hooks/use-data";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Users,
  DollarSign,
  UserCheck,
  UserX,
  MoveVertical as MoreVertical,
  Loader as Loader2,
  UserPlus,
  Search,
  Dumbbell,
  Lock,

} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { createGymOwner, deleteGymOwner, resetOwnerPassword } from "@/lib/admin.functions";
import { useQueryClient } from "@tanstack/react-query";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — GymOS" },
      { name: "description", content: "Admin dashboard for managing all gyms." },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "gyms" | "owners">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats();
  const { data: gyms, isLoading: gymsLoading } = useAllGyms();
  const { data: owners, isLoading: ownersLoading } = useAllGymOwners();
  const { data: ownersDetailed } = useGymOwnersDetailed();
  const updateProfile = useUpdateUserProfile();


  // Strict guard: only admins may access this route
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [authLoading, isAdmin, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl gold-gradient grid place-items-center animate-pulse">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleSuspend = (userId: string, isSuspended: boolean) => {
    updateProfile.mutate({
      userId,
      updates: { is_suspended: !isSuspended },
    });
  };

  const filteredOwners = (ownersDetailed || []).filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      (o.email ?? "").toLowerCase().includes(q) ||
      (o.gym?.name ?? "").toLowerCase().includes(q)
    );
  });

  const createOwnerFn = useServerFn(createGymOwner);
  const deleteOwnerFn = useServerFn(deleteGymOwner);
  const resetPasswordFn = useServerFn(resetOwnerPassword);
  const queryClient = useQueryClient();


  const handleCreateOwner = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const gymName = formData.get("gymName") as string;

    try {
      await createOwnerFn({ data: { email, password, gymName } });
      setCreateOpen(false);
      await queryClient.invalidateQueries();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create gym owner.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteOwner = async (userId: string) => {
    if (!confirm("Delete this gym owner and all their data? This cannot be undone.")) return;
    try {
      await deleteOwnerFn({ data: { userId } });
      await queryClient.invalidateQueries();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete gym owner.");
    }
  };

  const handleResetOwnerPassword = async (userId: string) => {
    const pwd = prompt("Enter a new temporary password (min 6 chars). Owner will be required to change it on next login:");
    if (!pwd) return;
    if (pwd.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    try {
      await resetPasswordFn({ data: { userId, password: pwd } });
      await queryClient.invalidateQueries();
      alert("Password reset. Share the new temporary password with the owner.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset password.");
    }
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Manage all gyms and gym owners"
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="gold-gradient text-primary-foreground hover:opacity-95"
          >
            <UserPlus className="h-4 w-4 mr-1" /> Create Gym Owner
          </Button>
        }
      />

      {/* Create Gym Owner Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-popover border-border">
          <DialogHeader>
            <DialogTitle>Create New Gym Owner</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOwner}>
            {createError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-4">
                {createError}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Gym Name</Label>
                <Input
                  name="gymName"
                  required
                  placeholder="e.g., Elite Fitness Gym"
                  className="h-10 bg-muted/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email Address</Label>
                <Input
                  name="email"
                  type="email"
                  required
                  placeholder="owner@gym.com"
                  className="h-10 bg-muted/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Password</Label>
                <Input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  className="h-10 bg-muted/40"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLoading}
                className="gold-gradient text-primary-foreground"
              >
                {createLoading ? "Creating..." : "Create Owner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Gyms"
          value={statsLoading ? "..." : String(stats?.totalGyms ?? 0)}
          hint="Registered gyms"
          icon={Building2}
          tone="gold"
        />
        <StatCard
          label="Total Members"
          value={statsLoading ? "..." : String(stats?.totalMembers ?? 0)}
          hint="Across all gyms"
          icon={Users}
        />
        <StatCard
          label="Monthly Revenue"
          value={statsLoading ? "..." : formatPKR(stats?.monthlyRevenue || 0)}
          hint="Platform total"
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Active Owners"
          value={statsLoading ? "..." : String(stats?.activeOwners ?? 0)}
          hint={`${stats?.suspendedOwners || 0} suspended`}
          icon={UserCheck}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === "gyms" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("gyms")}
        >
          All Gyms
        </Button>
        <Button
          variant={activeTab === "owners" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("owners")}
        >
          Gym Owners
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Gyms</CardTitle>
              <CardDescription>Latest registered gyms</CardDescription>
            </CardHeader>
            <CardContent>
              {gymsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {gyms?.slice(0, 5).map((gym) => (
                    <div
                      key={gym.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <div className="font-medium">{gym.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {gym.address || "No address"}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{gym.currency}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserX className="h-4 w-4" /> Suspended Owners
              </CardTitle>
              <CardDescription>Gym owners currently suspended</CardDescription>
            </CardHeader>
            <CardContent>
              {ownersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : owners?.filter((o) => o.is_suspended).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No suspended gym owners</p>
              ) : (
                <div className="space-y-4">
                  {owners
                    ?.filter((o) => o.is_suspended)
                    .map((owner) => (
                      <div
                        key={owner.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div>
                          <div className="font-medium">{owner.user_id.slice(0, 8)}...</div>
                          <Badge variant="destructive" className="mt-1">
                            Suspended
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuspend(owner.user_id, true)}
                          disabled={updateProfile.isPending}
                        >
                          Reactivate
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "gyms" && (
        <Card>
          <CardHeader>
            <CardTitle>All Gyms</CardTitle>
            <CardDescription>Manage all registered gyms</CardDescription>
          </CardHeader>
          <CardContent>
            {gymsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gym Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Fines</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gyms?.map((gym) => (
                    <TableRow key={gym.id}>
                      <TableCell className="font-medium">{gym.name}</TableCell>
                      <TableCell>{gym.address || "-"}</TableCell>
                      <TableCell>{gym.phone || "-"}</TableCell>
                      <TableCell>{gym.currency}</TableCell>
                      <TableCell>
                        {gym.fine_enabled ? (
                          <Badge variant="outline">{formatPKR(gym.fine_amount)}</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(gym.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "owners" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>Gym Owners</CardTitle>
                <CardDescription>Manage gym owner accounts</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search email or gym..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-muted/40"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {ownersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Gym</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOwners?.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell className="text-sm">
                        {owner.email ?? <span className="font-mono text-muted-foreground">{owner.user_id.slice(0, 8)}…</span>}
                      </TableCell>
                      <TableCell>{owner.gym?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        {owner.is_suspended ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : owner.must_change_password ? (
                          <Badge variant="outline">Pending password change</Badge>
                        ) : (
                          <Badge
                            variant="default"
                            className="bg-success/20 text-success"
                          >
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(owner.created_at).toLocaleDateString()}</TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {owner.is_suspended ? (
                              <DropdownMenuItem
                                onClick={() => handleSuspend(owner.user_id, true)}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Reactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleSuspend(owner.user_id, false)}
                                className="text-destructive"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleResetOwnerPassword(owner.user_id)}
                            >
                              <Lock className="mr-2 h-4 w-4" />
                              Reset password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteOwner(owner.user_id)}
                              className="text-destructive"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
