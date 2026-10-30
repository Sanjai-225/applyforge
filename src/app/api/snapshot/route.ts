import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { ok, err } from "@/lib/http";
import { unauthorized, badRequest } from "@/lib/errors";
import type { StudentDashboard, AdminDashboard, StudentRow, JobKPI } from "@/lib/types";

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

    if (scope === "admin" || (!scope && profile.role === "admin")) {
      return handleAdminSnapshot(admin, profile, jobId, studentId);
    }

    if (scope === "student" || (!scope && profile.role === "student")) {
      return handleStudentSnapshot(admin, profile);
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

  // Fetch notifications
    const { data: notifications } = await admin
      .from("student_notifications")
      .select("*")
      .eq("student_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch help messages
    const { data: helpMessages } = await admin
      .from("help_messages")
      .select("*")
      .eq("student_id", profile.id)
      .order("created_at", { ascending: true });

  const dashboard: StudentDashboard = {
    profile: profile as unknown as StudentDashboard["profile"],
    kpis,
    applications: apps as StudentDashboard["applications"],
    notifications: (notifications || []) as StudentDashboard["notifications"],
    help_messages: (helpMessages || []) as StudentDashboard["help_messages"],
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

  // Fetch help threads (aggregate help_messages by student)
    const { data: allHelpMessages } = await admin
      .from("help_messages")
      .select("*")
      .order("created_at", { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const threadMap = new Map<string, { messages: any[]; student_name: string; student_email: string; student_department: string }>();
    for (const msg of allHelpMessages || []) {
      if (!threadMap.has(msg.student_id)) {
        const student = (allStudents || []).find((s: { id: string }) => s.id === msg.student_id);
        threadMap.set(msg.student_id, {
          messages: [],
          student_name: student?.full_name || "Unknown",
          student_email: student?.email || "",
          student_department: student?.department || "",
        });
      }
      threadMap.get(msg.student_id)!.messages.push(msg);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const help_threads: AdminDashboard["help_threads"] = Array.from(threadMap.entries()).map(
      ([studentId, threadData]) => ({
        student_id: studentId,
        student_name: threadData.student_name,
        student_email: threadData.student_email,
        student_department: threadData.student_department,
        last_message: threadData.messages[0]?.message || "",
        last_message_at: threadData.messages[0]?.created_at || "",
        unread_count: threadData.messages.filter((m: any) => m.sender_role === "student" && !m.is_resolved).length,
        is_resolved: threadData.messages.every((m: any) => m.is_resolved),
        messages: [...threadData.messages].reverse(),
      })
    );

    // Fetch audit logs
    const { data: auditLogs } = await admin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    // Fetch sent notifications
    const { data: sentNotifications } = await admin
      .from("student_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

  const dashboard: AdminDashboard = {
    jobs: (jobs || []) as AdminDashboard["jobs"],
    students,
    whatsapp_groups: (whatsapp_groups || []) as AdminDashboard["whatsapp_groups"],
    notifications_sent: (sentNotifications || []) as AdminDashboard["notifications_sent"],
    help_threads,
    audit_logs: (auditLogs || []) as AdminDashboard["audit_logs"],
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
