import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { universities } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/courses/add")({
  head: () => ({ meta: [{ title: "Add Course — Lakshay IQ" }] }),
  component: AddCourse,
});

function AddCourse() {
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/courses"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses</Link></Button>
      <header>
        <h1 className="font-display text-3xl font-bold">Add Course</h1>
        <p className="text-sm text-muted-foreground">Create a new course under a university.</p>
      </header>
      <Card className="p-6 shadow-soft">
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(e) => { e.preventDefault(); toast.success("Course added"); nav({ to: "/admin/courses" }); }}
        >
          <div className="space-y-2 sm:col-span-2">
            <Label>University</Label>
            <Select required>
              <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
              <SelectContent>
                {universities.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Course Name</Label><Input required placeholder="B.Sc. Computer Science" /></div>
          <div className="space-y-2"><Label>Code</Label><Input required placeholder="BSC-CS" /></div>
          <div className="space-y-2"><Label>Duration</Label><Input required placeholder="3 years" /></div>
          <div className="space-y-2"><Label>Total Semesters</Label><Input required type="number" min={1} max={12} defaultValue={6} /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/courses">Cancel</Link></Button>
            <Button type="submit">Save Course</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
