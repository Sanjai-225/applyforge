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
  BookOpen,
  Users,
  Mail,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappGroups: WhatsAppGroup[];
  onJobCreated: (job: Job, sendEmail: boolean) => void;
}

export function CreateJobModal({
  isOpen,
  onClose,
  whatsappGroups,
  onJobCreated,
}: JobModalProps) {
  const [form, setForm] = useState({
    title: "",
    companyName: "",
    applicationUrl: "",
    priority: "NORMAL",
    packageCtc: "",
    location: "",
    description: "",
    eligibleDepartments: ["ALL"] as string[],
    minCgpa: "0",
    batchYear: "2027",
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
      minCgpa: parseFloat(form.minCgpa) || 0,
      batchYear: parseInt(form.batchYear) || undefined,
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
        minCgpa: "0",
        batchYear: "2027",
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
        {/* Row 1: Company + Title */}
        <div className="grid grid-cols-2 gap-4">
          <InputField
            id="job-company"
            label="Company Name"
            icon={<Building2 className="h-4 w-4" />}
            required
            value={form.companyName}
            onChange={(v) => update("companyName", v)}
            placeholder="TCS Digital"
          />
          <InputField
            id="job-title"
            label="Job Role / Title"
            icon={<Briefcase className="h-4 w-4" />}
            required
            value={form.title}
            onChange={(v) => update("title", v)}
            placeholder="Software Engineer"
          />
        </div>

        {/* Application URL */}
        <InputField
          id="job-url"
          label="External Application URL"
          icon={<Link2 className="h-4 w-4" />}
          required
          type="url"
          value={form.applicationUrl}
          onChange={(v) => update("applicationUrl", v)}
          placeholder="https://nextstep.tcs.com/campus"
        />

        {/* Row 2: Priority + Package + Location */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-300">
              <Zap className="h-3.5 w-3.5 inline mr-1" />
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => update("priority", e.target.value)}
              className="w-full rounded-xl bg-surface-800 border border-surface-600 px-3 py-3 text-sm text-white appearance-none cursor-pointer"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <InputField
            id="job-package"
            label="Package / CTC"
            icon={<DollarSign className="h-4 w-4" />}
            value={form.packageCtc}
            onChange={(v) => update("packageCtc", v)}
            placeholder="7.5 LPA"
          />
          <InputField
            id="job-location"
            label="Location"
            icon={<MapPin className="h-4 w-4" />}
            value={form.location}
            onChange={(v) => update("location", v)}
            placeholder="Chennai"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-300">
            <FileText className="h-3.5 w-3.5 inline mr-1" />
            Description / Instructions
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full rounded-xl bg-surface-800 border border-surface-600 px-4 py-3 text-sm text-white placeholder-surface-500 resize-none"
            placeholder="Additional instructions for students..."
          />
        </div>

        {/* Row: Deadline + Batch + Min CGPA */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-300">
              <Calendar className="h-3.5 w-3.5 inline mr-1" />
              Deadline
            </label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              className="w-full rounded-xl bg-surface-800 border border-surface-600 px-3 py-3 text-sm text-white"
            />
          </div>
          <InputField
            id="job-batch"
            label="Batch Year"
            icon={<Calendar className="h-4 w-4" />}
            type="number"
            value={form.batchYear}
            onChange={(v) => update("batchYear", v)}
            placeholder="2027"
          />
          <InputField
            id="job-cgpa"
            label="Min CGPA"
            icon={<BookOpen className="h-4 w-4" />}
            type="number"
            value={form.minCgpa}
            onChange={(v) => update("minCgpa", v)}
            placeholder="0"
          />
        </div>

        {/* Eligible Departments */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-surface-300">
            <GraduationCap className="h-3.5 w-3.5 inline mr-1" />
            Eligible Departments
          </label>
          <div className="flex flex-wrap gap-2">
            {["ALL", ...DEPARTMENTS].map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => toggleDept(dept)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  form.eligibleDepartments.includes(dept)
                    ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                    : "bg-surface-800 text-surface-400 border border-surface-600 hover:bg-surface-700"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* WhatsApp Groups */}
        {whatsappGroups.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-surface-300">
              <Users className="h-3.5 w-3.5 inline mr-1" />
              Target WhatsApp Groups
            </label>
            <div className="flex flex-wrap gap-2">
              {whatsappGroups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    form.targetGroupIds.includes(g.id)
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-surface-800 text-surface-400 border border-surface-600 hover:bg-surface-700"
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Send Email Toggle */}
        <div className="flex items-center gap-3 rounded-xl bg-surface-800/50 border border-surface-700 p-4">
          <button
            type="button"
            onClick={() => update("sendEmail", !form.sendEmail)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              form.sendEmail ? "bg-primary-500" : "bg-surface-600"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                form.sendEmail ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <div>
            <p className="text-sm font-medium text-surface-300">
              <Mail className="h-3.5 w-3.5 inline mr-1" />
              Send Email to Eligible Students
            </p>
            <p className="text-xs text-surface-500">Automatically notify eligible students via email</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-900/30 transition-all hover:from-primary-500 hover:to-primary-600 disabled:opacity-60 disabled:cursor-not-allowed btn-lift"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Post Job & Broadcast
            </>
          )}
        </button>
      </form>
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
        className="w-full rounded-xl bg-surface-800 border border-surface-600 px-3 py-3 text-sm text-white placeholder-surface-500 transition-all hover:border-surface-500 focus:border-primary-500"
        placeholder={placeholder}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
      />
    </div>
  );
}
