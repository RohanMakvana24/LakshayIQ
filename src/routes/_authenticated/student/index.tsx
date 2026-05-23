import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowRight, Sparkles, Building2, GraduationCap, 
  BookOpen, Search, ArrowUpDown, Layers3, 
  Compass, ArrowUpRight, School
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/")({
  head: () => ({ meta: [{ title: "Dashboard — Lakshay IQ" }] }),
  component: StudentDashboard,
});

interface UniversityRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  courses: { id: string }[] | null;
}

function StudentDashboard() {
  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "courses_desc" | "courses_asc">("name");

  useEffect(() => {
    const fetchUniversitiesData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("universities")
          .select(`
            id, 
            name, 
            slug,
            description,
            logo_url,
            banner_url,
            is_active,
            courses(id)
          `)
          .eq("is_active", true) 
          .order("name", { ascending: true });

        if (error) throw error;
        setUniversities((data as any) || []);
      } catch (err) {
        console.error("Failed to compile student dashboard telemetry:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversitiesData();
  }, []);

  const filteredAndSortedUniversities = useMemo(() => {
    let result = [...universities];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) => 
          u.name.toLowerCase().includes(query) || 
          u.slug.toLowerCase().includes(query) ||
          (u.description && u.description.toLowerCase().includes(query))
      );
    }

    if (sortBy === "courses_desc") {
      result.sort((a, b) => (b.courses?.length || 0) - (a.courses?.length || 0));
    } else if (sortBy === "courses_asc") {
      result.sort((a, b) => (a.courses?.length || 0) - (b.courses?.length || 0));
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [universities, searchQuery, sortBy]);

  const totalCoursesCount = useMemo(() => {
    return universities.reduce((acc, u) => acc + (u.courses?.length || 0), 0);
  }, [universities]);

  return (
    <div className="space-y-8 p-1 max-w-8xl mx-auto antialiased animate-in fade-in duration-500">
      
      {/* 🌌 NEX-GEN IMMERSIVE HERO BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-neutral-900 to-zinc-950 p-8 md:p-12 text-white shadow-2xl overflow-hidden border border-white/5 group">
        {/* Glowing Decorative Orbs */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-all duration-700" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="absolute right-12 bottom-0 text-white/[0.02] pointer-events-none hidden lg:block translate-y-8 group-hover:translate-y-4 transition-transform duration-700">
          <GraduationCap className="h-80 w-80 stroke-[0.5]" />
        </div>
        
        <div className="relative z-10 space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] backdrop-blur-xl px-4 py-1.5 text-[11px] font-bold tracking-wider text-emerald-400 border border-white/10 shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" /> LAKSHAY IQ ACADEMY
          </div>
          
          <h1 className="font-display text-4xl font-black tracking-tight md:text-5xl lg:text-6xl leading-[1.05]">
            Select Your Campus <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-200 to-neutral-100">
              Unlock Structured Learning
            </span>
          </h1>
          
          <p className="max-w-xl text-sm text-slate-400 font-medium leading-relaxed">
            Your entire university ecosystem simplified. Dive straight into courses, branches, and meticulously organized study grids.
          </p>

          {/* 🚀 PREMIUM INTERACTIVE TEST LINK BUTTON */}
          <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <a 
              href="https://shrinkme.click/react-notes" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs px-5 py-3 shadow-[0_10px_20px_rgba(16,185,129,0.15)] active:scale-95 transition-all duration-200 border border-emerald-400/20 group hover:shadow-[0_15px_25px_rgba(16,185,129,0.25)]"
            >
              <Compass className="h-4 w-4 text-emerald-100 group-hover:rotate-45 transition-transform duration-300" />
              <span>Test React Notes</span>
              <span className="h-1.5 w-1.5 bg-emerald-300 rounded-full animate-ping" />
            </a>
          </div>

          {/* Quick Stats Integrated directly into Hero for premium micro bento vibe */}
          <div className="pt-4 flex items-center gap-6 border-t border-white/5 max-w-md">
            <div className="flex items-center gap-2.5">
              <School className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">
                <strong className="text-sm font-bold text-white">{universities.length}</strong> Campuses
              </span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2.5">
              <Layers3 className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-semibold text-slate-300">
                <strong className="text-sm font-bold text-white">{totalCoursesCount}</strong> Total Courses
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🏛️ CONTROL LABELS & FILTERS */}
      <section className="space-y-6">
        
        {/* FLOATING ACTION CONTROL BAR */}
        <div className="bg-white/70 backdrop-blur-md border border-slate-200/50 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="relative w-full sm:max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
            <Input 
              type="text" 
              placeholder="Search by institute name, keyword or code..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 border-slate-200 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl bg-slate-50/50 text-sm font-medium transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
              <ArrowUpDown className="h-3.5 w-3.5" /> Sort Framework
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 px-3.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer shadow-sm min-w-[180px]"
            >
              <option value="name">Alphabetical (A-Z)</option>
              <option value="courses_desc">Programs: High to Low</option>
              <option value="courses_asc">Programs: Low to High</option>
            </select>
          </div>
        </div>

        {/* Dynamic Secondary Label Bar */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">Available Registries</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {loading ? "Hydrating indexes..." : `Displaying ${filteredAndSortedUniversities.length} campuses`}
            </p>
          </div>
        </div>

        {/* 🌀 LOADING SHIMMER GLOW SKELETON */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border border-slate-100 rounded-2xl h-[270px] bg-white animate-pulse overflow-hidden flex flex-col justify-between">
                <div className="h-28 w-full bg-slate-100/80" />
                <div className="p-5 flex-1 space-y-4">
                  <div className="h-5 bg-slate-100 rounded-lg w-1/2" />
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100/70 rounded-md w-full" />
                    <div className="h-3 bg-slate-100/70 rounded-md w-4/5" />
                  </div>
                </div>
                <div className="h-14 border-t border-slate-50 p-4" />
              </div>
            ))}
          </div>
        ) : (
          /* ⚡ DYNAMIC INTUITIVE CAMPUS CARDS MATRIX */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedUniversities.map((u) => {
              const coursesCount = Array.isArray(u.courses) ? u.courses.length : 0;

              return (
                <Link key={u.id} to="/student/university/$id" params={{ id: u.id }} className="block h-full group">
                  <Card className="h-full border border-slate-200/60 bg-white rounded-2xl shadow-[0_4px_30px_-6px_rgba(0,0,0,0.02)] transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-slate-900 group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] flex flex-col justify-between overflow-hidden relative">
                    
                    {/* Top Canvas Cover */}
                    <div className="h-28 w-full bg-slate-50 relative overflow-hidden border-b border-slate-100">
                      {u.banner_url ? (
                        <img 
                          src={u.banner_url} 
                          alt={u.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-slate-100 via-neutral-50 to-emerald-50/20" />
                      )}
                      
                      {/* Floating Slug Stamp */}
                      <div className="absolute top-4 right-4 z-10">
                        <span className="text-[10px] font-bold tracking-wider font-mono uppercase bg-white/80 text-slate-800 border border-slate-200/50 backdrop-blur-md px-2.5 py-0.5 rounded-lg shadow-sm">
                          {u.slug}
                        </span>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 flex-1 flex flex-col justify-between relative">
                      
                      {/* Floating Logo Badge (Overlapping Layout) */}
                      <div className="absolute -top-11 left-6 h-[68px] w-[68px] rounded-2xl bg-white border border-slate-100 shadow-md overflow-hidden grid place-items-center group-hover:scale-105 transition-transform duration-300 z-10">
                        {u.logo_url ? (
                          <img 
                            src={u.logo_url} 
                            alt={`${u.name} branding`} 
                            className="h-full w-full object-cover p-0.5"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-950 flex items-center justify-center text-white">
                            <Building2 className="h-5 w-5 text-emerald-400" />
                          </div>
                        )}
                      </div>

                      {/* Header Stack */}
                      <div className="mt-8 space-y-2 flex-1">
                        <h3 className="font-display text-base font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                          {u.name}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 font-medium leading-relaxed">
                          {u.description || "Comprehensive syllabus matrix and exam material directory for this campus grid."}
                        </p>
                      </div>

                      {/* Bottom Deck Footer */}
                      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                          <BookOpen className="h-3.5 w-3.5 text-emerald-500" /> 
                          <span>{coursesCount} Programs</span>
                        </div>
                        
                        <div className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300 shadow-sm">
                          <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                        </div>
                      </div>

                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* 🔍 NO DATA VACANT BLOCK */}
        {!loading && filteredAndSortedUniversities.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-white max-w-md mx-auto p-6 space-y-4 shadow-sm animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 rounded-2xl inline-flex text-slate-400 border border-slate-100">
              <Compass className="h-6 w-6 animate-spin duration-1000" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No campuses matched</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We couldn't locate any records matching "<span className="text-slate-700 font-semibold">{searchQuery}</span>". Please double-check your spelling or filters.
              </p>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}