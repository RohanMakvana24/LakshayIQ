import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Plus, Trash2, Layers, BookOpen, Hash, Milestone, Loader2, Edit2, Save, School, X } from "lucide-react";

type Row = { id: string; course_id: string; semester_number: number; title: string | null; created_at: string };
type Course = { id: string; name: string; university_id: string };
type University = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/semesters/")({
  head: () => ({ meta: [{ title: "Manage Semesters — Lakshay IQ" }] }),
  component: ManageSemesters,
});

function ManageSemesters() {
  // Supabase hooks data pipelines
  const { data, loading, remove, update } = useSupabaseTable<Row>("semesters");
  const { data: courses } = useSupabaseTable<Course>("courses", { orderBy: "name", ascending: true });
  const { data: universities } = useSupabaseTable<University>("universities", { orderBy: "name" });
  
  // 🏛️ --- Main Table Live Filter States ---
  const [filterUniversityId, setFilterUniversityId] = useState<string>("all");
  const [filterCourseId, setFilterCourseId] = useState<string>("all");

  // --- UI Update Overlay State Modules ---
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editUniversityId, setEditUniversityId] = useState(""); 
  const [editCourseId, setEditCourseId] = useState("");
  const [editSemesterNumber, setEditSemesterNumber] = useState(1);
  const [editTitle, setEditTitle] = useState("");
  const [isSaveLoading, setIsSaveLoading] = useState(false);

  // એડિટ પેનલ માટે ફિલ્ટર થયેલા કોર્સ રાખવાનું લોકલ સ્ટેટ
  const [editFilteredCourses, setEditFilteredCourses] = useState<Course[]>([]);

  // કોર્સ આઈડી પરથી કોર્સ અને યુનિવર્સિટીનું નામ મેળવવાના હેલ્પર્સ
  const getCourseObj = (cId: string) => courses?.find((c) => c.id === cId);
  const courseName = (cId: string) => getCourseObj(cId)?.name ?? "—";
  
  const universityName = (cId: string) => {
    const uId = getCourseObj(cId)?.university_id;
    return universities?.find((u) => u.id === uId)?.name ?? "—";
  };

  // 🏛️ યુનિવર્સિટી ફિલ્ટર બદલાય ત્યારે મેઈન લિસ્ટના કોર્સ ડ્રોપડાઉનને રીસેટ કરવું
  useEffect(() => {
    setFilterCourseId("all");
  }, [filterUniversityId]);

  // મેઈન લિસ્ટના કોર્સ ડ્રોપડાઉન માટે ફિલ્ટર થયેલા કોર્સ
  const toolbarCourses = useMemo(() => {
    if (!courses) return [];
    if (filterUniversityId === "all") return courses;
    return courses.filter(c => c.university_id === filterUniversityId);
  }, [filterUniversityId, courses]);

  // 🏛️ મેઈન ટેબલ માટે યુનિવર્સિટી અને કોર્સના આધારે ડેટા ફિલ્ટર કરવાનું લોજિક
  const filteredTableData = useMemo(() => {
    if (!data) return [];
    return data.filter((row) => {
      const courseObj = getCourseObj(row.course_id);
      const matchesUniversity = filterUniversityId === "all" || courseObj?.university_id === filterUniversityId;
      const matchesCourse = filterCourseId === "all" || row.course_id === filterCourseId;
      return matchesUniversity && matchesCourse;
    });
  }, [data, filterUniversityId, filterCourseId, courses]);

  // એડિટ પેનલમાં યુનિવર્સિટી બદલાય ત્યારે તે મુજબ કોર્સ ફિલ્ટર કરવાનું લોજિક
  useEffect(() => {
    if (editUniversityId && courses) {
      const filtered = courses.filter((c) => c.university_id === editUniversityId);
      setEditFilteredCourses(filtered);
    } else {
      setEditFilteredCourses([]);
    }
  }, [editUniversityId, courses]);

  // Trigger setup for mounting specific values into form editing matrix
  const handleEditClick = (row: Row) => {
    setUpdatingId(row.id);
    const currentCourse = courses?.find((c) => c.id === row.course_id);
    if (currentCourse) {
      setEditUniversityId(currentCourse.university_id);
    } else {
      setEditUniversityId("");
    }
    setEditCourseId(row.course_id);
    setEditSemesterNumber(row.semester_number);
    setEditTitle(row.title || "");
    setIsEditOpen(true);
  };

  // Process Update Form Trigger Engine
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingId || !editCourseId) return;

    setIsSaveLoading(true);
    const success = await update(updatingId, {
      course_id: editCourseId,
      semester_number: editSemesterNumber,
      title: editTitle.trim() || null,
    });
    
    setIsSaveLoading(false)
    if (success) {
      setIsEditOpen(false);
      setUpdatingId(null);
    }
  };

  // --- Dynamic Metric Analytics calculations ---
  const totalSemesters = data?.length || 0;
  const uniqueCoursesCount = data ? new Set(data.map((r) => r.course_id)).size : 0;
  const customTitlesCount = data ? data.filter((r) => r.title !== null).length : 0;

  const columns: DataTableColumn<Row>[] = [
    { 
      key: "number", 
      header: "Academic Block", 
      className: "w-40",
      accessor: (r) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-slate-950 text-white shadow-sm tracking-wide uppercase">
          <Hash className="h-3 w-3 stroke-[2.5]" />
          Semester {r.semester_number}
        </span>
      ), 
      sortValue: (r) => r.semester_number, 
      sortable: true 
    },
    { 
      key: "title", 
      header: "Display Title / Tag", 
      accessor: (r) => (
        r.title ? (
          <span className="font-semibold text-slate-800 tracking-tight flex items-center gap-1.5">
            <Milestone className="h-3.5 w-3.5 text-indigo-500 stroke-[2]" />
            {r.title}
          </span>
        ) : (
          <span className="text-xs text-slate-300 italic font-medium">Standard Nomenclature</span>
        )
      ), 
      sortable: false 
    },
    { 
      key: "university", 
      header: "Connected University", 
      accessor: (r) => (
        <div className="flex items-center gap-2 max-w-xs py-0.5">
          <School className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <span className="font-semibold text-slate-700 truncate tracking-tight">
            {universityName(r.course_id)}
          </span>
        </div>
      ), 
      sortValue: (r) => universityName(r.course_id), 
      sortable: true 
    },
    { 
      key: "course", 
      header: "Connected Course", 
      accessor: (r) => (
        <div className="flex items-center gap-2 max-w-xs py-0.5">
          <BookOpen className="h-4 w-4 text-indigo-500 flex-shrink-0" />
          <span className="font-bold text-slate-800 truncate tracking-tight">
            {courseName(r.course_id)}
          </span>
        </div>
      ), 
      sortValue: (r) => courseName(r.course_id), 
      sortable: true 
    },
    { 
      key: "actions", 
      header: "", 
      className: "text-right w-24", 
      accessor: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => handleEditClick(r)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>

          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
            onClick={async () => {
              if (confirm("Are you sure you want to delete this semester?")) {
                await remove(r.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) 
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col gap-6 w-full max-w-full px-1">
      
      {/* Structural Layout Header Section */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Semesters Matrix</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure chronological term definitions and bind them to active courses.</p>
        </div>
        <Button 
          asChild 
          className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold px-4 h-10 shadow-sm self-start sm:self-auto"
        >
          <Link to="/admin/semesters/add">
            <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" /> Add Semester
          </Link>
        </Button>
      </header>

      {/* Premium Analytics Block Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 border border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.01)] rounded-xl bg-white flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-900/5 border border-slate-900/10 flex items-center justify-center text-slate-800">
            <Layers className="h-5 w-5 stroke-[1.8]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Semesters</p>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">{loading ? "—" : totalSemesters} Nodes</h3>
          </div>
        </div>

        <div className="p-4 border border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.01)] rounded-xl bg-white flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100/70 flex items-center justify-center text-indigo-600">
            <BookOpen className="h-5 w-5 stroke-[1.8]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stream Mappings</p>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">{loading ? "—" : uniqueCoursesCount} Active Courses</h3>
          </div>
        </div>

        <div className="p-4 border border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.01)] rounded-xl bg-white flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100/70 flex items-center justify-center text-emerald-600">
            <Milestone className="h-5 w-5 stroke-[1.8]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Nomenclature</p>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">{loading ? "—" : customTitlesCount} Titled Blocks</h3>
          </div>
        </div>
      </div>

      {/* Primary Datatable Control Terminal */}
      <div className="flex-1 w-full bg-white border border-slate-200/90 rounded-2xl shadow-[0_4px_24px_-6px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin text-slate-800 stroke-[1.5]" />
            <span className="text-xs font-semibold tracking-wide">Syncing data pipeline...</span>
          </div>
        ) : (
          <div className="p-2 sm:p-4 space-y-4">
            
            {/* 🏛️ 🆕 TABLE LIVE FILTER BAR (સર્ચ બારની બાજુમાં ગોઠવવા માટે) */}
            <div className="flex flex-col sm:flex-row gap-3 p-1 bg-slate-50/60 rounded-xl border border-slate-100">
              
              {/* University Live Filter */}
              <div className="w-full sm:w-64">
                <Select value={filterUniversityId} onValueChange={setFilterUniversityId}>
                  <SelectTrigger className="h-9 border-slate-200 rounded-lg text-xs bg-white focus:ring-slate-900/10">
                    <div className="flex items-center gap-1.5 truncate text-slate-700">
                      <School className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <SelectValue placeholder="All Universities" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200 bg-white">
                    <SelectItem value="all" className="text-xs py-1.5 focus:bg-slate-50">All Universities</SelectItem>
                    {universities && universities.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs py-1.5 focus:bg-slate-50">
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Course Live Filter */}
              <div className="w-full sm:w-64">
                <Select value={filterCourseId} onValueChange={setFilterCourseId} disabled={toolbarCourses.length === 0}>
                  <SelectTrigger className="h-9 border-slate-200 rounded-lg text-xs bg-white focus:ring-slate-900/10">
                    <div className="flex items-center gap-1.5 truncate text-slate-700">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <SelectValue placeholder="All Courses" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200 bg-white">
                    <SelectItem value="all" className="text-xs py-1.5 focus:bg-slate-50">All Courses</SelectItem>
                    {toolbarCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs py-1.5 focus:bg-slate-50">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Quick Button */}
              {(filterUniversityId !== "all" || filterCourseId !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterUniversityId("all");
                    setFilterCourseId("all");
                  }}
                  className="h-9 text-xs gap-1 text-slate-500 hover:text-slate-900 rounded-lg px-2 sm:ml-auto"
                >
                  <X className="h-3.5 w-3.5" /> Clear Filters
                </Button>
              )}
            </div>

            <DataTable<Row> 
              data={filteredTableData} // ફિલ્ટર થયેલો લાઈવ ડેટા પાસ કર્યો
              columns={columns} 
              searchableKeys={["title"]} 
              rowKey={(r) => r.id} 
            />
          </div>
        )}
      </div>

      {/* --- Smooth Slid-out Panel Context Engine (Update Terminal) --- */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-white p-6 flex flex-col gap-5 border-l border-slate-200">
          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="text-xl font-black text-slate-900 tracking-tight">Modify Semester Blueprint</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Update configuration metrics, streams mappings, and operational metadata.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleUpdateSubmit} className="flex-1 flex flex-col justify-between h-full">
            <div className="space-y-4">
              
              {/* University Selection Dropdown (Edit Panel) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">University *</Label>
                <Select 
                  value={editUniversityId} 
                  onValueChange={(val) => {
                    setEditUniversityId(val);
                    setEditCourseId(""); 
                  }} 
                  required
                >
                  <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs focus:ring-slate-900/10">
                    <SelectValue placeholder="Select University" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white">
                    {universities && universities.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs py-2 focus:bg-slate-50 rounded-lg">
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtered Course Stream Selection (Edit Panel) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Course Stream *</Label>
                <Select 
                  value={editCourseId} 
                  onValueChange={setEditCourseId} 
                  disabled={!editUniversityId} 
                  required
                >
                  <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs focus:ring-slate-900/10">
                    <SelectValue placeholder={editUniversityId ? "Select parent course" : "Select a university first"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white">
                    {editFilteredCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs py-2 focus:bg-slate-50 rounded-lg">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Number Configuration Anchor */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Semester Term Number *</Label>
                <Input 
                  required 
                  type="number" 
                  min={1} 
                  max={12} 
                  value={editSemesterNumber} 
                  onChange={(e) => setEditSemesterNumber(Number(e.target.value))}
                  className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10"
                />
              </div>

              {/* Title Modification Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Display Title / Alias</Label>
                <Input 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={`e.g., Semester ${editSemesterNumber}`}
                  className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10"
                />
              </div>

            </div>

            {/* Action Bar inside Sheet Footer */}
            <SheetFooter className="flex items-center gap-3 pt-4 border-t border-slate-100 sm:space-x-0">
              <SheetClose asChild>
                <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold px-4 flex-1">
                  Cancel
                </Button>
              </SheetClose>
              <Button 
                type="submit" 
                size="sm" 
                disabled={isSaveLoading || !editCourseId}
                className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold px-4 flex-1 shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSaveLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save Modifications
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

    </div>
  );
}