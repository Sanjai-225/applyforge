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

  const dashboard: StudentDashboard = {
    profile: profile as unknown as StudentDashboard["profile"],
    kpis,
    applications: apps as StudentDashboard["applications"],
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
      cgpa: s.cgpa,
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

  const dashboard: AdminDashboard = {
    jobs: (jobs || []) as AdminDashboard["jobs"],
    students,
    whatsapp_groups: (whatsapp_groups || []) as AdminDashboard["whatsapp_groups"],
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
