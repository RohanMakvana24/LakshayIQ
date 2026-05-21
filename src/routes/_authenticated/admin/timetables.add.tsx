import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, School, GraduationCap, Layers, FileText, CalendarDays, UploadCloud, X, Eye, ShieldCheck, FileUp } from "lucide-react";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Univ = { id: string; name: string };
type Course = { id: string; name: string; university_id: string };
type Sem = { id: string; semester_number: number; course_id: string };

export const Route = createFileRoute("/_authenticated/admin/timetables/add")({
  head: () => ({ meta: [{ title: "Add Exam Timetable — Lakshay IQ" }] }),
  component: AddTimetable,
});

// Strict Formik Validation Matrix using Yup
const TimetableSchema = Yup.object().shape({
  universityId: Yup.string().required("University allocation is required"),
  courseId: Yup.string().required("Course mapping is required"),
  semesterId: Yup.string().required("Semester target index is required"),
  title: Yup.string()
    .min(5, "Title must be descriptive (Min 5 characters)")
    .required("Examination timetable title is required"),
  startDate: Yup.string().nullable(),
  endDate: Yup.string().nullable(),
  fileUrl: Yup.string().url("Invalid asset deployment URL detected").required("Timetable source asset document required"),
});

function AddTimetable() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("exam_timetables");
  const { data: univs, loading: loadingUnivs } = useSupabaseTable<Univ>("universities");
  const { data: courses, loading: loadingCourses } = useSupabaseTable<Course>("courses");
  const { data: sems, loading: loadingSems } = useSupabaseTable<Sem>("semesters");
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localFileMeta, setLocalFileMeta] = useState<{ name: string; size: string; type: string } | null>(null);

  // Core Formik State Orchestrator
  const formik = useFormik({
    initialValues: {
      universityId: "",
      courseId: "",
      semesterId: "",
      title: "",
      startDate: "",
      endDate: "",
      fileUrl: "",
    },
    validationSchema: TimetableSchema,
    onSubmit: async (values) => {
      try {
        setSaving(true);
        const ok = await insert({
          university_id: values.universityId,
          course_id: values.courseId,
          semester_id: values.semesterId,
          title: values.title.trim(),
          exam_start_date: values.startDate || null,
          exam_end_date: values.endDate || null,
          file_url: values.fileUrl,
        });

        if (ok) {
          nav({ to: "/admin/timetables" });
        }
      } catch (err) {
        console.error("Datastore transaction write execution failed:", err);
      } finally {
        setSaving(false);
      }
    },
  });

  // Cascade Dependent Logic Filters
  const filteredCourses = courses.filter((c) => !formik.values.universityId || c.university_id === formik.values.universityId);
  const filteredSems = sems.filter((s) => !formik.values.courseId || s.course_id === formik.values.courseId);

  // Supabase Storage Asset Stream Uploader Engine
  const uploadTimetableAsset = async (file: File, courseName: string): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const cleanCourseSlug = slugify(courseName || "general");
      // Clean isolated folder location: timetables/btech-cse-1715893200.pdf
      const fileName = `timetables/${cleanCourseSlug}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("university-assets")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("university-assets")
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Storage vault push exception inside [university-assets/timetables]:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileProcessPipeline = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const targetCourse = courses?.find(c => c.id === formik.values.courseId);
      
      if (!formik.values.courseId) {
        alert("Please select a valid Course alignment before staging timetable attachments.");
        return;
      }

      const fileSizeString = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      setLocalFileMeta({ name: file.name, size: fileSizeString, type: file.type });

      const uploadedCloudUrl = await uploadTimetableAsset(file, targetCourse?.name || "timetable");
      if (uploadedCloudUrl) {
        formik.setFieldValue("fileUrl", uploadedCloudUrl);
      }
    }
  };

  const clearUploadedFileNode = () => {
    formik.setFieldValue("fileUrl", "");
    setLocalFileMeta(null);
  };

  // Selection Metadata Trackers for Preview UI
  const selectedUniv = univs?.find(u => u.id === formik.values.universityId);
  const selectedCourse = courses?.find(c => c.id === formik.values.courseId);
  const selectedSem = sems?.find(s => s.id === formik.values.semesterId);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col gap-6 w-full max-w-full px-2 antialiased">
      
      {/* Upper Panel Action Routing Block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 text-slate-500 hover:text-slate-900 pl-0 gap-1">
            <Link to="/admin/timetables">
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" /> Back to Schedule Hub
            </Link>
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Publish Exam Timetable</h1>
          <p className="text-xs text-slate-500 mt-0.5">Deploy official university test charts, external dates, and timetable configurations.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold px-4" asChild>
            <Link to="/admin/timetables">Cancel</Link>
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
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Compiling Record...
              </span>
            ) : "Broadcast Exam Schedule"}
          </Button>
        </div>
      </div>

      {/* Two Column Workspace Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 w-full">
        
        {/* Left Input Controller (7 Columns layout) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white">
            <form onSubmit={formik.handleSubmit} className="space-y-5">
              
              {/* Cascade Dropdown Layer 1: University */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <School className="h-3.5 w-3.5 text-slate-400" />
                    <span>Parent University <span className="text-rose-500">*</span></span>
                  </Label>
                  <Select 
                    value={formik.values.universityId} 
                    onValueChange={(val) => {
                      formik.setFieldValue("universityId", val);
                      formik.setFieldValue("courseId", "");
                      formik.setFieldValue("semesterId", "");
                    }}
                  >
                    <SelectTrigger className={cn(
                      "h-10 border-slate-200 rounded-xl text-xs focus:ring-0 focus:border-slate-900 bg-white transition-all",
                      formik.touched.universityId && formik.errors.universityId && "border-rose-400 focus:border-rose-500"
                    )}>
                      <SelectValue placeholder={loadingUnivs ? "Syncing..." : "Select university"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 bg-white shadow-lg max-h-[200px]">
                      {univs?.map((u) => (
                        <SelectItem key={u.id} value={u.id} className="text-xs py-2 rounded-lg cursor-pointer">{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formik.touched.universityId && formik.errors.universityId && (
                    <p className="text-[11px] font-medium text-rose-500">{formik.errors.universityId}</p>
                  )}
                </div>

                {/* Cascade Dropdown Layer 2: Course Allocation */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                    <span>Course Route <span className="text-rose-500">*</span></span>
                  </Label>
                  <Select 
                    value={formik.values.courseId} 
                    disabled={!formik.values.universityId}
                    onValueChange={(val) => {
                      formik.setFieldValue("courseId", val);
                      formik.setFieldValue("semesterId", "");
                    }}
                  >
                    <SelectTrigger className={cn(
                      "h-10 border-slate-200 rounded-xl text-xs focus:ring-0 focus:border-slate-900 bg-white transition-all",
                      formik.touched.courseId && formik.errors.courseId && "border-rose-400 focus:border-rose-500"
                    )}>
                      <SelectValue placeholder="Choose branch course" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 bg-white shadow-lg max-h-[200px]">
                      {filteredCourses.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs py-2 rounded-lg cursor-pointer">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formik.touched.courseId && formik.errors.courseId && (
                    <p className="text-[11px] font-medium text-rose-500">{formik.errors.courseId}</p>
                  )}
                </div>
              </div>

              {/* Cascade Dropdown Layer 3: Semester Index */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  <span>Target Class Semester <span className="text-rose-500">*</span></span>
                </Label>
                <Select 
                  value={formik.values.semesterId} 
                  disabled={!formik.values.courseId}
                  onValueChange={(val) => formik.setFieldValue("semesterId", val)}
                >
                  <SelectTrigger className={cn(
                    "h-10 border-slate-200 rounded-xl text-xs focus:ring-0 focus:border-slate-900 bg-white transition-all",
                    formik.touched.semesterId && formik.errors.semesterId && "border-rose-400 focus:border-rose-500"
                  )}>
                    <SelectValue placeholder="Map corresponding academic term" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white shadow-lg max-h-[200px]">
                    {filteredSems.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs py-2 rounded-lg cursor-pointer">Semester {s.semester_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formik.touched.semesterId && formik.errors.semesterId && (
                  <p className="text-[11px] font-medium text-rose-500">{formik.errors.semesterId}</p>
                )}
              </div>

              {/* Title Input Specification */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Timetable Schema Header Title <span className="text-rose-500">*</span></span>
                </Label>
                <Input 
                  name="title"
                  value={formik.values.title} 
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., Summer Term Main Final Theory Examination Schedule"
                  className={cn(
                    "h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 transition-all bg-white",
                    formik.touched.title && formik.errors.title && "border-rose-400 focus-visible:border-rose-500"
                  )}
                />
                {formik.touched.title && formik.errors.title && (
                  <p className="text-[11px] font-medium text-rose-500">{formik.errors.title}</p>
                )}
              </div>

              {/* Term Duration Timeline Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                    <span>Commencement Date</span>
                  </Label>
                  <Input 
                    name="startDate"
                    type="date" 
                    value={formik.values.startDate} 
                    onChange={formik.handleChange}
                    className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                    <span>Termination Date</span>
                  </Label>
                  <Input 
                    name="endDate"
                    type="date" 
                    value={formik.values.endDate} 
                    onChange={formik.handleChange}
                    className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Universal Asset Dropzone Uploader Engine */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <FileUp className="h-3.5 w-3.5 text-slate-400" />
                  <span>Attach Official Timetable Spreadsheet / Document <span className="text-rose-500">*</span></span>
                </Label>
                
                {!formik.values.fileUrl ? (
                  <label className={cn(
                    "flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50/50 hover:border-slate-400/80 transition-all group relative",
                    (!formik.values.courseId || uploading) && "opacity-50 cursor-not-allowed pointer-events-none bg-slate-50"
                  )}>
                    <div className="flex flex-col items-center justify-center pt-4 pb-4 px-4 text-center">
                      {uploading ? (
                        <>
                          <Loader2 className="h-7 w-7 text-slate-500 animate-spin mb-2" />
                          <p className="text-xs font-bold text-slate-700">Allocating storage slots and pushing asset file...</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-7 w-7 text-slate-400 group-hover:text-slate-600 transition-colors mb-2" />
                          <p className="text-xs font-bold text-slate-600">Select or Drag Schedule Document</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold tracking-wider">PDF, EXCEL, WORD, OR IMAGES UP TO 15MB</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,image/*" 
                      className="hidden" 
                      onChange={handleFileProcessPipeline} 
                      disabled={!formik.values.courseId || uploading}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 border border-emerald-200 bg-emerald-50/30 rounded-2xl shadow-inner group">
                    <div className="flex items-center gap-3 truncate pr-4">
                      <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-bold text-slate-800 truncate leading-snug">{localFileMeta?.name || "Timetable Sheet Resource"}</span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase font-mono">{localFileMeta?.size || "Allocated"} · Sync Active</span>
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

        {/* Right Preview Column: Live Schedule Terminal Output (5 Columns) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 px-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Shell Output Mockup</span>
          </div>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl bg-white p-5 space-y-4">
            
            {/* Top Level Structural Nodes Listing */}
            <div className="border-b border-slate-100 pb-3 space-y-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider">Institution Node</span>
                <span className="text-xs font-bold text-slate-800 truncate">{selectedUniv?.name || "Awaiting University Mapping..."}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider">Branch/Course</span>
                  <span className="text-[11px] font-semibold text-slate-700 truncate">{selectedCourse?.name || "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400 tracking-wider">Active Term</span>
                  <span className="text-[11px] font-semibold text-slate-700">{selectedSem ? `Semester ${selectedSem.semester_number}` : "—"}</span>
                </div>
              </div>
            </div>

            {/* Display Component Render Shell */}
            <div className="p-4 bg-slate-50/60 border border-slate-200/70 rounded-2xl space-y-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider text-purple-600 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-md">
                  Examination Schedule Core
                </span>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight pt-1 leading-snug line-clamp-2">
                  {formik.values.title || "Untitled Timetable Schedule Manifest Header"}
                </h4>
              </div>

              {/* Event Dates Matrix Render Block */}
              <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200/40 text-center font-mono">
                <div className="flex flex-col border-r border-slate-100">
                  <span className="text-[8px] uppercase font-bold text-slate-400">Starts</span>
                  <span className="text-xs font-black text-slate-800 mt-1">{formik.values.startDate || "DD/MM/YYYY"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-slate-400">Concludes</span>
                  <span className="text-xs font-black text-slate-800 mt-1">{formik.values.endDate || "DD/MM/YYYY"}</span>
                </div>
              </div>
            </div>

            {/* Integrity Status Alert Banner */}
            <div className={cn(
              "p-3 rounded-xl border text-[10px] leading-normal text-center font-medium transition-all",
              formik.isValid && formik.values.fileUrl
                ? "bg-emerald-50/40 border-emerald-100 text-emerald-600"
                : "bg-amber-50/40 border-amber-100 text-amber-600"
            )}>
              {formik.isValid && formik.values.fileUrl 
                ? "Parameters valid. System manifest ready for core database index compilation." 
                : "Awaiting course dependencies configuration and sheet matrix payload uploads."}
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}