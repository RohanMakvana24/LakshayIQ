-- ============================================================
-- Migration: Create planner_tasks table
-- Feature: Student Planner & Progress Tracker
-- ============================================================

-- Create task status enum
CREATE TYPE task_status AS ENUM ('pending', 'completed', 'skipped');

-- Create planner_tasks table
CREATE TABLE IF NOT EXISTS public.planner_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  subject     TEXT,
  date        DATE NOT NULL,
  start_time  TIME,
  end_time    TIME,
  status      task_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------
-- Indexes
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_planner_tasks_user_id   ON public.planner_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_date       ON public.planner_tasks (date);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_status     ON public.planner_tasks (status);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_subject    ON public.planner_tasks (subject);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_user_date  ON public.planner_tasks (user_id, date);

-- -------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------
ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;

-- Users can only select their own tasks
CREATE POLICY "planner_tasks_select_own"
  ON public.planner_tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own tasks
CREATE POLICY "planner_tasks_insert_own"
  ON public.planner_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own tasks
CREATE POLICY "planner_tasks_update_own"
  ON public.planner_tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own tasks
CREATE POLICY "planner_tasks_delete_own"
  ON public.planner_tasks FOR DELETE
  USING (auth.uid() = user_id);
