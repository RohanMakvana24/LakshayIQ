import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { LogOut, Search, Bell, ChevronRight, Menu, PanelLeftClose, PanelLeft, Sparkles, UserCircle, ChevronDown, Plus, ArrowLeft, Home, MessageSquare, X } from "lucide-react";
import { BiSolidBookHeart } from "react-icons/bi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/use-push-notifications";

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
  const [searchVal, setSearchVal] = useState("");

  // Revert dark mode on dashboard portals mount
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

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

  return (
    <div className="min-h-screen bg-white text-zinc-600 font-sans antialiased selection:bg-emerald-50 selection:text-emerald-700">

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
      <div className={cn("transition-[padding-left] duration-300 ease-in-out will-change-[padding-left] print:pl-0 print:p-0 print:m-0 print:block", isCollapsed ? "md:pl-20" : "md:pl-66")}>

        {/* Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-zinc-100/60 bg-white/80 px-4 md:px-8 backdrop-blur-md print:hidden">

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
                  {variant === "admin" ? "Admin" : "Smart Platform"}
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
            <NotificationBell variant={variant} />
          </div>
        </header>

        {/* --- MAIN ROUTE VIEW --- */}
        <main className="p-4 md:p-6 max-w-[1600px] bg-white mx-auto animate-in fade-in duration-500 print:p-0 print:m-0 print:block">
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
              {variant === "admin" ? "Admin Master" : "Smart Platform"}
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

interface NotifItem {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  senderName?: string;
}

function NotificationBell({ variant }: { variant: string }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("id, sender_id, content, created_at")
      .eq("receiver_id", user.id)
      .eq("is_read", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    if (!data || data.length === 0) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Fetch sender names
    const senderIds = [...new Set(data.map((m) => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", senderIds);

    const nameMap: Record<string, string> = {};
    (profiles ?? []).forEach((p) => { if (p.full_name) nameMap[p.id] = p.full_name; });

    const enriched = data.map((m) => ({
      ...m,
      senderName: nameMap[m.sender_id] ?? "Unknown",
    }));

    setNotifications(enriched);
    setUnreadCount(data.length);
  }, [user?.id]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Realtime updates for new messages
  usePushNotifications(() => {
    loadNotifications();
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNotifClick = async (notif: NotifItem) => {
    setOpen(false);
    // Mark as read
    await supabase.from("chat_messages").update({ is_read: true }).eq("id", notif.id);
    // Navigate to chat
    if (variant === "admin") {
      nav({ to: "/admin/chat", search: { userId: notif.sender_id } });
    } else {
      nav({ to: "/student/chat" });
    }
    loadNotifications();
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase.from("chat_messages").update({ is_read: true }).eq("receiver_id", user.id).eq("is_read", false);
    setNotifications([]);
    setUnreadCount(0);
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-xl border border-zinc-100 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 relative"
        onClick={() => { setOpen((o) => !o); if (!open) loadNotifications(); }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center border border-white shadow-sm animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-zinc-100 rounded-2xl shadow-2xl shadow-zinc-900/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-xs font-extrabold text-zinc-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] font-bold text-zinc-400 hover:text-emerald-600 transition-colors">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="h-5 w-5 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <MessageSquare className="h-8 w-8 text-zinc-200 mb-2" />
                <p className="text-xs font-medium text-zinc-400">No new notifications</p>
                <p className="text-[10px] text-zinc-300 mt-0.5">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 group"
                >
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                    {(n.senderName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-800 truncate">{n.senderName ?? "Unknown"}</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 font-medium">{n.content}</p>
                    <p className="text-[9px] text-zinc-400 font-medium mt-0.5">
                      {new Date(n.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-zinc-100 bg-zinc-50/30">
            <button
              onClick={() => { setOpen(false); nav({ to: variant === "admin" ? "/admin/chat" : "/student/chat" }); }}
              className="w-full text-center text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              View all messages →
            </button>
          </div>
        </div>
      )}
    </div>
  );
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