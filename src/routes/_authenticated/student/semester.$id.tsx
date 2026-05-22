import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ArrowRight, BookMarked, GraduationCap, Layers, Sparkles } from "lucide-react";
import { PageLoader } from "@/components/page-loader";

export const Route = createFileRoute("/_authenticated/student/semester/$id")({
  loader: async ({ params }) => {
    const { data: semester, error: semError } = await supabase
      .from("semesters")
      .select("id, course_id, semester_number, title")
      .eq("id", params.id)
      .single();

    if (semError || !semester) {
      throw notFound();
    }

    const { data: course } = await supabase
      .from("courses")
      .select("id, university_id, name, slug")
      .eq("id", semester.course_id)
      .single();

    const university = course
      ? await supabase
          .from("universities")
          .select("id, name, slug")
          .eq("id", course.university_id)
          .single()
          .then(({ data }) => data)
      : null;

    const { data: subjects, error: subError } = await supabase
      .from("subjects")
      .select(`
        id,
        name,
        subject_code,
        slug,
        description,
        thumbnail_url,
        units(id)
      `)
      .eq("semester_id", params.id)
      .order("name", { ascending: true });

    return {
      semester,
      course: course || { id: semester.course_id, name: "Course", slug: "course" },
      university: university || { id: "", name: "University", slug: "campus" },
      subjects: subjects || [],
    };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Semester ${loaderData?.semester?.semester_number || ""} — Lakshay IQ` }],
  }),
  pendingMs: 0,
  pendingComponent: () => <PageLoader label="Loading Semester" />,
  component: SemesterPage,
});

function SemesterPage() {
  const { semester, course, university, subjects } = Route.useLoaderData();

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
          { label: semester.title || `Semester ${semester.semester_number}` },
        ]}
      />

      <header className="relative rounded-3xl border border-neutral-200/60 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-6 md:p-8 text-white shadow-[0_15px_40px_rgba(0,0,0,0.12)] overflow-hidden group">
        <div className="absolute -right-6 -bottom-6 text-neutral-800/20 pointer-events-none">
          <GraduationCap className="h-48 w-48 stroke-[0.8]" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-wider text-emerald-400 border border-white/5 backdrop-blur-md">
            <Sparkles className="h-3 w-3" /> ACADEMIC TIMELINE
          </div>
          
          <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight max-w-4xl leading-tight">
            {semester.title || `Semester ${semester.semester_number}`}
          </h1>

          <p className="text-xs md:text-sm text-neutral-400 font-medium max-w-2xl leading-relaxed">
            Curriculum mapping framework for <span className="text-white font-semibold">{course.name}</span>. Select any core module below to extract dynamic units, videos, and study papers.
          </p>

          <div className="pt-1">
            <span className="inline-flex items-center font-mono text-xs font-bold bg-black/30 border border-white/5 px-3 py-1 rounded-xl backdrop-blur-sm text-neutral-300">
              {subjects.length} Core Registered {subjects.length === 1 ? "Subject" : "Subjects"}
            </span>
          </div>
        </div>
      </header>

      <section className="space-y-5">
        <div className="border-b border-neutral-100 pb-3">
          <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900">Core Subjects</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Explore indexing, unit notes, exam resources, and videos for each subject module</p>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
            <BookMarked className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-neutral-500">No subjects cataloged</h3>
            <p className="text-xs text-neutral-400 mt-1">Modules for this semester branch haven't been mapped into the schema framework yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s: any) => {
              const unitsCount = Array.isArray(s.units) ? s.units.length : 0;

              return (
                <Link key={s.id} to="/student/subject/$id" params={{ id: s.id }} className="block group h-full">
                  <Card className="h-full border border-neutral-200/80 bg-white p-5 rounded-2xl shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)] transition-all duration-300 hover:-translate-y-1 hover:border-neutral-900 hover:shadow-[0_12px_25px_-6px_rgba(0,0,0,0.05)] flex flex-col justify-between overflow-hidden relative">
                    
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        {/* 🎯 SUBJECT LOGO FRAME (DYNAMICS IMAGES FROM URL WITH FALLBACK ICON) */}
                        {s.thumbnail_url ? (
                          <div className="h-12 w-12 shrink-0 rounded-xl border border-neutral-100 bg-neutral-50 p-1 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105 shadow-sm">
                            <img 
                              src={s.thumbnail_url} 
                              alt={s.name}
                              className="h-full w-full object-contain rounded-lg"
                              loading="lazy"
                              onError={(e) => {
                                // જો ક્યારેય ઈમેજ લિંક બ્રોકન હોય તો આ આઈકોન પ્લેસહોલ્ડર બની જશે
                                e.currentTarget.style.display = "none";
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.className = "grid h-10 w-10 place-items-center rounded-xl bg-neutral-900 text-white shadow-sm";
                                  parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers"><path d="m12 3-10 5 10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>';
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-900 text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                            <Layers className="h-4 w-4 stroke-[2.2]" />
                          </div>
                        )}
                        
                        {s.subject_code && (
                          <Badge variant="secondary" className="text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-50 border border-neutral-200 rounded-md text-neutral-500">
                            {s.subject_code}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 space-y-1.5">
                        <h3 className="font-display text-base font-bold text-neutral-900 group-hover:text-neutral-950 transition-colors line-clamp-2 leading-tight">
                          {s.name}
                        </h3>
                        <p className="text-xs text-neutral-400 font-medium line-clamp-2 leading-relaxed">
                          {s.description || "Access tailored core syllabus content, quick-review PDFs, and high-priority examination materials."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs font-medium">
                      <p className="font-mono text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200/40 px-2 py-0.5 rounded-md">
                        {unitsCount} {unitsCount === 1 ? "Unit Mapped" : "Units Mapped"}
                      </p>
                      
                      <div className="h-7 w-7 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300 shadow-sm">
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 stroke-[2.5]" />
                      </div>
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