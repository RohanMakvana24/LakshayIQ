
-- UNIVERSITIES
CREATE TABLE public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  slug varchar(255) NOT NULL UNIQUE,
  description text,
  logo_url text,
  banner_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_universities_slug ON public.universities(slug);
CREATE INDEX idx_universities_created_at ON public.universities(created_at);

-- COURSES
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  slug varchar(255) NOT NULL,
  duration varchar(100),
  total_semesters integer NOT NULL DEFAULT 6 CHECK (total_semesters BETWEEN 1 AND 12),
  thumbnail_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (university_id, slug)
);
CREATE INDEX idx_courses_university ON public.courses(university_id);
CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_courses_name ON public.courses(name);

-- SEMESTERS
CREATE TABLE public.semesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  semester_number integer NOT NULL CHECK (semester_number BETWEEN 1 AND 12),
  title varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, semester_number)
);
CREATE INDEX idx_semesters_course ON public.semesters(course_id);
CREATE INDEX idx_semesters_number ON public.semesters(semester_number);

-- SUBJECTS
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id uuid NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  subject_code varchar(100),
  slug varchar(255) NOT NULL,
  thumbnail_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (semester_id, slug)
);
CREATE INDEX idx_subjects_semester ON public.subjects(semester_id);
CREATE INDEX idx_subjects_name ON public.subjects(name);
CREATE INDEX idx_subjects_code ON public.subjects(subject_code);

-- UNITS
CREATE TABLE public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  unit_number integer NOT NULL CHECK (unit_number BETWEEN 1 AND 20),
  title varchar(255) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, unit_number)
);
CREATE INDEX idx_units_subject ON public.units(subject_id);
CREATE INDEX idx_units_title ON public.units(title);

-- UNIT VIDEOS
CREATE TABLE public.unit_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  duration varchar(50),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_unit_videos_unit ON public.unit_videos(unit_id);
CREATE INDEX idx_unit_videos_title ON public.unit_videos(title);

-- UNIT MATERIALS
CREATE TABLE public.unit_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  file_url text NOT NULL,
  file_type varchar(50) NOT NULL DEFAULT 'pdf' CHECK (file_type IN ('pdf','notes','image','doc')),
  file_size varchar(50),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_unit_materials_unit ON public.unit_materials(unit_id);
CREATE INDEX idx_unit_materials_type ON public.unit_materials(file_type);

-- IMPORTANT QUESTIONS
CREATE TABLE public.important_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  category varchar(50) NOT NULL DEFAULT 'important' CHECK (category IN ('important','repeated','exam')),
  year integer,
  question_file_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_iq_unit ON public.important_questions(unit_id);
CREATE INDEX idx_iq_category ON public.important_questions(category);
CREATE INDEX idx_iq_year ON public.important_questions(year);

-- PREVIOUS YEAR PAPERS
CREATE TABLE public.previous_year_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  year integer NOT NULL,
  semester integer CHECK (semester BETWEEN 1 AND 12),
  title varchar(255) NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pyp_subject ON public.previous_year_papers(subject_id);
CREATE INDEX idx_pyp_year ON public.previous_year_papers(year);

-- EXAM TIMETABLES
CREATE TABLE public.exam_timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  semester_id uuid NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  exam_start_date date,
  exam_end_date date,
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tt_university ON public.exam_timetables(university_id);
CREATE INDEX idx_tt_course ON public.exam_timetables(course_id);
CREATE INDEX idx_tt_semester ON public.exam_timetables(semester_id);
CREATE INDEX idx_tt_start ON public.exam_timetables(exam_start_date);
CREATE INDEX idx_tt_end ON public.exam_timetables(exam_end_date);

-- BOOKMARKS
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.unit_materials(id) ON DELETE CASCADE,
  video_id uuid REFERENCES public.unit_videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (material_id IS NOT NULL OR video_id IS NOT NULL)
);
CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_material ON public.bookmarks(material_id);
CREATE INDEX idx_bookmarks_video ON public.bookmarks(video_id);

-- Updated_at trigger reuse
CREATE TRIGGER trg_universities_updated BEFORE UPDATE ON public.universities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_semesters_updated BEFORE UPDATE ON public.semesters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_units_updated BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ENABLE RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.previous_year_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- POLICIES: authenticated read, admin write for content tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'universities','courses','semesters','subjects','units',
    'unit_videos','unit_materials','important_questions',
    'previous_year_papers','exam_timetables'
  ]) LOOP
    EXECUTE format('CREATE POLICY "read %1$s authed" ON public.%1$I FOR SELECT TO authenticated USING (true);', t);
    EXECUTE format('CREATE POLICY "admin insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''));', t);
    EXECUTE format('CREATE POLICY "admin update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''));', t);
    EXECUTE format('CREATE POLICY "admin delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''));', t);
  END LOOP;
END $$;

-- BOOKMARK POLICIES (user-scoped)
CREATE POLICY "bookmarks select own" ON public.bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "bookmarks insert own" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks delete own" ON public.bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);
