import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { Plus, Trash2 } from "lucide-react";

type Row = { id: string; university_id: string; name: string; slug: string; duration: string | null; total_semesters: number; created_at: string };
type Univ = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/courses/")({
  head: () => ({ meta: [{ title: "Manage Courses — Lakshay IQ" }] }),
  component: ManageCourses,
});

function ManageCourses() {
  const { data, loading, remove } = useSupabaseTable<Row>("courses");
  const { data: univs } = useSupabaseTable<Univ>("universities", { orderBy: "name", ascending: true });
  const univName = (id: string) => univs.find((u) => u.id === id)?.name ?? "—";

  const columns: DataTableColumn<Row>[] = [
    { key: "name", header: "Name", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name, sortable: true },
    { key: "slug", header: "Slug", accessor: (r) => <Badge variant="outline">{r.slug}</Badge>, sortValue: (r) => r.slug, sortable: true },
    { key: "university", header: "University", accessor: (r) => univName(r.university_id), sortValue: (r) => univName(r.university_id), sortable: true },
    { key: "duration", header: "Duration", accessor: (r) => r.duration ?? "—", sortable: false },
    { key: "sems", header: "Semesters", accessor: (r) => r.total_semesters, sortValue: (r) => r.total_semesters, sortable: true },
    { key: "actions", header: "", className: "text-right w-16", accessor: (r) => <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button> },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground">Manage courses across all universities.</p>
        </div>
        <Button asChild><Link to="/admin/courses/add"><Plus className="mr-2 h-4 w-4" /> Add Course</Link></Button>
      </header>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <DataTable<Row> data={data} columns={columns} searchableKeys={["name", "slug"]} rowKey={(r) => r.id} />
      )}
    </div>
  );
}
