import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCourse, getSemester, getSubject, getUniversity, unitsBySubject } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Calendar, Download, FileText, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/subject/$id")({
  loader: ({ params }) => {
    const s = getSubject(params.id);
    if (!s) throw notFound();
    const sem = getSemester(s.semesterId)!;
    const c = getCourse(sem.courseId)!;
    const u = getUniversity(c.universityId)!;
    return { subject: s, semester: sem, course: c, university: u, units: unitsBySubject(s.id) };
  },
  component: SubjectPage,
});

function SubjectPage() {
  const { subject, semester, course, university, units } = Route.useLoaderData();
  const pyqs = [2024, 2023, 2022, 2021];
  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: "Dashboard", to: "/student" },
        { label: university.shortName, to: "/student/university/$id", params: { id: university.id } },
        { label: course.code, to: "/student/course/$id", params: { id: course.id } },
        { label: `Sem ${semester.number}`, to: "/student/semester/$id", params: { id: semester.id } },
        { label: subject.code },
      ]} />

      <header className="rounded-2xl border bg-gradient-primary p-6 text-primary-foreground shadow-elegant">
        <p className="text-xs font-medium uppercase tracking-wider opacity-80">{subject.code}</p>
        <h1 className="mt-1 font-display text-3xl font-bold">{subject.name}</h1>
        <p className="mt-2 opacity-90">{subject.credits} credits · {subject.units} units</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 shadow-soft lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Previous Year Papers</h2>
            <Badge variant="secondary">{pyqs.length} papers</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {pyqs.map((y) => (
              <div key={y} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground"><FileText className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-medium">End-Sem {y}</p>
                    <p className="text-xs text-muted-foreground">PDF · 1.2 MB</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost"><Download className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Exam Timetable</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="rounded-lg border p-3"><p className="font-medium">Mid-Semester</p><p className="text-muted-foreground">15 Oct, 10:00 AM</p></div>
            <div className="rounded-lg border p-3"><p className="font-medium">End-Semester</p><p className="text-muted-foreground">12 Dec, 9:00 AM</p></div>
          </div>
        </Card>
      </div>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Units</h2>
        <div className="grid gap-3">
          {units.map((u: { id: string; number: number; title: string; videos: number; materials: number }) => (
            <Link key={u.id} to="/student/unit/$id" params={{ id: u.id }}>
              <Card className="group flex items-center gap-4 p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-lg font-bold text-primary-foreground shadow-elegant">{u.number}</div>
                <div className="flex-1">
                  <h3 className="font-display text-base font-semibold">{u.title}</h3>
                  <p className="text-xs text-muted-foreground">{u.videos} videos · {u.materials} materials</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
