import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth-form";
import { Shield, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Officer Login — ApplyForge",
  description: "Placement Officer login for the ApplyForge admin dashboard.",
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-600/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-500/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-fadeIn">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="rounded-3xl glass-card border border-white/10 p-8 sm:p-9 shadow-2xl">
          <div className="flex items-center gap-3.5 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-primary-600 to-pink-600 shadow-xl shadow-primary-950/40">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white">Officer Portal</h1>
                <span className="rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 text-[10px] font-bold">
                  Admin
                </span>
              </div>
              <p className="text-xs text-surface-400">Campus Placement & Training Officer</p>
            </div>
          </div>

          <LoginForm adminMode />
        </div>
      </div>
    </div>
  );
}
