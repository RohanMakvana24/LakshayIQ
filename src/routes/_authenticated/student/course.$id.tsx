import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ArrowRight, Clock, GraduationCap, Layers, Sparkles } from "lucide-react";
import { PageLoader } from "@/components/page-loader";

// 📚 TanStack Router Loader Engine: કોર્સ, યુનિવર્સિટી અને સેમેસ્ટરનો ડેટાબેઝ સિંક
export const Route = createFileRoute("/_authenticated/student/course/$id")({
  loader: async ({ params }) => {
    // 1. કોર્સની બેઝિક વિગતો મેળવો
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, university_id, name, slug, duration, total_semesters, description")
      .eq("id", params.id)
      .single();

    if (courseError || !course) {
      throw notFound();
    }

    // 2. આ કોર્સ સાથે લિંક્ડ યુનિવર્સિટીનો ડેટા મેળવો (બ્રેડક્રમ્પ અને ટાઇટલ માટે)
    const { data: university } = await supabase
      .from("universities")
      .select("id, name, slug")
      .eq("id", course.university_id)
      .single();

    // 3. આ કોર્સના તમામ સેમેસ્ટર્સ લોડ કરો અને સાથે સબજેક્ટ્સનો કાઉન્ટ લાવવા રિલેશન ક્વેરી સેટ કરો
    const { data: semesters, error: semError } = await supabase
      .from("semesters")
      .select(`
        id, 
        semester_number, 
        title,
        subjects(id)
      `)
      .eq("course_id", params.id)
      .order("semester_number", { ascending: true });

    return { 
      course, 
      university: university || { id: course.university_id, name: "University", slug: "campus" }, 
      semesters: semesters || [] 
    };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.course?.name || "Course"} — Lakshay IQ` }],
  }),
  pendingMs: 0,
  pendingComponent: () => <PageLoader label="Loading Course" />,
  component: CoursePage,
});

function CoursePage() {
  // Loader માંથી ડાયનેમિકલી હાઈડ્રેટ થયેલો સાચો ડેટા એક્સટ્રેક્ટ કરો
  const { course, university, semesters } = Route.useLoaderData();

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-1 antialiased animate-fade-in">
      
      {/* 🗺️ PRECISE BREADCRUMB NAVIGATION */}
      <div className="overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        <BreadcrumbNav 
          items={[
            { label: "Dashboard", to: "/student" },
            { 
              label: university.name, 
              to: "/student/university/$id", 
              params: { id: university.id } 
            },
            { label: course.slug || "Course" },
          ]} 
        />
      </div>

      {/* 🌌 CINEMATIC MODERN COURSE HEADER */}
      <header className="relative rounded-2xl md:rounded-3xl border border-neutral-200/60 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-5 md:p-8 text-white shadow-[0_15px_40px_rgba(0,0,0,0.12)] overflow-hidden group">
        <div className="absolute -right-6 -bottom-6 text-neutral-800/20 pointer-events-none hidden sm:block">
          <Layers className="h-48 w-48 stroke-[0.8]" />
        </div>

        <div className="relative z-10 space-y-3.5">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-wider text-emerald-400 border border-white/5 backdrop-blur-md">
              <Sparkles className="h-3 w-3" /> {course.slug?.toUpperCase() || "DEGREE PROGRAM"}
            </div>
          </div>
          
          <h1 className="font-display text-xl md:text-3xl font-extrabold tracking-tight max-w-4xl leading-tight">
            {course.name}
          </h1>

          <p className="text-xs md:text-sm text-neutral-400 font-medium max-w-2xl leading-relaxed">
            {course.description || "Explore curated modular semesters, core textbook topics, and structured examination blueprints."}
          </p>

          {/* Core Analytics Badges Line */}
          <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] md:text-xs font-mono text-neutral-300">
            <span className="flex items-center gap-1.5 bg-black/30 border border-white/5 px-2.5 py-1 rounded-lg backdrop-blur-sm">
              <Clock className="h-3.5 w-3.5 text-neutral-400" /> {course.duration || "3 Years"}
            </span>
            <span className="flex items-center gap-1.5 bg-black/30 border border-white/5 px-2.5 py-1 rounded-lg backdrop-blur-sm">
              <GraduationCap className="h-3.5 w-3.5 text-neutral-400" /> {course.total_semesters} Semesters
            </span>
          </div>
        </div>
      </header>

      {/* 🏛️ SEMESTERS TIMELINE BENTO GRID */}
      <section className="space-y-5">
        <div className="border-b border-neutral-100 pb-3">
          <h2 className="font-display text-lg md:text-xl font-bold tracking-tight text-neutral-900">Academic Semesters</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Step through the timeline to unlock indexed subjects and study materials</p>
        </div>

        {semesters.length === 0 ? (
          /* Empty Database Fallback Frame */
          <div className="text-center py-16 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50 p-4">
            <Layers className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-neutral-500">No semesters mapped</h3>
            <p className="text-xs text-neutral-400 mt-1">Curriculum structures for this course model are pending administrative validation.</p>
          </div>
        ) : (
          /* Primary Responsive Bento Cards Matrix Mapping */
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {semesters.map((s: any) => {
              const subjectsCount = Array.isArray(s.subjects) ? s.subjects.length : 0;

              return (
                <Link key={s.id} to="/student/semester/$id" params={{ id: s.id }} className="block group">
                  <Card className="h-full border border-neutral-200/80 bg-white p-4 md:p-5 rounded-2xl shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)] transition-all duration-300 hover:-translate-y-1 hover:border-neutral-900 hover:shadow-[0_12px_25px_-6px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-start sm:items-center gap-4 overflow-hidden relative">
                    
                    {/* Top Row for Mobile (Index + Arrow Alignment) */}
                    <div className="flex sm:contents items-center justify-between w-full">
                      {/* Dark Minimalistic Index Block */}
                      <div className="grid h-12 w-12 md:h-14 md:w-14 shrink-0 place-items-center rounded-xl bg-neutral-900 text-lg md:text-xl font-bold font-mono text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                        {s.semester_number}
                      </div>

                      {/* Action Arrow (Only Visible on Mobile in this flex block) */}
                      <div className="h-7 w-7 rounded-xl bg-neutral-50 border border-neutral-100 flex sm:hidden items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300 shadow-sm">
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Metadata Content Framework Inside Block */}
                    <div className="flex-1 min-w-0 space-y-1 w-full">
                      <h3 className="font-display text-base font-bold text-neutral-900 group-hover:text-neutral-950 transition-colors truncate">
                        {s.title || `Semester ${s.semester_number}`}
                      </h3>
                      <p className="text-xs font-mono font-medium text-neutral-400 flex items-center gap-1">
                        <span>{subjectsCount} Core {subjectsCount === 1 ? "Subject" : "Subjects"}</span>
                      </p>
                    </div>

                    {/* Action Arrow Wrapper Frame (Hidden on Mobile, Visible on Desktop) */}
                    <div className="hidden sm:flex h-7 w-7 rounded-xl bg-neutral-50 border border-neutral-100 items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
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