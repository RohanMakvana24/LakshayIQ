import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, Trash2, School, GraduationCap, Calendar, BookMarked, Layers, Sparkles, HelpCircle, ClipboardPaste, CheckCircle2, X } from "lucide-react";
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
  const [questions, setQuestions] = useState<string[]>([""]);
  const [category, setCategory] = useState("important");
  const [marks, setMarks] = useState("1");
  const [year, setYear] = useState<number | "">("");
  const [questionFileUrl, setQuestionFileUrl] = useState("");

  // ── Bulk Import State ─────────────────────────────────
  const [bulkText, setBulkText] = useState("");
  const [bulkParsed, setBulkParsed] = useState<string[]>([]);
  const [bulkError, setBulkError] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);

  /** Parse numbered question list like:
   *  1.\nQuestion text here\n\n2.\nAnother question\n...
   */
  const parseBulkText = (raw: string): string[] => {
    // Split on lines starting with a number followed by '.' (e.g. '1.' or '10.')
    const parts = raw
      .split(/\n?\s*\d+\.\s*\n?/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return parts;
  };

  const handleBulkImport = () => {
    const parsed = parseBulkText(bulkText);
    if (parsed.length === 0) {
      setBulkError("No questions detected. Make sure each question starts with a number like \"1.\" \"2.\" etc.");
      return;
    }
    setBulkError("");
    setBulkParsed(parsed);
  };

  const applyBulkImport = () => {
    if (bulkParsed.length === 0) return;
    setQuestions(bulkParsed);
    setBulkText("");
    setBulkParsed([]);
    setShowBulkImport(false);
  };

  const cancelBulkImport = () => {
    setBulkText("");
    setBulkParsed([]);
    setBulkError("");
    setShowBulkImport(false);
  };

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

  // Questions dynamic fields management
  const addQuestionField = () => setQuestions([...questions, ""]);
  const removeQuestionField = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, idx) => idx !== index));
    }
  };
  const handleQuestionChange = (index: number, val: string) => {
    const updated = [...questions];
    updated[index] = val;
    setQuestions(updated);
  };

  // Submit and bulk insert questions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId) {
      toast.error("Please select a target Unit.");
      return;
    }
    const validQuestions = questions.filter(q => q.trim() !== "");
    if (validQuestions.length === 0) {
      toast.error("Please enter at least one question.");
      return;
    }

    setSaving(true);
    try {
      const payload = validQuestions.map(q => ({
        unit_id: unitId,
        question_text: q.trim(),
        category,
        year: year === "" ? null : Number(year),
        question_file_url: questionFileUrl || null,
        marks: Number(marks),
      }));

      const { error } = await supabase.from("important_questions").insert(payload);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Successfully saved ${validQuestions.length} question(s)`);
        nav({ to: "/admin/questions" });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving questions.");
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
            disabled={saving || !unitId || questions.filter(q => q.trim() !== "").length === 0}
            className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs font-semibold px-5 shadow-sm transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deploying Questions...
              </span>
            ) : `Deploy ${questions.filter(q => q.trim() !== "").length} Question(s)`}
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

              {/* STEP 3: Bulk Import + Multiple Question Entries */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                    <span>Questions Pool *</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkImport((v) => !v)}
                      className="h-7 text-[10px] rounded-lg border-violet-200 hover:border-violet-500 text-violet-700 bg-violet-50/40 px-2.5 flex items-center gap-1"
                    >
                      <ClipboardPaste className="h-3 w-3" />
                      Bulk Paste
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addQuestionField}
                      className="h-7 text-[10px] rounded-lg border-emerald-200 hover:border-emerald-500 text-emerald-700 bg-emerald-50/20 px-2.5 flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Question
                    </Button>
                  </div>
                </div>

                {/* ── Bulk Import Panel ───────────────────── */}
                {showBulkImport && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/30 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-violet-800">Bulk Paste Questions</p>
                        <p className="text-[10px] text-violet-500 mt-0.5">
                          Paste your numbered list below — questions will be auto-detected
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={cancelBulkImport}
                        className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-violet-100 text-violet-400 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Format hint */}
                    <div className="rounded-lg bg-white border border-violet-100 px-3 py-2 text-[10px] text-slate-500 font-mono leading-relaxed">
                      <span className="text-violet-400 font-bold block mb-1">Expected Format:</span>
                      1.{"\n"}Explain the concept of class...{"\n\n"}2.{"\n"}Explain member variables...
                    </div>

                    {/* Paste textarea */}
                    <Textarea
                      value={bulkText}
                      onChange={(e) => { setBulkText(e.target.value); setBulkError(""); setBulkParsed([]); }}
                      placeholder={`Paste your numbered questions here...\n\n1.\nExplain the concept of class...\n\n2.\nExplain member variables...`}
                      rows={8}
                      className="text-xs border-violet-200 focus-visible:ring-0 focus-visible:border-violet-500 rounded-lg bg-white font-mono resize-y"
                    />

                    {bulkError && (
                      <p className="text-[11px] text-rose-600 bg-rose-50 rounded-lg px-3 py-2 border border-rose-100">{bulkError}</p>
                    )}

                    {/* Parsed preview */}
                    {bulkParsed.length > 0 && (
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 space-y-2">
                        <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {bulkParsed.length} question{bulkParsed.length !== 1 ? "s" : ""} detected — preview:
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {bulkParsed.map((q, i) => (
                            <div key={i} className="text-[10px] text-slate-700 bg-white rounded-md px-2 py-1.5 border border-emerald-100 flex gap-2">
                              <span className="font-black text-emerald-600 shrink-0">{i + 1}.</span>
                              <span className="line-clamp-2 leading-snug">{q}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleBulkImport}
                        disabled={!bulkText.trim()}
                        className="flex-1 h-8 text-xs rounded-lg border-violet-300 text-violet-700 hover:bg-violet-100"
                      >
                        Parse Questions
                      </Button>
                      {bulkParsed.length > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={applyBulkImport}
                          className="flex-1 h-8 text-xs rounded-lg bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          ✓ Fill {bulkParsed.length} Questions
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {questions.map((q, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <span className="h-7 w-7 rounded-lg bg-slate-200/60 text-slate-600 text-xs font-extrabold flex items-center justify-center shrink-0 mt-1">
                        {idx + 1}
                      </span>
                      <Textarea
                        required
                        rows={2}
                        value={q}
                        onChange={(e) => handleQuestionChange(idx, e.target.value)}
                        placeholder="Write exam question prompt here..."
                        className="text-xs border-slate-200 focus-visible:ring-0 focus-visible:border-slate-900 rounded-lg min-h-[50px] bg-white"
                      />
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestionField(idx)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0 mt-1 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 4: Parameters (Marks, Category, Year, File Url) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Question Attachment URL</Label>
                  <Input
                    value={questionFileUrl}
                    onChange={(e) => setQuestionFileUrl(e.target.value)}
                    placeholder="https://example.com/asset.pdf"
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
              {questions.filter(q => q.trim() !== "").length > 0 ? (
                questions.filter(q => q.trim() !== "").map((q, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[8px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md">
                        {category} question
                      </span>
                      {year && (
                        <span className="text-[8px] font-mono font-bold text-slate-400">Year: {year}</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      {q}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-400">Start writing a question to see the mockup preview.</p>
                </div>
              )}
            </div>

            <div className={cn(
              "p-3 rounded-xl border text-[10px] leading-normal flex items-center justify-center text-center font-medium transition-all",
              unitId && questions.filter(q => q.trim() !== "").length > 0
                ? "bg-emerald-50/40 border-emerald-100 text-emerald-600"
                : "bg-amber-50/40 border-amber-100 text-amber-600"
            )}>
              {unitId && questions.filter(q => q.trim() !== "").length > 0
                ? "Questions validation integrity check: PASS. Ready to deploy."
                : "Awaiting valid inputs and unit associations before question registration."}
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}
