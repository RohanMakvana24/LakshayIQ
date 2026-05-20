import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BookOpen, GraduationCap, Eye, Image as ImageIcon, UploadCloud, Loader2, X } from "lucide-react";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Sem = { id: string; semester_number: number; course_id: string };
type Course = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/subjects/add")({
  head: () => ({ meta: [{ title: "Add Subject — Lakshay IQ" }] }),
  component: AddSubject,
});

function AddSubject() {
  const nav = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const { insert } = useSupabaseTable("subjects");
  const { data: sems } = useSupabaseTable<Sem>("semesters");
  const { data: courses } = useSupabaseTable<Course>("courses");

  const [semesterId, setSemesterId] = useState("");
  const [name, setName] = useState(""); 
  const [slug, setSlug] = useState("");
  const [code, setCode] = useState(""); 
  const [description, setDescription] = useState("");
  
  // File Upload states
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto slug generation logic
  useEffect(() => {
    if (name && !slug) {
      setSlug(slugify(name));
    }
  }, [name]);

  const courseName = (id: string) => courses?.find((c) => c.id === id)?.name ?? "Course";

  // Handle Local File Binary Selection to Supabase Storage Pipeline
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);

      // Unique file name with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `subject-thumbnails/${fileName}`;

      // ⚠️ વેલિડેટ કરેલી સ્ટોરેજ બકેટ: university-assets
      const { data, error } = await supabase.storage
        .from("university-assets")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      // Upload થયા પછી public access URL રીડ કરવો
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

  const selectedSemDetails = sems?.find((s) => s.id === semesterId);
  const selectedCourseString = selectedSemDetails ? courseName(selectedSemDetails.course_id) : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col gap-6 w-full max-w-full px-2">
      
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
            onClick={() => formRef.current?.requestSubmit()} 
            disabled={saving || uploadingFile || !semesterId}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold px-5 shadow-sm"
          >
            {saving ? "Saving Blueprint..." : "Publish Subject"}
          </Button>
        </div>
      </div>

      {/* Grid Allocation Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 w-full">
        
        {/* Form Entry Context Block */}
        <div className="lg:col-span-7 space-y-6">
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
              
              {/* Semester Map */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700">Target Semester Map *</Label>
                <Select value={semesterId} onValueChange={setSemesterId} required>
                  <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs focus:ring-slate-900/10 focus:border-slate-900">
                    <SelectValue placeholder="Select course semester mapping" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white">
                    {sems && sems.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs focus:bg-slate-50 rounded-lg py-2">
                        {courseName(s.course_id)} · Semester {s.semester_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              {/* Interactive File Upload Area */}
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
                        <span>Uploading file node...</span>
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
        </div>

        {/* Live Card Preview Box */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 px-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Live Subject Node Preview</span>
          </div>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl bg-white flex flex-col">
            
            <div className="h-40 w-full bg-slate-950 flex items-center justify-center relative overflow-hidden group border-b border-slate-100">
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl} 
                  alt="Live Node Media Cover View" 
                  className="w-full h-full object-cover object-center transform transition duration-500"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-600">
                  <ImageIcon className="h-8 w-8 stroke-[1.2]" />
                  <span className="text-[10px] font-medium opacity-60 uppercase tracking-widest">Asset Upload Vector</span>
                </div>
              )}
              
              {code && (
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-200 shadow-sm text-[10px] font-black text-slate-800 font-mono">
                  {code}
                </div>
              )}
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between gap-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
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

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-medium">
                  {description || "Provide an abstract structural overview summary inside the form editor..."}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <BookOpen className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">
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