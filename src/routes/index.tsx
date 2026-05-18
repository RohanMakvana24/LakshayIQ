import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, FileText, Video, Bookmark, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lakshay IQ — Smart University Learning Platform" },
      { name: "description", content: "Notes, PYQs, videos and important questions for every Indian university — organized semester-wise." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && user && role) {
      nav({ to: role === "admin" ? "/admin" : "/student" });
    }
  }, [user, role, loading, nav]);

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">Lakshay IQ</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/login">Log in</Link></Button>
          <Button asChild><Link to="/signup">Get started</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6">
        <section className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Built for Indian university students
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-tight tracking-tight text-balance md:text-6xl">
              Every <span className="bg-gradient-primary bg-clip-text text-transparent">note, PYQ & video</span> your semester needs.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Browse universities, courses, semesters and subjects in one place. Curated study material organised the way you actually study.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-elegant">
                <Link to="/signup">Start learning free <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline"><Link to="/login">I already have an account</Link></Button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Verified content</span>
              <span className="flex items-center gap-2"><Bookmark className="h-4 w-4 text-primary" /> Save for later</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-primary opacity-20 blur-3xl" />
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: GraduationCap, label: "Universities", value: "120+" },
                { icon: BookOpen, label: "Courses", value: "850+" },
                { icon: FileText, label: "PYQ Papers", value: "12k+" },
                { icon: Video, label: "Lecture Videos", value: "30k+" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-soft">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-display text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-16">
          <h2 className="font-display text-3xl font-bold">The Lakshay IQ flow</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">Navigate the academic hierarchy intuitively — exactly the way curriculum is designed.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {["University", "Course", "Semester", "Subject", "Unit"].map((step, i) => (
              <div key={step} className="relative rounded-2xl border bg-card p-5 shadow-soft">
                <div className="text-xs font-semibold text-primary">STEP {i + 1}</div>
                <p className="mt-2 font-display text-lg font-semibold">{step}</p>
                <p className="mt-1 text-sm text-muted-foreground">Drill down to exactly what you need.</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-16 max-w-7xl border-t px-6 py-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Lakshay IQ — Learn smart.
      </footer>
    </div>
  );
}
