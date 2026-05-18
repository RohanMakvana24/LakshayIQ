import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { courses, semesters, subjects, units, universities } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/admin/content")({
  head: () => ({ meta: [{ title: "Content Management — Lakshay IQ" }] }),
  component: ContentMgmt,
});

const tabs = [
  { key: "universities", label: "Universities", rows: universities.map(u => [u.name, u.shortName, `${u.courses} courses`]) },
  { key: "courses", label: "Courses", rows: courses.map(c => [c.name, c.code, c.duration]) },
  { key: "semesters", label: "Semesters", rows: semesters.map(s => [`Sem ${s.number}`, s.courseId, `${s.subjects} subjects`]) },
  { key: "subjects", label: "Subjects", rows: subjects.map(s => [s.name, s.code, `${s.credits} credits`]) },
  { key: "units", label: "Units", rows: units.map(u => [`Unit ${u.number}`, u.title, `${u.videos} videos`]) },
  { key: "videos", label: "Videos", rows: [["Lec 1: Intro to OOP", "10:34", "Programming Fund."], ["Lec 2: Polymorphism", "12:11", "Programming Fund."]] },
  { key: "pdfs", label: "PDFs / Materials", rows: [["OOP Notes.pdf", "2.1 MB", "Programming Fund."], ["DM Notes.pdf", "1.8 MB", "Discrete Math"]] },
  { key: "pyqs", label: "Previous Year Papers", rows: [["End-Sem 2024", "CS101", "DU"], ["End-Sem 2023", "CS101", "DU"]] },
  { key: "iqs", label: "Important Questions", rows: [["Define OOP pillars", "10 marks", "CS101"]] },
  { key: "timetables", label: "Exam Timetables", rows: [["End-Sem Dec 2024", "12 Dec", "DU CS"]] },
];

function ContentMgmt() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Content Management</h1>
          <p className="text-sm text-muted-foreground">Create, edit and delete academic content across the platform.</p>
        </div>
      </header>

      <Tabs defaultValue="universities">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {tabs.map(t => <TabsTrigger key={t.key} value={t.key} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t.label}</TabsTrigger>)}
        </TabsList>

        {tabs.map(t => (
          <TabsContent key={t.key} value={t.key} className="mt-4">
            <Card className="p-5 shadow-soft">
              <div className="mb-4 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder={`Search ${t.label.toLowerCase()}…`} className="pl-9" />
                </div>
                <Button><Plus className="mr-2 h-4 w-4" /> Add {t.label.slice(0,-1)}</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Detail</th>
                      <th className="py-2 pr-4">Meta</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-accent/40">
                        <td className="py-3 pr-4 font-medium">{row[0]}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{row[1]}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{row[2]}</td>
                        <td className="py-3 text-right">
                          <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
