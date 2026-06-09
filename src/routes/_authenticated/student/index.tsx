import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Building2, BookOpen, Search, ArrowUpDown, Compass, School,
  FileText, CalendarCheck, MessageSquare, Bookmark, FolderGit2, ArrowRight,
  ArrowLeft, GraduationCap, TrendingUp, Clock, Calendar, Zap, Award,
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
    title: "Chat Hub",
    desc: "Connect with teachers & classmates",
    icon: MessageSquare,
    href: "/student/chat",
    gradient: "from-fuchsia-500 to-pink-400",
    glow: "shadow-fuchsia-500/10",
    cardBg: "bg-fuchsia-500/[0.03] dark:bg-fuchsia-500/[0.02]",
    cardBorder: "border-fuchsia-500/10 dark:border-fuchsia-500/5 hover:border-fuchsia-500/30",
    textTheme: "text-fuchsia-600 dark:text-fuchsia-400"
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

/* ════════════════════════════════════════════════════════════════════════ */
function StudentDashboard() {
  const [activeView, setActiveView] = useState<"dashboard" | "university">("dashboard");
  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "courses_desc" | "courses_asc">("name");
  const [greeting, setGreeting] = useState("Welcome");
  const [hoveredTool, setHoveredTool] = useState<number | null>(null);

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
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); r = r.filter(u => u.name.toLowerCase().includes(q) || u.slug.toLowerCase().includes(q) || u.description?.toLowerCase().includes(q)); }
    if (sortBy === "courses_desc") r.sort((a, b) => (b.courses?.length || 0) - (a.courses?.length || 0));
    else if (sortBy === "courses_asc") r.sort((a, b) => (a.courses?.length || 0) - (b.courses?.length || 0));
    else r.sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [universities, searchQuery, sortBy]);

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
                className="relative bg-gradient-to-br from-primary/[0.02] via-card to-emerald-500/[0.01] rounded-2xl border border-border/80 overflow-hidden flex flex-col md:flex-row items-center justify-between p-6 md:p-8 lg:px-12 gap-8 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.03)] dark:shadow-none"
              >
                {/* Decorative background grid */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                {/* Left Student Illustration with floating animation */}
                <div className="hidden md:flex items-end w-1/4 max-w-[180px] lg:max-w-[220px] select-none shrink-0 self-end">
                  <motion.img
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
                    transition={{
                      x: { delay: 0.2, type: "spring", stiffness: 100 },
                      y: { repeat: Infinity, duration: 6, ease: "easeInOut" }
                    }}
                    src="/category-1 (2).svg"
                    alt="Student illustrating"
                    className="w-full h-auto object-contain"
                  />
                </div>

                {/* Center Content */}
                <div className="flex-1 w-full max-w-2xl mx-auto text-center space-y-4 md:space-y-6 relative z-10 px-1 py-4">
                  {/* Floating Plus Icon Decoration */}
                  <motion.div
                    animate={{ y: [0, -6, 0], rotate: [0, 15, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                    className="absolute -top-6 left-6 hidden lg:block text-orange-500 font-extrabold text-2xl select-none"
                  >
                    +
                  </motion.div>

                  {/* Spinning/pulsing Purple Star Decoration */}
                  <motion.div
                    animate={{ y: [0, -8, 0], rotate: 360 }}
                    transition={{
                      y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                      rotate: { repeat: Infinity, duration: 18, ease: "linear" }
                    }}
                    className="absolute -top-10 left-[48%] hidden lg:block text-purple-600 dark:text-purple-400 select-none"
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                      <path d="M12 0l2.5 7.5L22 10l-7.5 2.5L12 20l-2.5-7.5L2 10l7.5-2.5z" />
                    </svg>
                  </motion.div>

                  <div className="relative inline-block space-y-3">
                    <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-black tracking-tight text-foreground leading-tight">
                      What do you want to{" "}
                      <span className="relative inline-block px-1">
                        learn?
                        {/* Curved underline SVG aligned exactly with the word */}
                        <div className="absolute -bottom-2.5 left-0 w-full h-3 pointer-events-none overflow-visible">
                          <svg className="w-full h-full text-amber-400 dark:text-amber-300" viewBox="0 0 100 10" fill="none" preserveAspectRatio="none">
                            <path d="M2 3 Q 50 8, 98 3" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                          </svg>
                        </div>
                      </span>
                    </h1>
                    <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm font-medium tracking-wide">
                      Grow your skill with the most reliable online courses and certifications
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setActiveView("university");
                    }}
                    className="max-w-md mx-auto pt-2"
                  >
                    <div className="relative flex items-center bg-card/85 dark:bg-card/95 backdrop-blur border border-border/80 rounded-2xl p-1.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                      <Search className="absolute left-3.5 sm:left-4.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search course..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent pl-9 sm:pl-12 pr-20 sm:pr-28 py-2 sm:py-3 text-xs sm:text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
                      />
                      <button
                        type="submit"
                        className="absolute right-1 px-4 sm:px-6 py-2 sm:py-2.5 bg-foreground hover:bg-foreground/90 dark:bg-primary dark:hover:bg-primary-glow text-background dark:text-primary-foreground text-[10px] sm:text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        Search
                      </button>
                    </div>
                  </form>

                  {/* Centered student illustrations side-by-side with animated connector (mobile-only) */}
                  <div className="flex md:hidden items-center justify-center gap-24 pt-6 relative select-none">
                    {/* Left illustration */}
                    <motion.img
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                      src="/category-1 (2).svg"
                      alt="Student illustrating"
                      className="w-[90px] h-auto object-contain z-10"
                    />

                    {/* Animated Connection Arc and Zap Badge */}
                    <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-12 flex items-center justify-center overflow-visible pointer-events-none z-0">
                      <svg className="w-full h-full text-primary/30" viewBox="0 0 100 40" fill="none">
                        <motion.path
                          d="M 10 32 Q 50 2 90 32"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray="4 4"
                          animate={{ strokeDashoffset: [0, -20] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />
                      </svg>
                      {/* Floating Connection Zap Icon */}
                      <motion.div
                        animate={{ y: [0, -4, 0], scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="absolute -top-3.5 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-full p-1.5 shadow-md shadow-orange-500/30"
                      >
                        <Zap className="h-4 w-4 fill-current" />
                      </motion.div>
                    </div>

                    {/* Right illustration */}
                    <motion.img
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
                      src="/category-2.svg"
                      alt="Student illustrating"
                      className="w-[90px] h-auto object-contain z-10"
                    />
                  </div>
                </div>

                {/* Right Student Illustration with floating animation */}
                <div className="hidden md:flex items-end w-1/4 max-w-[180px] lg:max-w-[220px] select-none shrink-0 self-end">
                  <motion.img
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
                    transition={{
                      x: { delay: 0.2, type: "spring", stiffness: 100 },
                      y: { repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.6 }
                    }}
                    src="/category-2.svg"
                    alt="Student illustrating"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </motion.div>

              {/* ════ TOOL CARDS ════════════════════════════════════════ */}
              <div className="space-y-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black text-foreground tracking-tight flex items-center gap-2">
                      <div className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-emerald-400" />
                      Academic Command Center
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5 ml-[22px]">Select a tool to begin</p>
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
                        <div className={`h-full ${tool.cardBg} rounded-2xl border ${tool.cardBorder} p-6 flex flex-col justify-between gap-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/5 group/c relative overflow-hidden`}>
                          {/* Subtle background gradient match */}
                          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${tool.gradient} opacity-[0.03] rounded-full blur-2xl group-hover/c:opacity-[0.08] transition-opacity duration-300`} />

                          <div className="relative z-10 space-y-4">
                            <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg ${tool.glow} group-hover/c:scale-110 group-hover/c:rotate-3 transition-all duration-300`}>
                              <Icon className="h-5.5 w-5.5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-[15px] font-black tracking-tight text-foreground group-hover/c:text-primary transition-colors duration-200">{tool.title}</h3>
                              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">{tool.desc}</p>
                            </div>
                          </div>

                          <div className="relative z-10 flex items-center justify-between pt-2">
                            <div className={`flex items-center gap-1.5 text-xs font-black ${tool.textTheme} group-hover/c:gap-2.5 transition-all`}>
                              <span>Launch</span>
                              <ArrowRight className="h-3.5 w-3.5 group-hover/c:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );

                    if ("isAction" in tool) return <button key={tool.title} onClick={() => setActiveView("university")} className="text-left h-full">{card}</button>;
                    return <Link key={tool.title} to={(tool as any).href} className="h-full block">{card}</Link>;
                  })}
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="bg-card/65 dark:bg-card/45 backdrop-blur-md rounded-2xl border border-border/60 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg shadow-primary/20">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">This Week's Activity</p>
                    <p className="text-[11px] text-muted-foreground">7 units completed — you're on fire! 🔥</p>
                  </div>
                </div>
                <div className="flex items-end gap-1.5 h-10">
                  {[35, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                      transition={{ delay: 0.7 + i * 0.06, type: "spring", stiffness: 180 }}
                      className="w-3 rounded-t-full origin-bottom overflow-hidden bg-border" style={{ height: `${h * 0.4}px` }}>
                      <motion.div initial={{ height: 0 }} animate={{ height: "100%" }}
                        transition={{ delay: 0.9 + i * 0.06, duration: 0.5 }}
                        className="w-full bg-gradient-to-t from-primary to-primary-glow rounded-t-full" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

            </motion.div>
          ) : (
            /* ═══════════ UNIVERSITY DIRECTORY VIEW ═══════════════════ */
            <motion.div key="uni" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ type: "spring", stiffness: 100, damping: 20 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <button onClick={() => setActiveView("dashboard")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all w-fit">
                  <ArrowLeft className="h-4 w-4" /><span>Back to Hub</span>
                </button>
                <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-1.5 shadow-soft">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-[10px] font-bold text-muted-foreground focus:outline-none cursor-pointer border-none p-0">
                    <option value="name">A–Z Name</option>
                    <option value="courses_desc">Most Programs</option>
                    <option value="courses_asc">Least Programs</option>
                  </select>
                </div>
              </div>

              <div className="border-b border-border pb-5">
                <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                  <School className="text-primary h-6 w-6" /> University Directory
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Select a campus to access syllabi, courses & past papers</p>
                <div className="relative max-w-md mt-4">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="text" placeholder="Search campus…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-card text-foreground pl-10 pr-4 py-2.5 rounded-xl text-xs border border-border focus:border-primary focus:outline-none placeholder:text-muted-foreground" />
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <div key={i} className="bg-card h-72 rounded-xl border border-border animate-pulse" />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <Compass className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-bold text-foreground">No campuses found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try a different search</p>
                  </div>
                ) : (
                  <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((u) => {
                      const c = u.courses?.length || 0;
                      return (
                        <motion.div variants={pop} key={u.id} className="group">
                           <Link to="/student/university/$id" params={{ id: u.id }} className="block h-full">
                            <div className="h-full bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 flex flex-col relative">
                              <div className="relative h-32 w-full overflow-hidden bg-surface shrink-0">
                                {u.banner_url ? <img src={u.banner_url} alt={u.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-emerald-500/10" />}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                              </div>
                              <div className="absolute top-[104px] left-5 z-20 h-14 w-14 rounded-xl bg-card border-2 border-background shadow-lg p-1.5 flex items-center justify-center overflow-hidden">
                                {u.logo_url ? <img src={u.logo_url} alt={u.name} className="h-full w-full object-contain rounded-lg" />
                                  : <School className="h-6 w-6 text-primary" />}
                              </div>
                              <div className="p-5 pt-10 flex-1 flex flex-col justify-between gap-3">
                                <div>
                                  <h3 className="font-extrabold text-foreground group-hover:text-primary transition-colors text-sm line-clamp-1">{u.name}</h3>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{u.description || "Comprehensive syllabus, term papers & past question sheets."}</p>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                  <div className="inline-flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/15 text-[10px] text-primary font-bold uppercase tracking-wider">
                                    <BookOpen className="h-3 w-3" />{c} Program{c !== 1 ? "s" : ""}
                                  </div>
                                  <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-0.5">
                                    Explore <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                  </span>
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