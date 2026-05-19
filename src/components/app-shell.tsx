import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LogOut, Search, Bell, ChevronRight } from "lucide-react";
import { BiSolidBookHeart } from "react-icons/bi"; // Make sure to run: npm i react-icons
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

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    items.forEach((it) => {
      if (it.children) init[it.label] = it.children.some((c) => pathname.startsWith(c.to));
    });
    return init;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900">
      {/* --- SIDEBAR --- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 md:flex md:flex-col p-4 bg-white border-r border-slate-100">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pb-6 border-b border-slate-100/80">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/10 transition-transform group-hover:scale-105">
              <BiSolidBookHeart className="h-4.5 w-4.5" />
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-slate-900 leading-tight">
                Lakshay <span className="text-emerald-500 text-[11px]">.IQ</span>
              </span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 leading-none">
                {variant === "admin" ? "Admin Console" : "Smart Platform"}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto py-6 pr-1 custom-scrollbar">
          {items.map((item) => {
            if (item.children) {
              const isOpen = openGroups[item.label];
              const anyActive = item.children.some((c) => pathname.startsWith(c.to));
              
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => setOpenGroups((s) => ({ ...s, [item.label]: !s[item.label] }))}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group relative",
                      anyActive 
                        ? "text-emerald-700 font-semibold bg-emerald-50/40" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 transition-colors", anyActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight className={cn("h-3.5 w-3.5 transition-transform text-slate-400", isOpen && "rotate-90 text-emerald-600")} />
                  </button>
                  
                  {isOpen && (
                    <div className="ml-5 mt-1 space-y-1 border-l-2 border-emerald-100 pl-4 transition-all animate-in fade-in slide-in-from-left-2 duration-200">
                      {item.children.map((c) => {
                        const active = pathname === c.to;
                        return (
                          <Link 
                            key={c.to} 
                            to={c.to as never} 
                            className={cn(
                              "block rounded-lg px-3 py-2 text-xs transition-all relative",
                              active 
                                ? "bg-gradient-to-r from-emerald-50 to-transparent font-semibold text-emerald-600 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-emerald-500 before:rounded-full" 
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/60"
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
            
            return (
              <Link 
                key={to} 
                to={to as never} 
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all relative group",
                  active 
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-600/10 font-semibold" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="mt-auto border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 p-2.5 border border-slate-100/50">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white text-sm font-bold shadow-sm">
              {(user?.email ?? "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">{user?.user_metadata?.full_name ?? (variant === "admin" ? "Admin User" : "Student User")}</p>
              <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50/60 rounded-xl transition-all" 
            onClick={async () => { await signOut(); nav({ to: "/login" }); }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* --- MAIN MAIN WRAPPER --- */}
      <div className="md:pl-64">
        {/* Header Dashboard Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-100 bg-white/80 px-6 backdrop-blur md:px-8">
          {variant === "student" ? (
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                const fd = new FormData(e.currentTarget); 
                nav({ to: "/student/search", search: { q: String(fd.get("q") || "") } as never }); 
              }} 
              className="flex max-w-md flex-1 items-center"
            >
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input 
                  name="q" 
                  placeholder="Search universities, subjects, units…" 
                  className="pl-9 h-9 bg-slate-50 border-slate-200/80 focus-visible:ring-emerald-500 rounded-xl transition-all" 
                />
              </div>
            </form>
          ) : (
            <h2 className="font-display text-base font-bold text-slate-800">Admin Console Dashboard</h2>
          )}
          
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl border border-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Render View Routes */}
        <main className="px-6 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}