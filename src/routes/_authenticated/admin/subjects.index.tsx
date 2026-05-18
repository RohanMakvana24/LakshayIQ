import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { subjects, type Subject } from "@/lib/mock-data";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/subjects/")({
  head: () => ({ meta: [{ title: "Manage Subjects — Lakshay IQ" }] }),
  component: ManageSubjects,
});

const columns: DataTableColumn<Subject>[] = [
  { key: "name", header: "Subject", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name, sortable: true },
  { key: "code", header: "Code", accessor: (r) => <Badge variant="outline">{r.code}</Badge>, sortValue: (r) => r.code, sortable: true },
  { key: "semester", header: "Semester", accessor: (r) => r.semesterId, sortValue: (r) => r.semesterId, sortable: true },
  { key: "credits", header: "Credits", accessor: (r) => r.credits, sortValue: (r) => r.credits, sortable: true },
  { key: "units", header: "Units", accessor: (r) => r.units, sortValue: (r) => r.units, sortable: true },
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

function ManageSubjects() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Subjects</h1>
          <p className="text-sm text-muted-foreground">Manage subjects across all semesters.</p>
        </div>
        <Button asChild><Link to="/admin/subjects/add"><Plus className="mr-2 h-4 w-4" /> Add Subject</Link></Button>
      </header>
      <DataTable<Subject>
        data={subjects}
        columns={columns}
        searchableKeys={["name", "code"]}
        rowKey={(r) => r.id}
      />
    </div>
  );
}
