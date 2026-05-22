import { useState, useEffect } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, FileText, Bookmark, Star, Download, Clock, ExternalLink, Sparkles, MonitorPlay } from "lucide-react";
import { PageLoader } from "@/components/page-loader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/unit/$id")({
  loader: async ({ params }) => {
    const { data: unit, error } = await supabase
      .from("units")
      .select(`*, unit_videos(*), unit_materials(*), important_questions(*)`)
      .eq("id", params.id)
      .single();

    if (error || !unit) throw notFound();
    return { unit };
  },
  pendingMs: 0,
  pendingComponent: () => <PageLoader label="Loading Unit" />,
  component: UnitPage,
});

function UnitPage() {
  const { unit } = Route.useLoaderData();
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Preview Engine State - Starts fully empty now
  const [activePreview, setActivePreview] = useState<{
    type: "video" | "material" | null;
    title: string;
    url: string;
  }>({ type: null, title: "", url: "" });

  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

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
    } else {
      setBookmarkId(null);
      setIsBookmarked(false);
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

  return (
    <div className="space-y-6 p-4 max-w-[1600px] mx-auto antialiased animate-in fade-in duration-500">
      
      {/* Premium Compact Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
         <span className="bg-neutral-100 text-neutral-800 text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider border border-neutral-200 whitespace-nowrap block w-fit">
  Unit {unit.unit_number}
</span>
            <span className="text-neutral-400 text-xs">•</span>
            <p className="text-neutral-500 text-xs font-medium truncate max-w-[300px] sm:max-w-md">{unit.description}</p>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">{unit.title}</h1>
        </div>

        <Button 
          variant={isBookmarked ? "default" : "outline"} 
          className="rounded-xl h-10 px-4 text-xs font-bold shadow-sm transition-all shrink-0 self-start md:self-center" 
          onClick={toggleBookmark}
        >
          <Bookmark className={cn("mr-1.5 h-3.5 w-3.5", isBookmarked && "fill-white")} /> 
          {isBookmarked ? "Saved" : "Save Unit"}
        </Button>
      </header>

      {/* Two Column Side-by-Side Dashboard Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* Left List Pane (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section: Video Lectures */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 px-1">
              <Play className="h-3.5 w-3.5 text-neutral-400 fill-neutral-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-neutral-400">Video Lectures</h2>
            </div>
            {unit.unit_videos?.length > 0 ? (
              <div className="grid gap-2">
                {unit.unit_videos.map((v: any) => {
                  const isCurrent = activePreview.type === "video" && activePreview.title === v.title;
                  return (
                    <Card 
                      key={v.id} 
                      onClick={() => setActivePreview({ type: "video", title: v.title, url: v.video_url || "" })}
                      className={cn(
                        "p-3 flex items-center gap-3.5 hover:border-neutral-400 rounded-xl border transition-all cursor-pointer bg-white group",
                        isCurrent && "border-neutral-950 bg-neutral-50 shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "h-9 w-9 rounded-lg grid place-items-center shrink-0 transition-all",
                        isCurrent ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white"
                      )}>
                        <Play className={cn("h-3.5 w-3.5", isCurrent ? "fill-white" : "group-hover:fill-white")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-neutral-800 tracking-tight truncate">{v.title}</p>
                        <p className="text-neutral-400 text-[10px] mt-0.5 font-medium flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {v.duration || "15"} mins
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : <EmptyStateRow />}
          </div>

          {/* Section: Study Materials */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 px-1">
              <FileText className="h-3.5 w-3.5 text-neutral-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-neutral-400">Course Materials</h2>
            </div>
            {unit.unit_materials?.length > 0 ? (
              <div className="grid gap-2">
                {unit.unit_materials.map((m: any) => {
                  const isCurrent = activePreview.type === "material" && activePreview.title === m.title;
                  return (
                    <Card 
                      key={m.id}
                      onClick={() => setActivePreview({ type: "material", title: m.title, url: m.file_url || "" })}
                      className={cn(
                        "flex items-center p-3 gap-3.5 hover:border-neutral-400 rounded-xl border transition-all cursor-pointer bg-white group",
                        isCurrent && "border-emerald-600 bg-emerald-50/20 shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "h-9 w-9 rounded-lg grid place-items-center shrink-0 transition-all",
                        isCurrent ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                      )}>
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-neutral-800 tracking-tight truncate">{m.title}</p>
                        <p className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 mt-0.5 font-mono">
                          {m.file_type || "PDF"} · {m.file_size || "Size N/A"}
                        </p>
                      </div>
                      <a 
                        href={m.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()} 
                        className="shrink-0"
                      >
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-neutral-400 hover:text-neutral-900">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    </Card>
                  );
                })}
              </div>
            ) : <EmptyStateRow />}
          </div>

          {/* Section: Important Questions */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 px-1">
              <Star className="h-3.5 w-3.5 text-neutral-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-neutral-400">Important Questions</h2>
            </div>
            {unit.important_questions?.length > 0 ? (
              <div className="grid gap-2">
                {unit.important_questions.map((iq: any, i: number) => (
                  <Card key={iq.id} className="p-3.5 border-l-4 border-l-amber-500 rounded-r-xl rounded-l-sm bg-white border-y-neutral-200/60 border-r-neutral-200/60 shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      <p className="font-semibold text-xs leading-relaxed text-neutral-800">
                        <span className="text-amber-600 font-black mr-1">Q{i + 1}.</span> {iq.question_text}
                      </p>
                      <span className="text-[8px] font-mono font-black tracking-wider bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded uppercase border border-amber-200/40 shrink-0">
                        {iq.category || "Exam"}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : <EmptyStateRow />}
          </div>

        </div>

        {/* Right Preview Frame Engine Panel (7 Columns) */}
        <div className="lg:col-span-7 lg:sticky lg:top-6">
          <Card className="overflow-hidden border border-neutral-200 bg-neutral-950 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] rounded-2xl flex flex-col h-[320px] sm:h-[480px] md:h-[560px]">
            {activePreview.type && activePreview.url ? (
              <>
                {/* Control Top Header Menu Layer Panel */}
                <div className="bg-neutral-900/90 px-4 py-3 flex items-center justify-between border-b border-neutral-800 shrink-0">
                  <div className="flex items-center gap-2 truncate pr-4">
                    <span className="text-[10px] text-neutral-400 font-black tracking-wider uppercase font-mono">
                      NOW STREAMING:
                    </span>
                    <span className="text-xs text-white font-bold truncate">
                      {activePreview.title}
                    </span>
                  </div>
                  <a 
                    href={activePreview.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white font-bold transition-colors bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-700 shrink-0"
                  >
                    <span>Fullscreen</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>

                {/* Simulated Core Application Render Stream Node */}
                <div className="flex-1 bg-neutral-900 relative">
                  <iframe
                    title={activePreview.title}
                    src={formatEmbedUrl(activePreview.url, activePreview.type)}
                    className="w-full h-full border-0 absolute inset-0 bg-neutral-900"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </>
            ) : (
              // Clean Empty State Screen - Triggers on initial load
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-gradient-to-b from-neutral-900 to-neutral-950">
                <div className="h-11 w-11 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
                  <MonitorPlay className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-neutral-200 tracking-wide uppercase">Workspace Console Empty</h4>
                  <p className="text-[11px] text-neutral-500 max-w-[260px] mx-auto leading-normal">
                    ડાબી બાજુ આપેલા કોઈપણ વીડિયો અથવા પીડીએફ મટીરીયલ પર ક્લિક કરો, એટલે આ ફ્રેમમાં લાઈવ પ્લે થઈ જશે.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}

// Inline Clean Row Fallback component for cleaner layout
function EmptyStateRow() {
  return (
    <div className="py-4 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
      <p className="text-[11px] font-medium text-neutral-400">No resources available for this section yet.</p>
    </div>
  );
}