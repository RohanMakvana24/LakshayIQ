import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppShell, type NavItem } from "@/components/app-shell";
import { LayoutDashboard, Database, Users, Loader2 } from "lucide-react";

const items: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/content", label: "Content", icon: Database },
  { to: "/admin/users", label: "Users", icon: Users },
];

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { role, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && role && role !== "admin") nav({ to: "/student" });
  }, [role, loading, nav]);

  if (loading || !role) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (role !== "admin") return null;
  return <AppShell items={items} variant="admin"><Outlet /></AppShell>;
}
