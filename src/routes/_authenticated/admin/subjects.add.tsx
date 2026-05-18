import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useSupabaseTable, slugify } from "@/hooks/use-supabase-table";

type Sem = { id: string; semester_number: number; course_id: string };
type Course = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/subjects/add")({
  head: () => ({ meta: [{ title: "Add Subject — Lakshay IQ" }] }),
  component: AddSubject,
});

function AddSubject() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("subjects");
  const { data: sems } = useSupabaseTable<Sem>("semesters");
  const { data: courses } = useSupabaseTable<Course>("courses");
  const courseName = (id: string) => courses.find((c) => c.id === id)?.name ?? "Course";
  const [semesterId, setSemesterId] = useState("");
  const [name, setName] = useState(""); const [slug, setSlug] = useState("");
  const [code, setCode] = useState(""); const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/subjects"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
      <header><h1 className="font-display text-3xl font-bold">Add Subject</h1></header>
      <Card className="p-6 shadow-soft">
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault(); setSaving(true);
          const ok = await insert({ semester_id: semesterId, name, slug: slug || slugify(name), subject_code: code || null, description: description || null, thumbnail_url: thumbnailUrl || null });
          setSaving(false); if (ok) nav({ to: "/admin/subjects" });
        }}>
          <div className="space-y-2 sm:col-span-2">
            <Label>Semester *</Label>
            <Select value={semesterId} onValueChange={setSemesterId} required>
              <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
              <SelectContent>{sems.map((s) => <SelectItem key={s.id} value={s.id}>{courseName(s.course_id)} · Sem {s.semester_number}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Name *</Label><Input required value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} /></div>
          <div className="space-y-2"><Label>Slug *</Label><Input required value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
          <div className="space-y-2"><Label>Subject Code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CS101" /></div>
          <div className="space-y-2"><Label>Thumbnail URL</Label><Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/subjects">Cancel</Link></Button>
            <Button type="submit" disabled={saving || !semesterId}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
