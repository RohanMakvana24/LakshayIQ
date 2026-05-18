import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { units, type Unit } from "@/lib/mock-data";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/units/")({
  head: () => ({ meta: [{ title: "Manage Units — Lakshay IQ" }] }),
  component: ManageUnits,
});

const columns: DataTableColumn<Unit>[] = [
  { key: "number", header: "#", accessor: (r) => <span className="font-medium">Unit {r.number}</span>, sortValue: (r) => r.number, sortable: true, className: "w-24" },
  { key: "title", header: "Title", accessor: (r) => <span className="font-medium">{r.title}</span>, sortValue: (r) => r.title, sortable: true },
  { key: "subject", header: "Subject", accessor: (r) => r.subjectId, sortValue: (r) => r.subjectId, sortable: true },
  { key: "videos", header: "Videos", accessor: (r) => r.videos, sortValue: (r) => r.videos, sortable: true },
  { key: "materials", header: "Materials", accessor: (r) => r.materials, sortValue: (r) => r.materials, sortable: true },
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

function ManageUnits() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Units</h1>
          <p className="text-sm text-muted-foreground">Manage learning units across all subjects.</p>
        </div>
        <Button asChild><Link to="/admin/units/add"><Plus className="mr-2 h-4 w-4" /> Add Unit</Link></Button>
      </header>
      <DataTable<Unit>
        data={units}
        columns={columns}
        searchableKeys={["title"]}
        rowKey={(r) => r.id}
      />
    </div>
  );
}
