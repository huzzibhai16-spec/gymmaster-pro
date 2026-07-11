import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Dumbbell, Mail, ArrowLeft, Loader as Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — GymOS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const email = new FormData(e.currentTarget).get("email") as string;

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
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
            <h1 className="text-2xl font-bold text-white mb-2">Reset your password</h1>
            <p className="text-sm text-gray-400">
              Enter your email and we'll send you a link to set a new password.
            </p>
          </div>

          {sent ? (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              If an account exists for that email, a reset link is on its way.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="owner@gym.com"
                    className="h-12 pl-11 bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder:text-gray-600 rounded-lg focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#E4BF47] hover:to-[#D4AF37] text-[#0A0A0A] font-semibold rounded-lg"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
          )}

          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#E4BF47]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
