import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Calendar, Download, FileText, ArrowRight, Layers, Sparkles, Video, FileCheck, HelpCircle, AlertCircle } from "lucide-react";
import { PageLoader } from "@/components/page-loader";

export const Route = createFileRoute("/_authenticated/student/subject/$id")({
  loader: async ({ params }) => {
    const { data: subject, error: subError } = await supabase
      .from("subjects")
      .select("id, semester_id, name, subject_code, slug, description")
      .eq("id", params.id)
      .single();

    if (subError || !subject) {
      throw notFound();
    }

    const { data: semester } = await supabase
      .from("semesters")
      .select("id, course_id, semester_number, title")
      .eq("id", subject.semester_id)
      .single();

    const course = semester
      ? await supabase
          .from("courses")
          .select("id, university_id, name, slug")
          .eq("id", semester.course_id)
          .single()
          .then(({ data }) => data)
      : null;

    const university = course
      ? await supabase
          .from("universities")
          .select("id, name, slug")
          .eq("id", course.university_id)
          .single()
          .then(({ data }) => data)
      : null;

    const { data: units } = await supabase
      .from("units")
      .select(`
        id, 
        unit_number, 
        title, 
        description,
        unit_videos(id),
        unit_materials(id)
      `)
      .eq("subject_id", params.id)
      .order("unit_number", { ascending: true });

    const { data: papers } = await supabase
      .from("previous_year_papers")
      .select("id, year, title, file_url")
      .eq("subject_id", params.id)
      .order("year", { ascending: false });

    const { data: timetables } = await supabase
      .from("exam_timetables")
      .select("id, title, exam_start_date, exam_end_date, file_url")
      .eq("semester_id", subject.semester_id);

    return {
      subject,
      semester: semester || { id: subject.semester_id, semester_number: 1, title: "" },
      course: course || { id: "", name: "Course", slug: "course" },
      university: university || { id: "", name: "University", slug: "campus" },
      units: units || [],
      papers: papers || [],
      timetables: timetables || [],
    };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.subject?.name || "Subject"} — Lakshay IQ` }],
  }),
  pendingMs: 0,
  pendingComponent: () => <PageLoader label="Loading Subject" />,
  component: SubjectPage,
});

function SubjectPage() {
  const { subject, semester, course, university, units, papers, timetables } = Route.useLoaderData();

  return (
    <div className="space-y-8 p-1 antialiased animate-fade-in">
      
      <BreadcrumbNav
        items={[
          { label: "Dashboard", to: "/student" },
          {
            label: university.name,
            to: "/student/university/$id",
            params: { id: university.id },
          },
          {
            label: course.slug || "Course",
            to: "/student/course/$id",
            params: { id: course.id },
          },
          {
            label: semester.title || `Sem ${semester.semester_number}`,
            to: "/student/semester/$id",
            params: { id: semester.id },
          },
          { label: subject.subject_code || "Subject" },
        ]}
      />

      <header className="relative rounded-3xl border border-neutral-200/60 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-6 md:p-8 text-white shadow-[0_15px_40px_rgba(0,0,0,0.12)] overflow-hidden group">
        <div className="absolute -right-6 -bottom-6 text-neutral-800/20 pointer-events-none">
          <Layers className="h-48 w-48 stroke-[0.8]" />
        </div>

        <div className="relative z-10 space-y-3">
          {subject.subject_code && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-wider text-emerald-400 border border-white/5 backdrop-blur-md">
              <Sparkles className="h-3 w-3" /> {subject.subject_code.toUpperCase()}
            </div>
          )}
          
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight max-w-4xl leading-tight">
            {subject.name}
          </h1>

          <p className="text-xs md:text-sm text-neutral-400 font-medium max-w-2xl leading-relaxed">
            {subject.description || "In-depth dynamic syllabus, structural lesson trackers, archive resources, and evaluation roadmaps."}
          </p>

          <div className="pt-1">
            <span className="inline-flex items-center font-mono text-xs font-bold bg-black/30 border border-white/5 px-3 py-1 rounded-xl backdrop-blur-sm text-neutral-300">
              {units.length} Standard Syllabus Units
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border border-neutral-200/80 bg-white p-5 rounded-2xl shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)] lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-neutral-900">Previous Year Question Papers</h2>
              <Badge variant="secondary" className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-600 border border-neutral-200/40 rounded-md">
                {papers.length} Papers Available
              </Badge>
            </div>
            
            {papers.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 min-h-[180px]">
                <HelpCircle className="h-7 w-7 text-neutral-300 mb-2" />
                <p className="text-xs font-bold text-neutral-500">No question papers uploaded yet</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 max-w-[280px]">Previous exam blueprints will be available here once mapped by admin.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {papers.map((paper: any) => (
                  <div key={paper.id} className="flex items-center justify-between rounded-xl border border-neutral-200/80 p-3 bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-900 transition-all duration-200 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-900 text-white shadow-sm group-hover:scale-105 transition-transform">
                        <FileText className="h-4 w-4 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-neutral-900 truncate">{paper.title}</p>
                        <p className="text-[11px] font-mono font-medium text-neutral-400">Year · {paper.year}</p>
                      </div>
                    </div>
                    {paper.file_url && (
                      <a href={paper.file_url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg border border-neutral-200 bg-white p-0 text-neutral-900 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all">
                          <Download className="h-3.5 w-3.5 stroke-[2.2]" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="border border-neutral-200/80 bg-white p-5 rounded-2xl shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)] flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Calendar className="h-4 w-4 text-neutral-500" />
              <h2 className="font-display text-base font-bold text-neutral-900">Exam Timetable</h2>
            </div>
            
            {timetables.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 min-h-[180px]">
                <AlertCircle className="h-7 w-7 text-neutral-300 mb-2" />
                <p className="text-xs font-bold text-neutral-500">Schedule not announced</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 max-w-[200px]">No active schedules found for this semester line.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs font-medium">
                {timetables.map((sched: any) => (
                  <div key={sched.id} className="rounded-xl border border-neutral-200/80 p-3 bg-neutral-50/40 flex items-center justify-between group hover:border-neutral-900 transition-all">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-neutral-900 truncate">{sched.title}</p>
                      <p className="text-neutral-400 mt-0.5 font-mono text-[11px]">
                        {sched.exam_start_date ? sched.exam_start_date : "TBD"}
                      </p>
                    </div>
                    {sched.file_url && (
                      <a href={sched.file_url} target="_blank" rel="noreferrer" className="shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 rounded-lg border p-0 bg-white text-neutral-900 hover:bg-neutral-900 hover:text-white">
                          <Download className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <section className="space-y-5">
        <div className="border-b border-neutral-100 pb-3">
          <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900">Syllabus Units</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Drill into specific units to stream instructional video sets and download summary assets</p>
        </div>

        {units.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
            <Layers className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-neutral-500">No units cataloged</h3>
            <p className="text-xs text-neutral-400 mt-1">Syllabus breakdown for this subject module is pending administration logs.</p>
          </div>
        ) : (
          <div className="grid gap-3.5">
            {units.map((u: any) => {
              const videosCount = u.unit_videos?.length || 0;
              const materialsCount = u.unit_materials?.length || 0;

              return (
                <Link key={u.id} to="/student/unit/$id" params={{ id: u.id }} className="block group">
                  <Card className="border border-neutral-200/80 bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all duration-300 hover:border-neutral-900 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.04)] flex items-center gap-4 overflow-hidden relative">
                    
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-neutral-900 text-lg font-bold font-mono text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                      {u.unit_number}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="font-display text-sm font-bold text-neutral-900 group-hover:text-neutral-950 transition-colors truncate">
                        {u.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Video className="h-3 w-3 text-neutral-400" /> {videosCount} Videos
                        </span>
                        <span className="h-2 w-px bg-neutral-200" />
                        <span className="flex items-center gap-1">
                          <FileCheck className="h-3 w-3 text-neutral-400" /> {materialsCount} Materials
                        </span>
                      </div>
                    </div>

                    <div className="h-7 w-7 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300 shadow-sm">
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 stroke-[2.5]" />
                    </div>

                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}