import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Download,
  FileText,
  ArrowRight,
  Layers,
  Sparkles,
  Video,
  FileCheck,
  HelpCircle,
  AlertCircle,
  Search,
  SlidersHorizontal,
  BookOpen,
} from "lucide-react";
import { PageLoader } from "@/components/page-loader";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/_authenticated/student/subject/$id")({
  loader: async ({ params }) => {
    const { data: subject, error: subError } = await supabase
      .from("subjects")
      .select("id, semester_id, name, subject_code, slug, description, thumbnail_url")
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
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"number-asc" | "number-desc" | "title-asc">("number-asc");

  const filteredAndSortedUnits = useMemo(() => {
    let result = [...units];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.title.toLowerCase().includes(query) ||
          (u.description && u.description.toLowerCase().includes(query))
      );
    }

    if (sortBy === "number-asc") {
      result.sort((a, b) => a.unit_number - b.unit_number);
    } else if (sortBy === "number-desc") {
      result.sort((a, b) => b.unit_number - a.unit_number);
    } else if (sortBy === "title-asc") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [units, searchQuery, sortBy]);

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
              { label: semester.title || `Sem ${semester.semester_number}`, to: "/student/semester/$id", params: { id: semester.id } },
              { label: subject.subject_code || "Subject" },
            ]}
          />
        </div>

        {/* Hero Section - Icon removed */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden mb-6 shadow-lg">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-0 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl" />
          <div className="absolute bottom-0 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl" />
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%)] bg-[length:16px_16px]" />

          <div className="relative z-10 px-5 py-5 md:px-7 md:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left: Text only - no icon */}
              <div className="flex-1 space-y-2">
                {subject.subject_code && (
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 rounded-full px-2.5 py-0.5 border border-emerald-500/30">
                    <Sparkles className="h-3 w-3 text-emerald-300" />
                    <span className="text-[10px] font-semibold tracking-wide text-emerald-200">
                      {subject.subject_code.toUpperCase()}
                    </span>
                  </div>
                )}
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                  {subject.name}
                </h1>
                <p className="text-slate-300 text-xs md:text-sm max-w-2xl line-clamp-2">
                  {subject.description || "In-depth dynamic syllabus, structural lesson trackers, archive resources, and evaluation roadmaps."}
                </p>
              </div>

              {/* Right: Stats Badge */}
              <div className="shrink-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm font-bold text-white">{units.length}</span>
                  <span className="text-xs text-slate-300">Syllabus Units</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Previous Year Papers & Exam Timetable - Two column grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
          {/* Previous Year Question Papers */}
          <Card className="border border-slate-200/80 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <h2 className="font-semibold text-sm text-slate-800">Previous Year Papers</h2>
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono bg-slate-100 text-slate-600">
                {papers.length} Papers
              </Badge>
            </div>
            <div className="p-4">
              {papers.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8 rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
                  <HelpCircle className="h-6 w-6 text-slate-300 mb-1" />
                  <p className="text-xs font-medium text-slate-500">No question papers uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {papers.map((paper) => (
                    <div key={paper.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-300 transition-all">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-700 truncate">{paper.title}</p>
                          <p className="text-[10px] text-slate-400">{paper.year}</p>
                        </div>
                      </div>
                      {paper.file_url && (
                        <a href={paper.file_url} target="_blank" rel="noreferrer" className="shrink-0">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg">
                            <Download className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Exam Timetable */}
          <Card className="border border-slate-200/80 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <h2 className="font-semibold text-sm text-slate-800">Exam Timetable</h2>
              </div>
            </div>
            <div className="p-4">
              {timetables.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8 rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
                  <AlertCircle className="h-6 w-6 text-slate-300 mb-1" />
                  <p className="text-xs font-medium text-slate-500">Schedule not announced</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {timetables.map((sched) => (
                    <div key={sched.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-700 truncate">{sched.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {sched.exam_start_date ? new Date(sched.exam_start_date).toLocaleDateString() : "TBD"}
                        </p>
                      </div>
                      {sched.file_url && (
                        <a href={sched.file_url} target="_blank" rel="noreferrer" className="shrink-0">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg">
                            <Download className="h-3.5 w-3.5 text-slate-500" />
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

        {/* Syllabus Units Section with Search & Sort */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-500" />
                Syllabus Units
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Drill into specific units to stream instructional video sets and download summary assets</p>
            </div>
            
            {/* Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search units..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs w-full sm:w-48 border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                <SlidersHorizontal className="h-3 w-3 text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-medium text-slate-600 focus:outline-none"
                >
                  <option value="number-asc">Unit Number (Asc)</option>
                  <option value="number-desc">Unit Number (Desc)</option>
                  <option value="title-asc">Title (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {filteredAndSortedUnits.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <div className="inline-flex p-2.5 bg-slate-100 rounded-full mb-2">
                <Layers className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-0.5">No units match your criteria</h3>
              <p className="text-xs text-slate-500">Try adjusting your search terms.</p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1">
              {filteredAndSortedUnits.map((unit) => {
                const videosCount = unit.unit_videos?.length || 0;
                const materialsCount = unit.unit_materials?.length || 0;
                return (
                  <Link
                    key={unit.id}
                    to="/student/unit/$id"
                    params={{ id: unit.id }}
                    className="group block"
                  >
                    <Card className="border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-white">
                      <div className="p-4 flex items-center gap-4">
                        {/* Unit Number Circle */}
                        <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <span className="text-sm font-bold text-white">{unit.unit_number}</span>
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors text-sm truncate">
                            {unit.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Video className="h-3 w-3" /> {videosCount} Videos
                            </span>
                            <span className="flex items-center gap-1">
                              <FileCheck className="h-3 w-3" /> {materialsCount} Materials
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}