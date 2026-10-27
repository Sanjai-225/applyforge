import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { ok, err } from "@/lib/http";
import { CommandSchema } from "@/lib/validation";
import { unauthorized, forbidden, badRequest } from "@/lib/errors";
import { sendEmailNotification } from "@/lib/notifications";

async function logAudit(
  admin: ReturnType<typeof createAdminSupabase>,
  actorId: string,
  actorName: string,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {}
) {
  try {
    await admin.from("audit_logs").insert({
      actor_id: actorId,
      actor_name: actorName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  } catch {
    // Graceful fallback if table not yet migrated
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw unauthorized();

    const admin = createAdminSupabase();

    // Get user profile
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) throw unauthorized("Profile not found");

    const body = await request.json();
    const command = CommandSchema.parse(body);

    switch (command.type) {
      // ─── Student Commands ──────────────────────────
      case "RECORD_JOB_CLICK": {
        if (profile.role !== "student") throw forbidden();
        const { error } = await admin
          .from("job_applications")
          .update({ link_clicked_at: new Date().toISOString() })
          .eq("job_id", command.jobId)
          .eq("student_id", user.id)
          .is("link_clicked_at", null);

        if (error) throw badRequest(error.message);
        return ok({ recorded: true });
      }

      case "UPDATE_APPLICATION_STATUS": {
        if (profile.role !== "student") throw forbidden();
        const updateData: Record<string, unknown> = {
          status: command.status,
          updated_at: new Date().toISOString(),
        };

        if (command.status === "APPLIED") {
          updateData.applied_at = new Date().toISOString();
          updateData.application_ref = command.applicationRef || null;
          updateData.issue_category = null;
          updateData.issue_note = null;
        } else if (command.status === "FACING_TROUBLE") {
          updateData.issue_category = command.issueCategory || "OTHER_ISSUE";
          updateData.issue_note = command.issueNote || null;
          updateData.applied_at = null;
          updateData.application_ref = null;
        } else if (command.status === "NOT_ELIGIBLE") {
          updateData.issue_note = command.issueNote || null;
          updateData.issue_category = null;
          updateData.applied_at = null;
          updateData.application_ref = null;
        } else {
          // NOT_APPLIED — reset all
          updateData.applied_at = null;
          updateData.application_ref = null;
          updateData.issue_category = null;
          updateData.issue_note = null;
        }

        const { error } = await admin
          .from("job_applications")
          .update(updateData)
          .eq("job_id", command.jobId)
          .eq("student_id", user.id);

        if (error) throw badRequest(error.message);
        return ok({ updated: true });
      }

      case "UPDATE_STUDENT_PROFILE": {
        if (profile.role !== "student") throw forbidden();
        const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (command.phone) upd.phone = command.phone;
        if (command.department) upd.department = command.department;

        const { error } = await admin
          .from("profiles")
          .update(upd)
          .eq("id", user.id);

        if (error) throw badRequest(error.message);
        return ok({ updated: true });
      }

      case "MARK_NOTIFICATION_READ": {
        if (profile.role !== "student") throw forbidden();
        try {
          await admin
            .from("student_notifications")
            .update({ is_read: true })
            .eq("id", command.notificationId)
            .eq("student_id", user.id);
        } catch {
          // Graceful fallback
        }
        return ok({ read: true });
      }

      // ─── Help & Chat Commands (Student & Admin) ───
      case "SEND_CHAT_MESSAGE": {
        const targetStudentId =
          profile.role === "admin" ? command.studentId : user.id;

        if (!targetStudentId) {
          throw badRequest("studentId is required for admin messages");
        }

        try {
          const { data: msg, error: msgErr } = await admin
            .from("help_messages")
            .insert({
              student_id: targetStudentId,
              sender_id: user.id,
              sender_role: profile.role,
              job_id: command.jobId || null,
              message: command.message,
              attachment_url: command.attachmentUrl || null,
            })
            .select()
            .single();

          if (msgErr) throw badRequest(msgErr.message);

          // If admin sent message, automatically notify student
          if (profile.role === "admin") {
            try {
              await admin.from("student_notifications").insert({
                student_id: targetStudentId,
                title: "New message from Placement Officer",
                message: command.message.slice(0, 100),
                type: "SUPPORT",
                link_url: "/dashboard",
              });
            } catch {
              // fallback
            }
          }

          return ok({ message: msg });
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Failed to send message";
          throw badRequest(message);
        }
      }

      case "RESOLVE_HELP_THREAD": {
        if (profile.role !== "admin") throw forbidden();
        try {
          const { error } = await admin
            .from("help_messages")
            .update({ is_resolved: command.isResolved })
            .eq("student_id", command.studentId);

          if (error) throw badRequest(error.message);

          await logAudit(
            admin,
            user.id,
            profile.full_name,
            command.isResolved ? "THREAD_RESOLVED" : "THREAD_REOPENED",
            "HELP_THREAD",
            command.studentId
          );

          return ok({ resolved: command.isResolved });
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Failed to update thread";
          throw badRequest(message);
        }
      }

      // ─── Admin Job Commands ────────────────────────
      case "CREATE_JOB": {
        if (profile.role !== "admin") throw forbidden();
        const { data: job, error } = await admin
          .from("jobs")
          .insert({
            title: command.title,
            company_name: command.companyName,
            application_url: command.applicationUrl,
            priority: command.priority,
            package_ctc: command.packageCtc || null,
            location: command.location || null,
            description: command.description || null,
            eligible_departments: command.eligibleDepartments,
            deadline: command.deadline || null,
            target_group_ids: command.targetGroupIds,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw badRequest(error.message);

        await logAudit(
          admin,
          user.id,
          profile.full_name,
          "JOB_CREATED",
          "JOB",
          job.id,
          { title: job.title, company: job.company_name }
        );

        return ok({ job });
      }

      case "UPDATE_JOB": {
        if (profile.role !== "admin") throw forbidden();
        const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (command.title) upd.title = command.title;
        if (command.companyName) upd.company_name = command.companyName;
        if (command.applicationUrl) upd.application_url = command.applicationUrl;
        if (command.priority) upd.priority = command.priority;
        if (command.packageCtc !== undefined) upd.package_ctc = command.packageCtc;
        if (command.location !== undefined) upd.location = command.location;
        if (command.description !== undefined) upd.description = command.description;
        if (command.eligibleDepartments) upd.eligible_departments = command.eligibleDepartments;
        if (command.deadline !== undefined) upd.deadline = command.deadline;
        if (command.isActive !== undefined) upd.is_active = command.isActive;

        const { error } = await admin
          .from("jobs")
          .update(upd)
          .eq("id", command.jobId);

        if (error) throw badRequest(error.message);

        await logAudit(
          admin,
          user.id,
          profile.full_name,
          "JOB_UPDATED",
          "JOB",
          command.jobId,
          upd
        );

        return ok({ updated: true });
      }

      case "TOGGLE_JOB_ACTIVE": {
        if (profile.role !== "admin") throw forbidden();
        const { data: existingJob } = await admin
          .from("jobs")
          .select("is_active, title, company_name")
          .eq("id", command.jobId)
          .single();

        if (!existingJob) throw badRequest("Job not found");

        const newActive = !existingJob.is_active;
        const { error } = await admin
          .from("jobs")
          .update({
            is_active: newActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", command.jobId);

        if (error) throw badRequest(error.message);

        await logAudit(
          admin,
          user.id,
          profile.full_name,
          newActive ? "JOB_ACTIVATED" : "JOB_DEACTIVATED",
          "JOB",
          command.jobId
        );

        return ok({ is_active: newActive });
      }

      case "DELETE_JOB": {
        if (profile.role !== "admin") throw forbidden();
        // Fetch job info for audit
        const { data: job } = await admin
          .from("jobs")
          .select("title, company_name")
          .eq("id", command.jobId)
          .single();

        const { error } = await admin
          .from("jobs")
          .delete()
          .eq("id", command.jobId);

        if (error) throw badRequest(error.message);

        await logAudit(
          admin,
          user.id,
          profile.full_name,
          "JOB_DELETED",
          "JOB",
          command.jobId,
          { title: job?.title, company: job?.company_name }
        );

        return ok({ deleted: true });
      }

      case "SEND_REMINDER": {
        if (profile.role !== "admin") throw forbidden();

        // Find target students
        let studentQuery = admin
          .from("profiles")
          .select("id, email, full_name, department")
          .eq("role", "student")
          .eq("is_active", true);

        if (command.studentId) {
          studentQuery = studentQuery.eq("id", command.studentId);
        } else if (!command.departments.includes("ALL")) {
          studentQuery = studentQuery.in("department", command.departments);
        }

        const { data: students } = await studentQuery;
        const targetStudents = students || [];

        // If jobId provided, filter to only students who have NOT_APPLIED
        let finalStudents = targetStudents;
        if (command.jobId) {
          const { data: pendingApps } = await admin
            .from("job_applications")
            .select("student_id")
            .eq("job_id", command.jobId)
            .eq("status", "NOT_APPLIED");

          const pendingIds = new Set((pendingApps || []).map((p) => p.student_id));
          finalStudents = targetStudents.filter((s) => pendingIds.has(s.id));
        }

        // Insert notifications
        const notifRows = finalStudents.map((s) => ({
          student_id: s.id,
          title: command.title,
          message: command.message,
          type: "REMINDER",
          link_url: command.jobId ? `/dashboard` : null,
        }));

        if (notifRows.length > 0) {
          try {
            await admin.from("student_notifications").insert(notifRows);
          } catch {
            // fallback
          }
        }

        // Dispatch email if requested
        let emailSentCount = 0;
        if (command.sendEmail) {
          for (const s of finalStudents) {
            try {
              const res = await sendEmailNotification({
                to: s.email,
                subject: `📢 ApplyForge: ${command.title}`,
                html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #334155;border-radius:12px;background:#0f172a;color:#f8fafc;">
                  <h2 style="color:#818cf8;margin-top:0;">${command.title}</h2>
                  <p style="font-size:15px;line-height:1.6;color:#cbd5e1;">${command.message}</p>
                  <a href="${process.env.APP_ORIGIN || 'https://applyforge-live.vercel.app'}/dashboard" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px;">View Dashboard & Apply</a>
                </div>`,
              });
              if (res.sent) emailSentCount++;
            } catch {
              // ignore individual email failure
            }
          }
        }

        await logAudit(
          admin,
          user.id,
          profile.full_name,
          "REMINDER_BROADCAST",
          "NOTIFICATION",
          command.jobId || null,
          {
            targetCount: finalStudents.length,
            title: command.title,
            emailsSent: emailSentCount,
          }
        );

        return ok({
          notifiedCount: finalStudents.length,
          emailSentCount,
        });
      }

      case "SAVE_WHATSAPP_GROUP": {
        if (profile.role !== "admin") throw forbidden();
        if (command.id) {
          const { error } = await admin
            .from("whatsapp_groups")
            .update({
              name: command.name,
              department_tag: command.departmentTag,
              invite_link: command.inviteLink || null,
              group_jid: command.groupJid || null,
            })
            .eq("id", command.id);
          if (error) throw badRequest(error.message);
          return ok({ updated: true });
        } else {
          const { data: group, error } = await admin
            .from("whatsapp_groups")
            .insert({
              name: command.name,
              department_tag: command.departmentTag,
              invite_link: command.inviteLink || null,
              group_jid: command.groupJid || null,
            })
            .select()
            .single();
          if (error) throw badRequest(error.message);
          return ok({ group });
        }
      }

      case "DELETE_WHATSAPP_GROUP": {
        if (profile.role !== "admin") throw forbidden();
        const { error } = await admin
          .from("whatsapp_groups")
          .delete()
          .eq("id", command.groupId);
        if (error) throw badRequest(error.message);
        return ok({ deleted: true });
      }

      default:
        throw badRequest("Unknown command type");
    }
  } catch (error) {
    return err(error);
  }
}
