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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full px-4 py-4 md:px-6 lg:px-8">

        {/* Hero Section - Compact & Modern */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden mb-6 shadow-lg">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-0 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl" />
          <div className="absolute bottom-0 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl" />
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%)] bg-[length:16px_16px]" />

          <div className="relative z-10 px-5 py-5 md:px-7 md:py-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 rounded-full px-2.5 py-0.5 border border-emerald-500/30">
                <Sparkles className="h-3 w-3 text-emerald-300" />
                <span className="text-[10px] font-semibold tracking-wide text-emerald-200 uppercase">
                  Global Search
                </span>
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                Curriculum Discovery Engine
              </h1>
              <p className="text-slate-300 text-xs md:text-sm max-w-xl">
                Find universities, program degrees, subject frameworks, or individual unit lessons across Lakshay IQ.
              </p>
            </div>
          </div>
        </div>

        {/* Search Input Card */}
        <Card className="p-4 border border-slate-200 bg-white shadow-sm rounded-xl mb-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by university name, subject code, unit title..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-10 bg-slate-50 border-slate-200 focus:ring-1 focus:ring-emerald-500 rounded-lg text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-all shrink-0"
            >
              Search
            </button>
          </form>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            <p className="mt-3 text-sm text-slate-500">Scanning academic data matrices...</p>
          </div>
        )}

        {/* Initial Empty State */}
        {!loading && empty && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <div className="inline-flex p-3 bg-slate-100 rounded-full mb-3">
              <SearchIcon className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">Start Your Exploration</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Enter a key term in the bar above. Search by university name, program code, subject code, or unit titles.
            </p>
          </div>
        )}

        {/* No Results State */}
        {!loading && !empty && !hasResults && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <div className="inline-flex p-3 bg-slate-100 rounded-full mb-3">
              <Frown className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">No matching assets found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              We couldn't locate any academic indexes matching "{q}". Check your spelling or try broader terms.
            </p>
          </div>
        )}

        {/* Search Results */}
        {!loading && !empty && hasResults && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-600">
                  Found <span className="font-bold text-slate-800">{totalResults}</span> results for "<span className="font-medium text-emerald-600">{q}</span>"
                </p>
              </div>
            </div>

            {/* Universities Section */}
            {results.universities.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Campuses</h2>
                  <Badge variant="secondary" className="text-[10px] bg-slate-100">{results.universities.length}</Badge>
                </div>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  {results.universities.map((uni) => (
                    <Link
                      key={uni.id}
                      to="/student/university/$id"
                      params={{ id: uni.id }}
                      className="group block"
                    >
                      <Card className="p-3 border border-slate-200 rounded-xl hover:shadow-md transition-all hover:-translate-y-0.5 bg-white flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                          {uni.logo_url ? (
                            <img src={uni.logo_url} alt={uni.name} className="h-full w-full object-cover" />
                          ) : (
                            <School className="h-5 w-5 text-slate-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 text-sm truncate">{uni.name}</h3>
                          <p className="text-xs text-slate-500 line-clamp-1">{uni.description || "Active registered campus"}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
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
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Degree Programs</h2>
                  <Badge variant="secondary" className="text-[10px] bg-slate-100">{results.courses.length}</Badge>
                </div>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  {results.courses.map((course) => (
                    <Link
                      key={course.id}
                      to="/student/course/$id"
                      params={{ id: course.id }}
                      className="group block"
                    >
                      <Card className="p-3 border border-slate-200 rounded-xl hover:shadow-md transition-all hover:-translate-y-0.5 bg-white flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 text-sm truncate">{course.name}</h3>
                          <p className="text-xs text-slate-500 line-clamp-1">{course.slug || "Degree Program"}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
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
                  <BookMarked className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Subjects</h2>
                  <Badge variant="secondary" className="text-[10px] bg-slate-100">{results.subjects.length}</Badge>
                </div>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  {results.subjects.map((subject) => (
                    <Link
                      key={subject.id}
                      to="/student/subject/$id"
                      params={{ id: subject.id }}
                      className="group block"
                    >
                      <Card className="p-3 border border-slate-200 rounded-xl hover:shadow-md transition-all hover:-translate-y-0.5 bg-white flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                          <Library className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 text-sm truncate">{subject.name}</h3>
                          <p className="text-xs text-slate-500">{subject.subject_code || "Subject"}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
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
                  <Layers className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Syllabus Units</h2>
                  <Badge variant="secondary" className="text-[10px] bg-slate-100">{results.units.length}</Badge>
                </div>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  {results.units.map((unit) => (
                    <Link
                      key={unit.id}
                      to="/student/unit/$id"
                      params={{ id: unit.id }}
                      className="group block"
                    >
                      <Card className="p-3 border border-slate-200 rounded-xl hover:shadow-md transition-all hover:-translate-y-0.5 bg-white flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 text-sm truncate">{unit.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-1">Unit {unit.unit_number} • {unit.description || "Click to view"}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}