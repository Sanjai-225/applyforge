import "server-only";

import nodemailer from "nodemailer";
import type { Job, Profile } from "./types";

/* ─── Email Transport ─────────────────────────────────── */
function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[Email] SMTP not configured — emails will be logged to console.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const PRIORITY_EMOJI: Record<string, string> = {
  URGENT: "🔴",
  HIGH: "🟠",
  NORMAL: "🟢",
  LOW: "⚪",
};

/* ─── Send Job Notification Email ─────────────────────── */
export async function sendJobEmail(job: Job, students: Profile[]) {
  const transport = getTransport();
  const from = process.env.SMTP_FROM || "ApplyForge <noreply@applyforge.app>";
  const origin = process.env.APP_ORIGIN || "http://localhost:3000";

  const emoji = PRIORITY_EMOJI[job.priority] || "🟢";
  const deadline = job.deadline
    ? new Date(job.deadline).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No deadline";

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">${emoji} New Placement Opportunity</h1>
      </div>
      <div style="background: #f8f9fa; padding: 24px; border: 1px solid #e9ecef;">
        <h2 style="color: #1a1a2e; margin: 0 0 8px;">${job.company_name}</h2>
        <p style="color: #555; font-size: 16px; margin: 0 0 16px;">${job.title}</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #777;">Priority</td><td style="padding: 6px 0; font-weight: 600;">${emoji} ${job.priority}</td></tr>
          ${job.package_ctc ? `<tr><td style="padding: 6px 0; color: #777;">Package</td><td style="padding: 6px 0; font-weight: 600;">${job.package_ctc}</td></tr>` : ""}
          ${job.location ? `<tr><td style="padding: 6px 0; color: #777;">Location</td><td style="padding: 6px 0;">${job.location}</td></tr>` : ""}
          <tr><td style="padding: 6px 0; color: #777;">Deadline</td><td style="padding: 6px 0; font-weight: 600; color: #e74c3c;">${deadline}</td></tr>
        </table>
        ${job.description ? `<p style="margin: 16px 0 0; color: #444; font-size: 14px;">${job.description}</p>` : ""}
        <div style="margin-top: 24px; text-align: center;">
          <a href="${job.application_url}" style="display: inline-block; background: #667eea; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 8px;">Apply Now →</a>
          <a href="${origin}/dashboard" style="display: inline-block; background: #28a745; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Update Status on ApplyForge</a>
        </div>
      </div>
      <div style="background: #1a1a2e; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">Sent via ApplyForge — College Placement Tracker</p>
      </div>
    </div>
  `;

  if (!transport) {
    console.log(`[Email] Would send to ${students.length} students for job: ${job.company_name} — ${job.title}`);
    return { sent: 0, total: students.length };
  }

  let sent = 0;
  for (const student of students) {
    try {
      await transport.sendMail({
        from,
        to: student.email,
        subject: `${emoji} ${job.company_name} — ${job.title} | Apply by ${deadline}`,
        html,
      });
      sent++;
    } catch (e) {
      console.error(`[Email] Failed to send to ${student.email}:`, e);
    }
  }

  return { sent, total: students.length };
}

/* ─── Send Reminder Email ─────────────────────────────── */
export async function sendReminderEmail(job: Job, students: Profile[]) {
  const transport = getTransport();
  const from = process.env.SMTP_FROM || "ApplyForge <noreply@applyforge.app>";
  const origin = process.env.APP_ORIGIN || "http://localhost:3000";

  const deadline = job.deadline
    ? new Date(job.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "ASAP";

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">⚠️ Reminder: Application Pending!</h1>
      </div>
      <div style="background: #fff3f3; padding: 24px; border: 1px solid #f5c6cb;">
        <p style="font-size: 16px; color: #333;">You have NOT yet applied for:</p>
        <h2 style="color: #1a1a2e;">${job.company_name} — ${job.title}</h2>
        <p style="color: #e74c3c; font-weight: 600;">Deadline: ${deadline}</p>
        <div style="margin-top: 20px; text-align: center;">
          <a href="${job.application_url}" style="display: inline-block; background: #e74c3c; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 8px;">Apply Now →</a>
          <a href="${origin}/dashboard" style="display: inline-block; background: #28a745; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Update Status</a>
        </div>
      </div>
    </div>
  `;

  if (!transport) {
    console.log(`[Email] Would remind ${students.length} students for job: ${job.company_name}`);
    return { sent: 0, total: students.length };
  }

  let sent = 0;
  for (const student of students) {
    try {
      await transport.sendMail({
        from,
        to: student.email,
        subject: `⚠️ REMINDER: Apply for ${job.company_name} — ${job.title} by ${deadline}`,
        html,
      });
      sent++;
    } catch (e) {
      console.error(`[Email] Reminder failed for ${student.email}:`, e);
    }
  }

  return { sent, total: students.length };
}

/* ─── Generate WhatsApp Broadcast Message ─────────────── */
export function generateWhatsAppBroadcast(job: Job): string {
  const emoji = PRIORITY_EMOJI[job.priority] || "🟢";
  const origin = process.env.APP_ORIGIN || "http://localhost:3000";
  const deadline = job.deadline
    ? new Date(job.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "No deadline";

  return [
    `${emoji} *NEW PLACEMENT OPPORTUNITY* ${emoji}`,
    ``,
    `🏢 *Company:* ${job.company_name}`,
    `💼 *Role:* ${job.title}`,
    `📊 *Priority:* ${job.priority}`,
    job.package_ctc ? `💰 *Package:* ${job.package_ctc}` : null,
    job.location ? `📍 *Location:* ${job.location}` : null,
    `📅 *Deadline:* ${deadline}`,
    ``,
    job.description ? `📝 *Details:* ${job.description}` : null,
    ``,
    `🔗 *Apply Here:*`,
    job.application_url,
    ``,
    `✅ *After applying, confirm your status on ApplyForge:*`,
    `${origin}/dashboard`,
    ``,
    `⚠️ _All eligible students must apply before the deadline. Your application status is being tracked._`,
  ]
    .filter(Boolean)
    .join("\n");
}

/* ─── Generate WhatsApp Defaulter List ────────────────── */
export function generateDefaulterList(
  job: Job,
  students: Pick<Profile, "roll_number" | "full_name">[]
): string {
  return [
    `⚠️ *DEFAULTER LIST — ${job.company_name} (${job.title})*`,
    ``,
    `The following students have *NOT YET APPLIED*:`,
    ``,
    ...students.map(
      (s, i) => `${i + 1}. ${s.roll_number} — ${s.full_name}`
    ),
    ``,
    `Total: ${students.length} students pending`,
    ``,
    `🔗 Apply: ${job.application_url}`,
    `📅 Deadline: ${job.deadline ? new Date(job.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "ASAP"}`,
    ``,
    `⚠️ _Please apply immediately and update your status on ApplyForge._`,
  ].join("\n");
}

/* ─── Generate wa.me Share URL ────────────────────────── */
export function waShareUrl(text: string, phone?: string): string {
  const encoded = encodeURIComponent(text);
  if (phone) return `https://wa.me/${phone}?text=${encoded}`;
  return `https://wa.me/?text=${encoded}`;
}

/* ─── Optional Webhook Push ───────────────────────────── */
export async function pushToWhatsAppWebhook(
  groupJid: string,
  message: string
): Promise<boolean> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!apiUrl || !apiKey) {
    console.log("[WhatsApp] Webhook not configured, skipping push");
    return false;
  }

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ groupJid, message }),
    });
    return res.ok;
  } catch (e) {
    console.error("[WhatsApp] Webhook push failed:", e);
    return false;
  }
}
