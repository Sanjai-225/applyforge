import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { ok, err } from "@/lib/http";
import { unauthorized, badRequest } from "@/lib/errors";
import type {
  StudentDashboard,
  AdminDashboard,
  StudentRow,
  JobKPI,
  StudentNotification,
  HelpMessage,
  HelpThread,
  AuditLog,
} from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw unauthorized();

    const admin = createAdminSupabase();
    const scope = request.nextUrl.searchParams.get("scope");
    const jobId = request.nextUrl.searchParams.get("jobId");
    const studentId = request.nextUrl.searchParams.get("studentId");

    // Get profile
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) throw unauthorized("Profile not found");

    if (scope === "student" || profile.role === "student") {
      return handleStudentSnapshot(admin, profile);
    }

    if (scope === "admin" || profile.role === "admin") {
      return handleAdminSnapshot(admin, profile, jobId, studentId);
    }

    throw badRequest("Invalid scope");
  } catch (error) {
    return err(error);
  }
}

async function handleStudentSnapshot(
  admin: ReturnType<typeof createAdminSupabase>,
  profile: { id: string; [key: string]: unknown }
): Promise<ReturnType<typeof ok>> {
  // Get all applications with joined job data
  const { data: applications } = await admin
    .from("job_applications")
    .select("*, job:jobs(*)")
    .eq("student_id", profile.id)
    .order("updated_at", { ascending: false });

  const apps = applications || [];

  const kpis = {
    total_jobs: apps.length,
    applied: apps.filter((a) => a.status === "APPLIED").length,
    not_applied: apps.filter((a) => a.status === "NOT_APPLIED").length,
    facing_trouble: apps.filter((a) => a.status === "FACING_TROUBLE").length,
    not_eligible: apps.filter((a) => a.status === "NOT_ELIGIBLE").length,
    completion_pct:
      apps.length > 0
        ? Math.round(
            (apps.filter((a) => a.status === "APPLIED").length / apps.length) * 100
          )
        : 0,
  };

  // Get notifications
  let notifications: StudentNotification[] = [];
  try {
    const { data: notifs } = await admin
      .from("student_notifications")
      .select("*")
      .eq("student_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (notifs) notifications = notifs;
  } catch {
    // fallback
  }

  // Get help chat messages
  let help_messages: HelpMessage[] = [];
  try {
    const { data: msgs } = await admin
      .from("help_messages")
      .select("*")
      .eq("student_id", profile.id)
      .order("created_at", { ascending: true })
      .limit(100);
    if (msgs) help_messages = msgs;
  } catch {
    // fallback
  }

  const dashboard: StudentDashboard = {
    profile: profile as unknown as StudentDashboard["profile"],
    kpis,
    applications: apps as StudentDashboard["applications"],
    notifications,
    help_messages,
  };

  return ok(dashboard);
}

async function handleAdminSnapshot(
  admin: ReturnType<typeof createAdminSupabase>,
  profile: { id: string; role: string; [key: string]: unknown },
  jobId: string | null,
  studentId: string | null
): Promise<ReturnType<typeof ok>> {
  if (profile.role !== "admin") throw unauthorized("Not an admin");

  // Fetch all jobs
  const { data: jobs } = await admin
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch all students with aggregated application data
  const { data: allStudents } = await admin
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .eq("is_active", true)
    .order("roll_number", { ascending: true });

  // Get all job_applications for aggregation
  const { data: allApps } = await admin
    .from("job_applications")
    .select("student_id, status");

  // Aggregate per-student
  const studentMap = new Map<string, { total: number; applied: number; not_applied: number; facing_trouble: number }>();
  for (const app of allApps || []) {
    const existing = studentMap.get(app.student_id) || {
      total: 0, applied: 0, not_applied: 0, facing_trouble: 0,
    };
    existing.total++;
    if (app.status === "APPLIED") existing.applied++;
    else if (app.status === "NOT_APPLIED") existing.not_applied++;
    else if (app.status === "FACING_TROUBLE") existing.facing_trouble++;
    studentMap.set(app.student_id, existing);
  }

  const students: StudentRow[] = (allStudents || []).map((s) => {
    const stats = studentMap.get(s.id) || { total: 0, applied: 0, not_applied: 0, facing_trouble: 0 };
    return {
      id: s.id,
      full_name: s.full_name,
      email: s.email,
      phone: s.phone,
      roll_number: s.roll_number,
      department: s.department,
      total_jobs: stats.total,
      applied: stats.applied,
      not_applied: stats.not_applied,
      facing_trouble: stats.facing_trouble,
      completion_pct: stats.total > 0 ? Math.round((stats.applied / stats.total) * 100) : 0,
    };
  });

  // Fetch WhatsApp groups
  const { data: whatsapp_groups } = await admin
    .from("whatsapp_groups")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  // Fetch Help Threads
  const helpThreadsMap = new Map<string, HelpThread>();
  try {
    const { data: allMessages } = await admin
      .from("help_messages")
      .select("*, student:profiles!student_id(id, full_name, email, department, phone)")
      .order("created_at", { ascending: true });

    for (const msg of allMessages || []) {
      const s = msg.student as Record<string, unknown> | null;
      const sId = msg.student_id;
      if (!helpThreadsMap.has(sId)) {
        helpThreadsMap.set(sId, {
          student_id: sId,
          student_name: String(s?.full_name || "Student"),
          student_email: String(s?.email || ""),
          student_dept: String(s?.department || ""),
          student_phone: String(s?.phone || ""),
          unread_count: 0,
          latest_message: msg.message,
          latest_timestamp: msg.created_at,
          is_resolved: msg.is_resolved || false,
          messages: [],
        });
      }
      const thread = helpThreadsMap.get(sId)!;
      thread.messages.push(msg as HelpMessage);
      thread.latest_message = msg.message;
      thread.latest_timestamp = msg.created_at;
      thread.is_resolved = msg.is_resolved;
      if (msg.sender_role === "student" && !msg.is_resolved) {
        thread.unread_count++;
      }
    }
  } catch {
    // fallback
  }

  // Fetch Audit Logs
  let audit_logs: AuditLog[] = [];
  try {
    const { data: logs } = await admin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (logs) audit_logs = logs;
  } catch {
    // fallback
  }

  // Fetch Notifications history
  let notifications: StudentNotification[] = [];
  try {
    const { data: notifs } = await admin
      .from("student_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);
    if (notifs) notifications = notifs;
  } catch {
    // fallback
  }

  const dashboard: AdminDashboard = {
    jobs: (jobs || []) as AdminDashboard["jobs"],
    students,
    whatsapp_groups: (whatsapp_groups || []) as AdminDashboard["whatsapp_groups"],
    help_threads: Array.from(helpThreadsMap.values()).sort(
      (a, b) => new Date(b.latest_timestamp).getTime() - new Date(a.latest_timestamp).getTime()
    ),
    audit_logs,
    notifications,
  };

  // Job detail
  if (jobId) {
    const { data: job } = await admin
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (job) {
      const { data: jobApps } = await admin
        .from("job_applications")
        .select("*, student:profiles(*)")
        .eq("job_id", jobId)
        .order("status", { ascending: true });

      const apps = jobApps || [];
      const kpi: JobKPI = {
        total_assigned: apps.length,
        applied: apps.filter((a) => a.status === "APPLIED").length,
        not_applied: apps.filter((a) => a.status === "NOT_APPLIED").length,
        facing_trouble: apps.filter((a) => a.status === "FACING_TROUBLE").length,
        not_eligible: apps.filter((a) => a.status === "NOT_ELIGIBLE").length,
        applied_pct:
          apps.length > 0
            ? Math.round(
                (apps.filter((a) => a.status === "APPLIED").length / apps.length) * 100
              )
            : 0,
      };

      dashboard.job_detail = {
        job: job as AdminDashboard["job_detail"] extends undefined ? never : NonNullable<AdminDashboard["job_detail"]>["job"],
        kpi,
        applications: apps as NonNullable<AdminDashboard["job_detail"]>["applications"],
      };
    }
  }

  // Student detail
  if (studentId) {
    const { data: student } = await admin
      .from("profiles")
      .select("*")
      .eq("id", studentId)
      .single();

    if (student) {
      const { data: studentApps } = await admin
        .from("job_applications")
        .select("*, job:jobs(*)")
        .eq("student_id", studentId)
        .order("updated_at", { ascending: false });

      dashboard.student_detail = {
        student: student as NonNullable<AdminDashboard["student_detail"]>["student"],
        applications: (studentApps || []) as NonNullable<AdminDashboard["student_detail"]>["applications"],
      };
    }
  }

  return ok(dashboard);
}
