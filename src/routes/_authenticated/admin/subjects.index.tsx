import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit3, Loader2, UploadCloud, GraduationCap, BookOpen, Layers, X, ShieldAlert } from "lucide-react";

type Row = { 
  id: string; 
  semester_id: string; 
  name: string; 
  subject_code: string | null; 
  slug: string; 
  description: string | null; 
  thumbnail_url: string | null; 
  created_at: string 
};
type Sem = { id: string; semester_number: number; course_id: string };
type Course = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/subjects/")({
  head: () => ({ meta: [{ title: "Academic Subjects — Portal" }] }),
  component: ManageSubjects,
});

function ManageSubjects() {
  // insert ફંક્શનને પણ અહીંથી ડીસ્ટ્રક્ચર કરી લીધું
  const { data, loading, remove, update, insert } = useSupabaseTable<Row>("subjects");
  const { data: sems } = useSupabaseTable<Sem>("semesters");
  const { data: courses } = useSupabaseTable<Course>("courses");

  // Core Dialog State Management
  const [selectedSubject, setSelectedSubject] = useState<Row | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // નવું Add મોડલ સ્ટેટ
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [creating, setCreating] = useState(false); // નવું ક્રિએટિંગ સ્ટેટ

  // Strictly bound schema fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // Analytical Relational Helpers
  const getCourseName = (courseId: string) => courses?.find(c => c.id === courseId)?.name ?? "Global Program";
  
  const getSemDetails = (semId: string) => {
    const sem = sems?.find(s => s.id === semId);
    if (!sem) return { fullString: "Unallocated", courseName: "—", semNum: "—" };
    const cName = getCourseName(sem.course_id);
    return {
      fullString: `${cName} · Sem ${sem.semester_number}`,
      courseName: cName,
      semNum: `Semester ${sem.semester_number}`
    };
  };

  // ફોર્મના સ્ટેટ્સ ખાલી કરવા માટેનું હેલ્પર ફંક્શન
  const resetFormFields = () => {
    setName("");
    setSlug("");
    setCode("");
    setDescription("");
    setSemesterId("");
    setThumbnailUrl("");
    setSelectedSubject(null);
  };

  // Add બટન ક્લિક હેન્ડલર
  const handleAddInitialize = () => {
    resetFormFields();
    setIsAddModalOpen(true);
  };

  // Initialize Modal Context on Action Trigger
  const handleEditInitialize = (subject: Row) => {
    setSelectedSubject(subject);
    setName(subject.name);
    setSlug(subject.slug);
    setCode(subject.subject_code || "");
    setDescription(subject.description || "");
    setSemesterId(subject.semester_id);
    setThumbnailUrl(subject.thumbnail_url || "");
    setIsModalOpen(true);
  };

  // Secure File Pipeline for University Assets Bucket
  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const uniquePath = `subjects/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("university-assets")
        .upload(uniquePath, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("university-assets")
        .getPublicUrl(uniquePath);

      setThumbnailUrl(publicUrl);
    } catch (err) {
      console.error("Asset Pipeline Failure:", err);
    } finally {
      setUploading(false);
    }
  };

  // નવો સબ્જેક્ટ સબમિટ કરવા માટેનું ફંક્શન
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const isInserted = await insert({
        name,
        slug: slug || slugify(name),
        subject_code: code || null,
        description: description || null,
        semester_id: semesterId,
        thumbnail_url: thumbnailUrl || null
      });
      if (isInserted) {
        setIsAddModalOpen(false);
        resetFormFields();
      }
    } catch (err) {
      console.error("Database Insertion Refusal:", err);
    } finally {
      setCreating(false);
    }
  };

  // Data Sync Submission Layer
  const handleCommitChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    try {
      setUpdating(true);
      const isCommitted = await update(selectedSubject.id, {
        name,
        slug: slug || slugify(name),
        subject_code: code || null,
        description: description || null,
        semester_id: semesterId,
        thumbnail_url: thumbnailUrl || null
      });
      if (isCommitted) setIsModalOpen(false);
    } catch (err) {
      console.error("Database Update Refusal:", err);
    } finally {
      setUpdating(false);
    }
  };

  // Clean, Standardized Flex-Safe Table Schema
  const columns: DataTableColumn<Row>[] = [
    {
      key: "name",
      header: "Academic Curriculum Node",
      sortable: true,
      sortValue: (r) => r.name,
      accessor: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-neutral-50 border border-neutral-200/60 flex-shrink-0 overflow-hidden flex items-center justify-center">
            {r.thumbnail_url ? (
              <img src={r.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="h-4 w-4 text-neutral-400 stroke-[1.5]" />
            )}
          </div>
          <div className="flex flex-col truncate">
            <span className="font-semibold text-neutral-900 text-[13px] uppercase tracking-tight leading-normal">
              {r.name}
            </span>
            <span className="text-[11px] font-mono text-neutral-400/90 lowercase">
              /{r.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "code",
      header: "Registry Code",
      accessor: (r) => r.subject_code ? (
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-neutral-600 bg-neutral-100 border border-neutral-200/50 px-2 py-0.5 rounded-full">
          {r.subject_code}
        </span>
      ) : (
        <span className="text-neutral-300 text-xs">—</span>
      ),
    },
    {
      key: "semester",
      header: "Department Map",
      accessor: (r) => {
        const details = getSemDetails(r.semester_id);
        return (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-neutral-700 uppercase tracking-tight">
              {details.courseName}
            </span>
            <span className="text-[11px] font-medium text-neutral-400 mt-0.5">
              {details.semNum}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      accessor: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-neutral-400 hover:text-neutral-900 rounded-lg transition-colors"
            onClick={() => handleEditInitialize(r)}
          >
            <Edit3 className="h-4 w-4 stroke-[1.8]" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-neutral-400 hover:text-red-600 rounded-lg transition-colors"
            onClick={() => {
              if (confirm(`Are you sure you want to deprecate "${r.name}" from curriculum?`)) remove(r.id);
            }}
          >
            <Trash2 className="h-4 w-4 stroke-[1.8]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-5 px-4 pb-6 max-w-full antialiased">
      {/* Upper Registry Panel Title Block */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="h-4 w-4 rounded bg-neutral-900 flex items-center justify-center text-[9px] text-white font-bold font-mono">U</div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">University Management</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Academic Subjects</h1>
        </div>
        
        {/* Link ને બદલે સીધું બટન રાખીને મોડલ ઓપન કરાવ્યું */}
        <Button 
          onClick={handleAddInitialize} 
          size="sm" 
          className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-9 px-4 shadow-sm tracking-wide"
        >
          <Plus className="mr-1 h-3.5 w-3.5 stroke-[2.5]" /> Add Subject
        </Button>
      </div>

      {/* Grid Canvas Wrapper */}
      {loading ? (
        <div className="flex items-center justify-center py-24 border border-neutral-100 rounded-2xl bg-neutral-50/20">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
        </div>
      ) : data && data.length > 0 ? (
        <div className="w-full">
          <DataTable<Row> 
            data={data} 
            columns={columns} 
            searchableKeys={["name", "slug", "subject_code"]} 
            rowKey={(r) => r.id} 
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-neutral-200 rounded-2xl bg-white p-6">
          <ShieldAlert className="h-5 w-5 text-neutral-400 mb-2" />
          <h3 className="text-xs font-semibold text-neutral-950">No structural subject nodes deployed</h3>
        </div>
      )}

      {/* 1. NEW Add Subject Drawer Popover */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] rounded-2xl border-neutral-200 bg-white p-5 shadow-2xl overflow-hidden focus:outline-none">
          <DialogHeader className="space-y-1 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
              <Layers className="h-3.5 w-3.5 stroke-[2]" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Registry System Terminal</span>
            </div>
            <DialogTitle className="text-base font-bold text-neutral-900 tracking-tight">Add New Subject</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubject} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-neutral-400" />
                <span>Structural Semester Alignment *</span>
              </Label>
              <Select value={semesterId} onValueChange={setSemesterId} required>
                <SelectTrigger className="h-9 border-neutral-200 rounded-xl text-xs focus:ring-0 focus:border-neutral-400 bg-white transition-all">
                  <SelectValue placeholder="Select target node structural terminal" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-lg max-h-[220px]">
                  {sems?.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-neutral-50 cursor-pointer">
                      {getSemDetails(s.id).fullString}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Subject Title Name *</Label>
                <Input 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 transition-all bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Link URI Route Slug</Label>
                <Input 
                  value={slug} 
                  placeholder={slugify(name) || "auto-generated"}
                  onChange={(e) => setSlug(e.target.value)} 
                  className="h-9 border-neutral-200 rounded-xl text-xs font-mono focus-visible:ring-0 focus-visible:border-neutral-400 transition-all bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Registry Identifier Code</Label>
                <Input 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  placeholder="e.g., PH102"
                  className="h-9 border-neutral-200 rounded-xl text-xs font-mono focus-visible:ring-0 focus-visible:border-neutral-400 transition-all bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Thumbnail Cover Graphic</Label>
                <input 
                  type="file" 
                  id="add-file-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAssetUpload} 
                  disabled={uploading} 
                />
                
                {thumbnailUrl ? (
                  <div className="flex items-center justify-between border border-neutral-200 bg-neutral-50 px-3 rounded-xl h-9">
                    <span className="text-[11px] text-neutral-600 font-bold flex items-center gap-1.5 truncate max-w-[140px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> File Target Linked
                    </span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setThumbnailUrl("")} 
                      className="h-5 w-5 text-neutral-400 hover:text-neutral-900 rounded-md"
                    >
                      <X className="h-3.5 w-3.5 stroke-[2.5]" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById("add-file-upload")?.click()}
                    className="w-full h-9 border-neutral-200 rounded-xl text-xs text-neutral-600 hover:bg-neutral-50 flex items-center justify-center gap-2 transition-all"
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />
                    ) : (
                      <UploadCloud className="h-4 w-4 text-neutral-400 stroke-[1.8]" />
                    )}
                    <span className="font-medium">{uploading ? "Linking Bundle..." : "Upload Cover"}</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700">Abstract Summary Catalog</Label>
              <Textarea 
                rows={3}
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Granular syllabus overview context description..."
                className="border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 transition-all resize-none p-3 bg-white"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-neutral-100 flex flex-row items-center justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl text-xs font-semibold h-9 px-4 border-neutral-200 hover:bg-neutral-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={creating || uploading}
                className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-9 px-5 shadow-sm transition-all"
              >
                {creating ? "Creating..." : "Save Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Existing Edit Subject Drawer Popover */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] rounded-2xl border-neutral-200 bg-white p-5 shadow-2xl overflow-hidden focus:outline-none">
          <DialogHeader className="space-y-1 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
              <Layers className="h-3.5 w-3.5 stroke-[2]" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Registry System Terminal</span>
            </div>
            <DialogTitle className="text-base font-bold text-neutral-900 tracking-tight">Edit Subject Specifications</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCommitChanges} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-neutral-400" />
                <span>Structural Semester Alignment *</span>
              </Label>
              <Select value={semesterId} onValueChange={setSemesterId} required>
                <SelectTrigger className="h-9 border-neutral-200 rounded-xl text-xs focus:ring-0 focus:border-neutral-400 bg-white transition-all">
                  <SelectValue placeholder="Select target node structural terminal" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-lg max-h-[220px]">
                  {sems?.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-neutral-50 cursor-pointer">
                      {getSemDetails(s.id).fullString}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Subject Title Name *</Label>
                <Input 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 transition-all bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Link URI Route Slug *</Label>
                <Input 
                  required 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)} 
                  className="h-9 border-neutral-200 rounded-xl text-xs font-mono focus-visible:ring-0 focus-visible:border-neutral-400 transition-all bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Registry Identifier Code</Label>
                <Input 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  placeholder="e.g., PH102"
                  className="h-9 border-neutral-200 rounded-xl text-xs font-mono focus-visible:ring-0 focus-visible:border-neutral-400 transition-all bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Thumbnail Cover Graphic</Label>
                <input 
                  type="file" 
                  id="drawer-file-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAssetUpload} 
                  disabled={uploading} 
                />
                
                {thumbnailUrl ? (
                  <div className="flex items-center justify-between border border-neutral-200 bg-neutral-50 px-3 rounded-xl h-9">
                    <span className="text-[11px] text-neutral-600 font-bold flex items-center gap-1.5 truncate max-w-[140px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> File Target Linked
                    </span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setThumbnailUrl("")} 
                      className="h-5 w-5 text-neutral-400 hover:text-neutral-900 rounded-md"
                    >
                      <X className="h-3.5 w-3.5 stroke-[2.5]" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById("drawer-file-upload")?.click()}
                    className="w-full h-9 border-neutral-200 rounded-xl text-xs text-neutral-600 hover:bg-neutral-50 flex items-center justify-center gap-2 transition-all"
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />
                    ) : (
                      <UploadCloud className="h-4 w-4 text-neutral-400 stroke-[1.8]" />
                    )}
                    <span className="font-medium">{uploading ? "Linking Bundle..." : "Replace Cover"}</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700">Abstract Summary Catalog</Label>
              <Textarea 
                rows={3}
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Granular syllabus overview context description..."
                className="border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 transition-all resize-none p-3 bg-white"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-neutral-100 flex flex-row items-center justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs font-semibold h-9 px-4 border-neutral-200 hover:bg-neutral-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updating || uploading}
                className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-9 px-5 shadow-sm transition-all"
              >
                {updating ? "Syncing..." : "Update Specifications"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}