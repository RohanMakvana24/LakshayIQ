import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, UploadCloud, X, Image as ImageIcon, GraduationCap, Eye } from "lucide-react";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/universities/add")({
  head: () => ({ meta: [{ title: "Add University — Lakshay IQ" }] }),
  component: AddUniversity,
});

// Validation Schema using Yup
const UniversitySchema = Yup.object().shape({
  name: Yup.string()
    .min(3, "Name must be at least 3 characters long")
    .required("University name is required"),
  slug: Yup.string()
    .matches(/^[a-z0-9-_]+$/, "Slug can only contain lowercase letters, numbers, hyphens, and underscores")
    .required("Slug is required"),
  description: Yup.string().max(500, "Description cannot exceed 500 characters").nullable(),
  isActive: Yup.boolean().default(true),
});

function AddUniversity() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("universities");
  const [saving, setSaving] = useState(false);

  // States to keep track of local browser object URLs for live UI previews
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Helper Function: Supabase Storage Bucket File Upload Pipeline
  const uploadAsset = async (file: File, folder: "logos" | "banners", targetSlug: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      // Generates a clean path structure: logos/delhi-university-1715893200.png
      const fileName = `${folder}/${targetSlug}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from("university-assets") // Your public storage bucket name
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Fetch public link from storage infrastructure
      const { data: publicUrlData } = supabase.storage
        .from("university-assets")
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error(`Asset upload failed inside directory structural block [${folder}]:`, err);
      return null;
    }
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      slug: "",
      description: "",
      isActive: true,
      logoFile: null as File | null,
      bannerFile: null as File | null,
    },
    validationSchema: UniversitySchema,
    onSubmit: async (values) => {
      setSaving(true);
      const targetSlug = values.slug || slugify(values.name);

      let finalLogoUrl = null;
      let finalBannerUrl = null;

      try {
        // 1. Process and upload Logo asset if attached
        if (values.logoFile) {
          finalLogoUrl = await uploadAsset(values.logoFile, "logos", targetSlug);
        }

        // 2. Process and upload Banner asset if attached
        if (values.bannerFile) {
          finalBannerUrl = await uploadAsset(values.bannerFile, "banners", targetSlug);
        }

        // 3. Inject data arrays directly into Core Supabase Database Table
        const ok = await insert({
          name: values.name,
          slug: targetSlug,
          description: values.description || null,
          logo_url: finalLogoUrl, 
          banner_url: finalBannerUrl,
          is_active: values.isActive,
        });

        if (ok) {
          nav({ to: "/admin/universities" });
        }
      } catch (error) {
        console.error("Critical exception caught during pipeline deployment:", error);
      } finally {
        setSaving(false);
      }
    },
  });

  // Handle local binary file asset transfers & generate Object URL structures
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "logoFile" | "bannerFile") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      formik.setFieldValue(field, file);
      
      const objectUrl = URL.createObjectURL(file);
      if (field === "logoFile") setLogoPreview(objectUrl);
      if (field === "bannerFile") setBannerPreview(objectUrl);
    }
  };

  const clearFile = (field: "logoFile" | "bannerFile") => {
    formik.setFieldValue(field, null);
    if (field === "logoFile") setLogoPreview(null);
    if (field === "bannerFile") setBannerPreview(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col gap-6 w-full max-w-full px-2">
      {/* Action Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 text-slate-500 hover:text-slate-900 pl-0">
            <Link to="/admin/universities">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Create New University</h1>
          <p className="text-xs text-slate-500 mt-0.5">Register a certified global educational hub architecture into Lakshay ecosystem.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold px-4" asChild>
            <Link to="/admin/universities">Cancel</Link>
          </Button>
          <Button 
            type="button" 
            size="sm"
            onClick={() => formik.handleSubmit()} 
            disabled={saving || !formik.isValid}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold px-5 shadow-sm"
          >
            {saving ? "Uploading Assets & Saving..." : "Deploy University"}
          </Button>
        </div>
      </div>

      {/* Full Screen Layout Split Engine Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 w-full">
        
        {/* Left Segment Column: Form Layout Block (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white">
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              
              {/* Institutional Core Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">University Title <span className="text-rose-500">*</span></Label>
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
                    placeholder="e.g., University of Delhi" 
                    className={cn(
                      "h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10 focus-visible:border-slate-900 transition-all",
                      formik.touched.name && formik.errors.name && "border-rose-400 focus-visible:ring-rose-500/10 focus-visible:border-rose-500"
                    )}
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="text-[11px] font-medium text-rose-500">{formik.errors.name}</p>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Canonical Path Pointer (Slug) <span className="text-rose-500">*</span></Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-[11px] font-semibold text-slate-400 select-none">lakshay.iq/hub/</span>
                    <Input 
                      name="slug"
                      value={formik.values.slug}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="university-of-delhi" 
                      className={cn(
                        "pl-[92px] h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10 focus-visible:border-slate-900 transition-all font-mono tracking-tight",
                        formik.touched.slug && formik.errors.slug && "border-rose-400 focus-visible:ring-rose-500/10 focus-visible:border-rose-500"
                      )}
                    />
                  </div>
                  {formik.touched.slug && formik.errors.slug && (
                    <p className="text-[11px] font-medium text-rose-500">{formik.errors.slug}</p>
                  )}
                </div>
              </div>

              {/* Digital Media Asset Manager Grid Sections */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                
                {/* Logo Image Direct Uploader */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Institutional Emblem / Logo</Label>
                  <div className="relative">
                    {!logoPreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50/50 hover:border-slate-400/80 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-4 pb-4 px-3 text-center">
                          <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors mb-1.5" />
                          <p className="text-[11px] font-bold text-slate-600">Upload Emblem File</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">PNG, JPG or SVG up to 2MB</p>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "logoFile")} />
                      </label>
                    ) : (
                      <div className="relative flex items-center justify-center w-full h-32 border border-slate-200 bg-slate-50/50 rounded-2xl overflow-hidden group">
                        <img src={logoPreview} alt="Emblem Snapshot" className="h-16 w-16 object-contain rounded-xl" />
                        <button 
                          type="button" 
                          onClick={() => clearFile("logoFile")}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 shadow-sm transition-all"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Artwork Image Direct Uploader */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Cover Landscape Banner</Label>
                  <div className="relative">
                    {!bannerPreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50/50 hover:border-slate-400/80 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-4 pb-4 px-3 text-center">
                          <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors mb-1.5" />
                          <p className="text-[11px] font-bold text-slate-600">Upload Campus Cover</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Recommended 16:9 Landscape Aspect</p>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "bannerFile")} />
                      </label>
                    ) : (
                      <div className="relative w-full h-32 border border-slate-200 rounded-2xl overflow-hidden group">
                        <img src={bannerPreview} alt="Cover Banner Snapshot" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button 
                          type="button" 
                          onClick={() => clearFile("bannerFile")}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 shadow-sm transition-all z-10"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Extended Overviews Description */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Overview Profile Synopsis</Label>
                <Textarea 
                  name="description"
                  rows={4} 
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Draft deep profile contexts or foundational historical insights concerning this platform campus block..." 
                  className={cn(
                    "border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10 focus-visible:border-slate-900 transition-all resize-none",
                    formik.touched.description && formik.errors.description && "border-rose-400 focus-visible:ring-rose-500/10"
                  )}
                />
                <div className="flex items-center justify-between mt-1">
                  {formik.touched.description && formik.errors.description ? (
                    <p className="text-[11px] font-medium text-rose-500">{formik.errors.description}</p>
                  ) : <div />}
                  <span className="text-[10px] font-bold text-slate-400">{formik.values.description.length}/500 chars</span>
                </div>
              </div>

              {/* Active Toggle Engine */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40">
                <div className="flex flex-col">
                  <Label htmlFor="active" className="text-xs font-bold text-slate-800">Public Discovery Status</Label>
                  <span className="text-[10px] font-medium text-slate-400 mt-0.5">Control whether this institute asset is visible across student streams instantly.</span>
                </div>
                <Switch 
                  id="active" 
                  checked={formik.values.isActive} 
                  onCheckedChange={(val) => formik.setFieldValue("isActive", val)} 
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

            </form>
          </Card>
        </div>

        {/* Right Segment Column: Live Full Interactive UI Card Sandbox Preview (5 Cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 px-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Shell Render Output Preview</span>
          </div>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl bg-white group">
            {/* Live Banner Mock */}
            <div className="relative h-40 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Live Preview Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex flex-col items-center text-slate-400 gap-1.5">
                  <ImageIcon className="h-5 w-5 stroke-[1.5]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No Cover Art Linked</span>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold tracking-wide uppercase backdrop-blur-md border",
                  formik.values.isActive 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                    : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", formik.values.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                  {formik.values.isActive ? "Live Ready" : "Draft Offline"}
                </span>
              </div>
            </div>

            {/* University Content Body Details */}
            <div className="p-5 relative pt-12">
              
              {/* Emblem Logo Target Placement Absolute Layout */}
              <div className="absolute -top-8 left-5 h-16 w-16 bg-white rounded-xl border border-slate-200/60 p-1.5 shadow-sm flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Emblem Live Snapshot" className="w-full h-full object-contain" />
                ) : (
                  <GraduationCap className="h-6 w-6 text-slate-300" />
                )}
              </div>

              {/* Institutional Descriptions */}
              <div className="space-y-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 line-clamp-1">
                    {formik.values.name || "Untitled University Structure"}
                  </h3>
                  <p className="text-[10px] font-mono font-medium text-slate-400/90 mt-0.5 truncate">
                    /hub/{formik.values.slug || "waiting-for-title"}
                  </p>
                </div>

                <p className="text-xs font-normal text-slate-500 line-clamp-3 leading-relaxed pt-1">
                  {formik.values.description || "No overview profile synopsis has been configured for this digital asset framework."}
                </p>

                {/* Simulated Platform Metric Blocks */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-4 text-[11px]">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Enrolled Track</p>
                    <p className="font-black text-slate-700 mt-0.5">0 Active Courses</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Resource Registry</p>
                    <p className="font-black text-slate-700 mt-0.5">0 Materials</p>
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}