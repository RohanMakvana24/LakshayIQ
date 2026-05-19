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
  Milestone
} from "lucide-react";

import { BiSolidBookHeart } from "react-icons/bi";

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
  const [activeStation, setActiveStation] = useState<number>(1);
  
  useEffect(() => {
    if (!loading && user && role) {
      nav({ to: role === "admin" ? "/admin" : "/student" });
    }
  }, [user, role, loading, nav]);

  // Show loader when:
  // 1. Auth is still loading (session being checked after Google OAuth redirect)
  // 2. User is already authenticated (waiting for redirect to student/admin)
  // This prevents the landing page from flashing during Google OAuth callback.
  if (loading || user) {
    return <OAuthRedirectLoader role={role} />;
  }

  // Unique data matrix for our interactive subway flow map
  const systemStations = [
    { id: 0, title: "University", subtitle: "Root Node", desc: "Select your parent institution (e.g., AKTU, SPPU, VTU).", count: "120+ Hubs", color: "from-blue-500 to-cyan-500" },
    { id: 1, title: "Course", subtitle: "Stream Vector", desc: "Branch out into your field—B.Tech, BCA, B.Com, or BSc.", count: "450+ Streams", color: "from-emerald-500 to-teal-500" },
    { id: 2, title: "Semester", subtitle: "Timeline Index", desc: "Hop into your current cycle to slice curriculum cleanly.", count: "1-8 Tiers", color: "from-amber-500 to-orange-500" },
    { id: 3, title: "Subject", subtitle: "Module Core", desc: "Target explicit domain structures without noisy cross-talk.", count: "3,200+ Books", color: "from-indigo-500 to-purple-500" },
    { id: 4, title: "Unit", subtitle: "Quantum Byte", desc: "Pinpoint micro-chapters containing exact Notes, PYQs & Reels.", count: "15,000+ Units", color: "from-rose-500 to-pink-500" }
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 antialiased selection:bg-emerald-500/10 selection:text-emerald-600">
      
      {/* HEADER SECTION */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md transition-transform group-hover:scale-105">
              <BiSolidBookHeart className="h-5 w-5" />
              <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-xl font-black tracking-tight text-slate-900">
                Lakshay <span className="text-emerald-500 text-[13px]">.IQ</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Smart Learning</span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <Link to="/" className="text-emerald-500 transition-colors">Home</Link>
            <a href="#features" className="hover:text-slate-900 transition-colors">Products</a>
            <a href="#flow" className="hover:text-slate-900 transition-colors">Learning Flow</a>
            <span className="h-4 w-px bg-slate-200" />
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search your university..." 
                className="h-9 w-48 rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs font-normal outline-none transition-all focus:w-60 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-slate-600 font-semibold hover:text-slate-950">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="rounded-full bg-emerald-500 font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all hover:shadow-lg">
              <Link to="/signup">Sign up now</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full">
        
        {/* HERO COMPONENT */}
        <section className="w-full overflow-hidden bg-gradient-to-br from-[#042f24] via-[#03251c] to-[#01140f] text-white shadow-2xl">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:py-24">
            <div className="grid items-center gap-12 md:grid-cols-12 lg:gap-8">
              
              <div className="md:col-span-7 lg:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-emerald-300 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" /> 
                  Lakshay IQ — Smart Learning
                </div>
                
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
                  Every <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Note, PYQ & Video</span> Your Semester Needs
                </h1>
                
                <p className="mt-6 max-w-xl text-base leading-relaxed text-emerald-100/70 sm:text-lg">
                  Every resolution product showcase redesigned, polished, and optimized for a sleek, premium SaaS feel. Access structural notes, organized question banks, and learning resources.
                </p>
                
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Button asChild size="lg" className="rounded-full bg-emerald-500 px-8 font-semibold text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all">
                    <Link to="/signup">Learn more <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>

              {/* Right Hero Graphics */}
              <div className="relative flex items-center justify-center md:col-span-5 lg:col-span-6">
                <div className="relative flex aspect-square w-full max-w-[380px] items-center justify-center rounded-full border-4 border-emerald-500/20 bg-emerald-950/10 p-6 backdrop-blur-sm">
                  <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-emerald-400/40 shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop" 
                      alt="Students studying" 
                      className="absolute inset-0 h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>

                  {/* FLOATING METRICS */}
                  <div className="absolute -left-10 top-12 flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#042a20]/95 p-2.5 shadow-xl backdrop-blur-md">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none text-white">5K+</p>
                      <p className="text-[9px] font-medium text-emerald-400/70 mt-0.5">Online Courses</p>
                    </div>
                  </div>

                  <div className="absolute -right-8 top-1/4 flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#042a20]/95 p-2.5 shadow-xl backdrop-blur-md">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                      <Video className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none text-white">2K+</p>
                      <p className="text-[9px] font-medium text-emerald-400/70 mt-0.5">Video Lessons</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOUNDING CONTAINER */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          
          {/* UNIVERSITY BRANDS MARQUEE */}
          <section className="bg-white py-12 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Indian Universities Supported</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40 grayscale contrast-200">
              <span className="text-sm font-bold tracking-tight text-slate-800">Nramarttaya University</span>
              <span className="text-sm font-bold tracking-tight text-slate-800">University of Pondiangara</span>
              <span className="text-sm font-bold tracking-tight text-slate-800">Dnafiallaga University</span>
            </div>
          </section>

          {/* FEATURES */}
          <section id="features" className="py-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Our Services</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Fostering a playful & engaging learning environment
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group relative rounded-2xl border border-slate-100 bg-emerald-500 p-8 text-left text-white shadow-xl transition-all hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold">Previous Year Papers</h3>
                <p className="mt-3 text-sm leading-relaxed text-emerald-50/90">Exhaustive collection of semester question papers structured by historical year timelines.</p>
              </div>

              <div className="group relative rounded-2xl border border-slate-100 bg-white p-8 text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BookMarked className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">Curated Study Notes</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">Precision subject notes formulated directly from respective university mandates.</p>
              </div>

              <div className="group relative rounded-2xl border border-slate-100 bg-white p-8 text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Video className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">Video Tutorials</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">Visual subject breakdown series maps module-by-module to quickly resolve hurdles.</p>
              </div>
            </div>
          </section>

          {/* UNIQUE ANIMATED SUBWAY/CIRCUIT PIPELINE FLOW */}
          <section id="flow" className="border-t border-slate-100 py-20 relative overflow-hidden">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                <Network className="w-3.5 h-3.5 text-emerald-500" /> Interactive Data Highway
              </span>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-3 sm:text-4xl">
                Lakshay IQ Infrastructure Map
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Hover or touch the hyper-nodes below to inspect how data sequences seamlessly route inside our intelligent repository.
              </p>
            </div>

            <div className="max-w-4xl mx-auto px-4">
              
              {/* THE SUBWAY INTERCONNECTED LINE */}
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 md:gap-0 bg-slate-900/5 p-8 rounded-3xl border border-slate-200/60 backdrop-blur-sm">
                
                {/* Embedded Highlighting Pipeline Line */}
                <div className="absolute top-1/2 left-10 right-10 h-[4px] bg-slate-200 -translate-y-1/2 hidden md:block z-0">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${(activeStation / (systemStations.length - 1)) * 100}%` }}
                  />
                  {/* Energy Particle traveling down the pipeline */}
                  <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-md border-2 border-emerald-500 energy-pulse" />
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
                      {/* Node Station Dot */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 ${
                        isCurrent 
                          ? 'bg-slate-900 border-4 border-emerald-400 text-white scale-125 ring-4 ring-emerald-400/20 shadow-emerald-500/20'
                          : isPast 
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-2 border-white' 
                          : 'bg-white text-slate-400 border-2 border-slate-200 hover:border-slate-400 hover:text-slate-700'
                      }`}>
                        {index + 1}
                      </div>

                      {/* Micro label */}
                      <span className={`mt-3 text-xs font-extrabold tracking-wide uppercase transition-colors duration-200 ${
                        isCurrent ? 'text-slate-900 scale-105' : 'text-slate-400 group-hover:text-slate-600'
                      }`}>
                        {station.title}
                      </span>

                      {/* Active Underline Glow */}
                      {isCurrent && (
                        <div className="absolute -bottom-2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* DYNAMIC TELEMETRY DISPLAY BOX */}
              <div className="mt-8 relative min-h-[160px] rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-100/70 overflow-hidden group">
                {/* Background Grid Pattern Accent */}
                <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                
                {/* Corner Gradient Glow matching active station vector */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-2xl rounded-bl-full transition-all duration-500 ${systemStations[activeStation].color}`} />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 animate-telemetry-fade">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-gradient-to-r text-white shadow-sm ${systemStations[activeStation].color}`}>
                        {systemStations[activeStation].subtitle}
                      </span>
                      <span className="text-xs font-bold text-slate-400">Layer 0{activeStation + 1}</span>
                    </div>

                    <h3 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                      {systemStations[activeStation].title} Segment Architecture
                    </h3>
                    
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 max-w-xl">
                      {systemStations[activeStation].desc}
                    </p>
                  </div>

                  <div className="flex flex-col items-start sm:items-end justify-center border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-8 min-w-[140px]">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {systemStations[activeStation].count}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-500 mt-0.5 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Indexed Nodes
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 mt-16">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="sm:col-span-2">
              <span className="font-sans text-lg font-black tracking-tight text-white">
                Lakshay <span className="text-emerald-400">IQ</span>
              </span>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
                Simplifying Indian collegiate systems by deploying modular study architecture right to structural portals.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform Hierarchy</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="#flow" className="hover:text-white transition-colors">Universities</a></li>
                <li><a href="#flow" className="hover:text-white transition-colors">Courses Offered</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Support</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-1.5"><HelpCircle className="h-3.5 w-3.5" /> Help Center</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Lakshay IQ — Smart University Learning Platform. All rights reserved.
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