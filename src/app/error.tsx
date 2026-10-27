"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6 inline-flex rounded-2xl bg-red-500/10 p-4">
          <AlertTriangle className="h-12 w-12 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-surface-400 mb-6">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-500 transition-all"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl bg-surface-800 px-5 py-2.5 text-sm text-surface-300 hover:bg-surface-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
