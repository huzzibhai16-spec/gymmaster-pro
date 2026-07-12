import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dumbbell, Lock, Eye, EyeOff, Loader as Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — GymOS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    // Supabase redirects here with a recovery session already established.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirm = form.get("confirm") as string;
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    // Best-effort: clear must_change_password flag for the signed-in user.
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (sess.session?.user?.id) {
        await supabase
          .from("user_profiles")
          .update({ must_change_password: false })
          .eq("user_id", sess.session.user.id);
      }
    } catch {
      /* non-fatal */
    }
    setLoading(false);
    setDone(true);
    await supabase.auth.signOut();
    setTimeout(() => navigate({ to: "/login" }), 1500);

  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8962C] grid place-items-center shadow-lg shadow-[#D4AF37]/20">
            <Dumbbell className="h-6 w-6 text-[#0A0A0A]" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">GymOS</span>
        </div>

        <div className="rounded-2xl border border-[#2A2A2A] bg-[#111] p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Set a new password</h1>
            <p className="text-sm text-gray-400">Choose a strong password of at least 6 characters.</p>
          </div>

          {done ? (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              Password updated. Redirecting to sign in…
            </div>
          ) : !ready ? (
            <div className="text-sm text-gray-400">
              Waiting for reset link session… If nothing happens, request a new{" "}
              <Link to="/forgot-password" className="text-[#D4AF37]">reset link</Link>.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              <PasswordField id="password" label="New password" show={showPw} onToggle={() => setShowPw((s) => !s)} />
              <PasswordField id="confirm" label="Confirm password" show={showPw} onToggle={() => setShowPw((s) => !s)} />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#E4BF47] hover:to-[#D4AF37] text-[#0A0A0A] font-semibold rounded-lg"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  show,
  onToggle,
}: {
  id: string;
  label: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm text-gray-300">
        {label}
      </Label>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          required
          minLength={6}
          className="h-12 pl-11 pr-11 bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder:text-gray-600 rounded-lg focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#D4AF37]"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
