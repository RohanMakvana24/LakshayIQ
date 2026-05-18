import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subjects } from "@/lib/mock-data";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/units/add")({
  head: () => ({ meta: [{ title: "Add Unit — Lakshay IQ" }] }),
  component: AddUnit,
});

function AddUnit() {
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/units"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Units</Link></Button>
      <header>
        <h1 className="font-display text-3xl font-bold">Add Unit</h1>
        <p className="text-sm text-muted-foreground">Create a new learning unit under a subject.</p>
      </header>
      <Card className="p-6 shadow-soft">
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(e) => { e.preventDefault(); toast.success("Unit added"); nav({ to: "/admin/units" }); }}
        >
          <div className="space-y-2 sm:col-span-2">
            <Label>Subject</Label>
            <Select required>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.code} · {s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Unit Number</Label><Input required type="number" min={1} placeholder="1" /></div>
          <div className="space-y-2"><Label>Title</Label><Input required placeholder="Introduction to Programming" /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea rows={4} placeholder="Brief description of the unit content…" /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/units">Cancel</Link></Button>
            <Button type="submit">Save Unit</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
