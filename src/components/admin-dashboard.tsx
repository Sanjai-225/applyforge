"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/client";
import type {
  AdminDashboard,
  Job,
  StudentRow,
  WhatsAppGroup,
  JobApplication,
  Profile,
  StudentNotification,
  AuditLog,
} from "@/lib/types";
import { DEPARTMENTS, PRIORITIES } from "@/lib/types";
import {
  KPICard,
  PriorityBadge,
  StatusBadge,
  Toast,
  FullPageSpinner,
  EmptyState,
  Drawer,
  Modal,
} from "./shared";
import { CreateJobModal, EditJobModal, DeleteJobModal } from "./job-modal";
import { WhatsAppBroadcastModal } from "./whatsapp-broadcast-modal";
import { AdminSidebar, AdminTab } from "./admin-sidebar";
import { HelpChatMasterDetail } from "./help-chat";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  LogOut,
  Shield,
  Users,
  MessageSquare,
  Download,
  Search,
  Eye,
  Bell,
  Filter,
  ChevronRight,
  Loader2,
  ExternalLink,
  Trash2,
  Edit3,
  BarChart3,
  Phone,
  Mail,
  GraduationCap,
  Sparkles,
  Send,
  RefreshCw,
  LayoutGrid,
  List,
  Crosshair,
  Check,
  History,
  Settings,
  HelpCircle,
} from "lucide-react";

