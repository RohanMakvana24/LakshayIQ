import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Mail, Lock, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Logo from "@/components/logo/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (profile?.role === "admin") {
        navigate({ to: "/admin" });
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  }, [user, profile, loading, navigate]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error: any) {
      console.log(error);
      toast.error(error.message || "OAuth login failed");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05050a]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Logo theme="dark" size="md" />
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-indigo-500"
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen w-full transition-colors duration-500 ${isDarkMode ? "bg-[#05050a] text-slate-200" : "bg-white text-slate-900"
      }`}>

      {/* --- BACKGROUND ANIMATION LAYER (Global) --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <motion.path
            d="M-100 300 C 200 100, 400 500, 700 300 S 1000 100, 1400 400"
            fill="none"
            stroke={isDarkMode ? "#6366f1" : "#818cf8"}
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M1400 700 C 1100 800, 800 400, 500 700 S 100 900, -100 600"
            fill="none"
            stroke={isDarkMode ? "#f59e0b" : "#fbbf24"}
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.5, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </svg>
      </div>

      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-50 rounded-full p-2.5 shadow-xl transition-all ${isDarkMode ? "bg-slate-900 border border-slate-800 text-amber-400" : "bg-white border border-slate-200 text-indigo-600"
          }`}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* --- Left Side: Visual Experience (Preserving your design) --- */}
      <aside className={`relative hidden w-[55%] flex-col items-center justify-center overflow-hidden lg:flex transition-colors duration-500 ${isDarkMode ? "border-r border-white/5 bg-[#05050a]" : "border-r border-slate-200 bg-slate-50"
        }`}>

        {/* Animated Orbs */}
        <div className={`absolute top-1/4 -left-20 h-96 w-96 rounded-full blur-[120px] opacity-20 animate-pulse ${isDarkMode ? "bg-indigo-600" : "bg-indigo-400"}`} />
        <div className={`absolute bottom-1/4 -right-20 h-96 w-96 rounded-full blur-[120px] opacity-10 ${isDarkMode ? "bg-amber-600" : "bg-amber-400"}`} />

        <div className="relative z-10 w-full max-w-2xl px-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-bold uppercase tracking-widest ${isDarkMode ? "border-amber-500/20 bg-amber-500/5 text-amber-400" : "border-indigo-500/20 bg-indigo-50 text-indigo-700"
              }`}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-current"></span>
              </span>
              Intelligence Evolved
            </div>

            <h2 className="text-6xl font-black leading-tight tracking-tighter">
              Navigate your <br />
              <span className="bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-amber-400 bg-clip-text text-transparent">
                Academic Journey.
              </span>
            </h2>

            <p className="max-w-md text-lg leading-relaxed text-slate-500">
              Access hyper-curated resources for 6+ universities. Every unit,
              every subject, delivered through an AI-enhanced experience.
            </p>

            {/* Your Bento-style Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { label: "Materials", value: "12K+" },
                { label: "Subjects", value: "1.8K" },
                { label: "Active Users", value: "50K+" },
              ].map((stat, i) => (
                <div key={i} className={`rounded-2xl border p-5 transition-all ${isDarkMode ? "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}>
                  <div className={`text-2xl font-black ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>{stat.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </aside>

      {/* --- Right Side: Login Panel --- */}
      <section className="relative flex flex-1 flex-col items-center justify-center p-6 lg:p-12">
        <div className="relative z-10 w-full max-w-[420px]">
          <div className="mb-10 flex flex-col items-center text-center lg:items-start lg:text-left">
            <Link to="/" className="mb-8 block">
              <Logo theme={isDarkMode ? "dark" : "light"} size="md" />
            </Link>
            <h1 className="text-3xl font-black tracking-tight">Welcome back</h1>
            <p className="mt-2 text-slate-500">Enter your credentials to continue learning.</p>
          </div>

          <form className="space-y-5" onSubmit={handleEmailLogin}>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest ml-1 text-slate-500">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className={`h-14 border-2 pl-12 rounded-xl transition-all ${isDarkMode ? "border-white/5 bg-white/[0.03] focus:border-indigo-500/50" : "border-slate-100 bg-slate-50 focus:border-indigo-500/50"
                    }`}
                  placeholder="name@university.ac.in"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Password</Label>
                <Link className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className={`h-14 border-2 pl-12 rounded-xl transition-all ${isDarkMode ? "border-white/5 bg-white/[0.03] focus:border-indigo-500/50" : "border-slate-100 bg-slate-50 focus:border-indigo-500/50"
                    }`}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className={`h-14 w-full font-black rounded-xl shadow-lg transition-transform active:scale-95 ${isDarkMode ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white" : "bg-slate-900 text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                {isSubmitting ? "Signing in..." : "Sign In to Dashboard"} <ArrowRight size={18} />
              </span>
            </Button>
          </form>

          {/* Social Divider */}
          <div className="relative my-10 flex items-center">
            <div className="h-px flex-1 bg-slate-500/20"></div>
            <span className="mx-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Secure Access</span>
            <div className="h-px flex-1 bg-slate-500/20"></div>
          </div>

          {/* Redesigned Google Button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            variant="outline"
            className={`h-14 w-full border-2 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm ${isDarkMode
              ? "border-white/10 bg-white/[0.02] text-slate-200 hover:bg-white/[0.06] hover:text-white"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
          >
            <svg className="h-5 w-5 min-w-[20px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>Continue with Google</span>
          </Button>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account? <Link className="font-bold text-amber-500 hover:underline">Create one now</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
