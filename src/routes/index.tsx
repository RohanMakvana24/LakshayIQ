import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Video, 
  Bookmark, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Search,
  Globe,
  Layers,
  BookMarked,
  Download,
  HelpCircle,
  ChevronRight,
  BookAlert
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
  
  useEffect(() => {
    if (!loading && user && role) {
      nav({ to: role === "admin" ? "/admin" : "/student" });
    }
  }, [user, role, loading, nav]);

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
        
        {/* FULL SCREEN HERO COMPONENT - STRETCHES COMPLETELY EDGE-TO-EDGE */}
        <section className="w-full overflow-hidden bg-gradient-to-br from-[#042f24] via-[#03251c] to-[#01140f] text-white shadow-2xl">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:py-24">
            <div className="grid items-center gap-12 md:grid-cols-12 lg:gap-8">
              
              {/* Left Content Column */}
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

              {/* Right Image/Circle Framework Column */}
              <div className="relative flex items-center justify-center md:col-span-5 lg:col-span-6">
                {/* Main Outer Geometric Circle Layer */}
                <div className="relative flex aspect-square w-full max-w-[380px] items-center justify-center rounded-full border-4 border-emerald-500/20 bg-emerald-950/10 p-6 backdrop-blur-sm">
                  
                  {/* INNER IMAGE CONTAINER - PERFECT RECTANGLE OVERRIDE TO CIRCLE */}
                  <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-emerald-400/40 shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop" 
                      alt="Students studying collaboratively" 
                      className="absolute inset-0 h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>

                  {/* FLOATING METRIC 1: 5K+ Online Courses */}
                  <div className="absolute -left-10 top-12 flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#042a20]/95 p-2.5 shadow-xl backdrop-blur-md">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none text-white">5K+</p>
                      <p className="text-[9px] font-medium text-emerald-400/70 mt-0.5">Online Courses</p>
                    </div>
                  </div>

                  {/* FLOATING METRIC 2: 2K+ Video Lessons */}
                  <div className="absolute -right-8 top-1/4 flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#042a20]/95 p-2.5 shadow-xl backdrop-blur-md">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                      <Video className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none text-white">2K+</p>
                      <p className="text-[9px] font-medium text-emerald-400/70 mt-0.5">Video Lessons</p>
                    </div>
                  </div>

                  {/* FLOATING METRIC 3: 5K+ Learning Materials */}
                  <div className="absolute -left-6 bottom-10 flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#042a20]/95 p-2.5 shadow-xl backdrop-blur-md">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none text-white">5K+</p>
                      <p className="text-[9px] font-medium text-emerald-400/70 mt-0.5">Materials</p>
                    </div>
                  </div>

                  {/* FLOATING METRIC 4: 250+ Tutors */}
                  <div className="absolute -right-4 bottom-16 flex items-center gap-2.5 rounded-xl border border-white/5 bg-[#042a20]/95 p-2.5 shadow-xl backdrop-blur-md">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none text-white">250+</p>
                      <p className="text-[9px] font-medium text-emerald-400/70 mt-0.5">Expert Tutors</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* REST OF CONTENT AREAS TIED INSIDE BOUNDING BOX CONTAINER */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          
          {/* TRUSTED PLATFORMS SECTION */}
          <section className="bg-white py-12 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Indian Universities Supported</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40 grayscale contrast-200">
              <span className="text-sm font-bold tracking-tight text-slate-800">Nramarttaya University</span>
              <span className="text-sm font-bold tracking-tight text-slate-800">University of Pondiangara</span>
              <span className="text-sm font-bold tracking-tight text-slate-800">Dnafiallaga University</span>
              <span className="text-sm font-bold tracking-tight text-slate-800">Sedtramn & Technology</span>
              <span className="text-sm font-bold tracking-tight text-slate-800">University of Bainarom</span>
            </div>
          </section>

          {/* CORE PLATFORM MODULES SECTION */}
          <section id="features" className="py-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Our Services</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Fostering a playful & engaging learning environment
            </h2>
            
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* CARD 1: PYQ Grid Component */}
              <div className="group relative rounded-2xl border border-slate-100 bg-emerald-500 p-8 text-left text-white shadow-xl transition-all hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold">Previous Year Papers</h3>
                <p className="mt-3 text-sm leading-relaxed text-emerald-50/90">
                  Exhaustive collection of semester question papers structured by historical year timelines, tracking exact distribution models.
                </p>
                <Link to="/signup" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:underline">
                  Learn More <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* CARD 2: Notes Grid Component */}
              <div className="group relative rounded-2xl border border-slate-100 bg-white p-8 text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BookMarked className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">Curated Study Notes</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Precision subject notes formulated directly from respective university mandates to secure clear insight on major scoring concepts.
                </p>
                <Link to="/signup" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-500 group-hover:underline">
                  Learn More <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* CARD 3: Video Grid Component */}
              <div className="group relative rounded-2xl border border-slate-100 bg-white p-8 text-left shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Video className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">Video Tutorials</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  Visual subject breakdown series maps module-by-module to quickly resolve structural learning hurdles prior to finals.
                </p>
                <Link to="/signup" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-500 group-hover:underline">
                  Learn More <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>

          {/* ACADEMIC ARCHITECTURE FLOW SECTION */}
          <section id="flow" className="border-t border-slate-100 py-16">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Lakshay IQ Flow</h2>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {[
                { title: "University", active: false },
                { title: "Course", active: true },
                { title: "Semester", active: false },
                { title: "Subject", active: false },
                { title: "Unit", active: false }
              ].map((step, idx) => (
                <div key={step.title} className="flex items-center gap-3">
                  <div className={`flex items-center gap-4 rounded-xl border px-6 py-4 shadow-sm transition-all ${
                    step.active ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-600/10" : "bg-white text-slate-800"
                  }`}>
                    <div className={`h-6 w-6 flex items-center justify-center rounded-lg text-xs font-bold ${
                      step.active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="font-sans text-sm font-bold tracking-wide">{step.title}</span>
                  </div>
                  {idx < 4 && <ChevronRight className="h-5 w-5 text-slate-300 hidden md:block" />}
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* FOOTER SECTION */}
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
                <li><a href="#flow" className="hover:text-white transition-colors">Semester Systems</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Support</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-1.5"><HelpCircle className="h-3.5 w-3.5" /> Help Center</li>
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Lakshay IQ — Smart University Learning Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
