"use client";

import React, { useState } from "react";
import { Modal, Toast } from "./shared";
import { post } from "@/lib/client";
import { DEPARTMENTS, PRIORITIES } from "@/lib/types";
import type { WhatsAppGroup, Job } from "@/lib/types";
import {
  Building2,
  Briefcase,
  Link2,
  Zap,
  DollarSign,
  MapPin,
  FileText,
  Calendar,
  GraduationCap,
  Users,
  Mail,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from "lucide-react";

/* ─── Create Job Modal ────────────────────────────────── */
export function CreateJobModal({
  isOpen,
  onClose,
  whatsappGroups,
  onJobCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  whatsappGroups: WhatsAppGroup[];
  onJobCreated: (job: Job, sendEmail: boolean) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    companyName: "",
    applicationUrl: "",
    priority: "NORMAL",
    packageCtc: "",
    location: "",
    description: "",
    eligibleDepartments: ["ALL"] as string[],
    deadline: "",
    targetGroupIds: [] as string[],
    sendEmail: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleDept(dept: string) {
    setForm((prev) => {
      let depts = [...prev.eligibleDepartments];
      if (dept === "ALL") {
        depts = depts.includes("ALL") ? [] : ["ALL"];
      } else {
        depts = depts.filter((d) => d !== "ALL");
        if (depts.includes(dept)) {
          depts = depts.filter((d) => d !== dept);
        } else {
          depts.push(dept);
        }
      }
      if (depts.length === 0) depts = ["ALL"];
      return { ...prev, eligibleDepartments: depts };
    });
  }

  function toggleGroup(groupId: string) {
    setForm((prev) => {
      const ids = prev.targetGroupIds.includes(groupId)
        ? prev.targetGroupIds.filter((id) => id !== groupId)
        : [...prev.targetGroupIds, groupId];
      return { ...prev, targetGroupIds: ids };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await post<{ job: Job }>("/api/command", {
      type: "CREATE_JOB",
      title: form.title,
      companyName: form.companyName,
      applicationUrl: form.applicationUrl,
      priority: form.priority,
      packageCtc: form.packageCtc || undefined,
      location: form.location || undefined,
      description: form.description || undefined,
      eligibleDepartments: form.eligibleDepartments,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      targetGroupIds: form.targetGroupIds,
      sendEmail: form.sendEmail,
    });

    if (res.ok && res.data?.job) {
      onJobCreated(res.data.job, form.sendEmail);
      onClose();
      // Reset form
      setForm({
        title: "",
        companyName: "",
        applicationUrl: "",
        priority: "NORMAL",
        packageCtc: "",
        location: "",
        description: "",
        eligibleDepartments: ["ALL"],
        deadline: "",
        targetGroupIds: [],
        sendEmail: true,
      });
    } else {
      setError(res.error || "Failed to create job");
    }
    setSaving(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post New Job Opportunity" size="lg">
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            id="job-company"
            label="Company Name"
            icon={<Building2 className="h-4 w-4" />}
            required
            value={form.companyName}
            onChange={(v) => update("companyName", v)}
            placeholder="e.g. TCS, Infosys, Zoho"
          />
          <InputField
            id="job-title"
            label="Job Role / Title"
            icon={<Briefcase className="h-4 w-4" />}
            required
            value={form.title}
            onChange={(v) => update("title", v)}
            placeholder="e.g. Software Engineer - Full Stack"
          />
        </div>

        <InputField
          id="job-url"
          label="External Application URL / Portal Link"
          icon={<Link2 className="h-4 w-4" />}
          required
          type="url"
          value={form.applicationUrl}
          onChange={(v) => update("applicationUrl", v)}
          placeholder="https://careers.company.com/apply"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-300">
              <Zap className="h-3.5 w-3.5 inline mr-1 text-amber-400" />
              Priority Level
            </label>
            <select
              value={form.priority}
              onChange={(e) => update("priority", e.target.value)}
              className="w-full rounded-2xl glass-input px-3.5 py-3 text-sm text-white appearance-none cursor-pointer"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="bg-surface-900">
                  {p}
                </option>
              ))}
            </select>
          </div>
          <InputField
            id="job-package"
            label="Package / CTC"
            icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
            value={form.packageCtc}
            onChange={(v) => update("packageCtc", v)}
            placeholder="e.g. 7.5 LPA"
          />
          <InputField
            id="job-location"
            label="Location"
            icon={<MapPin className="h-4 w-4 text-rose-400" />}
            value={form.location}
            onChange={(v) => update("location", v)}
            placeholder="e.g. Chennai / Remote"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-300">
              <Calendar className="h-3.5 w-3.5 inline mr-1 text-cyan-400" />
              Application Deadline
            </label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              className="w-full rounded-2xl glass-input px-3.5 py-3 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-300">
              <FileText className="h-3.5 w-3.5 inline mr-1 text-primary-400" />
              Short Note
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="w-full rounded-2xl glass-input px-3.5 py-3 text-sm text-white"
              placeholder="e.g. Service agreement: 1 year. Assessment on Saturday."
            />
          </div>
        </div>

        {/* Eligible Departments */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-surface-300">
            <GraduationCap className="h-3.5 w-3.5 inline mr-1 text-violet-400" />
            Eligible Departments
          </label>
          <div className="flex flex-wrap gap-2">
            {["ALL", ...DEPARTMENTS].map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => toggleDept(dept)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  form.eligibleDepartments.includes(dept)
                    ? "bg-primary-500/30 text-primary-200 border border-primary-500/50 shadow-sm shadow-primary-500/20"
                    : "bg-surface-800/40 text-surface-400 border border-white/5 hover:bg-surface-800"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Target WhatsApp Groups */}
        {whatsappGroups.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-surface-300">
              <Users className="h-3.5 w-3.5 inline mr-1 text-emerald-400" />
              Target WhatsApp Groups
            </label>
            <div className="flex flex-wrap gap-2">
              {whatsappGroups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    form.targetGroupIds.includes(g.id)
                      ? "bg-emerald-500/30 text-emerald-200 border border-emerald-500/50 shadow-sm shadow-emerald-500/20"
                      : "bg-surface-800/40 text-surface-400 border border-white/5 hover:bg-surface-800"
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Email Notification Toggle */}
        <div className="flex items-center gap-3 rounded-2xl bg-surface-900/40 border border-white/5 p-4">
          <button
            type="button"
            onClick={() => update("sendEmail", !form.sendEmail)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              form.sendEmail ? "bg-primary-500" : "bg-surface-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                form.sendEmail ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <div>
            <p className="text-sm font-medium text-surface-200">
              <Mail className="h-3.5 w-3.5 inline mr-1 text-primary-400" />
              Broadcast to Eligible Students via Email
            </p>
            <p className="text-xs text-surface-400">
              Dispatches automated placement alert to student email inboxes
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-2xl btn-vibrant-primary px-6 py-4 text-sm font-bold shadow-xl transition-all disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Post Opportunity & Broadcast
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}

/* ─── Edit Job Modal ──────────────────────────────────── */
export function EditJobModal({
  job,
  isOpen,
  onClose,
  onJobUpdated,
}: {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onJobUpdated: () => void;
}) {
  const [form, setForm] = useState({
    title: job.title,
    companyName: job.company_name,
    applicationUrl: job.application_url,
    priority: job.priority,
    packageCtc: job.package_ctc || "",
    location: job.location || "",
    description: job.description || "",
    eligibleDepartments: job.eligible_departments || ["ALL"],
    deadline: job.deadline ? job.deadline.slice(0, 16) : "",
    isActive: job.is_active,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleDept(dept: string) {
    setForm((prev) => {
      let depts = [...prev.eligibleDepartments];
      if (dept === "ALL") {
        depts = depts.includes("ALL") ? [] : ["ALL"];
      } else {
        depts = depts.filter((d) => d !== "ALL");
        if (depts.includes(dept)) {
          depts = depts.filter((d) => d !== dept);
        } else {
          depts.push(dept);
        }
      }
      if (depts.length === 0) depts = ["ALL"];
      return { ...prev, eligibleDepartments: depts };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await post("/api/command", {
      type: "UPDATE_JOB",
      jobId: job.id,
      title: form.title,
      companyName: form.companyName,
      applicationUrl: form.applicationUrl,
      priority: form.priority,
      packageCtc: form.packageCtc || undefined,
      location: form.location || undefined,
      description: form.description || undefined,
      eligibleDepartments: form.eligibleDepartments,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      isActive: form.isActive,
    });

    if (res.ok) {
      onJobUpdated();
      onClose();
    } else {
      setError(res.error || "Failed to update job");
    }
    setSaving(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit: ${job.company_name} — ${job.title}`} size="lg">
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            id="edit-company"
            label="Company Name"
            icon={<Building2 className="h-4 w-4" />}
            required
            value={form.companyName}
            onChange={(v) => update("companyName", v)}
          />
          <InputField
            id="edit-title"
            label="Job Role / Title"
            icon={<Briefcase className="h-4 w-4" />}
            required
            value={form.title}
            onChange={(v) => update("title", v)}
          />
        </div>

        <InputField
          id="edit-url"
          label="External Application URL"
          icon={<Link2 className="h-4 w-4" />}
          required
          type="url"
          value={form.applicationUrl}
          onChange={(v) => update("applicationUrl", v)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-300">
              <Zap className="h-3.5 w-3.5 inline mr-1 text-amber-400" />
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => update("priority", e.target.value)}
              className="w-full rounded-2xl glass-input px-3.5 py-3 text-sm text-white appearance-none cursor-pointer"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="bg-surface-900">
                  {p}
                </option>
              ))}
            </select>
          </div>
          <InputField
            id="edit-package"
            label="Package / CTC"
            icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
            value={form.packageCtc}
            onChange={(v) => update("packageCtc", v)}
          />
          <InputField
            id="edit-location"
            label="Location"
            icon={<MapPin className="h-4 w-4 text-rose-400" />}
            value={form.location}
            onChange={(v) => update("location", v)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-300">
              <Calendar className="h-3.5 w-3.5 inline mr-1 text-cyan-400" />
              Application Deadline
            </label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              className="w-full rounded-2xl glass-input px-3.5 py-3 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-300">
              <FileText className="h-3.5 w-3.5 inline mr-1 text-primary-400" />
              Description / Instructions
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="w-full rounded-2xl glass-input px-3.5 py-3 text-sm text-white"
            />
          </div>
        </div>

        {/* Eligible Departments */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-surface-300">
            <GraduationCap className="h-3.5 w-3.5 inline mr-1 text-violet-400" />
            Eligible Departments
          </label>
          <div className="flex flex-wrap gap-2">
            {["ALL", ...DEPARTMENTS].map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => toggleDept(dept)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  form.eligibleDepartments.includes(dept)
                    ? "bg-primary-500/30 text-primary-200 border border-primary-500/50 shadow-sm shadow-primary-500/20"
                    : "bg-surface-800/40 text-surface-400 border border-white/5 hover:bg-surface-800"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between rounded-2xl bg-surface-900/40 border border-white/5 p-4">
          <div>
            <p className="text-sm font-semibold text-surface-200">Drive Status</p>
            <p className="text-xs text-surface-400">
              {form.isActive ? "Active and accepting applications" : "Archived / Hidden"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => update("isActive", !form.isActive)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              form.isActive ? "bg-emerald-500" : "bg-surface-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                form.isActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-surface-800 px-4 py-3.5 text-sm font-semibold text-surface-300 hover:bg-surface-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl btn-vibrant-primary px-4 py-3.5 text-sm font-bold shadow-lg"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Delete Confirmation Modal ───────────────────────── */
export function DeleteJobModal({
  job,
  isOpen,
  onClose,
  onJobDeleted,
}: {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onJobDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    const res = await post("/api/command", {
      type: "DELETE_JOB",
      jobId: job.id,
    });

    if (res.ok) {
      onJobDeleted();
      onClose();
    } else {
      setError(res.error || "Failed to delete job");
    }
    setDeleting(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Placement Drive" size="sm">
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 text-rose-300">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <p className="text-sm">
            Are you sure you want to remove <strong>{job.company_name} — {job.title}</strong>? All student application records associated with this drive will also be deleted.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-surface-800 px-4 py-3 text-sm font-semibold text-surface-300 hover:bg-surface-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-900/30 transition-all"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Confirm Delete
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Input Field Helper ──────────────────────────────── */
function InputField({
  id,
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-surface-300">
        <span className="inline mr-1">{icon}</span>
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl glass-input px-3.5 py-3 text-sm text-white placeholder-surface-500 transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}
