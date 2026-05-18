import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { coursesByUniv, getUniversity } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { BookOpen, ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/university/$id")({
  loader: ({ params }) => {
    const u = getUniversity(params.id);
    if (!u) throw notFound();
    return { university: u, courses: coursesByUniv(u.id) };
  },
  component: UniversityPage,
});

function UniversityPage() {
  const { university, courses } = Route.useLoaderData();
  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[{ label: "Dashboard", to: "/student" }, { label: university.shortName }]} />
      <header className="flex items-center gap-5 rounded-2xl border bg-card p-6 shadow-soft">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-3xl text-primary-foreground shadow-elegant">{university.logo}</div>
        <div>
          <h1 className="font-display text-3xl font-bold">{university.name}</h1>
          <p className="text-sm text-muted-foreground">{university.location} · {university.courses} courses · {university.students} students</p>
        </div>
      </header>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Courses</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} to="/student/course/$id" params={{ id: c.id }}>
              <Card className="group h-full p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <Badge variant="outline">{c.code}</Badge>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{c.name}</h3>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {c.duration} · {c.semesters} semesters</p>
                <div className="mt-4 flex items-center justify-end">
                  <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
