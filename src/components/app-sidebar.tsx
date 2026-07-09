import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, CalendarCheck, TrendingUp, Wallet, CircleAlert as AlertCircle, UserX, ChartBar as FileBarChart, Settings, LogOut, Dumbbell, Receipt, Shield } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";

// Gym Owner menu items
const gymOwnerItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Members", url: "/members", icon: Users },
  { title: "Attendance", url: "/attendance", icon: CalendarCheck },
  { title: "Revenue", url: "/revenue", icon: TrendingUp },
  { title: "Payments", url: "/payments", icon: Wallet },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "Pending Dues", url: "/pending-dues", icon: AlertCircle },
  { title: "Inactive Members", url: "/inactive", icon: UserX },
  { title: "Reports", url: "/reports", icon: FileBarChart },
  { title: "Settings", url: "/settings", icon: Settings },
];

// Admin menu items
const adminItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
  { title: "All Gyms", url: "/admin", icon: LayoutDashboard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { gym, isAdmin, signOut } = useAuth();

  // Select menu items based on role
  const items = isAdmin ? adminItems : gymOwnerItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border py-4">
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden shadow-lg shadow-primary/20">
            {gym?.logo_url ? (
              <img src={gym.logo_url} alt="Gym logo" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full gold-gradient grid place-items-center">
                {isAdmin ? (
                  <Shield className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <Dumbbell className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">
                {isAdmin ? "GymOS Admin" : "GymOS"}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {isAdmin ? "Administration" : gym?.name || "My Gym"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1.5 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url || (item.url !== "/dashboard" && item.url !== "/admin" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:border-l-2 data-[active=true]:border-primary rounded-md h-10"
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4.5 w-4.5" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive h-10"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
