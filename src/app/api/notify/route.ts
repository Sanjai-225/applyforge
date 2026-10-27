import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { ok, err } from "@/lib/http";
import { NotifySchema } from "@/lib/validation";
import { unauthorized, forbidden, badRequest } from "@/lib/errors";
import {
  sendJobEmail,
  sendReminderEmail,
  generateWhatsAppBroadcast,
  generateDefaulterList,
  waShareUrl,
  pushToWhatsAppWebhook,
} from "@/lib/notifications";
import type { Profile, Job, WhatsAppGroup } from "@/lib/types";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const input = NotifySchema.parse(body);

    // Get job
    const { data: job } = await admin
      .from("jobs")
      .select("*")
      .eq("id", input.jobId)
      .single();
    if (!job) throw badRequest("Job not found");

    const typedJob = job as Job;

    if (input.action === "JOB_BROADCAST") {
      // Get eligible students
      const { data: eligibleStudents } = await admin
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .eq("is_active", true);

      const students = (eligibleStudents || []).filter((s: Profile) => {
        const deptMatch =
          typedJob.eligible_departments.includes("ALL") ||
          typedJob.eligible_departments.includes(s.department);
        const cgpaMatch = (s.cgpa || 0) >= typedJob.min_cgpa;
        return deptMatch && cgpaMatch;
      }) as Profile[];

      // Send emails
      let emailResult = { sent: 0, total: 0 };
      if (input.sendEmail) {
        emailResult = await sendJobEmail(typedJob, students);
      }

      // Generate WhatsApp message
      const waMessage = generateWhatsAppBroadcast(typedJob);

      // Get target groups
      const { data: groups } = await admin
        .from("whatsapp_groups")
        .select("*")
        .eq("is_active", true);

      const targetGroups = (groups || []).filter((g: WhatsAppGroup) =>
        typedJob.target_group_ids.includes(g.id)
      ) as WhatsAppGroup[];

      // Optional webhook push
      let webhookResults: { groupName: string; success: boolean }[] = [];
      if (input.webhookPush) {
        for (const group of targetGroups) {
          if (group.group_jid) {
            const success = await pushToWhatsAppWebhook(group.group_jid, waMessage);
            webhookResults.push({ groupName: group.name, success });
          }
        }
      }

      // Generate share URLs
      const shareLinks = targetGroups.map((g) => ({
        groupName: g.name,
        shareUrl: waShareUrl(waMessage),
        inviteLink: g.invite_link,
      }));

      return ok({
        emailResult,
        waMessage,
        shareLinks,
        webhookResults,
      });
    }

    if (input.action === "REMIND_UNAPPLIED") {
      // Get unapplied students for this job
      const { data: unappliedApps } = await admin
        .from("job_applications")
        .select("*, student:profiles(*)")
        .eq("job_id", input.jobId)
        .eq("status", "NOT_APPLIED");

      const unappliedStudents = (unappliedApps || [])
        .map((a: { student: Profile }) => a.student)
        .filter(Boolean) as Profile[];

      // Send reminder emails
      let emailResult = { sent: 0, total: 0 };
      if (input.sendEmail) {
        emailResult = await sendReminderEmail(typedJob, unappliedStudents);
      }

      // Generate defaulter list
      const defaulterList = generateDefaulterList(typedJob, unappliedStudents);

      return ok({
        emailResult,
        defaulterList,
        unappliedCount: unappliedStudents.length,
        waShareUrl: waShareUrl(defaulterList),
      });
    }

    throw badRequest("Unknown notify action");
  } catch (error) {
    return err(error);
  }
}
