import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useSupabaseTable } from "@/hooks/use-supabase-table";

type Course = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/semesters/add")({
  head: () => ({ meta: [{ title: "Add Semester — Lakshay IQ" }] }),
  component: AddSemester,
});

function AddSemester() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("semesters");
  const { data: courses } = useSupabaseTable<Course>("courses", { orderBy: "name", ascending: true });
  const [courseId, setCourseId] = useState("");
  const [semesterNumber, setSemesterNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/semesters"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
      <header><h1 className="font-display text-3xl font-bold">Add Semester</h1></header>
      <Card className="p-6 shadow-soft">
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault(); setSaving(true);
          const ok = await insert({ course_id: courseId, semester_number: semesterNumber, title: title || null });
          setSaving(false); if (ok) nav({ to: "/admin/semesters" });
        }}>
          <div className="space-y-2 sm:col-span-2">
            <Label>Course *</Label>
            <Select value={courseId} onValueChange={setCourseId} required>
              <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Semester Number *</Label><Input required type="number" min={1} max={12} value={semesterNumber} onChange={(e) => setSemesterNumber(Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Semester 1" /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/semesters">Cancel</Link></Button>
            <Button type="submit" disabled={saving || !courseId}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
