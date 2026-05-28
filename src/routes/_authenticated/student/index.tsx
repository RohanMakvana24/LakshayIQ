import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Building2,
  GraduationCap,
  BookOpen,
  Search,
  ArrowUpDown,
  Layers3,
  Compass,
  ArrowUpRight,
  School,
  TrendingUp,
  Star,
  ChevronRight,
  LayoutGrid,
  List,
  ExternalLink,
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
  const [sortBy, setSortBy] = useState<"name" | "courses_desc" | "courses_asc">(
    "name"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const fetchUniversitiesData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("universities")
          .select(
            `
              id, 
              name, 
              slug,
              description,
              logo_url,
              banner_url,
              is_active,
              courses(id)
            `
          )
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

  // Track real user views/visits on the Student Dashboard (Login redirection & direct active sessions)
  useEffect(() => {
    const logDashboardHit = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from("page_views" as any).insert({
            user_id: session.user.id,
            page_path: "/student"
          });
        }
      } catch (err) {
        console.error("Failed to log student dashboard hit:", err);
      }
    };
    logDashboardHit();
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
      result.sort(
        (a, b) => (b.courses?.length || 0) - (a.courses?.length || 0)
      );
    } else if (sortBy === "courses_asc") {
      result.sort(
        (a, b) => (a.courses?.length || 0) - (b.courses?.length || 0)
      );
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [universities, searchQuery, sortBy]);

  const totalCoursesCount = useMemo(() => {
    return universities.reduce((acc, u) => acc + (u.courses?.length || 0), 0);
  }, [universities]);

  const topUniversities = useMemo(() => {
    return [...universities]
      .sort((a, b) => (b.courses?.length || 0) - (a.courses?.length || 0))
      .slice(0, 3);
  }, [universities]);

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="w-full px-4 py-4 md:px-6 lg:px-8">
        {/* Compact Hero Section */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden mb-6 shadow-lg">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-0 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl" />
          <div className="absolute bottom-0 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl" />

          <div className="relative z-10 px-5 py-5 md:px-7 md:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left Content */}
              <div className="flex-1 space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 rounded-full px-2.5 py-0.5 border border-emerald-500/30">
                  <Sparkles className="h-3 w-3 text-emerald-300" />
                  <span className="text-[10px] font-semibold tracking-wide text-emerald-200">
                    LAKSHAY IQ
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                  Select Your{" "}
                  <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                    Campus Universe
                  </span>
                </h1>

                <p className="text-slate-300 text-xs md:text-sm max-w-lg">
                  Your academic ecosystem simplified. Dive into organized study structures and course frameworks.
                </p>

                {/* Stats - Horizontal compact */}
                <div className="flex flex-wrap gap-3 pt-1">
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1">
                    <School className="h-3 w-3 text-emerald-300" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-white">{universities.length}</span>
                      <span className="text-[9px] text-slate-300">Campuses</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1">
                    <Layers3 className="h-3 w-3 text-teal-300" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-white">{totalCoursesCount}</span>
                      <span className="text-[9px] text-slate-300">Programs</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1">
                    <TrendingUp className="h-3 w-3 text-blue-300" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-[9px] text-slate-300">Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - Top Institutes - Compact */}
              <div className="lg:w-64 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-center gap-1.5 mb-2">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-wider">
                    Top Ranked
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {topUniversities.map((uni, idx) => (
                    <div
                      key={uni.id}
                      className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white/10 transition-all"
                    >
                      <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-[10px]">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">
                          {uni.name}
                        </p>
                        <p className="text-slate-400 text-[9px]">
                          {uni.courses?.length || 0} Programs
                        </p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Link
            to="/student/fullscreen-test"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
          >
            <ExternalLink className="h-4 w-4" /> Fullscreen Test Lab
          </Link>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col sm:flex-row items-center gap-3 mb-5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by institute name, keyword or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <ArrowUpDown className="h-3 w-3 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-medium text-slate-600 focus:outline-none"
              >
                <option value="name">A-Z</option>
                <option value="courses_desc">Most Programs</option>
                <option value="courses_asc">Least Programs</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-all ${viewMode === "grid"
                  ? "bg-white shadow-sm text-slate-800"
                  : "text-slate-400"
                  }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-all ${viewMode === "list"
                  ? "bg-white shadow-sm text-slate-800"
                  : "text-slate-400"
                  }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-slate-500">
            {loading
              ? "Loading..."
              : `Showing ${filteredAndSortedUniversities.length} of ${universities.length} campuses`}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "space-y-2"
            }
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 animate-pulse overflow-hidden"
              >
                <div className="h-24 bg-slate-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedUniversities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <div className="inline-flex p-2.5 bg-slate-100 rounded-full mb-2">
              <Compass className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-0.5">
              No campuses found
            </h3>
            <p className="text-xs text-slate-500">
              No matches for "<span className="font-medium">{searchQuery}</span>"
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedUniversities.map((u) => {
              const coursesCount = u.courses?.length || 0;
              return (
                <Link
                  key={u.id}
                  to="/student/university/$id"
                  params={{ id: u.id }}
                  className="group block"
                >
                  <Card className="h-full border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden hover:-translate-y-0.5">
                    {/* Banner */}
                    <div className="relative h-20 w-full overflow-hidden bg-slate-100">
                      {u.banner_url ? (
                        <img
                          src={u.banner_url}
                          alt={u.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-300" />
                      )}
                      {/* Logo */}
                      <div className="absolute -bottom-3 left-3">
                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center">
                          {u.logo_url ? (
                            <img
                              src={u.logo_url}
                              alt={u.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 pt-4">
                      <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors text-sm line-clamp-1">
                        {u.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-2">
                        {u.description ||
                          "Comprehensive syllabus matrix and exam material directory."}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md">
                          <BookOpen className="h-3 w-3 text-emerald-600" />
                          <span className="text-xs font-medium text-slate-700">
                            {coursesCount} Programs
                          </span>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedUniversities.map((u) => {
              const coursesCount = u.courses?.length || 0;
              return (
                <Link
                  key={u.id}
                  to="/student/university/$id"
                  params={{ id: u.id }}
                  className="group block"
                >
                  <div className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-all flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                      {u.logo_url ? (
                        <img
                          src={u.logo_url}
                          alt={u.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-800 group-hover:text-emerald-600 text-sm truncate">
                        {u.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {u.description || "Comprehensive syllabus and exam material"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-50 px-2 py-0.5 rounded text-slate-600">
                        {coursesCount}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}