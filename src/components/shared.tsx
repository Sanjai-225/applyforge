"use client";

import React from "react";
import { Loader2, CheckCircle2, AlertTriangle, X, Info } from "lucide-react";

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
    <div className="fixed inset-0 flex items-center justify-center bg-surface-950/80 backdrop-blur-md z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-surface-700/60 border-t-primary-500 animate-spin" />
          <div
            className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-b-accent-400 animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.4s" }}
          />
        </div>
        <p className="gradient-text text-sm font-semibold tracking-wide animate-pulse">
          ApplyForge 2.0 Loading...
        </p>
      </div>
    </div>
  );
}

/* ─── Glassmorphic KPI Card ─────────────────────────────── */
export function KPICard({
  label,
  value,
  icon,
  color = "primary",
  subtitle,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "primary" | "green" | "yellow" | "red" | "cyan" | "purple";
  subtitle?: string;
  onClick?: () => void;
}) {
  const colorGradients = {
    primary: "from-primary-600/25 via-primary-900/10 to-transparent border-primary-500/30 text-primary-400 shadow-primary-950/50",
    green: "from-emerald-600/25 via-emerald-900/10 to-transparent border-emerald-500/30 text-emerald-400 shadow-emerald-950/50",
    yellow: "from-amber-600/25 via-amber-900/10 to-transparent border-amber-500/30 text-amber-400 shadow-amber-950/50",
    red: "from-rose-600/25 via-rose-900/10 to-transparent border-rose-500/30 text-rose-400 shadow-rose-950/50",
    cyan: "from-cyan-600/25 via-cyan-900/10 to-transparent border-cyan-500/30 text-cyan-400 shadow-cyan-950/50",
    purple: "from-fuchsia-600/25 via-fuchsia-900/10 to-transparent border-fuchsia-500/30 text-fuchsia-400 shadow-fuchsia-950/50",
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorGradients[color]} glass-card p-5 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-white tracking-tight">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-surface-400">{subtitle}</p>
          )}
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 shadow-inner">
          {icon}
        </div>
      </div>
      {/* Decorative ambient flare */}
      <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-2xl pointer-events-none" />
    </div>
  );
}

/* ─── Glass Toast Notification ──────────────────────────── */
export function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}) {
  const styles = {
    success: "bg-emerald-950/80 border-emerald-500/40 text-emerald-200 shadow-emerald-950/60",
    error: "bg-rose-950/80 border-rose-500/40 text-rose-200 shadow-rose-950/60",
    info: "bg-primary-950/80 border-primary-500/40 text-primary-200 shadow-primary-950/60",
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
    error: <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-primary-400 shrink-0" />,
  };

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-xl animate-fadeIn ${styles[type]}`}
    >
      {icons[type]}
      <span className="text-sm font-medium pr-2">{message}</span>
      <button
        onClick={onClose}
        className="rounded-lg p-1 hover:bg-white/10 transition-colors text-white/70 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Glass Modal ───────────────────────────────────────── */
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
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto rounded-3xl glass-modal shadow-2xl animate-fadeIn custom-scroll`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-surface-900/90 backdrop-blur-xl px-6 py-4 rounded-t-3xl">
          <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-surface-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ─── Glass Drawer (Slide-over panel) ────────────────── */
export function Drawer({
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
  size?: "sm" | "md" | "lg";
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeClasses[size]} overflow-y-auto bg-surface-950/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl animate-slideInRight custom-scroll`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-surface-950/85 backdrop-blur-xl px-6 py-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-surface-400 hover:bg-white/10 hover:text-white transition-all"
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
    URGENT: "⚡",
    HIGH: "🔥",
    NORMAL: "✨",
    LOW: "📌",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${cls}`}
    >
      <span>{emoji[priority] || "✨"}</span>
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
    NOT_APPLIED: "Pending Action",
    APPLIED: "Applied",
    FACING_TROUBLE: "Facing Trouble",
    NOT_ELIGIBLE: "Not Eligible",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${
        map[status] || "status-not-applied"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

/* ─── Empty State ──────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-3xl bg-surface-800/40 border border-white/5 p-5 text-primary-400 shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-surface-200">{title}</h3>
      <p className="mt-1 text-sm text-surface-400 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
