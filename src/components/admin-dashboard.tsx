"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { get, post } from "@/lib/client";
import type { AdminDashboard, Job, StudentRow, WhatsAppGroup, JobApplication, Profile } from "@/lib/types";
import {
  KPICard,
  PriorityBadge,
  StatusBadge,
  Toast,
  FullPageSpinner,
  EmptyState,
  Drawer,
} from "./shared";
import { CreateJobModal } from "./job-modal";
import { WhatsAppBroadcastModal } from "./whatsapp-broadcast-modal";
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
  BookOpen,
} from "lucide-react";

type AdminView = "jobs" | "job-tracker" | "students" | "whatsapp";

export default function AdminDashboardView() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AdminView>("jobs");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [waModal, setWaModal] = useState<{
    message: string;
    shareLinks: { groupName: string; shareUrl: string; inviteLink: string | null }[];
    title: string;
  } | null>(null);

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
    router.push("/");
    router.refresh();
  }

  async function handleJobCreated(job: Job, sendEmail: boolean) {
    setToast({ message: `Job "${job.company_name} — ${job.title}" posted!`, type: "success" });
    // Send notifications
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
    setToast({ message: "Sending reminders...", type: "success" });
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
        message: `Reminders sent. ${res.data.unappliedCount} students pending.`,
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

  if (loading) return <FullPageSpinner />;
  if (!data) return null;

  const navItems: { key: AdminView; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "jobs", label: "All Jobs", icon: <Briefcase className="h-4 w-4" />, count: data.jobs.length },
    { key: "job-tracker", label: "Job Tracker", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "students", label: "Students", icon: <Users className="h-4 w-4" />, count: data.students.length },
    { key: "whatsapp", label: "WhatsApp Groups", icon: <MessageSquare className="h-4 w-4" />, count: data.whatsapp_groups.length },
  ];

  return (
    <div className="min-h-screen bg-surface-950">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-surface-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-900/30">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">ApplyForge</h1>
                <p className="text-[10px] text-surface-400 -mt-0.5">Placement Officer</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowJobModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary-900/30 hover:from-primary-500 hover:to-primary-600 transition-all btn-lift"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Post Job</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl bg-surface-800 px-3 py-2 text-sm text-surface-400 hover:bg-surface-700 hover:text-white transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-surface-800 bg-surface-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setView(item.key);
                  if (item.key !== "job-tracker") setSelectedJobId(null);
                  if (item.key !== "students") setSelectedStudentId(null);
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                  view === item.key
                    ? "bg-primary-600/20 text-primary-300 border border-primary-500/30"
                    : "text-surface-400 hover:bg-surface-800 hover:text-surface-300"
                }`}
              >
                {item.icon}
                {item.label}
                {item.count !== undefined && (
                  <span className="rounded-full bg-surface-700 px-2 py-0.5 text-xs text-surface-400">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {view === "jobs" && (
          <JobsListView
            jobs={data.jobs}
            onSelectJob={(id) => {
              setSelectedJobId(id);
              setView("job-tracker");
            }}
            onShareJob={async (job) => {
              const res = await post<{
                waMessage: string;
                shareLinks: { groupName: string; shareUrl: string; inviteLink: string | null }[];
              }>("/api/notify", {
                action: "JOB_BROADCAST",
                jobId: job.id,
                sendEmail: false,
                webhookPush: false,
              });
              if (res.ok && res.data) {
                setWaModal({
                  message: res.data.waMessage,
                  shareLinks: res.data.shareLinks,
                  title: `📢 Share: ${job.company_name} — ${job.title}`,
                });
              }
            }}
          />
        )}
        {view === "job-tracker" && (
          <JobTrackerView
            data={data}
            jobs={data.jobs}
            selectedJobId={selectedJobId}
            onSelectJob={(id) => setSelectedJobId(id)}
            onRemindUnapplied={handleRemindUnapplied}
            onExport={handleExport}
          />
        )}
        {view === "students" && (
          <StudentsView
            students={data.students}
            studentDetail={data.student_detail}
            selectedStudentId={selectedStudentId}
            onSelectStudent={(id) => setSelectedStudentId(id)}
            onExport={() => handleExport("students")}
          />
        )}
        {view === "whatsapp" && (
          <WhatsAppGroupsView
            groups={data.whatsapp_groups}
            onRefresh={() => fetchData()}
            setToast={setToast}
          />
        )}
      </main>

      {/* Modals */}
      <CreateJobModal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        whatsappGroups={data.whatsapp_groups}
        onJobCreated={handleJobCreated}
      />
      {waModal && (
        <WhatsAppBroadcastModal
          isOpen
          onClose={() => setWaModal(null)}
          message={waModal.message}
          shareLinks={waModal.shareLinks}
          title={waModal.title}
        />
      )}
    </div>
  );
}

/* ─── Jobs List View ──────────────────────────────────── */
function JobsListView({
  jobs,
  onSelectJob,
  onShareJob,
}: {
  jobs: Job[];
  onSelectJob: (id: string) => void;
  onShareJob: (job: Job) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = jobs.filter(
    (j) =>
      j.company_name.toLowerCase().includes(search.toLowerCase()) ||
      j.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">All Posted Jobs</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-xl bg-surface-800 border border-surface-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder-surface-500"
            placeholder="Search jobs..."
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-8 w-8" />}
          title="No jobs yet"
          description='Click "Post Job" to create your first placement opportunity.'
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div
              key={job.id}
              className="group flex items-center justify-between rounded-2xl bg-surface-800/50 border border-surface-700 p-5 transition-all hover:border-surface-600 hover:shadow-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <PriorityBadge priority={job.priority} />
                  {!job.is_active && (
                    <span className="rounded-full bg-surface-600/50 px-2.5 py-0.5 text-xs text-surface-400">
                      Inactive
                    </span>
                  )}
                </div>
                <h3 className="text-white font-semibold text-base">{job.company_name}</h3>
                <p className="text-surface-400 text-sm">{job.title}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
                  {job.package_ctc && <span>💰 {job.package_ctc}</span>}
                  {job.location && <span>📍 {job.location}</span>}
                  {job.deadline && (
                    <span>
                      📅{" "}
                      {new Date(job.deadline).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onShareJob(job)}
                  className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  title="Share to WhatsApp"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onSelectJob(job.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-primary-500/10 border border-primary-500/20 px-3 py-2.5 text-sm text-primary-300 hover:bg-primary-500/20 transition-all"
                >
                  <Eye className="h-4 w-4" />
                  Track
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Job Tracker View ─────────────────────────────────── */
function JobTrackerView({
  data,
  jobs,
  selectedJobId,
  onSelectJob,
  onRemindUnapplied,
  onExport,
}: {
  data: AdminDashboard;
  jobs: Job[];
  selectedJobId: string | null;
  onSelectJob: (id: string) => void;
  onRemindUnapplied: (jobId: string) => void;
  onExport: (type: string, jobId?: string, status?: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  if (!selectedJobId) {
    return (
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Select a Job to Track</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => onSelectJob(job.id)}
              className="group text-left rounded-2xl bg-surface-800/50 border border-surface-700 p-4 transition-all hover:border-primary-500/30 hover:bg-surface-800"
            >
              <PriorityBadge priority={job.priority} />
              <h3 className="text-white font-semibold mt-2">{job.company_name}</h3>
              <p className="text-surface-400 text-sm">{job.title}</p>
              <div className="flex items-center gap-1 mt-2 text-primary-400 text-xs">
                <span>View Tracker</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const detail = data.job_detail;
  if (!detail) return <FullPageSpinner />;

  const { job, kpi, applications } = detail;

  const filteredApps = applications.filter((app) => {
    const student = app.student as unknown as Profile;
    if (!student) return false;
    if (statusFilter !== "ALL" && app.status !== statusFilter) return false;
    if (deptFilter !== "ALL" && student.department !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        student.full_name.toLowerCase().includes(q) ||
        (student.roll_number || "").toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q) ||
        student.phone.includes(q)
      );
    }
    return true;
  });

  const statusTabs = [
    { key: "ALL", label: "All", count: kpi.total_assigned },
    { key: "APPLIED", label: "Applied", count: kpi.applied },
    { key: "NOT_APPLIED", label: "Not Applied", count: kpi.not_applied },
    { key: "FACING_TROUBLE", label: "Trouble", count: kpi.facing_trouble },
    { key: "NOT_ELIGIBLE", label: "Not Eligible", count: kpi.not_eligible },
  ];

  return (
    <div>
      {/* Job Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => onSelectJob("")}
            className="text-xs text-primary-400 hover:text-primary-300 mb-2 transition-colors"
          >
            ← Back to Job Selection
          </button>
          <div className="flex items-center gap-3">
            <PriorityBadge priority={job.priority} />
            <div>
              <h2 className="text-xl font-bold text-white">{job.company_name}</h2>
              <p className="text-surface-400">{job.title}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRemindUnapplied(job.id)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm text-amber-300 hover:bg-amber-500/20 transition-all"
          >
            <Bell className="h-4 w-4" />
            Remind Unapplied
          </button>
          <button
            onClick={() => onExport("job", job.id)}
            className="flex items-center gap-1.5 rounded-xl bg-surface-800 border border-surface-700 px-3 py-2 text-sm text-surface-300 hover:bg-surface-700 transition-all"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KPICard label="Total Assigned" value={kpi.total_assigned} icon={<Users className="h-5 w-5" />} color="primary" />
        <KPICard label="Applied" value={kpi.applied} icon={<CheckCircle2 className="h-5 w-5" />} color="green" subtitle={`${kpi.applied_pct}%`} />
        <KPICard label="Not Applied" value={kpi.not_applied} icon={<Clock className="h-5 w-5" />} color="yellow" />
        <KPICard label="Trouble" value={kpi.facing_trouble} icon={<AlertTriangle className="h-5 w-5" />} color="red" />
        <KPICard label="Not Eligible" value={kpi.not_eligible} icon={<UserCheck className="h-5 w-5" />} color="gray" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === tab.key
                  ? "bg-primary-600/20 text-primary-300 border border-primary-500/30"
                  : "bg-surface-800 text-surface-400 border border-surface-700 hover:bg-surface-700"
              }`}
            >
              {tab.label}
              <span className="rounded-full bg-surface-700/50 px-1.5 py-0.5 text-[10px]">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-surface-800 border border-surface-700 pl-10 pr-4 py-2 text-sm text-white placeholder-surface-500"
            placeholder="Search by name, roll no, email..."
          />
        </div>
      </div>

      {/* Student Table */}
      <div className="rounded-2xl bg-surface-800/30 border border-surface-700 overflow-hidden">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Dept</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Link Clicked</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Applied At</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {filteredApps.map((app) => {
                const student = app.student as unknown as Profile;
                if (!student) return null;
                return (
                  <tr key={app.id} className="hover:bg-surface-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{student.full_name}</p>
                        <p className="text-xs text-surface-500">
                          {student.roll_number ? `${student.roll_number} • ` : ""}{student.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-surface-400">{student.department}</td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-3 text-xs text-surface-400">
                      {app.link_clicked_at
                        ? new Date(app.link_clicked_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-400">
                      {app.applied_at
                        ? new Date(app.applied_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-400">
                      {app.application_ref && <span className="text-emerald-400">Ref: {app.application_ref}</span>}
                      {app.issue_category && (
                        <span className="text-red-400">{app.issue_category.replace(/_/g, " ")}</span>
                      )}
                      {app.issue_note && <p className="text-surface-500 mt-0.5 truncate max-w-[200px]">{app.issue_note}</p>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredApps.length === 0 && (
          <div className="py-12 text-center text-surface-500 text-sm">
            No students match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Students View ────────────────────────────────────── */
function StudentsView({
  students,
  studentDetail,
  selectedStudentId,
  onSelectStudent,
  onExport,
}: {
  students: StudentRow[];
  studentDetail?: AdminDashboard["student_detail"];
  selectedStudentId: string | null;
  onSelectStudent: (id: string | null) => void;
  onExport: () => void;
}) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  const filtered = students.filter((s) => {
    if (deptFilter !== "ALL" && s.department !== deptFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.full_name.toLowerCase().includes(q) ||
        (s.roll_number || "").toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Student Compliance Tracker</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-xl bg-surface-800 border border-surface-700 pl-10 pr-4 py-2.5 text-sm text-white placeholder-surface-500"
              placeholder="Search students..."
            />
          </div>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-xl bg-surface-800 border border-surface-700 px-3 py-2.5 text-sm text-surface-300 hover:bg-surface-700 transition-all"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-surface-800/30 border border-surface-700 overflow-hidden">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Roll No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Dept</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">CGPA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Total Jobs</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Applied</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Pending</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Trouble</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Completion</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-surface-700/30 transition-colors cursor-pointer" onClick={() => onSelectStudent(s.id)}>
                  <td className="px-4 py-3 text-surface-300 font-mono text-xs">{s.roll_number || "—"}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">{s.full_name}</p>
                      <p className="text-xs text-surface-500">{s.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-surface-400">{s.department}</td>
                  <td className="px-4 py-3 text-surface-300">{s.cgpa ?? "—"}</td>
                  <td className="px-4 py-3 text-surface-300">{s.total_jobs}</td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">{s.applied}</td>
                  <td className="px-4 py-3 text-amber-400 font-medium">{s.not_applied}</td>
                  <td className="px-4 py-3 text-red-400 font-medium">{s.facing_trouble}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-surface-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                          style={{ width: `${s.completion_pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-surface-400">{s.completion_pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="h-4 w-4 text-surface-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-surface-500 text-sm">No students found.</div>
        )}
      </div>

      {/* Student Detail Drawer */}
      {selectedStudentId && studentDetail && (
        <Drawer
          isOpen
          onClose={() => onSelectStudent(null)}
          title={`${studentDetail.student.full_name} — Application History`}
        >
          <div className="space-y-4">
            {/* Student Info */}
            <div className="rounded-xl bg-surface-800 border border-surface-700 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4 text-surface-500" />
                <span className="text-surface-300">{studentDetail.student.roll_number}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-surface-500" />
                <span className="text-surface-300">{studentDetail.student.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-surface-500" />
                <span className="text-surface-300">{studentDetail.student.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-surface-500" />
                <span className="text-surface-300">{studentDetail.student.department}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-surface-500" />
                <span className="text-surface-300">CGPA: {studentDetail.student.cgpa ?? "—"}</span>
              </div>
            </div>

            {/* Application History */}
            <h3 className="text-sm font-semibold text-surface-300">Job History</h3>
            {studentDetail.applications.length === 0 ? (
              <p className="text-sm text-surface-500">No jobs assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {studentDetail.applications.map((app) => {
                  const job = app.job;
                  return (
                    <div
                      key={app.id}
                      className="rounded-xl bg-surface-800/50 border border-surface-700 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <PriorityBadge priority={job.priority} />
                        <StatusBadge status={app.status} />
                      </div>
                      <h4 className="text-white font-medium">{job.company_name}</h4>
                      <p className="text-surface-400 text-sm">{job.title}</p>
                      <div className="mt-2 space-y-1 text-xs text-surface-500">
                        {app.link_clicked_at && (
                          <p>
                            🔗 Link opened:{" "}
                            {new Date(app.link_clicked_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                        {app.applied_at && (
                          <p className="text-emerald-400">
                            ✅ Applied:{" "}
                            {new Date(app.applied_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {app.application_ref && ` • Ref: ${app.application_ref}`}
                          </p>
                        )}
                        {app.issue_category && (
                          <p className="text-red-400">
                            ⚠️ {app.issue_category.replace(/_/g, " ")}
                            {app.issue_note && `: ${app.issue_note}`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}

/* ─── WhatsApp Groups View ─────────────────────────────── */
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
  const [form, setForm] = useState({ name: "", departmentTag: "ALL", inviteLink: "", groupJid: "" });
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await post("/api/command", {
      type: "SAVE_WHATSAPP_GROUP",
      name: form.name,
      departmentTag: form.departmentTag,
      inviteLink: form.inviteLink || undefined,
      groupJid: form.groupJid || undefined,
    });
    if (res.ok) {
      setToast({ message: "Group saved!", type: "success" });
      setShowForm(false);
      setForm({ name: "", departmentTag: "ALL", inviteLink: "", groupJid: "" });
      onRefresh();
    } else {
      setToast({ message: res.error || "Failed", type: "error" });
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this WhatsApp group?")) return;
    const res = await post("/api/command", {
      type: "DELETE_WHATSAPP_GROUP",
      groupId: id,
    });
    if (res.ok) {
      setToast({ message: "Group deleted", type: "success" });
      onRefresh();
    } else {
      setToast({ message: res.error || "Failed", type: "error" });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">WhatsApp Groups</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white transition-all hover:from-emerald-500 hover:to-emerald-600 btn-lift"
        >
          <Plus className="h-4 w-4" />
          Add Group
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="mb-6 rounded-2xl bg-surface-800/50 border border-surface-700 p-5 space-y-4 animate-fadeIn"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-300">Group Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl bg-surface-800 border border-surface-600 px-4 py-3 text-sm text-white placeholder-surface-500"
                placeholder="CSE 2027 Placements"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-300">Department Tag</label>
              <input
                required
                value={form.departmentTag}
                onChange={(e) => setForm({ ...form, departmentTag: e.target.value })}
                className="w-full rounded-xl bg-surface-800 border border-surface-600 px-4 py-3 text-sm text-white placeholder-surface-500"
                placeholder="CSE, ALL, etc."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-300">Invite Link</label>
              <input
                value={form.inviteLink}
                onChange={(e) => setForm({ ...form, inviteLink: e.target.value })}
                className="w-full rounded-xl bg-surface-800 border border-surface-600 px-4 py-3 text-sm text-white placeholder-surface-500"
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-300">Group JID (Optional)</label>
              <input
                value={form.groupJid}
                onChange={(e) => setForm({ ...form, groupJid: e.target.value })}
                className="w-full rounded-xl bg-surface-800 border border-surface-600 px-4 py-3 text-sm text-white placeholder-surface-500"
                placeholder="120363xxx@g.us"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500 transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Group"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl bg-surface-700 px-4 py-2.5 text-sm text-surface-300 hover:bg-surface-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-8 w-8" />}
          title="No WhatsApp groups"
          description="Add your college WhatsApp groups to share job opportunities."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between rounded-2xl bg-surface-800/50 border border-surface-700 p-4"
            >
              <div>
                <h3 className="text-white font-medium">{g.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                    {g.department_tag}
                  </span>
                  {g.invite_link && (
                    <a
                      href={g.invite_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-400 hover:text-primary-300"
                    >
                      <ExternalLink className="h-3 w-3 inline" /> Link
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(g.id)}
                className="rounded-lg p-2 text-surface-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
