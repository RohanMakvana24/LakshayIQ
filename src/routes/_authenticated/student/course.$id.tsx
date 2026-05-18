import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCourse, getUniversity, semestersByCourse } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/course/$id")({
  loader: ({ params }) => {
    const c = getCourse(params.id);
    if (!c) throw notFound();
    const u = getUniversity(c.universityId)!;
    return { course: c, university: u, semesters: semestersByCourse(c.id) };
  },
  component: CoursePage,
});

function CoursePage() {
  const { course, university, semesters } = Route.useLoaderData();
  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: "Dashboard", to: "/student" },
        { label: university.shortName, to: "/student/university/$id", params: { id: university.id } },
        { label: course.code },
      ]} />
      <header className="rounded-2xl border bg-card p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{course.code}</p>
        <h1 className="mt-1 font-display text-3xl font-bold">{course.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{course.duration} · {course.semesters} semesters</p>
      </header>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Semesters</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {semesters.map((s) => (
            <Link key={s.id} to="/student/semester/$id" params={{ id: s.id }}>
              <Card className="group flex h-full items-center gap-4 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-primary text-xl font-bold text-primary-foreground shadow-elegant">{s.number}</div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold">Semester {s.number}</h3>
                  <p className="text-xs text-muted-foreground">{s.subjects} subjects</p>
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
