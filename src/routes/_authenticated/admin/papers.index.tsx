import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { Plus, Trash2, ExternalLink } from "lucide-react";

type Row = { id: string; subject_id: string; year: number; semester: number | null; title: string; file_url: string; created_at: string };
type Subject = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/papers/")({
  head: () => ({ meta: [{ title: "Previous Year Papers — Lakshay IQ" }] }),
  component: ManagePapers,
});

function ManagePapers() {
  const { data, loading, remove } = useSupabaseTable<Row>("previous_year_papers");
  const { data: subjects } = useSupabaseTable<Subject>("subjects");
  const subjName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "—";

  const columns: DataTableColumn<Row>[] = [
    { key: "title", header: "Title", accessor: (r) => <span className="font-medium">{r.title}</span>, sortValue: (r) => r.title, sortable: true },
    { key: "subj", header: "Subject", accessor: (r) => subjName(r.subject_id), sortable: false },
    { key: "year", header: "Year", accessor: (r) => r.year, sortValue: (r) => r.year, sortable: true },
    { key: "sem", header: "Sem", accessor: (r) => r.semester ?? "—", sortable: false },
    { key: "url", header: "PDF", accessor: (r) => <a href={r.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" />Open</a> },
    { key: "actions", header: "", className: "text-right w-16", accessor: (r) => <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button> },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-3xl font-bold">Previous Year Papers</h1><p className="text-sm text-muted-foreground">Manage PYQ archive.</p></div>
        <Button asChild><Link to="/admin/papers/add"><Plus className="mr-2 h-4 w-4" /> Add Paper</Link></Button>
      </header>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <DataTable<Row> data={data} columns={columns} searchableKeys={["title"]} rowKey={(r) => r.id} />
      )}
    </div>
  );
}
