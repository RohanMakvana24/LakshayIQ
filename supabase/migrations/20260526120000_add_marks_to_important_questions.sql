-- Add marks column to important_questions table
ALTER TABLE public.important_questions ADD COLUMN IF NOT EXISTS marks integer NOT NULL DEFAULT 1 CHECK (marks IN (1, 2, 3, 5));
