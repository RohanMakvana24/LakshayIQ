-- Add has_solution to previous_year_papers
ALTER TABLE public.previous_year_papers ADD COLUMN has_solution boolean NOT NULL DEFAULT false;
