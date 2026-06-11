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
import { Plus, Trash2, Edit3, Loader2, BookOpen, Calendar, Layers, FileText, ExternalLink, ShieldAlert, FileUp, X, CheckCircle, School, GraduationCap, BookMarked } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Row = { 
  id: string; 
  subject_id: string; 
  year: number; 
  semester: number | null; 
  title: string; 
  file_url: string; 
  has_solution?: boolean;
  created_at: string 
};
type Subject = { id: string; semester_id: string; name: string; subject_code: string | null };
type Sem = { id: string; course_id: string; semester_number: number };
type Course = { id: string; university_id: string; name: string };
type University = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/papers/")({
  head: () => ({ meta: [{ title: "Previous Year Papers — Lakshay IQ" }] }),
  component: ManagePapers,
});

function ManagePapers() {
  const { data, loading, remove, update, refresh } = useSupabaseTable<Row>("previous_year_papers");
  
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [deletingBulk, setDeletingBulk] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedRowIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete the ${selectedRowIds.length} selected papers? This action is irreversible.`)) return;

    try {
      setDeletingBulk(true);
      
      const papersToDelete = data?.filter(r => selectedRowIds.includes(r.id)) || [];
      const relativeStoragePaths: string[] = [];
      
      for (const paper of papersToDelete) {
        if (paper.file_url && paper.file_url.includes("/storage/v1/object/public/university-assets/")) {
          const relativeStoragePath = paper.file_url.split("/storage/v1/object/public/university-assets/")[1];
          if (relativeStoragePath) {
            relativeStoragePaths.push(relativeStoragePath);
          }
        }
      }

      if (relativeStoragePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("university-assets")
          .remove(relativeStoragePaths);
        if (storageError) {
          console.warn("Storage deletion warning:", storageError);
        }
      }

      const { error } = await supabase
        .from("previous_year_papers")
        .delete()
        .in("id", selectedRowIds);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Successfully deleted ${selectedRowIds.length} papers`);
        setSelectedRowIds([]);
        refresh();
      }
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.error("Failed to delete selected papers.");
    } finally {
      setDeletingBulk(false);
    }
  };
  
  // 🆕 રિલેશનલ ચેઇન માટે તમામ માસ્ટર ડેટા ટેબલ્સ પાઇપલાઇન
  const { data: subjects, loading: loadingSubjects } = useSupabaseTable<Subject>("subjects", { orderBy: "name", ascending: true });
  const { data: semesters } = useSupabaseTable<Sem>("semesters");
  const { data: courses } = useSupabaseTable<Course>("courses");
  const { data: universities } = useSupabaseTable<University>("universities");

  // Filter states
  const [selectedUniversityId, setSelectedUniversityId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const filteredCourses = selectedUniversityId ? courses?.filter(c => c.university_id === selectedUniversityId) : courses;
  const filteredSemesters = selectedCourseId ? semesters?.filter(s => s.course_id === selectedCourseId) : semesters;
  const filteredSubjects = selectedSemesterId ? subjects?.filter(sub => sub.semester_id === selectedSemesterId) : subjects;

  const sortedCourses = [...(filteredCourses ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const sortedSemesters = [...(filteredSemesters ?? [])].sort((a, b) => a.semester_number - b.semester_number);
  const sortedSubjects = [...(filteredSubjects ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  const hasActiveFilters = !!(selectedUniversityId || selectedCourseId || selectedSemesterId || selectedSubjectId);

  const filteredData = data?.filter((row) => {
    if (selectedUniversityId) {
      const subjectObj = subjects?.find((s) => s.id === row.subject_id);
      const semObj = semesters?.find((sem) => sem.id === subjectObj?.semester_id);
      const courseObj = courses?.find((c) => c.id === semObj?.course_id);
      if (courseObj?.university_id !== selectedUniversityId) return false;
    }

    if (selectedCourseId) {
      const subjectObj = subjects?.find((s) => s.id === row.subject_id);
      const semObj = semesters?.find((sem) => sem.id === subjectObj?.semester_id);
      if (semObj?.course_id !== selectedCourseId) return false;
    }

    if (selectedSemesterId) {
      const subjectObj = subjects?.find((s) => s.id === row.subject_id);
      if (subjectObj?.semester_id !== selectedSemesterId) return false;
    }

    if (selectedSubjectId && row.subject_id !== selectedSubjectId) {
      return false;
    }

    return true;
  }) ?? [];

  // Modal and Sync State Machine
  const [selectedPaper, setSelectedPaper] = useState<Row | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form Field Buffers
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [semester, setSemester] = useState<number | "">("");
  const [fileUrl, setFileUrl] = useState("");
  const [hasSolution, setHasSolution] = useState(false);

  // 🏛️ 🛠️ CHAIN MAPPER: subject_id ના આધારે છેક યુનિવર્સિટી સુધીનો ડેટા સિંગલ શૉટમાં ફિલ્ટર કરવા માટે
  const resolvePaperChain = (subId: string) => {
    const fallback = { uni: "—", course: "—", sem: "—", subject: "—", code: "—", semNum: 0 };
    if (!subjects || !semesters || !courses || !universities) return fallback;

    const subjectObj = subjects.find(s => s.id === subId);
    if (!subjectObj) return fallback;

    const semObj = semesters.find(sem => sem.id === subjectObj.semester_id);
    if (!semObj) return { ...fallback, subject: subjectObj.name, code: subjectObj.subject_code?.toUpperCase() ?? "—" };

    const courseObj = courses.find(c => c.id === semObj.course_id);
    if (!courseObj) return { ...fallback, sem: `Sem ${semObj.semester_number}`, semNum: semObj.semester_number, subject: subjectObj.name, code: subjectObj.subject_code?.toUpperCase() ?? "—" };

    const uniObj = universities.find(u => u.id === courseObj.university_id);

    return {
      uni: uniObj?.name ?? "—",
      course: courseObj.name,
      sem: `Sem ${semObj.semester_number}`,
      semNum: semObj.semester_number,
      subject: subjectObj.name,
      code: subjectObj.subject_code?.toUpperCase() ?? "—"
    };
  };

  // Storage File Extractor & Purge Pipeline (Delete functionality)
  const handlePurgePaperAsset = async (paper: Row) => {
    if (!confirm(`Are you sure you want to permanently erase: "${paper.title}"? This will delete the database record and wipe the asset file from cloud buckets.`)) return;

    try {
      if (paper.file_url.includes("/storage/v1/object/public/university-assets/")) {
        const relativeStoragePath = paper.file_url.split("/storage/v1/object/public/university-assets/")[1];
        
        if (relativeStoragePath) {
          const { error: storageError } = await supabase.storage
            .from("university-assets")
            .remove([relativeStoragePath]);

          if (storageError) {
            console.warn("Storage object missing or already deleted. Proceeding to drop relational tuple:", storageError);
          }
        }
      }
      await remove(paper.id);
    } catch (err) {
      console.error("Critical block exception intercepted inside Purge Pipeline:", err);
    }
  };

  // Initialize form properties inside current drawer context
  const handleEditInitialize = (paper: Row) => {
    setSelectedPaper(paper);
    setSubjectId(paper.subject_id);
    setTitle(paper.title);
    setYear(paper.year);
    setSemester(paper.semester ?? "");
    setFileUrl(paper.file_url);
    setHasSolution(paper.has_solution || false);
    setIsModalOpen(true);
  };

  // Database Specification Update Handler
  const handleCommitUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaper || !subjectId || !title.trim() || !fileUrl) return;

    try {
      setUpdating(true);
      const ok = await update(selectedPaper.id, {
        subject_id: subjectId,
        title: title.trim(),
        year: Number(year),
        semester: semester === "" ? null : Number(semester),
        file_url: fileUrl,
        has_solution: hasSolution,
      });
      if (ok) setIsModalOpen(false);
    } catch (err) {
      console.error("Database transaction submission refused:", err);
    } finally {
      setUpdating(false);
    }
  };

  // 📊 કૉલમ્સ ગ્રીડ કોન્ફિગરેશન (તમામ રિલેશન્સ અલગ-અલગ કૉલમમાં સેટ કર્યા છે)
  const columns: DataTableColumn<Row>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          className="rounded border-neutral-300 dark:border-zinc-700 text-neutral-900 focus:ring-neutral-500 h-3.5 w-3.5 cursor-pointer accent-neutral-900"
          checked={filteredData.length > 0 && filteredData.every(r => selectedRowIds.includes(r.id))}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowIds((prev) => {
                const uniqueIds = new Set([...prev, ...filteredData.map((r) => r.id)]);
                return Array.from(uniqueIds);
              });
            } else {
              const filteredIds = filteredData.map((r) => r.id);
              setSelectedRowIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
            }
          }}
        />
      ),
      accessor: (r) => (
        <input
          type="checkbox"
          className="rounded border-neutral-300 dark:border-zinc-700 text-neutral-900 focus:ring-neutral-500 h-3.5 w-3.5 cursor-pointer accent-neutral-900"
          checked={selectedRowIds.includes(r.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowIds((prev) => [...prev, r.id]);
            } else {
              setSelectedRowIds((prev) => prev.filter((id) => id !== r.id));
            }
          }}
        />
      ),
    },
    {
      key: "title",
      header: "Paper / Resource Title",
      sortable: true,
      sortValue: (r) => r.title,
      accessor: (r) => (
        <div className="flex flex-col truncate max-w-[200px] sm:max-w-xs">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-neutral-900 text-[13px] tracking-tight leading-normal truncate">
              {r.title}
            </span>
            {r.has_solution ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md flex-shrink-0">Solution</span>
            ) : (
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-md flex-shrink-0">QP Only</span>
            )}
          </div>
          <span className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate">
            ID: {r.id.substring(0, 8)}...
          </span>
        </div>
      ),
    },
    {
      key: "university",
      header: "University",
      sortable: true,
      sortValue: (r) => resolvePaperChain(r.subject_id).uni,
      accessor: (r) => (
        <div className="flex items-center gap-1.5 max-w-[150px] py-0.5">
          <School className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
          <span className="font-semibold text-neutral-700 truncate text-xs">
            {resolvePaperChain(r.subject_id).uni}
          </span>
        </div>
      ),
    },
    {
      key: "course",
      header: "Course",
      sortable: true,
      sortValue: (r) => resolvePaperChain(r.subject_id).course,
      accessor: (r) => (
        <div className="flex items-center gap-1.5 max-w-[150px] py-0.5">
          <GraduationCap className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
          <span className="font-medium text-neutral-600 truncate text-xs">
            {resolvePaperChain(r.subject_id).course}
          </span>
        </div>
      ),
    },
    {
      key: "semester",
      header: "Sem",
      sortable: true,
      sortValue: (r) => r.semester ?? resolvePaperChain(r.subject_id).semNum,
      accessor: (r) => (
        <span className="text-xs font-bold text-neutral-800">
          {r.semester ? `Sem ${r.semester}` : resolvePaperChain(r.subject_id).sem}
        </span>
      ),
    },
    {
      key: "subject",
      header: "Mapped Subject",
      sortable: true,
      sortValue: (r) => resolvePaperChain(r.subject_id).subject,
      accessor: (r) => {
        const meta = resolvePaperChain(r.subject_id);
        return (
          <div className="flex flex-col max-w-[160px]">
            <span className="text-xs font-semibold text-neutral-700 truncate">{meta.subject}</span>
            {meta.code !== "—" && (
              <span className="text-[10px] font-mono font-bold text-neutral-400 mt-0.5">Code: {meta.code}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "year",
      header: "Exam Year",
      sortable: true,
      sortValue: (r) => r.year,
      accessor: (r) => (
        <span className="font-mono text-xs font-bold text-neutral-800 bg-neutral-50 px-2 py-0.5 border border-neutral-200 rounded-md">
          {r.year}
        </span>
      ),
    },
    {
      key: "file_url",
      header: "Asset Registry",
      accessor: (r) => (
        <a 
          href={r.file_url} 
          target="_blank" 
          rel="noreferrer" 
          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 border border-blue-100/80 px-2 py-0.5 rounded-md shadow-sm transition-colors"
        >
          <ExternalLink className="h-3 w-3 stroke-[2.5]" /> Launch
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
            onClick={() => handlePurgePaperAsset(r)}
          >
            <Trash2 className="h-4 w-4 stroke-[1.8]" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-5 px-4 pb-6 max-w-full antialiased">
      
      {/* Action System Header Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="h-4 w-4 rounded bg-neutral-900 flex items-center justify-center text-[9px] text-white font-bold font-mono">P</div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Resource Matrix</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Previous Year Papers (PYQs)</h1>
        </div>
        <Button asChild size="sm" className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-9 px-4 shadow-sm self-start sm:self-auto">
          <Link to="/admin/papers/add">
            <Plus className="mr-1 h-3.5 w-3.5 stroke-[2.5]" /> Archive Paper
          </Link>
        </Button>
      </div>

      {/* 🔍 FILTER SYSTEMS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 border border-neutral-100 dark:border-zinc-800 rounded-2xl bg-neutral-50/30 dark:bg-zinc-900/10">
        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-zinc-500">University</label>
          <Select
            value={selectedUniversityId || "ALL_UNIVERSITIES"}
            onValueChange={(val) => {
              const parsed = val === "ALL_UNIVERSITIES" ? "" : val;
              setSelectedUniversityId(parsed);
              setSelectedCourseId("");
              setSelectedSemesterId("");
              setSelectedSubjectId("");
            }}
          >
            <SelectTrigger className="h-9 border-neutral-200 dark:border-zinc-800 rounded-lg text-xs focus:ring-0 focus:border-neutral-400 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 transition-all">
              <SelectValue placeholder="All Universities" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-neutral-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 shadow-lg max-h-[220px]">
              <SelectItem value="ALL_UNIVERSITIES" className="text-xs py-2 rounded-lg my-0.5 focus:bg-neutral-50 dark:focus:bg-zinc-800 cursor-pointer">
                All Universities
              </SelectItem>
              {universities?.map((u) => (
                <SelectItem key={u.id} value={u.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-neutral-50 dark:focus:bg-zinc-800 cursor-pointer">
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-zinc-500">Course</label>
          <Select
            value={selectedCourseId || "ALL_COURSES"}
            onValueChange={(val) => {
              const parsed = val === "ALL_COURSES" ? "" : val;
              setSelectedCourseId(parsed);
              setSelectedSemesterId("");
              setSelectedSubjectId("");
            }}
            disabled={!selectedUniversityId && !!universities?.length}
          >
            <SelectTrigger className="h-9 border-neutral-200 dark:border-zinc-800 rounded-lg text-xs focus:ring-0 focus:border-neutral-400 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 transition-all disabled:opacity-50">
              <SelectValue placeholder={selectedUniversityId ? "All Courses" : "Select University First"} />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-neutral-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 shadow-lg max-h-[220px]">
              <SelectItem value="ALL_COURSES" className="text-xs py-2 rounded-lg my-0.5 focus:bg-neutral-50 dark:focus:bg-zinc-800 cursor-pointer">
                All Courses
              </SelectItem>
              {sortedCourses?.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-neutral-50 dark:focus:bg-zinc-800 cursor-pointer">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-zinc-500">Semester</label>
          <Select
            value={selectedSemesterId || "ALL_SEMESTERS"}
            onValueChange={(val) => {
              const parsed = val === "ALL_SEMESTERS" ? "" : val;
              setSelectedSemesterId(parsed);
              setSelectedSubjectId("");
            }}
            disabled={!selectedCourseId}
          >
            <SelectTrigger className="h-9 border-neutral-200 dark:border-zinc-800 rounded-lg text-xs focus:ring-0 focus:border-neutral-400 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 transition-all disabled:opacity-50">
              <SelectValue placeholder={selectedCourseId ? "All Semesters" : "Select Course First"} />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-neutral-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 shadow-lg max-h-[220px]">
              <SelectItem value="ALL_SEMESTERS" className="text-xs py-2 rounded-lg my-0.5 focus:bg-neutral-50 dark:focus:bg-zinc-800 cursor-pointer">
                All Semesters
              </SelectItem>
              {sortedSemesters?.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-neutral-50 dark:focus:bg-zinc-800 cursor-pointer">
                  Semester {s.semester_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-zinc-500">Subject</label>
          <Select
            value={selectedSubjectId || "ALL_SUBJECTS"}
            onValueChange={(val) => {
              const parsed = val === "ALL_SUBJECTS" ? "" : val;
              setSelectedSubjectId(parsed);
            }}
            disabled={!selectedSemesterId}
          >
            <SelectTrigger className="h-9 border-neutral-200 dark:border-zinc-800 rounded-lg text-xs focus:ring-0 focus:border-neutral-400 bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-200 transition-all disabled:opacity-50">
              <SelectValue placeholder={selectedSemesterId ? "All Subjects" : "Select Semester First"} />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-neutral-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 shadow-lg max-h-[220px]">
              <SelectItem value="ALL_SUBJECTS" className="text-xs py-2 rounded-lg my-0.5 focus:bg-neutral-50 dark:focus:bg-zinc-800 cursor-pointer">
                All Subjects
              </SelectItem>
              {sortedSubjects?.map((sub) => (
                <SelectItem key={sub.id} value={sub.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-neutral-50 dark:focus:bg-zinc-800 cursor-pointer">
                  {sub.subject_code ? `[${sub.subject_code.toUpperCase()}] ` : ""}{sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          {hasActiveFilters ? (
            <Button
              onClick={() => {
                setSelectedUniversityId("");
                setSelectedCourseId("");
                setSelectedSemesterId("");
                setSelectedSubjectId("");
              }}
              variant="outline"
              size="sm"
              className="w-full h-9 rounded-lg text-xs font-bold border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/30 dark:hover:bg-rose-950/20 text-rose-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-in fade-in zoom-in-95 duration-150"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </Button>
          ) : (
            <div className="w-full h-9 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-lg flex items-center justify-center text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-wider select-none">
              No Filters Active
            </div>
          )}
        </div>
      </div>

      {/* Main Container Layer Mapping */}
      {loading ? (
        <div className="flex items-center justify-center py-24 border border-neutral-100 rounded-2xl bg-neutral-50/20">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
        </div>
      ) : filteredData && filteredData.length > 0 ? (
        <div className="w-full">
          <DataTable<Row> 
            data={filteredData} 
            columns={columns} 
            searchableKeys={["title"]} 
            rowKey={(r) => r.id} 
            toolbar={
              selectedRowIds.length > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  disabled={deletingBulk}
                  variant="destructive"
                  size="sm"
                  className="h-8 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-top-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {deletingBulk ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span>Delete Selected ({selectedRowIds.length})</span>
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-neutral-200 rounded-2xl bg-white p-6">
          <ShieldAlert className="h-5 w-5 text-neutral-400 mb-2" />
          <h3 className="text-xs font-semibold text-neutral-950">No examination logs cataloged yet</h3>
        </div>
      )}

      {/* Dynamic Popover Edit Specification Drawer Engine */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] rounded-2xl border-neutral-200 bg-white p-5 shadow-2xl focus:outline-none overflow-hidden">
          <DialogHeader className="space-y-1 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Cloud Vault Core Specifications</span>
            </div>
            <DialogTitle className="text-base font-bold text-neutral-900 tracking-tight">Modify Archived Record</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCommitUpdates} className="space-y-4 pt-4">
            
            {/* Subject Dropdown Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-neutral-400" />
                <span>Parent Subject Link *</span>
              </Label>
              <Select value={subjectId} onValueChange={setSubjectId} required>
                <SelectTrigger className="h-9 border-neutral-200 rounded-xl text-xs focus:ring-0 focus:border-neutral-400 bg-white transition-all">
                  <SelectValue placeholder="Map core academic subject" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-lg max-h-[200px]">
                  {loadingSubjects ? (
                    <div className="flex items-center justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-neutral-400" /></div>
                  ) : (
                    subjects?.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-neutral-50 cursor-pointer">
                        {s.subject_code ? `[${s.subject_code.toUpperCase()}] ` : ""}{s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Document Title Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700">Resource Record Title Name *</Label>
              <Input 
                required 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 bg-white"
              />
            </div>

            {/* Year & Semester Metrics Block */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Term Year *</span>
                </Label>
                <Input 
                  required 
                  type="number" 
                  min={1990} 
                  max={2100}
                  value={year} 
                  onChange={(e) => setYear(Number(e.target.value))} 
                  className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Semester</span>
                </Label>
                <Input 
                  type="number" 
                  min={1} 
                  max={12}
                  placeholder="Optional"
                  value={semester} 
                  onChange={(e) => setSemester(e.target.value === "" ? "" : Number(e.target.value))} 
                  className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 bg-white"
                />
              </div>
            </div>

            {/* PDF URL Input Field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <FileUp className="h-3.5 w-3.5 text-neutral-400" />
                <span>PDF URL / File URL *</span>
              </Label>
              <Input 
                required 
                type="url"
                value={fileUrl} 
                onChange={(e) => setFileUrl(e.target.value)} 
                placeholder="https://example.com/paper.pdf"
                className="h-9 border-neutral-200 rounded-lg text-xs focus-visible:ring-0 focus-visible:border-neutral-400 bg-white"
              />
            </div>

            {/* Solution Selector field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <span>Solution Included? *</span>
              </Label>
              <Select
                value={hasSolution ? "true" : "false"}
                onValueChange={(val) => setHasSolution(val === "true")}
              >
                <SelectTrigger className="h-9 border-neutral-200 rounded-lg text-xs bg-white">
                  <SelectValue placeholder="Is solution included?" />
                </SelectTrigger>
                <SelectContent className="rounded-lg bg-white shadow-md">
                  <SelectItem value="true" className="text-xs cursor-pointer">Yes, with solution</SelectItem>
                  <SelectItem value="false" className="text-xs cursor-pointer">No, question paper only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dialog Form Action Row */}
            <DialogFooter className="pt-3 border-t border-neutral-100 flex flex-row items-center justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg text-xs font-semibold h-9 px-4 border-neutral-200 hover:bg-neutral-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updating || !fileUrl}
                className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg text-xs font-semibold h-9 px-5 shadow-sm transition-all"
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
