/* ──────────────────────────────────────────────────────────
 *  ApplyForge 2.0 — Domain Types
 * ────────────────────────────────────────────────────────── */

// ─── Enums / Literals ───────────────────────────────────
export const DEPARTMENTS = ["CSE", "IT", "AI&DS", "ECE", "EEE", "MECH", "CIVIL"] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const PRIORITIES = ["URGENT", "HIGH", "NORMAL", "LOW"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const APP_STATUSES = ["NOT_APPLIED", "APPLIED", "FACING_TROUBLE", "NOT_ELIGIBLE"] as const;
export type AppStatus = (typeof APP_STATUSES)[number];

export const ISSUE_CATEGORIES = [
  "LINK_EXPIRED_OR_BROKEN",
  "PORTAL_OR_OTP_ERROR",
  "ELIGIBILITY_BLOCKED",
  "OTHER_ISSUE",
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ROLES = ["student", "admin"] as const;
export type UserRole = (typeof ROLES)[number];

// ─── Database Row Types ─────────────────────────────────
export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string;
  roll_number: string | null;
  department: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppGroup {
  id: string;
  name: string;
  department_tag: string;
  invite_link: string | null;
  group_jid: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  company_name: string;
  application_url: string;
  priority: Priority;
  package_ctc: string | null;
  location: string | null;
  description: string | null;
  eligible_departments: string[];
  deadline: string | null;
  target_group_ids: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  student_id: string;
  status: AppStatus;
  issue_category: IssueCategory | null;
  issue_note: string | null;
  application_ref: string | null;
  link_clicked_at: string | null;
  applied_at: string | null;
  updated_at: string;
}

export interface StudentNotification {
  id: string;
  student_id: string;
  title: string;
  message: string;
  type: "REMINDER" | "JOB_ALERT" | "SUPPORT" | "ANNOUNCEMENT";
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface HelpMessage {
  id: string;
  student_id: string;
  job_id: string | null;
  sender_id: string;
  sender_role: UserRole;
  sender_name?: string;
  message: string;
  attachment_url: string | null;
  is_resolved: boolean;
  created_at: string;
}

export interface HelpThread {
  student_id: string;
  student_name: string;
  student_email: string;
  student_dept: string;
  student_phone: string;
  unread_count: number;
  latest_message: string;
  latest_timestamp: string;
  is_resolved: boolean;
  messages: HelpMessage[];
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Snapshot Response Types ────────────────────────────
export interface StudentDashboard {
  profile: Profile;
  kpis: {
    total_jobs: number;
    applied: number;
    not_applied: number;
    facing_trouble: number;
    not_eligible: number;
    completion_pct: number;
  };
  applications: (JobApplication & { job: Job })[];
  notifications: StudentNotification[];
  help_messages: HelpMessage[];
}

export interface JobKPI {
  total_assigned: number;
  applied: number;
  not_applied: number;
  facing_trouble: number;
  not_eligible: number;
  applied_pct: number;
}

export interface StudentRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  roll_number: string | null;
  department: string;
  total_jobs: number;
  applied: number;
  not_applied: number;
  facing_trouble: number;
  completion_pct: number;
}

export interface AdminDashboard {
  jobs: Job[];
  students: StudentRow[];
  whatsapp_groups: WhatsAppGroup[];
  notifications?: StudentNotification[];
  help_threads?: HelpThread[];
  audit_logs?: AuditLog[];
  job_detail?: {
    job: Job;
    kpi: JobKPI;
    applications: (JobApplication & { student: Profile })[];
  };
  student_detail?: {
    student: Profile;
    applications: (JobApplication & { job: Job })[];
  };
}

// ─── Command Types ──────────────────────────────────────
export type CommandType =
  | "RECORD_JOB_CLICK"
  | "UPDATE_APPLICATION_STATUS"
  | "UPDATE_STUDENT_PROFILE"
  | "CREATE_JOB"
  | "UPDATE_JOB"
  | "TOGGLE_JOB_ACTIVE"
  | "DELETE_JOB"
  | "SAVE_WHATSAPP_GROUP"
  | "DELETE_WHATSAPP_GROUP"
  | "SEND_REMINDER"
  | "SEND_CHAT_MESSAGE"
  | "RESOLVE_HELP_THREAD"
  | "MARK_NOTIFICATION_READ";

// ─── API Response ───────────────────────────────────────
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
