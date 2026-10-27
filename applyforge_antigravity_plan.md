# ApplyForge — Greenfield Product Requirements & Antigravity Build Blueprint

**Application Name**: **ApplyForge** — Placement Job Broadcast & Student Application Tracking Platform  
**Build Mode**: 100% Greenfield (Build from scratch in an empty directory)  
**Tech Stack**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Supabase (Auth + PostgreSQL), Zod v4, Lucide React, Nodemailer  

## 1. Product Vision & Core Problem Statement

### 1.1 The Problem
Placement Training Officers (PTOs) share daily job application links in college WhatsApp groups, and students apply on external company portals (Google Forms, Superset, Workday, Zoho Recruit, TCS NextStep, etc.). Because applications happen on external links, the Placement Officer faces critical blind spots:
1. **No Visibility on Who Applied**: The officer cannot see which students actually applied and which students ignored or missed the job link.
2. **No Student-Level Accountability**: The officer cannot check a specific student's profile to see: *"Out of 20 job offers sent by the placement cell, how many did this student apply for?"*
3. **Hidden Application Issues**: Students who face broken links, OTP issues, or eligibility blocks get lost in WhatsApp group messages instead of being tracked in a structured dashboard.
4. **Fragmented Communication**: Sending job alerts to multiple WhatsApp groups and separately emailing eligible students takes repetitive manual effort.

### 1.2 The ApplyForge Solution
**ApplyForge** is a clean, purpose-built Placement Job Distribution & Application Tracking Web Application with two dedicated portals:
* **Placement Officer Portal (`/admin/login` & `/admin`)**:
  * Post new job application links with a **Priority Level** (`URGENT`, `HIGH`, `NORMAL`, `LOW`), company details, package, deadline, and eligibility criteria.
  * Broadcast the job message to **selected WhatsApp Groups** (via 1-click formatted WhatsApp share/copy + optional WhatsApp Group Webhook API) and automatically **send emails to students**.
  * Track applications through two lenses:
    1. **Job-Wise View**: Select any job to see who **Applied**, who has **Not Applied Yet**, who is **Facing Trouble**, and who is **Not Eligible**, with a 1-click **"Remind Unapplied Students"** button.
    2. **Student-Wise Profile View**: Select any student to see **Total Jobs Sent vs. Applied Count vs. Not Applied Count vs. Trouble Reported**, plus their complete job-by-job history.
* **Student Portal (`/register`, `/login`, & `/dashboard`)**:
  * Students sign up using **Full Name, Email ID, Phone Number (WhatsApp), Password**, Roll Number, Department, Batch Year, and CGPA, and log in using **Email ID + Password**.
  * Every new job added by the Admin automatically appears in the student's profile with a default status of **`NOT_APPLIED`** (*"Not Applied Yet"*).
  * Students click the job link to apply and update their status on ApplyForge to **`APPLIED`** (with optional Reference ID), **`FACING_TROUBLE`** (with issue category & note), or **`NOT_ELIGIBLE`**.

## 2. Target Project Directory Structure (From Scratch)

Antigravity will scaffold and build this exact directory structure inside an empty workspace folder:

