import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { err } from "@/lib/http";
import { unauthorized, forbidden, badRequest } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw unauthorized();

    const admin = createAdminSupabase();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") throw forbidden();

    const type = request.nextUrl.searchParams.get("type");
    const jobId = request.nextUrl.searchParams.get("jobId");
    const status = request.nextUrl.searchParams.get("status");

    if (type === "job" && jobId) {
      return exportJobApplications(admin, jobId, status);
    }

    if (type === "students") {
      return exportStudentCompliance(admin);
    }

    throw badRequest("Invalid export type. Use ?type=job&jobId=... or ?type=students");
  } catch (error) {
    return err(error);
  }
}

async function exportJobApplications(
  admin: ReturnType<typeof createAdminSupabase>,
  jobId: string,
  statusFilter: string | null
) {
  const { data: job } = await admin
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!job) throw badRequest("Job not found");

  let query = admin
    .from("job_applications")
    .select("*, student:profiles(*)")
    .eq("job_id", jobId);

  if (statusFilter && statusFilter !== "ALL") {
    query = query.eq("status", statusFilter);
  }

  const { data: apps } = await query.order("status", { ascending: true });

  const rows = [
    [
      "Roll Number",
      "Student Name",
      "Email",
      "Phone",
      "Department",
      "CGPA",
      "Status",
      "Link Clicked At",
      "Applied At",
      "Application Ref",
      "Issue Category",
      "Issue Note",
    ].join(","),
  ];

  for (const app of apps || []) {
    const s = app.student as Record<string, unknown>;
    if (!s) continue;
    rows.push(
      [
        csvEscape(String(s.roll_number || "")),
        csvEscape(String(s.full_name || "")),
        csvEscape(String(s.email || "")),
        csvEscape(String(s.phone || "")),
        csvEscape(String(s.department || "")),
        String(s.cgpa || ""),
        app.status,
        app.link_clicked_at || "",
        app.applied_at || "",
        csvEscape(app.application_ref || ""),
        app.issue_category || "",
        csvEscape(app.issue_note || ""),
      ].join(",")
    );
  }

  const csv = rows.join("\n");
  const filename = `${job.company_name}_${job.title}_applications.csv`
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function exportStudentCompliance(
  admin: ReturnType<typeof createAdminSupabase>
) {
  const { data: students } = await admin
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .eq("is_active", true)
    .order("roll_number", { ascending: true });

  const { data: allApps } = await admin
    .from("job_applications")
    .select("student_id, status");

  // Aggregate
  const statsMap = new Map<string, { total: number; applied: number; not_applied: number; trouble: number; not_eligible: number }>();
  for (const app of allApps || []) {
    const existing = statsMap.get(app.student_id) || {
      total: 0, applied: 0, not_applied: 0, trouble: 0, not_eligible: 0,
    };
    existing.total++;
    if (app.status === "APPLIED") existing.applied++;
    else if (app.status === "NOT_APPLIED") existing.not_applied++;
    else if (app.status === "FACING_TROUBLE") existing.trouble++;
    else if (app.status === "NOT_ELIGIBLE") existing.not_eligible++;
    statsMap.set(app.student_id, existing);
  }

  const rows = [
    [
      "Roll Number",
      "Student Name",
      "Department",
      "CGPA",
      "Email",
      "Phone",
      "Total Jobs Sent",
      "Applied",
      "Not Applied Yet",
      "Facing Trouble",
      "Not Eligible",
      "Completion %",
    ].join(","),
  ];

  for (const s of students || []) {
    const stats = statsMap.get(s.id) || { total: 0, applied: 0, not_applied: 0, trouble: 0, not_eligible: 0 };
    const pct = stats.total > 0 ? Math.round((stats.applied / stats.total) * 100) : 0;
    rows.push(
      [
        csvEscape(s.roll_number || ""),
        csvEscape(s.full_name),
        csvEscape(s.department || ""),
        String(s.cgpa || ""),
        csvEscape(s.email),
        csvEscape(s.phone),
        stats.total,
        stats.applied,
        stats.not_applied,
        stats.trouble,
        stats.not_eligible,
        `${pct}%`,
      ].join(",")
    );
  }

  const csv = rows.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="student_compliance_report.csv"`,
    },
  });
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
