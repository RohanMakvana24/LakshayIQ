import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  ArrowRight,
  Clock,
  Building2,
  Sparkles,
  Search,
  SlidersHorizontal,
  Layers,
  School,
  Library,
  GraduationCap,
  SwatchBook
} from "lucide-react";
import { PageLoader } from "@/components/page-loader";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/_authenticated/student/university/$id")({
  loader: async ({ params }) => {
    const { data: university, error: univError } = await supabase
      .from("universities")
      .select("id, name, slug, description, logo_url, banner_url, is_active")
      .eq("id", params.id)
      .single();

    if (univError || !university) {
      throw notFound();
    }

    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id, name, slug, duration, total_semesters, thumbnail_url, description")
      .eq("university_id", params.id)
      .order("name", { ascending: true });

    return {
      university,
      courses: courses || []
    };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.university?.name || "University"} — Lakshay IQ` }],
  }),
  pendingMs: 0,
  pendingComponent: () => <PageLoader label="Loading University" />,
  component: UniversityPage,
});

function UniversityPage() {
  const { university, courses } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "sem-desc" | "sem-asc">("name-asc");

  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query))
      );
    }

    if (sortBy === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "sem-desc") {
      result.sort((a, b) => (b.total_semesters || 0) - (a.total_semesters || 0));
    } else if (sortBy === "sem-asc") {
      result.sort((a, b) => (a.total_semesters || 0) - (b.total_semesters || 0));
    }

    return result;
  }, [courses, searchQuery, sortBy]);

  const totalSemesters = useMemo(() => {
    return courses.reduce((acc, c) => acc + (c.total_semesters || 0), 0);
  }, [courses]);

  return (
    <div className="min-h-screen w-full bg-slate-50/50">
      <div className="w-full px-4 py-4 md:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="mb-4">
          <BreadcrumbNav
            items={[
              { label: "Dashboard", to: "/student" },
              { label: university.name }
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
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl bg-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                {university.logo_url ? (
                  <img src={university.logo_url} alt={university.name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-slate-700" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 rounded-full px-2.5 py-0.5 border border-emerald-500/30">
                  <Sparkles className="h-3 w-3 text-emerald-300" />
                  <span className="text-[10px] font-semibold tracking-wide text-emerald-200">REGISTERED UNIVERSITY</span>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                  {university.name}
                </h1>
                <p className="text-slate-300 text-xs md:text-sm max-w-2xl">
                  {university.description || "Comprehensive educational programs and study resources are calibrated for this structural campus grid mapping."}
                </p>
              </div>

              <div className="flex gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20 text-center">
                  <School className="h-4 w-4 text-emerald-300 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{courses.length}</p>
                  <p className="text-[9px] text-slate-300 uppercase">Courses</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20 text-center">
                  <Layers className="h-4 w-4 text-emerald-300 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{totalSemesters}</p>
                  <p className="text-[9px] text-slate-300 uppercase">Semesters</p>
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
              placeholder="Search courses by name or description..."
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
                <option value="sem-desc">Semesters: High to Low</option>
                <option value="sem-asc">Semesters: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs font-medium text-slate-500">
            Showing <span className="text-slate-800">{filteredAndSortedCourses.length}</span> of <span className="text-slate-800">{courses.length}</span> programs
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Courses Grid */}
        {filteredAndSortedCourses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="inline-flex p-2.5 bg-slate-100 rounded-full mb-2">
              <BookOpen className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-0.5">No courses match your criteria</h3>
            <p className="text-xs text-slate-500">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedCourses.map((course) => (
              <Link
                key={course.id}
                to="/student/course/$id"
                params={{ id: course.id }}
                className="group block h-full"
              >
                <Card className="relative h-full flex flex-col justify-between border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-emerald-500/30 p-5">

                  {/* Accent Highlight Bar on Top Border */}
                  <div className="absolute top-0 left-0 right-0 h-[3.5px] bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                  {/* Header Row: Managed properly with a clean flex layout instead of absolute stacking */}
                  <div className="flex items-center justify-between gap-3 mb-4 w-full">
                    <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-emerald-600 transition-all duration-300">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.name}
                          className="h-full w-full object-cover rounded-xl"
                        />
                      ) : (
                        <SwatchBook className="h-5 w-5 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                      )}
                    </div>

                    {/* Responsive badge that safely cuts off or scales inside its own frame */}
                    <Badge className="text-[10px] font-bold tracking-wider bg-slate-100 hover:bg-slate-100 text-slate-600 border-none uppercase px-2 py-0.5 max-w-[140px] truncate block text-center rounded">
                      {course.slug || "DEGREE"}
                    </Badge>
                  </div>

                  {/* Body Text Context Area */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="mb-4">
                      {/* Course Title - Handled safely across lines without hard cuts */}
                      <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors text-base tracking-tight leading-snug mb-1.5 break-words">
                        {course.name}
                      </h3>
                      {/* Responsive body summary text */}
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {course.description || "Access textbook materials, structured questions, and analytical review papers tailored for this branch."}
                      </p>
                    </div>

                    {/* Bottom Status Grid Bar */}
                    <div className="flex items-center justify-between pt-3.5 border-t border-slate-100 w-full">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-600">
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{course.duration || "3 Years"}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          <Library className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{course.total_semesters || 6} Sem</span>
                        </div>
                      </div>

                      {/* Micro Interaction Arrow Anchor */}
                      <div className="h-7 w-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all duration-300 shrink-0 shadow-sm">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>

                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}