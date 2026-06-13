import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, BookOpen, Layers, FileText, Hash, Eye, HelpCircle, School, GraduationCap, ClipboardCopy, Plus, Trash2, CheckCircle2, CalendarDays } from "lucide-react";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types matching structural requirements
type University = { id: string; name: string };
type Course = { id: string; name: string; university_id?: string };
type Subject = { id: string; name: string; subject_code: string | null; semester_id?: string };
type Semester = { id: string; course_id: string; title: string | null; semester_number: number };

export const Route = createFileRoute("/_authenticated/admin/units/add")({
  head: () => ({ meta: [{ title: "Add Academic Unit — Portal" }] }),
  component: AddUnit,
});

// Validation Schema matching database structural requirements
const UnitSchema = Yup.object().shape({
  universityId: Yup.string().required("University mapping is required"),
  courseId: Yup.string().required("Course mapping is required"),
  semesterId: Yup.string().required("Semester mapping is required"),
  subjectId: Yup.string().required("Target course subject mapping is required"),
  unitNumber: Yup.number()
    .min(1, "Unit counter index must be at least 1")
    .max(50, "Unit counter cannot exceed limits (Max 50)")
    .required("Unit number index is required"),
  title: Yup.string()
    .min(3, "Title should be at least 3 characters long")
    .required("Syllabus unit title is required"),
  description: Yup.string().max(1000, "Syllabus outline cannot exceed 1000 characters").nullable(),
});

