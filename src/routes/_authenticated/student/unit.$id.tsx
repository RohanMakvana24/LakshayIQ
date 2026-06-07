import { useState, useEffect, useRef } from "react";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Play, FileText, Bookmark, Star, Download, ExternalLink, Sparkles, MonitorPlay, Clock, ChevronRight, Flame, Sword, X, Maximize, Loader2, HelpCircle, Plus, Minus } from "lucide-react";
import { PageLoader } from "@/components/page-loader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Prism from "prismjs";
if (typeof window !== "undefined") {
  (window as any).Prism = Prism;
}
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";

const preprocessMarkdown = (text: string): string => {
  if (!text) return "";
  return text
    // Replace block math $$...$$
    .replace(/\$\$(.*?)\$\$/gs, (match, formula) => {
      let clean = formula
        .replace(/\\text\{(.*?)\}/g, "$1")
        .replace(/\\times/g, "×")
        .replace(/\\log/g, "log")
        .replace(/\\le/g, "≤")
        .replace(/\\ge/g, "≥")
        .replace(/\\ne/g, "≠")
        .replace(/\\pm/g, "±")
        .trim();
      return `\n\n> 📐 **Formula:**\n> **${clean}**\n\n`;
    })
    // Replace inline math $...$
    .replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      let clean = formula
        .replace(/\\text\{(.*?)\}/g, "$1")
        .replace(/\\times/g, "×")
        .replace(/\\log/g, "log")
        .replace(/\\le/g, "≤")
        .replace(/\\ge/g, "≥")
        .replace(/\\ne/g, "≠")
        .replace(/n\^2/g, "n²")
        .trim();
      return `**${clean}**`;
    });
};

