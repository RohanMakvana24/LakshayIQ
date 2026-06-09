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
import { ShareButton } from "@/components/share-course";

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
    <div className="w-full py-2">
        
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

        {/* Hero Section */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/[0.02] via-card to-emerald-500/[0.01] border border-border/80 overflow-hidden mb-6 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.03)] dark:shadow-none">
          {/* Decorative background grid */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1 space-y-2">
                {subject.subject_code && (
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-full px-2.5 py-0.5">
                    <Sparkles className="h-3 w-3" />
                    <span className="text-[10px] font-bold tracking-wide uppercase">
                      {subject.subject_code}
                    </span>
                  </div>
                )}
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-foreground">
                  {subject.name}
                </h1>
                <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
                  {subject.description || "In-depth dynamic syllabus, structural lesson trackers, archive resources, and evaluation roadmaps."}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.01)] min-w-[90px] justify-center">
                  <Layers className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-black text-foreground">{units.length} Units</span>
                </div>
                <ShareButton
                  title={subject.name}
                  type="Subject"
                  path={`/student/subject/${subject.id}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Previous Year Papers & Exam Timetable - Two column grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
          {/* Previous Year Question Papers */}
          <Card className="border border-border/80 bg-card/70 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.01)] overflow-hidden">
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-extrabold text-sm text-foreground">Previous Year Papers</h2>
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono bg-secondary text-muted-foreground border-border">
                {papers.length} Papers
              </Badge>
            </div>
            <div className="p-4">
              {papers.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8 rounded-lg border border-dashed border-border bg-muted/40">
                  <HelpCircle className="h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-xs font-medium text-muted-foreground">No question papers uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {papers.map((paper: any) => (
                    <div key={paper.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/80 hover:border-emerald-500/20 transition-all">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">{paper.title}</p>
                          <p className="text-[10px] text-muted-foreground">{paper.year}</p>
                        </div>
                      </div>
                      {paper.file_url && (
                        <a href={paper.file_url} target="_blank" rel="noreferrer" className="shrink-0">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg">
                            <Download className="h-3.5 w-3.5 text-muted-foreground" />
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
          <Card className="border border-border/80 bg-card/70 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.01)] overflow-hidden">
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-extrabold text-sm text-foreground">Exam Timetable</h2>
              </div>
            </div>
            <div className="p-4">
              {timetables.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8 rounded-lg border border-dashed border-border bg-muted/40">
                  <AlertCircle className="h-6 w-6 text-muted-foreground mb-1" />
                  <p className="text-xs font-medium text-muted-foreground">Schedule not announced</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {timetables.map((sched: any) => (
                    <div key={sched.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/80">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{sched.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {sched.exam_start_date ? new Date(sched.exam_start_date).toLocaleDateString() : "TBD"}
                        </p>
                      </div>
                      {sched.file_url && (
                        <a href={sched.file_url} target="_blank" rel="noreferrer" className="shrink-0">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg">
                            <Download className="h-3.5 w-3.5 text-muted-foreground" />
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
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-500" />
                Syllabus Units
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Drill into specific units to stream instructional video sets and download summary assets</p>
            </div>
            
            {/* Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search units..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs w-full sm:w-48 border-border bg-card/50 text-foreground rounded-lg"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2 py-1">
                <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-medium text-muted-foreground focus:outline-none"
                >
                  <option value="number-asc">Unit Number (Asc)</option>
                  <option value="number-desc">Unit Number (Desc)</option>
                  <option value="title-asc">Title (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {filteredAndSortedUnits.length === 0 ? (
            <div className="text-center py-12 bg-card/70 backdrop-blur-md rounded-2xl border border-border">
              <div className="inline-flex p-2.5 bg-muted rounded-full mb-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-0.5">No units match your criteria</h3>
              <p className="text-xs text-muted-foreground">Try adjusting your search terms.</p>
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
                    <Card className="border border-border/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden bg-card/75 backdrop-blur-sm">
                      <div className="p-4 flex items-center gap-4">
                        {/* Unit Number Circle */}
                        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <span className="text-sm font-bold text-primary-foreground">{unit.unit_number}</span>
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-foreground group-hover:text-emerald-500 transition-colors text-sm truncate">
                            {unit.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground font-bold">
                            <span className="flex items-center gap-1">
                              <Video className="h-3.5 w-3.5" /> {videosCount} Videos
                            </span>
                            <span className="flex items-center gap-1">
                              <FileCheck className="h-3.5 w-3.5" /> {materialsCount} Materials
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors shrink-0" />
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