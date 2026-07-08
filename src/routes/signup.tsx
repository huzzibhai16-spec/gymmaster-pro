import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Dumbbell, Mail, Lock, ArrowRight, Building2, Loader as Loader2 } from "lucide-react";
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
    <div className="min-h-screen w-full flex bg-[#0A0A0A] relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#D4AF37]/3 rounded-full blur-[120px] translate-x-1/4 translate-y-1/4" />
      </div>

      {/* Left side - Hero Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        {/* Background with athlete image */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 via-transparent to-[#0A0A0A]/80" />
        <div className="absolute inset-0 bg-[#0A0A0A]/40" />

        {/* Athlete image */}
        <img
          src="https://images.pexels.com/photos/4162487/pexels-photo-4162487.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          alt="Premium Fitness"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Gold glow effect behind athlete */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#D4AF37]/15 rounded-full blur-[100px]" />

        {/* Gradient overlay for seamless blend */}
        <div className="absolute inset-0 bg-gradient-to-l from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />

        {/* Stats overlay */}
        <div className="absolute bottom-12 left-12 z-10">
          <div className="glass-luxury rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#D4AF37]/20 grid place-items-center">
                <span className="text-[#D4AF37] font-bold">+</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">2,500+</div>
                <div className="text-xs text-gray-400">Active Members</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#D4AF37]/20 grid place-items-center">
                <span className="text-[#D4AF37] font-bold">$</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">$1.2M</div>
                <div className="text-xs text-gray-400">Revenue Tracked</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#D4AF37]/20 grid place-items-center">
                <span className="text-[#D4AF37] font-bold">★</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-xs text-gray-400">Uptime SLA</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Content & Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 relative z-10">
        <div className="max-w-md mx-auto lg:mx-0 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8962C] grid place-items-center shadow-lg shadow-[#D4AF37]/20">
              <Dumbbell className="h-6 w-6 text-[#0A0A0A]" />
            </div>
            <div className="leading-tight">
              <span className="text-xl font-bold text-white tracking-tight">GymOS</span>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/80 font-medium">Premium Management</div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
              Begin Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F4CF47]">Fitness Empire</span>
            </h1>
            <p className="text-gray-400 text-base leading-relaxed">
              Join thousands of gym owners who trust GymOS to manage their business.
            </p>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Gym Name Field */}
              <div className="space-y-2">
                <Label htmlFor="gymName" className="text-sm text-gray-300 font-medium">
                  Gym Name
                </Label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                  <Input
                    id="gymName"
                    name="gymName"
                    type="text"
                    placeholder="Elite Fitness Gym"
                    required
                    className="h-12 pl-11 bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder:text-gray-600 rounded-lg focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-300 font-medium">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="owner@gym.com"
                    required
                    className="h-12 pl-11 bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder:text-gray-600 rounded-lg focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-gray-300 font-medium">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    className="h-12 pl-11 bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder:text-gray-600 rounded-lg focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#D4AF37] to-[#C9A227] hover:from-[#E4BF47] hover:to-[#D4AF37] text-[#0A0A0A] font-semibold rounded-lg shadow-lg shadow-[#D4AF37]/25 hover:shadow-[#D4AF37]/40 transition-all duration-300 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-500 pt-2">
              Already have an account?{" "}
              <Link to="/login" className="text-[#D4AF37] hover:text-[#E4BF47] font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </form>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-[#1A1A1A]">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} GymOS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
