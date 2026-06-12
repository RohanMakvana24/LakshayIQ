import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { motion } from "framer-motion";
import { LogOut, Search, Bell, ChevronRight, Menu, PanelLeftClose, PanelLeft, Sparkles, UserCircle, ChevronDown, Plus, ArrowLeft, Home, MessageSquare, X, Sun, Moon } from "lucide-react";
import { BiSolidBookHeart } from "react-icons/bi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface NavItem {
  to?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { to: string; label: string }[];
}

function renderAdminNavGroup(
  items: NavItem[],
  pathname: string,
  openGroups: Record<string, boolean>,
  setOpenGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
) {
  return items.map((item) => {
    if (item.children) {
      const isOpen = openGroups[item.label];
      const anyActive = item.children.some((c) => pathname.startsWith(c.to));
      
      return (
        <div key={item.label} className="space-y-0.5">
          <button
            onClick={() => setOpenGroups((s: any) => ({ ...s, [item.label]: !s[item.label] }))}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-150 group relative cursor-pointer",
              anyActive 
                ? "bg-violet-600 text-white font-extrabold shadow-sm" 
                : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <item.icon className={cn("h-4 w-4 transition-colors", anyActive ? "text-white" : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600")} />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronRight className={cn("h-3 w-3 transition-transform duration-200 text-slate-400", isOpen && "rotate-90 text-slate-600", anyActive && "text-white")} />
          </button>

          {isOpen && (
            <div className="ml-5 mt-0.5 space-y-0.5 border-l border-slate-105 dark:border-zinc-800 pl-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {item.children.map((c) => {
                const active = pathname === c.to || pathname.startsWith(c.to + "/");
                return (
                  <Link
                    key={c.to}
                    to={c.to as any}
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-[11px] font-bold transition-all",
                      active
                        ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 font-black"
                        : "text-slate-400 hover:text-slate-800 hover:bg-slate-50/50 dark:text-zinc-500 dark:hover:text-zinc-350"
                    )}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const to = item.to!;
    const active = pathname === to || (to !== "/admin" && pathname.startsWith(to));

    return (
      <Link
        key={to}
        to={to as any}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-150 relative group cursor-pointer",
          active
            ? "bg-violet-600 text-white font-extrabold shadow-sm"
            : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
        )}
      >
        <item.icon className={cn("h-4 w-4 transition-colors", active ? "text-white" : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600")} />
        <span className="flex-1 text-left">{item.label}</span>
      </Link>
    );
  });
}

// Mobile variant of admin nav group — auto-closes drawer on link click
function renderAdminNavGroupMobile(
  items: NavItem[],
  pathname: string,
  openGroups: Record<string, boolean>,
  setOpenGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  onClose: () => void
) {
  return items.map((item) => {
    if (item.children) {
      const isOpen = openGroups[item.label];
      const anyActive = item.children.some((c) => pathname.startsWith(c.to));
      
      return (
        <div key={item.label} className="space-y-0.5">
          <button
            onClick={() => setOpenGroups((s: any) => ({ ...s, [item.label]: !s[item.label] }))}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition-all duration-150 group relative cursor-pointer",
              anyActive 
                ? "bg-violet-600 text-white font-extrabold shadow-sm" 
                : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <item.icon className={cn("h-4 w-4 transition-colors shrink-0", anyActive ? "text-white" : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600")} />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronRight className={cn("h-3 w-3 transition-transform duration-200 text-slate-400 shrink-0", isOpen && "rotate-90 text-slate-600", anyActive && "text-white")} />
          </button>

          {isOpen && (
            <div className="ml-5 mt-0.5 space-y-0.5 border-l border-slate-200 dark:border-zinc-800 pl-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {item.children.map((c) => {
                const active = pathname === c.to || pathname.startsWith(c.to + "/");
                return (
                  <Link
                    key={c.to}
                    to={c.to as any}
                    onClick={onClose}
                    className={cn(
                      "block rounded-md px-3 py-2 text-[11px] font-bold transition-all",
                      active
                        ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 font-black"
                        : "text-slate-400 hover:text-slate-800 hover:bg-slate-50/50 dark:text-zinc-500 dark:hover:text-zinc-300"
                    )}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const to = item.to!;
    const active = pathname === to || (to !== "/admin" && pathname.startsWith(to));

    return (
      <Link
        key={to}
        to={to as any}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition-all duration-150 relative group cursor-pointer",
          active
            ? "bg-violet-600 text-white font-extrabold shadow-sm"
            : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
        )}
      >
        <item.icon className={cn("h-4 w-4 transition-colors shrink-0", active ? "text-white" : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600")} />
        <span className="flex-1 text-left">{item.label}</span>
      </Link>
    );
  });
}

export function AppShell({ items, variant, children }: { items: NavItem[]; variant: "student" | "admin"; children: ReactNode }) {
  const { user, signOut, profile, role } = useAuth();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [adminProfileOpen, setAdminProfileOpen] = useState(false);
  const adminProfileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (adminProfileRef.current && !adminProfileRef.current.contains(e.target as Node)) {
        setAdminProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return false;
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      nav({ to: "/student/search", search: { q: searchVal.trim() } });
    }
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    items.forEach((it) => {
      if (it.children) init[it.label] = it.children.some((c) => pathname.startsWith(c.to));
    });
    return init;
  });

  useEffect(() => {
    const next: Record<string, boolean> = {};
    items.forEach((it) => {
      if (it.children) next[it.label] = it.children.some((c) => pathname.startsWith(c.to));
    });
    setOpenGroups(next);
  }, [pathname, items]);

  if (variant === "admin") {
    const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? "Admin Profile";
    const initials = (displayName?.trim() || user?.email || "A").charAt(0).toUpperCase();

    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-zinc-950 text-foreground font-sans antialiased transition-colors duration-300">
        
        {/* --- MOBILE SIDEBAR DRAWER (ADMIN) --- */}
        <div className={cn(
          "fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-sm md:hidden transition-opacity duration-300 print:hidden",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )} onClick={() => setMobileMenuOpen(false)}>
          <aside
            className={cn(
              "fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-zinc-900 p-4 flex flex-col border-r border-zinc-100/80 dark:border-zinc-800 transition-transform duration-300 ease-in-out shadow-2xl",
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drawer Header */}
            <div className="pb-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <Link to="/admin" className="flex items-center gap-2 font-black tracking-tight text-slate-900 dark:text-white" onClick={() => setMobileMenuOpen(false)}>
                <div className="relative flex h-8 w-8 items-center justify-center shrink-0">
                  <div className="absolute inset-0 rounded-full border border-t-transparent animate-[spin_4s_linear_infinite] border-violet-500/50" />
                  <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md flex items-center justify-center">
                    <BiSolidBookHeart className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">Lakshay IQ</span>
                  <span className="ml-1.5 bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Admin
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Nav Groups with close-on-click */}
            <nav className="flex-1 space-y-1 overflow-y-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-2">Core panels</div>
              {renderAdminNavGroupMobile(items.slice(0, 6), pathname, openGroups, setOpenGroups, () => setMobileMenuOpen(false))}
              <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-5 mb-2 px-2">Resources</div>
              {renderAdminNavGroupMobile(items.slice(6, 11), pathname, openGroups, setOpenGroups, () => setMobileMenuOpen(false))}
              <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-5 mb-2 px-2">System</div>
              {renderAdminNavGroupMobile(items.slice(11), pathname, openGroups, setOpenGroups, () => setMobileMenuOpen(false))}
            </nav>

            <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50/60 rounded-xl transition-all font-medium text-xs justify-start px-2.5"
                onClick={async () => { setMobileMenuOpen(false); await signOut(); nav({ to: "/login" }); }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Sign out</span>
              </Button>
            </div>
          </aside>
        </div>

        {/* --- DESKTOP DOUBLE SIDEBAR --- */}
        {/* Far-left narrow bar — hidden on mobile */}
        <aside className="fixed inset-y-0 left-0 w-16 bg-white dark:bg-zinc-900 border-r border-slate-200/80 dark:border-zinc-800 hidden md:flex flex-col items-center justify-between py-4 z-40 shadow-[1px_0_5px_rgba(0,0,0,0.01)] print:hidden">
          <div className="relative flex h-10 w-10 items-center justify-center shrink-0">
            <div className="absolute inset-0 rounded-full border border-t-transparent animate-[spin_4s_linear_infinite] border-violet-500/50" />
            <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md flex items-center justify-center">
              <BiSolidBookHeart className="h-4.5 w-4.5 text-white" />
            </div>
          </div>

          <div className="flex-1 w-full flex flex-col items-center gap-4 py-8">
            {items.filter(it => !it.children).slice(0, 5).map((it, idx) => {
              const Icon = it.icon;
              const active = pathname === it.to || (it.to !== "/admin" && pathname.startsWith(it.to!));
              return (
                <Link
                  key={idx}
                  to={it.to as any}
                  className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-xl transition-all relative group/item cursor-pointer",
                    active 
                      ? "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-bold" 
                      : "text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-slate-900 dark:hover:text-zinc-300"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {active && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-0.75 bg-violet-600 rounded-r-md" />
                  )}
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md opacity-0 pointer-events-none group-hover/item:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md font-bold">
                    {it.label}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="rounded-xl h-9 w-9 text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              {isDarkMode ? <Sun className="h-4.5 w-4.5 text-yellow-500" /> : <Moon className="h-4.5 w-4.5" />}
            </Button>
          </div>
        </aside>

        {/* Second Sidebar panel — hidden on mobile */}
        <aside className={cn(
          "fixed inset-y-0 left-16 bg-white dark:bg-zinc-900 border-r border-slate-200/80 dark:border-zinc-800 hidden md:flex flex-col justify-between p-4 z-30 shadow-[1px_0_5px_rgba(0,0,0,0.01)] print:hidden transition-all duration-300",
          isCollapsed ? "w-0 opacity-0 -translate-x-[240px] pointer-events-none" : "w-[240px] opacity-100"
        )}>
          <div className="flex flex-col flex-1 min-h-0">
            <div className="pb-4 border-b border-slate-100 dark:border-zinc-800">
              <Link to="/admin" className="flex items-center gap-2 font-black tracking-tight text-slate-900 dark:text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                <span>Lakshay IQ</span>
                <span className="bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Admin
                </span>
              </Link>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-2">Core panels</div>
              {renderAdminNavGroup(items.slice(0, 6), pathname, openGroups, setOpenGroups)}

              <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-6 mb-2 px-2">Resources</div>
              {renderAdminNavGroup(items.slice(6, 11), pathname, openGroups, setOpenGroups)}

              <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-6 mb-2 px-2">System</div>
              {renderAdminNavGroup(items.slice(11), pathname, openGroups, setOpenGroups)}
            </nav>
          </div>

          {/* Bottom plan/credit card like DreamsAI */}
          <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850 p-3 rounded-xl flex flex-col gap-2 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
                <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Database Status</span>
              </div>
              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">95% Sync</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">Lakshay IQ system data is fully synchronized and healthy.</p>
            <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-violet-600 h-full rounded-full transition-all duration-500" style={{ width: "95%" }} />
            </div>
            <button onClick={() => nav({ to: "/admin/users" })} className="w-full text-center py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-[10px] font-extrabold text-slate-900 dark:text-slate-100 rounded-lg shadow-sm transition-colors cursor-pointer uppercase tracking-wider">
              Manage Users
            </button>
          </div>
        </aside>

        {/* Sidebar Collapse Toggle Button — desktop only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ left: isCollapsed ? "52px" : "292px" }}
          className="fixed top-20 z-50 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200 shadow-md transition-all duration-300 cursor-pointer"
        >
          {isCollapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>

        {/* CONTENT VIEWPORT — no left padding on mobile, sidebar-offset only on md+ */}
        <div className={cn(
          "relative min-h-screen transition-all duration-300 print:pl-0",
          isCollapsed ? "md:pl-16" : "md:pl-[304px]"
        )}>
          
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-150 dark:border-zinc-805 bg-white/80 dark:bg-zinc-950/80 px-4 md:px-8 backdrop-blur-md">
            
            {/* Mobile hamburger — only visible below md */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search — hidden on small mobile, shown from sm+ */}
            <div className="relative hidden sm:block w-56 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search admin tools..." 
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 pl-9 pr-12 py-1.5 rounded-lg text-xs focus:outline-none focus:border-violet-500/50" 
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-1.5 py-0.5 rounded shadow-sm">
                ⌘K
              </span>
            </div>

            {/* Mobile brand title — center on mobile */}
            <div className="flex md:hidden flex-1 justify-center">
              <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Lakshay <span className="text-violet-600">IQ</span></span>
            </div>

            <div className="hidden lg:flex items-center gap-6">
              <button className="text-xs font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 py-4">Admin Studio</button>
              <button className="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-4">Admin Tools</button>
            </div>

            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <button onClick={() => nav({ to: "/" })} className="hidden sm:block px-3 md:px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-[10px] font-black uppercase tracking-wider text-white shadow-md rounded-lg transition-all cursor-pointer">
                View Site
              </button>
              
              <NotificationBell variant="admin" />
              
              <div className="relative" ref={adminProfileRef}>
                <button 
                  onClick={() => setAdminProfileOpen(!adminProfileOpen)}
                  className="flex items-center gap-2 border-l border-slate-200 dark:border-zinc-800 pl-2 md:pl-4 focus:outline-none group hover:opacity-85 transition-opacity cursor-pointer text-left"
                >
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={displayName} 
                      className="h-8 w-8 rounded-full object-cover border border-violet-200 dark:border-violet-900/60 flex-shrink-0 transition-transform duration-200 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 flex items-center justify-center font-bold text-xs border border-violet-200 dark:border-violet-900/60 flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                      {initials}
                    </div>
                  )}
                  <div className="hidden xl:flex flex-col text-left leading-none">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{displayName}</span>
                      <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform duration-200", adminProfileOpen && "rotate-180")} />
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{role || "System Admin"}</span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {adminProfileOpen && (
                  <div className="absolute right-0 top-10 w-56 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{displayName}</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold truncate mt-0.5">{user?.email}</p>
                    </div>
                    <div className="p-1.5 space-y-1">
                      <button 
                        onClick={() => {
                          setAdminProfileOpen(false);
                          nav({ to: "/admin/profile" });
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
                      >
                        <UserCircle className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                        <span>Manage Profile</span>
                      </button>
                      <button 
                        onClick={async () => {
                          setAdminProfileOpen(false);
                          await signOut();
                          nav({ to: "/login" });
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-emerald-500/10 selection:text-emerald-500 transition-colors duration-300">

      {/* --- MOBILE SIDEBAR DRAWER --- */}
      <div className={cn(
        "fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-md md:hidden transition-opacity duration-300 print:hidden",
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )} onClick={() => setMobileMenuOpen(false)}>
        <aside
          className={cn(
            "fixed inset-y-0 left-0 w-66 bg-white p-4 flex flex-col border-r border-zinc-100/80 transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) shadow-xl",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pb-4">
            <BrandHeader variant={variant} isCollapsed={false} />
          </div>

          {variant === "student" && (
            <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(e); setMobileMenuOpen(false); }} className="my-2 relative group px-1 mb-4 animate-in fade-in duration-200">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-700 transition-colors" />
              <Input
                placeholder="Search courses, units..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="pl-9 h-9 bg-zinc-50 border-none focus-visible:ring-1 focus-visible:ring-zinc-200 focus-visible:bg-white rounded-xl text-xs placeholder:text-zinc-400 font-medium transition-all"
              />
            </form>
          )}

          <nav className="flex-1 space-y-1 overflow-y-auto py-2">
            {renderNavItems({ items, pathname, openGroups, setOpenGroups, isCollapsed: false, setMobileMenuOpen })}
          </nav>

          <UserFooter user={user} profile={profile} variant={variant} isCollapsed={false} signOut={signOut} nav={nav} />
        </aside>
      </div>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden md:flex md:flex-col bg-white border-r border-zinc-100/80 transition-[width] duration-300 ease-in-out will-change-[width] p-4 justify-between shadow-[1px_0_10px_rgba(0,0,0,0.005)] print:hidden",
          isCollapsed ? "w-20" : "w-66"
        )}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7 h-6 w-6 hidden md:grid place-items-center rounded-full bg-white border border-zinc-100 text-zinc-400 hover:text-zinc-800 shadow-sm transition-all duration-200 z-50 hover:scale-105"
        >
          {isCollapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>

        <div className="flex flex-col flex-1 min-h-0">
          <div className={cn("pb-4", isCollapsed ? "flex justify-center" : "")}>
            <BrandHeader variant={variant} isCollapsed={isCollapsed} />
          </div>

          {!isCollapsed && variant === "student" && (
            <form onSubmit={handleSearchSubmit} className="my-2 relative group px-1 animate-in fade-in duration-300">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-700 transition-colors" />
              <Input
                placeholder="Search courses, units..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="pl-9 h-9 bg-zinc-50 border-none focus-visible:ring-1 focus-visible:ring-zinc-200 focus-visible:bg-white rounded-xl text-xs placeholder:text-zinc-400 font-medium transition-all"
              />
            </form>
          )}

          <nav className="flex-1 space-y-1 overflow-y-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {renderNavItems({ items, pathname, openGroups, setOpenGroups, isCollapsed })}
          </nav>
        </div>

        <UserFooter user={user} profile={profile} variant={variant} isCollapsed={isCollapsed} signOut={signOut} nav={nav} />
      </aside>

      {/* --- MAIN CONTENT BAR --- */}
      <div className={cn("relative min-h-screen transition-[padding-left] duration-300 ease-in-out will-change-[padding-left] print:pl-0 print:p-0 print:m-0 print:block bg-background", isCollapsed ? "md:pl-20" : "md:pl-66")}>
        {/* --- Global Premium Student Mesh Gradient Background --- */}
        {variant === "student" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <motion.div animate={{ x: [0, 40, -30, 0], y: [0, -50, 30, 0] }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }} className="absolute -top-1/4 -right-1/4 w-[65%] h-[65%] rounded-full bg-primary/[0.05] blur-[120px]" />
            <motion.div animate={{ x: [0, -40, 30, 0], y: [0, 40, -30, 0] }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }} className="absolute -bottom-1/4 -left-1/4 w-[55%] h-[55%] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
            <motion.div animate={{ x: [0, 25, -35, 0], y: [0, -25, 35, 0] }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }} className="absolute top-1/3 left-1/3 w-[35%] h-[35%] rounded-full bg-violet-500/[0.03] blur-[100px]" />
          </div>
        )}

        {/* Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-zinc-100/60 dark:border-zinc-800/40 bg-white/60 dark:bg-zinc-950/60 px-4 md:px-8 backdrop-blur-md print:hidden relative z-10">

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 rounded-xl text-zinc-600 hover:bg-zinc-50 relative z-10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* --- SLOW PULSING ORBITAL BRANDING (MOBILE ONLY) --- */}
          <div className="flex md:hidden flex-1 justify-center items-center">
            <div className="flex items-center gap-2 select-none relative">
              {/* Soft Ambient Background Light Effect */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 bg-emerald-400/5 blur-lg rounded-full animate-[pulse_3s_infinite_ease-in-out]" />

              {/* Spinning futuristic outer orbit ring */}
              <div className="relative flex h-8 w-8 items-center justify-center shrink-0">
                <div className="absolute inset-0 rounded-full border border-t-transparent animate-[spin_4s_linear_infinite] border-emerald-500/40" />
                <div className="absolute inset-0 rounded-full border border-teal-500/10" />
                
                {/* Inner glowing core background */}
                <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md flex items-center justify-center">
                  <BiSolidBookHeart className="h-3.5 w-3.5 text-white" />
                </div>
              </div>

              {/* Elegant Sora font branding */}
              <div className="flex flex-col leading-none text-left">
                <h1 className="text-xs font-black tracking-tight text-zinc-950" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.03em" }}>
                  Lakshay<span className="text-emerald-500 font-extrabold">.IQ</span>
                </h1>
                <span className="text-[7px] text-zinc-400 font-bold uppercase tracking-wider">
                  Smart Platform
                </span>
              </div>

              {/* Little active radar indicator */}
              <span className="relative flex h-1.5 w-1.5 ml-0.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/80" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
            </div>
          </div>

          {/* Desktop Only Space */}
          <div className="hidden md:flex flex-1">
            {variant !== "student" && (
              <h2 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Admin Workspace</h2>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 relative z-10">
            {/* Real-time Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "rounded-xl h-9 w-9 border transition-colors",
                isDarkMode 
                  ? "border-zinc-800 bg-zinc-900/60 text-yellow-400 hover:bg-zinc-800/80 hover:text-yellow-300" 
                  : "border-zinc-100 bg-zinc-50/50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
              )}
            >
              {isDarkMode ? <Sun className="h-4.5 w-4.5 animate-[spin_12s_linear_infinite]" /> : <Moon className="h-4.5 w-4.5" />}
            </Button>

            <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

            <NotificationBell variant={variant} />
          </div>
        </header>

        {/* --- MAIN ROUTE VIEW --- */}
        <main className={cn(
          "relative z-10 animate-in fade-in duration-500 print:p-0 print:m-0 print:block",
          variant === "student"
            ? "w-full max-w-none py-4 md:py-6 px-4 md:px-8"
            : "max-w-[1600px] mx-auto p-4 md:p-6"
        )}>
          {children}
        </main>
      </div>

      {/* --- FLOATING MOBILE ACTION DOCK (BACK & HOME NAVIGATION) --- */}
      {variant === "student" && pathname !== "/student" && pathname !== "/student/" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden animate-in slide-in-from-bottom-8 duration-300 print:hidden">
          <div className="flex items-center gap-1.5 p-1.5 bg-white/90 border border-zinc-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-full">
            {/* Elegant Back Button */}
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-zinc-700 active:bg-zinc-100 active:scale-95 transition-all text-xs font-bold font-sans"
            >
              <ArrowLeft className="h-4 w-4 text-zinc-800 stroke-[2.5]" />
              <span>Back</span>
            </button>

            {/* Premium Vertical Separator */}
            <div className="w-px h-5 bg-zinc-200" />

            {/* Elegant Home Button */}
            <Link
              to="/student"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-zinc-700 active:bg-zinc-100 active:scale-95 transition-all text-xs font-bold font-sans"
            >
              <Home className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      )}

      {/* --- INLINE KEYFRAMES FOR PRECISE WAVE PHYSICS --- */}
      <style>{`
        @keyframes letterWave {
          0%, 100% {
            transform: translateY(0) scale(1);
            filter: brightness(1);
          }
          20% {
            transform: translateY(-4px) scale(1.08);
            filter: brightness(1.2) drop-shadow(0 4px 6px rgba(16,185,129,0.15));
          }
          40% {
            transform: translateY(0) scale(1);
            filter: brightness(1);
          }
        }
      `}</style>
    </div>
  );
}

/* ==========================================================================
   HELPERS & SUB-COMPONENTS
   ========================================================================== */
export function BrandHeader({ variant, isCollapsed }: { variant: string; isCollapsed: boolean }) {
  return (
    <Link
      to="/"
      className={cn(
        "group flex items-center justify-between rounded-xl p-1 transition-all duration-300 hover:bg-zinc-50 w-full",
        isCollapsed ? "justify-center" : ""
      )}
    >
      <div className="flex items-center gap-3.5">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          {/* Spinning futuristic outer orbit ring */}
          <div className="absolute inset-0 rounded-full border border-t-transparent animate-[spin_4s_linear_infinite] border-emerald-500/50" />
          <div className="absolute inset-0 rounded-full border border-teal-500/20" />
          
          {/* Inner glowing core background */}
          <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md transition-transform duration-500 group-hover:scale-105 group-hover:rotate-12 flex items-center justify-center">
            {/* Core original Book Heart Icon */}
            <BiSolidBookHeart className="h-4.5 w-4.5 text-white" />
            {/* Little emerald notification dot */}
            <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-400 border border-white shadow-sm" />
          </div>
        </div>

        {!isCollapsed && (
          <div className="flex flex-col leading-tight text-left">
            <h1 className="text-sm font-bold tracking-tight text-zinc-900 group-hover:text-emerald-500 transition-colors duration-300" style={{ letterSpacing: "-0.02em" }}>
              Lakshay<span className="ml-0.5 text-emerald-500 font-extrabold text-[10px]">IQ</span>
            </h1>
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-none">
              Smart Platform
            </span>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 transition-transform duration-200 mr-1" />
      )}
    </Link>
  );
}

interface RenderProps {
  items: NavItem[];
  pathname: string;
  openGroups: Record<string, boolean>;
  setOpenGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isCollapsed: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

function renderNavItems({ items, pathname, openGroups, setOpenGroups, isCollapsed, setMobileMenuOpen }: RenderProps) {
  return items.map((item, idx) => {
    const showDivider = idx === 3;

    if (item.children) {
      const isOpen = openGroups[item.label];
      const anyActive = item.children.some((c) => pathname.startsWith(c.to));

      if (isCollapsed) {
        return (
          <div key={item.label} className="relative flex justify-center group/tooltip py-1">
            <button
              onClick={() => setOpenGroups((s) => ({ ...s, [item.label]: !s[item.label] }))}
              className={cn(
                "h-10 w-10 flex items-center justify-center rounded-xl transition-all relative",
                anyActive ? "bg-zinc-100 text-zinc-900 font-semibold" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {anyActive && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-zinc-900" />}
            </button>
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-zinc-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
              {item.label}
            </div>
          </div>
        );
      }

      return (
        <div key={item.label} className="space-y-0.5">
          {showDivider && (
            <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-zinc-400/80 uppercase tracking-widest flex items-center justify-between">
              <span>Collections</span>
              <Plus className="h-3 w-3 cursor-pointer hover:text-zinc-600" />
            </div>
          )}
          <button
            onClick={() => setOpenGroups((s) => ({ ...s, [item.label]: !s[item.label] }))}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all group relative",
              anyActive ? "text-zinc-950 font-semibold" : "text-zinc-500 hover:bg-zinc-50/70 hover:text-zinc-900"
            )}
          >
            <item.icon className={cn("h-[18px] w-[18px] transition-colors", anyActive ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-600")} />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200 text-zinc-400", isOpen && "rotate-90 text-zinc-600")} />
          </button>

          {isOpen && (
            <div className="ml-5 mt-0.5 space-y-0.5 border-l border-zinc-100 pl-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {item.children.map((c) => {
                const active = pathname === c.to || pathname.startsWith(c.to + "/");
                return (
                  <Link
                    key={c.to}
                    to={c.to as never}
                    onClick={() => setMobileMenuOpen?.(false)}
                    className={cn(
                      "block rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      active
                        ? "text-zinc-950 bg-zinc-100/80 font-bold"
                        : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50/50"
                    )}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const to = item.to!;
    const active = pathname === to || (to !== "/student" && to !== "/admin" && pathname.startsWith(to));

    if (isCollapsed) {
      return (
        <div key={to} className="relative flex justify-center group/tooltip py-1">
          <Link
            to={to as never}
            className={cn(
              "h-10 w-10 flex items-center justify-center rounded-xl transition-all relative",
              active ? "bg-zinc-100 text-zinc-950 font-bold" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
          </Link>
          <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-zinc-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
            {item.label}
          </div>
        </div>
      );
    }

    return (
      <div key={to} className="space-y-0.5">
        {showDivider && (
          <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest block text-left">
            Workspace
          </div>
        )}
        <Link
          to={to as never}
          onClick={() => setMobileMenuOpen?.(false)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 relative group",
            active
              ? "bg-zinc-100 text-zinc-950 font-bold"
              : "text-zinc-500 hover:bg-zinc-50/80 hover:text-zinc-900"
          )}
        >
          <item.icon className={cn("h-[18px] w-[18px] transition-colors", active ? "text-zinc-950" : "text-zinc-400 group-hover:text-zinc-600")} />
          <span className="flex-1 text-left">{item.label}</span>

          {/* Notification Counter Badge */}
          {item.label.toLowerCase().includes("notification") && (
            <span className="bg-[#78cc3b] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md min-w-4 text-center">
              3
            </span>
          )}
        </Link>
      </div>
    );
  });
}

interface FooterProps {
  user: any;
  profile: import("@/hooks/use-auth").UserProfile | null;
  variant: string;
  isCollapsed: boolean;
  signOut: () => Promise<void>;
  nav: any;
}

/* ==========================================================================
   NOTIFICATION BELL COMPONENT
   ========================================================================== */

function NotificationBell({ variant }: { variant: string }) {
  return null;
}

function UserFooter({ user, profile, variant, isCollapsed, signOut, nav }: FooterProps) {
  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? (variant === "admin" ? "Admin Profile" : "User Profile");
  const avatarUrl = profile?.avatar_url ?? null;
  const initials = (displayName?.trim() || user?.email || "U").charAt(0).toUpperCase();

  const avatarEl = avatarUrl ? (
    <img src={avatarUrl} alt={displayName} className="h-9 w-9 shrink-0 rounded-xl object-cover border border-zinc-100" />
  ) : (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-800 text-xs font-bold border border-zinc-200/50">
      {initials}
    </div>
  );

  return (
    <div className="border-t border-zinc-100 pt-3 space-y-1 mt-auto">
      {variant === "student" ? (
        <Link
          to="/student/profile"
          className={cn(
            "flex items-center justify-between rounded-xl p-1.5 transition-all hover:bg-zinc-50 group w-full",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            {avatarEl}
            {!isCollapsed && (
              <div className="min-w-0 flex-1 text-left animate-in fade-in duration-200">
                <p className="truncate text-xs font-bold text-zinc-900">{displayName}</p>
                <p className="truncate text-[11px] text-zinc-400 font-medium">{user?.email}</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 transition-colors flex-shrink-0 mr-1" />
          )}
        </Link>
      ) : (
        <div className={cn("flex items-center justify-between rounded-xl p-1.5 transition-all hover:bg-zinc-50 w-full group", isCollapsed ? "justify-center" : "")}>
          <div className="flex items-center gap-3 min-w-0">
            {avatarEl}
            {!isCollapsed && (
              <div className="min-w-0 flex-1 text-left animate-in fade-in duration-200">
                <p className="truncate text-xs font-bold text-zinc-900">{displayName}</p>
                <p className="truncate text-[11px] text-zinc-400 font-medium">{user?.email}</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-600 transition-colors flex-shrink-0 mr-1" />
          )}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className={cn("w-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50/60 rounded-xl transition-all font-medium text-xs mt-0.5", isCollapsed ? "justify-center px-0" : "justify-start px-2.5")}
        onClick={async () => { await signOut(); nav({ to: "/login" }); }}
      >
        <LogOut className={cn("h-4 w-4", isCollapsed ? "" : "mr-2")} />
        {!isCollapsed && <span>Sign out</span>}
      </Button>
    </div>
  );
}