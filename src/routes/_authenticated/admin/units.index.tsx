import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { Plus, Trash2 } from "lucide-react";

type Row = { id: string; subject_id: string; unit_number: number; title: string; description: string | null; created_at: string };
type Subject = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/units/")({
  head: () => ({ meta: [{ title: "Manage Units — Lakshay IQ" }] }),
  component: ManageUnits,
});

function ManageUnits() {
  const { data, loading, remove } = useSupabaseTable<Row>("units");
  const { data: subjects } = useSupabaseTable<Subject>("subjects");
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "—";

  const columns: DataTableColumn<Row>[] = [
    { key: "n", header: "#", className: "w-20", accessor: (r) => <span className="font-medium">U{r.unit_number}</span>, sortValue: (r) => r.unit_number, sortable: true },
    { key: "title", header: "Title", accessor: (r) => <span className="font-medium">{r.title}</span>, sortValue: (r) => r.title, sortable: true },
    { key: "subject", header: "Subject", accessor: (r) => subjectName(r.subject_id), sortValue: (r) => subjectName(r.subject_id), sortable: true },
    { key: "actions", header: "", className: "text-right w-16", accessor: (r) => <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button> },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Units</h1>
          <p className="text-sm text-muted-foreground">Manage units across subjects.</p>
        </div>
        <Button asChild><Link to="/admin/units/add"><Plus className="mr-2 h-4 w-4" /> Add Unit</Link></Button>
      </header>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <DataTable<Row> data={data} columns={columns} searchableKeys={["title"]} rowKey={(r) => r.id} />
      )}
    </div>
  );
}
