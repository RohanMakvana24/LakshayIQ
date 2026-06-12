import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search as SearchIcon,
  Frown,
  Building2,
  BookOpen,
  Layers,
  GraduationCap,
  Loader2,
  ArrowRight,
  Sparkles,
  School,
  Library,
  BookMarked,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchParams { q?: string }

export const Route = createFileRoute("/_authenticated/student/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({ q: typeof s.q === "string" ? s.q : "" }),
  head: () => ({ meta: [{ title: "Search — Lakshay IQ" }] }),
  component: Search,
});

function Search() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(q);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    universities: any[];
    courses: any[];
    subjects: any[];
    units: any[];
  }>({ universities: [], courses: [], subjects: [], units: [] });

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    const performSearch = async () => {
      const query = q.trim();
      if (!query) {
        setResults({ universities: [], courses: [], subjects: [], units: [] });
        return;
      }

      setLoading(true);
      try {
        const [uniRes, courseRes, subRes, unitRes] = await Promise.all([
          supabase
            .from("universities")
            .select("id, name, logo_url, description")
            .ilike("name", `%${query}%`)
            .eq("is_active", true),
          supabase
            .from("courses")
            .select("id, name, slug, description")
            .ilike("name", `%${query}%`),
          supabase
            .from("subjects")
            .select("id, name, subject_code, description")
            .or(`name.ilike.%${query}%,subject_code.ilike.%${query}%`),
          supabase
            .from("units")
            .select("id, title, description, unit_number")
            .ilike("title", `%${query}%`)
        ]);

        setResults({
          universities: uniRes.data || [],
          courses: courseRes.data || [],
          subjects: subRes.data || [],
          units: unitRes.data || [],
        });
      } catch (err) {
        console.error("Search query failure:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      performSearch();
    }, 150);

    return () => clearTimeout(delayDebounce);
  }, [q]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search: { q: searchInput.trim() } as any });
  };

  const empty = !q.trim();
  const hasResults =
    results.universities.length > 0 ||
    results.courses.length > 0 ||
    results.subjects.length > 0 ||
    results.units.length > 0;

  const totalResults = results.universities.length + results.courses.length + results.subjects.length + results.units.length;

  return (
    <div className="w-full py-2 space-y-6 animate-in fade-in duration-300">
      
      {/* Premium Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary/[0.02] via-card to-emerald-500/[0.01] border border-border/80 overflow-hidden shadow-[0_12px_40px_-12px_rgba(0,0,0,0.03)] dark:shadow-none">
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-6 py-6 md:px-8 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-full px-2.5 py-0.5">
              <Sparkles className="h-3 w-3" />
              <span className="text-[10px] font-bold tracking-wide uppercase">Academic Search</span>
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-foreground">
              Syllabus & Course Search
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
              Instantly find registered universities, degree programs, specific subjects, or syllabus unit lessons.
            </p>
          </div>
        </div>
      </div>

      {/* Modern Search Bar */}
      <Card className="p-4 bg-card border border-border/80 shadow-[0_8px_30px_rgba(0,0,0,0.01)] rounded-2xl">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by campus name, subject code, unit title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 h-11 bg-secondary/35 border-border focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-sm font-bold"
            />
          </div>
          <button
            type="submit"
            className="px-6 h-11 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 shadow-md"
          >
            Search
          </button>
        </form>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border/80 rounded-2xl">
          <Loader2 className="h-7 w-7 text-emerald-500 animate-spin" />
          <p className="mt-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Scanning academic data...</p>
        </div>
      )}

      {/* Initial Empty State */}
      {!loading && empty && (
        <div className="text-center py-16 bg-card border border-border/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
          <div className="inline-flex p-3.5 bg-secondary border border-border rounded-xl mb-4">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider mb-1">Start Your Exploration</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-normal">
            Enter a key term above. You can search by university name, degree code, subject code, or unit lessons.
          </p>
        </div>
      )}

      {/* No Results State */}
      {!loading && !empty && !hasResults && (
        <div className="text-center py-16 bg-card border border-border/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
          <div className="inline-flex p-3.5 bg-secondary border border-border rounded-xl mb-4">
            <Frown className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider mb-1">No matching assets found</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-normal">
            We couldn't locate any academic indexes matching "{q}". Try verifying your spelling or using broader keywords.
          </p>
        </div>
      )}

      {/* Search Results */}
      {!loading && !empty && hasResults && (
        <div className="space-y-6">
          
          {/* Results Header Tag */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Found <span className="text-foreground font-black">{totalResults}</span> records matching "<span className="text-emerald-500 font-extrabold">{q}</span>"
            </p>
          </div>

          {/* Universities Section */}
          {results.universities.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-500" />
                <h2 className="text-xs font-black text-foreground uppercase tracking-wider">Campuses</h2>
                <Badge variant="secondary" className="text-[10px] font-bold bg-secondary border border-border">{results.universities.length}</Badge>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {results.universities.map((uni) => (
                  <Link
                    key={uni.id}
                    to="/student/university/$id"
                    params={{ id: uni.id }}
                    className="group block"
                  >
                    <Card className="p-4 border border-border/85 rounded-xl hover:border-border hover:bg-secondary/40 hover:shadow-sm transition-all duration-200 bg-card flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                        {uni.logo_url ? (
                          <img src={uni.logo_url} alt={uni.name} className="h-full w-full object-cover" />
                        ) : (
                          <School className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground group-hover:text-emerald-500 text-xs truncate transition-colors">{uni.name}</h3>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{uni.description || "Registered campus curriculum and academic resources."}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors shrink-0" />
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Courses Section */}
          {results.courses.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-500" />
                <h2 className="text-xs font-black text-foreground uppercase tracking-wider">Degree Programs</h2>
                <Badge variant="secondary" className="text-[10px] font-bold bg-secondary border border-border">{results.courses.length}</Badge>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {results.courses.map((course) => (
                  <Link
                    key={course.id}
                    to="/student/course/$id"
                    params={{ id: course.id }}
                    className="group block"
                  >
                    <Card className="p-4 border border-border/85 rounded-xl hover:border-border hover:bg-secondary/40 hover:shadow-sm transition-all duration-200 bg-card flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800">
                        <BookOpen className="h-4.5 w-4.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground group-hover:text-emerald-500 text-xs truncate transition-colors">{course.name}</h3>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{course.description || (course.slug ? `Degree program (${course.slug.toUpperCase()})` : "Comprehensive academic degree program.")}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors shrink-0" />
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Subjects Section */}
          {results.subjects.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-emerald-500" />
                <h2 className="text-xs font-black text-foreground uppercase tracking-wider">Subjects</h2>
                <Badge variant="secondary" className="text-[10px] font-bold bg-secondary border border-border">{results.subjects.length}</Badge>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {results.subjects.map((subject) => (
                  <Link
                    key={subject.id}
                    to="/student/subject/$id"
                    params={{ id: subject.id }}
                    className="group block"
                  >
                    <Card className="p-4 border border-border/85 rounded-xl hover:border-border hover:bg-secondary/40 hover:shadow-sm transition-all duration-200 bg-card flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
                        <Library className="h-4.5 w-4.5 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground group-hover:text-emerald-500 text-xs truncate transition-colors">{subject.name}</h3>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{subject.description || (subject.subject_code ? `Course subject (${subject.subject_code})` : "Syllabus, chapters, and past paper modules.")}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors shrink-0" />
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Units Section */}
          {results.units.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-500" />
                <h2 className="text-xs font-black text-foreground uppercase tracking-wider">Syllabus Units</h2>
                <Badge variant="secondary" className="text-[10px] font-bold bg-secondary border border-border">{results.units.length}</Badge>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {results.units.map((unit) => (
                  <Link
                    key={unit.id}
                    to="/student/unit/$id"
                    params={{ id: unit.id }}
                    className="group block"
                  >
                    <Card className="p-4 border border-border/85 rounded-xl hover:border-border hover:bg-secondary/40 hover:shadow-sm transition-all duration-200 bg-card flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center shrink-0">
                        <FileText className="h-4.5 w-4.5 text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground group-hover:text-emerald-500 text-xs truncate transition-colors">{unit.title}</h3>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">Unit {unit.unit_number} • {unit.description || "Syllabus lessons and learning objectives."}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors shrink-0" />
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}