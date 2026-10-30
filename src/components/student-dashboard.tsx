"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/client";
import type { StudentDashboard, AppStatus, JobApplication, Job } from "@/lib/types";
import {
  KPICard,
  PriorityBadge,
  StatusBadge,
  Toast,
  FullPageSpinner,
  EmptyState,
  Modal,
} from "./shared";
import { NotificationDrawer, StudentHelpChatDrawer } from "./student-inbox";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  Send,
  LogOut,
  User,
  Filter,
  Loader2,
  Bell,
  MessageCircle,
  Mail,
  Phone,
  Hash,
  Building2,
} from "lucide-react";

const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

type FilterTab = "ALL" | "NOT_APPLIED" | "APPLIED" | "TROUBLE";
type StudentView = "jobs" | "profile";

export default function StudentDashboardView() {
  const router = useRouter();
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("ALL");
  const [view, setView] = useState<StudentView>("jobs");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [actionModal, setActionModal] = useState<{
    app: JobApplication & { job: Job };
  } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpChat, setShowHelpChat] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await get<StudentDashboard>("/api/snapshot?scope=student");
    if (res.ok && res.data) {
      setData(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (data?.profile?.role === "admin") {
      router.replace("/admin");
    }
  }, [data, router]);

  async function handleLogout() {
    await post("/api/auth/logout", {});
    router.push("/");
    router.refresh();
  }

  async function handleClickJob(jobId: string, url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
    await post("/api/command", { type: "RECORD_JOB_CLICK", jobId });
    fetchData();
  }

  async function handleMarkNotificationRead(id: string) {
    await post("/api/command", { type: "MARK_NOTIFICATION_READ", notificationId: id });
    fetchData();
  }

  if (loading) return <FullPageSpinner />;
  if (!data) return null;

  const { profile, kpis, applications, notifications = [], help_messages = [] } = data;

  const unreadNotifications = notifications.filter((n) => !n.is_read).length;

  // Sort by priority then deadline
  const sortedApps = [...applications].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.job?.priority] ?? 2;
    const pb = PRIORITY_ORDER[b.job?.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    const da = a.job?.deadline ? new Date(a.job.deadline).getTime() : Infinity;
    const db = b.job?.deadline ? new Date(b.job.deadline).getTime() : Infinity;
    return da - db;
  });

  // Filter
  const filteredApps = sortedApps.filter((a) => {
    if (tab === "ALL") return true;
    if (tab === "NOT_APPLIED") return a.status === "NOT_APPLIED";
    if (tab === "APPLIED") return a.status === "APPLIED";
    if (tab === "TROUBLE") return a.status === "FACING_TROUBLE" || a.status === "NOT_ELIGIBLE";
    return true;
  });

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "ALL", label: "All Jobs", count: applications.length },
    { key: "NOT_APPLIED", label: "Pending Action", count: kpis.not_applied },
    { key: "APPLIED", label: "Applied", count: kpis.applied },
    { key: "TROUBLE", label: "Issues", count: kpis.facing_trouble + kpis.not_eligible },
  ];

  return (
    <div className="min-h-screen bg-surface-950">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-surface-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-900/30">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">ApplyForge</h1>
                <p className="text-[10px] text-surface-400 -mt-0.5">Student Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="hidden sm:flex items-center rounded-xl bg-surface-800 border border-surface-700 p-0.5">
                <button
                  onClick={() => setView("jobs")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    view === "jobs"
                      ? "bg-primary-600/30 text-primary-300"
                      : "text-surface-400 hover:text-white"
                  }`}
                >
                  Jobs
                </button>
                <button
                  onClick={() => setView("profile")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    view === "profile"
                      ? "bg-primary-600/30 text-primary-300"
                      : "text-surface-400 hover:text-white"
                  }`}
                >
                  Profile
                </button>
              </div>

              {/* Help Chat Button */}
              <button
                onClick={() => setShowHelpChat(true)}
                className="relative flex items-center gap-1.5 rounded-xl bg-surface-800 border border-surface-700 px-3 py-2 text-sm text-emerald-400 hover:bg-surface-700 transition-all"
                title="Contact Admin"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Help</span>
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => setShowNotifications(true)}
                className="relative flex items-center justify-center rounded-xl bg-surface-800 border border-surface-700 p-2 text-surface-400 hover:bg-surface-700 hover:text-white transition-all"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </button>

              {profile.role === "admin" && (
                <button
                  onClick={() => router.push("/admin")}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 shadow-md transition-all"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Go to Admin Portal</span>
                </button>
              )}

              {/* User Info */}
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-surface-800 px-3 py-2">
                <User className="h-4 w-4 text-primary-400" />
                <span className="text-sm text-surface-300">{profile.full_name}</span>
                <span className="text-xs text-surface-500">({profile.roll_number || profile.department})</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl bg-surface-800 px-3 py-2 text-sm text-surface-400 hover:bg-surface-700 hover:text-white transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile View Toggle */}
      <div className="sm:hidden flex items-center gap-2 px-4 pt-4">
        <button
          onClick={() => setView("jobs")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            view === "jobs"
              ? "bg-primary-600/20 text-primary-300 border border-primary-500/30"
              : "bg-surface-800 text-surface-400 border border-surface-700"
          }`}
        >
          Jobs
        </button>
        <button
          onClick={() => setView("profile")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            view === "profile"
              ? "bg-primary-600/20 text-primary-300 border border-primary-500/30"
              : "bg-surface-800 text-surface-400 border border-surface-700"
          }`}
        >
          Profile
        </button>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {view === "profile" ? (
          /* ─── Profile View ──────────────────────────── */
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl bg-surface-800/50 border border-surface-700 overflow-hidden">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-primary-600/20 to-primary-800/20 px-6 py-8 text-center border-b border-surface-700">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-xl shadow-primary-900/30 mb-4">
                  <User className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
                <p className="text-sm text-surface-400 mt-1">{profile.department} Department</p>
              </div>

              {/* Profile Details */}
              <div className="p-6 space-y-4">
                <ProfileField icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
                <ProfileField icon={<Phone className="h-4 w-4" />} label="Phone" value={profile.phone || "Not set"} />
                <ProfileField icon={<Hash className="h-4 w-4" />} label="Roll Number" value={profile.roll_number || "Not set"} />
                <ProfileField icon={<Building2 className="h-4 w-4" />} label="Department" value={profile.department} />
              </div>

              {/* Stats Summary */}
              <div className="border-t border-surface-700 px-6 py-5">
                <h3 className="text-sm font-semibold text-surface-300 mb-3">Application Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <StatItem label="Total Jobs" value={kpis.total_jobs} />
                  <StatItem label="Applied" value={kpis.applied} color="text-emerald-400" />
                  <StatItem label="Pending" value={kpis.not_applied} color="text-amber-400" />
                  <StatItem label="Completion" value={`${kpis.completion_pct}%`} color="text-primary-400" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ─── Jobs View ─────────────────────────────── */
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <KPICard
                label="Total Jobs"
                value={kpis.total_jobs}
                icon={<Briefcase className="h-5 w-5" />}
                color="primary"
              />
              <KPICard
                label="Applied"
                value={kpis.applied}
                icon={<CheckCircle2 className="h-5 w-5" />}
                color="green"
              />
              <KPICard
                label="Pending"
                value={kpis.not_applied}
                icon={<Clock className="h-5 w-5" />}
                color="yellow"
              />
              <KPICard
                label="Trouble"
                value={kpis.facing_trouble}
                icon={<AlertTriangle className="h-5 w-5" />}
                color="red"
              />
              <KPICard
                label="Completion"
                value={`${kpis.completion_pct}%`}
                icon={<TrendingUp className="h-5 w-5" />}
                color="primary"
                subtitle={`${kpis.applied} of ${kpis.total_jobs} jobs`}
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <Filter className="h-4 w-4 text-surface-500 flex-shrink-0" />
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                    tab === t.key
                      ? "bg-primary-600/20 text-primary-300 border border-primary-500/30"
                      : "bg-surface-800 text-surface-400 border border-surface-700 hover:bg-surface-700 hover:text-surface-300"
                  }`}
                >
                  {t.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      tab === t.key
                        ? "bg-primary-500/20 text-primary-300"
                        : "bg-surface-700 text-surface-500"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Job Cards */}
            {filteredApps.length === 0 ? (
              <EmptyState
                icon={<Briefcase className="h-8 w-8" />}
                title="No jobs found"
                description="No jobs match your current filter selection."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredApps.map((app, idx) => (
                  <JobCard
                    key={app.id}
                    app={app}
                    index={idx}
                    onClickJob={handleClickJob}
                    onAction={() => setActionModal({ app })}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Action Modal */}
      {actionModal && (
        <StatusUpdateModal
          app={actionModal.app}
          onClose={() => setActionModal(null)}
          onSuccess={(msg) => {
            setToast({ message: msg, type: "success" });
            setActionModal(null);
            fetchData();
          }}
          onError={(msg) => setToast({ message: msg, type: "error" })}
        />
      )}

      {/* Notification Drawer */}
      {showNotifications && (
        <NotificationDrawer
          notifications={notifications}
          onMarkRead={handleMarkNotificationRead}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Help Chat Drawer */}
      {showHelpChat && (
        <StudentHelpChatDrawer
          messages={help_messages}
          onClose={() => setShowHelpChat(false)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}

/* ─── Profile Field ────────────────────────────────────── */
function ProfileField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-900/50 border border-surface-700/50 px-4 py-3">
      <span className="text-primary-400">{icon}</span>
      <div>
        <p className="text-[10px] text-surface-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  );
}

/* ─── Stat Item ────────────────────────────────────────── */
function StatItem({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl bg-surface-900/50 border border-surface-700/50 px-4 py-3 text-center">
      <p className={`text-lg font-bold ${color || "text-white"}`}>{value}</p>
      <p className="text-[10px] text-surface-500 mt-0.5">{label}</p>
    </div>
  );
}

/* ─── Job Card ─────────────────────────────────────────── */
function JobCard({
  app,
  index,
  onClickJob,
  onAction,
}: {
  app: JobApplication & { job: Job };
  index: number;
  onClickJob: (jobId: string, url: string) => void;
  onAction: () => void;
}) {
  const job = app.job;
  if (!job) return null;

  const deadline = job.deadline
    ? new Date(job.deadline).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false;

  return (
    <div
      className="group relative rounded-2xl bg-surface-800/50 border border-surface-700 p-5 transition-all duration-300 hover:border-surface-600 hover:shadow-xl hover:shadow-primary-950/20 animate-fadeIn"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Priority + Status */}
      <div className="flex items-center justify-between mb-3">
        <PriorityBadge priority={job.priority} />
        <StatusBadge status={app.status} />
      </div>

      {/* Company & Role */}
      <h3 className="text-white font-semibold text-base mb-1 group-hover:text-primary-300 transition-colors">
        {job.company_name}
      </h3>
      <p className="text-surface-400 text-sm mb-3">{job.title}</p>

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs text-surface-500">
        {job.package_ctc && (
          <span className="rounded-lg bg-surface-700/50 px-2 py-1">💰 {job.package_ctc}</span>
        )}
        {job.location && (
          <span className="rounded-lg bg-surface-700/50 px-2 py-1">📍 {job.location}</span>
        )}
        {deadline && (
          <span
            className={`rounded-lg px-2 py-1 ${
              isExpired
                ? "bg-red-900/30 text-red-400"
                : "bg-surface-700/50"
            }`}
          >
            📅 {deadline} {isExpired && "(Expired)"}
          </span>
        )}
      </div>

      {/* Click tracking indicator */}
      {app.link_clicked_at && (
        <p className="text-xs text-surface-500 mb-3">
          🔗 Link opened on{" "}
          {new Date(app.link_clicked_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}

      {/* Applied info */}
      {app.status === "APPLIED" && app.applied_at && (
        <p className="text-xs text-emerald-400/80 mb-3">
          ✅ Applied on{" "}
          {new Date(app.applied_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {app.application_ref && ` • Ref: ${app.application_ref}`}
        </p>
      )}

      {/* Trouble info */}
      {app.status === "FACING_TROUBLE" && (
        <div className="rounded-lg bg-red-900/20 border border-red-800/30 p-2.5 mb-3">
          <p className="text-xs text-red-300">
            ⚠️ {app.issue_category?.replace(/_/g, " ")}
          </p>
          {app.issue_note && (
            <p className="text-xs text-red-400/70 mt-1">{app.issue_note}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onClickJob(job.id, job.application_url)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary-600/20 border border-primary-500/30 px-3 py-2.5 text-xs font-medium text-primary-300 hover:bg-primary-600/30 transition-all"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Job Link
        </button>
        <button
          onClick={onAction}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-surface-700 border border-surface-600 px-3 py-2.5 text-xs font-medium text-surface-300 hover:bg-surface-600 hover:text-white transition-all"
        >
          <Send className="h-3.5 w-3.5" />
          Update Status
        </button>
      </div>
    </div>
  );
}

/* ─── Status Update Modal ──────────────────────────────── */
function StatusUpdateModal({
  app,
  onClose,
  onSuccess,
  onError,
}: {
  app: JobApplication & { job: Job };
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [status, setStatus] = useState<AppStatus>(app.status);
  const [applicationRef, setApplicationRef] = useState(app.application_ref || "");
  const [issueCategory, setIssueCategory] = useState(app.issue_category || "");
  const [issueNote, setIssueNote] = useState(app.issue_note || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    const payload: Record<string, unknown> = {
      type: "UPDATE_APPLICATION_STATUS",
      jobId: app.job_id,
      status,
    };

    if (status === "APPLIED" && applicationRef) {
      payload.applicationRef = applicationRef;
    }
    if (status === "FACING_TROUBLE") {
      payload.issueCategory = issueCategory || "OTHER_ISSUE";
      payload.issueNote = issueNote;
    }
    if (status === "NOT_ELIGIBLE") {
      payload.issueNote = issueNote;
    }

    const res = await post("/api/command", payload);
    if (res.ok) {
      onSuccess("Status updated successfully!");
    } else {
      onError(res.error || "Failed to update status");
    }
    setSaving(false);
  }

  const issueOptions = [
    { value: "LINK_EXPIRED_OR_BROKEN", label: "Link Expired / Broken" },
    { value: "PORTAL_OR_OTP_ERROR", label: "Portal / OTP Error" },
    { value: "ELIGIBILITY_BLOCKED", label: "Eligibility Blocked" },
    { value: "OTHER_ISSUE", label: "Other Issue" },
  ];

  return (
    <Modal isOpen onClose={onClose} title={`Update Status — ${app.job?.company_name}`} size="md">
      <div className="space-y-5">
        <div>
          <p className="text-sm text-surface-400 mb-1">{app.job?.title}</p>
        </div>

        {/* Status Selection */}
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "APPLIED", label: "Applied Successfully", icon: "✅", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
              { value: "FACING_TROUBLE", label: "Facing Trouble", icon: "⚠️", color: "border-red-500/30 bg-red-500/10 text-red-300" },
              { value: "NOT_ELIGIBLE", label: "Not Eligible", icon: "🚫", color: "border-slate-500/30 bg-slate-500/10 text-slate-300" },
              { value: "NOT_APPLIED", label: "Not Applied Yet", icon: "⏳", color: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`rounded-xl border p-3 text-left transition-all ${
                status === opt.value
                  ? `${opt.color} ring-2 ring-offset-1 ring-offset-surface-900`
                  : "border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600"
              }`}
            >
              <span className="text-lg">{opt.icon}</span>
              <p className="text-sm font-medium mt-1">{opt.label}</p>
            </button>
          ))}
        </div>

        {/* Conditional Fields */}
        {status === "APPLIED" && (
          <div className="space-y-1.5 animate-fadeIn">
            <label className="text-sm font-medium text-surface-300">
              Application Reference ID (Optional)
            </label>
            <input
              type="text"
              value={applicationRef}
              onChange={(e) => setApplicationRef(e.target.value)}
              className="w-full rounded-xl bg-surface-800 border border-surface-600 px-4 py-3 text-sm text-white placeholder-surface-500"
              placeholder="e.g., TCS-2027-ABC123"
            />
          </div>
        )}

        {status === "FACING_TROUBLE" && (
          <div className="space-y-3 animate-fadeIn">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-300">Issue Category</label>
              <select
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value)}
                className="w-full rounded-xl bg-surface-800 border border-surface-600 px-4 py-3 text-sm text-white appearance-none cursor-pointer"
              >
                <option value="">Select issue type</option>
                {issueOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-300">
                Describe the Issue <span className="text-red-400">*</span>
              </label>
              <textarea
                value={issueNote}
                onChange={(e) => setIssueNote(e.target.value)}
                required
                rows={3}
                className="w-full rounded-xl bg-surface-800 border border-surface-600 px-4 py-3 text-sm text-white placeholder-surface-500 resize-none"
                placeholder="Briefly explain the problem you're facing..."
              />
            </div>
          </div>
        )}

        {status === "NOT_ELIGIBLE" && (
          <div className="space-y-1.5 animate-fadeIn">
            <label className="text-sm font-medium text-surface-300">
              Reason (Optional)
            </label>
            <textarea
              value={issueNote}
              onChange={(e) => setIssueNote(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-surface-800 border border-surface-600 px-4 py-3 text-sm text-white placeholder-surface-500 resize-none"
              placeholder="e.g., Does not meet eligibility criteria"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving || (status === "FACING_TROUBLE" && !issueNote)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-primary-500 hover:to-primary-600 disabled:opacity-60 disabled:cursor-not-allowed btn-lift"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save Status"
          )}
        </button>
      </div>
    </Modal>
  );
}
