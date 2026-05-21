import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, BookOpen, Calendar, Layers, FileText, UploadCloud, X, Eye, ShieldCheck, FileUp } from "lucide-react";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Subject = { id: string; name: string; subject_code: string | null };

export const Route = createFileRoute("/_authenticated/admin/papers/add")({
  head: () => ({ meta: [{ title: "Add Previous Year Paper — Lakshay IQ" }] }),
  component: AddPaper,
});

// Robust Formik Validation Matrix using Yup
const PaperSchema = Yup.object().shape({
  subjectId: Yup.string().required("Target course subject mapping is required"),
  title: Yup.string()
    .min(5, "Title should be descriptive (Min 5 characters)")
    .required("Examination paper title is required"),
  year: Yup.number()
    .min(1990, "Year parameter must be valid")
    .max(2100, "Year parameter out of index range")
    .required("Examination year parameter is required"),
  semester: Yup.number()
    .min(1, "Minimum semester index is 1")
    .max(12, "Maximum semester limit exceeded")
    .nullable(),
  fileUrl: Yup.string().url("Invalid asset deployment URL detected").required("Academic asset resource required"),
});

function AddPaper() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("previous_year_papers");
  const { data: subjects, loading: loadingSubjects } = useSupabaseTable<Subject>("subjects", { 
    orderBy: "name", 
    ascending: true 
  });
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localFileMeta, setLocalFileMeta] = useState<{ name: string; size: string; type: string } | null>(null);

  // Core Supabase Cloud Storage File Pipeline Manager
  const uploadPaperAsset = async (file: File, subjectName: string): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const cleanSubjectSlug = slugify(subjectName || "unallocated");
      // Clean target pipeline layout routing: papers/object-oriented-1715893200.pdf
      const fileName = `papers/${cleanSubjectSlug}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("university-assets")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Extract raw absolute transmission links
      const { data: publicUrlData } = supabase.storage
        .from("university-assets")
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Asset cloud stream interception failure inside [university-assets/papers]:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Formik Configuration Wrapper
  const formik = useFormik({
    initialValues: {
      subjectId: "",
      title: "",
      year: new Date().getFullYear(),
      semester: "" as number | "",
      fileUrl: "",
    },
    validationSchema: PaperSchema,
    onSubmit: async (values) => {
      try {
        setSaving(true);
        
        // Push payloads cleanly into the Datastore Registry
        const ok = await insert({
          subject_id: values.subjectId,
          year: values.year,
          semester: values.semester === "" ? null : Number(values.semester),
          title: values.title.trim(),
          file_url: values.fileUrl,
        });

        if (ok) {
          nav({ to: "/admin/papers" });
        }
      } catch (err) {
        console.error("Datastore write refusal block caught inside pipeline execution:", err);
      } finally {
        setSaving(false);
      }
    },
  });

  // Local file change handler tracking raw metadata bytes
  const handleFileProcessPipeline = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const targetSubject = subjects?.find(s => s.id === formik.values.subjectId);
      
      // Safety Block: Enforce subject mapping before processing stream allocations
      if (!formik.values.subjectId) {
        alert("Please select a target academic course subject before uploading raw asset payloads.");
        return;
      }

      // Convert raw bytes safely into human readable strings
      const fileSizeString = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      setLocalFileMeta({ name: file.name, size: fileSizeString, type: file.type });

      const uploadedCloudUrl = await uploadPaperAsset(file, targetSubject?.name || "paper");
      if (uploadedCloudUrl) {
        formik.setFieldValue("fileUrl", uploadedCloudUrl);
      }
    }
  };

  const clearUploadedFileNode = () => {
    formik.setFieldValue("fileUrl", "");
    setLocalFileMeta(null);
  };

  const selectedSubjectData = subjects?.find(s => s.id === formik.values.subjectId);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col gap-6 w-full max-w-full px-2 antialiased">
      
      {/* Top Level System Header Panel Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 text-slate-500 hover:text-slate-900 pl-0 gap-1">
            <Link to="/admin/papers">
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" /> Back to Papers Hub
            </Link>
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Archive Previous Year Paper</h1>
          <p className="text-xs text-slate-500 mt-0.5">Index reference evaluation records, exam logs, and multi-format resource archives.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold px-4" asChild>
            <Link to="/admin/papers">Cancel</Link>
          </Button>
          <Button 
            type="button" 
            size="sm"
            onClick={() => formik.handleSubmit()} 
            disabled={saving || uploading || !formik.isValid}
            className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs font-semibold px-5 shadow-sm transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Indexing Document...
              </span>
            ) : "Deploy Examination Record"}
          </Button>
        </div>
      </div>

      {/* Two Column Workspace Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 w-full">
        
        {/* Left Core Controller Segment (7 Columns Layout Block) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white">
            <form onSubmit={formik.handleSubmit} className="space-y-5">
              
              {/* Dynamic Course Mapping Selection Entry */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                  <span>Target Course Subject <span className="text-rose-500">*</span></span>
                </Label>
                <Select 
                  value={formik.values.subjectId} 
                  onValueChange={(val) => formik.setFieldValue("subjectId", val)}
                >
                  <SelectTrigger className={cn(
                    "h-10 border-slate-200 rounded-xl text-xs focus:ring-0 focus:border-slate-900 bg-white transition-all",
                    formik.touched.subjectId && formik.errors.subjectId && "border-rose-400 focus:border-rose-500"
                  )}>
                    <SelectValue placeholder={loadingSubjects ? "Syncing data pipelines..." : "Map target subject record link"} />
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

              {/* Document Identity/Title Entry Field */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Examination Resource Title <span className="text-rose-500">*</span></span>
                </Label>
                <Input 
                  name="title"
                  value={formik.values.title} 
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., End Semester Theoretical Examination (Regular / External)"
                  className={cn(
                    "h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 transition-all bg-white",
                    formik.touched.title && formik.errors.title && "border-rose-400 focus-visible:border-rose-500"
                  )}
                />
                {formik.touched.title && formik.errors.title && (
                  <p className="text-[11px] font-medium text-rose-500">{formik.errors.title}</p>
                )}
              </div>

              {/* Cron Counter Year and Semester Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Examination Term Year *</span>
                  </Label>
                  <Input 
                    name="year"
                    type="number" 
                    min={1990} 
                    max={2100} 
                    value={formik.values.year} 
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={cn(
                      "h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 transition-all bg-white",
                      formik.touched.year && formik.errors.year && "border-rose-400 focus-visible:border-rose-500"
                    )}
                  />
                  {formik.touched.year && formik.errors.year && (
                    <p className="text-[11px] font-medium text-rose-500">{formik.errors.year}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    <span>Academic Semester Index</span>
                  </Label>
                  <Input 
                    name="semester"
                    type="number" 
                    min={1} 
                    max={12} 
                    placeholder="Optional index counter (e.g., 4)"
                    value={formik.values.semester} 
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={cn(
                      "h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 transition-all bg-white",
                      formik.touched.semester && formik.errors.semester && "border-rose-400 focus-visible:border-rose-500"
                    )}
                  />
                  {formik.touched.semester && formik.errors.semester && (
                    <p className="text-[11px] font-medium text-rose-500">{formik.errors.semester}</p>
                  )}
                </div>
              </div>

              {/* Multi-Format Asset Droploader Pipeline Workspace Container */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <FileUp className="h-3.5 w-3.5 text-slate-400" />
                  <span>Attach Certified Examination Sheet Document <span className="text-rose-500">*</span></span>
                </Label>
                
                {!formik.values.fileUrl ? (
                  <label className={cn(
                    "flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50/50 hover:border-slate-400/80 transition-all group relative",
                    (!formik.values.subjectId || uploading) && "opacity-50 cursor-not-allowed pointer-events-none bg-slate-50"
                  )}>
                    <div className="flex flex-col items-center justify-center pt-4 pb-4 px-4 text-center">
                      {uploading ? (
                        <>
                          <Loader2 className="h-7 w-7 text-slate-500 animate-spin mb-2" />
                          <p className="text-xs font-bold text-slate-700">Streaming structural binary segments to cloud storage...</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-7 w-7 text-slate-400 group-hover:text-slate-600 transition-colors mb-2" />
                          <p className="text-xs font-bold text-slate-600">Select or Drag Academic File</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold tracking-wider">Supports PDF, DOCX, PPTX, or Images up to 15MB</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept=".pdf,.docx,.doc,.pptx,.ppt,image/*" 
                      className="hidden" 
                      onChange={handleFileProcessPipeline} 
                      disabled={!formik.values.subjectId || uploading}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 border border-emerald-200 bg-emerald-50/30 rounded-2xl overflow-hidden shadow-inner group">
                    <div className="flex items-center gap-3 truncate pr-4">
                      <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                        <ShieldCheck className="h-5 w-5 stroke-[2]" />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-bold text-slate-800 truncate leading-snug">{localFileMeta?.name || "Uploaded Cloud Stream Asset"}</span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase font-mono">{localFileMeta?.size || "Compressed"} · Unified Link Loaded</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={clearUploadedFileNode}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 shadow-sm transition-all flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {formik.touched.fileUrl && formik.errors.fileUrl && (
                  <p className="text-[11px] font-medium text-rose-500">{formik.errors.fileUrl}</p>
                )}
              </div>

            </form>
          </Card>
        </div>

        {/* Right Preview Column: Live Structural Shell Render Console (5 Columns) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 px-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Shell Output Mockup</span>
          </div>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl bg-white p-5 space-y-4">
            
            {/* Subject Code dynamic rendering segment */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5 truncate pr-2">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-widest block">Core Reference Subject</span>
                <h3 className="text-xs font-black text-slate-800 truncate">
                  {selectedSubjectData?.name || "No Subject Linked"}
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-200/50 rounded-md font-mono text-slate-600 flex-shrink-0">
                {selectedSubjectData?.subject_code ? selectedSubjectData.subject_code.toUpperCase() : "REG-CODE"}
              </span>
            </div>

            {/* Simulated Live Frontend Render Interface Block */}
            <div className="p-4 bg-slate-50/50 border border-slate-200/70 rounded-2xl space-y-3 relative transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                    PYP Resource Registry
                  </span>
                  <h4 className="text-xs font-black text-slate-800 leading-snug pt-1 uppercase tracking-tight line-clamp-2">
                    {formik.values.title || "Untitled Examination Document Core Header"}
                  </h4>
                </div>
                
                {/* Year Badge Icon Node */}
                <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex flex-col items-center justify-center flex-shrink-0 shadow-sm font-mono">
                  <span className="text-[8px] font-bold uppercase text-slate-400 leading-none">Term</span>
                  <span className="text-xs font-black leading-none mt-1">{formik.values.year || "2026"}</span>
                </div>
              </div>

              {/* Sub parameters listing indicators */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500">
                <div>Semester Block: <span className="text-slate-800 font-bold">{formik.values.semester ? `Semester ${formik.values.semester}` : "—"}</span></div>
                <div className="truncate">Resource Link: <span className="text-emerald-600 font-bold">{formik.values.fileUrl ? "Ready (Cloud Asset)" : "Pending Attachment"}</span></div>
              </div>
            </div>

            {/* Validation State Banner Message Alert */}
            <div className={cn(
              "p-3 rounded-xl border text-[10px] leading-normal flex items-center justify-center text-center font-medium transition-all",
              formik.isValid && formik.values.fileUrl
                ? "bg-emerald-50/40 border-emerald-100 text-emerald-600"
                : "bg-amber-50/40 border-amber-100 text-amber-600"
            )}>
              {formik.isValid && formik.values.fileUrl 
                ? "Structure integrity checked. Clean deployment manifest ready." 
                : "Awaiting valid file payload attachment and subject mappings before system compilation."}
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}