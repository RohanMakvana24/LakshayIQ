import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCourse, getSemester, getUniversity, subjectsBySemester } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ArrowRight, Layers } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/semester/$id")({
  loader: ({ params }) => {
    const s = getSemester(params.id);
    if (!s) throw notFound();
    const c = getCourse(s.courseId)!;
    const u = getUniversity(c.universityId)!;
    return { semester: s, course: c, university: u, subjects: subjectsBySemester(s.id) };
  },
  component: SemesterPage,
});

function SemesterPage() {
  const { semester, course, university, subjects } = Route.useLoaderData();
  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: "Dashboard", to: "/student" },
        { label: university.shortName, to: "/student/university/$id", params: { id: university.id } },
        { label: course.code, to: "/student/course/$id", params: { id: course.id } },
        { label: `Sem ${semester.number}` },
      ]} />
      <header className="rounded-2xl border bg-card p-6 shadow-soft">
        <h1 className="font-display text-3xl font-bold">Semester {semester.number}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{course.name} · {subjects.length} subjects</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <Link key={s.id} to="/student/subject/$id" params={{ id: s.id }}>
            <Card className="group h-full p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground"><Layers className="h-5 w-5" /></div>
                <Badge>{s.credits} cr</Badge>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{s.code} · {s.units} units</p>
              <div className="mt-4 flex items-center justify-end">
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
