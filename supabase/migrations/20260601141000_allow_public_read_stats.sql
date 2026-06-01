-- Allow public (anon and authenticated) select access to core syllabus telemetry tables
-- This enables unauthenticated guest visitors on the landing page to fetch counts for statistics.

CREATE POLICY "Allow public select on universities" ON public.universities
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public select on courses" ON public.courses
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public select on semesters" ON public.semesters
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public select on subjects" ON public.subjects
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public select on units" ON public.units
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public select on profiles" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);
