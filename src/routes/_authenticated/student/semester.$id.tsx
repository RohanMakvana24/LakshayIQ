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
    return subjects.reduce((acc, s) => acc + (s.units?.length || 0), 0);
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full px-4 py-4 md:px-6 lg:px-8">
        
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
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden mb-6 shadow-lg">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-0 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl" />
          <div className="absolute bottom-0 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl" />
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%)] bg-[length:16px_16px]" />

          <div className="relative z-10 px-5 py-5 md:px-7 md:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 rounded-full px-2.5 py-0.5 border border-emerald-500/30">
                  <Sparkles className="h-3 w-3 text-emerald-300" />
                  <span className="text-[10px] font-semibold tracking-wide text-emerald-200">
                    ACADEMIC TIMELINE
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                  {semester.title || `Semester ${semester.semester_number}`}
                </h1>
                <p className="text-slate-300 text-xs md:text-sm max-w-2xl">
                  Curriculum mapping framework for <span className="text-white font-semibold">{course.name}</span>. Select any core module below to extract dynamic units, videos, and study papers.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/20 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-xs font-medium text-white">{subjects.length} Subjects</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/20 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-xs font-medium text-white">{totalUnits} Units</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col sm:flex-row items-center gap-3 mb-5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search subjects by name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <SlidersHorizontal className="h-3 w-3 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-medium text-slate-600 focus:outline-none"
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
          <p className="text-xs text-slate-500">
            Showing {filteredAndSortedSubjects.length} of {subjects.length} subjects
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Subjects Grid - Icon based, no cover images */}
        {filteredAndSortedSubjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <div className="inline-flex p-2.5 bg-slate-100 rounded-full mb-2">
              <BookMarked className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-0.5">
              No subjects match your criteria
            </h3>
            <p className="text-xs text-slate-500">
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
                  <Card className="h-full border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-white">
                    <div className="p-4">
                      {/* Top row: Icon + Subject Code */}
                      <div className="flex items-start justify-between gap-3">
                        {/* Icon (thumbnail_url as small icon, not cover) */}
                        <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 transition-transform group-hover:scale-105">
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
                                    "h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center";
                                  const icon = document.createElement("div");
                                  icon.innerHTML =
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M2 13l10 5 10-5"/><path d="M2 18l10 5 10-5"/></svg>';
                                  parent.appendChild(icon);
                                }
                              }}
                            />
                          ) : (
                            <Layers className="h-5 w-5 text-slate-500" />
                          )}
                        </div>
                        {subject.subject_code && (
                          <Badge variant="secondary" className="text-[10px] font-mono bg-slate-100 text-slate-600 border-slate-200">
                            {subject.subject_code}
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="mt-3 space-y-1.5">
                        <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors text-sm line-clamp-2">
                          {subject.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {subject.description ||
                            "Access tailored core syllabus content, quick-review PDFs, and high-priority examination materials."}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <BookOpen className="h-3 w-3" />
                          <span>{unitsCount} {unitsCount === 1 ? "Unit" : "Units"}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}