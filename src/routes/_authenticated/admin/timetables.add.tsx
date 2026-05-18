import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useSupabaseTable } from "@/hooks/use-supabase-table";

type Univ = { id: string; name: string };
type Course = { id: string; name: string; university_id: string };
type Sem = { id: string; semester_number: number; course_id: string };

export const Route = createFileRoute("/_authenticated/admin/timetables/add")({
  head: () => ({ meta: [{ title: "Add Timetable — Lakshay IQ" }] }),
  component: AddTimetable,
});

function AddTimetable() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("exam_timetables");
  const { data: univs } = useSupabaseTable<Univ>("universities");
  const { data: courses } = useSupabaseTable<Course>("courses");
  const { data: sems } = useSupabaseTable<Sem>("semesters");
  const [universityId, setUniversityId] = useState(""); const [courseId, setCourseId] = useState(""); const [semesterId, setSemesterId] = useState("");
  const [title, setTitle] = useState(""); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState("");
  const [fileUrl, setFileUrl] = useState(""); const [saving, setSaving] = useState(false);
  const filteredCourses = courses.filter((c) => !universityId || c.university_id === universityId);
  const filteredSems = sems.filter((s) => !courseId || s.course_id === courseId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/timetables"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
      <header><h1 className="font-display text-3xl font-bold">Add Exam Timetable</h1></header>
      <Card className="p-6 shadow-soft">
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault(); setSaving(true);
          const ok = await insert({ university_id: universityId, course_id: courseId, semester_id: semesterId, title, exam_start_date: startDate || null, exam_end_date: endDate || null, file_url: fileUrl });
          setSaving(false); if (ok) nav({ to: "/admin/timetables" });
        }}>
          <div className="space-y-2">
            <Label>University *</Label>
            <Select value={universityId} onValueChange={(v) => { setUniversityId(v); setCourseId(""); setSemesterId(""); }} required>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{univs.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Course *</Label>
            <Select value={courseId} onValueChange={(v) => { setCourseId(v); setSemesterId(""); }} required>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{filteredCourses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Semester *</Label>
            <Select value={semesterId} onValueChange={setSemesterId} required>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{filteredSems.map((s) => <SelectItem key={s.id} value={s.id}>Semester {s.semester_number}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2"><Label>Title *</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>File URL *</Label><Input required type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://…" /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/timetables">Cancel</Link></Button>
            <Button type="submit" disabled={saving || !universityId || !courseId || !semesterId}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
