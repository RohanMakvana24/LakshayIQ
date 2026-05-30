import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppShell, type NavItem } from "@/components/app-shell";
import { Home, Bookmark, Search, GraduationCap, UserCircle, FileText, FolderGit2 } from "lucide-react";
import { toast } from "sonner";

const items: NavItem[] = [
  { to: "/student", label: "Dashboard", icon: Home },
  { to: "/student/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/student/resume", label: "Resume Builder", icon: FileText },
  { to: "/student/projects", label: "Project Helper", icon: FolderGit2 },
  { to: "/student/search", label: "Search", icon: Search },
  { to: "/student/profile", label: "My Profile", icon: UserCircle },
];

export const Route = createFileRoute("/_authenticated/student")({
  component: StudentLayout,
});

function StudentLayout() {
  const { role, loading } = useAuth();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  
  useEffect(() => { 
    if (!loading && role === "admin") nav({ to: "/admin" }); 
  }, [role, loading, nav]);

  // Global Student Security Safeguards
  useEffect(() => {
    const isResumePath = pathname.includes("/student/resume");
    if (isResumePath) return;

    // 1. Block standard developer tools and save/print/view-source shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.key === "p") || // Ctrl + P
        (e.ctrlKey && e.key === "s") || // Ctrl + S
        (e.ctrlKey && e.shiftKey && e.key === "I") || // Ctrl + Shift + I
        (e.ctrlKey && e.shiftKey && e.key === "J") || // Ctrl + Shift + J
        (e.ctrlKey && e.key === "u") || // Ctrl + U
        e.key === "F12"
      ) {
        e.preventDefault();
        toast.warning("🔒 Security policy: Inspecting and printing are disabled on this portal.");
      }

      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("");
        e.preventDefault();
        toast.error("🔒 Screenshots are disabled for security!");
      }
    };

    // 2. Prevent right-click options globally
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning("🔒 Right-click options are restricted on this portal.");
    };

    // 3. Block text copying, cutting and drag operations
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : "";
      
      if (selectedText.length > 30) {
        e.preventDefault();
        toast.warning("🔒 Bulk copying is disabled to protect academic resources.");
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // 4. Smart selection validation: allow small selections (clicks/words), block large selections (bulk copy)
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection) return;
      const selectedText = selection.toString().trim();
      
      // If student tries to select a large block (more than 30 characters)
      if (selectedText.length > 30) {
        selection.removeAllRanges(); // Clear selection instantly
        toast.warning("🔒 Bulk selection is restricted to protect content integrity.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("cut", handleCut);
    window.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("cut", handleCut);
      window.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [pathname]);

  const isResumePath = pathname.includes("/student/resume");

  return (
    <>
      <style>{`
        /* Disable dragging across the entire student portal */
        * {
          -webkit-user-drag: none !important;
        }
        
        /* Force blank page on print attempts only if not on resume path */
        @media print {
          body, html, #root {
            display: ${isResumePath ? "block" : "none"} !important;
            visibility: ${isResumePath ? "visible" : "hidden"} !important;
          }
        }
      `}</style>
      <AppShell items={items} variant="student">
        <Outlet />
      </AppShell>
    </>
  );
}

export const _icon = GraduationCap;
