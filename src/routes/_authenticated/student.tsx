import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppShell, type NavItem } from "@/components/app-shell";
import { Home, Bookmark, Search, GraduationCap } from "lucide-react";

const items: NavItem[] = [
  { to: "/student", label: "Dashboard", icon: Home },
  { to: "/student/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/student/search", label: "Search", icon: Search },
];

export const Route = createFileRoute("/_authenticated/student")({
  component: StudentLayout,
});

function StudentLayout() {
  const { role, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && role === "admin") nav({ to: "/admin" }); }, [role, loading, nav]);
  return <AppShell items={items} variant="student"><Outlet /></AppShell>;
}

export const _icon = GraduationCap;
