import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit3, Loader2, BookOpen, Calendar, Layers, FileText, School, GraduationCap, BookMarked, Filter, RefreshCcw, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Row = { 
  id: string; 
  unit_id: string; 
  question_text: string; 
  category: string; 
  year: number | null; 
  marks: number; 
  question_file_url: string | null;
  created_at: string 
};

type Unit = { id: string; subject_id: string; title: string; unit_number: number };
type Subject = { id: string; semester_id: string; name: string; subject_code: string | null };
type Sem = { id: string; course_id: string; semester_number: number };
type Course = { id: string; university_id: string; name: string };
type University = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/questions/")({
  head: () => ({ meta: [{ title: "Important Questions — Lakshay IQ" }] }),
  component: ManageQuestions,
});

function ManageQuestions() {
  const { data, loading, remove, update } = useSupabaseTable<Row>("important_questions");
  
  // relational master tables
  const { data: universities } = useSupabaseTable<University>("universities", { orderBy: "name" });
  const { data: courses } = useSupabaseTable<Course>("courses", { orderBy: "name" });
  const { data: semesters } = useSupabaseTable<Sem>("semesters");
  const { data: subjects } = useSupabaseTable<Subject>("subjects", { orderBy: "name", ascending: true });
  const { data: units } = useSupabaseTable<Unit>("units");

  // Cascading Filter Selections
  const [filterUniversity, setFilterUniversity] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterMarks, setFilterMarks] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [filterCoursesList, setFilterCoursesList] = useState<Course[]>([]);
  const [filterSemestersList, setFilterSemestersList] = useState<Sem[]>([]);
  const [filterSubjectsList, setFilterSubjectsList] = useState<Subject[]>([]);
  const [filterUnitsList, setFilterUnitsList] = useState<Unit[]>([]);

  // Edit / Update Dialog States
  const [selectedQuestion, setSelectedQuestion] = useState<Row | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Edit Panel Fields
  const [editUniversityId, setEditUniversityId] = useState("");
  const [editCourseId, setEditCourseId] = useState("");
  const [editSemester, setEditSemester] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [editUnitId, setEditUnitId] = useState("");
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editMarks, setEditMarks] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editYear, setEditYear] = useState<number | "">("");
  const [editQuestionFileUrl, setEditQuestionFileUrl] = useState("");

  const [editCoursesList, setEditCoursesList] = useState<Course[]>([]);
  const [editSemestersList, setEditSemestersList] = useState<Sem[]>([]);
  const [editSubjectsList, setEditSubjectsList] = useState<Subject[]>([]);
  const [editUnitsList, setEditUnitsList] = useState<Unit[]>([]);

  // 1. Cascading filters logic
  useEffect(() => {
    if (filterUniversity && courses) {
      setFilterCoursesList(courses.filter(c => c.university_id === filterUniversity));
    } else {
      setFilterCoursesList([]);
    }
    setFilterCourse("");
    setFilterSemester("");
    setFilterSubject("");
    setFilterUnit("");
  }, [filterUniversity, courses]);

  useEffect(() => {
    if (filterCourse && semesters) {
      const filtered = semesters.filter(s => s.course_id === filterCourse)
        .sort((a, b) => a.semester_number - b.semester_number);
      setFilterSemestersList(filtered);
    } else {
      setFilterSemestersList([]);
    }
    setFilterSemester("");
    setFilterSubject("");
    setFilterUnit("");
  }, [filterCourse, semesters]);

  useEffect(() => {
    if (filterCourse && filterSemester && semesters && subjects) {
      const targetSem = semesters.find(
        s => s.course_id === filterCourse && s.semester_number === Number(filterSemester)
      );
      if (targetSem) {
        setFilterSubjectsList(subjects.filter(s => s.semester_id === targetSem.id));
      } else {
        setFilterSubjectsList([]);
      }
    } else {
      setFilterSubjectsList([]);
    }
    setFilterSubject("");
    setFilterUnit("");
  }, [filterCourse, filterSemester, semesters, subjects]);

  useEffect(() => {
    if (filterSubject && units) {
      const filtered = units.filter(u => u.subject_id === filterSubject)
        .sort((a, b) => a.unit_number - b.unit_number);
      setFilterUnitsList(filtered);
    } else {
      setFilterUnitsList([]);
    }
    setFilterUnit("");
  }, [filterSubject, units]);

  // 2. Cascading edit panel logic
  useEffect(() => {
    if (editUniversityId && courses && isModalOpen) {
      setEditCoursesList(courses.filter(c => c.university_id === editUniversityId));
      const chain = selectedQuestion ? resolveQuestionChain(selectedQuestion.unit_id) : null;
      if (chain && editUniversityId !== chain.uniId) {
        setEditCourseId("");
        setEditSemester("");
        setEditSubjectId("");
        setEditUnitId("");
      }
    }
  }, [editUniversityId, courses, isModalOpen, selectedQuestion]);

  useEffect(() => {
    if (editCourseId && semesters && isModalOpen) {
      const filtered = semesters.filter(s => s.course_id === editCourseId)
        .sort((a, b) => a.semester_number - b.semester_number);
      setEditSemestersList(filtered);
      const chain = selectedQuestion ? resolveQuestionChain(selectedQuestion.unit_id) : null;
      if (chain && editCourseId !== chain.courseId) {
        setEditSemester("");
        setEditSubjectId("");
        setEditUnitId("");
      }
    }
  }, [editCourseId, semesters, isModalOpen, selectedQuestion]);

  useEffect(() => {
    if (editCourseId && editSemester && semesters && subjects && isModalOpen) {
      const targetSem = semesters.find(
        s => s.course_id === editCourseId && s.semester_number === Number(editSemester)
      );
      if (targetSem) {
        setEditSubjectsList(subjects.filter(s => s.semester_id === targetSem.id));
      } else {
        setEditSubjectsList([]);
      }
      const chain = selectedQuestion ? resolveQuestionChain(selectedQuestion.unit_id) : null;
      if (chain && (editCourseId !== chain.courseId || Number(editSemester) !== chain.semNum)) {
        setEditSubjectId("");
        setEditUnitId("");
      }
    }
  }, [editCourseId, editSemester, semesters, subjects, isModalOpen, selectedQuestion]);

  useEffect(() => {
    if (editSubjectId && units && isModalOpen) {
      const filtered = units.filter(u => u.subject_id === editSubjectId)
        .sort((a, b) => a.unit_number - b.unit_number);
      setEditUnitsList(filtered);
      const chain = selectedQuestion ? resolveQuestionChain(selectedQuestion.unit_id) : null;
      if (chain && editSubjectId !== chain.subjectId) {
        setEditUnitId("");
      }
    }
  }, [editSubjectId, units, isModalOpen, selectedQuestion]);

  // Synchronous relational chain resolution helper
  const resolveQuestionChain = (unitId: string) => {
    const fallback = { uni: "—", course: "—", sem: "—", subject: "—", unit: "—", semNum: 0, uniId: "", courseId: "", semId: "", subjectId: "" };
    if (!units || !subjects || !semesters || !courses || !universities) return fallback;

    const unitObj = units.find(u => u.id === unitId);
    if (!unitObj) return fallback;

    const subjectObj = subjects.find(s => s.id === unitObj.subject_id);
    if (!subjectObj) return { ...fallback, unit: `U${unitObj.unit_number}: ${unitObj.title}` };

    const semObj = semesters.find(sem => sem.id === subjectObj.semester_id);
    if (!semObj) return { ...fallback, unit: `U${unitObj.unit_number}: ${unitObj.title}`, subject: subjectObj.name, subjectId: subjectObj.id };

    const courseObj = courses.find(c => c.id === semObj.course_id);
    if (!courseObj) return { ...fallback, unit: `U${unitObj.unit_number}: ${unitObj.title}`, subject: subjectObj.name, subjectId: subjectObj.id, sem: `Sem ${semObj.semester_number}`, semNum: semObj.semester_number, semId: semObj.id };

    const uniObj = universities.find(u => u.id === courseObj.university_id);

    return {
      uni: uniObj?.name ?? "—",
      uniId: uniObj?.id ?? "",
      course: courseObj.name,
      courseId: courseObj.id,
      sem: `Sem ${semObj.semester_number}`,
      semId: semObj.id,
      semNum: semObj.semester_number,
      subject: subjectObj.name,
      subjectId: subjectObj.id,
      unit: `U${unitObj.unit_number}: ${unitObj.title}`
    };
  };

  // Backtrack relationships and set state on Edit initialize
  const handleEditInitialize = (q: Row) => {
    setSelectedQuestion(q);
    const chain = resolveQuestionChain(q.unit_id);
    
    setEditUniversityId(chain.uniId);
    setEditCourseId(chain.courseId);
    setEditSemester(String(chain.semNum));
    setEditSubjectId(chain.subjectId);
    setEditUnitId(q.unit_id);

    setEditQuestionText(q.question_text);
    setEditMarks(String(q.marks));
    setEditCategory(q.category);
    setEditYear(q.year ?? "");
    setEditQuestionFileUrl(q.question_file_url ?? "");

    // Populate drop lists instantly
    if (chain.uniId && courses) {
      setEditCoursesList(courses.filter(c => c.university_id === chain.uniId));
    }
    if (chain.courseId && semesters) {
      setEditSemestersList(semesters.filter(s => s.course_id === chain.courseId).sort((a, b) => a.semester_number - b.semester_number));
    }
    if (chain.courseId && chain.semNum && semesters && subjects) {
      const targetSem = semesters.find(
        s => s.course_id === chain.courseId && s.semester_number === chain.semNum
      );
      if (targetSem) {
        setEditSubjectsList(subjects.filter(s => s.semester_id === targetSem.id));
      }
    }
    if (chain.subjectId && units) {
      setEditUnitsList(units.filter(u => u.subject_id === chain.subjectId).sort((a, b) => a.unit_number - b.unit_number));
    }

    setIsModalOpen(true);
  };

  // Submit edit specifications
  const handleCommitUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !editUnitId || !editQuestionText.trim()) return;

    setUpdating(true);
    try {
      const ok = await update(selectedQuestion.id, {
        unit_id: editUnitId,
        question_text: editQuestionText.trim(),
        marks: Number(editMarks),
        category: editCategory,
        year: editYear === "" ? null : Number(editYear),
        question_file_url: editQuestionFileUrl || null,
      });
      if (ok) setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to commit question changes.");
    } finally {
      setUpdating(false);
    }
  };

  // Perform cascading filter queries on the frontend
  const filteredQuestions = data.filter((q) => {
    const chain = resolveQuestionChain(q.unit_id);
    
    if (filterUniversity && chain.uniId !== filterUniversity) return false;
    if (filterCourse && chain.courseId !== filterCourse) return false;
    if (filterSemester && chain.semNum !== Number(filterSemester)) return false;
    if (filterSubject && chain.subjectId !== filterSubject) return false;
    if (filterUnit && q.unit_id !== filterUnit) return false;
    if (filterMarks && String(q.marks) !== filterMarks) return false;
    if (filterCategory && q.category !== filterCategory) return false;

    return true;
  });

  const columns: DataTableColumn<Row>[] = [
    { 
      key: "q", 
      header: "Question Prompt", 
      sortable: true,
      sortValue: (r) => r.question_text,
      accessor: (r) => (
        <div className="flex flex-col max-w-[200px] sm:max-w-md">
          <span className="font-semibold text-neutral-900 text-[13px] tracking-tight leading-normal line-clamp-2">
            {r.question_text}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
            ID: {r.id.substring(0, 8)}...
          </span>
        </div>
      )
    },
    {
      key: "university",
      header: "University",
      sortable: true,
      sortValue: (r) => resolveQuestionChain(r.unit_id).uni,
      accessor: (r) => (
        <span className="font-semibold text-neutral-700 text-xs line-clamp-1 max-w-[120px]">
          {resolveQuestionChain(r.unit_id).uni}
        </span>
      )
    },
    {
      key: "course",
      header: "Course",
      sortable: true,
      sortValue: (r) => resolveQuestionChain(r.unit_id).course,
      accessor: (r) => (
        <span className="text-neutral-600 text-xs line-clamp-1 max-w-[120px]">
          {resolveQuestionChain(r.unit_id).course}
        </span>
      )
    },
    {
      key: "semester",
      header: "Sem",
      sortable: true,
      sortValue: (r) => resolveQuestionChain(r.unit_id).semNum,
      accessor: (r) => (
        <span className="text-xs font-bold text-neutral-800">
          {resolveQuestionChain(r.unit_id).sem}
        </span>
      )
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      sortValue: (r) => resolveQuestionChain(r.unit_id).subject,
      accessor: (r) => (
        <span className="text-xs font-semibold text-neutral-700 line-clamp-1 max-w-[120px]">
          {resolveQuestionChain(r.unit_id).subject}
        </span>
      )
    },
    {
      key: "unit",
      header: "Unit",
      sortable: true,
      sortValue: (r) => resolveQuestionChain(r.unit_id).unit,
      accessor: (r) => (
        <span className="text-xs font-medium text-neutral-500 line-clamp-1 max-w-[100px]">
          {resolveQuestionChain(r.unit_id).unit}
        </span>
      )
    },
    { 
      key: "marks", 
      header: "Marks", 
      className: "w-20", 
      sortable: true,
      sortValue: (r) => r.marks,
      accessor: (r) => (
        <Badge 
          className={cn(
            "font-semibold border text-[10px] whitespace-nowrap",
            r.marks === 1 && "border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50/50",
            r.marks === 2 && "border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50/50",
            r.marks === 3 && "border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-50/50",
            r.marks === 5 && "border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-50/50"
          )}
        >
          {r.marks} {r.marks === 1 ? "Mark" : "Marks"}
        </Badge>
      )
    },
    { key: "cat", header: "Category", className: "w-20", accessor: (r) => <Badge variant="outline" className="capitalize text-[10px]">{r.category}</Badge>, sortValue: (r) => r.category, sortable: true },
    { key: "year", header: "Year", className: "w-16", accessor: (r) => r.year ?? "—", sortValue: (r) => r.year ?? 0, sortable: true },
    {
      key: "actions",
      header: "",
      className: "text-right w-20",
      accessor: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-neutral-400 hover:text-neutral-900 rounded-lg"
            onClick={() => handleEditInitialize(r)}
          >
            <Edit3 className="h-4 w-4 stroke-[1.8]" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-neutral-400 hover:text-red-600 rounded-lg"
            onClick={() => {
              if (confirm("Are you sure you want to delete this question?")) remove(r.id);
            }}
          >
            <Trash2 className="h-4 w-4 stroke-[1.8]" />
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="w-full space-y-5 px-4 pb-6 max-w-full antialiased">
      
      {/* Header Panel */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="h-4 w-4 rounded bg-neutral-900 flex items-center justify-center text-[9px] text-white font-bold font-mono">Q</div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Recall Database</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Important Questions Matrix</h1>
        </div>
        <Button asChild size="sm" className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-9 px-4 shadow-sm self-start sm:self-auto">
          <Link to="/admin/questions/add">
            <Plus className="mr-1 h-3.5 w-3.5 stroke-[2.5]" /> Add Questions
          </Link>
        </Button>
      </div>

      {/* Dynamic Cascading Filter Bar */}
      <Card className="p-4 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white space-y-3">
        <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Filter Question Bank</h2>
          {(filterUniversity || filterCourse || filterSemester || filterSubject || filterUnit || filterMarks || filterCategory) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setFilterUniversity("");
                setFilterCourse("");
                setFilterSemester("");
                setFilterSubject("");
                setFilterUnit("");
                setFilterMarks("");
                setFilterCategory("");
              }}
              className="h-6 text-[10px] rounded-lg ml-auto hover:text-rose-600 hover:bg-rose-50 px-2 flex items-center gap-1"
            >
              <RefreshCcw className="h-3 w-3" /> Reset Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* University Filter */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-500">University</Label>
            <Select value={filterUniversity} onValueChange={(val) => setFilterUniversity(val === "all_temp" ? "" : val)}>
              <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-slate-50/50">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-lg bg-white shadow-md">
                <SelectItem value="all_temp">All Universities</SelectItem>
                {universities?.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id} className="text-xs cursor-pointer">{uni.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Filter */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-500">Course</Label>
            <Select value={filterCourse} onValueChange={(val) => setFilterCourse(val === "all_temp" ? "" : val)} disabled={!filterUniversity}>
              <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-slate-50/50">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-lg bg-white shadow-md">
                <SelectItem value="all_temp">All Courses</SelectItem>
                {filterCoursesList.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs cursor-pointer">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semester Filter */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-500">Semester</Label>
            <Select value={filterSemester} onValueChange={(val) => setFilterSemester(val === "all_temp" ? "" : val)} disabled={!filterCourse}>
              <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-slate-50/50">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-lg bg-white shadow-md">
                <SelectItem value="all_temp">All Semesters</SelectItem>
                {filterSemestersList.map((sem) => (
                  <SelectItem key={sem.id} value={String(sem.semester_number)} className="text-xs cursor-pointer">
                    Sem {sem.semester_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Filter */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-500">Subject</Label>
            <Select value={filterSubject} onValueChange={(val) => setFilterSubject(val === "all_temp" ? "" : val)} disabled={!filterSemester}>
              <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-slate-50/50">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-lg bg-white shadow-md">
                <SelectItem value="all_temp">All Subjects</SelectItem>
                {filterSubjectsList.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs cursor-pointer">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unit Filter */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-500">Unit</Label>
            <Select value={filterUnit} onValueChange={(val) => setFilterUnit(val === "all_temp" ? "" : val)} disabled={!filterSubject}>
              <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-slate-50/50">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-lg bg-white shadow-md">
                <SelectItem value="all_temp">All Units</SelectItem>
                {filterUnitsList.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs cursor-pointer">Unit {u.unit_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Marks Filter */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-500">Marks</Label>
            <Select value={filterMarks} onValueChange={(val) => setFilterMarks(val === "all_temp" ? "" : val)}>
              <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-slate-50/50">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-lg bg-white shadow-md">
                <SelectItem value="all_temp">All Marks</SelectItem>
                <SelectItem value="1">1 Mark</SelectItem>
                <SelectItem value="2">2 Marks</SelectItem>
                <SelectItem value="3">3 Marks</SelectItem>
                <SelectItem value="5">5 Marks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-500">Category</Label>
            <Select value={filterCategory} onValueChange={(val) => setFilterCategory(val === "all_temp" ? "" : val)}>
              <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-slate-50/50">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-lg bg-white shadow-md">
                <SelectItem value="all_temp">All Categories</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="repeated">Repeated</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Table Segment */}
      {loading ? (
        <div className="flex items-center justify-center py-24 border border-neutral-100 rounded-2xl bg-neutral-50/20">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
        </div>
      ) : filteredQuestions && filteredQuestions.length > 0 ? (
        <div className="w-full">
          <DataTable<Row> 
            data={filteredQuestions} 
            columns={columns} 
            searchableKeys={["question_text"]} 
            rowKey={(r) => r.id} 
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-neutral-200 rounded-2xl bg-white p-6">
          <HelpCircle className="h-6 w-6 text-neutral-400 mb-2" />
          <h3 className="text-xs font-semibold text-neutral-950">No questions match the active filters</h3>
        </div>
      )}

      {/* Dialog Edit Modal Drawer */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] w-[95vw] rounded-2xl border-neutral-200 bg-white p-5 shadow-2xl focus:outline-none overflow-hidden">
          <DialogHeader className="space-y-1 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Cloud Vault Core Specifications</span>
            </div>
            <DialogTitle className="text-base font-bold text-neutral-900 tracking-tight">Modify Question Details</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCommitUpdates} className="space-y-3.5 pt-4">
            
            {/* cascading selections inside modal */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-700 flex items-center gap-0.5">
                  <School className="h-3 w-3 text-slate-400" />
                  <span>University *</span>
                </Label>
                <Select value={editUniversityId} onValueChange={setEditUniversityId} required>
                  <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg bg-white shadow-md">
                    {universities?.map((uni) => (
                      <SelectItem key={uni.id} value={uni.id} className="text-xs cursor-pointer">{uni.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-700 flex items-center gap-0.5">
                  <GraduationCap className="h-3 w-3 text-slate-400" />
                  <span>Course *</span>
                </Label>
                <Select value={editCourseId} onValueChange={setEditCourseId} required disabled={!editUniversityId}>
                  <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg bg-white shadow-md">
                    {editCoursesList.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs cursor-pointer">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-700 flex items-center gap-0.5">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span>Sem *</span>
                </Label>
                <Select value={editSemester} onValueChange={setEditSemester} required disabled={!editCourseId}>
                  <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-white">
                    <SelectValue placeholder="Sem" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg bg-white shadow-md">
                    {editSemestersList.map((sem) => (
                      <SelectItem key={sem.id} value={String(sem.semester_number)} className="text-xs cursor-pointer">
                        Sem {sem.semester_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-700 flex items-center gap-0.5">
                  <BookMarked className="h-3 w-3 text-slate-400" />
                  <span>Subject *</span>
                </Label>
                <Select value={editSubjectId} onValueChange={setEditSubjectId} required disabled={!editSemester}>
                  <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-white">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg bg-white shadow-md max-h-[150px]">
                    {editSubjectsList.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs cursor-pointer">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-700 flex items-center gap-0.5">
                  <Layers className="h-3 w-3 text-slate-400" />
                  <span>Unit *</span>
                </Label>
                <Select value={editUnitId} onValueChange={setEditUnitId} required disabled={!editSubjectId}>
                  <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-white">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg bg-white shadow-md max-h-[150px]">
                    {editUnitsList.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs cursor-pointer">U{u.unit_number}: {u.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Question Text Prompt */}
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-700">Question Text *</Label>
              <Textarea 
                required 
                rows={3}
                value={editQuestionText} 
                onChange={(e) => setEditQuestionText(e.target.value)} 
                className="border-slate-200 rounded-lg text-xs focus-visible:ring-0 focus-visible:border-slate-400 bg-white"
              />
            </div>

            {/* Marks & Category Dropdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-700">Marks *</Label>
                <Select value={editMarks} onValueChange={setEditMarks} required>
                  <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg bg-white shadow-md">
                    <SelectItem value="1">1 Mark</SelectItem>
                    <SelectItem value="2">2 Marks</SelectItem>
                    <SelectItem value="3">3 Marks</SelectItem>
                    <SelectItem value="5">5 Marks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-700">Category *</Label>
                <Select value={editCategory} onValueChange={setEditCategory} required>
                  <SelectTrigger className="h-8 border-slate-200 rounded-lg text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg bg-white shadow-md">
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="repeated">Repeated</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Year & File URL */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-700">Exam Year</Label>
                <Input 
                  type="number" 
                  min={1990} 
                  max={2100}
                  placeholder="Optional"
                  value={editYear} 
                  onChange={(e) => setEditYear(e.target.value === "" ? "" : Number(e.target.value))} 
                  className="h-8 border-slate-200 rounded-lg text-xs focus-visible:ring-0 focus-visible:border-slate-400 bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-700">Attachment File URL</Label>
                <Input 
                  placeholder="Optional"
                  value={editQuestionFileUrl} 
                  onChange={(e) => setEditQuestionFileUrl(e.target.value)} 
                  className="h-8 border-slate-200 rounded-lg text-xs focus-visible:ring-0 focus-visible:border-slate-400 bg-white"
                />
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <DialogFooter className="pt-3 border-t border-neutral-100 flex flex-row items-center justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs font-semibold h-8 px-4 border-neutral-200 hover:bg-neutral-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updating || !editUnitId || !editQuestionText.trim()}
                className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold h-8 px-5 shadow-sm transition-all"
              >
                {updating ? "Syncing..." : "Update Details"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
