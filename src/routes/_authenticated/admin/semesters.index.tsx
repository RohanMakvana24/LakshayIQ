import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { Plus, Trash2 } from "lucide-react";

type Row = { id: string; course_id: string; semester_number: number; title: string | null; created_at: string };
type Course = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/semesters/")({
  head: () => ({ meta: [{ title: "Manage Semesters — Lakshay IQ" }] }),
  component: ManageSemesters,
});

function ManageSemesters() {
  const { data, loading, remove } = useSupabaseTable<Row>("semesters");
  const { data: courses } = useSupabaseTable<Course>("courses", { orderBy: "name", ascending: true });
  const courseName = (id: string) => courses.find((c) => c.id === id)?.name ?? "—";

  const columns: DataTableColumn<Row>[] = [
    { key: "number", header: "Semester", accessor: (r) => <span className="font-medium">Semester {r.semester_number}</span>, sortValue: (r) => r.semester_number, sortable: true },
    { key: "title", header: "Title", accessor: (r) => r.title ?? "—", sortable: false },
    { key: "course", header: "Course", accessor: (r) => courseName(r.course_id), sortValue: (r) => courseName(r.course_id), sortable: true },
    { key: "actions", header: "", className: "text-right w-16", accessor: (r) => <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button> },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Semesters</h1>
          <p className="text-sm text-muted-foreground">Manage semesters across courses.</p>
        </div>
        <Button asChild><Link to="/admin/semesters/add"><Plus className="mr-2 h-4 w-4" /> Add Semester</Link></Button>
      </header>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <DataTable<Row> data={data} columns={columns} searchableKeys={["title"]} rowKey={(r) => r.id} />
      )}
    </div>
  );
}
