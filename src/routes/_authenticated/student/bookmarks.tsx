import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Bookmark, FileText, Play, Trash2, BookOpen, Layers, Search, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/bookmarks")({
  head: () => ({ meta: [{ title: "Bookmarks — Lakshay IQ" }] }),
  component: Bookmarks,
});

type FilterType = "all" | "units" | "videos" | "materials";

function Bookmarks() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const { data: bookmarks, refetch, isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from("bookmarks")
        .select(`
          id,
          unit_id,
          video_id,
          material_id,
          created_at,
          units(id, title, unit_number),
          unit_videos(id, title, unit_id),
          unit_materials(id, title, file_type, unit_id)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const removeBookmark = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Bookmark removed");
    refetch();
  };

  // Client-side filtration logic
  const filteredBookmarks = bookmarks?.filter((bm: any) => {
    if (activeFilter === "units") return !!bm.units;
    if (activeFilter === "videos") return !!bm.unit_videos;
    if (activeFilter === "materials") return !!bm.unit_materials;
    return true;
  }) || [];

  // Stats Counters
  const totalCount = bookmarks?.length || 0;
  const unitCount = bookmarks?.filter((b: any) => b.units).length || 0;
  const videoCount = bookmarks?.filter((b: any) => b.unit_videos).length || 0;
  const materialCount = bookmarks?.filter((b: any) => b.unit_materials).length || 0;

  return (
    <div className="w-full py-2 space-y-6 animate-in fade-in duration-300">
      
      {/* Premium Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary/[0.02] via-card to-indigo-500/[0.01] border border-border/80 overflow-hidden shadow-[0_12px_40px_-12px_rgba(0,0,0,0.03)] dark:shadow-none">
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-6 py-6 md:px-8 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15 rounded-full px-2.5 py-0.5">
              <Sparkles className="h-3 w-3" />
              <span className="text-[10px] font-bold tracking-wide uppercase">Workspace Library</span>
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-foreground">
              Your Saved Library
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
              Quick access to your curated study units, lecture videos, and reference PDF handouts.
            </p>
          </div>
          
          {/* Quick Stat Pill */}
          <div className="flex items-center gap-2 self-start md:self-center bg-secondary border border-border px-4 py-2.5 rounded-xl shadow-sm">
            <Bookmark className="h-4 w-4 text-emerald-500 fill-emerald-500" />
            <span className="text-xs font-bold text-foreground">{totalCount} Saved Items</span>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Sidebar - Navigation & Filters */}
        <aside className="lg:col-span-1 space-y-2.5 lg:sticky lg:top-28 bg-card border border-border/80 rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 mb-1.5">Collections</p>
          
          <button 
            onClick={() => setActiveFilter("all")}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
              activeFilter === "all" 
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-black shadow-sm" 
                : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2.5"><Bookmark className="h-4 w-4 text-indigo-500" /> All Items</span>
            <span className="text-[10px] bg-secondary text-foreground px-2 py-0.5 rounded-md font-bold">{totalCount}</span>
          </button>

          <button 
            onClick={() => setActiveFilter("units")}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
              activeFilter === "units" 
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-black shadow-sm" 
                : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2.5"><BookOpen className="h-4 w-4 text-amber-500" /> Units</span>
            <span className="text-[10px] bg-secondary text-foreground px-2 py-0.5 rounded-md font-bold">{unitCount}</span>
          </button>

          <button 
            onClick={() => setActiveFilter("videos")}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
              activeFilter === "videos" 
                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 font-black shadow-sm" 
                : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2.5"><Play className="h-4 w-4 text-sky-500" /> Lectures</span>
            <span className="text-[10px] bg-secondary text-foreground px-2 py-0.5 rounded-md font-bold">{videoCount}</span>
          </button>

          <button 
            onClick={() => setActiveFilter("materials")}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
              activeFilter === "materials" 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-black shadow-sm" 
                : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2.5"><FileText className="h-4 w-4 text-emerald-500" /> Resources</span>
            <span className="text-[10px] bg-secondary text-foreground px-2 py-0.5 rounded-md font-bold">{materialCount}</span>
          </button>
        </aside>

        {/* Right Main Panel - Content Feed */}
        <main className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-24 bg-secondary animate-pulse rounded-2xl w-full border border-border/60" />
              ))}
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border/80 rounded-2xl shadow-sm px-4">
              <div className="h-14 w-14 bg-secondary border border-border rounded-xl flex items-center justify-center mx-auto mb-4">
                <Bookmark className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-extrabold text-foreground text-sm uppercase tracking-wider">No matching bookmarks</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-normal">
                {activeFilter === "all" 
                  ? "Your saved library is empty. Start bookmarking important materials during lectures!" 
                  : `You haven't saved any items categorized under ${activeFilter} yet.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBookmarks.map((bm: any) => {
                const isUnit = !!bm.units;
                const isVideo = !!bm.unit_videos;
                const isMaterial = !!bm.unit_materials;

                // Configure routing properties seamlessly based on data structure
                let routeTo = "/student/unit/$id";
                let routeParams: Record<string, string> = {};

                if (isUnit) {
                  routeTo = "/student/unit/$id";
                  routeParams = { id: bm.unit_id };
                } else if (isVideo) {
                  routeTo = "/student/video/$id";
                  routeParams = { id: bm.video_id };
                } else if (isMaterial) {
                  routeTo = "/student/material/$id";
                  routeParams = { id: bm.material_id };
                }

                const title = isUnit
                  ? `Unit ${bm.units.unit_number}: ${bm.units.title}`
                  : isVideo
                  ? bm.unit_videos.title
                  : bm.unit_materials?.title;

                const subtitle = isUnit ? "Module Unit" : isVideo ? "Video Lecture" : "Study Resource";

                const Icon = isUnit ? BookOpen : isVideo ? Play : FileText;
                
                const theme = isUnit
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/15 hover:border-amber-500/35"
                  : isVideo
                  ? "bg-sky-500/10 text-sky-600 border-sky-500/15 hover:border-sky-500/35"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/15 hover:border-emerald-500/35";

                return (
                  <Link 
                    key={bm.id} 
                    to={routeTo} 
                    params={routeParams}
                    className="group block relative"
                  >
                    <Card className="flex items-center gap-4 p-4 bg-card hover:bg-secondary/40 transition-all duration-200 border-border/80 hover:border-border rounded-xl h-full pr-14 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                      {/* Left Dynamic Indicator Icon */}
                      <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-all", theme)}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      
                      {/* Body Copy */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-black tracking-widest uppercase text-muted-foreground block mb-0.5">
                          {subtitle}
                        </span>
                        <h4 className="font-bold text-foreground text-xs leading-snug group-hover:text-indigo-500 transition-colors line-clamp-2">
                          {title || "Untitled Document"}
                        </h4>
                      </div>

                      {/* Right Control Actions - Absolute positioned */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => removeBookmark(bm.id, e)}
                          className="h-8.5 w-8.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}