function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const elementId = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const renderChart = async () => {
      const m = (window as any).mermaid;
      if (!m) {
        timeoutId = setTimeout(renderChart, 100);
        return;
      }
      try {
        m.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
        });
        const { svg: renderedSvg } = await m.render(elementId.current, chart);
        if (isMounted) {
          setSvg(renderedSvg);
          setError("");
        }
      } catch (err: any) {
        console.error("Mermaid render error:", err);
        const badElement = document.getElementById(elementId.current);
        if (badElement) {
          badElement.remove();
        }
        const bindElements = document.querySelectorAll(`[id^="${elementId.current}"]`);
        bindElements.forEach(el => el.remove());
        
        if (isMounted) {
          setError("Failed to render diagram.");
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-mono my-4">
        {error}
        <pre className="mt-2 opacity-70 text-[10px] overflow-auto max-h-32">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2 bg-[#f6f8fa] rounded-xl border border-[#d0d7de] my-4">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" />
        Rendering diagram...
      </div>
    );
  }

  return (
    <div 
      className="mermaid-svg-container bg-[#f6f8fa] p-4 rounded-xl border border-[#d0d7de] flex justify-center overflow-x-auto my-6 shadow-sm selection:bg-transparent"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [loadedIframes, setLoadedIframes] = useState<Record<string, boolean>>({});
  const [shouldPreload, setShouldPreload] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [isMarkdownLoading, setIsMarkdownLoading] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoomLevel(1.0);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const isNotionMaterial = activePreview.type === "material" && activePreview.url.includes("notion");
  const isClickUpMaterial = activePreview.type === "material" && activePreview.url.includes("clickup.com");
  const isMarkdownMaterial = activePreview.type === "material" && activePreview.url.includes(".md");
  
  const [activeMarksTab, setActiveMarksTab] = useState<number>(1);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const dynamicQuestions = (unit.important_questions || []) as any[];

  // Group dynamic questions by marks: 1, 2, 3, 5
  const groupedQuestions: Record<number, any[]> = {
    1: [],
    2: [],
    3: [],
    5: [],
  };

  dynamicQuestions.forEach((q) => {
    const m = q.marks || 1;
    if (groupedQuestions[m] !== undefined) {
      groupedQuestions[m].push(q);
    }
  });

  const activeQuestions = groupedQuestions[activeMarksTab] || [];
  
  const totalQuestions = Object.values(groupedQuestions).reduce(
    (acc, qs) => acc + qs.length,
    0
  );

  const isCurrentIframeLoading = activePreview.type === "material" && activePreview.url
    ? (isMarkdownMaterial 
        ? isMarkdownLoading 
        : (unit.unit_materials?.some((m: any) => m.file_url === activePreview.url)
            ? !loadedIframes[activePreview.url]
            : isIframeLoading))
    : isIframeLoading;


  useEffect(() => {
    checkBookmark();
  }, [unit.id]);

  useEffect(() => {
    if (activePreview.type === "material" && activePreview.url.includes(".md")) {
      setIsMarkdownLoading(true);
      fetch(activePreview.url)
        .then((res) => {
          if (!res.ok) throw new Error("Could not fetch markdown");
          return res.text();
        })
        .then((text) => {
          setMarkdownContent(preprocessMarkdown(text));
          setIsMarkdownLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setMarkdownContent("### ⚠️ Error\nFailed to load the study material from GitHub. Please check if the file is public and try again.");
          setIsMarkdownLoading(false);
        });
    } else {
      setMarkdownContent("");
    }
  }, [activePreview.url, activePreview.type]);

  useEffect(() => {
    if (activePreview.type === "material" && activePreview.url.includes(".md") && markdownContent) {
      const existingScript = document.getElementById("mermaid-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "mermaid-script";
        script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [markdownContent, activePreview.url, activePreview.type]);

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
    }
  }, [activePreview.url]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === workspaceRef.current);
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

  const handleMaximize = () => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    workspace.requestFullscreen().catch((err) => {
      console.error("Error entering fullscreen mode:", err);
      toast.error("Could not enter fullscreen mode");
    });
  };

  const handleMinimize = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error("Error exiting fullscreen mode:", err);
      });
    }
  };

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
      // Auto-convert Google Drive and Google Docs links to embeddable preview format
      if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
        let formattedUrl = url;
        if (url.includes("/view")) {
          formattedUrl = url.replace(/\/view(\?.*)?$/, "/preview");
        } else if (url.includes("/edit")) {
          formattedUrl = url.replace(/\/edit(\?.*)?$/, "/preview");
        }
        return formattedUrl;
      }
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
    <div className="min-h-screen w-full bg-white">
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

            {/* Important Questions Section */}
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center animate-pulse">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Important Questions
                  </h2>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-50 border border-emerald-200/50 text-emerald-700 font-mono">
                    {totalQuestions} Files/Qs
                  </Badge>
                </div>
              </div>

              {/* Difficulty Level Tabs */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[
                  { value: 1, label: "1 Mark", emoji: "🌱", color: "emerald", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                  { value: 2, label: "2 Marks", emoji: "⚡", color: "blue", bg: "bg-blue-50 text-blue-700 border-blue-200" },
                  { value: 3, label: "3 Marks", emoji: "🎯", color: "purple", bg: "bg-purple-50 text-purple-700 border-purple-200" },
                  { value: 5, label: "5 Marks", emoji: "🏆", color: "amber", bg: "bg-amber-50 text-amber-700 border-amber-200" }
                ].map((opt) => {
                  const isActive = activeMarksTab === opt.value;
                  const count = groupedQuestions[opt.value]?.length || 0;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setActiveMarksTab(opt.value)}
                      className={cn(
                        "py-1.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5",
                        isActive 
                          ? `${opt.bg} font-bold ring-1 ring-emerald-500/20 scale-[1.02] shadow-sm` 
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-500"
                      )}
                    >
                      <span className="text-xs">{opt.emoji}</span>
                      <span className="text-[9px] font-bold leading-none">{opt.label}</span>
                      <span className={cn("text-[8px] font-semibold mt-0.5 px-1 rounded-full", isActive ? "bg-white/60" : "bg-slate-100 text-slate-400")}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Questions list */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {activeQuestions.length > 0 ? (
                  activeQuestions.map((q, idx) => {
                    const isSelected = selectedQuestion === q.id;
                    const hasFile = !!q.question_file_url;
                    const isPdf = q.question_file_url?.toLowerCase().includes(".pdf");
                    const isMd = q.question_file_url?.toLowerCase().includes(".md");
                    const isPreviewActive = activePreview.url === q.question_file_url;

                    return (
                      <Card
                        key={q.id}
                        onClick={() => {
                          setSelectedQuestion(isSelected ? null : q.id);
                          if (hasFile && q.question_file_url) {
                            setActivePreview({
                              type: "material",
                              title: q.question_text,
                              url: q.question_file_url
                            });
                          }
                        }}
                        className={cn(
                          "p-3 border rounded-xl transition-all cursor-pointer bg-white hover:shadow-md",
                          isPreviewActive && hasFile
                            ? "border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500/20"
                            : isSelected
                              ? "border-slate-300 bg-slate-50/30"
                              : "border-slate-200"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-extrabold",
                            isPreviewActive && hasFile
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          )}>
                            {hasFile ? (
                              isMd ? "MD" : isPdf ? "PDF" : "📄"
                            ) : (
                              idx + 1
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <Badge variant="outline" className="text-[8px] font-mono uppercase bg-slate-50 px-1 border-slate-200 text-slate-500 leading-none py-0.5">
                                {q.category}
                              </Badge>
                              {q.year && (
                                <span className="text-[8px] font-mono font-bold text-slate-400 bg-slate-100 px-1 rounded">
                                  Year {q.year}
                                </span>
                              )}
                              {hasFile && (
                                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded flex items-center gap-0.5">
                                  Attached File
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-xs sm:text-sm text-slate-800 leading-snug">
                              {q.question_text}
                            </p>

                            {/* Detailed Context expanded on click */}
                            {isSelected && (
                              <div className="mt-2 pt-2 border-t border-slate-100/70 text-[10px] text-slate-500 space-y-1">
                                <p>
                                  <span className="font-bold text-emerald-600">Category:</span>{" "}
                                  <span className="capitalize">{q.category}</span>
                                </p>
                                {q.year && (
                                  <p>
                                    <span className="font-bold text-slate-700">Exam year:</span> {q.year}
                                  </p>
                                )}
                                {hasFile ? (
                                  <p className="text-emerald-600 font-bold flex items-center gap-0.5">
                                    <Sparkles className="h-2.5 w-2.5 animate-pulse" /> Click to open secure preview in right panel
                                  </p>
                                ) : (
                                  <p className="text-slate-400">
                                    No attachment file for this question entry.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <ChevronRight className={cn("h-4 w-4 text-slate-400 shrink-0 self-center transition-transform", isSelected && "rotate-90")} />
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <EmptyStateRow icon={HelpCircle} message={`No questions/files for ${activeMarksTab} Marks`} />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Preview Panel */}
          <div className="lg:col-span-7">
            <div className="sticky top-6">
              <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg rounded-2xl flex flex-col h-[400px] md:h-[500px] lg:h-[550px] relative">
                {activePreview.type && activePreview.url ? (
                  <div
                    ref={workspaceRef}
                    className={cn(
                      "flex flex-col relative overflow-hidden fullscreen-workspace",
                      isMarkdownMaterial ? "bg-white" : "bg-slate-900",
                      isFullscreen ? "workspace-phase-active min-h-0 p-0" : "flex-1 min-h-0"
                    )}
                  >

                    {/* Unified header — morphs instead of swapping DOM */}
                    <div
                      className={cn(
                        "preview-workspace-header shrink-0 z-30 flex items-center justify-between gap-3 border-b",
                        "transition-all duration-500 ease-workspace",
                        isMarkdownMaterial
                          ? "bg-[#f6f8fa] border-[#d0d7de] text-[#24292f] px-4 py-3"
                          : isFullscreen
                            ? "bg-slate-900 border-slate-800 px-3 py-2.5 md:px-6 md:py-4"
                            : "bg-slate-100 border-slate-200 px-4 py-3"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        <Sparkles
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-colors duration-500",
                            isMarkdownMaterial
                              ? "text-emerald-600 animate-pulse"
                              : isFullscreen
                                ? "text-emerald-400 animate-pulse"
                                : "text-emerald-600 animate-pulse"
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-semibold uppercase tracking-wider transition-all duration-500 ease-workspace",
                            isMarkdownMaterial
                              ? "hidden sm:inline-flex bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 font-black items-center gap-1.5"
                              : isFullscreen
                                ? "hidden sm:inline-flex bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3 py-1 font-black items-center gap-1.5"
                                : "hidden sm:inline-flex text-slate-500"
                          )}
                        >
                          {isFullscreen ? (
                            <>Reader Arena</>
                          ) : activePreview.type === "material" ? (
                            "Document Preview"
                          ) : (
                            "Now Playing"
                          )}
                        </span>
                        <span
                          className={cn(
                            "truncate transition-colors duration-500",
                            isMarkdownMaterial
                              ? "text-sm font-bold text-[#24292f]"
                              : isFullscreen
                                ? "text-xs md:text-sm font-bold text-white max-w-xl"
                                : "text-sm font-medium text-slate-800"
                          )}
                        >
                          {activePreview.title}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {activePreview.type === "material" && (
                          <div className={cn(
                            "flex items-center gap-1.5 rounded-lg p-0.5 border shrink-0",
                            isMarkdownMaterial 
                              ? "bg-slate-200/60 dark:bg-slate-800/40 border-slate-300/40 text-slate-800 dark:text-slate-200" 
                              : "bg-slate-800/60 border-slate-700/40 text-slate-200"
                          )}>
                            <Button
                              onClick={handleZoomOut}
                              disabled={zoomLevel <= 0.5}
                              variant="ghost"
                              className={cn(
                                "h-6 w-6 p-0 rounded-md hover:bg-white dark:hover:bg-slate-700/60",
                                !isMarkdownMaterial && "text-slate-300 hover:bg-slate-700/80 hover:text-white"
                              )}
                              title="Zoom Out"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span 
                              onClick={handleZoomReset}
                              className="text-[10px] font-bold min-w-[36px] text-center select-none cursor-pointer hover:text-emerald-600 transition-colors"
                              title="Reset Zoom (100%)"
                            >
                              {Math.round(zoomLevel * 100)}%
                            </span>
                            <Button
                              onClick={handleZoomIn}
                              disabled={zoomLevel >= 2.5}
                              variant="ghost"
                              className={cn(
                                "h-6 w-6 p-0 rounded-md hover:bg-white dark:hover:bg-slate-700/60",
                                !isMarkdownMaterial && "text-slate-300 hover:bg-slate-700/80 hover:text-white"
                              )}
                              title="Zoom In"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {!isFullscreen && activePreview.type === "material" && (
                          <>
                            <span className="hidden md:inline-flex bg-emerald-500/10 text-emerald-700 border border-emerald-200/50 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider items-center gap-1 shadow-sm transition-transform duration-300 hover:scale-[1.02]">
                              Reader Mode
                            </span>
                            {isNotionMaterial && (
                              <span className="hidden md:inline-flex bg-slate-900/95 text-slate-100 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                Notion Turbo
                              </span>
                            )}
                            <Button
                              onClick={handleMaximize}
                              size="sm"
                              className="h-7 rounded-lg text-[10px] font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm border-0 flex items-center gap-1 px-2 transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-60 shrink-0"
                            >
                              <Maximize className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Maximize</span>
                            </Button>
                          </>
                        )}
                        {!isFullscreen && activePreview.type !== "material" && (
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
                        {isFullscreen && (
                          <Button
                            onClick={handleMinimize}
                            className="rounded-xl h-8 md:h-9 px-2.5 md:px-4 text-[10px] md:text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md border-0 transition-all duration-300 flex items-center gap-1 md:gap-1.5 hover:scale-[1.02] active:scale-95 disabled:opacity-60 animate-workspace-reveal shrink-0"
                          >
                            <X className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
                            <span className="hidden sm:inline">Exit Fullscreen</span>
                            <span className="sm:hidden">Close</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Iframe Workspace (Same DOM node preserved to prevent unmount and re-running scripts) */}
                    <div
                      className={cn(
                        "flex-1 w-full min-h-0 relative overflow-hidden bg-slate-900 iframe-host workspace-content-shell",
                        isNotionMaterial && "notion-embed-host",
                        isClickUpMaterial && "clickup-embed-host"
                      )}
                    >
                      {isCurrentIframeLoading && (
                        <div className={cn(
                          "absolute inset-0 z-40 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 workspace-loading-veil",
                          isMarkdownMaterial ? "bg-white/80" : "bg-slate-950/80"
                        )}>
                          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mb-3" />
                          <p className={cn(
                            "text-xs font-semibold uppercase tracking-wider animate-pulse",
                            isMarkdownMaterial ? "text-slate-600" : "text-slate-300"
                          )}>
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
                            !isIframeLoading && "embed-frame-ready"
                          )}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}

                      {/* Markdown Preview Overlay (for both study materials and important questions) */}
                      {activePreview.type === "material" && activePreview.url?.includes(".md") && (
                        <div
                          style={{ zoom: zoomLevel }}
                          className="absolute inset-0 z-10 overflow-y-auto px-5 py-6 md:px-8 md:py-10 bg-white text-[#24292f] font-sans selection:bg-[#c8e1ff] selection:text-[#24292f] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent markdown-body animate-workspace-reveal"
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code(props) {
                                const { className, children } = props;
                                const match = /language-(\w+)/.exec(className || "");
                                const isMermaid = match && match[1] === "mermaid";
                                if (isMermaid) {
                                  return <MermaidDiagram chart={String(children).replace(/\n$/, "")} />;
                                }
                                if (className) {
                                  const lang = match ? match[1] : "cpp";
                                  let highlighted = String(children);
                                  try {
                                    const grammar = Prism.languages[lang] || Prism.languages.cpp || Prism.languages.clike;
                                    highlighted = Prism.highlight(String(children).replace(/\n$/, ""), grammar, lang);
                                  } catch (err) {
                                    console.error("Prism highlighting error:", err);
                                  }
                                  return (
                                    <pre className="bg-[#f6f8fa] border border-[#d0d7de] rounded-lg p-4 my-4 overflow-x-auto font-mono text-sm text-[#24292f] select-text">
                                      <code 
                                        className={className}
                                        dangerouslySetInnerHTML={{ __html: highlighted }}
                                      />
                                    </pre>
                                  );
                                }
                                return (
                                  <code className="bg-[rgba(175,184,193,0.2)] text-[#24292f] px-1.5 py-0.5 rounded font-mono text-sm">
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {markdownContent}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* For Material Preview: Pre-rendered persistent cached non-markdown iframes */}
                      {unit.unit_materials?.filter((m: any) => !m.file_url?.includes(".md")).map((material: any) => {
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
                            style={{ zoom: zoomLevel }}
                            className={cn(
                              "embed-frame border-0",
                              isActive ? "embed-frame-ready z-10" : "opacity-0 pointer-events-none -z-10",
                              isNotion && "notion-embed-frame",
                              isClickUp && "clickup-embed-frame",
                              isAppFlowy && "appflowy-embed-frame"
                            )}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        );
                      })}

                      {/* For Important Questions / Files: Dynamic iframe viewer fallback for non-markdown attachments */}
                      {activePreview.type === "material" && 
                       !activePreview.url?.includes(".md") && 
                       !unit.unit_materials?.some((m: any) => m.file_url === activePreview.url) && (
                        <iframe
                          key={`important-question-frame`}
                          title={activePreview.title}
                          src={formatEmbedUrl(activePreview.url, "material")}
                          onLoad={() => setIsIframeLoading(false)}
                          style={{ zoom: zoomLevel }}
                          className="embed-frame border-0 embed-frame-ready z-10"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
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



      {/* Inject Print and Fullscreen Styles */}
      <style>{`
        .markdown-body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
          line-height: 1.6;
          color: #24292f;
          background-color: #ffffff;
        }
        .markdown-body h1 {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
          font-size: 1.85rem;
          font-weight: 600;
          color: #1f2328;
          margin-top: 24px;
          margin-bottom: 16px;
          border-bottom: 1px solid #d0d7de;
          padding-bottom: 0.3em;
        }
        .markdown-body h2 {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
          font-size: 1.45rem;
          font-weight: 600;
          color: #1f2328;
          margin-top: 24px;
          margin-bottom: 16px;
          border-bottom: 1px solid #d0d7de;
          padding-bottom: 0.3em;
        }
        .markdown-body h3 {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #1f2328;
          margin-top: 24px;
          margin-bottom: 8px;
        }
        .markdown-body p {
          font-size: 0.95rem;
          margin-bottom: 16px;
          color: #24292f;
        }
        .markdown-body strong {
          color: #1f2328;
          font-weight: 600;
        }
        .markdown-body blockquote {
          border-left: 0.25em solid #d0d7de;
          padding: 0.5em 1em;
          color: #656d76;
          margin: 0 0 16px 0;
          background-color: #f6f8fa;
          border-radius: 4px;
        }
        .markdown-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          display: block;
          overflow-x: auto;
        }
        .markdown-body th, .markdown-body td {
          border: 1px solid #d0d7de;
          padding: 8px 13px;
          font-size: 0.9rem;
        }
        .markdown-body th {
          background-color: #f6f8fa;
          font-weight: 600;
          color: #1f2328;
        }
        .markdown-body tr:hover {
          background-color: #f6f8fa;
        }
        .markdown-body tr:nth-child(2n) {
          background-color: #f6f8fa;
        }
        .markdown-body pre {
          background-color: #f6f8fa;
          border: 1px solid #d0d7de;
          border-radius: 6px;
          padding: 16px;
          margin: 16px 0;
          overflow-x: auto;
          font-family: monospace;
          font-size: 0.85rem;
        }
        .markdown-body code {
          background-color: rgba(175, 184, 193, 0.2);
          color: #24292f;
          padding: 0.2em 0.4em;
          border-radius: 6px;
          font-family: ui-monospace, SFMono-Regular, SF Pro Text, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 85%;
        }
         .markdown-body pre code {
          background-color: transparent !important;
          color: inherit !important;
          padding: 0 !important;
          border-radius: 0 !important;
          font-size: 100%;
        }
        /* Prism GitHub Light Theme Token Styles */
        .token.comment,
        .token.prolog,
        .token.doctype,
        .token.cdata {
          color: #6a737d !important;
          font-style: italic;
        }
        .token.namespace {
          opacity: .7;
        }
        .token.string,
        .token.attr-value {
          color: #032f62 !important;
        }
        .token.punctuation {
          color: #24292e !important;
        }
        .token.operator {
          color: #d73a49 !important;
        }
        .token.entity,
        .token.url,
        .token.symbol,
        .token.number,
        .token.boolean,
        .token.variable,
        .token.constant,
        .token.property,
        .token.regex,
        .token.inserted {
          color: #005cc5 !important;
        }
        .token.atrule,
        .token.keyword,
        .token.attr-name,
        .token.selector {
          color: #d73a49 !important;
          font-weight: 600;
        }
        .token.function,
        .token.class-name,
        .token.classname {
          color: #6f42c1 !important;
        }
        .token.deleted,
        .token.tag {
          color: #d73a49 !important;
        }
        .token.important,
        .token.bold {
          font-weight: bold;
        }
        .token.italic {
          font-style: italic;
        }
        .markdown-body ul {
          list-style-type: disc;
          padding-left: 2rem;
          margin-bottom: 16px;
        }
        .markdown-body ol {
          list-style-type: decimal;
          padding-left: 2rem;
          margin-bottom: 16px;
        }
        .markdown-body li {
          font-size: 0.95rem;
          margin-top: 0.25em;
          color: #24292f;
        }
        .markdown-body hr {
          height: 0.25em;
          padding: 0;
          margin: 24px 0;
          background-color: #d0d7de;
          border: 0;
        }
        .ease-workspace {
          transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
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
            opacity 0.15s ease-out,
            transform 0.15s ease-out;
        }
        .embed-frame-ready {
          opacity: 1;
          transform: scale(1);
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
          height: calc(100% + 48px + 45px) !important;
        }
        .workspace-content-shell {
          transition: opacity 0.15s ease-out;
        }
        .workspace-phase-active {
          box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.12), 0 24px 80px rgba(2, 6, 23, 0.45);
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
        @media (prefers-reduced-motion: reduce) {
          .fullscreen-workspace,
          .embed-frame,
          .preview-workspace-header,
          .workspace-loading-veil {
            transition: none !important;
            animation: none !important;
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