import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";
import { cn } from "@/lib/utils";

// UI Components
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

// Icons
import { ArrowLeft, UploadCloud, X, BookOpen, Layers, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Univ = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/courses/add")({
  head: () => ({ meta: [{ title: "Add Course — Lakshay IQ" }] }),
  component: AddCourse,
});

// Structural Schema Validations for Course Data Model
const CourseSchema = Yup.object().shape({
  universityId: Yup.string().required("Selecting a parent university is required"),
  name: Yup.string().min(3, "Course name must be at least 3 characters long").required("Course name is required"),
  slug: Yup.string().matches(/^[a-z0-9-_]+$/, "Slug can only contain lowercase letters, numbers, hyphens, and underscores").required("Slug is required"),
  duration: Yup.string().default("3 years"),
  totalSemesters: Yup.number().min(1, "Minimum 1 semester").max(12, "Maximum 12 semesters allowed").required("Total semesters count is required"),
  description: Yup.string().max(600, "Description cannot exceed 600 characters").nullable(),
});

function AddCourse() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("courses");
  const { data: univs } = useSupabaseTable<Univ>("universities", { orderBy: "name", ascending: true });
  const [saving, setSaving] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Helper Pipeline Subroutine: Upload raw course banner to Supabase Storage
  const uploadCourseThumbnail = async (file: File, targetSlug: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      // Keeps storage organized inside separate course-thumbnails cluster directory
      const fileName = `course-thumbnails/${targetSlug}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from("university-assets")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("university-assets")
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Course thumbnail upload layer crashed:", err);
      return null;
    }
  };

  const formik = useFormik({
    initialValues: {
      universityId: "",
      name: "",
      slug: "",
      duration: "3 years",
      totalSemesters: 6,
      description: "",
      thumbnailFile: null as File | null,
    },
    validationSchema: CourseSchema,
    onSubmit: async (values) => {
      setSaving(true);
      const targetSlug = values.slug || slugify(values.name);
      let finalThumbnailUrl = null;

      try {
        // 1. Process block binary image upload stream if active
        if (values.thumbnailFile) {
          finalThumbnailUrl = await uploadCourseThumbnail(values.thumbnailFile, targetSlug);
        }

        // 2. Submit relation row schemas to downstream db engines
        const ok = await insert({
          university_id: values.universityId,
          name: values.name,
          slug: targetSlug,
          duration: values.duration,
          total_semesters: values.totalSemesters,
          description: values.description || null,
          thumbnail_url: finalThumbnailUrl,
        });

        if (ok) {
          nav({ to: "/admin/courses" });
        }
      } catch (e) {
        console.error("Fatal transactional exception caught during deployment:", e);
      } finally {
        setSaving(false);
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      formik.setFieldValue("thumbnailFile", file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const clearThumbnailFile = () => {
    formik.setFieldValue("thumbnailFile", null);
    setThumbnailPreview(null);
  };

  // Find targeted university name reference text string for real-time sandbox visualization engine
  const selectedUnivName = univs?.find(u => u.id === formik.values.universityId)?.name;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col gap-6 w-full max-w-full px-2">
      {/* Structural Header Action Elements */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 text-slate-500 hover:text-slate-900 pl-0">
            <Link to="/admin/courses">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
            </Link>
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Add New Program Syllabus</h1>
          <p className="text-xs text-slate-500 mt-0.5">Register a validated curriculum stream linked directly to upstream academic hubs.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold px-4" asChild>
            <Link to="/admin/courses">Cancel</Link>
          </Button>
          <Button 
            type="button" 
            size="sm"
            onClick={() => formik.handleSubmit()} 
            disabled={saving || !formik.isValid || !formik.values.universityId}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold px-5 shadow-sm"
          >
            {saving ? "Uploading Asset & Saving..." : "Publish Syllabus"}
          </Button>
        </div>
      </div>

      {/* Grid Allocation Split Layout Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 w-full">
        
        {/* Form Entry Fieldsets Context Block (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white">
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              
              {/* Linked Platform Dependency Scope Selectors */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Affiliated University Parent <span className="text-rose-500">*</span></Label>
                <Select 
                  value={formik.values.universityId} 
                  onValueChange={(val) => formik.setFieldValue("universityId", val)}
                >
                  <SelectTrigger className={cn(
                    "h-10 border-slate-200 rounded-xl text-xs focus:ring-slate-900/10 focus:border-slate-900",
                    formik.touched.universityId && formik.errors.universityId && "border-rose-400"
                  )}>
                    <SelectValue placeholder="Associate this program with a certified institute" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white">
                    {univs && univs.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs focus:bg-slate-50 rounded-lg py-2">
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formik.touched.universityId && formik.errors.universityId && (
                  <p className="text-[11px] font-medium text-rose-500">{formik.errors.universityId}</p>
                )}
              </div>

              {/* Core Literal Identifiers Structure Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Course Program Nomenclature <span className="text-rose-500">*</span></Label>
                  <Input 
                    name="name"
                    value={formik.values.name}
                    onChange={(e) => {
                      formik.handleChange(e);
                      if (!formik.touched.slug) {
                        formik.setFieldValue("slug", slugify(e.target.value));
                      }
                    }}
                    onBlur={formik.handleBlur}
                    placeholder="e.g., M.B.A. International Business" 
                    className={cn(
                      "h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10 focus-visible:border-slate-900",
                      formik.touched.name && formik.errors.name && "border-rose-400 focus-visible:ring-rose-500/10"
                    )}
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="text-[11px] font-medium text-rose-500">{formik.errors.name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">URL Slug Anchor <span className="text-rose-500">*</span></Label>
                  <Input 
                    name="slug"
                    value={formik.values.slug}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="mba-intl-business" 
                    className={cn(
                      "h-10 border-slate-200 rounded-xl text-xs font-mono focus-visible:ring-slate-900/10 focus-visible:border-slate-900",
                      formik.touched.slug && formik.errors.slug && "border-rose-400 focus-visible:ring-rose-500/10"
                    )}
                  />
                  {formik.touched.slug && formik.errors.slug && (
                    <p className="text-[11px] font-medium text-rose-500">{formik.errors.slug}</p>
                  )}
                </div>
              </div>

              {/* Incremental Metric Configurations Attributes */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Academic Lifecycle Duration</Label>
                  <Input 
                    name="duration"
                    value={formik.values.duration}
                    onChange={formik.handleChange}
                    placeholder="e.g., 2 Years / 4 Semesters" 
                    className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10 focus-visible:border-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Total Split Semesters Matrix Count <span className="text-rose-500">*</span></Label>
                  <Input 
                    name="totalSemesters"
                    type="number" 
                    min={1} 
                    max={12}
                    value={formik.values.totalSemesters}
                    onChange={formik.handleChange}
                    className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10 focus-visible:border-slate-900"
                  />
                  {formik.touched.totalSemesters && formik.errors.totalSemesters && (
                    <p className="text-[11px] font-medium text-rose-500">{formik.errors.totalSemesters}</p>
                  )}
                </div>
              </div>

              {/* Graphic Asset Uploader Integration Box */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Program Cover Artwork Card Thumbnail</Label>
                <div className="relative">
                  {!thumbnailPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50/50 hover:border-slate-400/80 transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-5 px-4 text-center">
                        <UploadCloud className="h-7 w-7 text-slate-400 group-hover:text-slate-600 transition-colors mb-2" />
                        <p className="text-xs font-bold text-slate-600">Upload High-Res Program Card Cover</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Recommended resolution aspect mapping: 4:3 Grid Ratio</p>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  ) : (
                    <div className="relative w-full h-36 border border-slate-200 rounded-2xl overflow-hidden group">
                      <img src={thumbnailPreview} alt="Syllabus Showcase Snapshot" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button 
                        type="button" 
                        onClick={clearThumbnailFile}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 shadow-sm transition-all z-10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Narrative Content Data Blocks */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Course Syllabus Summary Description</Label>
                <Textarea 
                  name="description"
                  rows={4} 
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Outline key learning modules, pre-requisites, validation parameters or potential employment pipelines mapped out across this domain registry structure..." 
                  className={cn(
                    "border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10 focus-visible:border-slate-900 transition-all resize-none",
                    formik.touched.description && formik.errors.description && "border-rose-400"
                  )}
                />
                <div className="flex items-center justify-between mt-1">
                  {formik.touched.description && formik.errors.description ? (
                    <p className="text-[11px] font-medium text-rose-500">{formik.errors.description}</p>
                  ) : <div />}
                  <span className="text-[10px] font-bold text-slate-400">{formik.values.description.length}/600 characters</span>
                </div>
              </div>

            </form>
          </Card>
        </div>

        {/* Live Visualization Interactive Sandbox Previews Container (5 Columns) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 px-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Live Student Stream Layout Preview</span>
          </div>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl bg-white group">
            {/* Live Media Snapshot Block */}
            <div className="relative h-44 w-full bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-50">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Live Preview Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex flex-col items-center text-slate-400 gap-1.5">
                  <BookOpen className="h-6 w-6 stroke-[1.5]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Missing Display Thumbnail</span>
                </div>
              )}

              {/* Associated University Badge Injector */}
              {selectedUnivName && (
                <div className="absolute top-3 left-3 max-w-[70%]">
                  <span className="inline-flex items-center rounded-xl bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold text-white truncate shadow-sm">
                    {selectedUnivName}
                  </span>
                </div>
              )}
            </div>

            {/* Content Specifications Mapping Metadata */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-800 line-clamp-1">
                  {formik.values.name || "Untitled Curriculum Blueprint"}
                </h3>
                <p className="text-[10px] font-mono font-bold text-slate-400/90 mt-0.5 truncate">
                  catalog/streams/{formik.values.slug || "waiting-for-slug-generation"}
                </p>
              </div>

              <p className="text-xs text-slate-500 font-normal line-clamp-3 leading-relaxed">
                {formik.values.description || "No foundational curriculum summary description variables have been injected into this workspace blueprint."}
              </p>

              {/* Extracted Context Meta Attribute Micro Chips */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formik.values.duration || "Duration unset"}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formik.values.totalSemesters} Semesters</span>
                </div>
              </div>
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}