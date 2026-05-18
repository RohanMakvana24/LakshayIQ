import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useSupabaseTable } from "@/hooks/use-supabase-table";

type Unit = { id: string; title: string; unit_number: number };

export const Route = createFileRoute("/_authenticated/admin/questions/add")({
  head: () => ({ meta: [{ title: "Add Question — Lakshay IQ" }] }),
  component: AddQuestion,
});

function AddQuestion() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("important_questions");
  const { data: units } = useSupabaseTable<Unit>("units");
  const [unitId, setUnitId] = useState(""); const [questionText, setQuestionText] = useState("");
  const [category, setCategory] = useState("important"); const [year, setYear] = useState<number | "">("");
  const [questionFileUrl, setQuestionFileUrl] = useState(""); const [saving, setSaving] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild><Link to="/admin/questions"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
      <header><h1 className="font-display text-3xl font-bold">Add Important Question</h1></header>
      <Card className="p-6 shadow-soft">
        <form className="grid gap-5 sm:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault(); setSaving(true);
          const ok = await insert({ unit_id: unitId, question_text: questionText, category, year: year === "" ? null : year, question_file_url: questionFileUrl || null });
          setSaving(false); if (ok) nav({ to: "/admin/questions" });
        }}>
          <div className="space-y-2 sm:col-span-2">
            <Label>Unit *</Label>
            <Select value={unitId} onValueChange={setUnitId} required>
              <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
              <SelectContent>{units.map((u) => <SelectItem key={u.id} value={u.id}>U{u.unit_number} · {u.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2"><Label>Question *</Label><Textarea required rows={4} value={questionText} onChange={(e) => setQuestionText(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="repeated">Repeated</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Year</Label><Input type="number" min={1990} max={2100} value={year} onChange={(e) => setYear(e.target.value === "" ? "" : Number(e.target.value))} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Question File URL</Label><Input value={questionFileUrl} onChange={(e) => setQuestionFileUrl(e.target.value)} placeholder="https://…" /></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" asChild><Link to="/admin/questions">Cancel</Link></Button>
            <Button type="submit" disabled={saving || !unitId}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
