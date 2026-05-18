import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { courses, getUniversity, type Course } from "@/lib/mock-data";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/courses/")({
  head: () => ({ meta: [{ title: "Manage Courses — Lakshay IQ" }] }),
  component: ManageCourses,
});

const columns: DataTableColumn<Course>[] = [
  { key: "name", header: "Name", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name, sortable: true },
  { key: "code", header: "Code", accessor: (r) => <Badge variant="outline">{r.code}</Badge>, sortValue: (r) => r.code, sortable: true },
  { key: "university", header: "University", accessor: (r) => getUniversity(r.universityId)?.shortName ?? "—", sortValue: (r) => getUniversity(r.universityId)?.shortName ?? "", sortable: true },
  { key: "duration", header: "Duration", accessor: (r) => r.duration, sortValue: (r) => r.duration, sortable: true },
  { key: "semesters", header: "Semesters", accessor: (r) => r.semesters, sortValue: (r) => r.semesters, sortable: true },
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

function ManageCourses() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground">Manage courses across all universities.</p>
        </div>
        <Button asChild><Link to="/admin/courses/add"><Plus className="mr-2 h-4 w-4" /> Add Course</Link></Button>
      </header>
      <DataTable<Course>
        data={courses}
        columns={columns}
        searchableKeys={["name", "code"]}
        rowKey={(r) => r.id}
      />
    </div>
  );
}
