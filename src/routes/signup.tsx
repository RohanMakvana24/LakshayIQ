import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowRight, ShieldCheck, Database, Layers, Milestone, PlayCircle, FileText, ArrowUpRight, Sparkles } from "lucide-react";
import { BiSolidBookHeart } from "react-icons/bi";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create Your Account — Lakshay IQ" }] }),
  component: Signup,
});

function Signup() {
  const { user, role, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && role) {
      nav({ to: role === "admin" ? "/admin" : "/student" });
    }
  }, [user, role, authLoading, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! Please check your email to confirm, then log in.", { duration: 6000 });
    nav({ to: "/login" });
  };

  const onGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error("Could not sign in with Google");
  };

  return (
    <div className="grid min-h-screen w-full bg-[#fafafa] font-sans text-slate-800 antialiased md:grid-cols-12 selection:bg-emerald-500/10 selection:text-emerald-600">
      
      {/* LEFT COLUMN: CRISP STRUCTURED ACADEMIC REGISTRATION PORTAL */}
      <div className="relative z-10 flex flex-col justify-between p-6 sm:p-10 md:col-span-6 lg:col-span-5 xl:col-span-4 bg-white border-r border-slate-200/60 shadow-xl shadow-slate-100">
        
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-72 h-40 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Brand Header (Restored Original Layout) */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/10 transition-transform group-hover:scale-105">
              <BiSolidBookHeart className="h-4.5 w-4.5" />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-slate-900 leading-tight">
                Lakshay <span className="text-emerald-500 text-[11px]">.IQ</span>
              </span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 leading-none">Smart Platform</span>
            </div>
          </Link>
        </div>

        {/* Core Gateway Form Layout */}
        <div className="my-auto w-full max-w-[340px] mx-auto py-10">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 text-[10px] font-bold tracking-wider text-emerald-400 border border-slate-800 px-2.5 py-1 uppercase">
              <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" /> Student Registration
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Create Account</h1>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              Get immediate access to customized academic syllabus tracks, learning content units, and papers.
            </p>
          </div>

          {/* Google Signup Provider */}
          <Button 
            onClick={onGoogle} 
            variant="outline" 
            className="mt-6 w-full h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-950 hover:border-slate-300"
          >
            <svg className="mr-2.5 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.67-2.26 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Sign up with Google
          </Button>

          <div className="relative my-6 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="absolute inset-x-0 h-px bg-slate-100" />
            <span className="relative bg-white px-3 text-[9px]">Registration Fields</span>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</Label>
              <Input 
                id="name" 
                type="text"
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
                placeholder="John Doe" 
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all focus-visible:border-emerald-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-500/5 placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="name@email.com" 
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all focus-visible:border-emerald-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-500/5 placeholder:text-slate-400"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength={6}
                  placeholder="••••••••" 
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pl-3.5 pr-10 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all focus-visible:border-emerald-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-500/5 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 mt-4 rounded-xl bg-slate-950 font-bold text-white shadow-lg shadow-slate-950/10 transition-all hover:bg-slate-900 active:scale-[0.99] disabled:opacity-70 text-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-emerald-400" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Free Account <ArrowRight className="h-4 w-4 text-emerald-400" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs font-semibold text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
              Log in instead
            </Link>
          </p>
        </div>

        {/* Notice Info Container */}
        <div className="rounded-xl bg-slate-50 border border-slate-150 p-3.5 text-center">
          <p className="text-[10px] font-bold text-slate-400 leading-normal uppercase tracking-wider">
            Need Admin Privileges? Register as a student first, then request workspace parameters from an active administrator platform key.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: CINEMATIC BENTO PLATFORM FLOW PREVIEW */}
      <div className="relative hidden md:flex md:col-span-6 lg:col-span-7 xl:col-span-8 bg-[#090c12] overflow-hidden items-center justify-center p-8 lg:p-12">
        
        {/* Subtle Engineering Grid Layer */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#131a26_1px,transparent_1px),linear-gradient(to_bottom,#131a26_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        
        {/* Soft Accent Radial Glows */}
        <div className="absolute -bottom-24 -right-24 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[110px] pointer-events-none" />

        {/* Content Hierarchy Bento System */}
        <div className="relative z-10 w-full max-w-2xl grid grid-cols-12 gap-4">
          
          {/* Main Bento Box: Platform Core Database Flow View */}
          <div className="col-span-12 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">System Architecture Flow</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40 font-bold">
                SCALABLE RELATIONSHIPS
              </span>
            </div>

            {/* Visual Content Path Graph */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center pt-1 font-mono text-[10px] font-bold text-slate-300">
              {[
                { name: "University", label: "Root Context" },
                { name: "Course", label: "Branch Degree" },
                { name: "Semester", label: "Term Matrix" },
                { name: "Subject", label: "Knowledge Node" },
                { name: "Unit", label: "Resource Pack" },
                { name: "Content", label: "Target Learning" }
              ].map((step, idx) => (
                <div key={idx} className="relative p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex flex-col justify-center items-center group hover:border-emerald-500/40 transition-colors">
                  <div className="h-5 w-5 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-1.5 group-hover:bg-slate-900 transition-colors">
                    {idx + 1}
                  </div>
                  <span className="text-slate-100 font-sans tracking-tight block font-extrabold">{step.name}</span>
                  <span className="text-[8px] text-slate-500 font-medium mt-0.5 leading-none block">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Left Sub-Bento Card: Admin Control Center Profile */}
          <div className="col-span-12 sm:col-span-7 rounded-2xl border border-slate-800/60 bg-slate-900/30 p-5 backdrop-blur-xl flex flex-col justify-between group hover:bg-slate-900/50 transition-all duration-300">
            <div className="space-y-2">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-900/40">
                <Layers className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">Advanced Admin Ecosystem</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Empowers administrative roles with robust content management engines to inject papers, manage systems, and dynamically edit curriculum structures.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-400 pt-2 border-t border-slate-800/40">
              <Milestone className="h-3 w-3 text-emerald-400" />
              <span>ROLE DASHBOARDS STATUS:</span>
              <span className="text-emerald-400 uppercase tracking-wider">SYNCED & READY</span>
            </div>
          </div>

          {/* Right Sub-Bento Card: Active Integration Systems */}
          <div className="col-span-12 sm:col-span-5 rounded-2xl border border-slate-800/60 bg-gradient-to-br from-emerald-950/20 to-slate-900/30 p-5 backdrop-blur-xl flex flex-col justify-between hover:border-emerald-800/30 transition-all duration-300">
            <div className="space-y-2.5">
              <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 uppercase block">Active Repositories</span>
              
              <div className="space-y-2">
                {[
                  { name: "Previous Year Papers System", icon: FileText },
                  { name: "Video Learning Stream Engine", icon: PlayCircle }
                ].map((sys, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/40 text-xs font-semibold text-slate-300">
                    <div className="flex items-center gap-2">
                      <sys.icon className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="truncate max-w-[140px] font-sans">{sys.name}</span>
                    </div>
                    <ArrowUpRight className="h-3 w-3 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal mt-3">
              Optimized components handling heavy downloads and complex material assets cleanly.
            </p>
          </div>

        </div>

      </div>
      
    </div>
  );
}
