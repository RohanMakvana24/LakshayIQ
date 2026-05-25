import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut, Search, Bell, ChevronRight, Menu, PanelLeftClose, PanelLeft, Sparkles, UserCircle, ChevronDown, Plus, ArrowLeft, Home } from "lucide-react";
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
  const { user, signOut, profile } = useAuth();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-600 font-sans antialiased selection:bg-emerald-50 selection:text-emerald-700">

      {/* --- MOBILE SIDEBAR DRAWER --- */}
      <div className={cn(
        "fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-md md:hidden transition-opacity duration-300",
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

          <nav className="flex-1 space-y-1 overflow-y-auto py-2">
            {renderNavItems({ items, pathname, openGroups, setOpenGroups, isCollapsed: false, setMobileMenuOpen })}
          </nav>

          <UserFooter user={user} profile={profile} variant={variant} isCollapsed={false} signOut={signOut} nav={nav} />
        </aside>
      </div>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden md:flex md:flex-col bg-white border-r border-zinc-100/80 transition-all duration-300 ease-in-out p-4 justify-between shadow-[1px_0_10px_rgba(0,0,0,0.005)]",
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
            <div className="my-2 relative group px-1 animate-in fade-in duration-300">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-700 transition-colors" />
              <Input
                placeholder="Search device"
                className="pl-9 h-9 bg-zinc-50 border-none focus-visible:ring-1 focus-visible:ring-zinc-200 focus-visible:bg-white rounded-xl text-xs placeholder:text-zinc-400 font-medium transition-all"
              />
            </div>
          )}

          <nav className="flex-1 space-y-1 overflow-y-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {renderNavItems({ items, pathname, openGroups, setOpenGroups, isCollapsed })}
          </nav>
        </div>

        <UserFooter user={user} profile={profile} variant={variant} isCollapsed={isCollapsed} signOut={signOut} nav={nav} />
      </aside>

      {/* --- MAIN CONTENT BAR --- */}
      <div className={cn("transition-all duration-300 ease-in-out", isCollapsed ? "md:pl-20" : "md:pl-66")}>

        {/* Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-zinc-100/60 bg-white/80 px-4 md:px-8 backdrop-blur-md">

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 rounded-xl text-zinc-600 hover:bg-zinc-50 relative z-10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* --- ULTRA UNIQUE LETTER-WAVE TEXT ANIMATION (MOBILE ONLY) --- */}
          <div className="flex md:hidden flex-1 justify-center items-center">
            <div className="flex items-center text-sm font-black tracking-widest uppercase select-none relative px-4 py-1">

              {/* Soft Ambient Background Light Effect */}
              <div className="absolute inset-0 bg-emerald-400/5 blur-xl rounded-full animate-pulse" />

              {/* LAKSHAY TEXT WITH STAGGERED WAVE ANIMATION */}
              <div className="flex text-zinc-900 font-extrabold mr-1">
                <span className="inline-block animate-[letterWave_2.5s_infinite_ease-in-out]" style={{ animationDelay: '0.1s' }}>L</span>
                <span className="inline-block animate-[letterWave_2.5s_infinite_ease-in-out]" style={{ animationDelay: '0.2s' }}>a</span>
                <span className="inline-block animate-[letterWave_2.5s_infinite_ease-in-out]" style={{ animationDelay: '0.3s' }}>k</span>
                <span className="inline-block animate-[letterWave_2.5s_infinite_ease-in-out]" style={{ animationDelay: '0.4s' }}>s</span>
                <span className="inline-block animate-[letterWave_2.5s_infinite_ease-in-out]" style={{ animationDelay: '0.5s' }}>h</span>
                <span className="inline-block animate-[letterWave_2.5s_infinite_ease-in-out]" style={{ animationDelay: '0.6s' }}>a</span>
                <span className="inline-block animate-[letterWave_2.5s_infinite_ease-in-out]" style={{ animationDelay: '0.7s' }}>y</span>
              </div>

              {/* IQ TEXT WITH GLOW SHIMMER */}
              <div className="flex text-emerald-500 font-black relative">
                <span className="inline-block animate-[letterWave_2.5s_infinite_ease-in-out] drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]" style={{ animationDelay: '0.8s' }}>I</span>
                <span className="inline-block animate-[letterWave_2.5s_infinite_ease-in-out] drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]" style={{ animationDelay: '0.9s' }}>Q</span>

                {/* Live Micro Status Radar Dot */}
                <span className="absolute -top-0.5 -right-2 h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span className="absolute -top-0.5 -right-2 h-1.5 w-1.5 bg-emerald-500 rounded-full shadow-sm" />
              </div>
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
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl border border-zinc-100 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-[#78cc3b] rounded-full" />
            </Button>
          </div>
        </header>

        {/* --- MAIN ROUTE VIEW --- */}
        <main className="p-2 md:p-1 max-w-[1600px] mx-auto animate-in fade-in duration-500">
          {children}
        </main>
      </div>

      {/* --- FLOATING MOBILE ACTION DOCK (BACK & HOME NAVIGATION) --- */}
      {variant === "student" && pathname !== "/student" && pathname !== "/student/" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden animate-in slide-in-from-bottom-8 duration-300">
          <div className="flex items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-md border border-zinc-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-full">
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
function BrandHeader({ variant, isCollapsed }: { variant: string; isCollapsed: boolean }) {
  return (
    <Link
      to="/"
      className={cn(
        "group flex items-center justify-between rounded-xl p-1.5 transition-all duration-300 hover:bg-zinc-50 w-full",
        isCollapsed ? "justify-center" : ""
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-md border border-zinc-800 transition-transform duration-300 group-hover:scale-[1.02]">
          <BiSolidBookHeart className="relative z-10 h-4.5 w-4.5 text-emerald-400" />
          <Sparkles className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-emerald-300 opacity-80" />
          {!isCollapsed && (
            <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm" />
          )}
        </div>

        {!isCollapsed && (
          <div className="flex flex-col leading-tight text-left">
            <h1 className="text-sm font-bold tracking-tight text-zinc-900">
              Lakshay<span className="ml-0.5 text-emerald-500 font-extrabold">IQ</span>
            </h1>
            <span className="text-[10px] text-zinc-400 font-medium">
              {variant === "admin" ? "Admin Master" : "Team Plan"}
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

function UserFooter({ user, profile, variant, isCollapsed, signOut, nav }: FooterProps) {
  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? (variant === "admin" ? "Admin Profile" : "User Profile");
  const avatarUrl = profile?.avatar_url ?? null;
  const initials = displayName ? displayName.trim()[0].toUpperCase() : (user?.email ?? "U")[0].toUpperCase();

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