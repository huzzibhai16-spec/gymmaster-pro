import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Dumbbell, Mail, Lock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — GymOS" },
      { name: "description", content: "Sign in to your GymOS dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-10 border-r border-border">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 50% at 30% 30%, oklch(0.82 0.145 88 / 0.18), transparent 60%), radial-gradient(ellipse 40% 40% at 80% 90%, oklch(0.82 0.145 88 / 0.08), transparent 60%)",
          }}
        />
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl gold-gradient grid place-items-center shadow-lg shadow-primary/20">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">GymOS</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Body Strong</div>
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <h2 className="text-4xl font-semibold tracking-tight leading-tight">
            Run your gym like a <span className="text-gold">world-class</span> operation.
          </h2>
          <p className="text-muted-foreground">
            Members, attendance, payments and reports — one calm, powerful dashboard built for owners who care about the details.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-6">
            {[
              { k: "1,240+", v: "Members" },
              { k: "PKR 4.9M", v: "Yearly Revenue" },
              { k: "99.9%", v: "Uptime" },
            ].map((s) => (
              <div key={s.v} className="glass rounded-xl p-3">
                <div className="text-lg font-semibold">{s.k}</div>
                <div className="text-[11px] text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} Body Strong Gym. All rights reserved.</div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            setTimeout(() => navigate({ to: "/dashboard" }), 500);
          }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="lg:hidden flex items-center gap-2.5 justify-center">
            <div className="h-10 w-10 rounded-xl gold-gradient grid place-items-center">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">GymOS</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your gym dashboard.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" defaultValue="owner@bodystrong.pk" required className="pl-9 h-11 bg-muted/40" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-muted-foreground hover:text-primary">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" defaultValue="demo1234" required className="pl-9 h-11 bg-muted/40" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox defaultChecked /> Remember me on this device
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 gold-gradient text-primary-foreground hover:opacity-95 shadow-lg shadow-primary/20"
          >
            {loading ? "Signing in…" : (<>Sign in <ArrowRight className="ml-1 h-4 w-4" /></>)}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Demo mode — <Link to="/dashboard" className="text-primary hover:underline">skip to dashboard</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
