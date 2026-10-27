import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Shield,
  Users,
  BarChart3,
  MessageSquare,
  Mail,
  Zap,
  Globe,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[128px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-800/5 rounded-full blur-[200px]" />

      {/* Header / Navigation */}
      <header className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-900/30">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Apply<span className="gradient-text">Forge</span>
              </span>
            </div>
            <nav className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-all"
              >
                Student Login
              </Link>
              <Link
                href="/admin/login"
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-all"
              >
                Admin Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-900/30 hover:from-primary-500 hover:to-primary-600 transition-all btn-lift"
              >
                Sign Up
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 border border-primary-500/20 px-4 py-1.5 mb-8">
            <Zap className="h-4 w-4 text-primary-400" />
            <span className="text-sm font-medium text-primary-300">
              College Placement Tracking Made Simple
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
            Track Every{" "}
            <span className="gradient-text">Application</span>,{" "}
            <br className="hidden sm:block" />
            Zero Blind Spots
          </h1>

          <p className="mt-6 text-lg text-surface-400 max-w-2xl mx-auto leading-relaxed">
            ApplyForge bridges the gap between placement cells and students.
            Broadcast job links, track who applied, and ensure 100% student
            accountability — all in one platform.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary-900/30 hover:from-primary-500 hover:to-primary-600 transition-all btn-lift"
            >
              Get Started
              <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/admin/login"
              className="flex items-center gap-2 rounded-xl bg-surface-800 border border-surface-700 px-8 py-4 text-base font-medium text-surface-300 hover:bg-surface-700 hover:text-white transition-all"
            >
              <Shield className="h-5 w-5" />
              Officer Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">
            Everything Your Placement Cell Needs
          </h2>
          <p className="mt-3 text-surface-400">
            From job posting to compliance tracking — all in one dashboard.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <MessageSquare className="h-6 w-6" />,
              title: "WhatsApp Integration",
              description:
                "1-click formatted broadcasts to multiple WhatsApp groups with ready-to-paste messages and share links.",
              color: "from-emerald-600/20 to-emerald-800/10 border-emerald-500/20",
              iconColor: "text-emerald-400",
            },
            {
              icon: <Mail className="h-6 w-6" />,
              title: "Email Notifications",
              description:
                "Automated email alerts to eligible students with job details, priority badges, and direct apply links.",
              color: "from-blue-600/20 to-blue-800/10 border-blue-500/20",
              iconColor: "text-blue-400",
            },
            {
              icon: <BarChart3 className="h-6 w-6" />,
              title: "Job-Wise Tracking",
              description:
                "See exactly who applied, who didn't, and who's facing trouble — for every single job posting.",
              color: "from-primary-600/20 to-primary-800/10 border-primary-500/20",
              iconColor: "text-primary-400",
            },
            {
              icon: <Users className="h-6 w-6" />,
              title: "Student Compliance",
              description:
                "Track each student's application completion rate across all assigned jobs with profile-level insights.",
              color: "from-amber-600/20 to-amber-800/10 border-amber-500/20",
              iconColor: "text-amber-400",
            },
            {
              icon: <CheckCircle2 className="h-6 w-6" />,
              title: "2-Step Confirm Flow",
              description:
                "Students click the job link, then confirm their status — Applied, Facing Trouble, or Not Eligible.",
              color: "from-violet-600/20 to-violet-800/10 border-violet-500/20",
              iconColor: "text-violet-400",
            },
            {
              icon: <Globe className="h-6 w-6" />,
              title: "CSV Exports",
              description:
                "Export job-wise applicant lists or master compliance reports for HR or department coordinators.",
              color: "from-rose-600/20 to-rose-800/10 border-rose-500/20",
              iconColor: "text-rose-400",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${feature.color} border p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-fadeIn`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className={`mb-4 inline-flex rounded-xl bg-surface-800/50 p-3 ${feature.iconColor}`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                {feature.description}
              </p>
              <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-surface-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary-500" />
              <span className="text-sm font-semibold text-surface-400">
                ApplyForge
              </span>
            </div>
            <p className="text-xs text-surface-600">
              Built for college placement cells. © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
