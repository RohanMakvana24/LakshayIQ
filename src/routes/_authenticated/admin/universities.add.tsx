import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/universities/add")({
  head: () => ({ meta: [{ title: "Add University — Lakshay IQ" }] }),
  component: AddUniversity,
});

function AddUniversity() {
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/universities"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Universities</Link></Button>
      <header>
        <h1 className="font-display text-3xl font-bold">Add University</h1>
        <p className="text-sm text-muted-foreground">Create a new university record.</p>
      </header>
      <Card className="p-6 shadow-soft">
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(e) => { e.preventDefault(); toast.success("University added"); nav({ to: "/admin/universities" }); }}
        >
          <div className="space-y-2 sm:col-span-2"><Label>Full Name</Label><Input required placeholder="Delhi University" /></div>
          <div className="space-y-2"><Label>Short Name</Label><Input required placeholder="DU" /></div>
          <div className="space-y-2"><Label>Location</Label><Input required placeholder="New Delhi" /></div>
          <div className="space-y-2"><Label>Logo Emoji</Label><Input placeholder="🎓" /></div>
          <div className="space-y-2"><Label>Website</Label><Input type="url" placeholder="https://…" /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/universities">Cancel</Link></Button>
            <Button type="submit">Save University</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
