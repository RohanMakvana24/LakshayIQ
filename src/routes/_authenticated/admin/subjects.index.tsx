import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { Plus, Trash2 } from "lucide-react";

type Row = { id: string; semester_id: string; name: string; subject_code: string | null; slug: string; created_at: string };
type Sem = { id: string; semester_number: number; course_id: string };

export const Route = createFileRoute("/_authenticated/admin/subjects/")({
  head: () => ({ meta: [{ title: "Manage Subjects — Lakshay IQ" }] }),
  component: ManageSubjects,
});

function ManageSubjects() {
  const { data, loading, remove } = useSupabaseTable<Row>("subjects");
  const { data: sems } = useSupabaseTable<Sem>("semesters");
  const semLabel = (id: string) => { const s = sems.find((x) => x.id === id); return s ? `Sem ${s.semester_number}` : "—"; };

  const columns: DataTableColumn<Row>[] = [
    { key: "name", header: "Subject", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name, sortable: true },
    { key: "code", header: "Code", accessor: (r) => r.subject_code ? <Badge variant="outline">{r.subject_code}</Badge> : "—", sortable: false },
    { key: "slug", header: "Slug", accessor: (r) => r.slug, sortValue: (r) => r.slug, sortable: true },
    { key: "sem", header: "Semester", accessor: (r) => semLabel(r.semester_id), sortable: false },
    { key: "actions", header: "", className: "text-right w-16", accessor: (r) => <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button> },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Subjects</h1>
          <p className="text-sm text-muted-foreground">Manage subjects across semesters.</p>
        </div>
        <Button asChild><Link to="/admin/subjects/add"><Plus className="mr-2 h-4 w-4" /> Add Subject</Link></Button>
      </header>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <DataTable<Row> data={data} columns={columns} searchableKeys={["name", "slug"]} rowKey={(r) => r.id} />
      )}
    </div>
  );
}