function AddUnit() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("units");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [bulkText, setBulkText] = useState("");
  const [bulkUnits, setBulkUnits] = useState<Array<{ unitNumber: number; title: string; description: string }>>([]);

  // Fetching all relational data buckets
  const { data: universities, loading: loadingUnis } = useSupabaseTable<University>("universities", { orderBy: "name", ascending: true });
  const { data: courses, loading: loadingCourses } = useSupabaseTable<Course>("courses", { orderBy: "name", ascending: true });
  const { data: semesters } = useSupabaseTable<Semester>("semesters");
  const { data: subjects, loading: loadingSubjects } = useSupabaseTable<Subject>("subjects", { orderBy: "name", ascending: true });

  // Formik Configuration Core Engine for single mode
  const formik = useFormik({
    initialValues: {
      universityId: "",
      courseId: "",
      semesterId: "",
      subjectId: "",
      unitNumber: 1,
      title: "",
      description: "",
    },
    validationSchema: UnitSchema,
    onSubmit: async (values) => {
      try {
        setSaving(true);
        const ok = await insert({ 
          subject_id: values.subjectId, 
          unit_number: values.unitNumber, 
          title: values.title.trim(), 
          description: values.description.trim() || null 
        });

        if (ok) {
          nav({ to: "/admin/units" });
        }
      } catch (err) {
        console.error("Datastore Transaction Insertion Refusal:", err);
      } finally {
        setSaving(false);
      }
    },
  });

  // Bulk Parser Engine with deep regex heuristic matching
  const handleBulkTextChange = (text: string) => {
    setBulkText(text);
    if (!text.trim()) {
      setBulkUnits([]);
      return;
    }

    const lines = text.split("\n");
    const parsedUnits: Array<{ unitNumber: number; title: string; description: string }> = [];
    let currentUnit: { unitNumber: number; title: string; description: string } | null = null;
    let currentDescLines: string[] = [];

    const unitRegex = /^\s*(?:UNIT|Unit|Chapter|CHAPTER)\s*[-:]?\s*([0-9]+|[I|V|X]+)(?:\s*[-:]\s*|\s+)(.*)$/i;
    const numericPrefixRegex = /^\s*([0-9]+)\s*[-:]\s*(.*)$/;

    const romanToDecimal = (roman: string): number => {
      const map: Record<string, number> = { i: 1, v: 5, x: 10, l: 50 };
      const str = roman.toLowerCase();
      let total = 0;
      for (let i = 0; i < str.length; i++) {
        const current = map[str[i]] || 0;
        const next = map[str[i + 1]] || 0;
        if (current < next) {
          total += next - current;
          i++;
        } else {
          total += current;
        }
      }
      return total || 1;
    };

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const unitMatch = trimmed.match(unitRegex);
      const numPrefixMatch = trimmed.match(numericPrefixRegex);

      let foundHeader = false;
      let unitNum = 0;
      let title = "";

      if (unitMatch) {
        foundHeader = true;
        const rawNum = unitMatch[1];
        unitNum = parseInt(rawNum, 10);
        if (isNaN(unitNum)) {
          unitNum = romanToDecimal(rawNum);
        }
        title = unitMatch[2] ? unitMatch[2].trim() : `Unit ${unitNum}`;
      } else if (numPrefixMatch) {
        foundHeader = true;
        unitNum = parseInt(numPrefixMatch[1], 10);
        title = numPrefixMatch[2] ? numPrefixMatch[2].trim() : `Unit ${unitNum}`;
      }

      if (foundHeader) {
        if (currentUnit) {
          currentUnit.description = currentDescLines.join("\n").trim();
          parsedUnits.push(currentUnit);
        }
        currentUnit = {
          unitNumber: unitNum || (parsedUnits.length + 1),
          title: title || `Unit ${unitNum || (parsedUnits.length + 1)}`,
          description: "",
        };
        currentDescLines = [];
      } else {
        if (currentUnit) {
          currentDescLines.push(trimmed);
        } else {
          currentUnit = {
            unitNumber: 1,
            title: trimmed,
            description: "",
          };
          currentDescLines = [];
        }
      }
    }

    if (currentUnit) {
      currentUnit.description = currentDescLines.join("\n").trim();
      parsedUnits.push(currentUnit);
    }

    // Fallback: If no headers matched at all, split non-empty lines as individual unit titles
    if (parsedUnits.length === 0 || (parsedUnits.length === 1 && parsedUnits[0].description === "")) {
      const fallbackUnits = lines
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .map((titleText, index) => ({
          unitNumber: index + 1,
          title: titleText.length > 100 ? titleText.substring(0, 97) + "..." : titleText,
          description: titleText.length > 100 ? titleText : "",
        }));
      if (fallbackUnits.length > 0) {
        setBulkUnits(fallbackUnits);
        return;
      }
    }

    setBulkUnits(parsedUnits);
  };

  const updateBulkUnit = (index: number, field: "unitNumber" | "title" | "description", value: any) => {
    const updated = [...bulkUnits];
    updated[index] = {
      ...updated[index],
      [field]: field === "unitNumber" ? parseInt(value, 10) || 1 : value,
    };
    setBulkUnits(updated);
  };

  const removeBulkUnit = (index: number) => {
    setBulkUnits(bulkUnits.filter((_, i) => i !== index));
  };

  const addEmptyBulkUnit = () => {
    const nextNum = bulkUnits.length > 0 ? Math.max(...bulkUnits.map(u => u.unitNumber)) + 1 : 1;
    setBulkUnits([...bulkUnits, { unitNumber: nextNum, title: `New Unit ${nextNum}`, description: "" }]);
  };

  const handleBulkSave = async () => {
    if (!formik.values.subjectId) {
      toast.error("Please map a target academic subject first.");
      return;
    }
    if (bulkUnits.length === 0) {
      toast.error("No valid units parsed to insert.");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from("units").insert(
        bulkUnits.map(u => ({
          subject_id: formik.values.subjectId,
          unit_number: u.unitNumber,
          title: u.title.trim(),
          description: u.description.trim() || null
        }))
      );

      if (error) {
        toast.error(`Database insertion failure: ${error.message}`);
        return;
      }

      toast.success(`Successfully deployed ${bulkUnits.length} syllabus units!`);
      nav({ to: "/admin/units" });
    } catch (err) {
      console.error("Bulk insertion unexpected crash:", err);
      toast.error("An unexpected error occurred during bulk deployment.");
    } finally {
      setSaving(false);
    }
  };

  // 1. Filter courses based on selected University
  const filteredCourses = courses?.filter(
    (c) => c.university_id === formik.values.universityId
  ) ?? [];

  // 2. Filter semesters based on selected Course
  const filteredSemesters = semesters?.filter(
    (s) => s.course_id === formik.values.courseId
  ) ?? [];

  // 3. Filter subjects based on selected Semester
  const filteredSubjects = subjects?.filter(
    (sub) => sub.semester_id === formik.values.semesterId
  ) ?? [];

  // Helper to extract selected subject details for the live preview
  const selectedSubjectData = subjects?.find(s => s.id === formik.values.subjectId);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col gap-6 w-full max-w-full px-2 antialiased">
      
      {/* Top Controller Action Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 text-slate-500 hover:text-slate-900 pl-0 gap-1">
            <Link to="/admin/units">
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" /> Back to Units
            </Link>
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Deploy New Syllabus Unit</h1>
          <p className="text-xs text-slate-500 mt-0.5">Append structured chapters into academic course blocks and index metrics.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold px-4" asChild>
            <Link to="/admin/units">Cancel</Link>
          </Button>
          <Button 
            type="button" 
            size="sm"
            onClick={mode === "single" ? () => formik.handleSubmit() : handleBulkSave} 
            disabled={
              saving || 
              !formik.values.subjectId || 
              (mode === "single" ? (!formik.isValid || !formik.values.title) : bulkUnits.length === 0)
            }
            className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs font-semibold px-5 shadow-sm transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mating Nodes...
              </span>
            ) : mode === "single" ? "Save Unit Structure" : `Bulk Deploy ${bulkUnits.length} Units`}
          </Button>
        </div>
      </div>

      {/* Two Column Workspace Grid Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 w-full">
        
        {/* Left Control Column: Input Architecture (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* COMMON REGION: Course-Subject Relational Mapping Selector */}
          <Card className="p-6 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Academic Hierarchy Selection</span>
              
              {/* Dynamic Mode Switch Toggle */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setMode("single")}
                  className={cn(
                    "h-7 rounded-lg text-[10px] font-black px-3.5 uppercase tracking-wider transition-all",
                    mode === "single" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Single Unit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setMode("bulk")}
                  className={cn(
                    "h-7 rounded-lg text-[10px] font-black px-3.5 uppercase tracking-wider transition-all",
                    mode === "bulk" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Bulk Paste Mode
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Dynamic University Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <School className="h-3.5 w-3.5 text-slate-400" />
                  <span>Select University <span className="text-rose-500">*</span></span>
                </Label>
                <Select 
                  value={formik.values.universityId} 
                  onValueChange={(val) => {
                    formik.setFieldValue("universityId", val);
                    formik.setFieldValue("courseId", "");
                    formik.setFieldValue("semesterId", "");
                    formik.setFieldValue("subjectId", "");
                  }}
                >
                  <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs focus:ring-0 focus:border-slate-900 bg-white transition-all">
                    <SelectValue placeholder={loadingUnis ? "Fetching..." : "Select Hub"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white shadow-lg max-h-[220px]">
                    {universities?.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-slate-50 cursor-pointer">
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Dependent Course Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                  <span>Select Course <span className="text-rose-500">*</span></span>
                </Label>
                <Select 
                  value={formik.values.courseId} 
                  disabled={!formik.values.universityId || loadingCourses}
                  onValueChange={(val) => {
                    formik.setFieldValue("courseId", val);
                    formik.setFieldValue("semesterId", "");
                    formik.setFieldValue("subjectId", "");
                  }}
                >
                  <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs focus:ring-0 focus:border-slate-900 bg-white transition-all disabled:bg-slate-50 disabled:text-slate-400">
                    <SelectValue placeholder={!formik.values.universityId ? "Select Uni first" : "Select Course"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white shadow-lg max-h-[220px]">
                    {filteredCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-slate-50 cursor-pointer">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Dependent Semester Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  <span>Select Semester <span className="text-rose-500">*</span></span>
                </Label>
                <Select 
                  value={formik.values.semesterId} 
                  disabled={!formik.values.courseId}
                  onValueChange={(val) => {
                    formik.setFieldValue("semesterId", val);
                    formik.setFieldValue("subjectId", "");
                  }}
                >
                  <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs focus:ring-0 focus:border-slate-900 bg-white transition-all disabled:bg-slate-50 disabled:text-slate-400">
                    <SelectValue placeholder={!formik.values.courseId ? "Select Course first" : "Select Semester"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white shadow-lg max-h-[220px]">
                    {filteredSemesters.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-slate-50 cursor-pointer">
                        {s.title || `Semester ${s.semester_number}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Dependent Subject Selector Field */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                  <span>Target Subject <span className="text-rose-500">*</span></span>
                </Label>
                <Select 
                  value={formik.values.subjectId} 
                  disabled={!formik.values.semesterId || loadingSubjects}
                  onValueChange={(val) => formik.setFieldValue("subjectId", val)}
                >
                  <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs focus:ring-0 focus:border-slate-900 bg-white transition-all disabled:bg-slate-50 disabled:text-slate-400">
                    <SelectValue placeholder={!formik.values.semesterId ? "Select Semester first" : "Select Subject"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white shadow-lg max-h-[220px]">
                    {filteredSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-slate-50 cursor-pointer">
                        {s.subject_code ? `[${s.subject_code.toUpperCase()}] ` : ""}{s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* DYNAMIC REGION: Mode Form Toggle Content */}
          {mode === "single" ? (
            <Card className="p-6 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white">
              <form onSubmit={formik.handleSubmit} className="space-y-5">
                
                {/* Counter Index & Syllabus Title Dynamic Row Block */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-1">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5 text-slate-400" />
                      <span>Unit Index *</span>
                    </Label>
                    <Input 
                      name="unitNumber"
                      type="number" 
                      min={1} 
                      max={50} 
                      value={formik.values.unitNumber} 
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={cn(
                        "h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 transition-all bg-white",
                        formik.touched.unitNumber && formik.errors.unitNumber && "border-rose-400 focus-visible:border-rose-500"
                      )}
                    />
                    {formik.touched.unitNumber && formik.errors.unitNumber && (
                      <p className="text-[11px] font-medium text-rose-500">{formik.errors.unitNumber}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      <span>Syllabus Unit Title <span className="text-rose-500">*</span></span>
                    </Label>
                    <Input 
                      name="title"
                      value={formik.values.title} 
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., Object Oriented Programming Core Architecture"
                      className={cn(
                        "h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 transition-all bg-white",
                        formik.touched.title && formik.errors.title && "border-rose-400 focus-visible:border-rose-500"
                      )}
                    />
                    {formik.touched.title && formik.errors.title && (
                      <p className="text-[11px] font-medium text-rose-500">{formik.errors.title}</p>
                    )}
                  </div>
                </div>

                {/* Syllabus Overview Chapters Detailed Summary Block */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>Syllabus Index / Chapter Abstract Summary</span>
                  </Label>
                  <Textarea 
                    name="description"
                    rows={6} 
                    value={formik.values.description} 
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Outline explicit subject metrics, target structural chapters, or benchmark reference document allocations included inside this specific node..."
                    className={cn(
                      "border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 transition-all resize-none p-3 bg-white",
                      formik.touched.description && formik.errors.description && "border-rose-400 focus-visible:ring-rose-500/10"
                    )}
                  />
                  <div className="flex items-center justify-between mt-1 text-[10px] font-bold text-slate-400">
                    {formik.touched.description && formik.errors.description ? (
                      <p className="text-[11px] font-medium text-rose-500">{formik.errors.description}</p>
                    ) : <div />}
                    <span>{formik.values.description.length}/1000 chars</span>
                  </div>
                </div>

              </form>
            </Card>
          ) : (
            <Card className="p-6 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white space-y-6">
              {/* Paste Textarea Control */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ClipboardCopy className="h-4 w-4 text-emerald-500" />
                  <span>Paste Syllabus Text for Autoparsing</span>
                </Label>
                <Textarea
                  value={bulkText}
                  onChange={(e) => handleBulkTextChange(e.target.value)}
                  rows={8}
                  placeholder={`Paste multiple units here. Examples:
Unit 1: Introduction to Web Tech
HTML5 structure, semantic tags, and basic CSS styles.

Unit 2: Dynamic Interactivity
Javascript runtime core variables, closures, and async loops.`}
                  className="border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 transition-all p-3.5 bg-slate-50/50"
                />
                <p className="text-[10px] font-bold text-slate-400">
                  ⚡ Auto-parser supports "Unit 1: Title", Roman numerals "Unit II - Title", "Chapter 1", or simple plain lists!
                </p>
              </div>

              {/* Editable Parsed Result Pipeline */}
              {bulkUnits.length > 0 && (
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Parsed Drafts ({bulkUnits.length} Units Detected)
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addEmptyBulkUnit}
                      className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/50 gap-1 pl-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Manual Draft
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {bulkUnits.map((unit, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3 relative group"
                      >
                        {/* Remove Draft Node Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBulkUnit(index)}
                          className="absolute top-2 right-2 h-7 w-7 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          {/* Unit Index Input */}
                          <div className="sm:col-span-2">
                            <Label className="text-[9px] font-black uppercase text-slate-400">Index</Label>
                            <Input
                              type="number"
                              value={unit.unitNumber}
                              onChange={(e) => updateBulkUnit(index, "unitNumber", e.target.value)}
                              className="h-8 border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          {/* Unit Title Input */}
                          <div className="sm:col-span-10 pr-6">
                            <Label className="text-[9px] font-black uppercase text-slate-400">Title</Label>
                            <Input
                              type="text"
                              value={unit.title}
                              onChange={(e) => updateBulkUnit(index, "title", e.target.value)}
                              className="h-8 border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        {/* Unit Description Textarea */}
                        <div>
                          <Label className="text-[9px] font-black uppercase text-slate-400">Outline Outline/Syllabus chapters</Label>
                          <Textarea
                            value={unit.description}
                            onChange={(e) => updateBulkUnit(index, "description", e.target.value)}
                            rows={2}
                            className="border-slate-200 rounded-lg text-xs p-2 resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

        </div>

        {/* Right Preview Column: Live Structural Shell (5 Columns) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 px-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {mode === "single" ? "Live Course Sheet Preview" : "Bulk Batch Overview"}
            </span>
          </div>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl bg-white p-5 space-y-5">
            {/* Header Course Identification Tag */}
            <div className="border-b border-slate-100 pb-4">
              <span className="inline-flex items-center text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-md mb-2">
                {selectedSubjectData?.subject_code ? selectedSubjectData.subject_code.toUpperCase() : "REG-CODE"}
              </span>
              <h2 className="text-sm font-black text-slate-800 tracking-tight line-clamp-1">
                {selectedSubjectData?.name || "No Subject Selected"}
              </h2>
            </div>

            {mode === "single" ? (
              /* Simulated Live Unit Syllabus Component Output */
              <div className="p-4 bg-slate-50/50 border border-slate-200/60 rounded-xl space-y-3 relative group transition-all hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  {/* Numeric Badge Core Index Block */}
                  <div className="h-9 w-9 bg-slate-900 text-white rounded-lg flex flex-col items-center justify-center flex-shrink-0 shadow-sm select-none">
                    <span className="text-[9px] font-bold uppercase text-slate-400 leading-none">Unit</span>
                    <span className="text-sm font-black leading-none mt-0.5">{formik.values.unitNumber || "1"}</span>
                  </div>

                  <div className="space-y-1 flex-1">
                    <h4 className="text-xs font-extrabold text-slate-800 leading-snug line-clamp-2 uppercase tracking-tight">
                      {formik.values.title || "Untitled Blueprint Node Structure"}
                    </h4>
                    <div className="h-[2px] w-8 bg-slate-900 rounded-full mt-1" />
                  </div>
                </div>

                {/* Rendered Chapter Breakdown Array */}
                <p className="text-[11px] font-normal text-slate-500 leading-relaxed pt-1 whitespace-pre-line line-clamp-4">
                  {formik.values.description || "The conceptual summary timeline parameters and specific database indexes mapped onto this block will be simulated here live..."}
                </p>
              </div>
            ) : (
              /* Bulk Preview Map */
              <div className="space-y-3">
                {bulkUnits.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 space-y-2">
                    <ClipboardCopy className="h-8 w-8 mx-auto stroke-1" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Waiting for pasted text...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Preview of Units to Save ({bulkUnits.length})</span>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {bulkUnits.map((u, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-700">
                          <div className="flex items-center gap-2 truncate">
                            <span className="bg-slate-900 text-white rounded px-1.5 py-0.5 font-black">U{u.unitNumber}</span>
                            <span className="truncate max-w-[200px] uppercase">{u.title}</span>
                          </div>
                          <span className="text-[8px] font-mono text-slate-400">{u.description ? `${u.description.length} chars` : "No desc"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Informational Verification Footer Box */}
            <div className="flex items-start gap-2 p-3 bg-blue-50/40 border border-blue-100 rounded-xl text-[10px] text-blue-600/90 leading-normal">
              <HelpCircle className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p>This entry creates a curriculum dependency node instantly linkable to study notes, exam trackers, and tutorial assets.</p>
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}