```text
applyforge/
├── public/
│   └── favicon.svg
├── scripts/
│   ├── apply-migrations.ts
│   ├── bootstrap-admin.ts
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[action]/
│   │   │   │   └── route.ts
│   │   │   ├── command/
│   │   │   │   └── route.ts
│   │   │   ├── export/
│   │   │   │   └── route.ts
│   │   │   ├── notify/
│   │   │   │   └── route.ts
│   │   │   └── snapshot/
│   │   │       └── route.ts
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── admin-dashboard.tsx
│   │   ├── auth-form.tsx
│   │   ├── job-modal.tsx
│   │   ├── shared.tsx
│   │   ├── student-dashboard.tsx
│   │   └── whatsapp-broadcast-modal.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── admin.ts
│   │   │   ├── browser.ts
│   │   │   └── server.ts
│   │   ├── client.ts
│   │   ├── errors.ts
│   │   ├── http.ts
│   │   ├── notifications.ts
│   │   ├── types.ts
│   │   └── validation.ts
│   └── middleware.ts
├── supabase/
│   └── migrations/
│       └── 202610270001_init_applyforge.sql
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

## 3. Dependencies & Environment Configuration

### 3.1 `package.json` Specification
```json
{
  "name": "applyforge",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22.0.0"
  },
  "scripts": {
    "dev": "next dev --hostname 0.0.0.0",
    "build": "next build",
    "start": "next start --hostname 0.0.0.0",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "migrate": "node --import tsx scripts/apply-migrations.ts",
    "bootstrap:admin": "node --import tsx scripts/bootstrap-admin.ts",
    "seed": "node --import tsx scripts/seed.ts"
  },
  "dependencies": {
    "@supabase/ssr": "^0.6.1",
    "@supabase/supabase-js": "^2.49.1",
    "lucide-react": "^1.47.0",
    "next": "^15.2.0",
    "nodemailer": "^6.10.0",
    "pg": "^8.13.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "server-only": "^0.0.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^22.13.0",
    "@types/nodemailer": "^6.4.17",
    "@types/pg": "^8.11.11",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "tsx": "^4.19.3",
    "typescript": "^5.8.2"
  }
}
```

### 3.2 `.env.example` Specification
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
APP_ORIGIN=http://localhost:3000

# Admin Bootstrap Credentials (used by npm run bootstrap:admin)
ADMIN_EMAIL=officer@college.edu
ADMIN_PASSWORD=ChangeMe123!
ADMIN_NAME=Placement Training Officer
ADMIN_PHONE=9876543210

# Email Dispatch (SMTP / Gmail App Password for Student Job Notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=placementcell@college.edu
SMTP_PASS=your-app-password
SMTP_FROM="ApplyForge Placement Cell <placementcell@college.edu>"

# Optional Automated WhatsApp Group API Bridge (Evolution API / WPPConnect / Custom Webhook)
WHATSAPP_API_URL=
WHATSAPP_API_KEY=
```

## 4. User Roles & Authentication Specifications

