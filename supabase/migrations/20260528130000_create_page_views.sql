-- Create page_views table for tracking real dashboard page views
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to insert page views (log their visits)
CREATE POLICY "Allow authenticated users to insert page views"
  ON public.page_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy to allow admins to read all page views for analytics
CREATE POLICY "Allow admins to read page views"
  ON public.page_views
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
