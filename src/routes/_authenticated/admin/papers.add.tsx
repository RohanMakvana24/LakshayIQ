import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useSupabaseTable } from "@/hooks/use-supabase-table";

type Subject = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/papers/add")({
  head: () => ({ meta: [{ title: "Add PYP — Lakshay IQ" }] }),
  component: AddPaper,
});

function AddPaper() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("previous_year_papers");
  const { data: subjects } = useSupabaseTable<Subject>("subjects", { orderBy: "name", ascending: true });
  const [subjectId, setSubjectId] = useState(""); const [year, setYear] = useState(new Date().getFullYear());
  const [semester, setSemester] = useState<number | "">(""); const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState(""); const [saving, setSaving] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/papers"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
      <header><h1 className="font-display text-3xl font-bold">Add Previous Year Paper</h1></header>
      <Card className="p-6 shadow-soft">
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault(); setSaving(true);
          const ok = await insert({ subject_id: subjectId, year, semester: semester === "" ? null : semester, title, file_url: fileUrl });
          setSaving(false); if (ok) nav({ to: "/admin/papers" });
        }}>
          <div className="space-y-2 sm:col-span-2">
            <Label>Subject *</Label>
            <Select value={subjectId} onValueChange={setSubjectId} required>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2"><Label>Title *</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Year *</Label><Input required type="number" min={1990} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Semester</Label><Input type="number" min={1} max={12} value={semester} onChange={(e) => setSemester(e.target.value === "" ? "" : Number(e.target.value))} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>File URL *</Label><Input required type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://…" /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/papers">Cancel</Link></Button>
            <Button type="submit" disabled={saving || !subjectId}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