### 4.1 Student Sign-Up (`/register`) & Login (`/login`)
* **Registration Form (`/register`)**:
  * `fullName` (Required, string, 2–100 chars)
  * `email` (Required, valid email — used as Login ID & email notification target)
  * `phone` (Required, 10–15 digits — student's mobile/WhatsApp number)
  * `password` (Required, minimum 8 characters)
  * `rollNumber` (Required, unique college register/roll number, e.g., `711523BCS042`)
  * `department` (Required dropdown: `CSE`, `IT`, `AI&DS`, `ECE`, `EEE`, `MECH`, `CIVIL`, `OTHER`)
  * `batchYear` (Required number, e.g., `2026`, `2027`)
  * `cgpa` (Optional/Required decimal `0.00` to `10.00`, e.g., `8.45`)
* **Login Form (`/login`)**:
  * Students log in using **Email ID + Password**.
  * Upon login, redirects to `/dashboard`.

### 4.2 Placement Officer Admin Login (`/admin/login`)
* Dedicated Officer Login using **Email ID + Password**.
* Verifies that the authenticated user has `role = 'admin'` in `public.profiles`.
* Upon login, redirects to `/admin`.

## 5. Complete Database Schema (`supabase/migrations/202610270001_init_applyforge.sql`)

Lightweight, fast relational schema with zero unnecessary audit/lock bloat:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (Students & Placement Officers)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  roll_number TEXT UNIQUE,
  department TEXT DEFAULT 'CSE',
  batch_year INTEGER DEFAULT 2027,
  cgpa NUMERIC(4,2) DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. WhatsApp Groups Table (Managed by Placement Officer)
CREATE TABLE IF NOT EXISTS public.whatsapp_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department_tag TEXT NOT NULL DEFAULT 'ALL',
  invite_link TEXT,
  group_jid TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Jobs Table (Posted by Placement Officer)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  application_url TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('URGENT', 'HIGH', 'NORMAL', 'LOW')),
  package_ctc TEXT,
  location TEXT,
  description TEXT,
  eligible_departments TEXT[] NOT NULL DEFAULT ARRAY['ALL'],
  min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00,
  batch_year INTEGER,
  deadline TIMESTAMPTZ,
  target_group_ids UUID[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Job Applications Table (Tracks Every Student's Status Per Job)
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'NOT_APPLIED' CHECK (
    status IN ('NOT_APPLIED', 'APPLIED', 'FACING_TROUBLE', 'NOT_ELIGIBLE')
  ),
  issue_category TEXT CHECK (
    issue_category IS NULL OR issue_category IN (
      'LINK_EXPIRED_OR_BROKEN',
      'PORTAL_OR_OTP_ERROR',
      'ELIGIBILITY_BLOCKED',
      'OTHER_ISSUE'
    )
  ),
  issue_note TEXT,
  application_ref TEXT,
  link_clicked_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_student_id ON public.job_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- Trigger 1: When Admin creates a new Job, automatically assign it ('NOT_APPLIED') to all eligible students
CREATE OR REPLACE FUNCTION public.assign_job_to_students()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.job_applications (job_id, student_id, status)
  SELECT NEW.id, p.id, 'NOT_APPLIED'
  FROM public.profiles p
  WHERE p.role = 'student'
    AND p.is_active = true
    AND (
      'ALL' = ANY(NEW.eligible_departments)
      OR p.department = ANY(NEW.eligible_departments)
    )
    AND COALESCE(p.cgpa, 0) >= COALESCE(NEW.min_cgpa, 0)
  ON CONFLICT (job_id, student_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_assign_job_to_students ON public.jobs;
CREATE TRIGGER trg_assign_job_to_students
AFTER INSERT ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.assign_job_to_students();

-- Trigger 2: When a new Student signs up, automatically assign all active eligible jobs ('NOT_APPLIED')
CREATE OR REPLACE FUNCTION public.assign_existing_jobs_to_new_student()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO public.job_applications (job_id, student_id, status)
    SELECT j.id, NEW.id, 'NOT_APPLIED'
    FROM public.jobs j
    WHERE j.is_active = true
      AND (
        'ALL' = ANY(j.eligible_departments)
        OR NEW.department = ANY(j.eligible_departments)
      )
      AND COALESCE(NEW.cgpa, 0) >= COALESCE(j.min_cgpa, 0)
    ON CONFLICT (job_id, student_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_assign_existing_jobs_to_new_student ON public.profiles;
CREATE TRIGGER trg_assign_existing_jobs_to_new_student
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_existing_jobs_to_new_student();
```

## 6. Core Functional Workflows & Improvements

### 6.1 Placement Officer Workflow (`/admin`)
1. **Post a Job Offer**:
   * Enter Company Name, Job Role, External Application Link (`application_url`), Package (CTC), Location, Deadline, Priority (`URGENT`, `HIGH`, `NORMAL`, `LOW`), Eligible Departments (`ALL` or specific branches), and Minimum CGPA.
   * Select which **WhatsApp Groups** to share the job with, and check **"Send Email to Eligible Students"**.
2. **Send to WhatsApp Groups & Student Emails**:
   * **Email Dispatch**: Server immediately emails all eligible students with the job details, priority badge, deadline, external application link, and direct link to confirm on ApplyForge.
   * **WhatsApp Group Broadcast Modal**: Opens immediately after posting a job (or anytime via the **"Share to WhatsApp"** button on a job card) with:
     * Pre-formatted WhatsApp broadcast message (with emojis, bold headers, Company, Role, Priority, Deadline, Application Link, and ApplyForge confirmation link).
     * **1-Click Copy Message** button + direct **"Open WhatsApp / Share to Group"** buttons for each selected WhatsApp group.
     * Optional automatic webhook push if `WHATSAPP_API_URL` is configured.
3. **Job-Wise Application Tracking Tab (*Select a Specific Job*)**:
   * Shows KPI cards for the selected job: **Total Assigned**, **Applied Count (%)**, **Not Applied Yet Count**, **Facing Trouble Count**, and **Not Eligible Count**.
   * Filter students by status tab: `All` | `Applied` | `Not Applied Yet` | `Facing Trouble` | `Not Eligible`, plus search by name/roll number and filter by department.
   * Shows whether the student actually clicked the job link (`link_clicked_at`), when they applied (`applied_at`), their Application Reference ID, or their exact **Trouble Note**.
   * **1-Click "Remind Unapplied Students"**:
     * Sends a reminder email *only* to students still in `NOT_APPLIED` status for that job.
     * Generates a ready-to-paste **WhatsApp Defaulter List** listing the Roll Numbers and Names of students who haven't applied yet so the officer can post it in the WhatsApp group.
4. **Student-Wise Compliance Profile Tab (*Select a Specific Student*)**:
   * Master table of all registered students showing:
     * `Roll No` | `Student Name` | `Department` | `Phone / WhatsApp` | `Total Jobs Sent` | `Applied` | `Not Applied Yet` | `Facing Trouble` | `Completion %`
   * Clicking any student opens their **Student Profile Drawer**, displaying every job sent to that student, which ones they applied for, which ones they haven't applied for yet, and any issues they reported.
5. **1-Click CSV Export (`/api/export`)**:
   * Export applicants for any specific job (e.g., to send the `Applied` list to company HR or `Not Applied Yet` list to department coordinators) or export the Master Student Compliance report.

### 6.2 Student Workflow (`/dashboard`)
1. **Personal Placement Summary Bar**:
   * Displays **Total Jobs Assigned**, **Applied**, **Pending Action (`Not Applied Yet`)**, **Issues Reported**, and **Overall Application Completion %**.
2. **Priority-Sorted Job Feed**:
   * Jobs are sorted with `URGENT` and `HIGH` priority active jobs at the top, followed by nearest deadline.
   * Filter tabs: `Pending Action (Not Applied Yet)` | `All Assigned Jobs` | `Applied` | `Trouble / Not Eligible`.
3. **2-Step Apply & Confirm Flow on Each Job Card**:
   * **Step 1 — Click "Apply on Company Portal"**: Opens `application_url` in a new tab and fires `RECORD_JOB_CLICK` to `/api/command` so `link_clicked_at` is recorded.
   * **Step 2 — Confirm Application Status**:
     * **`Applied`**: Marks status as `APPLIED` (with optional input for Application Reference ID / Confirmation note).
     * **`Facing Trouble`**: Opens a quick inline prompt to choose the issue type (`Link Broken/Closed`, `Portal/OTP Error`, `Eligibility Blocked`, `Other`) and type a short note for the Placement Officer.
     * **`Not Eligible`**: Marks `NOT_ELIGIBLE` with a short reason.
     * **`Not Applied Yet`**: Default state until the student takes action.

## 7. Unified API Architecture (Command + Snapshot Pattern)

Keep the backend clean and maintainable with 5 focused API routes in `src/app/api/`:
1. `POST /api/auth/[action]`:
   * `register`: Creates Supabase Auth user + `public.profiles` student record (which triggers automatic assignment of active jobs).
   * `login`: Signs in with Email + Password and returns role-based redirect (`/admin` or `/dashboard`).
   * `logout`: Ends session.
2. `POST /api/command`:
   * Validates payload with Zod (`src/lib/validation.ts`) and executes Student commands (`RECORD_JOB_CLICK`, `UPDATE_APPLICATION_STATUS`, `UPDATE_STUDENT_PROFILE`) or Admin commands (`CREATE_JOB`, `UPDATE_JOB`, `TOGGLE_JOB_ACTIVE`, `DELETE_JOB`, `SAVE_WHATSAPP_GROUP`, `DELETE_WHATSAPP_GROUP`).
3. `GET /api/snapshot`:
   * Returns complete typed dashboard state for either the logged-in Student (`scope=student`) or the Placement Officer (`scope=admin`, including job-wise breakdowns, student-wise totals, and active trouble alerts).
4. `POST /api/notify`:
   * Sends bulk or reminder emails via Nodemailer (or logs safely to console in local dev if SMTP credentials are not yet set) and returns formatted WhatsApp broadcast/reminder messages + `wa.me` share URLs.
5. `GET /api/export`:
   * Streams CSV downloads for Job-specific student lists (`?type=job&jobId=...&status=...`) or the Master Student Compliance Summary (`?type=students`).

## 8. How to Start & Build ApplyForge in Antigravity (From Scratch)

Follow these 3 steps on your machine:

### Step 1: Create a Brand-New Empty Folder
Open your terminal and create a fresh directory (no old code needed):
```bash
mkdir applyforge
cd applyforge
```

### Step 2: Add This Blueprint File
Save this document as **`APPLYFORGE_ANTIGRAVITY_PLAN.md`** inside your empty `applyforge/` folder, and open the `applyforge/` folder in **Antigravity**.

### Step 3: Paste This Master Prompt into Antigravity
Copy and send the following prompt to the Antigravity agent:

```text
Read APPLYFORGE_ANTIGRAVITY_PLAN.md in this workspace completely.

I want you to build "ApplyForge" from scratch in this directory following every specification in APPLYFORGE_ANTIGRAVITY_PLAN.md. Do not use any external template repository—initialize and create all files directly in this folder.

Execute the build end-to-end in these phases:
1. Project Initialization: Create package.json, tsconfig.json, next.config.ts, postcss.config.mjs, .env.example, .gitignore, and install the dependencies.
2. Database Schema & Scripts: Create supabase/migrations/202610270001_init_applyforge.sql with the profiles, whatsapp_groups, jobs, and job_applications tables, indexes, and automatic job-assignment triggers. Create scripts/apply-migrations.ts, scripts/bootstrap-admin.ts, and scripts/seed.ts (with realistic sample college students, WhatsApp groups, and placement drives).
3. Core Library (src/lib/): Implement the 3-tier Supabase clients (browser.ts, server.ts, admin.ts), TypeScript domain types (types.ts), Zod schemas (validation.ts), error/HTTP helpers (errors.ts, http.ts, client.ts), and the WhatsApp + Email notification service (notifications.ts).
4. Unified API Routes (src/app/api/): Implement /api/auth/[action], /api/command, /api/snapshot, /api/notify, and /api/export, plus src/middleware.ts for route protection.
5. Frontend Portals & Components (src/components/ & src/app/):
   - Landing page (/), Student Sign Up (/register with Name, Email, Phone, Password, Roll Number, Department, Batch, CGPA), Student Login (/login with Email + Password), and Admin Login (/admin/login).
   - Student Dashboard (/dashboard) with personal KPI cards, Priority & Deadline sorted job cards, external link click-tracking, and application status confirmation (Applied, Facing Trouble with issue category & note, Not Eligible, or default Not Applied Yet).
   - Placement Officer Admin Dashboard (/admin) with:
     a) Post New Job modal/form with Priority level, eligibility filters, WhatsApp Group selector, and Email notification trigger,
     b) WhatsApp Broadcast & Defaulter Reminder generator modal (1-click copy + wa.me share links),
     c) Job-Wise Tracker view (select a job -> see KPI counts -> filter students who Applied, Not Applied Yet, Facing Trouble, or Not Eligible -> 1-click Remind Unapplied Students & CSV export),
     d) Student-Wise Profile Tracker view (table of all students showing Total Jobs Sent vs. Applied vs. Not Applied Yet vs. Trouble Reported, plus a slide-over drawer showing a selected student's complete job application history),
     e) WhatsApp Groups Manager tab.
6. Verification: Run `npm run typecheck` and `npm run build` and fix any TypeScript or build issues so the application is 100% ready to run.
```
