import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowRight, Database, Layers, Milestone, PlayCircle, FileText, ArrowUpRight, Sparkles, Mail, Lock, Sun, Moon } from "lucide-react";
import { BiSolidBookHeart } from "react-icons/bi";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log In to Your Account — Lakshay IQ" }] }),
  component: Login,
});

function Login() {
  const { user, role, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!authLoading && user && role) {
      nav({ to: role === "admin" ? "/admin" : "/student" });
    }
  }, [user, role, authLoading, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    setLoading(false);
    
    if (error) {
      // If login fails, check if this email exists in profiles (might be a Google-only account)
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email.trim().toLowerCase())
          .maybeSingle();

        if (existingProfile) {
          toast.error("Wrong password, or this account was created with Google. Try using Google Sign-in above.", { duration: 5000 });
        } else {
          toast.error("No account found with this email. Please sign up first.", { duration: 5000 });
        }
      } else {
        toast.error(error.message);
      }
      return; 
    }
    
    toast.success("Welcome back!");
  };

  const onGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) toast.error(error.message || "Could not sign in with Google");
  };
  return (
    <div className={`grid min-h-screen w-full font-sans antialiased md:grid-cols-12 selection:bg-emerald-500/10 selection:text-emerald-400 transition-colors duration-500 ${
      isDarkMode ? "bg-[#090c12] text-slate-100" : "bg-[#fafafa] text-slate-800"
    }`}>
      
      {/* LEFT COLUMN: CRISP STRUCTURED ACADEMIC LOG IN PORTAL */}
      <div className={`relative z-10 flex flex-col justify-between p-6 sm:p-10 md:col-span-6 lg:col-span-5 xl:col-span-4 border-r transition-all duration-500 ${
        isDarkMode 
          ? "bg-[#0b0f19] border-slate-900 shadow-2xl shadow-emerald-950/10" 
          : "bg-white border-slate-200/60 shadow-xl shadow-slate-100"
      }`}>
        
        {/* Decorative Top Accent Glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-48 rounded-full blur-[100px] pointer-events-none animate-pulse transition-all duration-500 ${
          isDarkMode ? "bg-emerald-500/10" : "bg-emerald-500/5"
        }`} />
        
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="relative flex h-11 w-11 items-center justify-center">
              {/* Spinning futuristic outer orbit ring */}
              <div className={`absolute inset-0 rounded-full border border-t-transparent animate-[spin_4s_linear_infinite] transition-colors duration-500 ${
                isDarkMode ? "border-emerald-500/35" : "border-emerald-500/50"
              }`} />
              <div className={`absolute inset-0 rounded-full border transition-colors duration-500 ${
                isDarkMode ? "border-teal-500/15" : "border-teal-500/20"
              }`} />
              
              {/* Inner glowing core background */}
              <div className="absolute inset-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-12 flex items-center justify-center">
                {/* Core original Book Heart Icon */}
                <BiSolidBookHeart className="h-5 w-5 text-white" />
                {/* Little emerald notification dot */}
                <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border shadow-sm transition-colors duration-500 ${
                  isDarkMode ? "border-slate-900" : "border-white"
                }`} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`text-base font-black tracking-tight leading-tight group-hover:text-emerald-400 transition-colors duration-300 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`} style={{ fontFamily: "'Unbounded', sans-serif", letterSpacing: "-0.02em" }}>
                Lakshay<span className="text-emerald-400 text-[12px] font-black">.IQ</span>
              </span>
              <span className={`text-[8px] font-bold uppercase tracking-widest leading-none transition-colors duration-500 ${
                isDarkMode ? "text-slate-500" : "text-slate-400"
              }`}>Smart Platform</span>
            </div>
          </Link>

          {/* Elegant Dark/Light Toggle Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`h-9 w-9 rounded-lg border transition-all duration-300 hover:scale-105 active:scale-95 ${
              isDarkMode 
                ? "border-slate-800 bg-slate-900/60 text-yellow-400 hover:bg-slate-800/80 hover:text-yellow-350" 
                : "border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {isDarkMode ? (
              <Sun className="h-4.5 w-4.5 animate-[spin_12s_linear_infinite]" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-slate-700" />
            )}
          </Button>
        </div>

        {/* Core Gateway Form Layout */}
        <div className="my-auto w-full max-w-[340px] mx-auto py-10">
          <div className="space-y-2.5">
            <div className={`inline-flex items-center gap-1.5 rounded-lg text-[10px] font-bold tracking-widest border px-3 py-1 uppercase shadow-sm transition-all duration-500 ${
              isDarkMode 
                ? "bg-emerald-950/50 text-emerald-400 border-emerald-900/50 shadow-emerald-500/5" 
                : "bg-slate-950 text-emerald-400 border-slate-800 shadow-slate-950/5"
            }`}>
              <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" /> Welcome Back
            </div>
            <h1 className={`text-3xl font-black tracking-tight transition-colors duration-500 ${
              isDarkMode ? "text-white" : "text-slate-950"
            }`}>Log In</h1>
            <p className={`text-xs font-semibold leading-relaxed transition-colors duration-500 ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              Sign in to resume tracking your academic syllabus matrix, learning objectives, and custom exam papers.
            </p>
          </div>

          {/* Google Signin Provider */}
          <Button 
            onClick={onGoogle} 
            variant="outline" 
            className={`mt-6 w-full h-12 rounded-lg font-extrabold shadow-sm transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] ${
              isDarkMode 
                ? "border-slate-805 bg-slate-900 hover:bg-slate-850 hover:border-slate-700 text-slate-200" 
                : "border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-950 hover:border-emerald-500 text-slate-700"
            }`}
          >
            <svg className="mr-2.5 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.67-2.26 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Sign in with Google
          </Button>

          <div className="relative my-6 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span className={`absolute inset-x-0 h-px transition-colors duration-500 ${
              isDarkMode ? "bg-slate-800/40" : "bg-slate-100"
            }`} />
            <span className={`relative px-3 text-[9px] transition-colors duration-500 ${
              isDarkMode ? "bg-[#0b0f19]" : "bg-white text-slate-400"
            }`}>Security Credentials</span>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email Address Field */}
            <div className="space-y-2 group/field">
              <Label 
                htmlFor="email" 
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors duration-300 group-focus-within/field:text-emerald-400 flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" /> Email Address
              </Label>
              <div className={`relative rounded-lg border transition-all duration-300 overflow-hidden shadow-inner ${
                isDarkMode 
                  ? "border-slate-800 bg-slate-950/40 group-focus-within/field:border-emerald-500/60" 
                  : "border-slate-200 bg-slate-50/50 group-focus-within/field:border-emerald-500"
              }`}>
                <div className={`relative flex items-center transition-all duration-300 ${
                  isDarkMode 
                    ? "bg-slate-950/20 group-focus-within/field:bg-slate-950/60" 
                    : "group-focus-within/field:bg-white"
                }`}>
                  <div className="pl-4 text-slate-500 group-focus-within/field:text-emerald-400 transition-colors duration-300">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    placeholder="name@email.com" 
                    className={`w-full h-12 bg-transparent pl-3 pr-4 text-sm font-semibold outline-none border-0 focus:ring-0 focus:outline-none transition-colors duration-500 ${
                      isDarkMode ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"
                    }`}
                  />
                </div>
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-2 group/field">
              <div className="flex items-center justify-between">
                <Label 
                  htmlFor="password" 
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors duration-300 group-focus-within/field:text-emerald-400 flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5" /> Password
                </Label>
              </div>
              <div className={`relative rounded-lg border transition-all duration-300 overflow-hidden shadow-inner ${
                isDarkMode 
                  ? "border-slate-800 bg-slate-950/40 group-focus-within/field:border-emerald-500/60" 
                  : "border-slate-200 bg-slate-50/50 group-focus-within/field:border-emerald-500"
              }`}>
                <div className={`relative flex items-center transition-all duration-300 ${
                  isDarkMode 
                    ? "bg-slate-950/20 group-focus-within/field:bg-slate-950/60" 
                    : "group-focus-within/field:bg-white"
                }`}>
                  <div className="pl-4 text-slate-500 group-focus-within/field:text-emerald-400 transition-colors duration-300">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    placeholder="••••••••" 
                    className={`w-full h-12 bg-transparent pl-3 pr-10 text-sm font-semibold outline-none border-0 focus:ring-0 focus:outline-none transition-colors duration-500 ${
                      isDarkMode ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-500 hover:text-slate-350 transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || authLoading}
              className="w-full h-12 mt-6 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-extrabold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 text-sm"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-white" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Access Dashboard <ArrowRight className="h-4 w-4 text-white" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs font-semibold text-slate-500">
            Don't have an account yet?{" "}
            <Link to="/signup" className={`font-bold transition-colors ${
              isDarkMode ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"
            } hover:underline`}>
              Create an account
            </Link>
          </p>
        </div>

        {/* Notice Info Container */}
        <div className={`rounded-xl border p-3.5 text-center backdrop-blur-md transition-all duration-500 ${
          isDarkMode 
            ? "bg-slate-900/40 border-slate-800/80 text-slate-500" 
            : "bg-slate-50 border-slate-150 text-slate-400"
        }`}>
          <p className="text-[10px] font-bold leading-normal uppercase tracking-wider">
            🔒 Protected Ecosystem. Default credentials grant secure structural privileges.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: CINEMATIC BENTO PLATFORM FLOW PREVIEW */}
      <div className="relative hidden md:flex md:col-span-6 lg:col-span-7 xl:col-span-8 bg-[#090c12] overflow-hidden items-center justify-center p-8 lg:p-12">
        <style>{`
          @keyframes node-glow {
            0%, 15% {
              border-color: rgba(16, 185, 129, 0.9);
              box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
              background-color: rgba(16, 185, 129, 0.08);
              transform: translateY(-4px) scale(1.02);
            }
            20%, 100% {
              border-color: rgba(30, 41, 59, 0.6);
              box-shadow: none;
              background-color: rgba(15, 23, 42, 0.5);
              transform: translateY(0) scale(1);
            }
          }
          @keyframes step-pulse {
            0%, 15% {
              background-color: #10b981;
              color: #ffffff;
              box-shadow: 0 0 10px #10b981;
              border-color: #10b981;
            }
            20%, 100% {
              background-color: rgb(15 23 42);
              color: #10b981;
              border-color: rgb(30 41 59);
            }
          }
          @keyframes bento-float-1 {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(0.2deg); }
          }
          @keyframes bento-float-2 {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-12px) rotate(-0.3deg); }
          }
          @keyframes bento-float-3 {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-6px) rotate(0.1deg); }
          }
          @keyframes ambient-glow {
            0%, 100% { opacity: 0.1; transform: scale(1); }
            50% { opacity: 0.18; transform: scale(1.08); }
          }
          .animate-node-1 { animation: node-glow 8s infinite 0s ease-in-out; }
          .animate-node-2 { animation: node-glow 8s infinite 1.3s ease-in-out; }
          .animate-node-3 { animation: node-glow 8s infinite 2.6s ease-in-out; }
          .animate-node-4 { animation: node-glow 8s infinite 3.9s ease-in-out; }
          .animate-node-5 { animation: node-glow 8s infinite 5.2s ease-in-out; }
          .animate-node-6 { animation: node-glow 8s infinite 6.5s ease-in-out; }

          .step-dot-1 { animation: step-pulse 8s infinite 0s ease-in-out; }
          .step-dot-2 { animation: step-pulse 8s infinite 1.3s ease-in-out; }
          .step-dot-3 { animation: step-pulse 8s infinite 2.6s ease-in-out; }
          .step-dot-4 { animation: step-pulse 8s infinite 3.9s ease-in-out; }
          .step-dot-5 { animation: step-pulse 8s infinite 5.2s ease-in-out; }
          .step-dot-6 { animation: step-pulse 8s infinite 6.5s ease-in-out; }

          .animate-float-1 { animation: bento-float-1 7s ease-in-out infinite; }
          .animate-float-2 { animation: bento-float-2 9s ease-in-out infinite; }
          .animate-float-3 { animation: bento-float-3 8s ease-in-out infinite; }
          .animate-ambient-pulse-1 { animation: ambient-glow 10s ease-in-out infinite; }
          .animate-ambient-pulse-2 { animation: ambient-glow 12s ease-in-out infinite -2s; }
        `}</style>
        
        {/* Subtle Engineering Grid Layer */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#131a26_1px,transparent_1px),linear-gradient(to_bottom,#131a26_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        
        {/* Soft Accent Radial Glows */}
        <div className="absolute -bottom-24 -right-24 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none animate-ambient-pulse-1" />
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[110px] pointer-events-none animate-ambient-pulse-2" />

        {/* Content Hierarchy Bento System */}
        <div className="relative z-10 w-full max-w-2xl grid grid-cols-12 gap-4">
          
          {/* Main Bento Box: Platform Core Database Flow View */}
          <div className="col-span-12 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 backdrop-blur-xl shadow-2xl space-y-4 animate-float-1">
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
                <div 
                  key={idx} 
                  className={`relative p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex flex-col justify-center items-center group hover:border-emerald-500/40 transition-all duration-500 animate-node-${idx + 1}`}
                >
                  <div className={`h-5 w-5 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 mb-1.5 group-hover:bg-slate-900 transition-all duration-500 step-dot-${idx + 1}`}>
                    {idx + 1}
                  </div>
                  <span className="text-slate-100 font-sans tracking-tight block font-extrabold">{step.name}</span>
                  <span className="text-[8px] text-slate-500 font-medium mt-0.5 leading-none block">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Left Sub-Bento Card: Admin Control Center Profile */}
          <div className="col-span-12 sm:col-span-7 rounded-2xl border border-slate-800/60 bg-slate-900/30 p-5 backdrop-blur-xl flex flex-col justify-between group hover:bg-slate-900/50 transition-all duration-300 animate-float-2">
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
          <div className="col-span-12 sm:col-span-5 rounded-2xl border border-slate-800/60 bg-gradient-to-br from-emerald-950/20 to-slate-900/30 p-5 backdrop-blur-xl flex flex-col justify-between hover:border-emerald-800/30 transition-all duration-300 animate-float-3">
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