import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCourse, getSemester, getSubject, getUniversity, getUnit } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Play, FileText, Bookmark, Star, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/unit/$id")({
  loader: ({ params }) => {
    const u = getUnit(params.id);
    if (!u) throw notFound();
    const sub = getSubject(u.subjectId)!;
    const sem = getSemester(sub.semesterId)!;
    const c = getCourse(sem.courseId)!;
    const uni = getUniversity(c.universityId)!;
    return { unit: u, subject: sub, semester: sem, course: c, university: uni };
  },
  component: UnitPage,
});

function UnitPage() {
  const { unit, subject, course, university, semester } = Route.useLoaderData();
  const videos = Array.from({ length: unit.videos }).map((_, i) => ({ id: i, title: `Lecture ${i + 1}: ${unit.title}`, duration: `${10 + i}:${(i * 7) % 60}`.padEnd(5, "0") }));
  const materials = Array.from({ length: unit.materials }).map((_, i) => ({ id: i, title: `${unit.title} — Notes ${i + 1}`, size: `${1 + i}.${i}0 MB` }));
  const iqs = [
    { q: "Define the four pillars of OOP with examples.", marks: 10 },
    { q: "Differentiate between abstraction and encapsulation.", marks: 5 },
    { q: "Explain polymorphism with a real-world code sample.", marks: 8 },
  ];

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: "Dashboard", to: "/student" },
        { label: university.shortName, to: "/student/university/$id", params: { id: university.id } },
        { label: course.code, to: "/student/course/$id", params: { id: course.id } },
        { label: `Sem ${semester.number}`, to: "/student/semester/$id", params: { id: semester.id } },
        { label: subject.code, to: "/student/subject/$id", params: { id: subject.id } },
        { label: `Unit ${unit.number}` },
      ]} />

      <header className="rounded-2xl border bg-card p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Unit {unit.number}</p>
        <div className="mt-1 flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl font-bold">{unit.title}</h1>
          <Button variant="outline"><Bookmark className="mr-2 h-4 w-4" /> Bookmark</Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{subject.name}</p>
      </header>

      <Tabs defaultValue="videos">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="videos"><Play className="mr-1.5 h-4 w-4" /> Videos</TabsTrigger>
          <TabsTrigger value="materials"><FileText className="mr-1.5 h-4 w-4" /> Materials</TabsTrigger>
          <TabsTrigger value="iq"><Star className="mr-1.5 h-4 w-4" /> Important Qs</TabsTrigger>
          <TabsTrigger value="bookmarks"><Bookmark className="mr-1.5 h-4 w-4" /> Bookmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {videos.map((v) => (
              <Card key={v.id} className="flex items-center gap-3 p-3 shadow-soft">
                <div className="grid h-16 w-24 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><Play className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="line-clamp-2 text-sm font-medium">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.duration} min</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <div className="space-y-2">
            {materials.map((m) => (
              <Card key={m.id} className="flex items-center gap-3 p-3 shadow-soft">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground"><FileText className="h-4 w-4" /></div>
                <div className="flex-1"><p className="text-sm font-medium">{m.title}</p><p className="text-xs text-muted-foreground">PDF · {m.size}</p></div>
                <Button size="sm" variant="ghost"><Download className="h-4 w-4" /></Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="iq" className="mt-4">
          <div className="space-y-3">
            {iqs.map((iq, i) => (
              <Card key={i} className="p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm"><span className="mr-2 font-semibold text-primary">Q{i + 1}.</span>{iq.q}</p>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{iq.marks} marks</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookmarks" className="mt-4">
          <Card className="p-10 text-center shadow-soft">
            <Bookmark className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Saved items from this unit will appear here.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
