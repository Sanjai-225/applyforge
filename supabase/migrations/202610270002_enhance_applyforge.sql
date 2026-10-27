-- ApplyForge 2.0 Enhancement Migration
-- Removes batch_year and CGPA, adds in-app notifications, support chat, and audit logging.

-- 1. Safely drop batch_year and cgpa from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS batch_year CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cgpa CASCADE;

-- 2. Safely drop batch_year and min_cgpa from jobs
ALTER TABLE public.jobs DROP COLUMN IF EXISTS batch_year CASCADE;
ALTER TABLE public.jobs DROP COLUMN IF EXISTS min_cgpa CASCADE;

-- 3. In-App Student Notifications Table (Reminders & Alerts)
CREATE TABLE IF NOT EXISTS public.student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'REMINDER' CHECK (type IN ('REMINDER', 'JOB_ALERT', 'SUPPORT', 'ANNOUNCEMENT')),
  link_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_notifications_student_id ON public.student_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notifications_is_read ON public.student_notifications(is_read);

-- 4. Help & Support Chat Messages Table (WhatsApp-style Student <-> Officer Chat)
CREATE TABLE IF NOT EXISTS public.help_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'admin')),
  message TEXT NOT NULL,
  attachment_url TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_help_messages_student_id ON public.help_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_help_messages_sender_id ON public.help_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_help_messages_created_at ON public.help_messages(created_at);

-- 5. Audit & Activity Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL, -- "JOB_CREATED", "JOB_EDITED", "JOB_DELETED", "REMINDER_BROADCAST", etc.
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 6. Updated Auto-Assignment Trigger: Trigger 1 (When Admin creates a new Job)
-- Matches strictly on role = 'student', is_active = true, and department (ALL or specific department) - NO CGPA check
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
  ON CONFLICT (job_id, student_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_assign_job_to_students ON public.jobs;
CREATE TRIGGER trg_assign_job_to_students
AFTER INSERT ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.assign_job_to_students();

-- 7. Updated Auto-Assignment Trigger: Trigger 2 (When a new Student signs up)
-- Matches strictly on eligible departments - NO CGPA check
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
    ON CONFLICT (job_id, student_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_assign_existing_jobs_to_new_student ON public.profiles;
CREATE TRIGGER trg_assign_existing_jobs_to_new_student
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_existing_jobs_to_new_student();
