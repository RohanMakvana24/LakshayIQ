import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit3, Loader2, UploadCloud, GraduationCap, BookOpen, Layers, X, ExternalLink } from "lucide-react";

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
  const { data, loading, remove, update } = useSupabaseTable<Row>("subjects");
  const { data: sems } = useSupabaseTable<Sem>("semesters");
  const { data: courses } = useSupabaseTable<Course>("courses");

  // Core Dialog State Management
  const [selectedSubject, setSelectedSubject] = useState<Row | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);

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

  // Corporate University Table Definition Matrix
  const columns: DataTableColumn<Row>[] = [
    {
      key: "name",
      header: "Academic Curriculum Node",
      sortable: true,
      sortValue: (r) => r.name,
      accessor: (r) => (
        <div className="flex items-center gap-4 py-1.5">
          <div className="h-10 w-10 rounded-xl bg-neutral-50 border border-neutral-200/80 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
            {r.thumbnail_url ? (
              <img src={r.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="h-4 w-4 text-neutral-400 stroke-[1.5]" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-neutral-900 text-[14px] tracking-tight leading-none mb-1">{r.name}</span>
            <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
              <span>/{r.slug}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "code",
      header: "Registry Code",
      accessor: (r) => r.subject_code ? (
        <span className="font-mono text-[11px] font-bold tracking-wider text-neutral-700 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md">
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
            <span className="text-xs font-semibold text-neutral-800 leading-none mb-1">{details.courseName}</span>
            <span className="text-[10px] font-medium text-neutral-400 tracking-tight">{details.semNum}</span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right w-24",
      accessor: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
            onClick={() => handleEditInitialize(r)}
          >
            <Edit3 className="h-4 w-4 stroke-[1.8]" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition-colors"
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
    <div className="space-y-6 max-w-full px-2">
      {/* Premium Management Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-neutral-900 flex items-center justify-center text-[10px] text-white font-bold font-mono">U</div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Academic Registry</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Curriculum Subjects</h1>
          <p className="text-xs text-neutral-500">Configure core subjects, assign dynamic system keys, and track semester operational routes.</p>
        </div>
        <Button asChild size="sm" className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-10 px-4 shadow-sm tracking-wide self-start sm:self-auto transition-all">
          <Link to="/admin/subjects/add">
            <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" /> Add Subject
          </Link>
        </Button>
      </div>

      {/* Database Node Render Wrapper */}
      {loading ? (
        <div className="flex items-center justify-center py-28 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/30">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            <span className="text-xs font-medium text-neutral-400 tracking-wide">Syncing registry matrices...</span>
          </div>
        </div>
      ) : (
        <Card className="border-neutral-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] rounded-2xl overflow-hidden bg-white">
          <DataTable<Row> 
            data={data} 
            columns={columns} 
            searchableKeys={["name", "slug", "subject_code"]} 
            rowKey={(r) => r.id} 
          />
        </Card>
      )}

      {/* Structural University Update Drawer Popover */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-neutral-200 bg-white p-6 shadow-2xl overflow-hidden">
          <DialogHeader className="space-y-1 pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
              <Layers className="h-3.5 w-3.5 stroke-[2]" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Modification Terminal</span>
            </div>
            <DialogTitle className="text-base font-bold text-neutral-900 tracking-tight">Edit Academic Subject</DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Update routing indices, institutional identifiers, and structural program alignments.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCommitChanges} className="space-y-4 pt-4">
            {/* Master Department Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-neutral-400" />
                <span>Structural Semester Alignment *</span>
              </Label>
              <Select value={semesterId} onValueChange={setSemesterId} required>
                <SelectTrigger className="h-10 border-neutral-200 rounded-xl text-xs focus:ring-1 focus:ring-neutral-400/30 focus:border-neutral-400 bg-white transition-all">
                  <SelectValue placeholder="Map programmatic sequence" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-lg max-h-[220px]">
                  {sems?.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-neutral-50">
                      {getSemDetails(s.id).fullString}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Split Data Row 1 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Subject Name *</Label>
                <Input 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="h-10 border-neutral-200 rounded-xl text-xs focus-visible:ring-1 focus-visible:ring-neutral-400/30 focus-visible:border-neutral-400 transition-all bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Course Link Slug *</Label>
                <Input 
                  required 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)} 
                  className="h-10 border-neutral-200 rounded-xl text-xs font-mono focus-visible:ring-1 focus-visible:ring-neutral-400/30 focus-visible:border-neutral-400 transition-all bg-white"
                />
              </div>
            </div>

            {/* Split Data Row 2 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Institutional System Code</Label>
                <Input 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  placeholder="e.g., PH102"
                  className="h-10 border-neutral-200 rounded-xl text-xs font-mono focus-visible:ring-1 focus-visible:ring-neutral-400/30 focus-visible:border-neutral-400 transition-all bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Vector Banner Asset</Label>
                <input 
                  type="file" 
                  id="drawer-file-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAssetUpload} 
                  disabled={uploading} 
                />
                
                {thumbnailUrl ? (
                  <div className="flex items-center justify-between border border-neutral-200 bg-neutral-50 px-3 rounded-xl h-10 shadow-inner">
                    <span className="text-[11px] text-neutral-600 font-bold flex items-center gap-1.5 truncate max-w-[140px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Asset Bound
                    </span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setThumbnailUrl("")} 
                      className="h-6 w-6 text-neutral-400 hover:text-neutral-900 rounded-md"
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
                    className="w-full h-10 border-neutral-200 rounded-xl text-xs text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 flex items-center justify-center gap-2 transition-all"
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />
                    ) : (
                      <UploadCloud className="h-4 w-4 text-neutral-400 stroke-[1.8]" />
                    )}
                    <span className="font-medium">{uploading ? "Uploading Bundle..." : "Upload New Cover"}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Description Area */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700">Curriculum Abstract Summary</Label>
              <Textarea 
                rows={3}
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Provide a granular course scope or catalog details..."
                className="border-neutral-200 rounded-xl text-xs focus-visible:ring-1 focus-visible:ring-neutral-400/30 focus-visible:border-neutral-400 transition-all resize-none p-3 bg-white"
              />
            </div>

            {/* Footer Form Event Controls */}
            <DialogFooter className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs font-semibold h-10 px-4 border-neutral-200 hover:bg-neutral-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updating || uploading}
                className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-10 px-5 shadow-sm transition-all"
              >
                {updating ? "Syncing System Matrix..." : "Save Subject Node"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}