import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldBan, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";

interface Row { id: string; full_name: string | null; email: string | null; role: "admin" | "student"; created_at: string }

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users — Lakshay IQ" }] }),
  component: UsersPage,
});

function UsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email, created_at").order("created_at", { ascending: false });
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const map = new Map(roles?.map(r => [r.user_id, r.role]));
    setRows((profiles ?? []).map(p => ({ ...p, role: (map.get(p.id) as "admin" | "student") ?? "student" })));
  };
  useEffect(() => { load(); }, []);

  const toggleRole = async (r: Row) => {
    const next = r.role === "admin" ? "student" : "admin";
    const { error: del } = await supabase.from("user_roles").delete().eq("user_id", r.id);
    if (del) return toast.error(del.message);
    const { error } = await supabase.from("user_roles").insert({ user_id: r.id, role: next });
    if (error) return toast.error(error.message);
    toast.success(`Set to ${next}`);
    load();
  };

  const filtered = rows.filter(r =>
    !q || r.email?.toLowerCase().includes(q.toLowerCase()) || r.full_name?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">{rows.length} accounts · manage roles and activity</p>
      </header>

      <Card className="p-5 shadow-soft">
        <div className="mb-4 relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" className="pl-9 max-w-md" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Joined</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-accent/40">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{(r.full_name ?? r.email ?? "U")[0].toUpperCase()}</div>
                      <span className="font-medium">{r.full_name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{r.email}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={r.role === "admin" ? "default" : "secondary"}>{r.role}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => toggleRole(r)}>
                      <UserCog className="mr-1 h-4 w-4" /> {r.role === "admin" ? <><ShieldBan className="mr-1 h-4 w-4" />Demote</> : <><ShieldCheck className="mr-1 h-4 w-4" />Promote</>}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
