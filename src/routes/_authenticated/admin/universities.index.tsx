import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { universities, type University } from "@/lib/mock-data";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/universities/")({
  head: () => ({ meta: [{ title: "Manage Universities — Lakshay IQ" }] }),
  component: ManageUniversities,
});

const columns: DataTableColumn<University>[] = [
  { key: "logo", header: "", accessor: (r) => <span className="text-2xl">{r.logo}</span>, className: "w-12" },
  { key: "name", header: "Name", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name, sortable: true },
  { key: "shortName", header: "Short", accessor: (r) => <Badge variant="outline">{r.shortName}</Badge>, sortValue: (r) => r.shortName, sortable: true },
  { key: "location", header: "Location", accessor: (r) => r.location, sortValue: (r) => r.location, sortable: true },
  { key: "courses", header: "Courses", accessor: (r) => r.courses, sortValue: (r) => r.courses, sortable: true },
  { key: "students", header: "Students", accessor: (r) => r.students, sortable: false },
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

function ManageUniversities() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Universities</h1>
          <p className="text-sm text-muted-foreground">Manage all universities on the platform.</p>
        </div>
        <Button asChild><Link to="/admin/universities/add"><Plus className="mr-2 h-4 w-4" /> Add University</Link></Button>
      </header>
      <DataTable<University>
        data={universities}
        columns={columns}
        searchableKeys={["name", "shortName", "location"]}
        rowKey={(r) => r.id}
      />
    </div>
  );
}
