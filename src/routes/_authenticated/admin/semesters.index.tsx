import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { semesters, getCourse, type Semester } from "@/lib/mock-data";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/semesters/")({
  head: () => ({ meta: [{ title: "Manage Semesters — Lakshay IQ" }] }),
  component: ManageSemesters,
});

const columns: DataTableColumn<Semester>[] = [
  { key: "number", header: "Semester", accessor: (r) => <span className="font-medium">Semester {r.number}</span>, sortValue: (r) => r.number, sortable: true },
  { key: "course", header: "Course", accessor: (r) => getCourse(r.courseId)?.name ?? r.courseId, sortValue: (r) => getCourse(r.courseId)?.name ?? "", sortable: true },
  { key: "subjects", header: "Subjects", accessor: (r) => r.subjects, sortValue: (r) => r.subjects, sortable: true },
  {
    key: "actions", header: "Actions", className: "text-right w-32",
    accessor: () => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    ),
  },
];

function ManageSemesters() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Semesters</h1>
          <p className="text-sm text-muted-foreground">Manage semesters across all courses.</p>
        </div>
        <Button asChild><Link to="/admin/semesters/add"><Plus className="mr-2 h-4 w-4" /> Add Semester</Link></Button>
      </header>
      <DataTable<Semester>
        data={semesters}
        columns={columns}
        rowKey={(r) => r.id}
      />
    </div>
  );
}
