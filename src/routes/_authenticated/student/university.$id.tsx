import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import {
  BookOpen,
  ArrowRight,
  Clock,
  Building2,
  Sparkles,
  Search,
  SlidersHorizontal,
  Layers,
  School,
  Library,
  GraduationCap,
  SwatchBook,
  Heart
} from "lucide-react";
import { PageLoader } from "@/components/page-loader";
import { useState, useMemo, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/student/university/$id")({
  loader: async ({ params }) => {
    const { data: university, error: univError } = await supabase
      .from("universities")
      .select("id, name, slug, description, logo_url, banner_url, is_active")
      .eq("id", params.id)
      .single();

    if (univError || !university) {
      throw notFound();
    }

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

const cardGradients = [
  "from-amber-400 to-amber-500",    // JS yellow style
  "from-cyan-400 to-sky-500",        // React cyan style
  "from-purple-500 to-indigo-600",   // Bootstrap purple style
  "from-emerald-500 to-green-600",   // Node green style
  "from-teal-400 to-emerald-500",     // Vue teal style
  "from-blue-600 to-indigo-700",     // CSS3 blue style
  "from-red-500 to-rose-600",        // Angular red style
  "from-pink-500 to-fuchsia-600",     // GraphQL pink style
];

function UniversityPage() {
  const { university, courses } = Route.useLoaderData();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "sem-desc" | "sem-asc">("name-asc");
  const [wishlisted, setWishlisted] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "ug" | "pg" | "wishlisted">("all");

  useEffect(() => {
    const saved = localStorage.getItem("wishlist_courses");
    if (saved) {
      try { setWishlisted(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = wishlisted.includes(id)
      ? wishlisted.filter(x => x !== id)
      : [...wishlisted, id];
    setWishlisted(next);
    localStorage.setItem("wishlist_courses", JSON.stringify(next));
  };

  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query))
      );
    }

    // Tab filtering
    if (activeTab === "ug") {
      result = result.filter(c => {
        const duration = c.duration?.toLowerCase() || "";
        return duration.includes("3") || duration.includes("4") || duration.includes("bachelor") || duration.includes("ug");
      });
    } else if (activeTab === "pg") {
      result = result.filter(c => {
        const duration = c.duration?.toLowerCase() || "";
        return duration.includes("2") || duration.includes("1") || duration.includes("master") || duration.includes("pg");
      });
    } else if (activeTab === "wishlisted") {
      result = result.filter(c => wishlisted.includes(c.id));
    }

    if (sortBy === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "sem-desc") {
      result.sort((a, b) => (b.total_semesters || 0) - (a.total_semesters || 0));
    } else if (sortBy === "sem-asc") {
      result.sort((a, b) => (a.total_semesters || 0) - (b.total_semesters || 0));
    }

    return result;
  }, [courses, searchQuery, sortBy, activeTab, wishlisted]);

  const totalSemesters = useMemo(() => {
    return courses.reduce((acc: number, c: any) => acc + (c.total_semesters || 0), 0);
  }, [courses]);

  return (
    <div className="w-full py-2">

        {/* Breadcrumb */}
        <div className="mb-4">
          <BreadcrumbNav
            items={[
              { label: "Dashboard", to: "/student" },
              { label: university.name }
            ]}
          />
        </div>

        {/* Hero Section */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/[0.02] via-card to-emerald-500/[0.01] border border-border/80 overflow-hidden mb-6 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.03)] dark:shadow-none">
          {/* Decorative background grid */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-card border border-border shadow-md p-1.5 flex items-center justify-center shrink-0">
                {university.logo_url ? (
                  <img src={university.logo_url} alt={university.name} className="h-full w-full object-contain rounded-xl" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-full px-2.5 py-0.5">
                  <Sparkles className="h-3 w-3" />
                  <span className="text-[10px] font-bold tracking-wide uppercase">REGISTERED UNIVERSITY</span>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-foreground">
                  {university.name}
                </h1>
                <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
                  {university.description || "Comprehensive educational programs and study resources are calibrated for this campus."}
                </p>
              </div>

              <div className="flex gap-4 shrink-0">
                <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl px-4 py-2.5 text-center shadow-[0_8px_30px_rgba(0,0,0,0.01)] min-w-[80px]">
                  <School className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-black text-foreground leading-none">{courses.length}</p>
                  <p className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase mt-1">Courses</p>
                </div>
                <div className="bg-violet-500/[0.03] dark:bg-violet-500/[0.02] border border-violet-500/10 rounded-2xl px-4 py-2.5 text-center shadow-[0_8px_30px_rgba(0,0,0,0.01)] min-w-[80px]">
                  <Layers className="h-4 w-4 text-violet-500 mx-auto mb-1" />
                  <p className="text-lg font-black text-foreground leading-none">{totalSemesters}</p>
                  <p className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase mt-1">Semesters</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar - Premium Frameless Unique Design */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-2 pb-1 border-b border-border/40">
          {/* Left: Sleek search box with active bottom border accent */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent pl-7 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/75 focus:outline-none border-b-2 border-border/60 focus:border-emerald-500 transition-colors duration-300 font-medium"
            />
          </div>

          {/* Right: Quick Sort Pill Selector */}
          <div className="flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none py-1 w-full md:w-auto">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mr-1 hidden xs:inline-block">Sort by:</span>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {(
                [
                  { id: "name-asc", label: "A-Z" },
                  { id: "sem-desc", label: "Semesters (High-Low)" },
                  { id: "sem-asc", label: "Semesters (Low-High)" }
                ] as const
              ).map((opt) => {
                const isSel = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSortBy(opt.id)}
                    className={`flex-1 sm:flex-none text-center px-1 pb-1 pt-1 text-[10px] font-extrabold uppercase tracking-wide transition-all duration-200 cursor-pointer border-b-2 ${
                      isSel
                        ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Shaded Tab Bar (like reference image) */}
        <div className="flex flex-nowrap border-b border-border/80 w-full mb-4 overflow-x-auto scrollbar-none bg-muted/30 dark:bg-card/30 p-1 gap-1">
          {(["all", "ug", "pg", "wishlisted"] as const).map((tab) => {
            const label = tab === "all" ? "All Programs" : tab === "ug" ? "Undergraduate" : tab === "pg" ? "Postgraduate" : "Wishlisted";
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 py-1.5 px-2.5 sm:py-2 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm rounded-none"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted rounded-none"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs font-medium text-muted-foreground">
            Showing <span className="text-foreground font-semibold">{filteredAndSortedCourses.length}</span> of <span className="text-foreground font-semibold">{courses.length}</span> programs
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Courses Grid */}
        {filteredAndSortedCourses.length === 0 ? (
          <div className="text-center py-12 bg-card/70 backdrop-blur-md rounded-2xl border border-border shadow-sm">
            <div className="inline-flex p-2.5 bg-muted rounded-full mb-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-0.5">No courses match your criteria</h3>
            <p className="text-xs text-muted-foreground">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredAndSortedCourses.map((course, index) => {
              const gradient = cardGradients[index % cardGradients.length];
              return (
                <Link
                  key={course.id}
                  to="/student/course/$id"
                  params={{ id: course.id }}
                  className="group block h-full"
                >
                  <Card className="h-full bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1.5 flex flex-col relative p-0">
                    {/* Header colored band like the second image */}
                    <div className={`relative h-28 w-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-3 text-white shrink-0 overflow-hidden`}>
                      {/* Unique Design Details in Banner */}
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:10px_10px] pointer-events-none" />
                      <div className="absolute -right-5 -top-5 w-16 h-16 rounded-full bg-white/15 blur-md pointer-events-none" />
                      <div className="absolute -left-5 -bottom-5 w-12 h-12 rounded-full bg-white/10 blur-sm pointer-events-none" />

                      <div className="h-12 w-12 rounded-lg bg-white/95 backdrop-blur-sm shadow-md border border-white flex items-center justify-center p-1.5 mb-1 transition-transform duration-300 group-hover:scale-110 z-10">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.name} className="h-full w-full object-cover rounded-md" />
                        ) : (
                          <SwatchBook className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      <span className="text-[10px] font-black tracking-wider uppercase text-white drop-shadow-sm truncate max-w-full px-2 z-10">
                        {course.slug || "Degree"}
                      </span>
                    </div>

                    {/* Card Body content */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        {/* Badge & Heart Wishlist Row */}
                        <div className="flex items-center justify-between mb-1">
                          <span className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {course.duration || "3 Years"}
                          </span>
                          <button 
                            onClick={(e) => toggleWishlist(course.id, e)}
                            className="p-1 hover:bg-secondary rounded-full transition-colors"
                          >
                            <Heart className={`h-4.5 w-4.5 transition-all ${wishlisted.includes(course.id) ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground hover:text-red-500"}`} />
                          </button>
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-extrabold text-foreground group-hover:text-emerald-500 transition-colors text-[15px] line-clamp-1 leading-snug mb-1">
                          {course.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mb-2">
                          By: {university.name}
                        </p>

                        {/* Stars & Rating */}
                        <div className="flex items-center gap-1">
                          <div className="flex items-center text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-[11px] font-bold text-amber-500">5.0</span>
                          <span className="text-[11px] text-muted-foreground">({course.total_semesters || 6} Semesters)</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-border/60 mt-1">
                        <span className="text-xs font-black text-foreground">Free Access</span>
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 transition-colors">
                          <span>View</span>
                          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
    </div>
  );
}