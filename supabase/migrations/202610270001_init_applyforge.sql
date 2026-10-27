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
