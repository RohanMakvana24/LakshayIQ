import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BookOpen, GraduationCap, Eye, Image as ImageIcon, UploadCloud, Loader2, X, School, ClipboardCopy, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Sem = { id: string; semester_number: number; course_id: string };
type Course = { id: string; name: string; university_id: string };
type University = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/subjects/add")({
  head: () => ({ meta: [{ title: "Add Subject — Lakshay IQ" }] }),
  component: AddSubject,
});

function AddSubject() {
  const nav = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Supabase hooks data pipelines
  const { insert } = useSupabaseTable("subjects");
  const { data: sems } = useSupabaseTable<Sem>("semesters");
  const { data: courses } = useSupabaseTable<Course>("courses");
  const { data: universities } = useSupabaseTable<University>("universities");

  // Single mode states
  const [semesterId, setSemesterId] = useState("");
  const [name, setName] = useState(""); 
  const [slug, setSlug] = useState("");
  const [code, setCode] = useState(""); 
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [saving, setSaving] = useState(false);

  // Bulk mode states
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [bulkText, setBulkText] = useState("");
  const [bulkSubjects, setBulkSubjects] = useState<Array<{ name: string; slug: string; code: string; description: string }>>([]);

  // Auto slug generation logic for single mode
  useEffect(() => {
    if (name && !slug) {
      setSlug(slugify(name));
    }
  }, [name]);

  // 🏛️ રિલેશન મેપિંગ હેલ્પર્સ
  const getCourseObj = (cId: string) => courses?.find((c) => c.id === cId);
  const courseName = (cId: string) => getCourseObj(cId)?.name ?? "Course";
  
  const universityName = (cId: string) => {
    const uId = getCourseObj(cId)?.university_id;
    return universities?.find((u) => u.id === uId)?.name ?? "University";
  };

  // Cover image upload logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `subject-thumbnails/${fileName}`;

      const { data, error } = await supabase.storage
        .from("university-assets")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("university-assets")
        .getPublicUrl(filePath);

      setThumbnailUrl(publicUrl);
    } catch (error) {
      console.error("Storage upload failed:", error);
      toast.error("Image upload failed. Check 'university-assets' bucket permissions.");
    } finally {
      setUploadingFile(false);
    }
  };

  const removeThumbnail = () => {
    setThumbnailUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Bulk parsing algorithm with support for codes and names
  const handleBulkTextChange = (text: string) => {
    setBulkText(text);
    if (!text.trim()) {
      setBulkSubjects([]);
      return;
    }

    const lines = text.split("\n");
    const parsedSubjects: Array<{ name: string; slug: string; code: string; description: string }> = [];

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const parts = trimmed.split(/[:\-]/);
      let parsedCode = "";
      let parsedName = "";

      if (parts.length > 1) {
        const possibleCode = parts[0].trim();
        if (possibleCode.length > 0 && possibleCode.length <= 12) {
          parsedCode = possibleCode;
          parsedName = parts.slice(1).join(":").trim();
        } else {
          parsedName = trimmed;
        }
      } else {
        parsedName = trimmed;
      }

      if (parsedName) {
        parsedSubjects.push({
          name: parsedName,
          slug: slugify(parsedName),
          code: parsedCode,
          description: "",
        });
      }
    }

    setBulkSubjects(parsedSubjects);
  };

  const updateBulkSubject = (index: number, field: "name" | "slug" | "code" | "description", value: string) => {
    const updated = [...bulkSubjects];
    updated[index] = {
      ...updated[index],
      [field]: value,
      slug: field === "name" ? slugify(value) : updated[index].slug,
    };
    setBulkSubjects(updated);
  };

  const removeBulkSubject = (index: number) => {
    setBulkSubjects(bulkSubjects.filter((_, i) => i !== index));
  };

  const addEmptyBulkSubject = () => {
    setBulkSubjects([...bulkSubjects, { name: "New Subject", slug: "new-subject", code: "", description: "" }]);
  };

  const handleBulkSave = async () => {
    if (!semesterId) {
      toast.error("Please map a target semester first.");
      return;
    }
    if (bulkSubjects.length === 0) {
      toast.error("No valid subjects parsed to insert.");
      return;
    }

    const invalidSubject = bulkSubjects.find(s => !s.name.trim());
    if (invalidSubject) {
      toast.error("All subjects must have a valid name.");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from("subjects").insert(
        bulkSubjects.map(s => ({
          semester_id: semesterId,
          name: s.name.trim(),
          slug: s.slug.trim() || slugify(s.name),
          subject_code: s.code.trim() || null,
          description: s.description.trim() || null,
          thumbnail_url: null
        }))
      );

      if (error) {
        toast.error(`Database insertion failure: ${error.message}`);
        return;
      }

      toast.success(`Successfully deployed ${bulkSubjects.length} academic subjects!`);
      nav({ to: "/admin/subjects" });
    } catch (err) {
      console.error("Bulk insertion unexpected crash:", err);
      toast.error("An unexpected error occurred during bulk deployment.");
    } finally {
      setSaving(false);
    }
  };

  const selectedSemDetails = sems?.find((s) => s.id === semesterId);
  const selectedCourseString = selectedSemDetails ? courseName(selectedSemDetails.course_id) : null;
  const selectedUniversityString = selectedSemDetails ? universityName(selectedSemDetails.course_id) : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col gap-6 w-full max-w-full px-2 antialiased">
      
      {/* Structural Header Action Elements */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 text-slate-500 hover:text-slate-900 pl-0">
            <Link to="/admin/subjects">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subjects
            </Link>
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Add Subject</h1>
          <p className="text-xs text-slate-500 mt-0.5">Deploy a new subject node with custom vector cover upload assets.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold px-4" asChild>
            <Link to="/admin/subjects">Cancel</Link>
          </Button>
          <Button 
            type="button" 
            size="sm"
            onClick={mode === "single" ? () => formRef.current?.requestSubmit() : handleBulkSave} 
            disabled={
              saving || 
              uploadingFile || 
              !semesterId || 
              (mode === "single" ? !name : bulkSubjects.length === 0)
            }
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold px-5 shadow-sm transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Structuring Node...
              </span>
            ) : mode === "single" ? "Publish Subject" : `Bulk Deploy ${bulkSubjects.length} Subjects`}
          </Button>
        </div>
      </div>

      {/* Grid Allocation Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 w-full">
        
        {/* Form Entry Context Block (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* COMMON REGION: Semester Target Map */}
          <Card className="p-6 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Term Target Selection</span>
              
              {/* Mode Switch Toggle */}
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
                  Single Subject
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

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Target Semester Map *</Label>
              <Select value={semesterId} onValueChange={setSemesterId} required>
                <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs focus:ring-slate-900/10 focus:border-slate-900">
                  <SelectValue placeholder="Select university course semester mapping" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 bg-white max-h-72 overflow-y-auto">
                  {sems && sems.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs focus:bg-slate-50 rounded-lg py-2">
                      <span className="font-bold text-slate-900">{universityName(s.course_id)}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="text-slate-600">{courseName(s.course_id)}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span className="font-semibold text-indigo-600 bg-indigo-50/70 px-1.5 py-0.5 rounded text-[10px]">Sem {s.semester_number}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* DYNAMIC REGION: Mode Content Switch */}
          {mode === "single" ? (
            <Card className="p-6 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white">
              <form ref={formRef} className="grid gap-5 sm:grid-cols-2" onSubmit={async (e) => {
                e.preventDefault();
                if (!semesterId || !name) return;
                setSaving(true);
                const ok = await insert({ 
                  semester_id: semesterId, 
                  name, 
                  slug: slug || slugify(name), 
                  subject_code: code || null, 
                  description: description || null, 
                  thumbnail_url: thumbnailUrl || null 
                });
                setSaving(false); 
                if (ok) nav({ to: "/admin/subjects" });
              }}>
                
                {/* Subject Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Subject Name *</Label>
                  <Input 
                    required 
                    value={name} 
                    onChange={(e) => { 
                      setName(e.target.value); 
                      if (!slug) setSlug(slugify(e.target.value)); 
                    }} 
                    placeholder="e.g., Computer Networks"
                    className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10 focus-visible:border-slate-900"
                  />
                </div>

                {/* SEO Route Slug */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">SEO Route URL Slug *</Label>
                  <Input 
                    required 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)} 
                    placeholder="computer-networks"
                    className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10 focus-visible:border-slate-900"
                  />
                </div>

                {/* Unique Subject Code */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Unique Subject Code</Label>
                  <Input 
                    value={code} 
                    onChange={(e) => setCode(e.target.value)} 
                    placeholder="e.g., CS101" 
                    className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10 focus-visible:border-slate-900"
                  />
                </div>

                {/* Interactive Cover File Upload */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Cover Thumbnail Banner</Label>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                  
                  {thumbnailUrl ? (
                    <div className="flex items-center justify-between border border-emerald-100 bg-emerald-50/50 rounded-xl p-2.5 h-10">
                      <span className="text-[11px] font-medium text-emerald-700 truncate max-w-[200px]">
                        ✓ Thumbnail Asset Linked
                      </span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={removeThumbnail}
                        className="h-6 w-6 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-10 border-dashed border-slate-300 rounded-xl text-xs text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"
                    >
                      {uploadingFile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                          <span>Uploading cover...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4 text-slate-400" />
                          <span>Upload System Image</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Description Abstract */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Curriculum Abstract Summary</Label>
                  <Textarea 
                    rows={4} 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Brief structural overview explaining modules..."
                    className="border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10 focus-visible:border-slate-900 resize-none p-3"
                  />
                </div>

              </form>
            </Card>
          ) : (
            <Card className="p-6 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white space-y-6">
              
              {/* Paste Textarea Control */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ClipboardCopy className="h-4 w-4 text-emerald-500" />
                  <span>Paste Subjects Text for Autoparsing</span>
                </Label>
                <Textarea
                  value={bulkText}
                  onChange={(e) => handleBulkTextChange(e.target.value)}
                  rows={8}
                  placeholder={`Paste list of subjects here. Examples:
CS101: Computer Networks
CS102: Data Structures and Algorithms
CS103: Discrete Mathematics

Or simple subject names:
Web Technology
Operating Systems`}
                  className="border-slate-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-slate-900 transition-all p-3.5 bg-slate-50/50"
                />
                <p className="text-[10px] font-bold text-slate-400">
                  ⚡ Auto-parser supports subject codes mapped via colon/dash "CS101: Subject Name" or plain names!
                </p>
              </div>

              {/* Editable Parsed Result Pipeline */}
              {bulkSubjects.length > 0 && (
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Parsed Drafts ({bulkSubjects.length} Subjects Detected)
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addEmptyBulkSubject}
                      className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/50 gap-1 pl-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Manual Draft
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {bulkSubjects.map((sub, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3 relative group"
                      >
                        {/* Remove Draft Node Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBulkSubject(index)}
                          className="absolute top-2 right-2 h-7 w-7 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          {/* Subject Code Input */}
                          <div className="sm:col-span-3">
                            <Label className="text-[9px] font-black uppercase text-slate-400">Subject Code</Label>
                            <Input
                              type="text"
                              value={sub.code}
                              onChange={(e) => updateBulkSubject(index, "code", e.target.value)}
                              placeholder="CS101"
                              className="h-8 border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          {/* Subject Name Input */}
                          <div className="sm:col-span-9 pr-6">
                            <Label className="text-[9px] font-black uppercase text-slate-400">Subject Name *</Label>
                            <Input
                              type="text"
                              value={sub.name}
                              onChange={(e) => updateBulkSubject(index, "name", e.target.value)}
                              className="h-8 border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        {/* Subject SEO Slug */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          <div className="sm:col-span-12">
                            <Label className="text-[9px] font-black uppercase text-slate-400">SEO URL Slug</Label>
                            <Input
                              type="text"
                              value={sub.slug}
                              onChange={(e) => updateBulkSubject(index, "slug", e.target.value)}
                              className="h-8 border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>

                        {/* Subject Description */}
                        <div>
                          <Label className="text-[9px] font-black uppercase text-slate-400">Abstract Description</Label>
                          <Textarea
                            value={sub.description}
                            onChange={(e) => updateBulkSubject(index, "description", e.target.value)}
                            rows={2}
                            placeholder="Brief description about modules..."
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

        {/* Live Card Preview Box (5 Columns) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 px-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {mode === "single" ? "Live Subject Node Preview" : "Bulk Batch Overview"}
            </span>
          </div>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl bg-white flex flex-col p-5 space-y-5">
            
            {mode === "single" ? (
              <>
                <div className="h-40 w-full bg-slate-950 flex items-center justify-center relative overflow-hidden group border border-slate-200/60 rounded-xl">
                  {thumbnailUrl ? (
                    <img 
                      src={thumbnailUrl} 
                      alt="Live Node Media Cover View" 
                      className="w-full h-full object-cover object-center transform transition duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-650">
                      <ImageIcon className="h-8 w-8 stroke-[1.2] text-slate-400" />
                      <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest text-slate-400">Cover Vector</span>
                    </div>
                  )}
                  
                  {code && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm text-[10px] font-black text-slate-800 font-mono">
                      {code}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                      <GraduationCap className="h-3 w-3" /> 
                      {selectedSemDetails ? `Semester ${selectedSemDetails.semester_number}` : "No Term Target"}
                    </span>
                    {slug && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                        /{slug}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-slate-800 tracking-tight leading-snug">
                    {name || <span className="text-slate-300 italic font-normal">Untitled Subject Identity</span>}
                  </h3>

                  <p className="text-xs text-slate-405 leading-relaxed font-medium line-clamp-2">
                    {description || "Provide an abstract structural overview summary inside the form editor..."}
                  </p>
                </div>
              </>
            ) : (
              /* Bulk Preview Map */
              <div className="space-y-3">
                {bulkSubjects.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 space-y-2">
                    <ClipboardCopy className="h-8 w-8 mx-auto stroke-1" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Waiting for pasted text...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Preview of Subjects to Save ({bulkSubjects.length})</span>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {bulkSubjects.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-700">
                          <div className="flex items-center gap-2 truncate">
                            {s.code && <span className="bg-slate-900 text-white rounded px-1.5 py-0.5 font-black uppercase text-[8px]">{s.code}</span>}
                            <span className="truncate max-w-[200px] uppercase">{s.name}</span>
                          </div>
                          <span className="text-[8px] font-mono text-slate-400">/{s.slug}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🏛️ રિયલ ટાઇમ યુનિવર્સિટી અને કોર્સ કનેક્શન પ્રીવ્યૂ */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <School className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">
                  {selectedUniversityString || <span className="italic text-slate-300 font-normal">University unmapped</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate font-medium text-slate-500">
                  {selectedCourseString || <span className="italic text-slate-300 font-normal">Course stream unmapped</span>}
                </span>
              </div>
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}