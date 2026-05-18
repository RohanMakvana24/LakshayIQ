import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { GraduationCap, LogOut, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }> }

export function AppShell({ items, variant, children }: { items: NavItem[]; variant: "student" | "admin"; children: ReactNode }) {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar md:flex md:flex-col">
        <Link to="/" className="flex items-center gap-2 border-b px-5 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-base font-bold leading-tight">Lakshay IQ</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{variant === "admin" ? "Admin Console" : "Student"}</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const active = pathname === item.to || (item.to !== "/student" && item.to !== "/admin" && pathname.startsWith(item.to));
            return (
              <Link key={item.to} to={item.to} className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">
              {(user?.email ?? "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.user_metadata?.full_name ?? "Student"}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={async () => { await signOut(); nav({ to: "/login" }); }}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-8">
          {variant === "student" ? (
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); nav({ to: "/student/search", search: { q: String(fd.get("q") || "") } as never }); }} className="flex max-w-xl flex-1 items-center">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="q" placeholder="Search universities, subjects, units…" className="pl-9" />
              </div>
            </form>
          ) : (
            <h2 className="font-display text-lg font-semibold">Admin Console</h2>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
