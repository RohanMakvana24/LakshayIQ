-- Create student_resumes table for modular student resume and portfolio builder
CREATE TABLE IF NOT EXISTS public.student_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  is_published BOOLEAN DEFAULT false,
  personal_info JSONB NOT NULL DEFAULT '{
    "fullName": "",
    "title": "",
    "email": "",
    "phone": "",
    "location": "",
    "avatarUrl": "",
    "socials": []
  }'::jsonb,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  style_config JSONB NOT NULL DEFAULT '{
    "templateId": "tech-pioneer",
    "themeColor": "#10b981",
    "fontFamily": "Sora",
    "fontSize": "sm",
    "lineHeight": "normal",
    "sectionSpacing": "medium",
    "layoutMode": "split"
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.student_resumes ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read/write their own resumes
CREATE POLICY "Users can manage their own resumes" 
  ON public.student_resumes 
  FOR ALL 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow anonymous read of published portfolios
CREATE POLICY "Anyone can view published portfolios" 
  ON public.student_resumes 
  FOR SELECT 
  TO public 
  USING (is_published = true);
