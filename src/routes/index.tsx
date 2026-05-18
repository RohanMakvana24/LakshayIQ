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
  HelpCircle
} from "lucide-react";

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
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md transition-transform group-hover:scale-105">
              <GraduationCap className="h-5 w-5" />
              <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-amber-400 border-2 border-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Lakshay <span className="text-emerald-500">IQ</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Smart Learning</span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <Link to="/" className="text-emerald-500 transition-colors">Home</Link>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#flow" className="hover:text-slate-900 transition-colors">Academic Flow</a>
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
            <Button asChild variant="ghost" className="text-slate-600 hover:text-slate-950">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="rounded-full bg-emerald-500 font-medium text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all hover:shadow-lg hover:shadow-emerald-500/30">
              <Link to="/signup">Create free account</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6">
        {/* HERO SECTION */}
        <section className="grid items-center gap-12 py-12 md:grid-cols-12 md:py-20 lg:gap-8">
          <div className="md:col-span-7 lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-pulse" /> 
              Built for Indian University Students
            </div>
            
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl md:text-5xl lg:text-6xl">
              Up Your <span className="text-emerald-500">Skills</span> To <span className="underline decoration-emerald-400 decoration-wavy decoration-2 underline-offset-4">Advance</span> Your Career Path
            </h1>
            
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
              Access structural notes, organized PYQs, video lessons, and curriculum guidelines compiled specifically for your regional university system. Organised exactly the way you study.
            </p>
            
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="rounded-full bg-emerald-500 px-8 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all hover:-translate-y-0.5">
                <Link to="/signup">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-slate-200 bg-white px-8 text-slate-600 hover:bg-slate-50 shadow-sm">
                <Link to="/login">Get free trial</Link>
              </Button>
            </div>
            
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 pt-8 text-sm text-slate-400">
              <span className="flex items-center gap-2 font-medium text-slate-500">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-500"><ShieldCheck className="h-3.5 w-3.5" /></span> 
                Verified Curriculum
              </span>
              <span className="flex items-center gap-2 font-medium text-slate-500">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-50 text-purple-500"><Bookmark className="h-3.5 w-3.5" /></span> 
                Career-Oriented Materials
              </span>
            </div>
          </div>

          {/* DYNAMIC HERO IMAGE & FLOATING METRICS */}
          <div className="relative flex items-center justify-center md:col-span-5 lg:col-span-6">
            <div className="relative w-full max-w-[460px] aspect-square flex items-center justify-center">
              {/* Giant Background Organic Circle */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 opacity-90 shadow-2xl shadow-emerald-500/20" />
              
              {/* Radial Accent Rings */}
              <div className="absolute -inset-4 rounded-full border border-dashed border-slate-200/80 animate-[spin_120s_linear_infinite]" />
              <div className="absolute -inset-12 rounded-full border border-slate-100/60" />
              
              {/* Main Cutout Display Container (Rounded Fix Handled Here) */}
              <div className="absolute bottom-4 overflow-hidden rounded-b-full w-[85%] h-[90%] flex items-end justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop" 
                  alt="Student representative showcasing achievement" 
                  className="w-full h-full object-cover object-top scale-105 brightness-[1.02] contrast-[1.02] rounded-b-full"
                />
              </div>

              {/* FLOATING BADGE 1: 5K+ Online Courses */}
              <div className="absolute -right-2 top-10 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl transition-transform hover:scale-105">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <BookOpen className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <p className="text-base font-bold leading-none text-slate-900">5K+</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-1">Online Courses</p>
                </div>
              </div>

              {/* FLOATING BADGE 2: 2K+ Video Lessons */}
              <div className="absolute -left-6 top-1/3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl transition-transform hover:scale-105">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-bold leading-none text-slate-900">2K+</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-1">Video Lessons</p>
                </div>
              </div>

              {/* FLOATING BADGE 3: Tutors 250+ */}
              <div className="absolute bottom-16 -right-6 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl transition-transform hover:scale-105">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-bold leading-none text-slate-900">250+</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-1">Expert Tutors</p>
                </div>
              </div>
              
              {/* Floating Decorative Circle */}
              <div className="absolute bottom-6 left-6 h-6 w-6 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/20" />
            </div>
          </div>
        </section>

        {/* TRUSTED PLATFORMS / COLLABORATION BAR */}
        <section className="border-y border-slate-100 bg-white py-10 -mx-6 px-6">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-xl font-black text-slate-900">250+</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Collaborations</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40 grayscale contrast-200">
              <span className="text-lg font-bold tracking-tight text-slate-800">duolingo</span>
              <span className="text-lg font-bold tracking-tight text-slate-800">◇ Codecov</span>
              <span className="text-lg font-bold tracking-tight text-slate-800">[User Testing]</span>
              <span className="text-lg font-bold tracking-tight text-slate-800">magic leap</span>
            </div>
          </div>
        </section>

        {/* CORE PLATFORM MODULES SECTION */}
        <section id="features" className="py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Our Services</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Fostering a playful & engaging learning environment
          </h2>
          
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* CARD 1: Interaction Design / PYQs */}
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

            {/* CARD 2: Course Systems */}
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

            {/* CARD 3: Video learning */}
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
          
          {/* Carousel indicators */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <span className="h-2 w-6 rounded-full bg-emerald-500" />
            <span className="h-2 w-2 rounded-full bg-slate-200" />
            <span className="h-2 w-2 rounded-full bg-slate-200" />
          </div>
        </section>

        {/* ACADEMIC ARCHITECTURE FLOW SECTION */}
        <section id="flow" className="border-t border-slate-100 py-20">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">STRUCTURED PIPELINE</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">The Lakshay IQ Flow</h2>
            <p className="mt-3 max-w-2xl text-base text-slate-500">
              Navigate your academic ecosystem dynamically through a robust hierarchy engineered to map direct student requirements.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {[
              { title: "University", icon: Globe, desc: "Select institutional hub" },
              { title: "Course", icon: Layers, desc: "Isolate precise branch degree" },
              { title: "Semester", icon: BookOpen, desc: "Identify active term track" },
              { title: "Subject", icon: BookMarked, desc: "Target targeted syllabus courses" },
              { title: "Unit", icon: Download, desc: "Extract specific study material" }
            ].map((step, idx) => (
              <div key={step.title} className="group relative rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Step 0{idx + 1}</div>
                  <div className="text-xs font-bold text-slate-300">{((idx + 1) * 20)}% Grid</div>
                </div>
                <div className="mt-4 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600">
                  <step.icon className="h-4 w-4" />
                </div>
                <p className="mt-4 font-sans text-base font-bold text-slate-900">{step.title}</p>
                <p className="mt-1 text-xs text-slate-400 leading-normal">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-slate-900 text-slate-400">
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
