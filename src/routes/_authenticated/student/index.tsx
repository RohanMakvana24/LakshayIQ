import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight, Sparkles, Building2, GraduationCap, BookOpen, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/")({
  head: () => ({ meta: [{ title: "Dashboard — Lakshay IQ" }] }),
  component: StudentDashboard,
});

interface UniversityRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  courses: { id: string }[] | null;
}

function StudentDashboard() {
  const [universities, setUniversities] = useState<UniversityRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUniversitiesData = async () => {
      try {
        setLoading(true);

        // 🏛️ તમારી પૂરેપૂરી સાચી સ્કીમા (logo_url અને banner_url સાથે)
        const { data, error } = await supabase
          .from("universities")
          .select(`
            id, 
            name, 
            slug,
            description,
            logo_url,
            banner_url,
            is_active,
            courses(id)
          `)
          .eq("is_active", true) 
          .order("name", { ascending: true });

        if (error) throw error;

        setUniversities((data as any) || []);
      } catch (err) {
        console.error("Failed to compile student dashboard telemetry:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversitiesData();
  }, []);

  return (
    <div className="space-y-10 p-1 max-w-full antialiased animate-fade-in">
      
      {/* 🌌 CINEMATIC HERO BANNER BLOCK */}
      <div className="relative rounded-3xl border border-neutral-200/60 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 p-8 md:p-10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden group">
        <div className="absolute -right-10 -bottom-10 text-neutral-800/20 pointer-events-none">
          <GraduationCap className="h-64 w-64 stroke-[0.8]" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold font-mono tracking-wider text-emerald-400 border border-white/5 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> WELCOME TO LAKSHAY IQ
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl max-w-3xl leading-[1.1]">
            Pick your university <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 via-white to-neutral-400">to begin your journey</span>
          </h1>
          <p className="max-w-xl text-xs md:text-sm text-neutral-400 font-medium leading-relaxed">
            Every course, semester, subject and unit — neatly arranged in a precision bento structure.
          </p>
        </div>
      </div>

      {/* 🏛️ UNIVERSITIES DIRECTORY SECTION */}
      <section className="space-y-6">
        <div className="border-b border-neutral-100 pb-4 flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900">All Registered Universities</h2>
            <p className="text-xs text-neutral-400 font-medium">
              {loading ? "Syncing index..." : `${universities.length} institutions available · updated in real-time`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-900 stroke-[2.5]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400">Hydrating Campuses</span>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {universities.map((u) => {
              const coursesCount = Array.isArray(u.courses) ? u.courses.length : 0;

              return (
                <Link key={u.id} to="/student/university/$id" params={{ id: u.id }} className="block h-full group">
                  <Card className="h-full border border-neutral-200/80 bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-neutral-900 hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.06)] flex flex-col justify-between overflow-hidden relative">
                    
                    {/* 🖼️ BANNER IMAGE OVERLAY (Cinematic Glassmorphic Look) */}
                    <div className="h-24 w-full bg-neutral-100 relative overflow-hidden border-b border-neutral-100">
                      {u.banner_url ? (
                        <img 
                          src={u.banner_url} 
                          alt={`${u.name} banner`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        // Fallback Subtle Gradient Banner
                        <div className="w-full h-full bg-gradient-to-r from-neutral-100 to-neutral-200/60" />
                      )}
                      
                      {/* Floating Badge on top of Banner */}
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="text-[10px] font-mono font-bold uppercase tracking-wider bg-black/40 text-white border-none backdrop-blur-md px-2 py-0.5 rounded-md group-hover:bg-neutral-900 transition-colors">
                          {u.slug}
                        </Badge>
                      </div>
                    </div>

                    {/* Content Frame */}
                    <div className="p-5 flex-1 flex flex-col justify-between relative">
                      
                      {/* 🏛️ LOGO CONTAINER (Positioned overlapping the banner layout) */}
                      <div className="absolute -top-10 left-5 h-16 w-16 rounded-2xl bg-white border-2 border-white shadow-md overflow-hidden grid place-items-center group-hover:scale-105 transition-transform duration-300">
                        {u.logo_url ? (
                          <img 
                            src={u.logo_url} 
                            alt={`${u.name} logo`} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-neutral-900 flex items-center justify-center text-white">
                            <Building2 className="h-5 w-5 text-neutral-200" />
                          </div>
                        )}
                      </div>

                      {/* Info Titles */}
                      <div className="mt-8 space-y-2 flex-1">
                        <h3 className="font-display text-base font-bold leading-tight text-neutral-900 group-hover:text-neutral-950 transition-colors line-clamp-1">
                          {u.name}
                        </h3>
                        <p className="text-[12px] text-neutral-400 line-clamp-2 leading-relaxed">
                          {u.description || "No specific institutional summary cataloged for this campus grid."}
                        </p>
                      </div>

                      {/* Bottom Footer Ledger Bar */}
                      <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs font-medium">
                        <div className="flex items-center gap-3 text-neutral-500 font-mono text-[11px]">
                          <span className="flex items-center gap-1 bg-neutral-50 border border-neutral-200/60 px-2 py-0.5 rounded-md text-neutral-600">
                            <BookOpen className="h-3 w-3 text-neutral-400" /> {coursesCount} Courses
                          </span>
                        </div>
                        
                        <div className="h-7 w-7 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300 shadow-sm">
                          <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                        </div>
                      </div>

                    </div>

                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && universities.length === 0 && (
          <div className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
            <Building2 className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-neutral-500">No universities found</h3>
            <p className="text-xs text-neutral-400 mt-1">Make sure you have active entries in your database system.</p>
          </div>
        )}
      </section>

    </div>
  );
}