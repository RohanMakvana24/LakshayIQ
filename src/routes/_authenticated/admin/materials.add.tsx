import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Layers, FileText, UploadCloud, X, Eye, ShieldCheck, FileUp, HardDrive, Link2 } from "lucide-react";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Unit = { id: string; title: string; unit_number: number };

export const Route = createFileRoute("/_authenticated/admin/materials/add")({
  head: () => ({ meta: [{ title: "Add Material — Lakshay IQ" }] }),
  component: AddMaterial,
});

// Strict Validation Schema for Academic Materials
const MaterialSchema = Yup.object().shape({
  unitId: Yup.string().required("Unit allocation is required"),
  title: Yup.string()
    .min(3, "Title should be descriptive (Min 3 characters)")
    .required("Material structural title name is required"),
  fileUrl: Yup.string().url("Invalid binary cloud URL stream").required("Material source attachment file is required"),
  fileType: Yup.string().required("File extension type mapping is required"),
  fileSize: Yup.string().nullable(),
});

function AddMaterial() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("unit_materials");
  const { data: units, loading: loadingUnits } = useSupabaseTable<Unit>("units", { orderBy: "unit_number", ascending: true });
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localFileName, setLocalFileName] = useState("");
  // Tab State: "upload" or "url"
  const [sourceTab, setSourceTab] = useState<"upload" | "url">("upload");

  // Core Formik State Handler
  const formik = useFormik({
    initialValues: {
      unitId: "",
      title: "",
      fileUrl: "",
      fileType: "pdf",
      fileSize: "",
    },
    validationSchema: MaterialSchema,
    onSubmit: async (values) => {
      try {
        setSaving(true);
        const ok = await insert({
          unit_id: values.unitId,
          title: values.title.trim(),
          file_url: values.fileUrl,
          file_type: values.fileType,
          file_size: values.fileSize || null,
        });

        if (ok) {
          nav({ to: "/admin/materials" });
        }
      } catch (err) {
        console.error("Datastore write execution intercepted failure:", err);
      } finally {
        setSaving(false);
      }
    },
  });

  // Helper mapping function to auto-resolve custom category types from native file extensions
  const detectFileTypeGroup = (extension: string): string => {
    const maps: Record<string, string> = {
      pdf: "pdf",
      png: "image",
      jpg: "image",
      jpeg: "image",
      svg: "image",
      webp: "image",
      doc: "doc",
      docx: "doc",
      ppt: "doc",
      pptx: "doc",
      xls: "doc",
      xlsx: "doc",
      txt: "notes",
    };
    return maps[extension.toLowerCase()] || "doc";
  };

  // Binary Asset Uploader to Supabase Storage Bucket
  const uploadMaterialAsset = async (file: File, unitTitle: string): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop() || "pdf";
      const cleanUnitSlug = slugify(unitTitle || "material");
      
      // Clean isolated structural routing: materials/unit-1-intro-1715893200.pdf
      const fileName = `materials/${cleanUnitSlug}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("university-assets")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Extract public link payload
      const { data: publicUrlData } = supabase.storage
        .from("university-assets")
        .getPublicUrl(data.path);

      // Auto-extract and inject metadata into Formik context fluidly
      const calculatedSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      const identifiedType = detectFileTypeGroup(fileExt);

      formik.setFieldValue("fileSize", calculatedSize);
      formik.setFieldValue("fileType", identifiedType);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Storage bucket push exception inside [university-assets/materials]:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileProcessPipeline = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const targetUnit = units?.find(u => u.id === formik.values.unitId);

      if (!formik.values.unitId) {
        alert("Please map a Parent Unit index node before streaming resource attachments.");
        return;
      }

      setLocalFileName(file.name);
      const uploadedCloudUrl = await uploadMaterialAsset(file, `U${targetUnit?.unit_number}-${targetUnit?.title}`);
      if (uploadedCloudUrl) {
        formik.setFieldValue("fileUrl", uploadedCloudUrl);
      }
    }
  };

  // Handle manual URL text field input changes and auto detect type
  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const urlValue = e.target.value;
    formik.setFieldValue("fileUrl", urlValue);
    
    if (urlValue) {
      // Extract file name from URL if possible to guess extension
      try {
        const parsedUrl = new URL(urlValue);
        const pathName = parsedUrl.pathname;
        const fileExt = pathName.split(".").pop() || "";
        if (fileExt && fileExt.length < 5) {
          const identifiedType = detectFileTypeGroup(fileExt);
          formik.setFieldValue("fileType", identifiedType);
        }
        setLocalFileName(pathName.substring(pathName.lastIndexOf("/") + 1) || "External Resource Link");
      } catch {
        setLocalFileName("External Asset Link");
      }
      if (!formik.values.fileSize) {
        formik.setFieldValue("fileSize", "Remote Stream");
      }
    } else {
      setLocalFileName("");
    }
  };

  const clearUploadedFileNode = () => {
    formik.setFieldValue("fileUrl", "");
    formik.setFieldValue("fileSize", "");
    setLocalFileName("");
  };

  // Toggle switch cleaner to clear previous inputs when swapping tabs
  const handleTabChange = (tab: "upload" | "url") => {
    setSourceTab(tab);
    clearUploadedFileNode();
  };

  // Resolve metadata profiles for shell preview container
  const selectedUnit = units?.find(u => u.id === formik.values.unitId);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col gap-6 w-full max-w-full px-2 antialiased">
      
      {/* Header Panel Router Component Layout */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-5">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 text-neutral-500 hover:text-neutral-900 pl-0 gap-1">
            <Link to="/admin/materials">
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" /> Back to Archive
            </Link>
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900">Upload Study Material</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Publish syllabus references, PDFs, class lecture notes, or reference assets under units.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold px-4" asChild>
            <Link to="/admin/materials">Cancel</Link>
          </Button>
          <Button 
            type="button" 
            size="sm"
            onClick={() => formik.handleSubmit()} 
            disabled={saving || uploading || !formik.isValid}
            className="bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-400 rounded-xl text-xs font-semibold px-5 shadow-sm transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Indexing Bundle...
              </span>
            ) : "Deploy Study Resource"}
          </Button>
        </div>
      </div>

      {/* Two-Column Interactive Form Architecture Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 w-full">
        
        {/* Left Side Form Field Grid Controller (7 Columns layout) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 border-neutral-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white">
            <form onSubmit={formik.handleSubmit} className="space-y-5">
              
              {/* Unit Dropdown Mapper Selection Node */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Target Unit Chapter *</span>
                </Label>
                <Select 
                  value={formik.values.unitId} 
                  onValueChange={(val) => formik.setFieldValue("unitId", val)}
                >
                  <SelectTrigger className={cn(
                    "h-10 border-neutral-200 rounded-xl text-xs focus:ring-0 focus:border-neutral-900 bg-white transition-all",
                    formik.touched.unitId && formik.errors.unitId && "border-rose-400 focus:border-rose-500"
                  )}>
                    <SelectValue placeholder={loadingUnits ? "Synchronizing ledger..." : "Map to parent unit"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-lg max-h-[220px]">
                    {units?.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs py-2 rounded-lg cursor-pointer">
                        Unit {u.unit_number} : {u.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formik.touched.unitId && formik.errors.unitId && (
                  <p className="text-[11px] font-medium text-rose-500">{formik.errors.unitId}</p>
                )}
              </div>

              {/* Resource Document Title Input String */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Document Resource Title *</span>
                </Label>
                <Input 
                  name="title"
                  value={formik.values.title} 
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., Chapter 2 Handouts - Database Normalization & Forms"
                  className={cn(
                    "h-10 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-900 transition-all bg-white",
                    formik.touched.title && formik.errors.title && "border-rose-400 focus-visible:border-rose-500"
                  )}
                />
                {formik.touched.title && formik.errors.title && (
                  <p className="text-[11px] font-medium text-rose-500">{formik.errors.title}</p>
                )}
              </div>

              {/* Metadata Indicators Layer Grid Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* File Classification Dropdown Type Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700">Resource Category Class *</Label>
                  <Select 
                    value={formik.values.fileType} 
                    onValueChange={(val) => formik.setFieldValue("fileType", val)}
                  >
                    <SelectTrigger className="h-10 border-neutral-200 rounded-xl text-xs focus:ring-0 focus:border-neutral-900 bg-white">
                      <SelectValue placeholder="Format descriptor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-md">
                      <SelectItem value="pdf" className="text-xs cursor-pointer">PDF Document</SelectItem>
                      <SelectItem value="notes" className="text-xs cursor-pointer">Handwritten Notes</SelectItem>
                      <SelectItem value="image" className="text-xs cursor-pointer">Graphic Blueprint/Image</SelectItem>
                      <SelectItem value="doc" className="text-xs cursor-pointer">Word / PowerPoint Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* File Size Metric Data Payload Container */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Calculated Capacity Size</span>
                  </Label>
                  <Input 
                    name="fileSize"
                    value={formik.values.fileSize} 
                    onChange={formik.handleChange}
                    placeholder="e.g., 2.4 MB (Auto-evaluated on upload)"
                    className="h-10 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-900 bg-white"
                  />
                </div>
              </div>

              {/* Custom Navigation Tab Switcher for Source Selection */}
              <div className="space-y-3 pt-2">
                <div className="flex p-1 bg-neutral-100 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => handleTabChange("upload")}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
                      sourceTab === "upload" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
                    )}
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange("url")}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
                      sourceTab === "url" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900"
                    )}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Provide Asset URL
                  </button>
                </div>

                {/* Dynamic Binary Storage Dropzone Engine Area / URL Form Controller */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                    <span>Resource Streaming Attachment *</span>
                  </Label>

                  {sourceTab === "upload" ? (
                    // --- UPLOAD FILE SUB-WORKSPACE ---
                    !formik.values.fileUrl ? (
                      <label className={cn(
                        "flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-neutral-200/90 rounded-2xl cursor-pointer hover:bg-neutral-50/50 hover:border-neutral-400/80 transition-all group relative",
                        (!formik.values.unitId || uploading) && "opacity-50 cursor-not-allowed pointer-events-none bg-neutral-50"
                      )}>
                        <div className="flex flex-col items-center justify-center pt-4 pb-4 px-4 text-center">
                          {uploading ? (
                            <>
                              <Loader2 className="h-7 w-7 text-neutral-500 animate-spin mb-2" />
                              <p className="text-xs font-bold text-neutral-700">Streaming bits into academic file storage buckets...</p>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-7 w-7 text-neutral-400 group-hover:text-neutral-600 transition-colors mb-2" />
                              <p className="text-xs font-bold text-neutral-600">Select Document or Slide Asset</p>
                              <p className="text-[10px] text-neutral-400 mt-1 uppercase font-semibold tracking-wider">PDFs, Documents, Images, Notes up to 25MB</p>
                            </>
                          )}
                        </div>
                        <input 
                          type="file" 
                          accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,image/*" 
                          className="hidden" 
                          onChange={handleFileProcessPipeline} 
                          disabled={!formik.values.unitId || uploading}
                        />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-4 border border-emerald-200 bg-emerald-50/30 rounded-2xl shadow-inner group">
                        <div className="flex items-center gap-3 truncate pr-4">
                          <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-xs font-bold text-neutral-800 truncate leading-snug">{localFileName || "Academic Resource Attachment Node"}</span>
                            <span className="text-[10px] text-neutral-400 font-medium mt-0.5 uppercase font-mono">
                              Format: {formik.values.fileType} · Size: {formik.values.fileSize || "Verified"}
                            </span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={clearUploadedFileNode}
                          className="p-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-400 hover:text-rose-500 hover:border-rose-100 shadow-sm transition-all flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  ) : (
                    // --- MANAGE EXTERNAL ASSET STREAM LINK ---
                    <div className="space-y-3">
                      <div className="relative flex items-center">
                        <Link2 className="absolute left-3.5 h-4 w-4 text-neutral-400" />
                        <Input
                          name="fileUrl"
                          type="url"
                          value={formik.values.fileUrl}
                          onChange={handleUrlInputChange}
                          onBlur={formik.handleBlur}
                          placeholder="https://example.com/assets/lecture-notes.pdf"
                          disabled={!formik.values.unitId}
                          className={cn(
                            "h-11 pl-10 pr-10 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-900 bg-white w-full",
                            formik.touched.fileUrl && formik.errors.fileUrl && "border-rose-400 focus-visible:border-rose-500",
                            !formik.values.unitId && "opacity-50 cursor-not-allowed bg-neutral-50"
                          )}
                        />
                        {formik.values.fileUrl && (
                          <button
                            type="button"
                            onClick={clearUploadedFileNode}
                            className="absolute right-3 p-1 rounded-md text-neutral-400 hover:text-neutral-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {!formik.values.unitId && (
                        <p className="text-[10px] font-medium text-amber-600">Please select a parent unit module before inserting link records.</p>
                      )}
                    </div>
                  )}

                  {formik.touched.fileUrl && formik.errors.fileUrl && (
                    <p className="text-[11px] font-medium text-rose-500">{formik.errors.fileUrl}</p>
                  )}
                </div>
              </div>

            </form>
          </Card>
        </div>

        {/* Right Side Column Dashboard Render Mockup Engine (5 Columns layout) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-2 text-neutral-400 px-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Live Resource Card Preview</span>
          </div>

          <Card className="overflow-hidden border border-neutral-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl bg-white p-5 space-y-4">
            
            {/* Displaying structural hierarchy tree paths */}
            <div className="border-b border-neutral-100 pb-3 flex flex-col">
              <span className="text-[9px] font-mono font-bold uppercase text-neutral-400 tracking-wider">Academic Module Node</span>
              <span className="text-xs font-bold text-neutral-800 truncate mt-0.5">
                {selectedUnit ? `Unit ${selectedUnit.unit_number} : ${selectedUnit.title}` : "Awaiting Unit Assignment Mapping..."}
              </span>
            </div>

            {/* Simulated Live User View Asset Card Container Box */}
            <div className="p-4 bg-neutral-50/70 border border-neutral-200/60 rounded-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 truncate">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[9px] uppercase font-mono font-bold tracking-wider bg-white border px-2 py-0.5 rounded-md",
                    formik.values.fileType === "pdf" && "text-rose-600 border-rose-200 bg-rose-50/20",
                    formik.values.fileType === "notes" && "text-amber-600 border-amber-200 bg-amber-50/20",
                    formik.values.fileType === "image" && "text-blue-600 border-blue-200 bg-blue-50/20",
                    formik.values.fileType === "doc" && "text-indigo-600 border-indigo-200 bg-indigo-50/20"
                  )}>
                    {formik.values.fileType} Registry
                  </span>
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-tight pt-1 leading-snug line-clamp-2">
                    {formik.values.title || "Untitled Study Resource Reference Header"}
                  </h4>
                </div>
              </div>

              {/* Size metrics visualization badge element */}
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1">
                <span>Payload Weight:</span>
                <span className="text-neutral-700 font-bold">{formik.values.fileSize || "0.00 MB"}</span>
              </div>
            </div>

            {/* Status Warning Signal Flag */}
            <div className={cn(
              "p-3 rounded-xl border text-[10px] leading-normal text-center font-medium transition-all",
              formik.isValid && formik.values.fileUrl
                ? "bg-emerald-50/40 border-emerald-100 text-emerald-600"
                : "bg-amber-50/40 border-amber-100 text-amber-600"
            )}>
              {formik.isValid && formik.values.fileUrl 
                ? "Resource verified. Asset binary bundle fully staged and ready for secure server deployment." 
                : "Please map structural chapter properties and dispatch upload pipelines to build binary node entries."}
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}