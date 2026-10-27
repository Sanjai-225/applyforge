"use client";

import React from "react";
import { Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";

/* ─── Loading Spinner ─────────────────────────────────── */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface-950/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-surface-700 border-t-primary-500 animate-spin" />
          <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-b-accent-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
        <p className="text-surface-400 text-sm font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

/* ─── KPI Card ─────────────────────────────────────────── */
export function KPICard({
  label,
  value,
  icon,
  color = "primary",
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "primary" | "green" | "yellow" | "red" | "gray";
  subtitle?: string;
}) {
  const colorClasses = {
    primary: "from-primary-600/20 to-primary-800/10 border-primary-500/20",
    green: "from-emerald-600/20 to-emerald-800/10 border-emerald-500/20",
    yellow: "from-amber-600/20 to-amber-800/10 border-amber-500/20",
    red: "from-red-600/20 to-red-800/10 border-red-500/20",
    gray: "from-slate-600/20 to-slate-800/10 border-slate-500/20",
  };

  const iconColors = {
    primary: "text-primary-400",
    green: "text-emerald-400",
    yellow: "text-amber-400",
    red: "text-red-400",
    gray: "text-slate-400",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colorClasses[color]} border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-surface-400">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-lg bg-surface-800/50 p-2.5 ${iconColors[color]}`}>
          {icon}
        </div>
      </div>
      {/* Decorative glow */}
      <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl" />
    </div>
  );
}

/* ─── Toast Notification ────────────────────────────────── */
export function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}) {
  const colors = {
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    error: "bg-red-500/10 border-red-500/30 text-red-300",
    info: "bg-primary-500/10 border-primary-500/30 text-primary-300",
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <AlertTriangle className="h-5 w-5" />,
    info: <AlertTriangle className="h-5 w-5" />,
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl toast-enter ${colors[type]}`}
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Modal ─────────────────────────────────────────────── */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeClasses[size]} max-h-[85vh] overflow-y-auto rounded-2xl bg-surface-900 border border-surface-700 shadow-2xl animate-fadeIn custom-scroll`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-700 bg-surface-900/95 backdrop-blur-sm px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-700 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ─── Drawer (Slide-over panel) ──────────────────────── */
export function Drawer({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl overflow-y-auto bg-surface-900 border-l border-surface-700 shadow-2xl animate-slideInRight custom-scroll">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-700 bg-surface-900/95 backdrop-blur-sm px-6 py-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-700 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ─── Priority Badge ───────────────────────────────────── */
export function PriorityBadge({ priority }: { priority: string }) {
  const cls = `badge-${priority.toLowerCase()}`;
  const emoji: Record<string, string> = {
    URGENT: "🔴",
    HIGH: "🟠",
    NORMAL: "🟢",
    LOW: "⚪",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      <span>{emoji[priority] || "🟢"}</span>
      {priority}
    </span>
  );
}

/* ─── Status Badge ─────────────────────────────────────── */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NOT_APPLIED: "status-not-applied",
    APPLIED: "status-applied",
    FACING_TROUBLE: "status-facing-trouble",
    NOT_ELIGIBLE: "status-not-eligible",
  };
  const labels: Record<string, string> = {
    NOT_APPLIED: "Not Applied Yet",
    APPLIED: "Applied",
    FACING_TROUBLE: "Facing Trouble",
    NOT_ELIGIBLE: "Not Eligible",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${map[status] || "status-not-applied"}`}>
      {labels[status] || status}
    </span>
  );
}

/* ─── Empty State ──────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-2xl bg-surface-800/50 p-4 text-surface-500">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-surface-300">{title}</h3>
      <p className="mt-1 text-sm text-surface-500 max-w-sm">{description}</p>
    </div>
  );
}
