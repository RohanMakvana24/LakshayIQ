import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { Plus, Trash2, ExternalLink } from "lucide-react";

type Row = { id: string; unit_id: string; title: string; video_url: string; duration: string | null; created_at: string };
type Unit = { id: string; title: string; unit_number: number };

export const Route = createFileRoute("/_authenticated/admin/videos/")({
  head: () => ({ meta: [{ title: "Unit Videos — Lakshay IQ" }] }),
  component: ManageVideos,
});

function ManageVideos() {
  const { data, loading, remove } = useSupabaseTable<Row>("unit_videos");
  const { data: units } = useSupabaseTable<Unit>("units");
  const unitLabel = (id: string) => { const u = units.find((x) => x.id === id); return u ? `U${u.unit_number} · ${u.title}` : "—"; };

  const columns: DataTableColumn<Row>[] = [
    { key: "title", header: "Title", accessor: (r) => <span className="font-medium">{r.title}</span>, sortValue: (r) => r.title, sortable: true },
    { key: "unit", header: "Unit", accessor: (r) => unitLabel(r.unit_id), sortable: false },
    { key: "duration", header: "Duration", accessor: (r) => r.duration ?? "—", sortable: false },
    { key: "url", header: "Link", accessor: (r) => <a href={r.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" />Open</a> },
    { key: "actions", header: "", className: "text-right w-16", accessor: (r) => <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button> },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-3xl font-bold">Unit Videos</h1><p className="text-sm text-muted-foreground">Manage video lectures.</p></div>
        <Button asChild><Link to="/admin/videos/add"><Plus className="mr-2 h-4 w-4" /> Add Video</Link></Button>
      </header>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <DataTable<Row> data={data} columns={columns} searchableKeys={["title"]} rowKey={(r) => r.id} />
      )}
    </div>
  );
}
