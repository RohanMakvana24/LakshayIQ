import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { courses } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/semesters/add")({
  head: () => ({ meta: [{ title: "Add Semester — Lakshay IQ" }] }),
  component: AddSemester,
});

function AddSemester() {
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/semesters"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Semesters</Link></Button>
      <header>
        <h1 className="font-display text-3xl font-bold">Add Semester</h1>
        <p className="text-sm text-muted-foreground">Create a new semester under a course.</p>
      </header>
      <Card className="p-6 shadow-soft">
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(e) => { e.preventDefault(); toast.success("Semester added"); nav({ to: "/admin/semesters" }); }}
        >
          <div className="space-y-2 sm:col-span-2">
            <Label>Course</Label>
            <Select required>
              <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Semester Number</Label><Input required type="number" min={1} max={12} placeholder="1" /></div>
          <div className="space-y-2"><Label>Expected Subjects</Label><Input type="number" min={0} defaultValue={5} /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/semesters">Cancel</Link></Button>
            <Button type="submit">Save Semester</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
