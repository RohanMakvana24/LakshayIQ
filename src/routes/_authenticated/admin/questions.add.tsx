import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, School, GraduationCap, Calendar, BookMarked, Layers, HelpCircle, FileText } from "lucide-react";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Database Relations Types
type University = { id: string; name: string };
type Course = { id: string; name: string; university_id: string; total_semesters: number };
type Sem = { id: string; course_id: string; semester_number: number; title: string | null };
type Subject = { id: string; semester_id: string; name: string; subject_code: string | null; slug: string };
type Unit = { id: string; subject_id: string; title: string; unit_number: number };

export const Route = createFileRoute("/_authenticated/admin/questions/add")({
  head: () => ({ meta: [{ title: "Add Important Questions — Lakshay IQ" }] }),
  component: AddQuestion,
});

function AddQuestion() {
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);

  // Master Data Fetching from Supabase
  const { data: universities, loading: loadingUniversities } = useSupabaseTable<University>("universities", { orderBy: "name" });
  const { data: allCourses } = useSupabaseTable<Course>("courses", { orderBy: "name" });
  const { data: allSemesters } = useSupabaseTable<Sem>("semesters");
  const { data: allSubjects } = useSupabaseTable<Subject>("subjects", { orderBy: "name", ascending: true });
  const { data: allUnits } = useSupabaseTable<Unit>("units");

  // Cascading Selection States
  const [universityId, setUniversityId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [semester, setSemester] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [unitId, setUnitId] = useState("");

  // Dynamic Filtered Option Lists
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [filteredSemesters, setFilteredSemesters] = useState<Sem[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);

  // Core Question Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("important");
  const [marks, setMarks] = useState("1");
  const [year, setYear] = useState<number | "">("");
  const [questionFileUrl, setQuestionFileUrl] = useState("");

  // 1. University changes -> filter courses
  useEffect(() => {
    if (universityId && allCourses) {
      setFilteredCourses(allCourses.filter(c => c.university_id === universityId));
    } else {
      setFilteredCourses([]);
    }
    setCourseId("");
    setSemester("");
    setSubjectId("");
    setUnitId("");
  }, [universityId, allCourses]);

  // 2. Course changes -> filter semesters
  useEffect(() => {
    if (courseId && allSemesters) {
      const filtered = allSemesters.filter(s => s.course_id === courseId)
        .sort((a, b) => a.semester_number - b.semester_number);
      setFilteredSemesters(filtered);
    } else {
      setFilteredSemesters([]);
    }
    setSemester("");
    setSubjectId("");
    setUnitId("");
  }, [courseId, allSemesters]);

  // 3. Semester changes -> filter subjects
  useEffect(() => {
    if (courseId && semester && allSemesters && allSubjects) {
      const targetSem = allSemesters.find(
        s => s.course_id === courseId && s.semester_number === Number(semester)
      );
      if (targetSem) {
        setFilteredSubjects(allSubjects.filter(s => s.semester_id === targetSem.id));
      } else {
        setFilteredSubjects([]);
      }
    } else {
      setFilteredSubjects([]);
    }
    setSubjectId("");
    setUnitId("");
  }, [courseId, semester, allSemesters, allSubjects]);

  // 4. Subject changes -> filter units
  useEffect(() => {
    if (subjectId && allUnits) {
      const filtered = allUnits.filter(u => u.subject_id === subjectId)
        .sort((a, b) => a.unit_number - b.unit_number);
      setFilteredUnits(filtered);
    } else {
      setFilteredUnits([]);
    }
    setUnitId("");
  }, [subjectId, allUnits]);

  // Submit and insert question file
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId) {
      toast.error("Please select a target Unit.");
      return;
    }
    const fileUrl = questionFileUrl.trim();
    if (!fileUrl) {
      toast.error("Please enter a GitHub Raw Markdown URL.");
      return;
    }

    let finalTitle = title.trim();
    if (!finalTitle) {
      finalTitle = fileUrl.split("/").pop()?.replace(/\.md$/i, "").replace(/[-_]/g, " ") || "Important Questions File";
      finalTitle = finalTitle.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") + " File";
    }

    setSaving(true);
    try {
      const payload = [{
        unit_id: unitId,
        question_text: finalTitle,
        category,
        year: year === "" ? null : Number(year),
        question_file_url: fileUrl,
        marks: Number(marks),
      }];

      const { error } = await supabase.from("important_questions").insert(payload);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Successfully saved Important Questions File URL");
        nav({ to: "/admin/questions" });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const selectedUnitData = filteredUnits.find(u => u.id === unitId);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col gap-6 w-full max-w-full px-2 antialiased">

      {/* Top Header Panel Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 text-slate-500 hover:text-slate-900 pl-0 gap-1">
            <Link to="/admin/questions">
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" /> Back to Questions Hub
            </Link>
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">Add Important Questions</h1>
          <p className="text-xs text-slate-500 mt-0.5">Index important, repeated, or exam-level questions by academic modules.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold px-4" asChild>
            <Link to="/admin/questions">Cancel</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={saving || !unitId || !questionFileUrl.trim()}
            className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs font-semibold px-5 shadow-sm transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deploying File...
              </span>
            ) : "Deploy Questions File"}
          </Button>
        </div>
      </div>

      {/* Grid Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 w-full">

        {/* Left Form Panel */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* STEP 1: University & Course */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <School className="h-3.5 w-3.5 text-slate-400" />
                    <span>University *</span>
                  </Label>
                  <Select value={universityId} onValueChange={setUniversityId}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs bg-white">
                      <SelectValue placeholder={loadingUniversities ? "Loading..." : "Select University"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white shadow-md">
                      {universities?.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id} className="text-xs cursor-pointer">{uni.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                    <span>Course *</span>
                  </Label>
                  <Select value={courseId} onValueChange={setCourseId} disabled={!universityId}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs bg-white">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white shadow-md">
                      {filteredCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id} className="text-xs cursor-pointer">{course.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* STEP 2: Semester, Subject & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Semester *</span>
                  </Label>
                  <Select value={semester} onValueChange={setSemester} disabled={!courseId || filteredSemesters.length === 0}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs bg-white">
                      <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white shadow-md">
                      {filteredSemesters.map((sem) => (
                        <SelectItem key={sem.id} value={String(sem.semester_number)} className="text-xs cursor-pointer">
                          Sem {sem.semester_number} {sem.title ? `(${sem.title})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <BookMarked className="h-3.5 w-3.5 text-slate-400" />
                    <span>Subject *</span>
                  </Label>
                  <Select value={subjectId} onValueChange={setSubjectId} disabled={!semester}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs bg-white">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white shadow-md max-h-[220px]">
                      {filteredSubjects.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs cursor-pointer">
                          {s.subject_code ? `[${s.subject_code}] ` : ""}{s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    <span>Unit *</span>
                  </Label>
                  <Select value={unitId} onValueChange={setUnitId} disabled={!subjectId}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs bg-white">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white shadow-md max-h-[220px]">
                      {filteredUnits.map((u) => (
                        <SelectItem key={u.id} value={u.id} className="text-xs cursor-pointer">
                          Unit {u.unit_number} - {u.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-slate-100 my-2 pt-2" />

              {/* STEP 3: Questions File Details */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>Questions File Title / Description (Optional)</span>
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Unit 1 Important Questions (leave blank to auto-derive from filename)"
                    className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>GitHub Raw Markdown (.md) URL / Attachment URL *</span>
                  </Label>
                  <Input
                    value={questionFileUrl}
                    onChange={(e) => setQuestionFileUrl(e.target.value)}
                    placeholder="https://raw.githubusercontent.com/.../questions.md"
                    className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 leading-normal block pl-1">
                    Please provide the raw URL. Typically starts with <code>https://raw.githubusercontent.com/</code> or similar file hosting address.
                  </span>
                </div>
              </div>

              {/* STEP 4: Parameters (Marks, Category, Year) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Marks *</Label>
                  <Select value={marks} onValueChange={setMarks}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white shadow-md">
                      <SelectItem value="1">1 Mark (🌱 Beginner)</SelectItem>
                      <SelectItem value="2">2 Marks (⚡ Intermediate)</SelectItem>
                      <SelectItem value="3">3 Marks (🎯 Advanced)</SelectItem>
                      <SelectItem value="5">5 Marks (🏆 Expert)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-white shadow-md">
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="repeated">Repeated</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Exam Year</Label>
                  <Input
                    type="number"
                    min={1990}
                    max={2100}
                    value={year}
                    onChange={(e) => setYear(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 2024"
                    className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 bg-white"
                  />
                </div>
              </div>

            </form>
          </Card>
        </div>

        {/* Right Sidebar: Dynamic Preview */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 px-1">
            <HelpCircle className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Mockup View</span>
          </div>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl bg-white p-5 space-y-4">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5 truncate pr-2">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-widest block">Linked Module Unit</span>
                <h3 className="text-xs font-black text-slate-800 truncate">
                  {selectedUnitData ? `Unit ${selectedUnitData.unit_number} · ${selectedUnitData.title}` : "No Unit Linked"}
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-200/50 rounded-md font-mono text-slate-600 flex-shrink-0">
                {marks} Marks
              </span>
            </div>

            {/* Questions list simulation */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
              {questionFileUrl.trim() !== "" ? (
                <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[8px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md">
                      {category} file
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                        Markdown (.md)
                      </span>
                      {year && (
                        <span className="text-[8px] font-mono font-bold text-slate-400">Year: {year}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      {title.trim() || (() => {
                        let autoTitle = questionFileUrl.split("/").pop()?.replace(/\.md$/i, "").replace(/[-_]/g, " ") || "Important Questions File";
                        return autoTitle.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") + " File";
                      })()}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate leading-none">
                      Url: {questionFileUrl}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-400">Enter a Markdown file URL to see the mockup preview.</p>
                </div>
              )}
            </div>

            <div className={cn(
              "p-3 rounded-xl border text-[10px] leading-normal flex items-center justify-center text-center font-medium transition-all",
              unitId && questionFileUrl.trim() !== ""
                ? "bg-emerald-50/40 border-emerald-100 text-emerald-600"
                : "bg-amber-50/40 border-amber-100 text-amber-600"
            )}>
              {unitId && questionFileUrl.trim() !== ""
                ? "Questions validation integrity check: PASS. Ready to deploy."
                : "Awaiting valid inputs and unit associations before question registration."}
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}
