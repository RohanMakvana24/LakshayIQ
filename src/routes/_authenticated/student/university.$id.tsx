import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { BookOpen, ArrowRight, Clock, Building2, Sparkles, Search, SlidersHorizontal } from "lucide-react";
import { PageLoader } from "@/components/page-loader";
import { useState, useMemo } from "react";

// 🏛️ TanStack Router Loader Engine
export const Route = createFileRoute("/_authenticated/student/university/$id")({
  loader: async ({ params }) => {
    // 1. યુનિવર્સિટીની બેઝિક વિગતો મેળવો
    const { data: university, error: univError } = await supabase
      .from("universities")
      .select("id, name, slug, description, logo_url, banner_url, is_active")
      .eq("id", params.id)
      .single();

    if (univError || !university) {
      throw notFound();
    }

    // 2. આ યુનિવર્સિટી સાથે કનેક્ટેડ તમામ કોર્સ લોડ કરો
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id, name, slug, duration, total_semesters, thumbnail_url, description")
      .eq("university_id", params.id)
      .order("name", { ascending: true });

    return { 
      university, 
      courses: courses || [] 
    };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.university?.name || "University"} — Lakshay IQ` }],
  }),
  pendingMs: 0,
  pendingComponent: () => <PageLoader label="Loading University" />,
  component: UniversityPage,
});

function UniversityPage() {
  // Loader માંથી ડેટા લોડ કરો
  const { university, courses } = Route.useLoaderData();

  // Search અને Sort ની સ્ટેટ્સ
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "sem-desc" | "sem-asc">("name-asc");

  // ⚡ Client-side Search & Sort Engine: પરફોર્મન્સ ઓપ્ટિમાઇઝેશન માટે useMemo નો ઉપયોગ
  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];

    // 1. સર્ચ ફિલ્ટર એપ્લાય કરો (નામ અથવા ડિસ્ક્રિપ્શન બંનેમાં સર્ચ કરશે)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query))
      );
    }

    // 2. સોર્ટિંગ ઓર્ડર એપ્લાય કરો
    if (sortBy === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "sem-desc") {
      result.sort((a, b) => (b.total_semesters || 0) - (a.total_semesters || 0));
    } else if (sortBy === "sem-asc") {
      result.sort((a, b) => (a.total_semesters || 0) - (b.total_semesters || 0));
    }

    return result;
  }, [courses, searchQuery, sortBy]);

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="w-full px-4 py-6 md:px-6 lg:px-8">
        <div className="space-y-8 antialiased animate-fade-in max-w-7xl mx-auto">

          {/* 🗺️ PRECISE BREADCRUMB NAVIGATION */}
          <BreadcrumbNav 
            items={[
              { label: "Dashboard", to: "/student" }, 
              { label: university.name }
            ]} 
          />

          {/* 🌌 CINEMATIC HERO BANNER HEADER FRAME */}
          <header className="relative rounded-[1rem] border border-slate-200/70 bg-slate-950 shadow-lg overflow-hidden group">
            <div className="absolute inset-0 z-0 opacity-40">
              {university.banner_url ? (
                <img 
                  src={university.banner_url} 
                  alt={university.name} 
                  className="w-full h-full object-cover filter brightness-75 contrast-125"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-slate-950 to-slate-900" />
              )}
            </div>

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 text-white">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white text-neutral-950 border-2 border-white/20 shadow-xl overflow-hidden font-mono font-bold text-xl">
            {university.logo_url ? (
              <img src={university.logo_url} alt={university.name} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-7 w-7 text-neutral-900" />
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-wider text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
              <Sparkles className="h-3 w-3" /> REGISTERED UNIVERSITY
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight max-w-4xl leading-tight">
              {university.name}
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 font-medium line-clamp-2 max-w-3xl leading-relaxed">
              {university.description || "Comprehensive educational programs and study resources are calibrated for this structural campus grid mapping."}
            </p>
          </div>
          
          <div className="shrink-0 font-mono text-xs font-bold uppercase tracking-wider bg-black/30 border border-white/5 px-3 py-1.5 rounded-xl backdrop-blur-md text-neutral-300">
            {courses.length} Active Courses
          </div>
        </div>
      </header>

      {/* 📚 COURSES CONTENT GRID WITH SEARCH & FILTER */}
      <section className="space-y-5">
        <div className="border-b border-neutral-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900">Available Degrees & Programs</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Select a course pipeline framework to extract semester components</p>
          </div>

          {/* 🔍 SEARCH AND SORT CONTROLS PANEL */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3 h-9 text-sm text-neutral-700 hover:border-neutral-300 transition-colors">
              <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent pr-2 font-medium text-neutral-900 outline-none cursor-pointer text-xs"
              >
                <option value="name-asc">Alphabetical (A-Z)</option>
                <option value="sem-desc">Semesters: High to Low</option>
                <option value="sem-asc">Semesters: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* 📭 Empty State કે ફિલ્ટર નો મેચ થાય ત્યારનું સ્ટેટ */}
        {filteredAndSortedCourses.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50 animate-fade-in">
            <BookOpen className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-neutral-500">No courses match your criteria</h3>
            <p className="text-xs text-neutral-400 mt-1">Try adjusting your search terms or filters to locate curriculum templates.</p>
          </div>
        ) : (
          /* Primary Responsive Structural Card Mapping */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-300">
            {filteredAndSortedCourses.map((c: any) => (
              <Link key={c.id} to="/student/course/$id" params={{ id: c.id }} className="block group h-full animate-fade-in">
                <Card className="h-full border border-neutral-200/80 bg-white p-5 rounded-2xl shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)] transition-all duration-300 hover:-translate-y-1 hover:border-neutral-900 hover:shadow-[0_12px_25px_-6px_rgba(0,0,0,0.05)] flex flex-col justify-between overflow-hidden relative">
                  
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-900 text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                        <BookOpen className="h-4 w-4 stroke-[2.2]" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-50 text-neutral-500 rounded-md border-neutral-200">
                        {c.slug || "DEGREE"}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <h3 className="font-display text-base font-bold text-neutral-900 group-hover:text-neutral-950 transition-colors line-clamp-1">
                        {c.name}
                      </h3>
                      <p className="text-xs text-neutral-400 font-medium line-clamp-2 leading-relaxed">
                        {c.description || "Access textbook materials, repeated structural questions, and standard analytical review papers inside."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex item-center justify-between border-t border-neutral-100 pt-3.5 text-xs font-medium">
                    <p className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 font-mono">
                      <Clock className="h-3.5 w-3.5 text-neutral-400 stroke-[2]" /> 
                      <span>{c.duration || "3 Years"}</span> 
                      <span className="text-neutral-300">•</span>
                      <span>{c.total_semesters} Semesters</span>
                    </p>
                    
                    <div className="h-7 w-7 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300 shadow-sm">
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 stroke-[2.5]" />
                    </div>
                  </div>

                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

        </div>
      </div>
    </div>
  );
}