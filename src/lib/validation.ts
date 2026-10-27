import { z } from "zod";
import { DEPARTMENTS, PRIORITIES, APP_STATUSES, ISSUE_CATEGORIES } from "./types";

/* ─── Auth ───────────────────────────────────────────────── */
export const RegisterSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  password: z.string().min(8, "Password must be at least 8 characters"),
  department: z.enum(DEPARTMENTS),
  rollNumber: z.string().max(30).optional(),
  batchYear: z.coerce.number().int().optional(),
  cgpa: z.coerce.number().min(0).max(10).optional().default(0),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

/* ─── Commands ───────────────────────────────────────────── */
export const RecordJobClickSchema = z.object({
  type: z.literal("RECORD_JOB_CLICK"),
  jobId: z.string().uuid(),
});

export const UpdateApplicationStatusSchema = z.object({
  type: z.literal("UPDATE_APPLICATION_STATUS"),
  jobId: z.string().uuid(),
  status: z.enum(APP_STATUSES),
  issueCategory: z.enum(ISSUE_CATEGORIES).optional(),
  issueNote: z.string().max(500).optional(),
  applicationRef: z.string().max(200).optional(),
});

export const UpdateStudentProfileSchema = z.object({
  type: z.literal("UPDATE_STUDENT_PROFILE"),
  phone: z.string().min(10).max(15).optional(),
  cgpa: z.coerce.number().min(0).max(10).optional(),
});

export const CreateJobSchema = z.object({
  type: z.literal("CREATE_JOB"),
  title: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  applicationUrl: z.string().url(),
  priority: z.enum(PRIORITIES).default("NORMAL"),
  packageCtc: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  eligibleDepartments: z.array(z.string()).min(1),
  minCgpa: z.coerce.number().min(0).max(10).default(0),
  batchYear: z.coerce.number().int().optional(),
  deadline: z.string().optional(),
  targetGroupIds: z.array(z.string().uuid()).default([]),
  sendEmail: z.boolean().default(false),
});

export const UpdateJobSchema = z.object({
  type: z.literal("UPDATE_JOB"),
  jobId: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  companyName: z.string().min(1).max(200).optional(),
  applicationUrl: z.string().url().optional(),
  priority: z.enum(PRIORITIES).optional(),
  packageCtc: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  deadline: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const ToggleJobActiveSchema = z.object({
  type: z.literal("TOGGLE_JOB_ACTIVE"),
  jobId: z.string().uuid(),
});

export const DeleteJobSchema = z.object({
  type: z.literal("DELETE_JOB"),
  jobId: z.string().uuid(),
});

export const SaveWhatsAppGroupSchema = z.object({
  type: z.literal("SAVE_WHATSAPP_GROUP"),
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  departmentTag: z.string().min(1).max(20),
  inviteLink: z.string().optional(),
  groupJid: z.string().optional(),
});

export const DeleteWhatsAppGroupSchema = z.object({
  type: z.literal("DELETE_WHATSAPP_GROUP"),
  groupId: z.string().uuid(),
});

export const CommandSchema = z.discriminatedUnion("type", [
  RecordJobClickSchema,
  UpdateApplicationStatusSchema,
  UpdateStudentProfileSchema,
  CreateJobSchema,
  UpdateJobSchema,
  ToggleJobActiveSchema,
  DeleteJobSchema,
  SaveWhatsAppGroupSchema,
  DeleteWhatsAppGroupSchema,
]);
export type CommandInput = z.infer<typeof CommandSchema>;

/* ─── Notify ─────────────────────────────────────────────── */
export const NotifySchema = z.object({
  action: z.enum(["JOB_BROADCAST", "REMIND_UNAPPLIED"]),
  jobId: z.string().uuid(),
  sendEmail: z.boolean().default(false),
  webhookPush: z.boolean().default(false),
});
export type NotifyInput = z.infer<typeof NotifySchema>;
