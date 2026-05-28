import { useState, useEffect, useRef } from "react";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Play, FileText, Bookmark, Star, Download, ExternalLink, Sparkles, MonitorPlay, Clock, ChevronRight, Flame, Sword, X, Shield, Lock, Maximize, Loader2 } from "lucide-react";
import { PageLoader } from "@/components/page-loader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/unit/$id")({
  loader: async ({ params }) => {
    // Fetch unit with its related data (videos, materials, important questions)
    const { data: unit, error } = await supabase
      .from("units")
      .select(`*, unit_videos(*), unit_materials(*), important_questions(*)`)
      .eq("id", params.id)
      .single();

    if (error || !unit) throw notFound();

    // Also fetch semester, course, university for breadcrumb
    let semester = null;
    let course = null;
    let university = null;

    if (unit.subject_id) {
      const { data: subject } = await supabase
        .from("subjects")
        .select("id, semester_id")
        .eq("id", unit.subject_id)
        .single();

      if (subject?.semester_id) {
        const { data: sem } = await supabase
          .from("semesters")
          .select("id, semester_number, title, course_id")
          .eq("id", subject.semester_id)
          .single();
        semester = sem;

        if (semester?.course_id) {
          const { data: c } = await supabase
            .from("courses")
            .select("id, name, slug, university_id")
            .eq("id", semester.course_id)
            .single();
          course = c;

          if (course?.university_id) {
            const { data: u } = await supabase
              .from("universities")
              .select("id, name, slug")
              .eq("id", course.university_id)
              .single();
            university = u;
          }
        }
      }
    }

    return { unit, semester, course, university };
  },
  pendingMs: 0,
  pendingComponent: () => <PageLoader label="Loading Unit" />,
  component: UnitPage,
});

