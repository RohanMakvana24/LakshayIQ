import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { Plus, Trash2, Edit3, Loader2, BookOpen, Layers, Hash, FileText, ShieldAlert, School, GraduationCap } from "lucide-react";

type Row = { 
  id: string; 
  subject_id: string; 
  unit_number: number; 
  title: string; 
  description: string | null; 
  created_at: string 
};
type Subject = { id: string; name: string; subject_code: string | null; semester_id?: string };
type Semester = { id: string; course_id: string };
type Course = { id: string; name: string; university_id?: string };
type University = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/units/")({
  head: () => ({ meta: [{ title: "Manage Academic Units — Portal" }] }),
  component: ManageUnits,
});

function ManageUnits() {
  const { data, loading, remove, update } = useSupabaseTable<Row>("units");
  
  // Relational Buckets Fetching Engine
  const { data: subjects, loading: loadingSubjects } = useSupabaseTable<Subject>("subjects", { orderBy: "name", ascending: true });
  const { data: semesters } = useSupabaseTable<Semester>("semesters");
  const { data: courses } = useSupabaseTable<Course>("courses");
  const { data: universities } = useSupabaseTable<University>("universities");

  // Dialog State Management Framework
  const [selectedUnit, setSelectedUnit] = useState<Row | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form State Buffers
  const [subjectId, setSubjectId] = useState("");
  const [unitNumber, setUnitNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Upstream Relational Chain Lookup Resolver (Subject -> Semester -> Course -> University)
  const getFullAncestry = (subId: string) => {
    const subject = subjects?.find((s) => s.id === subId);
    if (!subject) return { subjectName: "Unallocated Node", subjectCode: "—", courseName: "—", universityName: "—" };

    const semester = semesters?.find((s) => s.id === subject.semester_id);
    const course = courses?.find((c) => c.id === semester?.course_id);
    const university = universities?.find((u) => u.id === course?.university_id);

    return {
      subjectName: subject.name,
      subjectCode: subject.subject_code ? subject.subject_code.toUpperCase() : "REG-CODE",
      courseName: course?.name || "Unmapped Stream",
      universityName: university?.name || "Unmapped Hub"
    };
  };

  // Open & Initialize Modal Context with Row Values
  const handleEditInitialize = (unit: Row) => {
    setSelectedUnit(unit);
    setSubjectId(unit.subject_id);
    setUnitNumber(unit.unit_number);
    setTitle(unit.title);
    setDescription(unit.description || "");
    setIsModalOpen(true);
  };

  // Safe Database Update Handler
  const handleCommitChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit || !subjectId || !title.trim()) return;

    try {
      setUpdating(true);
      const isCommitted = await update(selectedUnit.id, {
        subject_id: subjectId,
        unit_number: unitNumber,
        title: title.trim(),
        description: description.trim() || null
      });
      if (isCommitted) setIsModalOpen(false);
    } catch (err) {
      console.error("Database Update Refusal on Unit Block:", err);
    } finally {
      setUpdating(false);
    }
  };

  // Flex-Safe Multi-Column Datatable Configuration Schema
  const columns: DataTableColumn<Row>[] = [
    {
      key: "unit_number",
      header: "# Index",
      sortable: true,
      sortValue: (r) => r.unit_number,
      accessor: (r) => (
        <span className="font-mono text-[11px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-200/60 px-2 py-0.5 rounded-md">
          U{String(r.unit_number).padStart(2, '0')}
        </span>
      ),
    },
    {
      key: "title",
      header: "Syllabus Unit Title",
      sortable: true,
      sortValue: (r) => r.title,
      accessor: (r) => (
        <div className="flex flex-col truncate max-w-[220px] sm:max-w-xs">
          <span className="font-semibold text-neutral-900 text-[13px] uppercase tracking-tight leading-normal truncate">
            {r.title}
          </span>
          {r.description && (
            <span className="text-[11px] text-neutral-400 truncate mt-0.5 font-normal">
              {r.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "university",
      header: "University Hub",
      sortable: true,
      sortValue: (r) => getFullAncestry(r.subject_id).universityName,
      accessor: (r) => {
        const ancestry = getFullAncestry(r.subject_id);
        return (
          <div className="flex items-center gap-1.5 max-w-[180px]">
            <School className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
            <span className="text-xs font-medium text-neutral-700 truncate">
              {ancestry.universityName}
            </span>
          </div>
        );
      },
    },
    {
      key: "course",
      header: "Course Stream",
      sortable: true,
      sortValue: (r) => getFullAncestry(r.subject_id).courseName,
      accessor: (r) => {
        const ancestry = getFullAncestry(r.subject_id);
        return (
          <div className="flex items-center gap-1.5 max-w-[180px]">
            <GraduationCap className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
            <span className="text-xs font-medium text-neutral-600 truncate">
              {ancestry.courseName}
            </span>
          </div>
        );
      },
    },
    {
      key: "subject",
      header: "Mapped Core Subject",
      sortable: true,
      sortValue: (r) => getFullAncestry(r.subject_id).subjectName,
      accessor: (r) => {
        const ancestry = getFullAncestry(r.subject_id);
        return (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-neutral-700 truncate max-w-[180px]">
              {ancestry.subjectName}
            </span>
            <span className="text-[10px] font-mono font-medium text-neutral-400 mt-0.5">
              Code: {ancestry.subjectCode}
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
              if (confirm(`Are you sure you want to completely erase Unit ${r.unit_number}: "${r.title}"?`)) {
                remove(r.id);
              }
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="h-4 w-4 rounded bg-neutral-900 flex items-center justify-center text-[9px] text-white font-bold font-mono">U</div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Curriculum Terminal</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Syllabus Units</h1>
        </div>
        <Button asChild size="sm" className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-9 px-4 shadow-sm tracking-wide self-start sm:self-auto">
          <Link to="/admin/units/add">
            <Plus className="mr-1 h-3.5 w-3.5 stroke-[2.5]" /> Add Unit
          </Link>
        </Button>
      </div>

      {/* Main Core View Wrapper */}
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
          <h3 className="text-xs font-semibold text-neutral-950">No academic units deployed yet</h3>
        </div>
      )}

      {/* Structural Edit Unit Specification Drawer Modal Popover */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] rounded-2xl border-neutral-200 bg-white p-5 shadow-2xl overflow-hidden focus:outline-none">
          <DialogHeader className="space-y-1 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
              <Layers className="h-3.5 w-3.5 stroke-[2]" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Syllabus Matrix Registry</span>
            </div>
            <DialogTitle className="text-base font-bold text-neutral-900 tracking-tight">Modify Unit Specifications</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCommitChanges} className="space-y-4 pt-4">
            
            {/* Subject Dropdown Field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-neutral-400" />
                <span>Parent Subject Alignment *</span>
              </Label>
              <Select value={subjectId} onValueChange={setSubjectId} required>
                <SelectTrigger className="h-9 border-neutral-200 rounded-xl text-xs focus:ring-0 focus:border-neutral-400 bg-white transition-all">
                  <SelectValue placeholder="Select course subject link" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-lg max-h-[220px]">
                  {loadingSubjects ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                    </div>
                  ) : (
                    subjects?.map((s) => {
                      const details = getFullAncestry(s.id);
                      return (
                        <SelectItem key={s.id} value={s.id} className="text-xs py-2 rounded-lg my-0.5 focus:bg-neutral-50 cursor-pointer">
                          {s.subject_code ? `[${s.subject_code.toUpperCase()}] ` : ""}{s.name} ({details.courseName})
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Index Counter and Unit Title Section Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Index *</span>
                </Label>
                <Input 
                  required 
                  type="number"
                  min={1}
                  max={50}
                  value={unitNumber} 
                  onChange={(e) => setUnitNumber(Number(e.target.value))} 
                  className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 transition-all bg-white"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-3">
                <Label className="text-xs font-bold text-neutral-700">Syllabus Title Name *</Label>
                <Input 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="h-9 border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 transition-all bg-white"
                />
              </div>
            </div>

            {/* Description Abstract Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-neutral-400" />
                <span>Abstract Syllabus Summary</span>
              </Label>
              <Textarea 
                rows={4}
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Granular chapters, reference notes or benchmark parameters description..."
                className="border-neutral-200 rounded-xl text-xs focus-visible:ring-0 focus-visible:border-neutral-400 transition-all resize-none p-3 bg-white"
              />
            </div>

            {/* Footer Action Controls */}
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
                disabled={updating}
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