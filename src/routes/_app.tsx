import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Bell, Search, Dumbbell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, gym, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl gold-gradient grid place-items-center animate-pulse">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const gymInitials = gym?.name
    ? gym.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "GY";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-14 border-b border-border/60 bg-background/70 backdrop-blur-xl">
            <div className="flex h-full items-center gap-3 px-4">
              <SidebarTrigger className="h-8 w-8" />
              <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members, payments…"
                    className="pl-9 h-9 bg-muted/40 border-border/60 focus-visible:ring-primary/40"
                  />
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button className="relative h-9 w-9 grid place-items-center rounded-full hover:bg-muted transition-colors">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
                </button>
                <div className="flex items-center gap-2 pl-2 border-l border-border/60">
                  <div className="h-8 w-8 rounded-full gold-gradient grid place-items-center text-primary-foreground text-xs font-semibold">
                    {gymInitials}
                  </div>
                  <div className="hidden sm:flex flex-col leading-tight">
                    <span className="text-xs font-medium">{gym?.name || "My Gym"}</span>
                    <span className="text-[10px] text-muted-foreground">Owner</span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
