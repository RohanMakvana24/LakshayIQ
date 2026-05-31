import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Video, 
  Sparkles,
  Search,
  BookMarked,
  HelpCircle,
  ArrowRight,
  Layers,
  Network,
  Milestone,
  Loader2,
  Github,
  Twitter,
  Globe,
  FileCode,
  Briefcase,
  Rocket,
  CheckCircle2,
  MessageSquare,
  CalendarCheck,
  ListTodo,
  Clock,
  Zap,
  Shield,
  Activity,
  ChevronRight,
  Sun,
  Moon,
  Check,
  ArrowDownToLine,
  Plus,
  Award,
  Send,
  MessageCircle,
  FolderDot,
  FileSearch,
  MessageSquareCode
} from "lucide-react";

import { BiSolidBookHeart } from "react-icons/bi";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lakshay IQ — Smart University Learning Platform" },
      { name: "description", content: "Notes, PYQs, videos, resume builder, and project helper for every Indian university — organized semester-wise." },
    ],
  }),
  component: Landing,
});

/* ==========================================================================
   INTERACTIVE PLATFORM SANDBOX COMPONENT
   ========================================================================== */
function InteractiveSandbox({ isDarkMode }: { isDarkMode: boolean }) {
  const [activeTab, setActiveTab] = useState<"syllabus" | "resume" | "chat">("syllabus");
  const [chatMessages, setChatMessages] = useState([
    { sender: "admin", content: "🎓 શું તમારે Final Year નો Project જોઈએ છે? Documents સાથે! 📄✨", time: "10:00" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Chat message simulator loop
  useEffect(() => {
    if (activeTab !== "chat") return;
    
    // Cycle messages
    const timer = setTimeout(() => {
      if (chatMessages.length === 1) {
        setChatMessages(prev => [
          ...prev,
          { sender: "student", content: "Hi! Can I get Aktu 4th sem DBMS notes?", time: "10:02" }
        ]);
        setIsTyping(true);
      }
    }, 1500);

    const replyTimer = setTimeout(() => {
      if (chatMessages.length === 2) {
        setIsTyping(false);
        setChatMessages(prev => [
          ...prev,
          { sender: "admin", content: "Absolutely! I have added the complete DBMS module notes & last 5 years solved PYQs directly to your Bookmarks shelf. 📚✨", time: "10:03" }
        ]);
      }
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearTimeout(replyTimer);
    };
  }, [activeTab, chatMessages.length]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = { sender: "student", content: chatInput.trim(), time: "Just now" };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setChatMessages(prev => [
        ...prev,
        { sender: "admin", content: "Awesome! Processing your request immediately. Check your dashboard notifications in 5 seconds! 🚀", time: "Just now" }
      ]);
    }, 1500);
  };

  return (
    <div className={`w-full max-w-lg rounded-3xl border p-2 backdrop-blur-md relative group transition-colors duration-300 ${
      isDarkMode ? "border-white/5 bg-slate-950/40" : "border-slate-200 bg-white/60 shadow-xl"
    }`}>
      {/* Glow highlight */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-emerald-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      <div className={`rounded-2xl border overflow-hidden transition-all relative w-full ${
        isDarkMode ? "border-white/5 bg-[#090c12]" : "border-slate-100 bg-white shadow-md"
      }`}>
        
        {/* Tab selection bar */}
        <div className={`flex border-b text-[10px] sm:text-xs font-black select-none ${
          isDarkMode ? "border-white/5 bg-slate-950/30" : "border-slate-100 bg-slate-50/50"
        }`}>
          {[
            { id: "syllabus", label: "Syllabus Track", icon: GraduationCap },
            { id: "resume", label: "ATS Resume Scan", icon: FileSearch },
            { id: "chat", label: "Live Mentorship", icon: MessageSquareCode }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === "chat") {
                  // Reset chat to initial welcome bubble
                  setChatMessages([{ sender: "admin", content: "🎓 શું તમારે Final Year નો Project જોઈએ છે? Documents સાથે! 📄✨", time: "10:00" }]);
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 transition-colors relative ${
                activeTab === tab.id
                  ? isDarkMode ? "text-emerald-400 bg-white/[0.02]" : "text-emerald-600 bg-white shadow-sm"
                  : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5 shrink-0" />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-emerald-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab contents viewport */}
        <div className="p-5 h-72 overflow-y-auto [scrollbar-width:none]">
          
          {/* TAB 1: SYLLABUS TRACKER */}
          {activeTab === "syllabus" && (
            <div className="space-y-4 animate-in fade-in duration-300 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>VTU B.E Computer Science</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Semester Vector: Semester 6</p>
                </div>
                <div className="text-[8px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  ACTIVE SYLLABUS
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: "Unit 1: System Software & Compiler Design", files: "Notes + 3 Solved papers", complete: 90 },
                  { name: "Unit 2: Computer Graphics & Visualization", files: "Notes + Lecture Reels", complete: 70 },
                  { name: "Unit 3: Web Technology & its Applications", files: "Projects + Pinned Documents", complete: 100 }
                ].map((unit, i) => (
                  <div key={i} className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDarkMode ? "bg-white/[0.01] border-white/5" : "bg-slate-50/50 border-slate-100"
                  }`}>
                    <div className="space-y-1 max-w-[75%]">
                      <h5 className={`text-[10px] font-black leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{unit.name}</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-slate-400 font-semibold">{unit.files}</span>
                        <div className="w-16 h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${unit.complete}%` }} />
                        </div>
                      </div>
                    </div>
                    <button className="h-7 w-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow shadow-emerald-500/20 active:scale-95 transition-transform">
                      {unit.complete === 100 ? (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      ) : (
                        <ArrowDownToLine className="h-3.5 w-3.5 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ATS RESUME BUILDER */}
          {activeTab === "resume" && (
            <div className="space-y-4 animate-in fade-in duration-300 text-left">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-8 space-y-1">
                  <h4 className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>ATS Score Matrix Scanned</h4>
                  <p className="text-[9px] text-slate-500 leading-relaxed font-semibold">Your resume contains rich tech parameters optimized for Indian developer roles.</p>
                </div>
                <div className="col-span-4 flex justify-end">
                  <div className="relative h-16 w-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-200 dark:text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-emerald-500" strokeDasharray="94, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className={`text-xs font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>94%</span>
                      <span className="text-[6px] text-emerald-500 font-extrabold uppercase leading-none">ATS HIGH</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { check: "Action-driven sentences with impact keywords matched", pass: true },
                  { check: "Correct contact details, Github linkage verified", pass: true },
                  { check: "No multi-column complex parser failures detected", pass: true }
                ].map((item, i) => (
                  <div key={i} className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                    isDarkMode ? "bg-white/[0.01] border-white/5" : "bg-slate-50/50 border-slate-100"
                  }`}>
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span className={`text-[9px] font-bold ${isDarkMode ? "text-slate-350" : "text-slate-700"}`}>{item.check}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE MENTORSHIP CHAT */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-full animate-in fade-in duration-300 text-left">
              <div className="flex-1 space-y-2 pr-1 overflow-y-auto [scrollbar-width:none]">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex items-end gap-1.5 ${
                    msg.sender === "student" ? "flex-row-reverse" : "flex-row"
                  }`}>
                    <div className={`px-3 py-1.5 rounded-2xl text-[9px] font-bold max-w-[80%] leading-relaxed ${
                      msg.sender === "student"
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm"
                        : isDarkMode
                          ? "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-sm"
                          : "bg-slate-100 border border-slate-200 text-slate-800 rounded-bl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1.5">
                    <div className={`px-3 py-2 rounded-2xl bg-slate-900 border border-slate-800 rounded-bl-sm flex items-center justify-center shrink-0`}>
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s] ml-1" />
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s] ml-1" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5">
                <input
                  type="text"
                  placeholder="Ask Admin (e.g. Can I get Aktu notes?)..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                  className={`flex-1 h-8 rounded-lg pl-3 pr-2 text-[10px] font-medium outline-none border focus:ring-0 focus:border-emerald-500/50 ${
                    isDarkMode 
                      ? "border-slate-800 bg-slate-950 text-white" 
                      : "border-slate-200 bg-slate-50 text-slate-850"
                  }`}
                />
                <button
                  onClick={handleSendMessage}
                  className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow shadow-emerald-500/20 active:scale-95 transition-transform"
                >
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function Landing() {
  const { user, role, loading } = useAuth();
  const nav = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return true; // Default to dark mode for premium feel
    }
    return true;
  });
  const [activeStation, setActiveStation] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);
  
  useEffect(() => {
    if (!loading && user && role) {
      nav({ to: role === "admin" ? "/admin" : "/student" });
    }
  }, [user, role, loading, nav]);

  if (loading || user) {
    return <OAuthRedirectLoader role={role} />;
  }

  const systemStations = [
    { id: 0, title: "University", subtitle: "Root Node", desc: "Select your parent institution (e.g., AKTU, SPPU, VTU, GTU).", count: "120+ Hubs", color: "from-[#10B981] to-[#059669]" },
    { id: 1, title: "Course", subtitle: "Stream Vector", desc: "Branch out into your field—B.Tech, BCA, B.Com, or BSc.", count: "450+ Streams", color: "from-[#8B5CF6] to-[#6D28D9]" },
    { id: 2, title: "Semester", subtitle: "Timeline Index", desc: "Hop into your current cycle to slice curriculum cleanly.", count: "1-8 Tiers", color: "from-[#3B82F6] to-[#1D4ED8]" },
    { id: 3, title: "Subject", subtitle: "Module Core", desc: "Target explicit domain structures without noisy cross-talk.", count: "3,200+ Books", color: "from-[#F59E0B] to-[#D97706]" },
    { id: 4, title: "Unit", subtitle: "Quantum Byte", desc: "Pinpoint micro-chapters containing exact Notes, PYQs & Reels.", count: "15,000+ Units", color: "from-[#EC4899] to-[#BE185D]" }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-500 selection:bg-emerald-500/20 selection:text-emerald-400 overflow-hidden relative ${
      isDarkMode ? "bg-[#07090e] text-slate-100" : "bg-[#f8fafc] text-slate-900"
    }`}>
      
      {/* Dynamic Background Glowing Spheres */}
      <div className={`absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${
        isDarkMode ? "bg-emerald-500/5" : "bg-emerald-500/10"
      }`} />
      <div className={`absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[130px] pointer-events-none transition-all duration-1000 ${
        isDarkMode ? "bg-violet-600/5" : "bg-violet-600/10"
      }`} />
      <div className={`absolute bottom-[-10%] left-[20%] w-[55vw] h-[55vw] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${
        isDarkMode ? "bg-blue-500/5" : "bg-blue-500/10"
      }`} />

      {/* Futuristic Grid Line Overlays */}
      <div className={`absolute inset-0 pointer-events-none opacity-20 transition-all ${
        isDarkMode 
          ? "bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem]" 
          : "bg-[linear-gradient(to_right,#cbd5e120_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e120_1px,transparent_1px)] bg-[size:4rem_4rem]"
      }`} />

      {/* HEADER / NAVIGATION */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${
        isDarkMode ? "border-white/5 bg-[#07090e]/60" : "border-slate-200/80 bg-white/70"
      }`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className={`absolute inset-0 rounded-full border border-t-transparent animate-[spin_4s_linear_infinite] ${
                isDarkMode ? "border-emerald-500/40" : "border-emerald-500/60"
              }`} />
              <div className="absolute inset-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md transition-transform duration-500 group-hover:scale-105 group-hover:rotate-12 flex items-center justify-center">
                <BiSolidBookHeart className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-black tracking-tight group-hover:text-emerald-500 transition-colors leading-tight ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`} style={{ fontFamily: "'Sora', sans-serif" }}>
                Lakshay<span className="text-emerald-500 text-[10px] font-black">.IQ</span>
              </span>
              <span className="text-[7px] font-bold uppercase tracking-widest text-slate-500 leading-none">Smart Platform</span>
            </div>
          </Link>

          <nav className={`hidden items-center gap-8 text-xs font-bold uppercase tracking-wider md:flex ${
            isDarkMode ? "text-slate-400" : "text-slate-600"
          }`}>
            <Link to="/" className="text-emerald-500 transition-colors">Home</Link>
            <a href="#features" className={`transition-colors ${isDarkMode ? "hover:text-white" : "hover:text-slate-900"}`}>Products</a>
            <a href="#tools" className={`transition-colors ${isDarkMode ? "hover:text-white" : "hover:text-slate-900"}`}>Tools</a>
            <a href="#flow" className={`transition-colors ${isDarkMode ? "hover:text-white" : "hover:text-slate-900"}`}>Infrastructure</a>
            <span className="h-3 w-px bg-slate-300/20" />
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-slate-500" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your university..." 
                className={`h-8 w-44 rounded-full border pl-9 pr-4 text-[11px] font-medium outline-none transition-all focus:w-56 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 ${
                  isDarkMode 
                    ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500" 
                    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                }`}
              />
            </div>
          </nav>

          <div className="flex items-center gap-2">
            {/* Real-time Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`rounded-full h-9 w-9 transition-colors ${
                isDarkMode 
                  ? "text-yellow-400 hover:bg-white/5" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <span className="h-4 w-px bg-slate-300/20 mr-1" />

            <Button asChild variant="ghost" className={`rounded-full text-xs font-bold ${
              isDarkMode ? "text-slate-300 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}>
              <Link to="/login">Log In</Link>
            </Button>
            <Button asChild className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative w-full py-16 md:py-24 px-6 max-w-7xl mx-auto">
        <div className={`absolute top-[5%] left-[5%] w-80 h-80 rounded-full blur-[100px] pointer-events-none transition-all duration-1000 ${
          isDarkMode ? "bg-emerald-500/10" : "bg-emerald-500/20"
        }`} />
        <div className={`absolute bottom-[5%] right-[5%] w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${
          isDarkMode ? "bg-indigo-500/5" : "bg-indigo-500/15"
        }`} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          
          {/* LEFT COLUMN: HERO MARKETING COPY */}
          <div className="lg:col-span-6 text-left space-y-6 flex flex-col items-start">
            <div className={`inline-flex items-center gap-2 rounded-full border backdrop-blur-md px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-500 shadow-inner ${
              isDarkMode ? "bg-white/5 border-white/10" : "bg-emerald-50 border-emerald-100"
            }`}>
              <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-pulse" /> 
              NEON LEVEL SEMESTER ENGINE
            </div>

            <h1 className={`text-4xl sm:text-6xl font-black leading-[1.08] tracking-tight transition-colors ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`} style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.04em" }}>
              Simplify Semesters.<br/>
              <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 bg-clip-text text-transparent">
                Elevate Your IQ.
              </span>
            </h1>

            <p className={`max-w-xl text-sm sm:text-base leading-relaxed transition-colors ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              A premium structured academic highway providing campus notes, curated question papers, dynamic ATS resumes, final year project guidance, and instant chat assistance.
            </p>

            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto pt-2">
              <Button asChild size="lg" className="rounded-full w-full sm:w-auto bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-8 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                <Link to="/signup" className="flex items-center justify-center">Create Free Account <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className={`rounded-full w-full sm:w-auto text-xs font-bold border transition-colors ${
                isDarkMode 
                  ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10" 
                  : "border-slate-200 bg-white text-slate-600 hover:text-slate-950 hover:bg-slate-50"
              }`}>
                <a href="#features" className="flex items-center justify-center">Inspect Services</a>
              </Button>
            </div>

            {/* Live active stats */}
            <div className="flex items-center gap-6 pt-6 border-t border-slate-300/10 w-full">
              <div className="flex -space-x-2.5">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80"
                ].map((src, i) => (
                  <img key={i} src={src} className="w-8 h-8 rounded-full border border-slate-950 object-cover ring-2 ring-emerald-500/20" alt="Student avatar" />
                ))}
              </div>
              <div className="text-left leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-emerald-500">10,000+</span>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/80" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active university minds connected</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE PLATFORM SIMULATOR */}
          <div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
            <InteractiveSandbox isDarkMode={isDarkMode} />
          </div>

        </div>
      </section>

      {/* STATS TELEMETRY VAULT */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 border rounded-3xl p-8 backdrop-blur-xl transition-all duration-300 ${
          isDarkMode ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200 shadow-md"
        }`}>
          <div className="text-center space-y-1">
            <h3 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`} style={{ fontFamily: "'Sora', sans-serif" }}>120+</h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Campus Hubs</p>
          </div>
          <div className={`text-center space-y-1 border-l ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-500" style={{ fontFamily: "'Sora', sans-serif" }}>10K+</h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Students</p>
          </div>
          <div className={`text-center space-y-1 border-l ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
            <h3 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`} style={{ fontFamily: "'Sora', sans-serif" }}>100%</h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project Success</p>
          </div>
          <div className={`text-center space-y-1 border-l ${isDarkMode ? "border-white/5" : "border-slate-200"}`}>
            <h3 className="text-2xl sm:text-3xl font-black text-indigo-500" style={{ fontFamily: "'Sora', sans-serif" }}>15K+</h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Syllabus Units</p>
          </div>
        </div>
      </section>

      {/* CORE FEATURES ACADEMIC CONTAINER */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <GraduationCap className="w-3.5 h-3.5 text-emerald-500" /> SYLLABUS DIRECTORY
        </span>
        <h2 className={`text-3xl font-black tracking-tight mt-4 sm:text-4xl transition-colors ${
          isDarkMode ? "text-white" : "text-slate-900"
        }`} style={{ fontFamily: "'Sora', sans-serif" }}>
          Everything Required to Ace Your Semester
        </h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto mt-2 leading-relaxed">
          Exhaustive university vaults organized by stream and semester to eliminate noise.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className={`group relative rounded-3xl border p-8 text-left transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
            isDarkMode 
              ? "border-white/5 bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 hover:border-emerald-500/30" 
              : "border-slate-200 bg-white hover:border-emerald-500/50 hover:shadow-lg"
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className={`mt-6 text-lg font-black transition-colors ${isDarkMode ? "text-white" : "text-slate-900"}`} style={{ fontFamily: "'Sora', sans-serif" }}>Previous Year Papers</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Exhaustive collection of semester question papers structured by historical year timelines.</p>
          </div>

          {/* Card 2 */}
          <div className={`group relative rounded-3xl border p-8 text-left transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
            isDarkMode 
              ? "border-white/5 bg-gradient-to-br from-blue-500/10 to-blue-500/0 hover:border-blue-500/30" 
              : "border-slate-200 bg-white hover:border-blue-500/50 hover:shadow-lg"
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <BookMarked className="h-5 w-5" />
            </div>
            <h3 className={`mt-6 text-lg font-black transition-colors ${isDarkMode ? "text-white" : "text-slate-900"}`} style={{ fontFamily: "'Sora', sans-serif" }}>Curated Concept Notes</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Precision subject notes formulated directly from respective university mandates.</p>
          </div>

          {/* Card 3 */}
          <div className={`group relative rounded-3xl border p-8 text-left transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
            isDarkMode 
              ? "border-white/5 bg-gradient-to-br from-rose-500/10 to-rose-500/0 hover:border-rose-500/30" 
              : "border-slate-200 bg-white hover:border-rose-500/50 hover:shadow-lg"
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50/10 text-rose-500 border border-rose-500/20">
              <Video className="h-5 w-5" />
            </div>
            <h3 className={`mt-6 text-lg font-black transition-colors ${isDarkMode ? "text-white" : "text-slate-900"}`} style={{ fontFamily: "'Sora', sans-serif" }}>Module Video Tutorials</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Visual subject breakdown series maps module-by-module to quickly resolve hurdles.</p>
          </div>
        </div>
      </section>

      {/* FEATURED SMART HUB SHOWCASE */}
      <section id="tools" className="mx-auto max-w-7xl px-6 py-20 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Rocket className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> NEWLY DEPLOYED MODULES
          </span>
          <h2 className={`text-3xl font-black tracking-tight mt-4 sm:text-4xl transition-colors ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`} style={{ fontFamily: "'Sora', sans-serif" }}>
            Discover Our Smart Academic Engine
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            We've built state-of-the-art interactive modules to organize your semesters, accelerate your career readiness, and offer direct support.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Live Messenger */}
          <div 
            className={`group relative rounded-3xl border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col justify-between ${
              isDarkMode ? "border-white/5 bg-slate-950/40 hover:border-emerald-500/30" : "border-slate-200 bg-white hover:border-emerald-500/50 hover:shadow-2xl"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-bl-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className={`mt-5 text-lg font-black group-hover:text-emerald-500 transition-colors ${
                isDarkMode ? "text-white" : "text-slate-950"
              }`} style={{ fontFamily: "'Sora', sans-serif" }}>
                Ephemeral Live Chat
              </h3>
              <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                Chat 1-on-1 in real-time with the admin. Fully secure, foreground toast notifications, and messages automatically vanish 5 minutes after being read.
              </p>
            </div>
            <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isDarkMode ? "border-white/5" : "border-slate-100"}`}>
              <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> Seen + 5 min Vanish
              </span>
              <Link to="/signup" className="text-[11px] font-bold text-slate-500 hover:text-emerald-500 transition-colors flex items-center gap-1 group-hover:gap-2">
                Start Chat <ArrowRight className="w-3.5 h-3.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Card 2: Study Planner */}
          <div 
            className={`group relative rounded-3xl border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col justify-between ${
              isDarkMode ? "border-white/5 bg-slate-950/40 hover:border-violet-500/30" : "border-slate-200 bg-white hover:border-violet-500/50 hover:shadow-2xl"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 rounded-bl-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/20">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className={`mt-5 text-lg font-black group-hover:text-violet-500 transition-colors ${
                isDarkMode ? "text-white" : "text-slate-950"
              }`} style={{ fontFamily: "'Sora', sans-serif" }}>
                Semester Study Planner
              </h3>
              <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                Organize your semester targets. Calendar view to schedule study slots, and premium visual telemetry dashboard to analyze subject completion trends.
              </p>
            </div>
            <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isDarkMode ? "border-white/5" : "border-slate-100"}`}>
              <span className="text-[9px] font-bold bg-violet-500/10 text-violet-500 px-2.5 py-1 rounded-full">
                📊 Visual Analytics
              </span>
              <Link to="/signup" className="text-[11px] font-bold text-slate-500 hover:text-violet-500 transition-colors flex items-center gap-1 group-hover:gap-2">
                Plan Now <ArrowRight className="w-3.5 h-3.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Card 3: Task Manager */}
          <div 
            className={`group relative rounded-3xl border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col justify-between ${
              isDarkMode ? "border-white/5 bg-slate-950/40 hover:border-amber-500/30" : "border-slate-200 bg-white hover:border-amber-500/50 hover:shadow-2xl"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-bl-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20">
                <ListTodo className="h-5 w-5" />
              </div>
              <h3 className={`mt-5 text-lg font-black group-hover:text-amber-500 transition-colors ${
                isDarkMode ? "text-white" : "text-slate-950"
              }`} style={{ fontFamily: "'Sora', sans-serif" }}>
                Interactive Task Manager
              </h3>
              <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                Break down subjects into unit-wise tasks. Checklists, due dates, and real-time reminders keep your daily academic preparation structured.
              </p>
            </div>
            <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isDarkMode ? "border-white/5" : "border-slate-100"}`}>
              <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full">
                ✅ Unit Checklist
              </span>
              <Link to="/signup" className="text-[11px] font-bold text-slate-500 hover:text-amber-500 transition-colors flex items-center gap-1 group-hover:gap-2">
                Manage Tasks <ArrowRight className="w-3.5 h-3.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Card 4: AI Resume Builder */}
          <div 
            className={`group relative rounded-3xl border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col justify-between ${
              isDarkMode ? "border-white/5 bg-slate-950/40 hover:border-blue-500/30" : "border-slate-200 bg-white hover:border-blue-500/50 hover:shadow-2xl"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-bl-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-md shadow-blue-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className={`mt-5 text-lg font-black group-hover:text-blue-500 transition-colors ${
                isDarkMode ? "text-white" : "text-slate-950"
              }`} style={{ fontFamily: "'Sora', sans-serif" }}>
                ATS Resume Builder
              </h3>
              <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                Craft modern, professional resumes optimized for applicant tracking systems. Choose from multiple designs and export instantly to PDF.
              </p>
            </div>
            <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isDarkMode ? "border-white/5" : "border-slate-100"}`}>
              <span className="text-[9px] font-bold bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-full">
                📄 20+ Templates
              </span>
              <Link to="/signup" className="text-[11px] font-bold text-slate-500 hover:text-blue-500 transition-colors flex items-center gap-1 group-hover:gap-2">
                Build PDF <ArrowRight className="w-3.5 h-3.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Card 5: Project Finder */}
          <div 
            className={`group relative rounded-3xl border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col justify-between ${
              isDarkMode ? "border-white/5 bg-slate-950/40 hover:border-rose-500/30" : "border-slate-200 bg-white hover:border-rose-500/50 hover:shadow-2xl"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/5 to-pink-500/5 rounded-bl-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className={`mt-5 text-lg font-black group-hover:text-rose-500 transition-colors ${
                isDarkMode ? "text-white" : "text-slate-950"
              }`} style={{ fontFamily: "'Sora', sans-serif" }}>
                Project Assistant & Helper
              </h3>
              <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                Custom semester-end project finder and builder. Assistance with ML, Python, React codes, PPT presentation decks, synopsis documents, and viva mocks.
              </p>
            </div>
            <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isDarkMode ? "border-white/5" : "border-slate-100"}`}>
              <span className="text-[9px] font-bold bg-rose-500/10 text-rose-500 px-2.5 py-1 rounded-full">
                🎓 Viva & Synopses
              </span>
              <Link to="/signup" className="text-[11px] font-bold text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-1 group-hover:gap-2">
                Get Helper <ArrowRight className="w-3.5 h-3.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Card 6: Study Vault */}
          <div 
            className={`group relative rounded-3xl border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col justify-between ${
              isDarkMode ? "border-white/5 bg-slate-950/40 hover:border-teal-500/30" : "border-slate-200 bg-white hover:border-teal-500/50 hover:shadow-2xl"
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-bl-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20">
                <BookMarked className="h-5 w-5" />
              </div>
              <h3 className={`mt-5 text-lg font-black group-hover:text-teal-500 transition-colors ${
                isDarkMode ? "text-white" : "text-slate-950"
              }`} style={{ fontFamily: "'Sora', sans-serif" }}>
                Academic Syllabus Vault
              </h3>
              <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                Access micro-curriculum structures, semester-wise subjects, notes, repeated exam questions, and previous year paper archives for all major universities.
              </p>
            </div>
            <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isDarkMode ? "border-white/5" : "border-slate-100"}`}>
              <span className="text-[9px] font-bold bg-teal-500/10 text-teal-500 px-2.5 py-1 rounded-full">
                📚 15,000+ Units
              </span>
              <Link to="/signup" className="text-[11px] font-bold text-slate-500 hover:text-teal-500 transition-colors flex items-center gap-1 group-hover:gap-2">
                Explore Vault <ArrowRight className="w-3.5 h-3.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Trust Badge */}
        <div className="mt-12 flex justify-center">
          <div className={`inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-xs font-semibold backdrop-blur-md transition-colors duration-300 ${
            isDarkMode ? "bg-white/[0.02] border-white/5 text-slate-400" : "bg-white border-slate-200 text-slate-500 shadow-sm"
          }`}>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Empowering 10,000+ Indian university students to prepare faster and smarter.
          </div>
        </div>
      </section>

      {/* DYNAMIC PIPELINE FLOW */}
      <section id="flow" className="mx-auto max-w-7xl px-6 py-20 border-t border-white/5 relative">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Network className="w-3.5 h-3.5 text-emerald-400" /> INTERACTIVE PIPELINE
          </span>
          <h2 className={`text-3xl font-black tracking-tight mt-4 sm:text-4xl transition-colors ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`} style={{ fontFamily: "'Sora', sans-serif" }}>
            Lakshay IQ Infrastructure Map
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Hover or touch the nodes below to inspect how syllabus segments seamlessly route inside our intelligent network.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* THE SUBWAY INTERCONNECTED LINE */}
          <div className={`relative flex flex-col md:flex-row items-center justify-between gap-12 md:gap-0 border p-8 rounded-3xl backdrop-blur-md transition-all duration-300 ${
            isDarkMode ? "bg-white/[0.01] border-white/5" : "bg-white border-slate-200 shadow-sm"
          }`}>
            
            {/* Highlighting Pipeline Line */}
            <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-emerald-500/10 -translate-y-1/2 hidden md:block z-0">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${(activeStation / (systemStations.length - 1)) * 100}%` }}
              />
              <div className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md border-2 border-emerald-500 energy-pulse" />
            </div>

            {systemStations.map((station, index) => {
              const isPast = index <= activeStation;
              const isCurrent = index === activeStation;

              return (
                <button
                  key={station.title}
                  onMouseEnter={() => setActiveStation(index)}
                  onClick={() => setActiveStation(index)}
                  className="relative z-10 flex flex-col items-center group focus:outline-none w-full md:w-auto"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shadow-md transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-slate-905 border-2 border-emerald-500 text-emerald-500 scale-110 ring-4 ring-emerald-500/10 bg-white font-extrabold'
                      : isPast 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border border-white/10' 
                      : isDarkMode 
                      ? 'bg-slate-950 text-slate-500 border border-white/5 hover:border-white/20 hover:text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 hover:border-slate-400 hover:text-slate-700'
                  }`}>
                    {index + 1}
                  </div>

                  <span className={`mt-3 text-[10px] font-black tracking-wider uppercase transition-colors duration-200 ${
                    isCurrent ? 'text-emerald-500' : 'text-slate-500 group-hover:text-emerald-400'
                  }`}>
                    {station.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* DYNAMIC TELEMETRY DISPLAY BOX */}
          <div className={`mt-8 relative min-h-[150px] rounded-3xl border p-6 sm:p-8 shadow-xl overflow-hidden backdrop-blur-md transition-all duration-300 ${
            isDarkMode ? "border-white/5 bg-slate-950/40" : "border-slate-200 bg-white shadow-md"
          }`}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-3xl rounded-bl-full transition-all duration-500 ${systemStations[activeStation].color}`} />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 animate-telemetry-fade">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-gradient-to-r text-white shadow-sm ${systemStations[activeStation].color}`}>
                    {systemStations[activeStation].subtitle}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Node Layer 0{activeStation + 1}</span>
                </div>

                <h3 className={`mt-2 text-xl font-black tracking-tight transition-colors ${isDarkMode ? "text-white" : "text-slate-900"}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                  {systemStations[activeStation].title} Segment Architecture
                </h3>
                
                <p className="mt-2 text-xs leading-relaxed text-slate-500 max-w-xl">
                  {systemStations[activeStation].desc}
                </p>
              </div>

              <div className={`flex flex-col items-start sm:items-end justify-center border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-8 min-w-[130px] ${
                isDarkMode ? "border-white/5" : "border-slate-100"
              }`}>
                <span className={`text-xl font-black tracking-tight transition-colors ${isDarkMode ? "text-white" : "text-slate-900"}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                  {systemStations[activeStation].count}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 mt-0.5 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Synced Tiers
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREMIUM FOOTER */}
      <footer className={`border-t text-slate-400 mt-20 pt-16 pb-8 relative transition-colors duration-300 ${
        isDarkMode ? "bg-slate-950 border-white/5" : "bg-slate-50 border-slate-200"
      }`}>
        <div className="absolute top-0 left-[40%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/[0.02] blur-[100px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-12">
            
            {/* Brand Status */}
            <div className="sm:col-span-2 md:col-span-5 space-y-5 text-left">
              <div className="flex items-center gap-3 group">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-t-transparent animate-[spin_4s_linear_infinite] border-emerald-500/30" />
                  <div className="absolute inset-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md flex items-center justify-center">
                    <BiSolidBookHeart className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex flex-col leading-tight">
                  <h1 className={`text-sm font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`} style={{ fontFamily: "'Sora', sans-serif" }}>
                    Lakshay<span className="ml-0.5 text-emerald-500 font-extrabold text-[10px]">IQ</span>
                  </h1>
                  <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                    Smart Learning Platform
                  </span>
                </div>
              </div>
              
              <p className="max-w-sm text-xs leading-relaxed text-slate-500">
                Simplifying Indian collegiate systems by deploying modular study architecture right to structural portals. Access high-quality syllabus frameworks, concept notes, and custom question vaults.
              </p>

              <div className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-500 shadow-inner ${
                isDarkMode ? "bg-white/[0.01] border-white/5" : "bg-white border-slate-200"
              }`}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/80" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span>System: Active & Synced</span>
              </div>
            </div>

            {/* Resources */}
            <div className="md:col-span-2 space-y-4 text-left">
              <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Resources</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li><a href="#flow" className="hover:text-emerald-500 transition-colors">Campus Hubs</a></li>
                <li><a href="#features" className="hover:text-emerald-500 transition-colors">Syllabus Vault</a></li>
                <li><Link to="/signup" className="hover:text-emerald-500 transition-colors">Student Arena</Link></li>
                <li><Link to="/login" className="hover:text-emerald-500 transition-colors">Admin Console</Link></li>
              </ul>
            </div>

            {/* Tools */}
            <div className="md:col-span-2 space-y-4 text-left">
              <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Tools</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li><Link to="/student/resume-builder" className="hover:text-emerald-500 transition-colors">Resume Builder</Link></li>
                <li><Link to="/student/projects" className="hover:text-emerald-400 transition-colors">Project Helper</Link></li>
                <li><Link to="/student/chat" className="hover:text-emerald-400 transition-colors">Live Chat</Link></li>
                <li><Link to="/student/planner" className="hover:text-emerald-400 transition-colors">Study Planner</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="md:col-span-3 space-y-4 text-left">
              <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? "text-white" : "text-slate-900"}`}>Support</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors cursor-pointer"><HelpCircle className="h-3.5 w-3.5" /> Help Desk</li>
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">Security Sandbox</li>
                <li className="hover:text-emerald-500 transition-colors cursor-pointer">Privacy Protocol</li>
              </ul>
              <div className="flex items-center gap-2.5 pt-2">
                <a href="https://github.com" target="_blank" rel="noreferrer" className={`p-2 rounded-lg border transition-all hover:scale-105 shadow-sm ${
                  isDarkMode 
                    ? "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10" 
                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}>
                  <Github className="h-3.5 w-3.5" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className={`p-2 rounded-lg border transition-all hover:scale-105 shadow-sm ${
                  isDarkMode 
                    ? "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10" 
                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}>
                  <Twitter className="h-3.5 w-3.5" />
                </a>
                <a href="https://lakshay.iq" target="_blank" rel="noreferrer" className={`p-2 rounded-lg border transition-all hover:scale-105 shadow-sm ${
                  isDarkMode 
                    ? "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10" 
                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}>
                  <Globe className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

          </div>

          <div className={`mt-16 border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-wider ${
            isDarkMode ? "border-white/5 text-slate-500" : "border-slate-200 text-slate-400"
          }`}>
            <p>© {new Date().getFullYear()} Lakshay IQ — Smart University Learning Platform. All rights reserved.</p>
            <span className={`border px-3 py-1 rounded-full transition-colors ${
              isDarkMode ? "bg-white/5 border-white/5 text-slate-400" : "bg-white border-slate-200 text-slate-500 shadow-sm"
            }`}>
              Made for Indian Universities
            </span>
          </div>
        </div>
      </footer>

      {/* Embedded High-Fidelity Physics Engine Styling Layer */}
      <style>{`
        @keyframes energyPulseScroll {
          0% {
            left: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }

        @keyframes boxFadeIn {
          from {
            opacity: 0;
            transform: scale(0.98) translateY(4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .energy-pulse {
          animation: energyPulseScroll 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .animate-telemetry-fade {
          animation: boxFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

function OAuthRedirectLoader({ role }: { role: "admin" | "student" | null }) {
  const destination = role === "admin" ? "Admin Console" : "Student Dashboard";
  const steps = [
    "Verifying secure handshake",
    "Syncing academic profile",
    "Routing to your workspace",
  ];

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#090c12] px-6 text-slate-100 antialiased">
      {/* grid + glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#131a26_1px,transparent_1px),linear-gradient(to_bottom,#131a26_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-teal-500/10 blur-[120px]" />
      <div className="absolute -bottom-32 -right-32 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-[130px]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        {/* orbiting brand mark */}
        <div className="relative mb-8 h-32 w-32">
          <div className="absolute inset-0 rounded-full border border-emerald-500/20" />
          <div className="absolute inset-2 rounded-full border border-emerald-500/10" />
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-400/40" />
          <div className="absolute inset-3 animate-[spin_5s_linear_infinite_reverse] rounded-full border-2 border-transparent border-b-teal-400/70 border-l-teal-400/30" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
              <BiSolidBookHeart className="h-7 w-7" />
              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-[#090c12]" />
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-900/50 bg-emerald-950/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          <Sparkles className="h-3 w-3 animate-pulse" /> Session Authenticated
        </span>

        <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
          Welcome to Lakshay <span className="text-emerald-400">.IQ</span>
        </h1>
        <p className="mt-1.5 text-sm font-medium text-slate-400">
          Preparing your {destination}…
        </p>

        {/* progress bar */}
        <div className="mt-7 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/60">
          <div className="loader-bar h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400" />
        </div>

        {/* steps */}
        <ul className="mt-6 w-full space-y-2 text-left font-mono text-[11px] font-semibold text-slate-400">
          {steps.map((s, i) => (
            <li
              key={s}
              className="flex items-center gap-2.5 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2 backdrop-blur-xl loader-step"
              style={{ animationDelay: `${i * 220}ms` }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-slate-300">{s}</span>
              <span className="ml-auto text-[9px] uppercase tracking-widest text-emerald-400">OK</span>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        @keyframes loaderSlide {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(320%); }
        }
        .loader-bar { animation: loaderSlide 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        @keyframes loaderStepIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .loader-step { opacity: 0; animation: loaderStepIn 0.45s ease-out forwards; }
      `}</style>
    </div>
  );
}