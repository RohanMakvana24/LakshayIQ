import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sparkles, Building2, BookOpen, Search, ArrowUpDown, Compass, School,
  FileText, CalendarCheck, MessageSquare, Bookmark, FolderGit2, ArrowRight,
  ArrowLeft, GraduationCap, TrendingUp, Clock, Calendar, Zap, Award, Heart,
  ArrowUpRight
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/")({
  head: () => ({ meta: [{ title: "Scholar Hub — Lakshay IQ" }] }),
  component: StudentDashboard,
});

interface CourseShort { id: string; name: string; slug: string; duration: string | null; total_semesters: number | null; thumbnail_url: string | null; description: string | null; }
interface UniversityRow { id: string; name: string; slug: string; description: string | null; logo_url: string | null; banner_url: string | null; is_active: boolean; courses: CourseShort[] | null; }



/* ── Tool card data ──────────────────────────────────────────────────── */
const tools = [
  {
    title: "University Hub",
    desc: "Browse campuses, programs & past papers",
    icon: Building2,
    gradient: "from-emerald-500 to-teal-400",
    glow: "shadow-emerald-500/10",
    cardBg: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]",
    cardBorder: "border-emerald-500/10 dark:border-emerald-500/5 hover:border-emerald-500/30",
    textTheme: "text-emerald-600 dark:text-emerald-400",
    isAction: true
  },
  {
    title: "Study Planner",
    desc: "Track deadlines & revision calendars",
    icon: CalendarCheck,
    href: "/student/planner",
    gradient: "from-violet-500 to-purple-400",
    glow: "shadow-violet-500/10",
    cardBg: "bg-violet-500/[0.03] dark:bg-violet-500/[0.02]",
    cardBorder: "border-violet-500/10 dark:border-violet-500/5 hover:border-violet-500/30",
    textTheme: "text-violet-600 dark:text-violet-400"
  },
  {
    title: "Resume Studio",
    desc: "Build ATS-friendly professional resumes",
    icon: FileText,
    href: "/student/resume",
    gradient: "from-sky-500 to-cyan-400",
    glow: "shadow-sky-500/10",
    cardBg: "bg-sky-500/[0.03] dark:bg-sky-500/[0.02]",
    cardBorder: "border-sky-500/10 dark:border-sky-500/5 hover:border-sky-500/30",
    textTheme: "text-sky-600 dark:text-sky-400"
  },
  {
    title: "Project Helper",
    desc: "Code ideas, flowcharts & reports",
    icon: FolderGit2,
    href: "/student/projects",
    gradient: "from-amber-500 to-orange-400",
    glow: "shadow-amber-500/10",
    cardBg: "bg-amber-500/[0.03] dark:bg-amber-500/[0.02]",
    cardBorder: "border-amber-500/10 dark:border-amber-500/5 hover:border-amber-500/30",
    textTheme: "text-amber-600 dark:text-amber-400"
  },
  {
    title: "WhatsApp Support",
    desc: "Direct help & academic support",
    icon: MessageSquare,
    href: "https://wa.me/917043853092",
    gradient: "from-green-500 to-emerald-400",
    glow: "shadow-green-500/10",
    cardBg: "bg-green-500/[0.03] dark:bg-green-500/[0.02]",
    cardBorder: "border-green-500/10 dark:border-green-500/5 hover:border-green-500/30",
    textTheme: "text-green-600 dark:text-green-400",
    isExternal: true
  },
  {
    title: "Bookmarks",
    desc: "Saved references & question banks",
    icon: Bookmark,
    href: "/student/bookmarks",
    gradient: "from-rose-500 to-red-400",
    glow: "shadow-rose-500/10",
    cardBg: "bg-rose-500/[0.03] dark:bg-rose-500/[0.02]",
    cardBorder: "border-rose-500/10 dark:border-rose-500/5 hover:border-rose-500/30",
    textTheme: "text-rose-600 dark:text-rose-400"
  },
] as const;

