import { useState, useEffect } from "react";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Play, FileText, Bookmark, Star, Download, ExternalLink, Sparkles, MonitorPlay, Clock, ChevronRight, Flame, Sword, X, Shield, Lock } from "lucide-react";
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

  useEffect(() => {
    checkBookmark();
  }, [unit.id]);

  // Security listener to block screenshots and handle blur state
  useEffect(() => {
    let focusInterval: NodeJS.Timeout | null = null;

    const handleBlur = () => {
      // Small timeout to allow activeElement to stabilize
      setTimeout(() => {
        if (
          document.activeElement &&
          document.activeElement.tagName === "IFRAME" &&
          document.hasFocus()
        ) {
          // Focus is inside the iframe, and the window still has focus. This is safe.
          return;
        }
        setIsWindowBlurred(true);
      }, 100);
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsWindowBlurred(true);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // If a secure material is active, run a fast polling check to catch Alt-Tab,
    // window minimization, and Snipping Tool activations when the focus is inside the iframe
    if (activePreview.type === "material") {
      focusInterval = setInterval(() => {
        if (!document.hasFocus()) {
          setIsWindowBlurred(true);
        } else {
          // If the parent document has focus, but we were blurred (e.g. back to iframe)
          // ensure we keep it visible
          if (document.activeElement && document.activeElement.tagName === "IFRAME") {
            setIsWindowBlurred(false);
          }
        }
      }, 250);
    }

    // Prevent shortcut keys & developer tools
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
        toast.warning("🔒 Security policy: Screen operations and source inspections are disabled.");
      }
      
      // Block PrintScreen keyup / keydown to discourage screenshot attempts
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText(""); // clear clipboard
        e.preventDefault();
        toast.error("🔒 Screenshots are disabled for security!");
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
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      if (focusInterval) {
        clearInterval(focusInterval);
      }
    };
  }, [activePreview.type]);

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
                className="rounded-xl h-10 px-4 text-xs font-bold shadow-sm shrink-0 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Bookmark className={cn("mr-1.5 h-3.5 w-3.5", isBookmarked && "fill-white")} />
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
                  <>
                    <div className="bg-slate-100 px-4 py-3 flex items-center justify-between border-b border-slate-200 shrink-0">
                      <div className="flex items-center gap-2 truncate">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {activePreview.type === "material" ? "🔒 Secure View" : "Now Playing"}
                        </span>
                        <span className="text-sm font-medium text-slate-800 truncate">{activePreview.title}</span>
                      </div>
                      
                      {activePreview.type === "material" ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-200/50 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <Lock className="h-2.5 w-2.5" /> Security Mode
                          </span>
                          <Button
                            onClick={() => setIsFullscreenSecure(true)}
                            size="sm"
                            className="h-7 rounded-lg text-[10px] font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm border-0 flex items-center gap-1 px-2.5"
                          >
                            <Shield className="h-3 w-3" /> Maximize
                          </Button>
                        </div>
                      ) : (
                        <a
                          href={activePreview.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex-1 bg-slate-900 relative overflow-hidden">
                      <iframe
                        title={activePreview.title}
                        src={formatEmbedUrl(activePreview.url, activePreview.type)}
                        className="w-full border-0 absolute"
                        style={
                          activePreview.type === "material" && activePreview.url.includes("notion")
                            ? { top: "-50px", height: "calc(100% + 50px)", left: 0, right: 0 }
                            : { top: 0, height: "100%", left: 0, right: 0 }
                        }
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen={activePreview.type !== "material"}
                      />
                      
                      {/* Screenshot Shield in normal preview */}
                      {isWindowBlurred && activePreview.type === "material" && (
                        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
                          <div className="h-16 w-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                            <Sword className="h-7 w-7 text-rose-500 animate-pulse" />
                          </div>
                          <h3 className="text-white font-bold text-lg uppercase tracking-wider">🔒 Security Mode Active</h3>
                          <p className="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">
                            Screen capture and background viewing are restricted to protect intellectual property and academic integrity.
                          </p>
                        </div>
                      )}
                    </div>
                    {activePreview.type === "material" && activePreview.url.includes("notion") && (
                      <div className="bg-emerald-50 border-t border-emerald-100/50 px-4 py-3 flex items-center justify-between gap-4 shrink-0 text-[10px] text-emerald-800 font-medium">
                        <span className="flex items-center gap-1.5 leading-snug">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 animate-pulse" />
                          <span>
                            <strong>Notion Setup Tip:</strong> Ensure this page is published to the web in Notion (<strong>Share &gt; Publish &gt; Publish to web</strong>) for seamless viewing.
                          </span>
                        </span>
                      </div>
                    )}
                  </>
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

      {/* High Security Distraction-Free Fullscreen Viewer */}
      {isFullscreenSecure && activePreview.type === "material" && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950 flex flex-col w-screen h-screen select-none transition-all duration-300"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Secure Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Sparkles className="h-3 w-3 text-emerald-400 animate-pulse" /> Secure Reader Arena
              </span>
              <h2 className="text-sm font-bold text-white truncate max-w-xl">
                {activePreview.title}
              </h2>
            </div>
            
            <Button
              onClick={() => setIsFullscreenSecure(false)}
              className="rounded-xl h-9 px-4 text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md border-0 transition-all flex items-center gap-1.5 animate-pulse"
            >
              <X className="h-4 w-4" /> Close Secure View
            </Button>
          </div>

          {/* Iframe Workspace */}
          <div className="flex-1 bg-slate-900 relative overflow-hidden">
            <iframe
              title={activePreview.title}
              src={formatEmbedUrl(activePreview.url, activePreview.type)}
              className="w-full border-0 absolute"
              style={
                activePreview.type === "material" && activePreview.url.includes("notion")
                  ? { top: "-50px", height: "calc(100% + 50px)", left: 0, right: 0 }
                  : { top: 0, height: "100%", left: 0, right: 0 }
              }
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            
            {/* Screenshot Shield in Fullscreen */}
            {isWindowBlurred && (
              <div className="absolute inset-0 z-[101] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
                <div className="h-20 w-20 rounded-full bg-rose-500/10 border border-rose-500/35 flex items-center justify-center mb-6 shadow-2xl">
                  <Sword className="h-10 w-10 text-rose-500 animate-pulse" />
                </div>
                <h3 className="text-white font-black text-2xl uppercase tracking-widest">🔒 Security Mode Active</h3>
                <p className="text-slate-400 text-sm max-w-md mt-3 leading-relaxed">
                  Screen capture, background windows, and screenshot utility hooks have been intercepted to protect resource integrity.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inject Print and Selection Safeguards */}
      <style>{`
        @media print {
          body {
            display: none !important;
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