import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ArrowRight, Clock, GraduationCap, Layers, Sparkles, BookOpen, Star, Zap } from "lucide-react";
import { PageLoader } from "@/components/page-loader";

export const Route = createFileRoute("/_authenticated/student/course/$id")({
  loader: async ({ params }) => {
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, university_id, name, slug, duration, total_semesters, description")
      .eq("id", params.id)
      .single();

    if (courseError || !course) {
      throw notFound();
    }

    const { data: university } = await supabase
      .from("universities")
      .select("id, name, slug")
      .eq("id", course.university_id)
      .single();

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
  const { course, university, semesters } = Route.useLoaderData();

  // Calculate total subjects across all semesters for additional stats
  const totalSubjects = semesters.reduce((acc, s) => acc + (s.subjects?.length || 0), 0);

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="w-full px-4 py-4 md:px-6 lg:px-8">
        
        {/* Breadcrumb - Compact */}
        <div className="mb-4">
          <BreadcrumbNav 
            items={[
              { label: "Dashboard", to: "/student" },
              { label: university.name, to: "/student/university/$id", params: { id: university.id } },
              { label: course.slug || "Course" },
            ]} 
          />
        </div>

        {/* Hero Section - Compact & Modern with Unique Gradient Accent */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden mb-6 shadow-lg">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-0 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl" />
          <div className="absolute bottom-0 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl" />
          {/* Unique decorative diagonal lines */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%)] bg-[length:16px_16px]" />

          <div className="relative z-10 px-5 py-5 md:px-7 md:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left Content */}
              <div className="flex-1 space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 rounded-full px-2.5 py-0.5 border border-emerald-500/30">
                  <Sparkles className="h-3 w-3 text-emerald-300" />
                  <span className="text-[10px] font-semibold tracking-wide text-emerald-200">
                    {course.slug?.toUpperCase() || "DEGREE PROGRAM"}
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                  {course.name}
                </h1>
                <p className="text-slate-300 text-xs md:text-sm max-w-2xl line-clamp-2">
                  {course.description || "Explore curated modular semesters, core textbook topics, and structured examination blueprints."}
                </p>
              </div>

              {/* Right: Stats Badges */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/20 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-xs font-medium text-white">{course.duration || "3 Years"}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/20 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-xs font-medium text-white">{course.total_semesters} Semesters</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/20 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-xs font-medium text-white">{totalSubjects} Subjects</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-500" />
              Academic Semesters
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Step through the timeline to unlock indexed subjects and study materials</p>
          </div>
          <Badge variant="outline" className="text-xs bg-white">
            {semesters.length} Semesters
          </Badge>
        </div>

        {/* Semesters Grid - Unique Hover Effects */}
        {semesters.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <div className="inline-flex p-2.5 bg-slate-100 rounded-full mb-2">
              <Layers className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-0.5">No semesters mapped</h3>
            <p className="text-xs text-slate-500">Curriculum structures are pending administrative validation.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {semesters.map((semester, idx) => {
              const subjectsCount = semester.subjects?.length || 0;
              // Alternate gradient for visual variety
              const gradientClass = idx % 2 === 0 
                ? "from-slate-50 to-white" 
                : "from-white to-slate-50";
              
              return (
                <Link
                  key={semester.id}
                  to="/student/semester/$id"
                  params={{ id: semester.id }}
                  className="group block"
                >
                  <Card className={`h-full border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br ${gradientClass}`}>
                    <div className="p-4 flex items-start gap-3 relative">
                      {/* Semester Number - Unique Design */}
                      <div className="relative">
                        <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                          <span className="text-lg font-bold text-white">{semester.semester_number}</span>
                        </div>
                        {/* Decorative dot */}
                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors text-sm line-clamp-1">
                          {semester.title || `Semester ${semester.semester_number}`}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <BookOpen className="h-3 w-3" />
                            <span>{subjectsCount} {subjectsCount === 1 ? "Subject" : "Subjects"}</span>
                          </div>
                          {subjectsCount > 5 && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                              <Zap className="h-2.5 w-2.5" />
                              <span>Popular</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Arrow with unique hover animation */}
                      <div className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300 shrink-0">
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                    
                    {/* Unique progress bar at bottom (visual flair) */}
                    <div className="h-0.5 bg-slate-100 w-full">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 group-hover:w-full" 
                        style={{ width: `${(subjectsCount / (Math.max(...semesters.map(s => s.subjects?.length || 0), 1))) * 100}%` }}
                      />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Additional Unique Section: Quick Stats or Featured */}
        {semesters.length > 0 && (
          <div className="mt-8 pt-4 border-t border-slate-200">
            <div className="bg-white/50 rounded-xl p-4 border border-slate-200 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Star className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Learning Resources</p>
                  <p className="text-sm font-bold text-slate-800">{totalSubjects} Subjects Across {semesters.length} Semesters</p>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}