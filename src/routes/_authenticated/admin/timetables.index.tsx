import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";
import { Plus, Trash2, Edit3, Loader2, School, GraduationCap, Layers, FileText, CalendarDays, ExternalLink, ShieldAlert, FileUp, X, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Row = { 
  id: string; 
  university_id: string; 
  course_id: string; 
  semester_id: string; 
  title: string; 
  exam_start_date: string | null; 
  exam_end_date: string | null; 
  file_url: string; 
  created_at: string 
};
type Named = { id: string; name: string; university_id?: string };
type Sem = { id: string; semester_number: number; course_id: string };

export const Route = createFileRoute("/_authenticated/admin/timetables/")({
  head: () => ({ meta: [{ title: "Exam Timetables — Lakshay IQ" }] }),
  component: ManageTimetables,
});

function ManageTimetables() {
  const { data, loading, remove, update } = useSupabaseTable<Row>("exam_timetables");
  const { data: univs } = useSupabaseTable<Named>("universities", { orderBy: "name", ascending: true });
  const { data: courses } = useSupabaseTable<Named>("courses", { orderBy: "name", ascending: true });
  const { data: sems } = useSupabaseTable<Sem>("semesters");

  // Modal, Loading, & Upload Sync States
  const [selectedTimetable, setSelectedTimetable] = useState<Row | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Dynamic Edit Form Buffers
  const [universityId, setUniversityId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  // Cascade Fields Filtering Logic
  const filteredCourses = courses?.filter((c) => !universityId || c.university_id === universityId) || [];
  const filteredSems = sems?.filter((s) => !courseId || s.course_id === courseId) || [];

  // Data Relational Identity Resolvers
  const getUnivName = (id: string) => univs?.find((x) => x.id === id)?.name ?? "—";
  const getCourseName = (id: string) => courses?.find((x) => x.id === id)?.name ?? "—";
  const getSemName = (id: string) => {
    const s = sems?.find((x) => x.id === id);
    return s ? `Semester ${s.semester_number}` : "—";
  };

  // 1. Storage Bucket Auto-Purge Engine (Delete functionality)
  const handlePurgeTimetable = async (timetable: Row) => {
    if (!confirm(`Are you sure you want to permanently delete: "${timetable.title}"?\nThis will clear the database record and wipe the schedule document from cloud storage.`)) return;

    try {
      if (timetable.file_url.includes("/storage/v1/object/public/university-assets/")) {
        const relativeStoragePath = timetable.file_url.split("/storage/v1/object/public/university-assets/")[1];
        
        if (relativeStoragePath) {
          const { error: storageError } = await supabase.storage
            .from("university-assets")
            .remove([relativeStoragePath]);

          if (storageError) {
            console.warn("Target asset object missing inside cloud bucket. Continuing database wipe:", storageError);
          }
        }
      }
      await remove(timetable.id);
    } catch (err) {
      console.error("Critical error intercepted inside Storage Purge Pipeline:", err);
    }
  };

  // 2. Inline Replacement File Upload Hook
  const handleEditUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!courseId) {
        alert("Please assign a parent Course track before submitting modified schedule streams.");
        return;
      }

      try {
        setUploading(true);
        const fileExt = file.name.split(".").pop();
        const currentCourse = courses?.find(c => c.id === courseId);
        const courseSlug = slugify(currentCourse?.name || "timetable");
        const path = `timetables/${courseSlug}-${Date.now()}.${fileExt}`;

        const { data: storageData, error } = await supabase.storage
          .from("university-assets")
          .upload(path, file, { cacheControl: "3600", upsert: true });

        if (error) throw error;

        const { data: linkData } = supabase.storage.from("university-assets").getPublicUrl(storageData.path);
        setFileUrl(linkData.publicUrl);
      } catch (err) {
        console.error("Cloud binary upload stream failure:", err);
      } finally {
        setUploading(false);
      }
    }
  };

  // Map and hydrate row values into states when Edit Drawer fires open
  const handleEditInitialize = (timetable: Row) => {
    setSelectedTimetable(timetable);
    setUniversityId(timetable.university_id);
    setCourseId(timetable.course_id);
    setSemesterId(timetable.semester_id);
    setTitle(timetable.title);
    setStartDate(timetable.exam_start_date || "");
    setEndDate(timetable.exam_end_date || "");
    setFileUrl(timetable.file_url);
    setIsModalOpen(true);
  };

  // 3. Database Specification Form Commit Update
  const handleCommitUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTimetable || !universityId || !courseId || !semesterId || !title.trim() || !fileUrl) return;

    try {
      setUpdating(true);
      const ok = await update(selectedTimetable.id, {
        university_id: universityId,
        course_id: courseId,
        semester_id: semesterId,
        title: title.trim(),
        exam_start_date: startDate || null,
        exam_end_date: endDate || null,
        file_url: fileUrl,
      });
      if (ok) setIsModalOpen(false);
    } catch (err) {
      console.error("Database update transaction execution refused:", err);
    } finally {
      setUpdating(false);
    }
  };

  // High Density DataTable Columns Data mapping Schema
  const columns: DataTableColumn<Row>[] = [
    {
      key: "title",
      header: "Schedule Header Title",
      sortable: true,
      sortValue: (r) => r.title,
      accessor: (r) => (
        <div className="flex flex-col truncate max-w-[220px] sm:max-w-xs">
          <span className="font-semibold text-neutral-900 text-[13px] tracking-tight leading-normal truncate">
            {r.title}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
            Log Node: {r.id.substring(0, 8)}
          </span>
        </div>
      ),
    },
    {
      key: "university",
      header: "University Branch",
      accessor: (r) => (
        <span className="text-xs font-medium text-neutral-700 truncate max-w-[140px] block">
          {getUnivName(r.university_id)}
        </span>
      ),
    },
    {
      key: "course_sem",
      header: "Course & Term",
      accessor: (r) => (
        <div className="flex flex-col max-w-[150px]">
          <span className="text-xs font-semibold text-neutral-800 truncate">{getCourseName(r.course_id)}</span>
          <span className="text-[10px] font-medium text-neutral-400 mt-0.5">{getSemName(r.semester_id)}</span>
        </div>
      ),
    },
    {
      key: "timeline",
      header: "Active Duration",
      sortable: true,
      sortValue: (r) => r.exam_start_date || "",
      accessor: (r) => (
        <div className="flex flex-col text-[11px] font-mono font-medium text-neutral-600">
          <span>S: {r.exam_start_date || "—"}</span>
          <span className="text-neutral-400">E: {r.exam_end_date || "—"}</span>
        </div>
      ),
    },
    {
      key: "file_url",
      header: "Document",
      accessor: (r) => (
        <a 
          href={r.file_url} 
          target="_blank" 
          rel="noreferrer" 
          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 border border-blue-100/70 px-2 py-0.5 rounded-md transition-colors"
        >
          <ExternalLink className="h-3 w-3 stroke-[2.5]" /> View Chart
        </a>
      ),
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
            onClick={() => handlePurgeTimetable(r)}
          >
            <Trash2 className="h-4 w-4 stroke-[1.8]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-5 px-4 pb-6 max-w-full antialiased">
      
      {/* Top Level Section Title Layout Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="h-4 w-4 rounded bg-neutral-900 flex items-center justify-center text-[9px] text-white font-bold font-mono">T</div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Schedule Terminal</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Exam Timetables</h1>
        </div>
        <Button asChild size="sm" className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-9 px-4 shadow-sm self-start sm:self-auto">
          <Link to="/admin/timetables/add">
            <Plus className="mr-1 h-3.5 w-3.5 stroke-[2.5]" /> Add Timetable
          </Link>
        </Button>
      </div>

      {/* Main Core Registry View Logic */}
      {loading ? (
        <div className="flex items-center justify-center py-24 border border-neutral-100 rounded-2xl bg-neutral-50/20">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
        </div>
      ) : data && data.length > 0 ? (
        <div className="w-full">
          <DataTable<Row> 
            data={data} 
            columns={columns} 
            searchableKeys={["title"]} 
            rowKey={(r) => r.id} 
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-neutral-200 rounded-2xl bg-white p-6">
          <ShieldAlert className="h-5 w-5 text-neutral-400 mb-2" />
          <h3 className="text-xs font-semibold text-neutral-950">No exam charts published yet</h3>
        </div>
      )}

      {/* Popup Dialog Form Cascade Edit Drawer */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[520px] w-[95vw] rounded-2xl border-neutral-200 bg-white p-5 shadow-2xl focus:outline-none overflow-hidden">
          <DialogHeader className="space-y-1 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Schedule Configuration Schema</span>
            </div>
            <DialogTitle className="text-base font-bold text-neutral-900 tracking-tight">Modify Schedule Parameters</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCommitUpdates} className="space-y-4 pt-4">
            
            {/* Cascade Layer 1: University Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <School className="h-3.5 w-3.5 text-neutral-400" />
                <span>Parent University Alignment *</span>
              </Label>
              <Select 
                value={universityId} 
                onValueChange={(val) => {
                  setUniversityId(val);
                  setCourseId("");
                  setSemesterId("");
                }}
                required
              >
                <SelectTrigger className="h-9 border-neutral-200 rounded-xl text-xs focus:ring-0 focus:border-neutral-400 bg-white">
                  <SelectValue placeholder="Select university map" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-lg max-h-[180px]">
                  {univs?.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs py-2 rounded-lg cursor-pointer">{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cascade Layer 2 & 3: Course & Semester Form Row Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Course Track *</span>
                </Label>
                <Select 
                  value={courseId} 
                  disabled={!universityId}
                  onValueChange={(val) => {
                    setCourseId(val);
                    setSemesterId("");
                  }}
                  required
                >
                  <SelectTrigger className="h-9 border-neutral-200 rounded-xl text-xs focus:ring-0 focus:border-neutral-400 bg-white">
                    <SelectValue placeholder="Select course route" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-lg max-h-[180px]">
                    {filteredCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs py-2 rounded-lg cursor-pointer">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Active Term Semester *</span>
                </Label>
                <Select 
                  value={semesterId} 
                  disabled={!courseId}
                  onValueChange={setSemesterId}
                  required
                >
                  <SelectTrigger className="h-9 border-neutral-200 rounded-xl text-xs focus:ring-0 focus:border-neutral-400 bg-white">
                    <SelectValue placeholder="Map semester index" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-lg max-h-[180px]">
                    {filteredSems.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs py-2 rounded-lg cursor-pointer">Semester {s.semester_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Timetable Header Title Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700">Timetable Schema Header Title *</Label>
              <Input 
                required 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 bg-white"
              />
            </div>

            {/* Commencement and Termination Dates Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">Start Date</Label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700">End Date</Label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 bg-white font-mono"
                />
              </div>
            </div>

            {/* Asset Document Pipeline Control */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <FileUp className="h-3.5 w-3.5 text-neutral-400" />
                <span>Replace Schedule Sheet / Attachment</span>
              </Label>
              
              <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-xl bg-neutral-50/50">
                <label className={cn(
                  "px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-[11px] font-bold shadow-sm hover:bg-neutral-50 cursor-pointer flex-shrink-0",
                  uploading && "opacity-40 cursor-wait pointer-events-none"
                )}>
                  {uploading ? "Uploading..." : "Change Document"}
                  <input type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,image/*" className="hidden" onChange={handleEditUpload} />
                </label>
                <div className="truncate text-[11px] text-neutral-500 font-medium">
                  {fileUrl ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                      <CheckCircle className="h-3 w-3" /> Ready to Update
                    </span>
                  ) : "No file mapped"}
                </div>
              </div>
            </div>

            {/* Drawer Form Actions Footer */}
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
                disabled={updating || uploading || !fileUrl}
                className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-9 px-5 shadow-sm transition-all"
              >
                {updating ? "Syncing..." : "Update Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}