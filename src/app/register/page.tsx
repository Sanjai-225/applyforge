import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth-form";
import { Briefcase, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Register — ApplyForge",
  description: "Create your student account to track job applications on ApplyForge.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg animate-fadeIn">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="rounded-3xl glass-card border border-white/10 p-8 sm:p-9 shadow-2xl">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-pink-500 shadow-xl shadow-primary-950/40">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">Create Student Profile</h1>
              <p className="text-xs text-surface-400">Join campus placement drives</p>
            </div>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-xs text-surface-400">
            Already registered?{" "}
            <Link href="/login" className="text-primary-300 hover:text-primary-200 font-bold underline transition-colors">
              Sign In to dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
