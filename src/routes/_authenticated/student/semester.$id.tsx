import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  BookMarked,
  GraduationCap,
  Layers,
  Sparkles,
  Search,
  SlidersHorizontal,
  BookOpen,
} from "lucide-react";
import { PageLoader } from "@/components/page-loader";
import { useState, useMemo } from "react";
import { ShareButton } from "@/components/share-course";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "units-desc" | "units-asc">("name-asc");

  const totalUnits = useMemo(() => {
    return subjects.reduce((acc: number, s: any) => acc + (s.units?.length || 0), 0);
  }, [subjects]);

  const filteredAndSortedSubjects = useMemo(() => {
    let result = [...subjects];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          (s.subject_code && s.subject_code.toLowerCase().includes(query)) ||
          (s.description && s.description.toLowerCase().includes(query))
      );
    }

    if (sortBy === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "units-desc") {
      result.sort((a, b) => (b.units?.length || 0) - (a.units?.length || 0));
    } else if (sortBy === "units-asc") {
      result.sort((a, b) => (a.units?.length || 0) - (b.units?.length || 0));
    }

    return result;
  }, [subjects, searchQuery, sortBy]);

  return (
    <div className="w-full py-2">
        
        {/* Breadcrumb */}
        <div className="mb-4">
          <BreadcrumbNav
            items={[
              { label: "Dashboard", to: "/student" },
              { label: university.name, to: "/student/university/$id", params: { id: university.id } },
              { label: course.slug || "Course", to: "/student/course/$id", params: { id: course.id } },
              { label: semester.title || `Semester ${semester.semester_number}` },
            ]}
          />
        </div>

        {/* Hero Section */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/[0.02] via-card to-emerald-500/[0.01] border border-border/80 overflow-hidden mb-6 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.03)] dark:shadow-none">
          {/* Decorative background grid */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1 space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-full px-2.5 py-0.5">
                  <Sparkles className="h-3 w-3" />
                  <span className="text-[10px] font-bold tracking-wide uppercase">
                    ACADEMIC TIMELINE
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-foreground">
                  {semester.title || `Semester ${semester.semester_number}`}
                </h1>
                <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
                  Curriculum mapping framework for <span className="text-foreground font-semibold">{course.name}</span>. Select any core module below to extract dynamic units, videos, and study papers.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0 items-center">
                <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.01)] min-w-[90px] justify-center">
                  <BookOpen className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-black text-foreground">{subjects.length} Subjects</span>
                </div>
                <div className="bg-violet-500/[0.03] dark:bg-violet-500/[0.02] border border-violet-500/10 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.01)] min-w-[90px] justify-center">
                  <Layers className="h-4 w-4 text-violet-500" />
                  <span className="text-xs font-black text-foreground">{totalUnits} Units</span>
                </div>
                <ShareButton
                  title={semester.title || `Semester ${semester.semester_number}`}
                  type="Semester"
                  path={`/student/semester/${semester.id}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-card/70 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-border/80 p-3 flex flex-col sm:flex-row items-center gap-3 mb-5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search subjects by name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 border-border bg-card/50 text-foreground rounded-lg text-sm focus-visible:ring-emerald-500/20"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5">
              <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-medium text-muted-foreground focus:outline-none"
              >
                <option value="name-asc">Alphabetical (A-Z)</option>
                <option value="units-desc">Units: High to Low</option>
                <option value="units-asc">Units: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-muted-foreground">
            Showing <span className="text-foreground font-semibold">{filteredAndSortedSubjects.length}</span> of <span className="text-foreground font-semibold">{subjects.length}</span> subjects
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-emerald-500 hover:text-emerald-600 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Subjects Grid */}
        {filteredAndSortedSubjects.length === 0 ? (
          <div className="text-center py-12 bg-card/70 backdrop-blur-md rounded-2xl border border-border shadow-sm">
            <div className="inline-flex p-2.5 bg-muted rounded-full mb-2">
              <BookMarked className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-0.5">
              No subjects match your criteria
            </h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search terms or filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedSubjects.map((subject) => {
              const unitsCount = subject.units?.length || 0;
              return (
                <Link
                  key={subject.id}
                  to="/student/subject/$id"
                  params={{ id: subject.id }}
                  className="group block"
                >
                  <Card className="h-full border border-border/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden bg-card/75 backdrop-blur-sm">
                    <div className="p-5">
                      {/* Top row: Icon + Subject Code */}
                      <div className="flex items-start justify-between gap-3">
                        {/* Icon */}
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center overflow-hidden shrink-0 transition-transform group-hover:scale-105">
                          {subject.thumbnail_url ? (
                            <img
                              src={subject.thumbnail_url}
                              alt={subject.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.className =
                                    "h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center";
                                  const icon = document.createElement("div");
                                  icon.innerHTML =
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M2 13l10 5 10-5"/><path d="M2 18l10 5 10-5"/></svg>';
                                  parent.appendChild(icon);
                                }
                              }}
                            />
                          ) : (
                            <Layers className="h-5 w-5 text-emerald-500" />
                          )}
                        </div>
                        {subject.subject_code && (
                          <Badge variant="secondary" className="text-[10px] font-mono bg-secondary text-muted-foreground border-border">
                            {subject.subject_code}
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="mt-4 space-y-1.5">
                        <h3 className="font-extrabold text-foreground group-hover:text-emerald-500 transition-colors text-sm line-clamp-2">
                          {subject.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {subject.description ||
                            "Access tailored core syllabus content, quick-review PDFs, and high-priority examination materials."}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border/60">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-bold">
                          <BookOpen className="h-3 w-3 text-muted-foreground" />
                          <span>{unitsCount} {unitsCount === 1 ? "Unit" : "Units"}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
    </div>
  );
}