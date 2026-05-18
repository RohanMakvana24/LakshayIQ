import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { Plus, Trash2, ExternalLink } from "lucide-react";

type Row = { id: string; university_id: string; course_id: string; semester_id: string; title: string; exam_start_date: string | null; exam_end_date: string | null; file_url: string; created_at: string };
type Named = { id: string; name: string };
type Sem = { id: string; semester_number: number };

export const Route = createFileRoute("/_authenticated/admin/timetables/")({
  head: () => ({ meta: [{ title: "Exam Timetables — Lakshay IQ" }] }),
  component: ManageTimetables,
});

function ManageTimetables() {
  const { data, loading, remove } = useSupabaseTable<Row>("exam_timetables");
  const { data: univs } = useSupabaseTable<Named>("universities");
  const { data: courses } = useSupabaseTable<Named>("courses");
  const { data: sems } = useSupabaseTable<Sem>("semesters");
  const uname = (id: string) => univs.find((x) => x.id === id)?.name ?? "—";
  const cname = (id: string) => courses.find((x) => x.id === id)?.name ?? "—";
  const sname = (id: string) => { const s = sems.find((x) => x.id === id); return s ? `Sem ${s.semester_number}` : "—"; };

  const columns: DataTableColumn<Row>[] = [
    { key: "title", header: "Title", accessor: (r) => <span className="font-medium">{r.title}</span>, sortValue: (r) => r.title, sortable: true },
    { key: "u", header: "University", accessor: (r) => uname(r.university_id), sortable: false },
    { key: "c", header: "Course", accessor: (r) => cname(r.course_id), sortable: false },
    { key: "s", header: "Sem", accessor: (r) => sname(r.semester_id), sortable: false },
    { key: "start", header: "Start", accessor: (r) => r.exam_start_date ?? "—", sortValue: (r) => r.exam_start_date ?? "", sortable: true },
    { key: "end", header: "End", accessor: (r) => r.exam_end_date ?? "—", sortValue: (r) => r.exam_end_date ?? "", sortable: true },
    { key: "url", header: "PDF", accessor: (r) => <a href={r.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" />Open</a> },
    { key: "actions", header: "", className: "text-right w-16", accessor: (r) => <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button> },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-3xl font-bold">Exam Timetables</h1><p className="text-sm text-muted-foreground">Manage exam schedules.</p></div>
        <Button asChild><Link to="/admin/timetables/add"><Plus className="mr-2 h-4 w-4" /> Add Timetable</Link></Button>
      </header>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <DataTable<Row> data={data} columns={columns} searchableKeys={["title"]} rowKey={(r) => r.id} />
      )}
    </div>
  );
}
