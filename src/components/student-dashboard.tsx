"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/client";
import type { StudentDashboard, AppStatus, JobApplication, Job, IssueCategory } from "@/lib/types";
import {
  KPICard,
  PriorityBadge,
  StatusBadge,
  Toast,
  FullPageSpinner,
  EmptyState,
  Modal,
  Drawer,
} from "./shared";
import { NotificationInboxDrawer, StudentHelpChatDrawer } from "./student-inbox";
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
  XCircle,
  Loader2,
  Bell,
  MessageSquare,
  Sparkles,
  Phone,
  GraduationCap,
  ShieldCheck,
  Calendar,
  DollarSign,
  MapPin,
  Check,
} from "lucide-react";

const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

type FilterTab = "ALL" | "NOT_APPLIED" | "APPLIED" | "TROUBLE";

export default function StudentDashboardView() {
  const router = useRouter();
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("ALL");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Drawers & Modals
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showHelpChatDrawer, setShowHelpChatDrawer] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [actionModal, setActionModal] = useState<{
    app: JobApplication & { job: Job };
    mode: "apply" | "trouble";
  } | null>(null);

  // Form states for modals
  const [appRef, setAppRef] = useState("");
  const [issueCategory, setIssueCategory] = useState<IssueCategory>("PORTAL_OR_OTP_ERROR");
  const [issueNote, setIssueNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Profile Edit State
  const [newPhone, setNewPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await get<StudentDashboard>("/api/snapshot?scope=student");
    if (res.ok && res.data) {
      setData(res.data);
      setNewPhone(res.data.profile.phone || "");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  async function handleUpdateStatus(
    jobId: string,
    status: AppStatus,
    payload?: { issueCategory?: IssueCategory; issueNote?: string; applicationRef?: string }
  ) {
    setSubmitting(true);
    const res = await post("/api/command", {
      type: "UPDATE_APPLICATION_STATUS",
      jobId,
      status,
      issueCategory: payload?.issueCategory,
      issueNote: payload?.issueNote,
      applicationRef: payload?.applicationRef,
    });

    if (res.ok) {
      setToast({
        message: status === "APPLIED" ? "Great job! Application marked as completed." : "Status updated.",
        type: "success",
      });
      setActionModal(null);
      setAppRef("");
      setIssueNote("");
      fetchData();
    } else {
      setToast({ message: res.error || "Failed to update status", type: "error" });
    }
    setSubmitting(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const res = await post("/api/command", {
      type: "UPDATE_STUDENT_PROFILE",
      phone: newPhone,
    });
    if (res.ok) {
      setToast({ message: "Profile contact updated!", type: "success" });
      setShowProfileDrawer(false);
      fetchData();
    } else {
      setToast({ message: res.error || "Failed to update profile", type: "error" });
    }
    setSavingProfile(false);
  }

  if (loading) return <FullPageSpinner />;
  if (!data) return null;

  const { profile, kpis, applications, notifications = [], help_messages = [] } = data;

  const unreadNotifCount = notifications.filter((n) => !n.is_read).length;

  // Sort by priority then deadline
  const sortedApps = [...applications].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.job?.priority] ?? 2;
    const pb = PRIORITY_ORDER[b.job?.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    const da = a.job?.deadline ? new Date(a.job.deadline).getTime() : Infinity;
    const db = b.job?.deadline ? new Date(b.job.deadline).getTime() : Infinity;
    return da - db;
  });

  // Filter tabs
  const filteredApps = sortedApps.filter((a) => {
    if (tab === "ALL") return true;
    if (tab === "NOT_APPLIED") return a.status === "NOT_APPLIED";
    if (tab === "APPLIED") return a.status === "APPLIED";
    if (tab === "TROUBLE") return a.status === "FACING_TROUBLE" || a.status === "NOT_ELIGIBLE";
    return true;
  });

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "ALL", label: "All Opportunities", count: applications.length },
    { key: "NOT_APPLIED", label: "Action Required", count: kpis.not_applied },
    { key: "APPLIED", label: "Submitted", count: kpis.applied },
    { key: "TROUBLE", label: "Issues Reported", count: kpis.facing_trouble + kpis.not_eligible },
  ];

  return (
    <div className="min-h-screen bg-mesh text-surface-100 flex flex-col">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ─── Top Glass Navigation ──────────────────────── */}
      <header className="sticky top-0 z-40 glass border-b border-white/10 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-pink-500 shadow-lg shadow-primary-950/40">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold text-white tracking-wide">ApplyForge</h1>
                  <span className="rounded-full bg-primary-500/25 border border-primary-500/40 px-2 py-0.5 text-[10px] font-bold text-primary-200">
                    Student Portal
                  </span>
                </div>
                <p className="text-xs text-surface-400">Campus Recruitment & Application Hub</p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                onClick={() => setShowNotificationDrawer(true)}
                className="relative rounded-2xl p-2.5 bg-surface-800/60 border border-white/10 text-surface-300 hover:text-white hover:bg-surface-700 transition-all"
                title="Notifications & Reminders"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Help & Support Chat Widget */}
              <button
                onClick={() => setShowHelpChatDrawer(true)}
                className="flex items-center gap-2 rounded-2xl btn-vibrant-emerald px-4 py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/50"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Contact Placement Officer</span>
              </button>

              {/* Student Profile Pill */}
              <button
                onClick={() => setShowProfileDrawer(true)}
                className="hidden md:flex items-center gap-2.5 rounded-2xl bg-surface-900/60 border border-white/10 px-3.5 py-2 hover:border-primary-500/40 transition-all"
              >
                <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                  {profile.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-tight">{profile.full_name}</p>
                  <p className="text-[10px] text-cyan-300 font-medium">
                    {profile.department} {profile.roll_number && `• ${profile.roll_number}`}
                  </p>
                </div>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="rounded-2xl p-2.5 bg-surface-800/60 border border-white/10 text-surface-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content Container ─────────────────────── */}
      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8 animate-fadeIn">
        {/* Welcome Banner */}
        <div className="rounded-3xl glass-card border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 z-10">
            <span className="rounded-full bg-primary-500/20 border border-primary-500/30 px-3 py-1 text-xs font-bold text-primary-300 inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary-400" />
              Welcome back, {profile.full_name}!
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Stay ahead in your campus placements.
            </h2>
            <p className="text-xs sm:text-sm text-surface-300 max-w-xl">
              Track eligible placement opportunities, submit external portal applications, and report any blockers directly to the placement office.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 z-10 w-full md:w-auto">
            <div className="rounded-2xl bg-surface-900/60 border border-white/5 p-4 text-center w-full sm:w-auto">
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Completion</p>
              <p className="text-3xl font-black text-white mt-1">{kpis.completion_pct}%</p>
              <div className="h-2 w-32 rounded-full bg-surface-800 mt-2 overflow-hidden mx-auto">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-emerald-400"
                  style={{ width: `${kpis.completion_pct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary-600/15 blur-3xl pointer-events-none" />
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Opportunities"
            value={kpis.total_jobs}
            subtitle="Matched to your branch"
            icon={<Briefcase className="h-5 w-5" />}
            color="primary"
          />
          <KPICard
            label="Action Required"
            value={kpis.not_applied}
            subtitle="Pending submission"
            icon={<Clock className="h-5 w-5" />}
            color="yellow"
            onClick={() => setTab("NOT_APPLIED")}
          />
          <KPICard
            label="Applications Completed"
            value={kpis.applied}
            subtitle="Verified submissions"
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="green"
            onClick={() => setTab("APPLIED")}
          />
          <KPICard
            label="Issues Reported"
            value={kpis.facing_trouble}
            subtitle="Under placement cell review"
            icon={<AlertTriangle className="h-5 w-5" />}
            color="red"
            onClick={() => setTab("TROUBLE")}
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto custom-scroll">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shrink-0 ${
                tab === t.key
                  ? "bg-primary-600/30 text-primary-200 border border-primary-500/50 shadow-lg shadow-primary-950/40"
                  : "bg-surface-900/40 text-surface-400 hover:text-white hover:bg-surface-800/60 border border-transparent"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                  tab === t.key ? "bg-primary-500 text-white" : "bg-surface-800 text-surface-400"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Applications Board */}
        {filteredApps.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-10 w-10 text-primary-400" />}
            title="No drives in this tab"
            description="You are currently up to date on all placement listings matching this criteria."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => {
              const { job } = app;
              if (!job) return null;

              const isApplied = app.status === "APPLIED";
              const isTrouble = app.status === "FACING_TROUBLE";

              return (
                <div
                  key={app.id}
                  className={`rounded-3xl glass-card border p-6 flex flex-col justify-between transition-all ${
                    isApplied
                      ? "border-emerald-500/30 bg-emerald-950/10"
                      : isTrouble
                      ? "border-rose-500/30 bg-rose-950/10"
                      : "border-white/10"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Company & Priority */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">
                          {job.company_name}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-0.5 leading-snug">{job.title}</h3>
                      </div>
                      <PriorityBadge priority={job.priority} />
                    </div>

                    {/* Metadata chips */}
                    <div className="space-y-2 text-xs text-surface-300">
                      {job.package_ctc && (
                        <p className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-emerald-300">{job.package_ctc}</span>
                        </p>
                      )}
                      {job.location && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
                          <span>{job.location}</span>
                        </p>
                      )}
                      {job.deadline && (
                        <p className="flex items-center gap-2 text-amber-300">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    {job.description && (
                      <p className="text-xs text-surface-400 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    )}

                    {/* Status Badge */}
                    <div className="pt-2 flex items-center justify-between">
                      <StatusBadge status={app.status} />
                      {app.link_clicked_at && (
                        <span className="text-[11px] text-surface-400">✓ Link opened</span>
                      )}
                    </div>

                    {/* Issue Note display if in trouble */}
                    {isTrouble && (
                      <div className="rounded-2xl bg-rose-950/30 border border-rose-500/20 p-3 text-xs space-y-1">
                        <p className="font-bold text-rose-300">Issue: {app.issue_category}</p>
                        {app.issue_note && <p className="text-rose-200/80">{app.issue_note}</p>}
                        <button
                          onClick={() => setShowHelpChatDrawer(true)}
                          className="text-xs font-semibold text-rose-400 hover:underline pt-1 block"
                        >
                          Chat with placement cell regarding this &rarr;
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                    <button
                      onClick={() => handleClickJob(job.id, job.application_url)}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl btn-vibrant-primary px-4 py-3 text-xs sm:text-sm font-bold shadow-md"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Company Portal
                    </button>

                    <div className="flex gap-2">
                      {!isApplied ? (
                        <button
                          onClick={() => setActionModal({ app, mode: "apply" })}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl btn-vibrant-emerald px-3 py-2.5 text-xs font-bold"
                        >
                          <Check className="h-4 w-4" />
                          Mark Applied
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(job.id, "NOT_APPLIED")}
                          className="flex-1 rounded-2xl bg-surface-800 text-surface-400 hover:text-white px-3 py-2.5 text-xs font-semibold"
                        >
                          Undo Applied
                        </button>
                      )}

                      <button
                        onClick={() => setActionModal({ app, mode: "trouble" })}
                        className="rounded-2xl bg-surface-800/80 hover:bg-rose-500/20 text-surface-300 hover:text-rose-300 border border-white/5 px-3 py-2.5 text-xs font-semibold transition-colors"
                        title="Facing portal or OTP issue?"
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Mark Applied Modal ────────────────────────── */}
      {actionModal?.mode === "apply" && (
        <Modal
          isOpen={true}
          onClose={() => setActionModal(null)}
          title={`Confirm Application: ${actionModal.app.job.company_name}`}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-surface-300 leading-relaxed">
              Have you completed the submission on the company&apos;s external portal? You can optionally save your application/registration number below:
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-300">
                Application / Candidate ID (Optional)
              </label>
              <input
                type="text"
                value={appRef}
                onChange={(e) => setAppRef(e.target.value)}
                placeholder="e.g. TCS-REG-987654"
                className="w-full rounded-2xl glass-input px-4 py-3 text-xs sm:text-sm text-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="flex-1 rounded-2xl bg-surface-800 py-3 text-xs font-semibold text-surface-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  handleUpdateStatus(actionModal.app.job.id, "APPLIED", {
                    applicationRef: appRef,
                  })
                }
                className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl btn-vibrant-emerald py-3 text-xs font-bold shadow-lg"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Confirm Submission
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Report Trouble Modal ──────────────────────── */}
      {actionModal?.mode === "trouble" && (
        <Modal
          isOpen={true}
          onClose={() => setActionModal(null)}
          title={`Report Issue: ${actionModal.app.job.company_name}`}
          size="sm"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-300">Issue Category</label>
              <select
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value as IssueCategory)}
                className="w-full rounded-2xl glass-input px-3.5 py-3 text-xs sm:text-sm text-white cursor-pointer"
              >
                <option value="PORTAL_OR_OTP_ERROR" className="bg-surface-900">
                  Portal Error / OTP Not Received
                </option>
                <option value="LINK_EXPIRED_OR_BROKEN" className="bg-surface-900">
                  Link Expired or 404 Broken
                </option>
                <option value="ELIGIBILITY_BLOCKED" className="bg-surface-900">
                  Blocked by Eligibility Screen
                </option>
                <option value="OTHER_ISSUE" className="bg-surface-900">
                  Other Technical Issue
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-300">
                Describe the problem
              </label>
              <textarea
                rows={3}
                value={issueNote}
                onChange={(e) => setIssueNote(e.target.value)}
                placeholder="e.g. Received 'Error 500' when uploading resume..."
                className="w-full rounded-2xl glass-input p-3.5 text-xs text-white resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="flex-1 rounded-2xl bg-surface-800 py-3 text-xs font-semibold text-surface-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  handleUpdateStatus(actionModal.app.job.id, "FACING_TROUBLE", {
                    issueCategory,
                    issueNote,
                  })
                }
                className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-rose-600 hover:bg-rose-500 py-3 text-xs font-bold text-white shadow-lg shadow-rose-950/40"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Report Blocker
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Profile Drawer ────────────────────────────── */}
      <Drawer
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        title="Candidate Profile"
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-2xl bg-surface-900/40 border border-white/5 p-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center font-bold text-white text-base">
              {profile.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{profile.full_name}</h3>
              <p className="text-xs text-cyan-300">{profile.department} Department</p>
              {profile.roll_number && (
                <p className="text-xs text-surface-400 font-mono mt-0.5">{profile.roll_number}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-300">Registered Email</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full rounded-2xl bg-surface-900/60 border border-white/5 px-4 py-3 text-xs text-surface-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-surface-300">
                Phone Number (WhatsApp Alerts)
              </label>
              <input
                type="tel"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full rounded-2xl glass-input px-4 py-3 text-xs sm:text-sm text-white"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full rounded-2xl btn-vibrant-primary py-3.5 text-xs font-bold shadow-lg"
            >
              {savingProfile ? "Saving..." : "Update Contact"}
            </button>
          </form>
        </div>
      </Drawer>

      {/* ─── Notification Inbox Drawer ─────────────────── */}
      <NotificationInboxDrawer
        isOpen={showNotificationDrawer}
        onClose={() => setShowNotificationDrawer(false)}
        notifications={notifications}
        onNotificationRead={fetchData}
      />

      {/* ─── Student Help Chat Drawer ──────────────────── */}
      <StudentHelpChatDrawer
        isOpen={showHelpChatDrawer}
        onClose={() => setShowHelpChatDrawer(false)}
        messages={help_messages}
        onMessageSent={fetchData}
      />
    </div>
  );
}
