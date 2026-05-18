import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { semesters, getCourse } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/subjects/add")({
  head: () => ({ meta: [{ title: "Add Subject — Lakshay IQ" }] }),
  component: AddSubject,
});

function AddSubject() {
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/subjects"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Subjects</Link></Button>
      <header>
        <h1 className="font-display text-3xl font-bold">Add Subject</h1>
        <p className="text-sm text-muted-foreground">Create a new subject under a semester.</p>
      </header>
      <Card className="p-6 shadow-soft">
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(e) => { e.preventDefault(); toast.success("Subject added"); nav({ to: "/admin/subjects" }); }}
        >
          <div className="space-y-2 sm:col-span-2">
            <Label>Semester</Label>
            <Select required>
              <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
              <SelectContent>
                {semesters.map((s) => <SelectItem key={s.id} value={s.id}>{getCourse(s.courseId)?.code} · Sem {s.number}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Subject Name</Label><Input required placeholder="Programming Fundamentals" /></div>
          <div className="space-y-2"><Label>Code</Label><Input required placeholder="CS101" /></div>
          <div className="space-y-2"><Label>Credits</Label><Input required type="number" min={1} max={10} defaultValue={4} /></div>
          <div className="space-y-2"><Label>Total Units</Label><Input required type="number" min={1} max={20} defaultValue={5} /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/subjects">Cancel</Link></Button>
            <Button type="submit">Save Subject</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
