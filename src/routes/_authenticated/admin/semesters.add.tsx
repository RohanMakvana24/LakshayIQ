import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BookOpen, CalendarDays, Eye, Layers } from "lucide-react";
import { useSupabaseTable } from "@/hooks/use-supabase-table";

type Course = { id: string; name: string };

export const Route = createFileRoute("/_authenticated/admin/semesters/add")({
  head: () => ({ meta: [{ title: "Add Semester — Lakshay IQ" }] }),
  component: AddSemester,
});

function AddSemester() {
  const nav = useNavigate();
  const { insert } = useSupabaseTable("semesters");
  const { data: courses } = useSupabaseTable<Course>("courses", { orderBy: "name", ascending: true });
  const [courseId, setCourseId] = useState("");
  const [semesterNumber, setSemesterNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Preview helper string to extract the real-time selected course nomenclature
  const selectedCourseName = courses?.find((c) => c.id === courseId)?.name;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col gap-6 w-full max-w-full px-2">
      
      {/* Structural Header Action Elements */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 text-slate-500 hover:text-slate-900 pl-0">
            <Link to="/admin/semesters">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Semesters
            </Link>
          </Button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Add Semester</h1>
          <p className="text-xs text-slate-500 mt-0.5">Setup a functional semester timeline block and map it to an active curriculum stream.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs font-semibold px-4" asChild>
            <Link to="/admin/semesters">Cancel</Link>
          </Button>
          <Button 
            type="button" 
            size="sm"
            onClick={(e) => {
              // Direct external programmatic invocation to fire form state pipeline smoothly
              const submitBtn = document.getElementById("submit-semester-btn");
              submitBtn?.click();
            }} 
            disabled={saving || !courseId}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold px-5 shadow-sm"
          >
            {saving ? "Saving Blueprint..." : "Publish Semester"}
          </Button>
        </div>
      </div>

      {/* Grid Allocation Split Layout Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 w-full">
        
        {/* Form Entry Fieldsets Context Block (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-2xl bg-white">
            <form className="space-y-5" onSubmit={async (e) => {
              e.preventDefault(); 
              setSaving(true);
              const ok = await insert({ course_id: courseId, semester_number: semesterNumber, title: title || null });
              setSaving(false); 
              if (ok) nav({ to: "/admin/semesters" });
            }}>
              
              {/* Linked Parent Course Pipeline Scope Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Parent Course Program *</Label>
                <Select value={courseId} onValueChange={setCourseId} required>
                  <SelectTrigger className="h-10 border-slate-200 rounded-xl text-xs focus:ring-slate-900/10 focus:border-slate-900">
                    <SelectValue placeholder="Select parent course" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white">
                    {courses && courses.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs focus:bg-slate-50 rounded-lg py-2">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Incremental Metric Configurations Attributes Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Semester Number *</Label>
                  <Input 
                    required 
                    type="number" 
                    min={1} 
                    max={12} 
                    value={semesterNumber} 
                    onChange={(e) => setSemesterNumber(Number(e.target.value))} 
                    className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10 focus-visible:border-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Display Title / Nomenclature</Label>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder={`e.g., Semester ${semesterNumber}`} 
                    className="h-10 border-slate-200 rounded-xl text-xs focus-visible:ring-slate-900/10 focus-visible:border-slate-900"
                  />
                </div>
              </div>

              {/* Hidden direct submission trigger button anchor */}
              <button id="submit-semester-btn" type="submit" className="hidden" />

            </form>
          </Card>
        </div>

        {/* Live Visualization Interactive Sandbox Previews Container (5 Columns) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 px-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Live Semester Node Preview</span>
          </div>

          <Card className="overflow-hidden border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl bg-white group p-5 space-y-4">
            
            {/* Minimal Node Graphic Shell Indicator */}
            <div className="h-12 w-12 rounded-xl bg-slate-900/5 border border-slate-900/10 flex items-center justify-center text-slate-800">
              <Layers className="h-5 w-5 stroke-[1.8]" />
            </div>

            {/* Primary Details Matrix */}
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md mb-1">
                Node Matrix Level: {semesterNumber}
              </span>
              <h3 className="text-base font-black text-slate-800 tracking-tight">
                {title || `Semester ${semesterNumber}`}
              </h3>
            </div>

            {/* Relational Parent Course Information Tracker */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <BookOpen className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">
                  {selectedCourseName || <span className="italic text-slate-300">No course stream mapped yet</span>}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <CalendarDays className="h-4 w-4 text-slate-300 flex-shrink-0" />
                <span>Academic Stage Registry Slot</span>
              </div>
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}