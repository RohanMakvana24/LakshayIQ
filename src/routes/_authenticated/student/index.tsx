import { createFileRoute, Link } from "@tanstack/react-router";
import { universities } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/")({
  head: () => ({ meta: [{ title: "Dashboard — Lakshay IQ" }] }),
  component: StudentDashboard,
});

function StudentDashboard() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-gradient-primary p-8 text-primary-foreground shadow-elegant">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> Welcome to Lakshay IQ
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">Pick your university to begin</h1>
        <p className="mt-2 max-w-2xl text-primary-foreground/85">
          Every course, semester, subject and unit — neatly arranged so you can find study material in seconds.
        </p>
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">All universities</h2>
            <p className="text-sm text-muted-foreground">{universities.length} universities · updated daily</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {universities.map((u) => (
            <Link key={u.id} to="/student/university/$id" params={{ id: u.id }}>
              <Card className="group h-full overflow-hidden border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="flex items-start justify-between">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-2xl text-primary-foreground shadow-elegant">
                    {u.logo}
                  </div>
                  <Badge variant="secondary" className="text-xs">{u.shortName}</Badge>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold leading-tight">{u.name}</h3>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {u.location}</p>
                <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm">
                  <span className="text-muted-foreground">{u.courses} courses · {u.students} students</span>
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
