import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Bookmark, FileText, Play, Trash2, BookOpen, Layers, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

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
    e.preventDefault(); // Prevents link navigation click trigger
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
    <div className="min-h-screen bg-neutral-50/50 w-full pb-16">
      {/* Premium Header Wrapper */}
      <div className="bg-white border-b border-neutral-200/80 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              <Layers className="h-3.5 w-3.5" /> Student Workspace
            </div>
            <h1 className="font-display text-3xl font-bold text-neutral-900 tracking-tight">Your Saved Library</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Quick access to your curated units, video lectures, and revision notes.</p>
          </div>
          
          {/* Quick Stat pill built into header */}
          <div className="flex items-center gap-2 self-start md:self-center bg-neutral-100 px-4 py-2 rounded-2xl border border-neutral-200">
            <Bookmark className="h-4 w-4 text-neutral-600 fill-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">{totalCount} Total Bookmarks</span>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Container */}
      <div className="max-w-[1600px] mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Sidebar - Navigation & Filters */}
        <aside className="lg:col-span-1 space-y-3 lg:sticky lg:top-28">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-2 mb-2">Filter Collections</p>
          
          <button 
            onClick={() => setActiveFilter("all")}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${activeFilter === "all" ? "bg-white text-indigo-600 shadow-sm border border-neutral-200/60 font-semibold" : "text-neutral-600 hover:bg-neutral-100"}`}
          >
            <span className="flex items-center gap-3"><Bookmark className="h-4 w-4" /> All Items</span>
            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md font-bold">{totalCount}</span>
          </button>

          <button 
            onClick={() => setActiveFilter("units")}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${activeFilter === "units" ? "bg-amber-50/60 text-amber-700 border border-amber-200/60 font-semibold" : "text-neutral-600 hover:bg-neutral-100"}`}
          >
            <span className="flex items-center gap-3"><BookOpen className="h-4 w-4 text-amber-500" /> Units</span>
            <span className="text-xs bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded-md font-bold">{unitCount}</span>
          </button>

          <button 
            onClick={() => setActiveFilter("videos")}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${activeFilter === "videos" ? "bg-indigo-50/60 text-indigo-700 border border-indigo-200/60 font-semibold" : "text-neutral-600 hover:bg-neutral-100"}`}
          >
            <span className="flex items-center gap-3"><Play className="h-4 w-4 text-indigo-500" /> Video Lectures</span>
            <span className="text-xs bg-indigo-100/80 text-indigo-800 px-2 py-0.5 rounded-md font-bold">{videoCount}</span>
          </button>

          <button 
            onClick={() => setActiveFilter("materials")}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${activeFilter === "materials" ? "bg-emerald-50/60 text-emerald-700 border border-emerald-200/60 font-semibold" : "text-neutral-600 hover:bg-neutral-100"}`}
          >
            <span className="flex items-center gap-3"><FileText className="h-4 w-4 text-emerald-500" /> Study Materials</span>
            <span className="text-xs bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-md font-bold">{materialCount}</span>
          </button>
        </aside>

        {/* Right Main Panel - Content Feed */}
        <main className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 bg-neutral-200/60 animate-pulse rounded-2xl w-full" />
              ))}
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="text-center py-24 bg-white border border-neutral-200 rounded-3xl shadow-sm px-4">
              <div className="h-16 w-16 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Bookmark className="h-7 w-7 text-neutral-400" />
              </div>
              <h3 className="font-bold text-neutral-900 text-lg">No matching bookmarks</h3>
              <p className="text-sm text-neutral-500 max-w-sm mx-auto mt-1">
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
                  routeTo = "/student/video/$id"; // Update path names based on your router config
                  routeParams = { id: bm.video_id };
                } else if (isMaterial) {
                  routeTo = "/student/material/$id"; // Update path names based on your router config
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
                  ? "bg-amber-50 text-amber-700 border-amber-100 hover:border-amber-300"
                  : isVideo
                  ? "bg-indigo-50 text-indigo-700 border-indigo-100 hover:border-indigo-300"
                  : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:border-emerald-300";

                return (
                  <Link 
                    key={bm.id} 
                    to={routeTo} 
                    params={routeParams}
                    className="group block relative"
                  >
                    <Card className="flex items-center gap-4 p-4 bg-white hover:shadow-md transition-all duration-200 border-neutral-200/70 hover:border-neutral-300 rounded-2xl h-full pr-14">
                      {/* Left Dynamic Indicator Icon */}
                      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition-colors ${theme}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      {/* Body Copy */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 block mb-0.5">
                          {subtitle}
                        </span>
                        <h4 className="font-semibold text-neutral-800 text-sm leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {title || "Untitled Document"}
                        </h4>
                      </div>

                      {/* Right Control Actions - Absolute positioned for precise fit inside flex items */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => removeBookmark(bm.id, e)}
                          className="h-9 w-9 rounded-xl hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"
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