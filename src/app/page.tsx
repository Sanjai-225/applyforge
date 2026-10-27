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
  Sparkles,
  Bell,
  Check,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden text-surface-100 flex flex-col justify-between">
      {/* Ambient background flares */}
      <div className="absolute top-12 left-1/4 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-pink-500/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[550px] h-[550px] bg-cyan-500/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Header / Navigation */}
      <header className="sticky top-0 z-50 glass border-b border-white/10 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-pink-500 shadow-xl shadow-primary-950/40">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-black text-white tracking-wide">
                Apply<span className="gradient-text">Forge</span>
                <span className="ml-2 rounded-full bg-primary-500/25 border border-primary-500/40 px-2 py-0.5 text-[10px] font-bold text-primary-300">
                  v2.0
                </span>
              </span>
            </div>

            <nav className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-surface-300 hover:text-white hover:bg-white/5 transition-all"
              >
                Student Portal
              </Link>
              <Link
                href="/admin/login"
                className="rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-surface-300 hover:text-white hover:bg-white/5 transition-all"
              >
                Officer Portal
              </Link>
              <Link
                href="/register"
                className="rounded-2xl btn-vibrant-primary px-6 py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-primary-950/50"
              >
                Sign Up
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-24 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500/20 via-pink-500/10 to-cyan-500/20 border border-primary-500/30 px-4 py-1.5 shadow-lg shadow-primary-950/30">
            <Sparkles className="h-4 w-4 text-primary-400" />
            <span className="text-xs sm:text-sm font-bold text-primary-200">
              Next-Gen Campus Placement Command Center
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight">
            Seamless Placement <br />
            <span className="gradient-text">Drives & Real-Time</span> Tracking
          </h1>

          <p className="text-sm sm:text-lg text-surface-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate missed job deadlines, track application funnel completion in real-time, broadcast formatted WhatsApp notifications, and provide students with direct placement cell chat.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl btn-vibrant-primary px-8 py-4 text-sm font-extrabold shadow-xl shadow-primary-950/50"
            >
              Student Registration
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl glass-card px-8 py-4 text-sm font-bold text-surface-200 hover:text-white border border-white/10"
            >
              <Shield className="h-4 w-4 text-primary-400" />
              Placement Officer Login
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <MessageSquare className="h-6 w-6 text-emerald-400" />,
              title: "Live Student Support Chat",
              desc: "WhatsApp-style direct messaging where students can report portal OTP issues or broken links directly to placement officers.",
              badge: "v2.0 New",
              border: "hover:border-emerald-500/40",
            },
            {
              icon: <Bell className="h-6 w-6 text-amber-400" />,
              title: "In-App Reminders & Inbox",
              desc: "Automated deadline alerts and custom broadcasts notify eligible students directly in their dashboard and via email.",
              badge: "v2.0 New",
              border: "hover:border-amber-500/40",
            },
            {
              icon: <BarChart3 className="h-6 w-6 text-cyan-400" />,
              title: "Drive & Student Tracker",
              desc: "Granular visibility into every student's application status with 1-click defaulter reminders and CSV exports.",
              badge: "Real-time",
              border: "hover:border-cyan-500/40",
            },
            {
              icon: <Users className="h-6 w-6 text-violet-400" />,
              title: "Department Isolation",
              desc: "Target jobs by department or whole batch with zero academic CGPA friction — tailored to modern campus hiring standards.",
              badge: "Streamlined",
              border: "hover:border-violet-500/40",
            },
            {
              icon: <Globe className="h-6 w-6 text-pink-400" />,
              title: "WhatsApp Group Integrations",
              desc: "One-click formatted broadcast generator creates instant share links for departmental WhatsApp announcement groups.",
              badge: "Instant Share",
              border: "hover:border-pink-500/40",
            },
            {
              icon: <Shield className="h-6 w-6 text-sky-400" />,
              title: "Strict Role Security",
              desc: "Dedicated route guards and multi-layered middleware enforce complete separation between student and officer portals.",
              badge: "Secured",
              border: "hover:border-sky-500/40",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={`rounded-3xl glass-card p-6 border border-white/10 space-y-3 transition-all ${feature.border}`}
            >
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                  {feature.icon}
                </div>
                <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-surface-300">
                  {feature.badge}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{feature.title}</h3>
              <p className="text-xs text-surface-300 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/10 py-6 text-center text-xs text-surface-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 ApplyForge. Designed for high-velocity campus recruitment.</p>
          <div className="flex items-center gap-4 text-surface-400">
            <Link href="/login" className="hover:text-white transition-colors">Students</Link>
            <Link href="/admin/login" className="hover:text-white transition-colors">Placement Officers</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
