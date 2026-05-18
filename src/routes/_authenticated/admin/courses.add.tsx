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

type Univ = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/courses/add")({
  head: () => ({ meta: [{ title: "Add Course — Lakshay IQ" }] }),
  component: AddCourse,
});

function AddCourse() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("courses");
  const { data: univs } = useSupabaseTable<Univ>("universities", { orderBy: "name", ascending: true });
  const [universityId, setUniversityId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [duration, setDuration] = useState("3 years");
  const [totalSemesters, setTotalSemesters] = useState(6);
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/courses"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
      <header><h1 className="font-display text-3xl font-bold">Add Course</h1></header>
      <Card className="p-6 shadow-soft">
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault(); setSaving(true);
          const ok = await insert({ university_id: universityId, name, slug: slug || slugify(name), duration, total_semesters: totalSemesters, description: description || null, thumbnail_url: thumbnailUrl || null });
          setSaving(false); if (ok) nav({ to: "/admin/courses" });
        }}>
          <div className="space-y-2 sm:col-span-2">
            <Label>University *</Label>
            <Select value={universityId} onValueChange={setUniversityId} required>
              <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
              <SelectContent>{univs.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Name *</Label><Input required value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} placeholder="B.Sc. Computer Science" /></div>
          <div className="space-y-2"><Label>Slug *</Label><Input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="bsc-cs" /></div>
          <div className="space-y-2"><Label>Duration</Label><Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="3 years" /></div>
          <div className="space-y-2"><Label>Total Semesters *</Label><Input required type="number" min={1} max={12} value={totalSemesters} onChange={(e) => setTotalSemesters(Number(e.target.value))} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Thumbnail URL</Label><Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/courses">Cancel</Link></Button>
            <Button type="submit" disabled={saving || !universityId}>{saving ? "Saving…" : "Save Course"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