export default function AdminDashboardView() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<AdminTab>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals & Selection
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filters for Drives View
  const [jobSearch, setJobSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [jobViewMode, setJobViewMode] = useState<"grid" | "table">("grid");

  // Filters for Student Directory
  const [studentSearch, setStudentSearch] = useState("");
  const [studentDeptFilter, setStudentDeptFilter] = useState<string>("ALL");

  // WhatsApp Broadcast Modal State
  const [waModal, setWaModal] = useState<{
    message: string;
    shareLinks: { groupName: string; shareUrl: string; inviteLink: string | null }[];
    title: string;
  } | null>(null);

  // Reminder Composer State
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderDept, setReminderDept] = useState("ALL");
  const [reminderJobId, setReminderJobId] = useState("");
  const [reminderEmail, setReminderEmail] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(false);

  // WhatsApp Group Editor State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDept, setNewGroupDept] = useState("ALL");
  const [newGroupInvite, setNewGroupInvite] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);

  const fetchData = useCallback(
    async (jobId?: string | null) => {
      let url = "/api/snapshot?scope=admin";
      if (jobId) url += `&jobId=${jobId}`;
      const res = await get<AdminDashboard>(url);
      if (res.ok && res.data) {
        setData(res.data);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    fetchData(selectedJobId);
  }, [fetchData, selectedJobId]);

  async function handleLogout() {
    await post("/api/auth/logout", {});
    router.push("/");
    router.refresh();
  }

  async function handleJobCreated(job: Job, sendEmail: boolean) {
    setToast({ message: `Drive "${job.company_name} — ${job.title}" posted!`, type: "success" });
    const res = await post<{
      waMessage: string;
      shareLinks: { groupName: string; shareUrl: string; inviteLink: string | null }[];
      emailResult: { sent: number; total: number };
    }>("/api/notify", {
      action: "JOB_BROADCAST",
      jobId: job.id,
      sendEmail,
      webhookPush: false,
    });
    if (res.ok && res.data) {
      setWaModal({
        message: res.data.waMessage,
        shareLinks: res.data.shareLinks,
        title: `📢 Share: ${job.company_name} — ${job.title}`,
      });
    }
    fetchData();
  }

  async function handleRemindUnapplied(jobId: string) {
    setToast({ message: "Broadcasting reminders...", type: "success" });
    const res = await post<{
      emailResult: { sent: number; total: number };
      defaulterList: string;
      unappliedCount: number;
      waShareUrl: string;
    }>("/api/notify", {
      action: "REMIND_UNAPPLIED",
      jobId,
      sendEmail: true,
      webhookPush: false,
    });

    if (res.ok && res.data) {
      setWaModal({
        message: res.data.defaulterList,
        shareLinks: [
          {
            groupName: "Share Defaulter List",
            shareUrl: res.data.waShareUrl,
            inviteLink: null,
          },
        ],
        title: `⚠️ Defaulter List — ${res.data.unappliedCount} students pending`,
      });
      setToast({
        message: `Reminders sent to ${res.data.unappliedCount} pending students.`,
        type: "success",
      });
    } else {
      setToast({ message: res.error || "Failed to send reminders", type: "error" });
    }
  }

  async function handleSendCustomReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!reminderTitle.trim() || !reminderMessage.trim()) return;

    setSendingReminder(true);
    const res = await post("/api/command", {
      type: "SEND_REMINDER",
      title: reminderTitle,
      message: reminderMessage,
      departments: reminderDept === "ALL" ? ["ALL"] : [reminderDept],
      jobId: reminderJobId || undefined,
      sendEmail: reminderEmail,
    });

    if (res.ok) {
      setToast({ message: "In-app reminder broadcasted successfully!", type: "success" });
      setReminderTitle("");
      setReminderMessage("");
      fetchData();
    } else {
      setToast({ message: res.error || "Failed to broadcast reminder", type: "error" });
    }
    setSendingReminder(false);
  }

  async function handleSaveGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setSavingGroup(true);
    const res = await post("/api/command", {
      type: "SAVE_WHATSAPP_GROUP",
      name: newGroupName,
      departmentTag: newGroupDept,
      inviteLink: newGroupInvite || undefined,
    });
    if (res.ok) {
      setToast({ message: `Group "${newGroupName}" saved!`, type: "success" });
      setNewGroupName("");
      setNewGroupInvite("");
      fetchData();
    }
    setSavingGroup(false);
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm("Are you sure you want to remove this group?")) return;
    const res = await post("/api/command", {
      type: "DELETE_WHATSAPP_GROUP",
      groupId,
    });
    if (res.ok) {
      setToast({ message: "Group deleted", type: "success" });
      fetchData();
    }
  }

  function handleExport(type: string, jobId?: string, status?: string) {
    let url = `/api/export?type=${type}`;
    if (jobId) url += `&jobId=${jobId}`;
    if (status) url += `&status=${status}`;
    window.open(url, "_blank");
  }

  if (loading) return <FullPageSpinner />;
  if (!data) return null;

  const { jobs, students, whatsapp_groups, help_threads = [], audit_logs = [], notifications = [], job_detail } = data;

  // Compute Aggregate Stats
  const totalStudents = students.length;
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.is_active).length;
  const totalApplications = students.reduce((acc, s) => acc + s.applied, 0);
  const totalAssigned = students.reduce((acc, s) => acc + s.total_jobs, 0);
  const overallAppliedPct =
    totalAssigned > 0 ? Math.round((totalApplications / totalAssigned) * 100) : 0;
  const totalTrouble = students.reduce((acc, s) => acc + s.facing_trouble, 0);
  const totalUnreadChat = help_threads.reduce((acc, t) => acc + t.unread_count, 0);

  // Filtered Jobs
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.company_name.toLowerCase().includes(jobSearch.toLowerCase());
    const matchesDept =
      deptFilter === "ALL" ||
      j.eligible_departments.includes("ALL") ||
      j.eligible_departments.includes(deptFilter);
    const matchesPriority = priorityFilter === "ALL" || j.priority === priorityFilter;
    return matchesSearch && matchesDept && matchesPriority;
  });

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(studentSearch.toLowerCase())) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesDept = studentDeptFilter === "ALL" || s.department === studentDeptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex h-screen bg-mesh overflow-hidden text-surface-100">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ─── Left Sidebar ──────────────────────────────── */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={(t) => {
          setCurrentTab(t);
          if (t !== "tracker") setSelectedJobId(null);
        }}
        unreadChatCount={totalUnreadChat}
        troubleCount={totalTrouble}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />

      {/* ─── Main Content Canvas ───────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-20 glass border-b border-white/10 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-white capitalize tracking-wide flex items-center gap-2">
                {currentTab.replace("-", " ")}
                {currentTab === "jobs" && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
                    {filteredJobs.length} Drives
                  </span>
                )}
              </h1>
              <p className="text-xs text-surface-400">
                {currentTab === "overview" && "Executive summary & placement tracking pipeline"}
                {currentTab === "jobs" && "Create, edit, broadcast and manage campus recruitment drives"}
                {currentTab === "tracker" && "Detailed student breakdown for chosen drive"}
                {currentTab === "students" && "Campus student roster, response status, and individual alerts"}
                {currentTab === "trouble" && "Urgent student blockers: OTP failure, portal errors, broken links"}
                {currentTab === "chat" && "Unified live helpdesk messaging with students"}
                {currentTab === "reminders" && "In-app and email reminder composer"}
                {currentTab === "whatsapp" && "Department placement groups and direct broadcast links"}
                {currentTab === "analytics" && "Department-wise placement compliance graphs"}
                {currentTab === "audit" && "Real-time log of administrative modifications"}
                {currentTab === "settings" && "Placement Cell credentials and configuration"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData(selectedJobId)}
              className="rounded-2xl p-2.5 bg-surface-800/60 border border-white/10 text-surface-300 hover:text-white hover:bg-surface-700 transition-all"
              title="Refresh snapshot"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-2xl btn-vibrant-primary px-4 py-2.5 text-xs sm:text-sm font-bold shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Post New Drive</span>
            </button>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
          {/* ══════════════════════════════════════════════
              VIEW: OVERVIEW
             ══════════════════════════════════════════════ */}
          {currentTab === "overview" && (
            <div className="space-y-6 animate-fadeIn">
              {/* KPI Ribbon */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard
                  label="Active Drives"
                  value={activeJobs}
                  subtitle={`${totalJobs} total posted`}
                  icon={<Briefcase className="h-5 w-5" />}
                  color="primary"
                  onClick={() => setCurrentTab("jobs")}
                />
                <KPICard
                  label="Registered Students"
                  value={totalStudents}
                  subtitle="Active candidates"
                  icon={<Users className="h-5 w-5" />}
                  color="cyan"
                  onClick={() => setCurrentTab("students")}
                />
                <KPICard
                  label="Applications Logged"
                  value={totalApplications}
                  subtitle={`${overallAppliedPct}% overall response`}
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  color="green"
                />
                <KPICard
                  label="Facing Trouble"
                  value={totalTrouble}
                  subtitle="Needs resolution"
                  icon={<AlertTriangle className="h-5 w-5" />}
                  color="red"
                  onClick={() => setCurrentTab("trouble")}
                />
                <KPICard
                  label="Unread Queries"
                  value={totalUnreadChat}
                  subtitle="Student messages"
                  icon={<MessageSquare className="h-5 w-5" />}
                  color="purple"
                  onClick={() => setCurrentTab("chat")}
                />
              </div>

              {/* Action Banner & Quick Shortcuts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        Active Drives Pipeline
                      </h2>
                      <p className="text-xs text-surface-400">Quick status and reminder shortcuts</p>
                    </div>
                    <button
                      onClick={() => setCurrentTab("jobs")}
                      className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1"
                    >
                      View All <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {jobs.slice(0, 4).map((j) => (
                      <div
                        key={j.id}
                        className="rounded-2xl bg-surface-900/40 border border-white/5 p-4 flex items-center justify-between gap-4 hover:border-primary-500/30 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white truncate">
                              {j.company_name} — {j.title}
                            </span>
                            <PriorityBadge priority={j.priority} />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-surface-400 mt-1">
                            {j.package_ctc && <span>💰 {j.package_ctc}</span>}
                            {j.location && <span>📍 {j.location}</span>}
                            <span>🎓 {j.eligible_departments.join(", ")}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setSelectedJobId(j.id);
                              setCurrentTab("tracker");
                            }}
                            className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-surface-800 text-surface-200 hover:bg-surface-700 transition-colors"
                          >
                            Tracker
                          </button>
                          <button
                            onClick={() => handleRemindUnapplied(j.id)}
                            className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                          >
                            Remind
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Recent Activity */}
                <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <History className="h-4 w-4 text-cyan-400" />
                    Audit Stream
                  </h2>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scroll">
                    {audit_logs.length === 0 ? (
                      <p className="text-xs text-surface-500 text-center py-8">
                        No recent activity logged yet
                      </p>
                    ) : (
                      audit_logs.slice(0, 8).map((log) => (
                        <div key={log.id} className="text-xs border-b border-white/5 pb-2.5">
                          <div className="flex items-center justify-between text-[10px] text-surface-500">
                            <span className="font-bold text-primary-300">{log.action}</span>
                            <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-surface-300 mt-0.5 truncate">{log.actor_name}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW: PLACEMENT DRIVES (Full CRUD & Filters)
             ══════════════════════════════════════════════ */}
          {currentTab === "jobs" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Filter Toolbar */}
              <div className="glass-card rounded-3xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                    <input
                      type="text"
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      placeholder="Search company or job title..."
                      className="w-full rounded-2xl glass-input pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white"
                    />
                  </div>

                  {/* Priority Select */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="rounded-2xl glass-input px-3 py-2.5 text-xs text-white cursor-pointer"
                  >
                    <option value="ALL" className="bg-surface-900">All Priorities</option>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p} className="bg-surface-900">{p}</option>
                    ))}
                  </select>
                </div>

                {/* Department Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll text-xs">
                  {["ALL", ...DEPARTMENTS].map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setDeptFilter(dept)}
                      className={`rounded-xl px-3 py-1.5 font-semibold transition-all shrink-0 ${
                        deptFilter === dept
                          ? "bg-primary-500/30 text-primary-200 border border-primary-500/50"
                          : "bg-surface-800/40 text-surface-400 hover:bg-surface-800"
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 rounded-2xl bg-surface-900/60 p-1 border border-white/5">
                  <button
                    onClick={() => setJobViewMode("grid")}
                    className={`rounded-xl p-2 transition-all ${
                      jobViewMode === "grid" ? "bg-primary-600 text-white" : "text-surface-400 hover:text-white"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setJobViewMode("table")}
                    className={`rounded-xl p-2 transition-all ${
                      jobViewMode === "table" ? "bg-primary-600 text-white" : "text-surface-400 hover:text-white"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Drives Grid Mode */}
              {jobViewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredJobs.length === 0 ? (
                    <div className="col-span-full">
                      <EmptyState
                        icon={<Briefcase className="h-10 w-10" />}
                        title="No drives match your filters"
                        description="Try clearing search or filters to see more placement drives."
                      />
                    </div>
                  ) : (
                    filteredJobs.map((job) => (
                      <div
                        key={job.id}
                        className={`rounded-3xl glass-card border p-5 flex flex-col justify-between transition-all ${
                          job.is_active ? "border-white/10" : "border-white/5 opacity-60"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-400">
                                {job.company_name}
                              </span>
                              <h3 className="text-base font-bold text-white mt-0.5">{job.title}</h3>
                            </div>
                            <PriorityBadge priority={job.priority} />
                          </div>

                          <div className="space-y-1.5 text-xs text-surface-300">
                            {job.package_ctc && (
                              <p className="flex items-center gap-1.5">
                                <span className="text-emerald-400 font-bold">CTC:</span> {job.package_ctc}
                              </p>
                            )}
                            {job.location && (
                              <p className="flex items-center gap-1.5">
                                <span className="text-rose-400 font-bold">Location:</span> {job.location}
                              </p>
                            )}
                            {job.deadline && (
                              <p className="flex items-center gap-1.5 text-amber-300">
                                <Clock className="h-3.5 w-3.5" />
                                Deadline: {new Date(job.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          {/* Eligible Depts */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {job.eligible_departments.map((d) => (
                              <span
                                key={d}
                                className="rounded-md bg-surface-800/80 border border-white/5 px-2 py-0.5 text-[10px] font-medium text-cyan-300"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedJobId(job.id);
                                setCurrentTab("tracker");
                              }}
                              className="rounded-xl bg-surface-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-surface-700 transition-colors"
                            >
                              Tracker
                            </button>
                            <button
                              onClick={() => handleRemindUnapplied(job.id)}
                              className="rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
                            >
                              Remind
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingJob(job)}
                              title="Edit Drive"
                              className="rounded-xl p-2 bg-white/5 hover:bg-white/10 text-surface-300 hover:text-white transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingJob(job)}
                              title="Delete Drive"
                              className="rounded-xl p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Table View */
                <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto custom-scroll">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-950/60 border-b border-white/10 text-surface-400 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-4">Company & Role</th>
                          <th className="p-4">Priority</th>
                          <th className="p-4">Package</th>
                          <th className="p-4">Location</th>
                          <th className="p-4">Departments</th>
                          <th className="p-4">Deadline</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredJobs.map((job) => (
                          <tr key={job.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-white">{job.company_name}</p>
                              <p className="text-surface-400 text-[11px]">{job.title}</p>
                            </td>
                            <td className="p-4"><PriorityBadge priority={job.priority} /></td>
                            <td className="p-4 font-semibold text-emerald-400">{job.package_ctc || "—"}</td>
                            <td className="p-4 text-surface-300">{job.location || "—"}</td>
                            <td className="p-4">
                              <span className="text-cyan-300">{job.eligible_departments.join(", ")}</span>
                            </td>
                            <td className="p-4 text-amber-300">
                              {job.deadline ? new Date(job.deadline).toLocaleDateString() : "—"}
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedJobId(job.id);
                                  setCurrentTab("tracker");
                                }}
                                className="rounded-lg bg-surface-800 px-2.5 py-1 text-xs font-semibold text-surface-200 hover:text-white"
                              >
                                Tracker
                              </button>
                              <button
                                onClick={() => setEditingJob(job)}
                                className="rounded-lg bg-white/5 p-1.5 text-surface-300 hover:text-white"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingJob(job)}
                                className="rounded-lg bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW: DRIVE TRACKER (Deep Dive per Job)
             ══════════════════════════════════════════════ */}
          {currentTab === "tracker" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="glass-card rounded-3xl p-5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white">Drive Candidate Compliance Tracker</h2>
                  <p className="text-xs text-surface-400">Select a drive to monitor application funnel</p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedJobId || ""}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="rounded-2xl glass-input px-4 py-2.5 text-xs text-white cursor-pointer min-w-[240px]"
                  >
                    <option value="" className="bg-surface-900">-- Choose Placement Drive --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id} className="bg-surface-900">
                        {j.company_name} — {j.title}
                      </option>
                    ))}
                  </select>

                  {selectedJobId && (
                    <button
                      onClick={() => handleExport("job", selectedJobId)}
                      className="flex items-center gap-1.5 rounded-2xl bg-surface-800 px-4 py-2.5 text-xs font-bold text-surface-200 hover:bg-surface-700 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export CSV
                    </button>
                  )}
                </div>
              </div>

              {job_detail ? (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <KPICard
                      label="Assigned"
                      value={job_detail.kpi.total_assigned}
                      icon={<Users className="h-5 w-5" />}
                      color="primary"
                    />
                    <KPICard
                      label="Applied"
                      value={job_detail.kpi.applied}
                      subtitle={`${job_detail.kpi.applied_pct}% completed`}
                      icon={<CheckCircle2 className="h-5 w-5" />}
                      color="green"
                    />
                    <KPICard
                      label="Pending Action"
                      value={job_detail.kpi.not_applied}
                      icon={<Clock className="h-5 w-5" />}
                      color="yellow"
                    />
                    <KPICard
                      label="Facing Trouble"
                      value={job_detail.kpi.facing_trouble}
                      icon={<AlertTriangle className="h-5 w-5" />}
                      color="red"
                    />
                    <KPICard
                      label="Not Eligible"
                      value={job_detail.kpi.not_eligible}
                      icon={<AlertTriangle className="h-5 w-5" />}
                      color="primary"
                    />
                  </div>

                  {/* Candidate List */}
                  <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto custom-scroll">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-950/60 border-b border-white/10 text-surface-400 font-bold uppercase tracking-wider">
                          <tr>
                            <th className="p-4">Student</th>
                            <th className="p-4">Roll Number</th>
                            <th className="p-4">Department</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Link Clicked</th>
                            <th className="p-4">Issue Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {job_detail.applications.map((app) => (
                            <tr key={app.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                <p className="font-bold text-white">{app.student.full_name}</p>
                                <p className="text-surface-500 text-[11px]">{app.student.email}</p>
                              </td>
                              <td className="p-4 font-mono text-surface-300">{app.student.roll_number || "—"}</td>
                              <td className="p-4">
                                <span className="rounded-md bg-surface-800 px-2 py-0.5 text-cyan-300">
                                  {app.student.department}
                                </span>
                              </td>
                              <td className="p-4"><StatusBadge status={app.status} /></td>
                              <td className="p-4 text-surface-400">
                                {app.link_clicked_at ? "✓ Yes" : "No"}
                              </td>
                              <td className="p-4">
                                {app.issue_category && (
                                  <span className="text-rose-400 font-semibold">{app.issue_category}</span>
                                )}
                                {app.issue_note && (
                                  <p className="text-[11px] text-surface-400 mt-0.5">{app.issue_note}</p>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Crosshair className="h-10 w-10" />}
                  title="No Drive Selected"
                  description="Choose a placement drive from the dropdown above to view live student progress."
                />
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW: STUDENT DIRECTORY
             ══════════════════════════════════════════════ */}
          {currentTab === "students" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="glass-card rounded-3xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search student by name, roll number, or email..."
                      className="w-full rounded-2xl glass-input pl-10 pr-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll text-xs">
                  {["ALL", ...DEPARTMENTS].map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setStudentDeptFilter(dept)}
                      className={`rounded-xl px-3 py-1.5 font-semibold transition-all shrink-0 ${
                        studentDeptFilter === dept
                          ? "bg-primary-500/30 text-primary-200 border border-primary-500/50"
                          : "bg-surface-800/40 text-surface-400 hover:bg-surface-800"
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleExport("students")}
                  className="flex items-center gap-1.5 rounded-2xl bg-surface-800 px-4 py-2.5 text-xs font-bold text-surface-200 hover:bg-surface-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Compliance CSV
                </button>
              </div>

              {/* Students Table */}
              <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-950/60 border-b border-white/10 text-surface-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Roll Number</th>
                        <th className="p-4">Candidate Name</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Drives Assigned</th>
                        <th className="p-4">Applied</th>
                        <th className="p-4">Pending</th>
                        <th className="p-4">Compliance %</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-surface-500">
                            No students match your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono font-bold text-surface-300">{s.roll_number || "—"}</td>
                            <td className="p-4 font-bold text-white">{s.full_name}</td>
                            <td className="p-4">
                              <span className="rounded-md bg-surface-800 px-2 py-0.5 text-cyan-300">
                                {s.department}
                              </span>
                            </td>
                            <td className="p-4 text-surface-400">
                              <p>{s.email}</p>
                              {s.phone && <p className="text-[11px] text-surface-500">{s.phone}</p>}
                            </td>
                            <td className="p-4 font-semibold text-surface-300">{s.total_jobs}</td>
                            <td className="p-4 font-bold text-emerald-400">{s.applied}</td>
                            <td className="p-4 font-bold text-amber-400">{s.not_applied}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 rounded-full bg-surface-800 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-emerald-400"
                                    style={{ width: `${s.completion_pct}%` }}
                                  />
                                </div>
                                <span className="font-bold text-surface-200">{s.completion_pct}%</span>
                              </div>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setCurrentTab("chat");
                                }}
                                className="rounded-xl bg-primary-600/20 text-primary-300 border border-primary-500/30 px-3 py-1 text-xs font-semibold hover:bg-primary-600/30 transition-colors"
                              >
                                Chat
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW: TROUBLE REPORTS
             ══════════════════════════════════════════════ */}
          {currentTab === "trouble" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="glass-card rounded-3xl p-5 border border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                    Active Candidate Blockers
                  </h2>
                  <p className="text-xs text-surface-400">
                    Students reporting OTP issues, portal outages, or expired application links
                  </p>
                </div>
              </div>

              {/* Trouble list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {students.filter((s) => s.facing_trouble > 0).length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState
                      icon={<CheckCircle2 className="h-10 w-10 text-emerald-400" />}
                      title="No Candidate Blockers Reported"
                      description="All students are currently experiencing smooth portal access."
                    />
                  </div>
                ) : (
                  students
                    .filter((s) => s.facing_trouble > 0)
                    .map((s) => (
                      <div key={s.id} className="rounded-3xl glass-card border border-rose-500/30 p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                              {s.facing_trouble} Job Issue{s.facing_trouble > 1 ? "s" : ""}
                            </span>
                            <h3 className="text-base font-bold text-white mt-2">{s.full_name}</h3>
                            <p className="text-xs text-surface-400">{s.department} • {s.roll_number || s.email}</p>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center gap-2">
                          {s.phone && (
                            <a
                              href={`https://wa.me/91${s.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 py-2 text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              WhatsApp
                            </a>
                          )}
                          <button
                            onClick={() => setCurrentTab("chat")}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary-600/20 text-primary-300 border border-primary-500/30 py-2 text-xs font-semibold hover:bg-primary-600/30 transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Open Chat
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW: HELP CHAT (WhatsApp-style Master-Detail)
             ══════════════════════════════════════════════ */}
          {currentTab === "chat" && (
            <div className="animate-fadeIn">
              <HelpChatMasterDetail
                threads={help_threads}
                onRefresh={() => fetchData(selectedJobId)}
              />
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW: REMINDERS & ALERTS
             ══════════════════════════════════════════════ */}
          {currentTab === "reminders" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reminder Composer */}
                <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Bell className="h-5 w-5 text-amber-400" />
                      Broadcast In-App Notification
                    </h2>
                    <p className="text-xs text-surface-400">
                      Dispatches direct notifications to student inboxes and optional email alerts
                    </p>
                  </div>

                  <form onSubmit={handleSendCustomReminder} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-surface-300">
                        Reminder Headline / Title
                      </label>
                      <input
                        type="text"
                        required
                        value={reminderTitle}
                        onChange={(e) => setReminderTitle(e.target.value)}
                        placeholder="e.g. 24 Hours Left to Complete TCS Application"
                        className="w-full rounded-2xl glass-input px-4 py-3 text-xs sm:text-sm text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-surface-300">
                        Message Details
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={reminderMessage}
                        onChange={(e) => setReminderMessage(e.target.value)}
                        placeholder="Please log into the portal and ensure all mandatory fields are submitted..."
                        className="w-full rounded-2xl glass-input p-4 text-xs sm:text-sm text-white resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-surface-300">
                          Target Department
                        </label>
                        <select
                          value={reminderDept}
                          onChange={(e) => setReminderDept(e.target.value)}
                          className="w-full rounded-2xl glass-input px-3.5 py-3 text-xs text-white cursor-pointer"
                        >
                          <option value="ALL" className="bg-surface-900">All Departments</option>
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d} className="bg-surface-900">{d}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-surface-300">
                          Specific Drive (Optional)
                        </label>
                        <select
                          value={reminderJobId}
                          onChange={(e) => setReminderJobId(e.target.value)}
                          className="w-full rounded-2xl glass-input px-3.5 py-3 text-xs text-white cursor-pointer"
                        >
                          <option value="" className="bg-surface-900">-- All / General Alert --</option>
                          {jobs.map((j) => (
                            <option key={j.id} value={j.id} className="bg-surface-900 truncate">
                              {j.company_name} — {j.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-surface-900/40 border border-white/5 p-4">
                      <input
                        type="checkbox"
                        id="rem-email"
                        checked={reminderEmail}
                        onChange={(e) => setReminderEmail(e.target.checked)}
                        className="h-4 w-4 rounded accent-primary-500 cursor-pointer"
                      />
                      <label htmlFor="rem-email" className="text-xs text-surface-300 cursor-pointer">
                        Also dispatch email notification to eligible student inboxes
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={sendingReminder}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl btn-vibrant-primary px-5 py-3.5 text-sm font-bold shadow-lg disabled:opacity-50"
                    >
                      {sendingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Broadcast Alert Now
                    </button>
                  </form>
                </div>

                {/* Sent Reminders Log */}
                <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <History className="h-5 w-5 text-cyan-400" />
                    Recent Broadcasts
                  </h2>
                  <div className="space-y-3 max-h-[460px] overflow-y-auto custom-scroll">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-surface-500 text-center py-12">
                        No reminders dispatched yet.
                      </p>
                    ) : (
                      notifications.slice(0, 15).map((n) => (
                        <div key={n.id} className="rounded-2xl bg-surface-900/40 border border-white/5 p-3.5">
                          <div className="flex items-center justify-between text-[11px] text-surface-500 mb-1">
                            <span className="font-bold text-primary-300">{n.title}</span>
                            <span>{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-surface-300">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW: WHATSAPP GROUPS
             ══════════════════════════════════════════════ */}
          {currentTab === "whatsapp" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Group Form */}
                <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                  <h2 className="text-base font-bold text-white">Add WhatsApp Placement Group</h2>
                  <form onSubmit={handleSaveGroup} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-surface-300">Group Name</label>
                      <input
                        type="text"
                        required
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="e.g. CSE 2026 Placements"
                        className="w-full rounded-2xl glass-input px-3.5 py-2.5 text-xs text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-surface-300">Department</label>
                      <select
                        value={newGroupDept}
                        onChange={(e) => setNewGroupDept(e.target.value)}
                        className="w-full rounded-2xl glass-input px-3.5 py-2.5 text-xs text-white"
                      >
                        <option value="ALL" className="bg-surface-900">ALL</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d} className="bg-surface-900">{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-surface-300">Invite Link (Optional)</label>
                      <input
                        type="url"
                        value={newGroupInvite}
                        onChange={(e) => setNewGroupInvite(e.target.value)}
                        placeholder="https://chat.whatsapp.com/..."
                        className="w-full rounded-2xl glass-input px-3.5 py-2.5 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingGroup}
                      className="w-full rounded-2xl btn-vibrant-emerald py-3 text-xs font-bold"
                    >
                      {savingGroup ? "Saving..." : "Save Group"}
                    </button>
                  </form>
                </div>

                {/* Group List */}
                <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                  <h2 className="text-base font-bold text-white">Configured WhatsApp Groups</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {whatsapp_groups.length === 0 ? (
                      <p className="text-xs text-surface-500 py-8">No WhatsApp groups added yet.</p>
                    ) : (
                      whatsapp_groups.map((g) => (
                        <div
                          key={g.id}
                          className="rounded-2xl bg-surface-900/40 border border-white/5 p-4 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white text-sm">{g.name}</h4>
                              <span className="rounded-md bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                                {g.department_tag}
                              </span>
                            </div>
                            {g.invite_link && (
                              <p className="text-[11px] text-surface-400 mt-2 truncate">
                                {g.invite_link}
                              </p>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                            {g.invite_link ? (
                              <a
                                href={g.invite_link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                Join Group <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-surface-500">No link set</span>
                            )}
                            <button
                              onClick={() => handleDeleteGroup(g.id)}
                              className="text-xs text-rose-400 hover:text-rose-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW: ANALYTICS & INSIGHTS
             ══════════════════════════════════════════════ */}
          {currentTab === "analytics" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Placement Velocity */}
                <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                  <h3 className="text-base font-bold text-white">Department-Wise Application Completion</h3>
                  <div className="space-y-3">
                    {DEPARTMENTS.map((dept) => {
                      const deptStudents = students.filter((s) => s.department === dept);
                      const assigned = deptStudents.reduce((acc, s) => acc + s.total_jobs, 0);
                      const applied = deptStudents.reduce((acc, s) => acc + s.applied, 0);
                      const pct = assigned > 0 ? Math.round((applied / assigned) * 100) : 0;
                      return (
                        <div key={dept} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-white">{dept} ({deptStudents.length} candidates)</span>
                            <span className="text-cyan-300">{pct}% ({applied} / {assigned})</span>
                          </div>
                          <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 via-cyan-400 to-emerald-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Distribution */}
                <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
                  <h3 className="text-base font-bold text-white">Placement Drive Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {PRIORITIES.map((p) => {
                      const count = jobs.filter((j) => j.priority === p).length;
                      return (
                        <div key={p} className="rounded-2xl bg-surface-900/40 border border-white/5 p-4 text-center">
                          <PriorityBadge priority={p} />
                          <p className="text-2xl font-extrabold text-white mt-2">{count}</p>
                          <p className="text-[10px] text-surface-400 mt-0.5">Drives posted</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW: AUDIT TRAIL
             ══════════════════════════════════════════════ */}
          {currentTab === "audit" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto custom-scroll">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-950/60 border-b border-white/10 text-surface-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Action</th>
                        <th className="p-4">Actor</th>
                        <th className="p-4">Target Entity</th>
                        <th className="p-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {audit_logs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-surface-500">
                            No audit events logged yet.
                          </td>
                        </tr>
                      ) : (
                        audit_logs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-surface-400 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span className="rounded-md bg-primary-500/20 text-primary-300 font-bold px-2 py-0.5">
                                {log.action}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-white">{log.actor_name}</td>
                            <td className="p-4 text-surface-300">{log.entity_type}</td>
                            <td className="p-4 font-mono text-[11px] text-surface-400 max-w-xs truncate">
                              {JSON.stringify(log.metadata)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              VIEW: SETTINGS
             ══════════════════════════════════════════════ */}
          {currentTab === "settings" && (
            <div className="max-w-xl glass-card rounded-3xl p-6 border border-white/10 space-y-5 animate-fadeIn">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-surface-400" />
                Placement Officer Profile & System Settings
              </h2>
              <div className="space-y-3 text-xs text-surface-300">
                <div className="rounded-2xl bg-surface-900/40 p-4 border border-white/5 space-y-2">
                  <p><strong className="text-white">Role:</strong> Placement Officer (Admin)</p>
                  <p><strong className="text-white">Institution:</strong> ApplyForge Campus Placement Cell</p>
                  <p><strong className="text-white">App Version:</strong> ApplyForge 2.0 (Glassmorphic Ultra)</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── Modals ────────────────────────────────────── */}
      <CreateJobModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        whatsappGroups={whatsapp_groups}
        onJobCreated={handleJobCreated}
      />

      {editingJob && (
        <EditJobModal
          job={editingJob}
          isOpen={true}
          onClose={() => setEditingJob(null)}
          onJobUpdated={() => {
            setToast({ message: "Job updated successfully!", type: "success" });
            fetchData();
          }}
        />
      )}

      {deletingJob && (
        <DeleteJobModal
          job={deletingJob}
          isOpen={true}
          onClose={() => setDeletingJob(null)}
          onJobDeleted={() => {
            setToast({ message: "Job deleted successfully!", type: "success" });
            fetchData();
          }}
        />
      )}

      {waModal && (
        <WhatsAppBroadcastModal
          isOpen={true}
          onClose={() => setWaModal(null)}
          message={waModal.message}
          shareLinks={waModal.shareLinks}
          title={waModal.title}
        />
      )}
    </div>
  );
}
