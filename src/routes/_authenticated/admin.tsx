import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppShell, type NavItem } from "@/components/app-shell";
import { LayoutDashboard, Building2, BookOpen, Layers, FileText, Boxes, Users, Loader2 } from "lucide-react";

const items: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  {
    label: "Universities", icon: Building2, children: [
      { to: "/admin/universities", label: "Manage Universities" },
      { to: "/admin/universities/add", label: "Add University" },
    ],
  },
  {
    label: "Courses", icon: BookOpen, children: [
      { to: "/admin/courses", label: "Manage Courses" },
      { to: "/admin/courses/add", label: "Add Course" },
    ],
  },
  {
    label: "Semesters", icon: Layers, children: [
      { to: "/admin/semesters", label: "Manage Semesters" },
      { to: "/admin/semesters/add", label: "Add Semester" },
    ],
  },
  {
    label: "Subjects", icon: FileText, children: [
      { to: "/admin/subjects", label: "Manage Subjects" },
      { to: "/admin/subjects/add", label: "Add Subject" },
    ],
  },
  {
    label: "Units", icon: Boxes, children: [
      { to: "/admin/units", label: "Manage Units" },
      { to: "/admin/units/add", label: "Add Unit" },
    ],
  },
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
