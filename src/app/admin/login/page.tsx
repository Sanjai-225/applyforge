import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth-form";
import { Shield, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Login — ApplyForge",
  description: "Placement Officer login for the ApplyForge admin dashboard.",
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-[128px]" />

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-300 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="rounded-2xl bg-surface-900/80 backdrop-blur-sm border border-surface-700 shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-primary-700 shadow-lg shadow-primary-900/30">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Officer Login</h1>
              <p className="text-xs text-surface-400">Placement Training Officer Portal</p>
            </div>
          </div>

          <LoginForm adminMode />
        </div>
      </div>
    </div>
  );
}