function UnitPage() {
  const { unit, semester, course, university } = Route.useLoaderData();
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<{
    type: "video" | "material" | null;
    title: string;
    url: string;
  }>({ type: null, title: "", url: "" });
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [isFullscreenSecure, setIsFullscreenSecure] = useState(false);
  const [isFullscreenEntering, setIsFullscreenEntering] = useState(false);
  const [isFullscreenExiting, setIsFullscreenExiting] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [loadedIframes, setLoadedIframes] = useState<Record<string, boolean>>({});
  const [shouldPreload, setShouldPreload] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const isNotionMaterial = activePreview.type === "material" && activePreview.url.includes("notion");
  const isClickUpMaterial = activePreview.type === "material" && activePreview.url.includes("clickup.com");
  const isCurrentIframeLoading = activePreview.type === "material" && activePreview.url
    ? !loadedIframes[activePreview.url]
    : isIframeLoading;
  const isWorkspaceTransitioning = isFullscreenEntering || isFullscreenExiting;

  const runViewTransition = async (update: () => void | Promise<void>) => {
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      const doc = document as Document & {
        startViewTransition: (callback: () => void | Promise<void>) => { finished: Promise<void> };
      };
      await doc.startViewTransition(update).finished;
      return;
    }
    await update();
  };

  useEffect(() => {
    checkBookmark();
  }, [unit.id]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (activePreview.url) {
      setIsIframeLoading(true);
      setIsHovered(false); // Reset hover state when preview url changes
    }
  }, [activePreview.url]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement === workspaceRef.current;
      setIsFullscreenSecure(isCurrentlyFullscreen);
      setIsFullscreenEntering(false);
      setIsFullscreenExiting(false);

      if (isCurrentlyFullscreen) {
        setIsWindowBlurred(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldPreload(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const preconnectUrls = [
      "https://www.notion.so",
      "https://notion.site",
      "https://sharing.clickup.com",
      "https://clickup.com",
      "https://appflowy.cloud",
      "https://appflowy.io",
      "https://fonts.googleapis.com",
    ];

    const links = preconnectUrls.map((href) => {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
      return link;
    });

    return () => {
      links.forEach((link) => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, []);

  const handleMaximize = async () => {
    try {
      const workspace = workspaceRef.current;
      if (!workspace) return;

      setIsFullscreenEntering(true);
      setIsWindowBlurred(false);
      setIsHovered(true);

      await runViewTransition(() => workspace.requestFullscreen());
    } catch (err) {
      setIsFullscreenEntering(false);
      setIsFullscreenSecure(false);
      console.error("Error entering fullscreen secure mode:", err);
      toast.error("Could not enter fullscreen mode");
    }
  };

  const handleMinimize = async () => {
    try {
      if (!document.fullscreenElement) return;

      setIsFullscreenExiting(true);
      await runViewTransition(() => document.exitFullscreen());
    } catch (err) {
      setIsFullscreenExiting(false);
      console.error("Error exiting fullscreen secure mode:", err);
    }
  };

  // Security listener to block screenshots and handle blur state
  useEffect(() => {
    let focusInterval: NodeJS.Timeout | null = null;

    const handleBlur = () => {
      // Small timeout to allow activeElement to stabilize
      setTimeout(() => {
        const isInFullscreen = document.fullscreenElement === workspaceRef.current;
        if (!document.hasFocus() && !isFullscreenEntering && !isFullscreenExiting && !isInFullscreen) {
          setIsWindowBlurred(true);
        }
      }, 100);
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      const isInFullscreen = document.fullscreenElement === workspaceRef.current;
      if (document.visibilityState === "hidden" && !isFullscreenEntering && !isFullscreenExiting && !isInFullscreen) {
        setIsWindowBlurred(true);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // If a secure material is active, run a fast polling check to catch Alt-Tab,
    // window minimization, and Snipping Tool activations.
    if (activePreview.type === "material") {
      focusInterval = setInterval(() => {
        const isInFullscreen = document.fullscreenElement === workspaceRef.current;
        if (!document.hasFocus() && !isFullscreenEntering && !isFullscreenExiting && !isInFullscreen) {
          setIsWindowBlurred(true);
        } else {
          setIsWindowBlurred(false);
        }
      }, 250);
    }

    // Prevent shortcut keys, developer tools & catch screenshot key patterns instantly
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Detect PrintScreen / Snapshot
      const isPrintScreen = e.key === "PrintScreen" || e.key === "Snapshot" || e.keyCode === 44;
      
      // 2. Detect Win + Shift + S (Windows Snipping Tool)
      const isWinShiftS = e.metaKey && e.shiftKey && (e.key === "S" || e.key === "s");
      
      // 3. Detect Cmd + Shift + 3 / 4 (Mac Screenshots)
      const isMacScreenshot = e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4");

      // 4. Detect dev tools or other lock keys
      const isDevTools = (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "i" || e.key === "j")) ||
                         (e.ctrlKey && (e.key === "u" || e.key === "U")) ||
                         e.key === "F12";
      
      const isPrintPrompt = e.ctrlKey && (e.key === "p" || e.key === "P");
      const isSavePrompt = e.ctrlKey && (e.key === "s" || e.key === "S");

      if (isPrintScreen || isWinShiftS || isMacScreenshot) {
        e.preventDefault();
        setIsWindowBlurred(true);
        navigator.clipboard.writeText(""); // Clear clipboard buffer
        toast.error("🔒 Screenshots are disabled for security!");
        
        // Lock screen for 2 seconds to ensure any screen capture catches the black overlay
        setTimeout(() => {
          setIsWindowBlurred(false);
        }, 2000);
        return;
      }

      if (isDevTools || isPrintPrompt || isSavePrompt) {
        e.preventDefault();
        toast.warning("🔒 Security policy: Screen operations and source inspections are disabled.");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const isPrintScreen = e.key === "PrintScreen" || e.key === "Snapshot" || e.keyCode === 44;
      const isWinShiftS = e.metaKey && e.shiftKey && (e.key === "S" || e.key === "s");
      const isMacScreenshot = e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4");

      if (isPrintScreen || isWinShiftS || isMacScreenshot) {
        setIsWindowBlurred(true);
        navigator.clipboard.writeText(""); // Clear clipboard buffer
        setTimeout(() => {
          setIsWindowBlurred(false);
        }, 2000);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Allow standard clicks but restrict right click options on materials
      if (activePreview.type === "material") {
        e.preventDefault();
        toast.warning("🔒 Right-click options are restricted in Secure Mode.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("contextmenu", handleContextMenu);
      if (focusInterval) {
        clearInterval(focusInterval);
      }
    };
  }, [activePreview.type, isFullscreenEntering, isFullscreenExiting]);

  const checkBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("unit_id", unit.id)
      .maybeSingle();
    if (data) {
      setBookmarkId(data.id);
      setIsBookmarked(true);
    }
  };

  const toggleBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (isBookmarked && bookmarkId) {
      const { error } = await supabase.from("bookmarks").delete().eq("id", bookmarkId);
      if (error) return toast.error(error.message);
      setIsBookmarked(false);
      setBookmarkId(null);
      toast.success("Bookmark removed");
    } else {
      const { data, error } = await supabase
        .from("bookmarks")
        .insert({ user_id: user.id, unit_id: unit.id })
        .select("id")
        .single();
      if (error) return toast.error(error.message);
      setBookmarkId(data.id);
      setIsBookmarked(true);
      toast.success("Unit bookmarked");
    }
  };

  const formatEmbedUrl = (url: string, type: "video" | "material") => {
    if (!url) return "";
    if (type === "material") {
      // Auto-convert standard private application notion.so URLs to public notion.site domain
      if (url.includes("notion.so")) {
        return url.replace(/(www\.)?notion\.so/i, "notion.site");
      }
      // Auto-convert standard Coda URLs to Coda embed format
      if (url.includes("coda.io") && url.includes("/d/")) {
        return url.replace("/d/", "/embed/");
      }
      if (url.toLowerCase().includes(".pdf")) {
        return url.includes("#") ? `${url}&toolbar=0&navpanes=0` : `${url}#toolbar=0&navpanes=0`;
      }
      return url;
    }
    if (url.includes("youtube.com/watch?v=")) {
      return url.replace("youtube.com/watch?v=", "youtube.com/embed/");
    }
    if (url.includes("youtu.be/")) {
      return url.replace("youtu.be/", "youtube.com/embed/");
    }
    return url;
  };

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: "Dashboard", to: "/student" },
    ...(university ? [{ label: university.name, to: "/student/university/$id", params: { id: university.id } }] : []),
    ...(course ? [{ label: course.slug || "Course", to: "/student/course/$id", params: { id: course.id } }] : []),
    ...(semester ? [{ label: semester.title || `Semester ${semester.semester_number}`, to: "/student/semester/$id", params: { id: semester.id } }] : []),
    { label: unit.title || `Unit ${unit.unit_number}` },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full px-4 py-4 md:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <div className="mb-4">
          <BreadcrumbNav items={breadcrumbItems} />
        </div>

        {/* Header Section - Compact */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden mb-6 shadow-lg">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-0 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl" />
          <div className="absolute bottom-0 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl" />
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%)] bg-[length:16px_16px]" />

          <div className="relative z-10 px-5 py-5 md:px-7 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="inline-flex items-center gap-2">
                  <span className="bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-white/20">
                    Unit {unit.unit_number}
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                  {unit.title}
                </h1>
                <p className="text-slate-300 text-xs md:text-sm max-w-2xl">
                  {unit.description || "Access video lectures, study materials, and important questions for this unit."}
                </p>
              </div>
              <Button
                variant={isBookmarked ? "default" : "outline"}
                onClick={toggleBookmark}
                className="rounded-xl h-8 md:h-10 px-3 md:px-4 text-[10px] md:text-xs font-bold shadow-sm shrink-0 bg-white/10 border-white/20 text-white hover:bg-white/20 w-fit self-start md:self-auto"
              >
                <Bookmark className={cn("mr-1 md:mr-1.5 h-3 w-3 md:h-3.5 md:w-3.5", isBookmarked && "fill-white")} />
                {isBookmarked ? "Saved" : "Save Unit"}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Resources List */}
          <div className="lg:col-span-5 space-y-6">
            {/* Video Lectures Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Video Lectures</h2>
                <Badge variant="secondary" className="text-[10px] bg-slate-100">
                  {unit.unit_videos?.length || 0}
                </Badge>
              </div>
              {unit.unit_videos?.length > 0 ? (
                <div className="grid gap-2">
                  {unit.unit_videos.map((video: any) => {
                    const isActive = activePreview.type === "video" && activePreview.title === video.title;
                    return (
                      <Card
                        key={video.id}
                        onClick={() => setActivePreview({ type: "video", title: video.title, url: video.video_url || "" })}
                        className={cn(
                          "p-3 flex items-center gap-3 rounded-xl border transition-all cursor-pointer bg-white hover:shadow-md",
                          isActive ? "border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/20" : "border-slate-200"
                        )}
                      >
                        <div className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          isActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-800 group-hover:text-white"
                        )}>
                          <Play className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">{video.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-500">{video.duration || "15 mins"}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <EmptyStateRow icon={Play} message="No video lectures available" />
              )}
            </div>

            {/* Study Materials Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Study Materials</h2>
                <Badge variant="secondary" className="text-[10px] bg-slate-100">
                  {unit.unit_materials?.length || 0}
                </Badge>
              </div>
              {unit.unit_materials?.length > 0 ? (
                <div className="grid gap-2">
                  {unit.unit_materials.map((material: any) => {
                    const isActive = activePreview.type === "material" && activePreview.title === material.title;
                    return (
                      <Card
                        key={material.id}
                        onClick={() => setActivePreview({ type: "material", title: material.title, url: material.file_url || "" })}
                        className={cn(
                          "p-3 flex items-center gap-3 rounded-xl border transition-all cursor-pointer bg-white hover:shadow-md",
                          isActive ? "border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/20" : "border-slate-200"
                        )}
                      >
                        <div className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                          isActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                        )}>
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">{material.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {material.file_type || "PDF"} • {material.file_size || "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <EmptyStateRow icon={FileText} message="No study materials available" />
              )}
            </div>

            {/* Important Questions Portal Card */}
            <Card className="overflow-hidden border border-slate-200 bg-white rounded-2xl p-5 shadow-md relative group">
              {/* Subtle brand ambient glow background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300 pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold tracking-widest text-emerald-600 uppercase flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 animate-pulse text-emerald-500" /> Syllabus Focus Active
                    </span>
                    <h3 className="text-sm font-black tracking-tight text-slate-800 uppercase flex items-center gap-1.5">
                      📚 Important Questions Bank
                    </h3>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-50 border-emerald-100 text-emerald-700 font-mono text-[9px] uppercase tracking-wider">
                    4 Tiers
                  </Badge>
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  Get exam-ready with high-yield syllabus questions. Explore important topics sorted by standard exam weightage (1, 2, 3, and 5 Marks).
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] font-semibold text-slate-500">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center gap-2">
                    <span className="text-sm">📖</span>
                    <div>
                      <p className="text-slate-800 font-bold">Curated List</p>
                      <p className="text-[9px] text-slate-400">1 to 5 Marks</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center gap-2">
                    <span className="text-sm">🎯</span>
                    <div>
                      <p className="text-slate-800 font-bold">Target Study</p>
                      <p className="text-[9px] text-slate-400">Syllabus blueprint</p>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/student/arena/${unit.id}`}
                  className="w-full h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 text-center"
                >
                  <Star className="h-3.5 w-3.5 fill-white" />
                  VIEW IMPORTANT QUESTIONS
                </Link>
              </div>
            </Card>
          </div>

          {/* Right Column - Preview Panel */}
          <div className="lg:col-span-7">
            <div className="sticky top-6">
              <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg rounded-2xl flex flex-col h-[400px] md:h-[500px] lg:h-[550px] relative">
                {activePreview.type && activePreview.url ? (
                  <div 
                    ref={workspaceRef}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onMouseMove={() => { if (!isHovered) setIsHovered(true); }}
                    onTouchStart={() => setIsHovered(true)}
                    className={cn(
                      "flex flex-col relative overflow-hidden bg-slate-900 fullscreen-workspace",
                      "transition-[box-shadow,filter] duration-500 ease-workspace",
                      isWorkspaceTransitioning && "workspace-phase-transition",
                      isFullscreenSecure ? "workspace-phase-active min-h-0 p-0" : "flex-1 min-h-0"
                    )}
                  >
                    {isWorkspaceTransitioning && (
                      <div className="workspace-transition-veil" aria-hidden />
                    )}

                    {/* Unified header — morphs instead of swapping DOM */}
                    <div
                      className={cn(
                        "preview-workspace-header shrink-0 z-30 flex items-center justify-between gap-3 border-b",
                        "transition-all duration-500 ease-workspace",
                        isFullscreenSecure
                          ? "bg-slate-900 border-slate-800 px-3 py-2.5 md:px-6 md:py-4"
                          : "bg-slate-100 border-slate-200 px-4 py-3"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        <Sparkles
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-colors duration-500",
                            isFullscreenSecure ? "text-emerald-400 animate-pulse" : "text-emerald-600 animate-pulse"
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-semibold uppercase tracking-wider transition-all duration-500 ease-workspace",
                            isFullscreenSecure
                              ? "hidden sm:inline-flex bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3 py-1 font-black items-center gap-1.5"
                              : "text-slate-500"
                          )}
                        >
                          {isFullscreenSecure ? (
                            <>Secure Reader Arena</>
                          ) : activePreview.type === "material" ? (
                            "🔒 Secure View"
                          ) : (
                            "Now Playing"
                          )}
                        </span>
                        <span
                          className={cn(
                            "truncate transition-colors duration-500",
                            isFullscreenSecure
                              ? "text-xs md:text-sm font-bold text-white max-w-xl"
                              : "text-sm font-medium text-slate-800"
                          )}
                        >
                          {activePreview.title}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "flex flex-wrap items-center gap-2 shrink-0 transition-all duration-500 ease-workspace",
                          isFullscreenSecure ? "opacity-100 translate-y-0" : "opacity-100"
                        )}
                      >
                        {!isFullscreenSecure && activePreview.type === "material" && (
                          <>
                            <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-200/50 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-transform duration-300 hover:scale-[1.02]">
                              <Lock className="h-2.5 w-2.5" /> Security Mode
                            </span>
                            {isNotionMaterial && (
                              <span className="bg-slate-900/95 text-slate-100 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                Notion Turbo
                              </span>
                            )}
                            <Button
                              onClick={handleMaximize}
                              disabled={isWorkspaceTransitioning}
                              size="sm"
                              className="h-7 rounded-lg text-[10px] font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm border-0 flex items-center gap-1 px-2.5 transition-all duration-300 ease-workspace hover:scale-[1.03] active:scale-95 disabled:opacity-60"
                            >
                              <Maximize
                                className={cn(
                                  "h-3 w-3 transition-transform duration-500 ease-workspace",
                                  isFullscreenEntering && "scale-110 rotate-90"
                                )}
                              />
                              Maximize
                            </Button>
                          </>
                        )}
                        {!isFullscreenSecure && activePreview.type !== "material" && (
                          <a
                            href={activePreview.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors duration-300"
                          >
                            <span>Open</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {isFullscreenSecure && (
                          <Button
                            onClick={handleMinimize}
                            disabled={isWorkspaceTransitioning}
                            className="rounded-xl h-8 md:h-9 px-2.5 md:px-4 text-[10px] md:text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md border-0 transition-all duration-300 ease-workspace flex items-center gap-1 md:gap-1.5 hover:scale-[1.02] active:scale-95 disabled:opacity-60 animate-workspace-reveal"
                          >
                            <X className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
                            Close Secure View
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Iframe Workspace (Same DOM node preserved to prevent unmount and re-running scripts) */}
                    <div
                      className={cn(
                        "flex-1 w-full min-h-0 relative overflow-hidden bg-slate-900 iframe-host workspace-content-shell",
                        isNotionMaterial && "notion-embed-host",
                        isClickUpMaterial && "clickup-embed-host",
                        isWorkspaceTransitioning && "workspace-content-transitioning"
                      )}
                    >
                      {isCurrentIframeLoading && (
                        <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 workspace-loading-veil">
                          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mb-3" />
                          <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider animate-pulse">
                            Loading Material...
                          </p>
                        </div>
                      )}
                      
                      {/* For Video Preview: Single video player iframe */}
                      {activePreview.type === "video" && (
                        <iframe
                          title={activePreview.title}
                          src={formatEmbedUrl(activePreview.url, "video")}
                          onLoad={() => setIsIframeLoading(false)}
                          className={cn(
                            "embed-frame border-0",
                            !isIframeLoading && "embed-frame-ready",
                            isWorkspaceTransitioning && "embed-frame-transitioning"
                          )}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}

                      {/* For Material Preview: Pre-rendered persistent cached iframes */}
                      {unit.unit_materials?.map((material: any) => {
                        const isActive = activePreview.type === "material" && activePreview.url === material.file_url;
                        const isNotion = material.file_url?.includes("notion");
                        const isClickUp = material.file_url?.includes("clickup.com");
                        const isAppFlowy = material.file_url?.includes("appflowy");

                        return (
                          <iframe
                            key={`material-frame-${material.id}`}
                            title={material.title}
                            src={formatEmbedUrl(material.file_url || "", "material")}
                            onLoad={() => setLoadedIframes(prev => ({ ...prev, [material.file_url || ""]: true }))}
                            className={cn(
                              "embed-frame border-0",
                              isActive ? "embed-frame-ready z-10" : "opacity-0 pointer-events-none -z-10",
                              isNotion && "notion-embed-frame",
                              isClickUp && "clickup-embed-frame",
                              isAppFlowy && "appflowy-embed-frame",
                              isWorkspaceTransitioning && "embed-frame-transitioning"
                            )}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        );
                      })}

                      {/* Dynamic Security Watermark Overlay */}
                      {activePreview.type === "material" && (
                        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none opacity-[0.05] flex flex-wrap gap-12 p-8 justify-around items-center content-around">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div 
                              key={`watermark-${i}`} 
                              className="text-[10px] md:text-xs font-black text-slate-400 transform -rotate-12 select-none pointer-events-none whitespace-nowrap tracking-wider"
                            >
                              LAKSHAY IQ
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Hover to Reveal Shield Overlay (Only active when not in fullscreen) */}
                      {!isHovered && !isCurrentIframeLoading && !isFullscreenSecure && activePreview.type === "material" && (
                        <div className="absolute inset-0 z-20 bg-slate-950/98 flex flex-col items-center justify-center text-center p-6 workspace-shield-overlay">
                          <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                            <Shield className="h-5 w-5 text-emerald-500 animate-pulse" />
                          </div>
                          <h4 className="text-white font-bold text-sm uppercase tracking-wider">🔒 Secure Content Shield</h4>
                          <p className="text-slate-400 text-[10px] max-w-xs mt-1.5 leading-relaxed">
                            Move cursor or tap inside this workspace area to reveal secure material.
                          </p>
                        </div>
                      )}
                      
                      {/* Screenshot Shield overlay inside the exact same container */}
                      {isWindowBlurred && activePreview.type === "material" && (
                        <div className="absolute inset-0 z-50 bg-slate-950/98 flex flex-col items-center justify-center text-center p-6 workspace-shield-overlay">
                          <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                            <Shield className="h-7 w-7 text-emerald-500 animate-pulse" />
                          </div>
                          <h2 className="text-emerald-500 font-black text-3xl tracking-widest mb-1 uppercase">
                            LAKSHAY IQ
                          </h2>
                          <h3 className="text-white font-bold text-sm uppercase tracking-wider">🔒 Security Mode Active</h3>
                          <p className="text-slate-400 text-[10px] max-w-sm mt-1 leading-relaxed">
                            Screen capture and background viewing are restricted to protect intellectual property and academic integrity.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-gradient-to-br from-slate-50 to-slate-100">
                    <div className="h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center">
                      <MonitorPlay className="h-6 w-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Preview Panel</p>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        Click on any video or study material from the left to preview it here.
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden preloader container to cache files natively in the background */}
      {shouldPreload && (
        <div className="hidden absolute w-0 h-0 overflow-hidden" aria-hidden="true">
          {unit.unit_videos?.map((video: any) => (
            <iframe
              key={`preload-video-${video.id}`}
              src={formatEmbedUrl(video.video_url || "", "video")}
              className="w-0 h-0 border-0"
            />
          ))}
        </div>
      )}

      {/* Absolute Full-Screen Security Shield covering the ENTIRE viewport */}
      {isWindowBlurred && activePreview.type === "material" && (
        <div 
          className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center text-center p-6 select-none workspace-shield-overlay"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="h-24 w-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/5">
            <Shield className="h-12 w-12 text-emerald-500 animate-pulse" />
          </div>
          
          <h2 className="text-emerald-500 font-black text-5xl md:text-6xl tracking-wider mb-2 uppercase drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            LAKSHAY IQ
          </h2>
          
          <h3 className="text-white font-bold text-lg md:text-xl uppercase tracking-widest mb-4">
            🔒 SECURE READER SHIELD
          </h3>
          
          <p className="text-slate-400 text-xs md:text-sm max-w-md leading-relaxed">
            This study resource is protected by Lakshay IQ intellectual property policy. Screen capture and copying have been blocked.
          </p>
          
          <p className="text-xs text-slate-500 mt-8 font-black uppercase tracking-widest animate-pulse">
            Click back inside this window to restore view
          </p>
        </div>
      )}

      {/* Inject Print and Fullscreen Styles */}
      <style>{`
        @media print {
          body {
            display: none !important;
          }
        }
        .ease-workspace {
          transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fullscreen-workspace {
          view-transition-name: secure-workspace;
        }
        .embed-frame {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          opacity: 0.92;
          transform: scale(0.995);
          transition:
            opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.65s cubic-bezier(0.16, 1, 0.3, 1),
            top 0.55s cubic-bezier(0.16, 1, 0.3, 1),
            height 0.55s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .embed-frame-ready {
          opacity: 1;
          transform: scale(1);
        }
        .embed-frame-transitioning {
          opacity: 0.97;
          transform: scale(1.008);
        }
        .notion-embed-frame {
          top: -50px !important;
          height: calc(100% + 50px) !important;
        }
        .clickup-embed-frame {
          top: -56px !important;
          height: calc(100% + 56px) !important;
        }
        .appflowy-embed-frame {
          top: -48px !important;
          height: calc(100% + 48px) !important;
        }
        .workspace-content-shell {
          transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .workspace-content-transitioning {
          opacity: 0.94;
        }
        .workspace-phase-transition {
          filter: brightness(0.92);
        }
        .workspace-phase-active {
          box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.12), 0 24px 80px rgba(2, 6, 23, 0.45);
        }
        .workspace-transition-veil {
          position: absolute;
          inset: 0;
          z-index: 55;
          pointer-events: none;
          background:
            radial-gradient(ellipse 80% 60% at 50% 40%, rgba(16, 185, 129, 0.14) 0%, transparent 55%),
            linear-gradient(180deg, rgba(2, 6, 23, 0.35) 0%, rgba(2, 6, 23, 0.75) 100%);
          animation: workspaceVeil 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .workspace-loading-veil {
          animation: workspaceLoadingIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .workspace-shield-overlay {
          animation: workspaceShieldIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes workspaceVeil {
          0% { opacity: 0; backdrop-filter: blur(0); }
          35% { opacity: 1; backdrop-filter: blur(8px); }
          100% { opacity: 0; backdrop-filter: blur(0); }
        }
        @keyframes workspaceLoadingIn {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes workspaceShieldIn {
          from { opacity: 0; transform: translateY(6px) scale(1.01); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes workspaceReveal {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-workspace-reveal {
          animation: workspaceReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        :fullscreen.fullscreen-workspace,
        :-webkit-full-screen.fullscreen-workspace,
        :-moz-full-screen.fullscreen-workspace,
        :-ms-fullscreen.fullscreen-workspace {
          position: fixed !important;
          inset: 0 !important;
          display: grid !important;
          grid-template-rows: auto minmax(0, 1fr) !important;
          width: 100vw !important;
          height: 100vh !important;
          max-height: 100vh !important;
          padding: 0 !important;
          margin: 0 !important;
          background-color: #0f172a !important;
          z-index: 99999 !important;
          overflow: hidden !important;
        }
        :fullscreen.fullscreen-workspace .iframe-host,
        :-webkit-full-screen.fullscreen-workspace .iframe-host,
        :-moz-full-screen.fullscreen-workspace .iframe-host,
        :-ms-fullscreen.fullscreen-workspace .iframe-host {
          flex: none !important;
          min-height: 0 !important;
          height: 100% !important;
          width: 100% !important;
        }
        :fullscreen.fullscreen-workspace .notion-embed-frame,
        :-webkit-full-screen.fullscreen-workspace .notion-embed-frame,
        :-moz-full-screen.fullscreen-workspace .notion-embed-frame,
        :-ms-fullscreen.fullscreen-workspace .notion-embed-frame {
          top: 0 !important;
          height: 100% !important;
        }
        ::view-transition-old(secure-workspace),
        ::view-transition-new(secure-workspace) {
          animation-duration: 0.55s;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
        ::view-transition-old(secure-workspace) {
          animation-name: workspaceViewExit;
        }
        ::view-transition-new(secure-workspace) {
          animation-name: workspaceViewEnter;
        }
        @keyframes workspaceViewEnter {
          from { opacity: 0; transform: scale(0.985); filter: brightness(0.85); }
          to { opacity: 1; transform: scale(1); filter: brightness(1); }
        }
        @keyframes workspaceViewExit {
          from { opacity: 1; transform: scale(1); filter: brightness(1); }
          to { opacity: 0.92; transform: scale(0.99); filter: brightness(0.9); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fullscreen-workspace,
          .embed-frame,
          .preview-workspace-header,
          .workspace-transition-veil,
          .workspace-shield-overlay,
          .workspace-loading-veil {
            transition: none !important;
            animation: none !important;
          }
          .fullscreen-workspace {
            view-transition-name: none;
          }
        }
      `}</style>

    </div>
  );
}

// Helper Component for Empty States
function EmptyStateRow({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
      <Icon className="h-5 w-5 text-slate-400 mx-auto mb-1" />
      <p className="text-xs text-slate-500">{message}</p>
    </div>
  );
}

// Badge component (simple replacement)
function Badge({ variant, className, children }: { variant?: string; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>{children}</span>;
}