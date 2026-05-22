import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Bookmark, FileText, Play, Trash2, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/bookmarks")({
  head: () => ({ meta: [{ title: "Bookmarks — Lakshay IQ" }] }),
  component: Bookmarks,
});

function Bookmarks() {
  const { data: bookmarks, refetch } = useQuery({
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
          unit_videos(id, title),
          unit_materials(id, title, file_type)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const removeBookmark = async (id: string) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Bookmark removed");
    refetch();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
      <header>
        <h1 className="font-display text-3xl font-bold">Your Bookmarks</h1>
        <p className="text-sm text-neutral-500">Quick access to your saved units, lectures and materials.</p>
      </header>

      <div className="space-y-4">
        {!bookmarks || bookmarks.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl">
            <Bookmark className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
            <p className="font-bold text-neutral-900">No bookmarks yet</p>
            <p className="text-sm text-neutral-500">Start saving your favorite units to see them here.</p>
          </div>
        ) : (
          bookmarks.map((bm: any) => {
            const isUnit = !!bm.units;
            const isVideo = !!bm.unit_videos;
            const isMaterial = !!bm.unit_materials;

            const title = isUnit
              ? `Unit ${bm.units.unit_number}: ${bm.units.title}`
              : isVideo
              ? bm.unit_videos.title
              : bm.unit_materials?.title;

            const subtitle = isUnit ? "Unit" : isVideo ? "Video Lecture" : "Study Material";

            const Icon = isUnit ? BookOpen : isVideo ? Play : FileText;
            const color = isUnit
              ? "bg-amber-50 text-amber-600"
              : isVideo
              ? "bg-indigo-50 text-indigo-600"
              : "bg-emerald-50 text-emerald-600";

            const content = (
              <>
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{title || "Untitled Item"}</p>
                  <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{subtitle}</p>
                </div>
              </>
            );

            return (
              <Card key={bm.id} className="flex items-center gap-4 p-4 hover:shadow-lg transition-all border-neutral-200">
                {isUnit ? (
                  <Link to="/student/unit/$id" params={{ id: bm.unit_id }} className="flex items-center gap-4 flex-1">
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 flex-1">{content}</div>
                )}
                <Button variant="ghost" size="icon" onClick={() => removeBookmark(bm.id)}>
                  <Trash2 className="h-4 w-4 text-neutral-400 hover:text-red-500" />
                </Button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
