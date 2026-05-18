import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { Plus, Trash2 } from "lucide-react";

type Row = { id: string; unit_id: string; question_text: string; category: string; year: number | null; created_at: string };
type Unit = { id: string; title: string; unit_number: number };

export const Route = createFileRoute("/_authenticated/admin/questions/")({
  head: () => ({ meta: [{ title: "Important Questions — Lakshay IQ" }] }),
  component: ManageQuestions,
});

function ManageQuestions() {
  const { data, loading, remove } = useSupabaseTable<Row>("important_questions");
  const { data: units } = useSupabaseTable<Unit>("units");
  const unitLabel = (id: string) => { const u = units.find((x) => x.id === id); return u ? `U${u.unit_number}` : "—"; };

  const columns: DataTableColumn<Row>[] = [
    { key: "q", header: "Question", accessor: (r) => <span className="line-clamp-2">{r.question_text}</span>, sortValue: (r) => r.question_text, sortable: true },
    { key: "unit", header: "Unit", className: "w-20", accessor: (r) => unitLabel(r.unit_id), sortable: false },
    { key: "cat", header: "Category", accessor: (r) => <Badge variant="outline">{r.category}</Badge>, sortValue: (r) => r.category, sortable: true },
    { key: "year", header: "Year", accessor: (r) => r.year ?? "—", sortValue: (r) => r.year ?? 0, sortable: true },
    { key: "actions", header: "", className: "text-right w-16", accessor: (r) => <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button> },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-3xl font-bold">Important Questions</h1><p className="text-sm text-muted-foreground">Manage important / repeated / exam questions.</p></div>
        <Button asChild><Link to="/admin/questions/add"><Plus className="mr-2 h-4 w-4" /> Add Question</Link></Button>
      </header>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <DataTable<Row> data={data} columns={columns} searchableKeys={["question_text"]} rowKey={(r) => r.id} />
      )}
    </div>
  );
}
