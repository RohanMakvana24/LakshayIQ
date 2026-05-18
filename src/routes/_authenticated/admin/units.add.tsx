import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useSupabaseTable } from "@/hooks/use-supabase-table";

type Subject = { id: string; name: string; subject_code: string | null };

export const Route = createFileRoute("/_authenticated/admin/units/add")({
  head: () => ({ meta: [{ title: "Add Unit — Lakshay IQ" }] }),
  component: AddUnit,
});

function AddUnit() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("units");
  const { data: subjects } = useSupabaseTable<Subject>("subjects", { orderBy: "name", ascending: true });
  const [subjectId, setSubjectId] = useState("");
  const [unitNumber, setUnitNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/units"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
      <header><h1 className="font-display text-3xl font-bold">Add Unit</h1></header>
      <Card className="p-6 shadow-soft">
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault(); setSaving(true);
          const ok = await insert({ subject_id: subjectId, unit_number: unitNumber, title, description: description || null });
          setSaving(false); if (ok) nav({ to: "/admin/units" });
        }}>
          <div className="space-y-2 sm:col-span-2">
            <Label>Subject *</Label>
            <Select value={subjectId} onValueChange={setSubjectId} required>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.subject_code ? `${s.subject_code} · ` : ""}{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Unit Number *</Label><Input required type="number" min={1} max={20} value={unitNumber} onChange={(e) => setUnitNumber(Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Title *</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/units">Cancel</Link></Button>
            <Button type="submit" disabled={saving || !subjectId}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
