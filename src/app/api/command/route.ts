import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { ok, err } from "@/lib/http";
import { CommandSchema } from "@/lib/validation";
import { unauthorized, forbidden, badRequest } from "@/lib/errors";

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

        const { error } = await admin
          .from("profiles")
          .update(upd)
          .eq("id", user.id);

        if (error) throw badRequest(error.message);
        return ok({ updated: true });
      }

      // ─── Admin Commands ────────────────────────────
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
        if (command.deadline !== undefined) upd.deadline = command.deadline;
        if (command.isActive !== undefined) upd.is_active = command.isActive;

        const { error } = await admin
          .from("jobs")
          .update(upd)
          .eq("id", command.jobId);

        if (error) throw badRequest(error.message);
        return ok({ updated: true });
      }

      case "TOGGLE_JOB_ACTIVE": {
        if (profile.role !== "admin") throw forbidden();
        const { data: existingJob } = await admin
          .from("jobs")
          .select("is_active")
          .eq("id", command.jobId)
          .single();

        if (!existingJob) throw badRequest("Job not found");

        const { error } = await admin
          .from("jobs")
          .update({
            is_active: !existingJob.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", command.jobId);

        if (error) throw badRequest(error.message);
        return ok({ is_active: !existingJob.is_active });
      }

      case "DELETE_JOB": {
        if (profile.role !== "admin") throw forbidden();
        const { error } = await admin
          .from("jobs")
          .delete()
          .eq("id", command.jobId);

        if (error) throw badRequest(error.message);
        return ok({ deleted: true });
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

      case "SEND_REMINDER": {
        if (profile.role !== "admin") throw forbidden();
        let targetStudents: string[] = [];
        
        if (command.studentIds && command.studentIds.length > 0) {
          targetStudents = command.studentIds;
        } else {
          // Send to all students (optionally filtered by department)
          let query = admin.from("profiles").select("id").eq("role", "student").eq("is_active", true);
          if (command.department && command.department !== "ALL") {
            query = query.eq("department", command.department);
          }
          const { data: students } = await query;
          targetStudents = (students || []).map((s: { id: string }) => s.id);
        }

        // Insert notifications for each student
        const notifications = targetStudents.map((sid: string) => ({
          student_id: sid,
          title: command.title,
          message: command.message,
          type: "REMINDER" as const,
        }));

        if (notifications.length > 0) {
          const { error } = await admin.from("student_notifications").insert(notifications);
          if (error) throw badRequest(error.message);
        }

        // Audit log
        await admin.from("audit_logs").insert({
          actor_id: user.id,
          actor_name: profile.full_name,
          action: "REMINDER_SENT",
          entity_type: "notification",
          entity_id: null,
          metadata: { count: targetStudents.length, title: command.title },
        });

        return ok({ sent: targetStudents.length });
      }

      case "SEND_CHAT_MESSAGE": {
        const targetStudentId = profile.role === "student" ? user.id : (command.studentId || user.id);
        if (!targetStudentId) throw badRequest("Target student ID is required");
        const msgData = {
          student_id: targetStudentId,
          sender_id: user.id,
          sender_role: profile.role,
          message: command.message,
        };
        const { error } = await admin.from("help_messages").insert(msgData);
        if (error) throw badRequest(error.message);
        return ok({ sent: true });
      }

      case "RESOLVE_HELP_THREAD": {
        if (profile.role !== "admin") throw forbidden();
        const { error } = await admin
          .from("help_messages")
          .update({ is_resolved: true })
          .eq("student_id", command.studentId);
        if (error) throw badRequest(error.message);
        return ok({ resolved: true });
      }

      case "MARK_NOTIFICATION_READ": {
        const { error } = await admin
          .from("student_notifications")
          .update({ is_read: true })
          .eq("id", command.notificationId)
          .eq("student_id", user.id);
        if (error) throw badRequest(error.message);
        return ok({ marked: true });
      }

      default:
        throw badRequest("Unknown command type");
    }
  } catch (error) {
    return err(error);
  }
}
