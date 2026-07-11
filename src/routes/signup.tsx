import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up disabled — GymOS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignUpDisabledPage,
});

function SignUpDisabledPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8962C] grid place-items-center shadow-lg shadow-[#D4AF37]/20">
            <Dumbbell className="h-6 w-6 text-[#0A0A0A]" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">GymOS</span>
        </div>
        <div className="rounded-2xl border border-[#2A2A2A] bg-[#111] p-8 space-y-4 text-center">
          <h1 className="text-2xl font-bold text-white">Sign up is not available</h1>
          <p className="text-sm text-gray-400">
            GymOS is a managed platform. Gym owner accounts are created by the Super Admin. Please
            contact your administrator to request access.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#E4BF47] font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
