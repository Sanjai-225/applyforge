import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6 inline-flex rounded-2xl bg-primary-500/10 p-4">
          <Search className="h-12 w-12 text-primary-400" />
        </div>
        <h1 className="text-6xl font-extrabold gradient-text mb-2">404</h1>
        <p className="text-xl font-semibold text-white mb-2">Page Not Found</p>
        <p className="text-surface-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-500 transition-all btn-lift"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
