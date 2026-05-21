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
import { ArrowLeft, Loader2, BookOpen, Layers, FileText, Hash, CheckCircle2, Eye, HelpCircle } from "lucide-react";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { cn } from "@/lib/utils";

type Subject = { id: string; name: string; subject_code: string | null };

export const Route = createFileRoute("/_authenticated/admin/units/add")({
  head: () => ({ meta: [{ title: "Add Academic Unit — Portal" }] }),
  component: AddUnit,
});

// Strict Validation Schema using Yup matching database structural requirements
const UnitSchema = Yup.object().shape({
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
  const { data: subjects, loading: loadingSubjects } = useSupabaseTable<Subject>("subjects", { 
    orderBy: "name", 
    ascending: true 
  });
  const [saving, setSaving] = useState(false);

  // Formik Configuration Core Engine
  const formik = useFormik({
    initialValues: {
      subjectId: "",
      unitNumber: 1,
      title: "",
      description: "",
    },
    validationSchema: UnitSchema,
    onSubmit: async (values) => {
      try {
        setSaving(true);
        
        // Secure transaction commit directly inside Supabase Datastore
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

  // Helper to extract selected subject details for the live reactive preview terminal
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
            onClick={() => formik.handleSubmit()} 
            disabled={saving || !formik.isValid || !formik.values.subjectId}
            className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs font-semibold px-5 shadow-sm transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Structuring Node...
              </span>
            ) : "Save Unit Structure"}
          </Button>
        </div>
      </div>

      {/* Two Column Workspace Grid Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 w-full">
        
        {/* Left Control Column: Form Input Architecture (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white">
            <form onSubmit={formik.handleSubmit} className="space-y-5">
              
              {/* Target Academic Subject Selector Field */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                  <span>Target Academic Subject <span className="text-rose-500">*</span></span>
                </Label>
                <Select 
                  value={formik.values.subjectId} 
                  onValueChange={(val) => formik.setFieldValue("subjectId", val)}
                >
                  <SelectTrigger className={cn(
                    "h-10 border-slate-200 rounded-xl text-xs focus:ring-0 focus:border-slate-900 bg-white transition-all",
                    formik.touched.subjectId && formik.errors.subjectId && "border-rose-400 focus:border-rose-500"
                  )}>
                    <SelectValue placeholder={loadingSubjects ? "Fetching courses from data streams..." : "Select mapped academic course subject"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white shadow-lg max-h-[220px]">
                    {subjects?.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-slate-50 cursor-pointer">
                        {s.subject_code ? `[${s.subject_code.toUpperCase()}] ` : ""}{s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formik.touched.subjectId && formik.errors.subjectId && (
                  <p className="text-[11px] font-medium text-rose-500">{formik.errors.subjectId}</p>
                )}
              </div>

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
        </div>

        {/* Right Preview Column: Live Structural Interactive Shell (5 Columns) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 px-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Course Sheet Preview</span>
          </div>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl bg-white p-5 space-y-5">
            {/* Header Course Identification Tag */}
            <div className="border-b border-slate-100 pb-4">
              <span className="inline-flex items-center text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-md mb-2">
                {selectedSubjectData?.subject_code ? selectedSubjectData.subject_code.toUpperCase() : "REG-CODE"}
              </span>
              <h2 className="text-sm font-black text-slate-800 tracking-tight line-clamp-1">
                {selectedSubjectData?.name || "No Parent Course Mapped"}
              </h2>
            </div>

            {/* Simulated Live Unit Syllabus Component Output */}
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