export const cardGradients = [
  "from-amber-400 to-amber-500",    // JS yellow style
  "from-cyan-400 to-sky-500",        // React cyan style
  "from-purple-500 to-indigo-600",   // Bootstrap purple style
  "from-emerald-500 to-green-600",   // Node green style
  "from-teal-400 to-emerald-500",     // Vue teal style
  "from-blue-600 to-indigo-700",     // CSS3 blue style
  "from-red-500 to-rose-600",        // Angular red style
  "from-pink-500 to-fuchsia-600",     // GraphQL pink style
];

/* ════════════════════════════════════════════════════════════════════════ */
function StudentDashboard() {
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState<"dashboard" | "university">("dashboard");
  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "courses_desc" | "courses_asc">("name");
  const [greeting, setGreeting] = useState("Welcome");
  const [hoveredTool, setHoveredTool] = useState<number | null>(null);
  const [bookmarkedUnis, setBookmarkedUnis] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "popular" | "specialized" | "bookmarked">("all");

  useEffect(() => {
    const saved = localStorage.getItem("bookmarked_universities");
    if (saved) {
      try { setBookmarkedUnis(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = bookmarkedUnis.includes(id)
      ? bookmarkedUnis.filter(x => x !== id)
      : [...bookmarkedUnis, id];
    setBookmarkedUnis(next);
    localStorage.setItem("bookmarked_universities", JSON.stringify(next));
  };

  useEffect(() => { const h = new Date().getHours(); setGreeting(h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening"); }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from("universities")
          .select(`id, name, slug, description, logo_url, banner_url, is_active, courses(id, name, slug, duration, total_semesters, thumbnail_url, description)`)
          .eq("is_active", true).order("name", { ascending: true });
        if (error) throw error;
        setUniversities((data as any) || []);
      } catch (err) { console.error("Failed to fetch universities:", err); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) await supabase.from("page_views" as any).insert({ user_id: session.user.id, page_path: "/student" });
      } catch (err) { console.error("Page view log failed:", err); }
    })();
  }, []);

  const filtered = useMemo(() => {
    let r = [...universities];
    if (searchQuery.trim()) { 
      const q = searchQuery.toLowerCase(); 
      r = r.filter(u => u.name.toLowerCase().includes(q) || u.slug.toLowerCase().includes(q) || u.description?.toLowerCase().includes(q)); 
    }
    
    // Tab filters
    if (activeTab === "popular") {
      r = r.filter(u => (u.courses?.length || 0) > 1);
    } else if (activeTab === "specialized") {
      r = r.filter(u => (u.courses?.length || 0) === 1);
    } else if (activeTab === "bookmarked") {
      r = r.filter(u => bookmarkedUnis.includes(u.id));
    }

    if (sortBy === "courses_desc") r.sort((a, b) => (b.courses?.length || 0) - (a.courses?.length || 0));
    else if (sortBy === "courses_asc") r.sort((a, b) => (a.courses?.length || 0) - (b.courses?.length || 0));
    else r.sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [universities, searchQuery, sortBy, activeTab, bookmarkedUnis]);

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const pop = { hidden: { opacity: 0, y: 24, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 120, damping: 16 } } };

  return (
    <div className="w-full py-2">
        <AnimatePresence mode="wait">
          {activeView === "dashboard" ? (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">

              {/* ════ HERO SECTION ════════════════════════════════════════ */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="relative bg-gradient-to-br from-primary/[0.04] via-card to-emerald-500/[0.03] dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950/70 text-foreground rounded-3xl border border-border/80 dark:border-zinc-800/80 overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-8 shadow-[0_12px_45px_-12px_rgba(16,185,129,0.05)] dark:shadow-none"
              >
                {/* Decorative background grid and neon glow blobs */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />
                <div className="absolute -left-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />

                {/* Left Student Illustration with floating animation & premium glowing drop-shadow (Desktop only) */}
                {!isMobile && (
                  <div className="hidden md:block w-1/4 max-w-[180px] lg:max-w-[220px] select-none shrink-0 self-end relative">
                    {/* Floating pill badge on top of illustration */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
                      transition={{ delay: 0.8, y: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
                      className="absolute -top-6 -left-6 backdrop-blur-md bg-card/75 border border-border/80 shadow-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-black text-foreground z-20 whitespace-nowrap select-none"
                    >
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>📚 1,200+ Syllabus Units</span>
                    </motion.div>

                    <motion.img
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
                      transition={{
                        x: { delay: 0.2, type: "spring", stiffness: 100 },
                        y: { repeat: Infinity, duration: 6, ease: "easeInOut" }
                      }}
                      src="/category-1 (2).svg"
                      alt="Student illustrating"
                      className="w-full h-auto object-contain filter drop-shadow-[0_8px_30px_rgba(16,185,129,0.12)] dark:drop-shadow-[0_8px_30px_rgba(16,185,129,0.2)]"
                    />
                  </div>
                )}

                {/* Center Content */}
                <div className="flex-1 w-full max-w-2xl mx-auto text-center space-y-5 md:space-y-6 relative z-10 px-1 py-4">
                  
                  {/* Floating badge inside the content flow */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm text-[10px] font-extrabold tracking-wider text-primary uppercase select-none mb-1">
                    <Sparkles className="h-3 w-3 text-emerald-500 animate-pulse" />
                    <span>Smart Scholar Workspace</span>
                  </div>

                  <div className="relative inline-block space-y-3">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-none">
                      What do you want to{" "}
                      <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-primary bg-clip-text text-transparent drop-shadow-sm">
                        learn today?
                      </span>
                    </h1>
                    <p className="text-muted-foreground text-xs md:text-sm font-medium max-w-lg mx-auto leading-relaxed">
                      Access a curated repository of past papers, customizable revision calendars, and ATS resume builders powered by AI.
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setActiveView("university");
                    }}
                    className="max-w-xl mx-auto pt-2"
                  >
                    <div className="relative flex items-center bg-card/60 dark:bg-zinc-950/40 backdrop-blur-xl border border-border/85 rounded-full p-2 hover:border-primary/50 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300 shadow-md">
                      <Search className="absolute left-5 h-4.5 w-4.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search course, university, or subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent pl-12 pr-32 py-3.5 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground font-semibold"
                      />
                      <button
                        type="submit"
                        className="absolute right-2 px-6 py-3 bg-gradient-to-r from-primary to-emerald-500 hover:opacity-95 text-white text-xs font-black rounded-full transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <span>Search</span>
                      </button>
                    </div>
                  </form>

                  {/* Centered student illustrations side-by-side with animated connector (mobile-only) */}
                  {isMobile && (
                    <div className="flex md:hidden items-center justify-center gap-24 pt-6 relative select-none">
                      {/* Left illustration */}
                      <img
                        src="/category-1 (2).svg"
                        alt="Student illustrating"
                        className="w-[90px] h-auto object-contain z-10 filter drop-shadow-[0_8px_24px_rgba(16,185,129,0.08)]"
                      />

                      {/* Animated Connection Arc and Zap Badge */}
                      <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-12 flex items-center justify-center overflow-visible pointer-events-none z-0">
                        <svg className="w-full h-full text-primary/30" viewBox="0 0 100 40" fill="none">
                          <path
                            d="M 10 32 Q 50 2 90 32"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray="4 4"
                          />
                        </svg>
                        {/* Floating Connection Zap Icon */}
                        <div className="absolute -top-3.5 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-full p-1.5 shadow-md shadow-orange-500/30">
                          <Zap className="h-4 w-4 fill-current" />
                        </div>
                      </div>

                      {/* Right illustration */}
                      <img
                        src="/category-2.svg"
                        alt="Student illustrating"
                        className="w-[90px] h-auto object-contain z-10 filter drop-shadow-[0_8px_24px_rgba(16,185,129,0.08)]"
                      />
                    </div>
                  )}
                </div>

                {/* Right Student Illustration with floating animation & premium glowing drop-shadow (Desktop only) */}
                {!isMobile && (
                  <div className="hidden md:block w-1/4 max-w-[180px] lg:max-w-[220px] select-none shrink-0 self-end relative">
                    {/* Floating pill badge on top of illustration */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
                      transition={{ delay: 1, y: { repeat: Infinity, duration: 4, ease: "easeInOut", delay: 2 } }}
                      className="absolute -top-6 -right-6 backdrop-blur-md bg-card/75 border border-border/80 shadow-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-black text-foreground z-20 whitespace-nowrap select-none"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span>⚡ AI Prep Active</span>
                    </motion.div>

                    <motion.img
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
                      transition={{
                        x: { delay: 0.2, type: "spring", stiffness: 100 },
                        y: { repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.6 }
                      }}
                      src="/category-2.svg"
                      alt="Student illustrating"
                      className="w-full h-auto object-contain filter drop-shadow-[0_8px_30px_rgba(16,185,129,0.12)] dark:drop-shadow-[0_8px_30px_rgba(16,185,129,0.2)]"
                    />
                  </div>
                )}
              </motion.div>

              {/* ════ TOOL CARDS ════════════════════════════════════════ */}
              <div className="space-y-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-foreground tracking-tight flex items-center gap-2.5">
                      <div className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-emerald-400" />
                      Academic Command Center
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-[14px]">Select a tool to start learning</p>
                  </div>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tools.map((tool, idx) => {
                    const Icon = tool.icon;
                    const isHovered = hoveredTool === idx;

                    const card = (
                      <motion.div variants={pop}
                        onHoverStart={() => setHoveredTool(idx)} onHoverEnd={() => setHoveredTool(null)}
                        className="h-full">
                        <div className="h-full bg-card rounded-2xl border border-border/80 p-6 sm:p-7 flex flex-col justify-between min-h-[250px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/[0.02] group/c relative overflow-hidden">
                          
                          {/* Radial colorful glow inside the card, centered, active on hover */}
                          <div className={`absolute top-1/2 right-1/4 -translate-y-1/2 w-48 h-48 rounded-full bg-gradient-to-br ${tool.gradient} opacity-0 group-hover/c:opacity-[0.15] blur-[40px] transition-all duration-500 pointer-events-none z-0`} />
                          
                          {/* Top Row: Soft Badge Icon on Left, ArrowUpRight on Right */}
                          <div className="flex items-center justify-between relative z-10">
                            <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${tool.gradient}/10 flex items-center justify-center shadow-sm group-hover/c:scale-105 transition-all duration-300`}>
                              <Icon className={`h-5.5 w-5.5 ${tool.textTheme}`} />
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 group-hover/c:text-foreground group-hover/c:translate-x-0.5 group-hover/c:-translate-y-0.5 transition-all duration-300" />
                          </div>

                          {/* Middle Body: Large Title, Short Description */}
                          <div className="space-y-2.5 my-5 relative z-10">
                            <h3 className="text-lg font-black tracking-tight text-foreground group-hover/c:text-primary transition-colors duration-200">
                              {tool.title}
                            </h3>
                            <p className="text-xs text-muted-foreground/90 leading-relaxed font-semibold">
                              {tool.desc}
                            </p>
                          </div>

                          {/* Bottom Row: Pill Button on Left, Circular Icon Action Buttons on Right */}
                          <div className="flex items-center justify-between pt-2 relative z-10 mt-auto">
                            <div className="px-5 py-2 rounded-full border border-foreground/80 hover:bg-foreground hover:text-background text-[11px] font-black transition-all duration-200 cursor-pointer select-none uppercase tracking-wider">
                              Learn more
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="h-9.5 w-9.5 rounded-full bg-muted/40 hover:bg-muted border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer">
                                <Bookmark className="h-4 w-4" />
                              </div>
                              <div className="h-9.5 w-9.5 rounded-full bg-muted/40 hover:bg-muted border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer">
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    );

                    if ("isAction" in tool) return <button key={tool.title} onClick={() => setActiveView("university")} className="text-left h-full w-full">{card}</button>;
                    if ("isExternal" in tool) return <a key={tool.title} href={(tool as any).href} target="_blank" rel="noopener noreferrer" className="h-full block">{card}</a>;
                    return <Link key={tool.title} to={(tool as any).href} className="h-full block">{card}</Link>;
                  })}
                </motion.div>
              </div>


              {/* ════ FEATURED CAMPUSES ══════════════════════════════════ */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-foreground tracking-tight flex items-center gap-2.5">
                      <div className="h-5 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-400" />
                      Featured Campuses
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-[14px]">Explore top institutions and program past papers</p>
                  </div>
                  <button 
                    onClick={() => setActiveView("university")}
                    className="flex items-center gap-1.5 text-xs font-black text-primary hover:gap-2 transition-all cursor-pointer"
                  >
                    <span>View Directory</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="bg-card border border-border/80 rounded-2xl overflow-hidden h-[280px] animate-pulse flex flex-col">
                        <div className="h-32 bg-muted-foreground/10" />
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="h-5 w-20 rounded bg-muted-foreground/15" />
                            <div className="h-4 w-5/6 rounded bg-muted-foreground/20" />
                            <div className="h-3 w-1/2 rounded bg-muted-foreground/10" />
                          </div>
                          <div className="h-9 w-full rounded-xl bg-muted-foreground/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : universities.length === 0 ? (
                  <div className="text-center py-10 bg-card rounded-2xl border border-border/60">
                    <School className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-bold text-foreground">No universities loaded yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row flex-wrap gap-6">
                    {universities.slice(0, 3).map((u, index) => {
                      const c = u.courses?.length || 0;
                      const gradient = cardGradients[index % cardGradients.length];
                      const badgeText = c === 0 ? "Upcoming" : c === 1 ? "Specialized" : "Popular";
                      const badgeStyle = 
                        c === 0 ? "bg-muted text-muted-foreground" :
                        c === 1 ? "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400" :
                        "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400";

                      return (
                        <div key={u.id} className="group h-full max-w-sm w-full">
                          <Link to="/student/university/$id" params={{ id: u.id }} className="block h-full">
                            <div className="h-full bg-card border border-border/80 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1.5 flex flex-col relative">
                              
                              {/* Card Header Band */}
                              <div className={`relative h-32 w-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 text-white shrink-0 overflow-hidden`}>
                                {u.banner_url && (
                                  <img src={u.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-overlay pointer-events-none" />
                                )}
                                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:12px_12px] pointer-events-none" />
                                <div className="h-14 w-14 rounded-xl bg-white/95 backdrop-blur-sm shadow-md border-2 border-white flex items-center justify-center p-1.5 mb-1.5 transition-transform duration-300 group-hover:scale-105 z-10">
                                  {u.logo_url ? (
                                    <img src={u.logo_url} alt={u.name} className="h-full w-full object-contain rounded-md" />
                                  ) : (
                                    <School className="h-7 w-7 text-primary" />
                                  )}
                                </div>
                                <span className="text-[10px] font-black tracking-wider uppercase text-white drop-shadow-sm truncate max-w-full px-2 z-10">
                                  {u.slug || "CAMPUS"}
                                </span>
                              </div>

                              {/* Card Body */}
                              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${badgeStyle}`}>
                                      {badgeText}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                      <BookOpen className="h-3 w-3" />
                                      {c} {c === 1 ? "Program" : "Programs"}
                                    </span>
                                  </div>
                                  <h3 className="font-extrabold text-foreground group-hover:text-primary transition-colors text-base line-clamp-1">
                                    {u.name}
                                  </h3>
                                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {u.description || "Browse available syllabi, semesters, past papers, and internal subject materials."}
                                  </p>
                                </div>

                                <div className="w-full py-2 bg-muted/40 group-hover:bg-primary/10 rounded-xl text-center text-xs font-black text-foreground group-hover:text-primary transition-all duration-200 border border-border/40 group-hover:border-primary/20">
                                  Browse Past Papers
                                </div>
                              </div>

                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ════ QUICK RESOURCES SECTION ════════════════════════════ */}
              <div className="space-y-4 pt-2">
                <div>
                  <h2 className="text-base font-black text-foreground tracking-tight flex items-center gap-2.5">
                    <div className="h-5 w-1 rounded-full bg-gradient-to-b from-violet-500 to-indigo-500" />
                    Essential Academic Tools
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-[14px]">Supercharge your studies and career preparation</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Tool 1: ATS Resume Studio */}
                  <div className="relative overflow-hidden bg-card border border-border/80 rounded-2xl p-6 flex flex-col justify-between min-h-[180px] hover:shadow-lg transition-all duration-300 hover:border-violet-500/30 group max-w-md w-full">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/[0.02] rounded-full blur-2xl group-hover:opacity-100 transition-opacity" />
                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <h3 className="font-extrabold text-foreground text-base">ATS Resume Studio</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Build, format, and download ATS-friendly resumes that help you secure internship and placement opportunities.
                      </p>
                    </div>
                    <div className="pt-4 relative z-10 flex justify-end">
                      <Link to="/student/resume" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                        <span>Launch Builder</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Tool 2: Study Revision Planner */}
                  <div className="relative overflow-hidden bg-card border border-border/80 rounded-2xl p-6 flex flex-col justify-between min-h-[180px] hover:shadow-lg transition-all duration-300 hover:border-sky-500/30 group max-w-md w-full">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/[0.02] rounded-full blur-2xl group-hover:opacity-100 transition-opacity" />
                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
                          <CalendarCheck className="h-5 w-5" />
                        </div>
                        <h3 className="font-extrabold text-foreground text-base">Syllabus Revision Planner</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Stay on top of deadlines, generate customized revision calendars, and track exam prep progress week by week.
                      </p>
                    </div>
                    <div className="pt-4 relative z-10 flex justify-end">
                      <Link to="/student/planner" className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                        <span>Open Planner</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          ) : (
            /* ═══════════ UNIVERSITY DIRECTORY VIEW ═══════════════════ */
            <motion.div key="uni" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ type: "spring", stiffness: 100, damping: 20 }} className="space-y-6">
              {/* Back Row & Sort Control */}
              <div className="flex items-center justify-between">
                <button onClick={() => setActiveView("dashboard")}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer">
                  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="uppercase tracking-wider font-extrabold text-[10px]" style={{ fontFamily: "'Sora', sans-serif" }}>Dashboard</span>
                </button>

                <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5 shadow-sm hover:border-primary/20 transition-all duration-200">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-[10px] font-black text-muted-foreground focus:outline-none cursor-pointer border-none p-0">
                    <option value="name">A–Z NAME</option>
                    <option value="courses_desc">MOST PROGRAMS</option>
                    <option value="courses_asc">LEAST PROGRAMS</option>
                  </select>
                </div>
              </div>

              {/* Title & Search Bar Row */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/60 pb-6">
                <div className="space-y-1">
                  <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5" style={{ fontFamily: "'Sora', sans-serif" }}>
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <School className="text-primary h-4.5 w-4.5" />
                    </div>
                    University Directory
                  </h1>
                  <p className="text-xs text-muted-foreground">Select a campus to access syllabi, courses & past papers</p>
                </div>

                <div className="relative w-full md:max-w-xs shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input type="text" placeholder="Search campus…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 bg-card text-foreground pl-9 pr-3 rounded-xl text-xs border border-border focus:border-primary focus:outline-none placeholder:text-muted-foreground shadow-sm transition-all focus:ring-1 focus:ring-primary/20" />
                </div>
              </div>

              {/* Shaded Tab Bar & Count stats in single aligned row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-1 mb-6 gap-3">
                <div className="flex overflow-x-auto scrollbar-none bg-muted/30 dark:bg-card/30 p-1 gap-1 rounded-lg">
                  {(["all", "popular", "specialized", "bookmarked"] as const).map((tab) => {
                    const label = tab === "all" ? "All" : tab === "popular" ? "Popular" : tab === "specialized" ? "Specialized" : "Bookmarked";
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-1.5 px-4 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm rounded-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {!loading && (
                  <div className="flex items-center gap-2 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] border border-emerald-500/10 px-3 py-1.5 rounded-lg shrink-0 w-fit">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                      Showing {filtered.length} of {universities.length} {universities.length === 1 ? "University" : "Universities"}
                    </span>
                  </div>
                )}
              </div>

              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col relative h-[380px] animate-pulse">
                        {/* Top banner band placeholder */}
                        <div className="h-36 w-full bg-muted/60 dark:bg-card/60 flex flex-col items-center justify-center p-4 relative shrink-0">
                          {/* Logo placeholder */}
                          <div className="h-16 w-16 rounded-lg bg-muted-foreground/10 border-2 border-border/40 mb-2" />
                          {/* Slug text placeholder */}
                          <div className="h-3.5 w-16 rounded bg-muted-foreground/15" />
                        </div>
                        {/* Body content placeholder */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              {/* Tag placeholder */}
                              <div className="h-5 w-20 rounded bg-muted-foreground/15" />
                              {/* Heart placeholder */}
                              <div className="h-4 w-4 rounded-full bg-muted-foreground/15" />
                            </div>
                            {/* Title placeholder */}
                            <div className="space-y-1.5">
                              <div className="h-4 w-5/6 rounded bg-muted-foreground/20" />
                              <div className="h-4 w-1/2 rounded bg-muted-foreground/20" />
                            </div>
                            {/* Subtitle placeholder */}
                            <div className="h-3 w-2/3 rounded bg-muted-foreground/10" />
                            {/* Rating stars placeholder */}
                            <div className="h-3 w-1/2 rounded bg-muted-foreground/10 mt-1" />
                          </div>
                          {/* Footer placeholder */}
                          <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-2">
                            <div className="h-3 w-16 rounded bg-muted-foreground/10" />
                            <div className="h-3.5 w-10 rounded bg-muted-foreground/15" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-none border border-border">
                    <Compass className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-bold text-foreground">No campuses found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try a different search</p>
                  </div>
                ) : (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filtered.map((u, index) => {
                      const c = u.courses?.length || 0;
                      const gradient = cardGradients[index % cardGradients.length];
                      const badgeText = c === 0 ? "Upcoming" : c === 1 ? "Specialized" : "Popular";
                      const badgeStyle = 
                        c === 0 ? "bg-muted text-muted-foreground border-none" :
                        c === 1 ? "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border-none" :
                        "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-none";
                      
                      return (
                        <motion.div variants={pop} key={u.id} className="group">
                           <Link to="/student/university/$id" params={{ id: u.id }} className="block h-full">
                            <div className="h-full bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1.5 flex flex-col relative">
                              {/* Header colored band like the second image */}
                              <div className={`relative h-36 w-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 text-white shrink-0 overflow-hidden`}>
                                {u.banner_url && (
                                  <img src={u.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-overlay pointer-events-none" />
                                )}
                                {/* Unique Design Details in Banner */}
                                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:12px_12px] pointer-events-none" />
                                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/15 blur-lg pointer-events-none" />
                                <div className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full bg-white/10 blur-md pointer-events-none" />

                                <div className="h-16 w-16 rounded-lg bg-white/95 backdrop-blur-sm shadow-md border-2 border-white flex items-center justify-center p-2 mb-2 transition-transform duration-300 group-hover:scale-110 z-10">
                                  {u.logo_url ? (
                                    <img src={u.logo_url} alt={u.name} className="h-full w-full object-contain rounded-md" />
                                  ) : (
                                    <School className="h-8 w-8 text-primary" />
                                  )}
                                </div>
                                <span className="text-xs font-black tracking-wider uppercase text-white drop-shadow-sm truncate max-w-full px-2 z-10">
                                  {u.slug || "CAMPUS"}
                                </span>
                              </div>

                              {/* Card Body */}
                              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                                <div>
                                  {/* Badge & Heart Wishlist Row */}
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${badgeStyle}`}>
                                      {badgeText}
                                    </span>
                                    <button 
                                      onClick={(e) => toggleBookmark(u.id, e)}
                                      className="p-1 hover:bg-secondary rounded-full transition-colors"
                                    >
                                      <Heart className={`h-4.5 w-4.5 transition-all ${bookmarkedUnis.includes(u.id) ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground hover:text-red-500"}`} />
                                    </button>
                                  </div>

                                  {/* Title & Description */}
                                  <h3 className="font-extrabold text-foreground group-hover:text-primary transition-colors text-base line-clamp-1 leading-snug mb-1">
                                    {u.name}
                                  </h3>
                                  <p className="text-[11px] text-muted-foreground mb-2">
                                    By: {u.slug || "Lakshay IQ"}
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
                                    <span className="text-[11px] text-muted-foreground">({c} Program{c !== 1 ? "s" : ""})</span>
                                  </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                                  <span className="text-xs font-black text-foreground">Free Access</span>
                                  <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:text-primary-glow transition-colors">
                                    <span>View</span>
                                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}