import { useState, useEffect } from "react";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Play, FileText, Bookmark, Star, Download, ExternalLink, Sparkles, MonitorPlay, Clock, ChevronRight } from "lucide-react";
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
    const { data: semester } = await supabase
      .from("semesters")
      .select("id, semester_number, title, course_id")
      .eq("id", unit.semester_id)
      .single();

    let course = null;
    let university = null;

    if (semester) {
      const { data: c } = await supabase
        .from("courses")
        .select("id, name, slug, university_id")
        .eq("id", semester.course_id)
        .single();
      course = c;
      if (course) {
        const { data: u } = await supabase
          .from("universities")
          .select("id, name, slug")
          .eq("id", course.university_id)
          .single();
        university = u;
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

  useEffect(() => {
    checkBookmark();
  }, [unit.id]);

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
    if (type === "material") return url;
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
                  {unit.unit_videos.map((video) => {
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
                  {unit.unit_materials.map((material) => {
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
                          <a
                            href={material.file_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
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
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Important Questions</h2>
                <Badge variant="secondary" className="text-[10px] bg-slate-100">
                  {unit.important_questions?.length || 0}
                </Badge>
              </div>
              {unit.important_questions?.length > 0 ? (
                <div className="grid gap-2">
                  {unit.important_questions.map((q, idx) => (
                    <Card key={q.id} className="p-3 border-l-4 border-l-amber-400 rounded-xl border-slate-200 bg-white">
                      <div className="flex justify-between items-start gap-3">
                        <p className="text-sm text-slate-700">
                          <span className="font-bold text-amber-600 mr-1">{idx + 1}.</span> {q.question_text}
                        </p>
                        {q.category && (
                          <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
                            {q.category}
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyStateRow icon={Star} message="No important questions added yet" />
              )}
            </div>
          </div>

          {/* Right Column - Preview Panel */}
          <div className="lg:col-span-7">
            <div className="sticky top-6">
              <Card className="overflow-hidden border border-slate-200 bg-white shadow-lg rounded-2xl flex flex-col h-[400px] md:h-[500px] lg:h-[550px]">
                {activePreview.type && activePreview.url ? (
                  <>
                    <div className="bg-slate-100 px-4 py-3 flex items-center justify-between border-b border-slate-200 shrink-0">
                      <div className="flex items-center gap-2 truncate">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Now Playing</span>
                        <span className="text-sm font-medium text-slate-800 truncate">{activePreview.title}</span>
                      </div>
                      <a
                        href={activePreview.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex-1 bg-slate-900 relative">
                      <iframe
                        title={activePreview.title}
                        src={formatEmbedUrl(activePreview.url, activePreview.type)}
                        className="w-full h-full border-0 absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
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