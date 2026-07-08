import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Dumbbell, Mail, Lock, ArrowRight, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — GymOS" },
      { name: "description", content: "Create your GymOS account and start managing your gym." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const gymName = formData.get("gymName") as string;

    const result = await signUp(email, password, gymName);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      navigate({ to: "/dashboard" });
    }
  }

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
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Gym Management</div>
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <h2 className="text-4xl font-semibold tracking-tight leading-tight">
            Start your <span className="text-gold">gym's journey</span> with us.
          </h2>
          <p className="text-muted-foreground">
            Create an account to manage members, track attendance, process payments, and grow your gym business.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-6">
            {[
              { k: "1,240+", v: "Members Managed" },
              { k: "PKR 4.9M", v: "Revenue Tracked" },
              { k: "99.9%", v: "Uptime" },
            ].map((s) => (
              <div key={s.v} className="glass rounded-xl p-3">
                <div className="text-lg font-semibold">{s.k}</div>
                <div className="text-[11px] text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} GymOS. All rights reserved.</div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2.5 justify-center">
            <div className="h-10 w-10 rounded-xl gold-gradient grid place-items-center">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">GymOS</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
            <p className="text-sm text-muted-foreground">Start managing your gym today.</p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gymName">Gym Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="gymName"
                  name="gymName"
                  type="text"
                  placeholder="Body Strong Gym"
                  required
                  className="pl-9 h-11 bg-muted/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="owner@gym.com"
                  required
                  className="pl-9 h-11 bg-muted/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="pl-9 h-11 bg-muted/40"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 gold-gradient text-primary-foreground hover:opacity-95 shadow-lg shadow-primary/20"
          >
            {loading ? "Creating account…" : (
              <>
                Create account <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
