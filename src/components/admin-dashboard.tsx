"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/client";
import type { AdminDashboard, Job, StudentRow, WhatsAppGroup, JobApplication, Profile, AuditLog } from "@/lib/types";
import {
  KPICard,
  PriorityBadge,
  StatusBadge,
  Toast,
  FullPageSpinner,
  EmptyState,
  Drawer,
} from "./shared";
import { CreateJobModal, EditJobModal, DeleteJobModal } from "./job-modal";
import { WhatsAppBroadcastModal } from "./whatsapp-broadcast-modal";
import { AdminSidebar, type AdminView } from "./admin-sidebar";
import { AdminHelpChat } from "./help-chat";
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
  UserCheck,
  Phone,
  Mail,
  Hash,
  GraduationCap,
  Send,
  ScrollText,
  Settings,
  RefreshCcw,
} from "lucide-react";

export default function AdminDashboardView() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AdminView>("overview");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [deleteJob, setDeleteJob] = useState<Job | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [waModal, setWaModal] = useState<{
    message: string;
    shareLinks: { groupName: string; shareUrl: string; inviteLink: string | null }[];
    title: string;
  } | null>(null);

  // Filters
  const [jobSearch, setJobSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Reminder
  const [reminderModal, setReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderMsg, setReminderMsg] = useState("");
  const [reminderDept, setReminderDept] = useState("ALL");
  const [sendingReminder, setSendingReminder] = useState(false);

  const fetchData = useCallback(
    async (jobId?: string | null, studentId?: string | null) => {
      let url = "/api/snapshot?scope=admin";
      if (jobId) url += `&jobId=${jobId}`;
      if (studentId) url += `&studentId=${studentId}`;
      const res = await get<AdminDashboard>(url);
      if (res.ok && res.data) {
        setData(res.data);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    fetchData(selectedJobId, selectedStudentId);
  }, [fetchData, selectedJobId, selectedStudentId]);

  async function handleLogout() {
    await post("/api/auth/logout", {});
    router.push("/admin/login");
    router.refresh();
  }

  async function handleJobCreated(job: Job, sendEmail: boolean) {
    setToast({ message: `✅ ${job.company_name} — ${job.title} posted!`, type: "success" });
    fetchData();
    if (sendEmail) {
      await post("/api/notify", {
        action: "JOB_BROADCAST",
        jobId: job.id,
        sendEmail: true,
        webhookPush: false,
      });
    }
  }

  async function handleRemindUnapplied(jobId: string) {
    const res = await post<{ unappliedCount: number }>("/api/notify", {
      action: "REMIND_UNAPPLIED",
      jobId,
      sendEmail: true,
      webhookPush: false,
    });
    if (res.ok) {
      setToast({
        message: `📧 Reminders sent to ${res.data?.unappliedCount || 0} students`,
        type: "success",
      });
    } else {
      setToast({ message: res.error || "Failed to send reminders", type: "error" });
    }
  }

  function handleExport(type: string, jobId?: string, status?: string) {
    let url = `/api/export?type=${type}`;
    if (jobId) url += `&jobId=${jobId}`;
    if (status) url += `&status=${status}`;
    window.open(url, "_blank");
  }

  async function handleSendReminder() {
    setSendingReminder(true);
    const res = await post("/api/command", {
      type: "SEND_REMINDER",
      title: reminderTitle,
      message: reminderMsg,
      department: reminderDept === "ALL" ? undefined : reminderDept,
    });
    if (res.ok) {
      setToast({ message: "✅ Reminder sent!", type: "success" });
      setReminderModal(false);
      setReminderTitle("");
      setReminderMsg("");
      fetchData();
    } else {
      setToast({ message: res.error || "Failed", type: "error" });
    }
    setSendingReminder(false);
  }

  if (loading) return <FullPageSpinner />;
  if (!data) return null;

  const badges = {
    drives: data.jobs.length,
    students: data.students.length,
    "help-chat": data.help_threads.reduce((s, t) => s + t.unread_count, 0),
    whatsapp: data.whatsapp_groups.length,
  };

  // Filtered data
  const filteredJobs = data.jobs.filter(
    (j) =>
      (j.company_name.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.title.toLowerCase().includes(jobSearch.toLowerCase())) &&
      (deptFilter === "ALL" || j.eligible_departments.includes(deptFilter) || j.eligible_departments.includes("ALL"))
  );

  const filteredStudents = data.students.filter(
    (s) =>
      (s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.roll_number || "").toLowerCase().includes(studentSearch.toLowerCase())) &&
      (deptFilter === "ALL" || s.department === deptFilter) &&
      (statusFilter === "ALL" ||
        (statusFilter === "DEFAULTER" && s.not_applied > 0) ||
        (statusFilter === "COMPLIANT" && s.not_applied === 0))
  );

  return (
    <div className="flex min-h-screen bg-surface-950">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar */}
      <AdminSidebar activeView={view} onViewChange={setView} badges={badges} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-surface-900/80 backdrop-blur border-b border-surface-700">
          <h2 className="text-lg font-bold text-white capitalize">{view.replace("-", " ")}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowJobModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-900/30 hover:from-primary-500 hover:to-primary-600 transition-all btn-lift"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Post Job</span>
            </button>
            <button
              onClick={() => fetchData(selectedJobId, selectedStudentId)}
              className="rounded-xl bg-surface-800 p-2 text-surface-400 hover:text-white transition-all"
              title="Refresh"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-surface-800 px-3 py-2 text-sm text-surface-400 hover:bg-surface-700 hover:text-white transition-all"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {/* ─── Overview ──────────────────────────────────── */}
          {view === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard label="Total Drives" value={data.jobs.length} icon={<Briefcase className="h-5 w-5" />} color="primary" />
                <KPICard label="Active Drives" value={data.jobs.filter((j) => j.is_active).length} icon={<CheckCircle2 className="h-5 w-5" />} color="green" />
                <KPICard label="Total Students" value={data.students.length} icon={<Users className="h-5 w-5" />} color="yellow" />
                <KPICard
                  label="Avg Completion"
                  value={`${data.students.length > 0 ? Math.round(data.students.reduce((s, st) => s + st.completion_pct, 0) / data.students.length) : 0}%`}
                  icon={<TrendingUp className="h-5 w-5" />}
                  color="primary"
                />
              </div>
              {/* Recent Jobs */}
              <div>
                <h3 className="text-sm font-semibold text-surface-300 mb-3">Recent Drives</h3>
                <div className="space-y-2">
                  {data.jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between rounded-xl bg-surface-800/50 border border-surface-700 p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={job.priority} />
                          <p className="text-sm font-semibold text-white">{job.company_name} — {job.title}</p>
                        </div>
                        <p className="text-xs text-surface-400 mt-0.5">{job.eligible_departments.join(", ")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditJob(job); }} className="rounded-lg bg-surface-700 p-1.5 text-surface-400 hover:text-white transition-all"><Edit3 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setSelectedJobId(job.id); setView("drives"); }} className="rounded-lg bg-surface-700 p-1.5 text-surface-400 hover:text-white transition-all"><Eye className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Recent Audit */}
              <div>
                <h3 className="text-sm font-semibold text-surface-300 mb-3">Recent Activity</h3>
                <div className="space-y-1.5">
                  {(data.audit_logs || []).slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center gap-3 rounded-lg bg-surface-800/30 px-3 py-2 text-xs text-surface-400">
                      <ScrollText className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium text-surface-300">{log.actor_name}</span>
                      <span>{log.action}</span>
                      <span className="ml-auto text-surface-500">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Drives (Jobs) ─────────────────────────────── */}
          {view === "drives" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
                  <input type="text" value={jobSearch} onChange={(e) => setJobSearch(e.target.value)} className="w-full rounded-xl bg-surface-800 border border-surface-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder-surface-500" placeholder="Search jobs..." />
                </div>
                <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded-xl bg-surface-800 border border-surface-700 px-3 py-2.5 text-sm text-white">
                  <option value="ALL">All Departments</option>
                  {["CSE", "IT", "AI&DS", "ECE", "EEE", "MECH", "CIVIL"].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <button onClick={() => handleExport("students")} className="flex items-center gap-1.5 rounded-xl bg-surface-800 border border-surface-700 px-3 py-2.5 text-sm text-surface-400 hover:text-white transition-all">
                  <Download className="h-4 w-4" /> Export
                </button>
              </div>

              {/* Job Detail View */}
              {selectedJobId && data.job_detail ? (
                <div className="space-y-4">
                  <button onClick={() => setSelectedJobId(null)} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    ← Back to all drives
                  </button>
                  <div className="rounded-2xl bg-surface-800/50 border border-surface-700 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <PriorityBadge priority={data.job_detail.job.priority} />
                          <h3 className="text-lg font-bold text-white">{data.job_detail.job.company_name} — {data.job_detail.job.title}</h3>
                        </div>
                        <p className="text-xs text-surface-400">{data.job_detail.job.eligible_departments.join(", ")} · {data.job_detail.job.package_ctc || "CTC N/A"} · {data.job_detail.job.location || "Location N/A"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditJob(data.job_detail!.job)} className="flex items-center gap-1 rounded-lg bg-surface-700 px-3 py-1.5 text-xs text-surface-300 hover:text-white transition-all"><Edit3 className="h-3 w-3" /> Edit</button>
                        <button onClick={() => setDeleteJob(data.job_detail!.job)} className="flex items-center gap-1 rounded-lg bg-red-500/10 text-red-400 px-3 py-1.5 text-xs hover:bg-red-500/20 transition-all"><Trash2 className="h-3 w-3" /> Delete</button>
                        <button onClick={() => handleRemindUnapplied(data.job_detail!.job.id)} className="flex items-center gap-1 rounded-lg bg-amber-500/10 text-amber-400 px-3 py-1.5 text-xs hover:bg-amber-500/20 transition-all"><Bell className="h-3 w-3" /> Remind</button>
                        <button onClick={() => handleExport("job", data.job_detail!.job.id)} className="flex items-center gap-1 rounded-lg bg-surface-700 px-3 py-1.5 text-xs text-surface-300 hover:text-white transition-all"><Download className="h-3 w-3" /> CSV</button>
                      </div>
                    </div>
                    {/* KPIs */}
                    <div className="grid grid-cols-5 gap-3 mb-4">
                      <KPICard label="Assigned" value={data.job_detail.kpi.total_assigned} icon={<Users className="h-4 w-4" />} color="primary" />
                      <KPICard label="Applied" value={data.job_detail.kpi.applied} icon={<CheckCircle2 className="h-4 w-4" />} color="green" />
                      <KPICard label="Not Applied" value={data.job_detail.kpi.not_applied} icon={<Clock className="h-4 w-4" />} color="yellow" />
                      <KPICard label="Trouble" value={data.job_detail.kpi.facing_trouble} icon={<AlertTriangle className="h-4 w-4" />} color="red" />
                      <KPICard label="Completion" value={`${data.job_detail.kpi.applied_pct}%`} icon={<TrendingUp className="h-4 w-4" />} color="primary" />
                    </div>
                    {/* Applications Table */}
                    <div className="rounded-xl border border-surface-700 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-surface-800">
                          <tr>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Student</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Department</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Status</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Applied At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-800">
                          {data.job_detail.applications.map((app) => {
                            const s = app.student as Profile;
                            return (
                              <tr key={app.id} className="hover:bg-surface-800/30 transition-colors">
                                <td className="px-4 py-2.5 text-white">{s?.full_name || "—"}</td>
                                <td className="px-4 py-2.5 text-surface-400">{s?.department || "—"}</td>
                                <td className="px-4 py-2.5"><StatusBadge status={app.status} /></td>
                                <td className="px-4 py-2.5 text-surface-400 text-xs">{app.applied_at ? new Date(app.applied_at).toLocaleString() : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* Jobs List */
                <div className="space-y-3">
                  {filteredJobs.length === 0 ? (
                    <EmptyState icon={<Briefcase className="h-8 w-8" />} title="No jobs yet" description='Click "Post Job" to create your first placement opportunity.' />
                  ) : (
                    filteredJobs.map((job) => (
                      <div key={job.id} className="group flex items-center justify-between rounded-2xl bg-surface-800/50 border border-surface-700 p-5 transition-all hover:border-surface-600 hover:shadow-lg">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedJobId(job.id)}>
                          <div className="flex items-center gap-3 mb-1">
                            <PriorityBadge priority={job.priority} />
                            {!job.is_active && <span className="rounded-full bg-surface-600/50 px-2.5 py-0.5 text-xs text-surface-400">Inactive</span>}
                            <h3 className="text-sm font-semibold text-white truncate">{job.company_name} — {job.title}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-surface-400">
                            <span>{job.eligible_departments.join(", ")}</span>
                            {job.package_ctc && <span>💰 {job.package_ctc}</span>}
                            {job.deadline && <span>📅 {new Date(job.deadline).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditJob(job)} className="rounded-lg bg-surface-700 p-2 text-surface-400 hover:text-white transition-all" title="Edit"><Edit3 className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteJob(job)} className="rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition-all" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          <button onClick={async () => {
                            const res = await post<{ waMessage: string; shareLinks: { groupName: string; shareUrl: string; inviteLink: string | null }[] }>("/api/notify", { action: "JOB_BROADCAST", jobId: job.id, sendEmail: false, webhookPush: false });
                            if (res.ok && res.data) { setWaModal({ message: res.data.waMessage, shareLinks: res.data.shareLinks, title: `📢 Share: ${job.company_name} — ${job.title}` }); }
                          }} className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 hover:bg-emerald-500/20 transition-all" title="Share"><ExternalLink className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── Students ──────────────────────────────────── */}
          {view === "students" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
                  <input type="text" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="w-full rounded-xl bg-surface-800 border border-surface-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder-surface-500" placeholder="Search students..." />
                </div>
                <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded-xl bg-surface-800 border border-surface-700 px-3 py-2.5 text-sm text-white">
                  <option value="ALL">All Departments</option>
                  {["CSE", "IT", "AI&DS", "ECE", "EEE", "MECH", "CIVIL"].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl bg-surface-800 border border-surface-700 px-3 py-2.5 text-sm text-white">
                  <option value="ALL">All Students</option>
                  <option value="DEFAULTER">Defaulters</option>
                  <option value="COMPLIANT">Compliant</option>
                </select>
                <button onClick={() => handleExport("students")} className="flex items-center gap-1.5 rounded-xl bg-surface-800 border border-surface-700 px-3 py-2.5 text-sm text-surface-400 hover:text-white transition-all">
                  <Download className="h-4 w-4" /> Export
                </button>
              </div>

              {/* Student Detail */}
              {selectedStudentId && data.student_detail ? (
                <div className="space-y-4">
                  <button onClick={() => setSelectedStudentId(null)} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">← Back to all students</button>
                  <div className="rounded-2xl bg-surface-800/50 border border-surface-700 p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-primary-600/20 flex items-center justify-center"><Users className="h-6 w-6 text-primary-400" /></div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{data.student_detail.student.full_name}</h3>
                        <p className="text-xs text-surface-400">{data.student_detail.student.department} · {data.student_detail.student.email} · {data.student_detail.student.phone}</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-surface-700 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-surface-800">
                          <tr>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Job</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Status</th>
                            <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Applied At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-800">
                          {data.student_detail.applications.map((app) => (
                            <tr key={app.id} className="hover:bg-surface-800/30 transition-colors">
                              <td className="px-4 py-2.5 text-white">{(app.job as Job).company_name} — {(app.job as Job).title}</td>
                              <td className="px-4 py-2.5"><StatusBadge status={app.status} /></td>
                              <td className="px-4 py-2.5 text-surface-400 text-xs">{app.applied_at ? new Date(app.applied_at).toLocaleString() : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-surface-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-800">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Student</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Dept</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Applied</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Not Applied</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Trouble</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Completion</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-800">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-surface-800/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <p className="text-white font-medium">{s.full_name}</p>
                            <p className="text-[11px] text-surface-500">{s.email}</p>
                          </td>
                          <td className="px-4 py-2.5 text-surface-400">{s.department}</td>
                          <td className="px-4 py-2.5 text-emerald-400 font-medium">{s.applied}</td>
                          <td className="px-4 py-2.5 text-amber-400 font-medium">{s.not_applied}</td>
                          <td className="px-4 py-2.5 text-red-400 font-medium">{s.facing_trouble}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-surface-700 overflow-hidden">
                                <div className="h-full rounded-full bg-primary-500" style={{ width: `${s.completion_pct}%` }} />
                              </div>
                              <span className="text-xs text-surface-400">{s.completion_pct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <button onClick={() => setSelectedStudentId(s.id)} className="rounded-lg bg-surface-700 p-1.5 text-surface-400 hover:text-white transition-all"><Eye className="h-3.5 w-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── Analytics ─────────────────────────────────── */}
          {view === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard label="Total Drives" value={data.jobs.length} icon={<Briefcase className="h-5 w-5" />} color="primary" />
                <KPICard label="Total Students" value={data.students.length} icon={<Users className="h-5 w-5" />} color="yellow" />
                <KPICard label="Avg Completion" value={`${data.students.length > 0 ? Math.round(data.students.reduce((s, st) => s + st.completion_pct, 0) / data.students.length) : 0}%`} icon={<TrendingUp className="h-5 w-5" />} color="green" />
                <KPICard label="Help Requests" value={data.help_threads.length} icon={<MessageSquare className="h-5 w-5" />} color="red" />
              </div>
              {/* Department Breakdown */}
              <div className="rounded-2xl bg-surface-800/50 border border-surface-700 p-6">
                <h3 className="text-sm font-semibold text-surface-300 mb-4">Department Breakdown</h3>
                <div className="space-y-3">
                  {["CSE", "IT", "AI&DS", "ECE", "EEE", "MECH", "CIVIL"].map((dept) => {
                    const count = data.students.filter((s) => s.department === dept).length;
                    const avgPct = count > 0 ? Math.round(data.students.filter((s) => s.department === dept).reduce((acc, s) => acc + s.completion_pct, 0) / count) : 0;
                    return (
                      <div key={dept} className="flex items-center gap-4">
                        <span className="text-xs font-medium text-surface-300 w-16">{dept}</span>
                        <div className="flex-1 h-2 rounded-full bg-surface-700 overflow-hidden">
                          <div className="h-full rounded-full bg-primary-500" style={{ width: `${avgPct}%` }} />
                        </div>
                        <span className="text-xs text-surface-400 w-12 text-right">{avgPct}%</span>
                        <span className="text-xs text-surface-500 w-16 text-right">{count} students</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── Help Chat ─────────────────────────────────── */}
          {view === "help-chat" && (
            <AdminHelpChat threads={data.help_threads} onRefresh={() => fetchData()} adminId="" />
          )}

          {/* ─── Notifications ─────────────────────────────── */}
          {view === "notifications" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-surface-300">Send Notifications & Reminders</h3>
                <button onClick={() => setReminderModal(true)} className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-all">
                  <Send className="h-4 w-4" /> Send Reminder
                </button>
              </div>
              {/* Sent Notifications List */}
              <div className="space-y-2">
                {(data.notifications_sent || []).length === 0 ? (
                  <EmptyState icon={<Bell className="h-8 w-8" />} title="No notifications sent" description="Send reminders to keep students on track." />
                ) : (
                  (data.notifications_sent || []).map((n) => (
                    <div key={n.id} className="rounded-xl bg-surface-800/50 border border-surface-700 px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        <p className="text-xs text-surface-400">{n.message}</p>
                      </div>
                      <span className="text-[10px] text-surface-500">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Reminder Modal */}
              {reminderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="w-full max-w-lg bg-surface-900 rounded-2xl border border-surface-700 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Send Reminder</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-surface-300 mb-1">Title</label>
                        <input type="text" value={reminderTitle} onChange={(e) => setReminderTitle(e.target.value)} className="w-full rounded-xl bg-surface-800 border border-surface-600 px-4 py-2.5 text-sm text-white" placeholder="Reminder title..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-300 mb-1">Message</label>
                        <textarea value={reminderMsg} onChange={(e) => setReminderMsg(e.target.value)} rows={3} className="w-full rounded-xl bg-surface-800 border border-surface-600 px-4 py-2.5 text-sm text-white resize-none" placeholder="Your message..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-surface-300 mb-1">Target Department</label>
                        <select value={reminderDept} onChange={(e) => setReminderDept(e.target.value)} className="w-full rounded-xl bg-surface-800 border border-surface-600 px-3 py-2.5 text-sm text-white">
                          <option value="ALL">All Departments</option>
                          {["CSE", "IT", "AI&DS", "ECE", "EEE", "MECH", "CIVIL"].map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setReminderModal(false)} className="flex-1 rounded-xl bg-surface-800 px-4 py-2.5 text-sm text-surface-300 hover:bg-surface-700 transition-all">Cancel</button>
                        <button onClick={handleSendReminder} disabled={!reminderTitle || !reminderMsg || sendingReminder} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50 transition-all">
                          {sendingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── WhatsApp Groups ───────────────────────────── */}
          {view === "whatsapp" && (
            <WhatsAppGroupsView
              groups={data.whatsapp_groups}
              onRefresh={() => fetchData()}
              setToast={setToast}
            />
          )}

          {/* ─── Audit Logs ────────────────────────────────── */}
          {view === "audit-logs" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-surface-300">Activity & Audit Log</h3>
              <div className="rounded-xl border border-surface-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-800">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Time</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Actor</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Action</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-surface-400">Entity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-800">
                    {(data.audit_logs || []).map((log) => (
                      <tr key={log.id} className="hover:bg-surface-800/30 transition-colors">
                        <td className="px-4 py-2.5 text-surface-400 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-white">{log.actor_name}</td>
                        <td className="px-4 py-2.5"><span className="rounded-full bg-primary-500/10 text-primary-400 px-2 py-0.5 text-xs font-medium">{log.action}</span></td>
                        <td className="px-4 py-2.5 text-surface-400">{log.entity_type}{log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── Settings ──────────────────────────────────── */}
          {view === "settings" && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-surface-800/50 border border-surface-700 p-6">
                <h3 className="text-lg font-bold text-white mb-2">Application Settings</h3>
                <p className="text-sm text-surface-400 mb-4">Manage your ApplyForge placement portal configuration.</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-surface-800 border border-surface-700 p-4">
                    <div>
                      <p className="text-sm font-medium text-white">Email Notifications</p>
                      <p className="text-xs text-surface-500">Send emails when new jobs are posted</p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-primary-500 relative cursor-pointer">
                      <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow translate-x-5 transition-transform" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-surface-800 border border-surface-700 p-4">
                    <div>
                      <p className="text-sm font-medium text-white">Auto-assign Jobs</p>
                      <p className="text-xs text-surface-500">Automatically assign new jobs to eligible students</p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-primary-500 relative cursor-pointer">
                      <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow translate-x-5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateJobModal isOpen={showJobModal} onClose={() => setShowJobModal(false)} whatsappGroups={data.whatsapp_groups} onJobCreated={handleJobCreated} />
      {editJob && <EditJobModal isOpen={!!editJob} onClose={() => setEditJob(null)} job={editJob} whatsappGroups={data.whatsapp_groups} onJobUpdated={() => { fetchData(); setEditJob(null); }} />}
      {deleteJob && <DeleteJobModal isOpen={!!deleteJob} onClose={() => setDeleteJob(null)} job={deleteJob} onJobDeleted={() => { fetchData(); setDeleteJob(null); setSelectedJobId(null); }} />}
      {waModal && <WhatsAppBroadcastModal isOpen onClose={() => setWaModal(null)} message={waModal.message} shareLinks={waModal.shareLinks} title={waModal.title} />}
    </div>
  );
}

/* ─── WhatsApp Groups View (extracted) ──────────────────── */
function WhatsAppGroupsView({
  groups,
  onRefresh,
  setToast,
}: {
  groups: WhatsAppGroup[];
  onRefresh: () => void;
  setToast: (t: { message: string; type: "success" | "error" }) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WhatsAppGroup | null>(null);
  const [form, setForm] = useState({ name: "", departmentTag: "ALL", inviteLink: "", groupJid: "" });
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setForm({ name: "", departmentTag: "ALL", inviteLink: "", groupJid: "" });
    setEditingGroup(null);
    setShowForm(false);
  }

  function startEdit(g: WhatsAppGroup) {
    setForm({ name: g.name, departmentTag: g.department_tag, inviteLink: g.invite_link || "", groupJid: g.group_jid || "" });
    setEditingGroup(g);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const res = await post("/api/command", {
      type: "SAVE_WHATSAPP_GROUP",
      ...(editingGroup ? { id: editingGroup.id } : {}),
      name: form.name,
      departmentTag: form.departmentTag,
      inviteLink: form.inviteLink || undefined,
      groupJid: form.groupJid || undefined,
    });
    if (res.ok) {
      setToast({ message: editingGroup ? "Group updated!" : "Group added!", type: "success" });
      resetForm();
      onRefresh();
    } else {
      setToast({ message: res.error || "Failed", type: "error" });
    }
    setSaving(false);
  }

  async function handleDelete(groupId: string) {
    const res = await post("/api/command", { type: "DELETE_WHATSAPP_GROUP", groupId });
    if (res.ok) {
      setToast({ message: "Group deleted", type: "success" });
      onRefresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-300">WhatsApp Groups</h3>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-all">
          <Plus className="h-4 w-4" /> Add Group
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-surface-800/50 border border-surface-700 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Group Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl bg-surface-800 border border-surface-600 px-4 py-2.5 text-sm text-white" placeholder="CSE 2027" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Department</label>
              <select value={form.departmentTag} onChange={(e) => setForm({ ...form, departmentTag: e.target.value })} className="w-full rounded-xl bg-surface-800 border border-surface-600 px-3 py-2.5 text-sm text-white">
                <option value="ALL">ALL</option>
                {["CSE", "IT", "AI&DS", "ECE", "EEE", "MECH", "CIVIL"].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Invite Link</label>
            <input type="text" value={form.inviteLink} onChange={(e) => setForm({ ...form, inviteLink: e.target.value })} className="w-full rounded-xl bg-surface-800 border border-surface-600 px-4 py-2.5 text-sm text-white" placeholder="https://chat.whatsapp.com/..." />
          </div>
          <div className="flex gap-3">
            <button onClick={resetForm} className="rounded-xl bg-surface-800 px-4 py-2.5 text-sm text-surface-300 hover:bg-surface-700 transition-all">Cancel</button>
            <button onClick={handleSave} disabled={!form.name || saving} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-all">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {editingGroup ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.id} className="flex items-center justify-between rounded-xl bg-surface-800/50 border border-surface-700 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">{g.name}</p>
              <p className="text-xs text-surface-400">{g.department_tag} · {g.invite_link ? "Has invite link" : "No invite link"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => startEdit(g)} className="rounded-lg bg-surface-700 p-1.5 text-surface-400 hover:text-white transition-all"><Edit3 className="h-3.5 w-3.5" /></button>
              <button onClick={() => handleDelete(g.id)} className="rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
