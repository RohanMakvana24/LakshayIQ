import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { useSupabaseTable } from "@/hooks/use-supabase-table";
import { Plus, Trash2, Pencil } from "lucide-react";

type Row = { id: string; name: string; slug: string; description: string | null; is_active: boolean; created_at: string };

export const Route = createFileRoute("/_authenticated/admin/universities/")({
  head: () => ({ meta: [{ title: "Manage Universities — Lakshay IQ" }] }),
  component: ManageUniversities,
});

function ManageUniversities() {
  const { data, loading, remove } = useSupabaseTable<Row>("universities");

  const columns: DataTableColumn<Row>[] = [
    { key: "name", header: "Name", accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name, sortable: true },
    { key: "slug", header: "Slug", accessor: (r) => <Badge variant="outline">{r.slug}</Badge>, sortValue: (r) => r.slug, sortable: true },
    { key: "status", header: "Status", accessor: (r) => r.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>, sortValue: (r) => String(r.is_active), sortable: true },
    { key: "created", header: "Created", accessor: (r) => new Date(r.created_at).toLocaleDateString(), sortValue: (r) => r.created_at, sortable: true },
    {
      key: "actions", header: "Actions", className: "text-right w-24",
      accessor: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" asChild>
            <Link to={`/admin/universities/${r.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Universities</h1>
          <p className="text-sm text-muted-foreground">Manage all universities on the platform.</p>
        </div>
        <Button asChild><Link to="/admin/universities/add"><Plus className="mr-2 h-4 w-4" /> Add University</Link></Button>
      </header>
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <DataTable<Row> data={data} columns={columns} searchableKeys={["name", "slug"]} rowKey={(r) => r.id} />
      )}
    </div>
  );
}
