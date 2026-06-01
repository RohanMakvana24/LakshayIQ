import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowRight, Sparkles, Lock, Sun, Moon, ShieldAlert } from "lucide-react";
import { BiSolidBookHeart } from "react-icons/bi";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Your Password — Lakshay IQ" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
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

  // Check if we have a valid password reset token session
  useEffect(() => {
    const checkSession = async () => {
      // Supabase recovers the session from hash parameters automatically on load
      const { data: { session } } = await supabase.auth.getSession();
      
      // If there is a recovery flow, or a current active session, allow password update
      if (session) {
        setHasAccess(true);
      } else {
        // Fallback: Check if there's an access_token in the URL fragment (hash) which Supabase parses
        const hash = window.location.hash;
        if (hash && (hash.includes("access_token") || hash.includes("type=recovery"))) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      }
      setSessionChecked(true);
    };

    checkSession();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to update password. Try requesting a new link.");
    } else {
      toast.success("Password updated successfully! Redirecting you to login...");
      // Wait a moment for the toast to be seen
      setTimeout(() => {
        // Sign out to clear recovery session and force clean login
        supabase.auth.signOut().then(() => {
          nav({ to: "/login" });
        });
      }, 2000);
    }
  };

  if (!sessionChecked) {
    return (
      <div className={`flex min-h-screen items-center justify-center font-sans ${
        isDarkMode ? "bg-[#090c12] text-slate-100" : "bg-[#fafafa] text-slate-850"
      }`}>
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Checking recovery credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid min-h-screen w-full font-sans antialiased md:grid-cols-12 selection:bg-emerald-500/10 selection:text-emerald-400 transition-colors duration-500 ${
      isDarkMode ? "bg-[#090c12] text-slate-100" : "bg-[#fafafa] text-slate-800"
    }`}>
      
      {/* LEFT COLUMN: CRISP STRUCTURED ACADEMIC REGISTRATION PORTAL */}
      <div className={`relative z-10 flex flex-col justify-between p-6 sm:p-10 md:col-span-6 lg:col-span-5 xl:col-span-4 border-r transition-all duration-500 mx-auto w-full min-h-screen ${
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
                <BiSolidBookHeart className="h-5 w-5 text-white" />
                <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border shadow-sm transition-colors duration-500 ${
                  isDarkMode ? "border-slate-900" : "border-white"
                }`} />
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`text-base font-black tracking-tight leading-tight group-hover:text-emerald-400 transition-colors duration-300 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`} style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.03em" }}>
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
          {!hasAccess ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h1 className={`text-2xl font-black tracking-tight transition-colors duration-500 ${
                  isDarkMode ? "text-white" : "text-slate-950"
                }`}>Invalid Recovery Link</h1>
                <p className={`text-xs font-semibold leading-relaxed transition-colors duration-500 ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}>
                  This reset link has expired, was already used, or is invalid. Please request a new link from the login page.
                </p>
              </div>
              <Button asChild className="w-full h-11 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-extrabold text-white shadow-md">
                <Link to="/login">Back to Log In</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2.5">
                <div className={`inline-flex items-center gap-1.5 rounded-lg text-[10px] font-bold tracking-widest border px-3 py-1 uppercase shadow-sm transition-all duration-500 ${
                  isDarkMode 
                    ? "bg-emerald-950/50 text-emerald-400 border-emerald-900/50 shadow-emerald-500/5" 
                    : "bg-slate-950 text-emerald-400 border-slate-800 shadow-slate-950/5"
                }`}>
                  <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" /> Secure Recovery
                </div>
                <h1 className={`text-3xl font-black tracking-tight transition-colors duration-500 ${
                  isDarkMode ? "text-white" : "text-slate-950"
                }`}>Reset Password</h1>
                <p className={`text-xs font-semibold leading-relaxed transition-colors duration-500 ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}>
                  Enter your new password below. Ensure it is memorable and securely stored.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4 pt-4">
                {/* Password Field */}
                <div className="space-y-2 group/field">
                  <Label 
                    htmlFor="password" 
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors duration-300 group-focus-within/field:text-emerald-400 flex items-center gap-1.5"
                  >
                    <Lock className="h-3.5 w-3.5" /> New Password
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
                        <Lock className="h-4 w-4" />
                      </div>
                      <input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        minLength={6}
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

                {/* Confirm Password Field */}
                <div className="space-y-2 group/field">
                  <Label 
                    htmlFor="confirmPassword" 
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors duration-300 group-focus-within/field:text-emerald-400 flex items-center gap-1.5"
                  >
                    <Lock className="h-3.5 w-3.5" /> Confirm Password
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
                        <Lock className="h-4 w-4" />
                      </div>
                      <input 
                        id="confirmPassword" 
                        type={showConfirmPassword ? "text" : "password"} 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required 
                        minLength={6}
                        placeholder="••••••••" 
                        className={`w-full h-12 bg-transparent pl-3 pr-10 text-sm font-semibold outline-none border-0 focus:ring-0 focus:outline-none transition-colors duration-500 ${
                          isDarkMode ? "text-white placeholder:text-slate-600" : "text-slate-900 placeholder:text-slate-400"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 text-slate-500 hover:text-slate-350 transition-colors duration-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 mt-6 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-extrabold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 text-sm"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-white" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Update Password <ArrowRight className="h-4 w-4 text-white" />
                    </span>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Notice Info Container */}
        <div className={`rounded-xl border p-3.5 text-center backdrop-blur-md transition-all duration-500 ${
          isDarkMode 
            ? "bg-slate-900/40 border-slate-800/80 text-slate-500" 
            : "bg-slate-50 border-slate-150 text-slate-400"
        }`}>
          <p className="text-[10px] font-bold leading-normal uppercase tracking-wider">
            Need Help? If you didn't request a password reset, you can safely ignore this page or contact platform administrators.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: CINEMATIC ENGINE VIEW */}
      <div className="relative hidden md:flex md:col-span-6 lg:col-span-7 xl:col-span-8 bg-[#090c12] overflow-hidden items-center justify-center p-8 lg:p-12">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#131a26_1px,transparent_1px),linear-gradient(to_bottom,#131a26_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        <div className="absolute -bottom-24 -right-24 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-md text-center space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
            <Lock className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
            Secure Password Recovery
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Lakshay IQ implements end-to-end industry standard encryption and secure sessions to protect your academic telemetry, syllabus resources, and workspace.
          </p>
        </div>
      </div>
      
    </div>
  );
}
