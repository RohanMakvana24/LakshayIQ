import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useSupabaseTable } from "@/hooks/use-supabase-table";

type Unit = { id: string; title: string; unit_number: number };

export const Route = createFileRoute("/_authenticated/admin/videos/add")({
  head: () => ({ meta: [{ title: "Add Video — Lakshay IQ" }] }),
  component: AddVideo,
});

function AddVideo() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("unit_videos");
  const { data: units } = useSupabaseTable<Unit>("units");
  const [unitId, setUnitId] = useState(""); const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState(""); const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [duration, setDuration] = useState(""); const [saving, setSaving] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/videos"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
      <header><h1 className="font-display text-3xl font-bold">Add Video</h1></header>
      <Card className="p-6 shadow-soft">
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault(); setSaving(true);
          const ok = await insert({ unit_id: unitId, title, video_url: videoUrl, thumbnail_url: thumbnailUrl || null, duration: duration || null });
          setSaving(false); if (ok) nav({ to: "/admin/videos" });
        }}>
          <div className="space-y-2 sm:col-span-2">
            <Label>Unit *</Label>
            <Select value={unitId} onValueChange={setUnitId} required>
              <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
              <SelectContent>{units.map((u) => <SelectItem key={u.id} value={u.id}>U{u.unit_number} · {u.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2"><Label>Title *</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Video URL *</Label><Input required type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" /></div>
          <div className="space-y-2"><Label>Thumbnail URL</Label><Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} /></div>
          <div className="space-y-2"><Label>Duration</Label><Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="12:30" /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/videos">Cancel</Link></Button>
            <Button type="submit" disabled={saving || !unitId}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
