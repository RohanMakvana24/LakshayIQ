import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ArrowRight, Clock, GraduationCap, Layers, Sparkles, BookOpen, Star, Zap } from "lucide-react";
import { PageLoader } from "@/components/page-loader";
import { ShareCourse } from "@/components/share-course";


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
  const totalSubjects = semesters.reduce((acc: number, s: any) => acc + (s.subjects?.length || 0), 0);

  return (
    <div className="w-full py-2">
        
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

        {/* Hero Section - Compact & Modern */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/[0.02] via-card to-emerald-500/[0.01] border border-border/80 overflow-hidden mb-6 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.03)] dark:shadow-none">
          {/* Decorative background grid */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left Content */}
              <div className="flex-1 space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-full px-2.5 py-0.5">
                  <Sparkles className="h-3 w-3" />
                  <span className="text-[10px] font-bold tracking-wide uppercase">
                    {course.slug?.toUpperCase() || "DEGREE PROGRAM"}
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-foreground">
                  {course.name}
                </h1>
                <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
                  {course.description || "Explore curated modular semesters, core textbook topics, and structured examination blueprints."}
                </p>
              </div>

              {/* Right: Stats Badges */}
              <div className="flex flex-wrap gap-3 shrink-0 items-center">
                <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.01)] min-w-[90px] justify-center">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-black text-foreground">{course.duration || "3 Years"}</span>
                </div>
                <div className="bg-violet-500/[0.03] dark:bg-violet-500/[0.02] border border-violet-500/10 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.01)] min-w-[90px] justify-center">
                  <Layers className="h-4 w-4 text-violet-500" />
                  <span className="text-xs font-black text-foreground">{course.total_semesters} Semesters</span>
                </div>
                <div className="bg-blue-500/[0.03] dark:bg-blue-500/[0.02] border border-blue-500/10 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.01)] min-w-[90px] justify-center">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-black text-foreground">{totalSubjects} Subjects</span>
                </div>
                <ShareCourse courseName={course.name} courseId={course.id} />
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-500" />
              Academic Semesters
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Step through the timeline to unlock indexed subjects and study materials</p>
          </div>
          <Badge variant="outline" className="text-xs bg-card border-border/80">
            {semesters.length} Semesters
          </Badge>
        </div>

        {/* Semesters Grid */}
        {semesters.length === 0 ? (
          <div className="text-center py-12 bg-card/70 backdrop-blur-md rounded-2xl border border-border">
            <div className="inline-flex p-2.5 bg-muted rounded-full mb-2">
              <Layers className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-0.5">No semesters mapped</h3>
            <p className="text-xs text-muted-foreground">Curriculum structures are pending administrative validation.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {semesters.map((semester: any, idx: number) => {
              const subjectsCount = semester.subjects?.length || 0;
              
              return (
                <Link
                  key={semester.id}
                  to="/student/semester/$id"
                  params={{ id: semester.id }}
                  className="group block"
                >
                  <Card className="h-full border border-border/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.01)] overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-emerald-500/5 hover:-translate-y-1.5 hover:border-emerald-500/30 bg-card/75 backdrop-blur-sm">
                    <div className="p-4 flex items-start gap-3 relative">
                      {/* Semester Number - Unique Design */}
                      <div className="relative">
                        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                          <span className="text-lg font-bold text-primary-foreground">{semester.semester_number}</span>
                        </div>
                        {/* Decorative dot */}
                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-foreground group-hover:text-emerald-500 transition-colors text-sm line-clamp-1">
                          {semester.title || `Semester ${semester.semester_number}`}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <BookOpen className="h-3 w-3" />
                            <span>{subjectsCount} {subjectsCount === 1 ? "Subject" : "Subjects"}</span>
                          </div>
                          {subjectsCount > 5 && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                              <Zap className="h-2.5 w-2.5" />
                              <span>Popular</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Arrow with unique hover animation */}
                      <div className="h-7 w-7 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all duration-300 shrink-0">
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                    
                    {/* Unique progress bar at bottom (visual flair) */}
                    <div className="h-0.5 bg-muted w-full">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 group-hover:w-full" 
                        style={{ width: `${(subjectsCount / (Math.max(...semesters.map((s: any) => s.subjects?.length || 0), 1))) * 100}%` }}
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
          <div className="mt-8 pt-4 border-t border-border/80">
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/80 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Star className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Learning Resources</p>
                  <p className="text-sm font-bold text-foreground">{totalSubjects} Subjects Across {semesters.length} Semesters</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}