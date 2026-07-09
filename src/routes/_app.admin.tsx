import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useAdminDashboardStats, useAllGyms, useAllGymOwners, useUpdateUserProfile, formatPKR } from "@/hooks/use-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, DollarSign, UserCheck, UserX, MoveVertical as MoreVertical, Loader as Loader2 } from "lucide-react";
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
import { useState } from "react";

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
  const [activeTab, setActiveTab] = useState<"overview" | "gyms" | "owners">("overview");
  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats();
  const { data: gyms, isLoading: gymsLoading } = useAllGyms();
  const { data: owners, isLoading: ownersLoading } = useAllGymOwners();
  const updateProfile = useUpdateUserProfile();

  const handleSuspend = (userId: string, isSuspended: boolean) => {
    updateProfile.mutate({
      userId,
      updates: { is_suspended: !isSuspended },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Manage all gyms and gym owners" />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Gyms"
          value={statsLoading ? "..." : stats?.totalGyms || 0}
          description="Registered gyms"
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          title="Total Members"
          value={statsLoading ? "..." : stats?.totalMembers || 0}
          description="Across all gyms"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Monthly Revenue"
          value={statsLoading ? "..." : formatPKR(stats?.monthlyRevenue || 0)}
          description="Platform total"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Active Owners"
          value={statsLoading ? "..." : stats?.activeOwners || 0}
          description={`${stats?.suspendedOwners || 0} suspended`}
          icon={<UserCheck className="h-4 w-4" />}
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
          {/* Recent Gyms */}
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
                      <div className="text-sm text-muted-foreground">
                        {gym.currency}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suspended Owners */}
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
                <p className="text-sm text-muted-foreground py-4">
                  No suspended gym owners
                </p>
              ) : (
                <div className="space-y-4">
                  {owners?.filter((o) => o.is_suspended).map((owner) => (
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
                      <TableCell>
                        {new Date(gym.created_at).toLocaleDateString()}
                      </TableCell>
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
            <CardTitle>Gym Owners</CardTitle>
            <CardDescription>Manage gym owner accounts</CardDescription>
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
                    <TableHead>User ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {owners?.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell className="font-mono text-sm">
                        {owner.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{owner.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {owner.is_suspended ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="default" className="bg-success/20 text-success">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(owner.created_at).toLocaleDateString()}
                      </TableCell>
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
