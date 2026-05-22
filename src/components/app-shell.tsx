import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut, Search, Bell, ChevronRight, Menu, ChevronLeft, PanelLeftClose, PanelLeft, Sparkles, BookOpen, Brain } from "lucide-react";
import { BiSolidBookHeart } from "react-icons/bi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export interface NavItem {
  to?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { to: string; label: string }[];
}

export function AppShell({ items, variant, children }: { items: NavItem[]; variant: "student" | "admin"; children: ReactNode }) {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  
  // Sidebar State Management
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    items.forEach((it) => {
      if (it.children) init[it.label] = it.children.some((c) => pathname.startsWith(c.to));
    });
    return init;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-emerald-500/10 selection:text-emerald-600">
      
      {/* --- MOBILE SIDEBAR DRAWER --- */}
      <div className={cn(
        "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity duration-300",
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )} onClick={() => setMobileMenuOpen(false)}>
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 w-72 bg-white p-5 flex flex-col border-r border-slate-200 transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <BrandHeader variant={variant} isCollapsed={false} />
          </div>
          
          {/* Mobile Nav */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto py-6">
            {renderNavItems({ items, pathname, openGroups, setOpenGroups, isCollapsed: false, setMobileMenuOpen })}
          </nav>

          {/* Mobile Footer */}
          <UserFooter user={user} variant={variant} isCollapsed={false} signOut={signOut} nav={nav} />
        </aside>
      </div>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden md:flex md:flex-col bg-white border-r border-slate-200/80 shadow-[1px_0_10px_rgba(0,0,0,0.01)] transition-all duration-300 ease-in-out p-4",
          isCollapsed ? "w-20" : "w-66"
        )}
      >
        {/* Collapse Trigger Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7 h-6 w-6 hidden md:grid place-items-center rounded-full bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all duration-200 z-50"
        >
          {isCollapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>

        {/* Brand Header */}
        <div className={cn("pb-5 border-b border-slate-100 flex items-center", isCollapsed ? "justify-center" : "px-1")}>
          <BrandHeader variant={variant} isCollapsed={isCollapsed} />
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto py-6 pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {renderNavItems({ items, pathname, openGroups, setOpenGroups, isCollapsed })}
        </nav>

        {/* Desktop Footer Profile */}
        <UserFooter user={user} variant={variant} isCollapsed={isCollapsed} signOut={signOut} nav={nav} />
      </aside>

      {/* --- MAIN CONTENT BAR --- */}
      <div className={cn("transition-all duration-300 ease-in-out", isCollapsed ? "md:pl-20" : "md:pl-66")}>
        
        {/* Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200/50 bg-white/80 px-4 md:px-8 backdrop-blur-md">
          
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search or Title Section */}
          <div className="flex-1 max-w-md">
            {variant === "student" ? (
              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  const fd = new FormData(e.currentTarget); 
                  nav({ to: "/student/search", search: { q: String(fd.get("q") || "") } as never }); 
                }} 
                className="flex items-center"
              >
                <div className="relative w-full group">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input 
                    name="q" 
                    placeholder="Search universities, subjects, units…" 
                    className="pl-10 h-9 bg-slate-50/80 border-slate-200/60 focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 rounded-xl transition-all placeholder:text-slate-400/80 text-xs" 
                  />
                </div>
              </form>
            ) : (
              <h2 className="font-semibold text-sm text-slate-800 tracking-tight">Admin Console Dashboard</h2>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl border border-slate-200/60 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50/40 transition-all duration-200"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* --- MAIN ROUTE VIEW --- */}
        <main className="p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ==========================================================================
   HELPERS & SUB-COMPONENTS
   ========================================================================== */
function BrandHeader({
  variant,
  isCollapsed,
}: {
  variant: string;
  isCollapsed: boolean;
}) {
  return (
    <Link
      to="/"
      className="group relative flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-all duration-300 hover:bg-zinc-100"
    >
      {/* Logo Icon Container - Black & Green Theme */}
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-neutral-950 to-zinc-900 shadow-lg shadow-emerald-950/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-1 border border-zinc-800">
        {/* Subtle animated ring on hover */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-emerald-500/20 group-hover:ring-emerald-500/40 transition-all duration-300" />
        
        {/* Soft green glow overlay */}
        <div className="absolute inset-0 bg-emerald-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Main Heart‑Book Icon (Kept your original icon) */}
        <BiSolidBookHeart className="relative z-10 h-5 w-5 text-emerald-400 drop-shadow-[0_2px_8px_rgba(52,211,153,0.3)] transition-colors duration-300 group-hover:text-emerald-300" />

        {/* Repositioned sparkle accent - Green/Cyan variant */}
        <Sparkles className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-emerald-300 opacity-90 animate-pulse" />

        {/* Extra geometric dot for tech feel */}
        <div className="absolute left-1 top-1 h-1 w-1 rounded-full bg-emerald-400/60" />

        {/* Online indicator dot (only when expanded) */}
        {!isCollapsed && (
          <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full border border-zinc-950 bg-emerald-400 shadow-sm shadow-emerald-500/50 animate-pulse" />
        )}
      </div>

      {/* Brand Text */}
      {!isCollapsed && (
        <div className="flex flex-col leading-tight">
          <h1
            className="text-[17px] font-black tracking-tight text-zinc-900"
            style={{
              fontFamily: "'Clash Display', 'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            Lakshay
            <span className="ml-1 bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
              IQ
            </span>
          </h1>

          <div className="mt-0.5 flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full bg-emerald-500" />
            <span
              className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
              style={{
                fontFamily: "'Clash Display', 'Sora', 'Plus Jakarta Sans', system-ui, sans-serif",
              }}
            >
              {variant === "admin"
                ? "Admin Console"
                : "AI Learning Platform"}
            </span>
          </div>
        </div>
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
  return items.map((item) => {
    if (item.children) {
      const isOpen = openGroups[item.label];
      const anyActive = item.children.some((c) => pathname.startsWith(c.to));

      if (isCollapsed) {
        // Collapsed mode me nested dropdown directly nahi dikha sakte, basic dynamic indicator badge dikhega
        return (
          <div key={item.label} className="relative flex justify-center group/tooltip py-1">
            <button
              onClick={() => setOpenGroups((s) => ({ ...s, [item.label]: !s[item.label] }))}
              className={cn(
                "h-10 w-10 flex items-center justify-center rounded-xl transition-all relative",
                anyActive ? "bg-emerald-50 text-emerald-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {anyActive && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            </button>
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
              {item.label}
            </div>
          </div>
        );
      }

      return (
        <div key={item.label} className="space-y-0.5">
          <button
            onClick={() => setOpenGroups((s) => ({ ...s, [item.label]: !s[item.label] }))}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all group relative",
              anyActive 
                ? "text-emerald-600 font-semibold bg-emerald-50/40" 
                : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
            )}
          >
            <item.icon className={cn("h-4.5 w-4.5 transition-colors duration-200", anyActive ? "text-emerald-500" : "text-slate-400 group-hover:text-slate-600")} />
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200 text-slate-400", isOpen && "rotate-90 text-emerald-500")} />
          </button>
          
          {isOpen && (
            <div className="ml-5 mt-0.5 space-y-0.5 border-l border-slate-100 pl-3.5 transition-all animate-in fade-in slide-in-from-left-1 duration-200">
              {item.children.map((c) => {
                const active = pathname === c.to;
                return (
                  <Link 
                    key={c.to} 
                    to={c.to as never} 
                    onClick={() => setMobileMenuOpen?.(false)}
                    className={cn(
                      "block rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all relative",
                      active 
                        ? "text-emerald-600 font-bold bg-emerald-50/20 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-emerald-500 before:rounded-r" 
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/40"
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
              active 
                ? "bg-slate-900 text-white shadow-sm" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className="h-4.5 w-4.5" />
          </Link>
          <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
            {item.label}
          </div>
        </div>
      );
    }

    return (
      <Link 
        key={to} 
        to={to as never} 
        onClick={() => setMobileMenuOpen?.(false)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 relative group",
          active 
            ? "bg-slate-900 text-white shadow-sm font-semibold" 
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <item.icon className={cn("h-4.5 w-4.5 transition-colors", active ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-600")} />
        <span className="flex-1">{item.label}</span>
      </Link>
    );
  });
}

interface FooterProps {
  user: any;
  variant: string;
  isCollapsed: boolean;
  signOut: () => Promise<void>;
  nav: any;
}

function UserFooter({ user, variant, isCollapsed, signOut, nav }: FooterProps) {
  return (
    <div className="mt-auto border-t border-slate-100 pt-4 space-y-1.5">
      <div className={cn("flex items-center gap-2.5 rounded-xl p-1.5 transition-all", isCollapsed ? "justify-center" : "bg-slate-50/60 border border-slate-100")}>
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-900 text-emerald-400 text-xs font-bold shadow-sm">
          {(user?.email ?? "U")[0].toUpperCase()}
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1 animate-in fade-in duration-200">
            <p className="truncate text-[11px] font-bold text-slate-700">{user?.user_metadata?.full_name ?? (variant === "admin" ? "Admin User" : "Student User")}</p>
            <p className="truncate text-[10px] font-medium text-slate-400 mt-0.5">{user?.email}</p>
          </div>
        )}
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className={cn("w-full text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-all font-medium text-xs", isCollapsed ? "justify-center px-0" : "justify-start px-2.5")}
        onClick={async () => { await signOut(); nav({ to: "/login" }); }}
      >
        <LogOut className={cn("h-4 w-4", isCollapsed ? "" : "mr-2")} /> 
        {!isCollapsed && <span className="animate-in fade-in duration-200">Sign out</span>}
      </Button>
    </div>
  );
}