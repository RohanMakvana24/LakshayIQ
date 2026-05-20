import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";
import { cn } from "@/lib/utils";
import { 
  Plus, Trash2, Edit3, BookOpen, Layers, GraduationCap, AlertTriangle, Save, X 
} from "lucide-react";

// Shadcn UI Sheet (Drawer) & Dialog Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

type Row = { 
  id: string; 
  university_id: string; 
  name: string; 
  slug: string; 
  duration: string | null; 
  total_semesters: number; 
  description: string | null;
  thumbnail_url: string | null;
  created_at: string 
};
type Univ = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/courses/")({
  head: () => ({ meta: [{ title: "Manage Courses — Lakshay IQ" }] }),
  component: ManageCourses,
});

// Validation Schema for Updating Form Data
const EditCourseSchema = Yup.object().shape({
  universityId: Yup.string().required("University is required"),
  name: Yup.string().min(3, "Too short!").required("Course name is required"),
  slug: Yup.string().matches(/^[a-z0-9-_]+$/, "Invalid slug format").required("Slug is required"),
  duration: Yup.string().required("Duration is required"),
  totalSemesters: Yup.number().min(1).max(12).required("Required"),
  description: Yup.string().max(600, "Too long").nullable(),
});

function ManageCourses() {
  // Destructured "update" alongside existing operations
  const { data, loading, remove, update } = useSupabaseTable<Row>("courses");
  const { data: univs } = useSupabaseTable<Univ>("universities", { orderBy: "name", ascending: true });
  
  // State States for Update and Delete Modals
  const [deletingRow, setDeletingRow] = useState<Row | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const univName = (id: string) => univs?.find((u) => u.id === id)?.name ?? "—";

  // --- Deletion Flow ---
  const initiateDeleteSequence = (row: Row) => {
    setDeletingRow(row);
    setIsDeleteModalOpen(true);
  };

  const executeDeleteSequence = async () => {
    if (deletingRow) {
      await remove(deletingRow.id);
      setIsDeleteModalOpen(false);
      setDeletingRow(null);
    }
  };

  // --- Update Formik Initializer ---
  const formik = useFormik({
    initialValues: {
      universityId: "",
      name: "",
      slug: "",
      duration: "",
      totalSemesters: 6,
      description: "",
    },
    validationSchema: EditCourseSchema,
    onSubmit: async (values) => {
      if (!editingRow) return;
      setUpdating(true);
      try {
        const success = await update(editingRow.id, {
          university_id: values.universityId,
          name: values.name,
          slug: values.slug,
          duration: values.duration,
          total_semesters: values.totalSemesters,
          description: values.description || null,
        });

        if (success) {
          setIsEditSheetOpen(false);
          setEditingRow(null);
        }
      } catch (err) {
        console.error("Error patching sequence:", err);
      } finally {
        setUpdating(false);
      }
    },
  });

  // --- Trigger Update Flow ---
  const initiateEditSequence = (row: Row) => {
    setEditingRow(row);
    formik.setValues({
      universityId: row.university_id,
      name: row.name,
      slug: row.slug,
      duration: row.duration || "",
      totalSemesters: row.total_semesters,
      description: row.description || "",
    });
    setIsEditSheetOpen(true);
  };

  const columns: DataTableColumn<Row>[] = [
    { 
      key: "name", 
      header: "Course Identity", 
      sortValue: (r) => r.name, 
      sortable: true,
      accessor: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight">{r.name}</span>
          <span className="text-[10px] font-mono text-slate-400 max-w-[200px] truncate">ID: {r.id}</span>
        </div>
      ), 
    },
    { 
      key: "slug", 
      header: "Router Anchor", 
      sortValue: (r) => r.slug, 
      sortable: true,
      accessor: (r) => (
        <Badge variant="secondary" className="font-mono text-[11px] bg-slate-50 text-slate-600 border border-slate-100 rounded-md px-1.5 py-0.5">
          {r.slug}
        </Badge>
      ), 
    },
    { 
      key: "university", 
      header: "Affiliated Hub", 
      sortValue: (r) => univName(r.university_id), 
      sortable: true,
      accessor: (r) => (
        <div className="flex items-center gap-1.5 max-w-[220px]">
          <GraduationCap className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-600 truncate">{univName(r.university_id)}</span>
        </div>
      ), 
    },
    { 
      key: "duration", 
      header: "Timeline", 
      sortable: false,
      accessor: (r) => (
        <span className="text-xs font-medium text-slate-500 bg-slate-50/50 border border-slate-200/40 px-2 py-0.5 rounded-lg">
          {r.duration ?? "—"}
        </span>
      ), 
    },
    { 
      key: "sems", 
      header: "Semesters", 
      sortValue: (r) => r.total_semesters, 
      sortable: true,
      accessor: (r) => (
        <div className="flex items-center gap-1">
          <Layers className="h-3 w-3 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">{r.total_semesters}</span>
        </div>
      ), 
    },
    { 
      key: "actions", 
      header: "", 
      className: "text-right w-20 min-w-[80px]", 
      accessor: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => initiateEditSequence(r)}
            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Course"
          >
            <Edit3 className="h-4 w-4 stroke-[1.8]" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => initiateDeleteSequence(r)}
            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Course"
          >
            <Trash2 className="h-4 w-4 stroke-[1.8]" />
          </Button>
        </div>
      ), 
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col gap-6 w-full max-w-full px-2">
      
      {/* Header Panel */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Program Curriculums</h1>
          <p className="text-xs text-slate-500 mt-0.5">Monitor, map, and control systemic course branches running inside registered academic facilities.</p>
        </div>
        <Button asChild className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold px-4 h-9 shadow-sm self-start sm:self-auto">
          <Link to="/admin/courses/add">
            <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" /> Add New Course
          </Link>
        </Button>
      </header>

      {/* Analytics Counter Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.01)]">
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Active Registers</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{loading ? "..." : data?.length ?? 0}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.01)]">
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Connected Hubs</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{univs?.length ?? 0} Inst.</h3>
          </div>
        </div>
      </div>

      {/* Main Datatable Structure */}
      <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-400">
            <div className="h-5 w-5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
            <p className="text-xs font-bold tracking-wide mt-1">Syncing Catalog Matrices...</p>
          </div>
        ) : (
          <div className="p-2 sm:p-4">
            <DataTable<Row> 
              data={data || []} 
              columns={columns} 
              searchableKeys={["name", "slug"]} 
              rowKey={(r) => r.id} 
            />
          </div>
        )}
      </div>

      {/* --- SLIDE OVER SHEET: UPDATE/EDIT COURSE COMPONENT --- */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-full sm:max-w-md bg-white border-l border-slate-200 p-0 shadow-2xl flex flex-col z-50">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <SheetTitle className="text-base font-black text-slate-900 tracking-tight">Modify Program Stream</SheetTitle>
              <SheetDescription className="text-[11px] text-slate-500 mt-0.5">Change relational attributes or timeline configurations.</SheetDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsEditSheetOpen(false)} className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-900">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={formik.handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Associated University Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Affiliated University Hub</Label>
              <Select 
                value={formik.values.universityId} 
                onValueChange={(val) => formik.setFieldValue("universityId", val)}
              >
                <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs focus:ring-slate-900/10">
                  <SelectValue placeholder="Select university mapping" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl border-slate-200">
                  {univs?.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-xs">{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nomenclature Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Course Program Title</Label>
              <Input 
                name="name"
                value={formik.values.name}
                onChange={(e) => {
                  formik.handleChange(e);
                  // Only auto-fill slug if user hasn't manually edited it
                  if (!formik.touched.slug) {
                    formik.setFieldValue("slug", slugify(e.target.value));
                  }
                }}
                onBlur={formik.handleBlur}
                className="h-10 border-slate-200 rounded-xl text-xs"
              />
              {formik.touched.name && formik.errors.name && <p className="text-[10px] font-semibold text-rose-500">{formik.errors.name}</p>}
            </div>

            {/* Slug Route Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">URL Route Slug Anchor</Label>
              <Input 
                name="slug"
                value={formik.values.slug}
                onChange={formik.handleChange}
                className="h-10 border-slate-200 rounded-xl font-mono text-xs"
              />
              {formik.touched.slug && formik.errors.slug && <p className="text-[10px] font-semibold text-rose-500">{formik.errors.slug}</p>}
            </div>

            {/* Duration and Sems Split Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Duration Metrics</Label>
                <Input 
                  name="duration"
                  value={formik.values.duration}
                  onChange={formik.handleChange}
                  className="h-10 border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Total Semesters</Label>
                <Input 
                  name="totalSemesters"
                  type="number"
                  value={formik.values.totalSemesters}
                  onChange={formik.handleChange}
                  className="h-10 border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Syllabus Narrative Text area */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Curriculum Description Narrative</Label>
              <Textarea 
                name="description"
                rows={4}
                value={formik.values.description}
                onChange={formik.handleChange}
                className="border-slate-200 rounded-xl text-xs resize-none"
              />
            </div>
          </form>

          {/* Persistent Action Sticky Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={() => setIsEditSheetOpen(false)} className="rounded-xl text-xs h-10 font-semibold border-slate-200">
              Discard Changes
            </Button>
            <Button 
              type="button" 
              disabled={updating || !formik.isValid} 
              onClick={() => formik.handleSubmit()}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold h-10 shadow-sm flex items-center justify-center gap-2"
            >
              <Save className="h-3.5 w-3.5" />
              {updating ? "Saving Records..." : "Update Program"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* --- DELETION CONFIRMATION MODAL --- */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl border-slate-200 p-6 shadow-2xl z-50">
          <DialogHeader className="flex flex-col items-center text-center gap-3">
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600">
              <AlertTriangle className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-slate-900 tracking-tight">
                Purge Course Curriculum Blueprint?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
                Aap <span className="font-bold text-slate-800">"{deletingRow?.name}"</span> program stream ko database se permanently remove karne ja rahe hain.
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="grid grid-cols-2 gap-3 mt-4 sm:justify-center">
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="rounded-xl border-slate-200 text-xs font-semibold h-10 w-full">
              Keep Blueprint
            </Button>
            <Button type="button" onClick={executeDeleteSequence} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold h-10 w-full shadow-sm">
              Confirm & Purge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}