import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { BookOpen, ArrowRight, Clock, Building2, MapPin, Sparkles } from "lucide-react";
import { PageLoader } from "@/components/page-loader";

// 🏛️ TanStack Router Loader Engine: ડેટાબેઝમાંથી પેરામીટર આઈડી પ્રાઈમ કરીને ડેટા લાવશે
export const Route = createFileRoute("/_authenticated/student/university/$id")({
  loader: async ({ params }) => {
    // 1. યુનિવર્સિટીની બેઝિક વિગતો મેળવો (તમારી સાચી સ્મીકા મુજબ)
    const { data: university, error: univError } = await supabase
      .from("universities")
      .select("id, name, slug, description, logo_url, banner_url, is_active")
      .eq("id", params.id)
      .single();

    if (univError || !university) {
      throw notFound();
    }

    // 2. આ યુનિવર્સિટી સાથે કનેક્ટેડ તમામ કોર્સ લોડ કરો
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id, name, slug, duration, total_semesters, thumbnail_url, description")
      .eq("university_id", params.id)
      .order("name", { ascending: true });

    return { 
      university, 
      courses: courses || [] 
    };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.university?.name || "University"} — Lakshay IQ` }],
  }),
  pendingMs: 0,
  pendingComponent: () => <PageLoader label="Loading University" />,
  component: UniversityPage,
});

function UniversityPage() {
  // Loader માંથી ડાયનેમિકલી હાઈડ્રેટ થયેલો ડેટા એક્સટ્રેક્ટ કરો
  const { university, courses } = Route.useLoaderData();

  return (
    <div className="space-y-8 p-1 antialiased animate-fade-in">
      
      {/* 🗺️ PRECISE BREADCRUMB NAVIGATION */}
      <BreadcrumbNav 
        items={[
          { label: "Dashboard", to: "/student" }, 
          { label: university.name }
        ]} 
      />

      {/* 🌌 CINEMATIC HERO BANNER HEADER FRAME */}
      <header className="relative rounded-3xl border border-neutral-200/60 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 shadow-[0_15px_40px_rgba(0,0,0,0.12)] overflow-hidden group">
        
        {/* Banner image backing with deep opacity mask overlay */}
        <div className="absolute inset-0 z-0 opacity-40">
          {university.banner_url ? (
            <img 
              src={university.banner_url} 
              alt={university.name} 
              className="w-full h-full object-cover filter brightness-75 contrast-125"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-neutral-950 to-neutral-900" />
          )}
        </div>

        {/* Core Layout Identity Panel Content */}
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 text-white">
          
          {/* Institutional Rounded-2xl Custom Logo Element */}
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white text-neutral-950 border-2 border-white/20 shadow-xl overflow-hidden font-mono font-bold text-xl">
            {university.logo_url ? (
              <img src={university.logo_url} alt={university.name} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-7 w-7 text-neutral-900" />
            )}
          </div>

          {/* Typography Text Area Elements */}
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-wider text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
              <Sparkles className="h-3 w-3" /> REGISTERED UNIVERSITY
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight max-w-4xl leading-tight">
              {university.name}
            </h1>
            <p className="text-xs md:text-sm text-neutral-400 font-medium line-clamp-2 max-w-3xl leading-relaxed">
              {university.description || "Comprehensive educational programs and study resources are calibrated for this structural campus grid mapping."}
            </p>
          </div>
          
          {/* Dynamic Floating Quick Metric Badging */}
          <div className="shrink-0 font-mono text-xs font-bold uppercase tracking-wider bg-black/30 border border-white/5 px-3 py-1.5 rounded-xl backdrop-blur-md text-neutral-300">
            {courses.length} Active Courses
          </div>
        </div>
      </header>

      {/* 📚 COURSES CONTENT Bento Matrix GRID */}
      <section className="space-y-5">
        <div className="border-b border-neutral-100 pb-3">
          <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900">Available Degrees & Programs</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Select a course pipeline framework to extract semester components</p>
        </div>

        {courses.length === 0 ? (
          /* Empty Database State Fallback Context Frame */
          <div className="text-center py-20 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
            <BookOpen className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-neutral-500">No courses listed</h3>
            <p className="text-xs text-neutral-400 mt-1">This university hasn't structured any curriculum templates inside our schema matrix yet.</p>
          </div>
        ) : (
          /* Primary Responsive Structural Card Mapping */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link key={c.id} to="/student/course/$id" params={{ id: c.id }} className="block group h-full">
                <Card className="h-full border border-neutral-200/80 bg-white p-5 rounded-2xl shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)] transition-all duration-300 hover:-translate-y-1 hover:border-neutral-900 hover:shadow-[0_12px_25px_-6px_rgba(0,0,0,0.05)] flex flex-col justify-between overflow-hidden relative">
                  
                  <div>
                    {/* Header Matrix Inside Course Block */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-900 text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                        <BookOpen className="h-4 w-4 stroke-[2.2]" />
                      </div>
                      {/* Short slug badge identifier mapping */}
                      <Badge variant="outline" className="text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-50 text-neutral-500 rounded-md border-neutral-200">
                        {c.slug || "DEGREE"}
                      </Badge>
                    </div>

                    {/* Meta Titles Info Mapping */}
                    <div className="mt-4 space-y-1.5">
                      <h3 className="font-display text-base font-bold text-neutral-900 group-hover:text-neutral-950 transition-colors line-clamp-1">
                        {c.name}
                      </h3>
                      <p className="text-xs text-neutral-400 font-medium line-clamp-2 leading-relaxed">
                        {c.description || "Access textbook materials, repeated structural questions, and standard analytical review papers inside."}
                      </p>
                    </div>
                  </div>

                  {/* Operational Ledger Metadata Footer Summary Section */}
                  <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-3.5 text-xs font-medium">
                    <p className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 font-mono">
                      <Clock className="h-3.5 w-3.5 text-neutral-400 stroke-[2]" /> 
                      <span>{c.duration || "3 Years"}</span> 
                      <span className="text-neutral-300">•</span>
                      <span>{c.total_semesters} Semesters</span>
                    </p>
                    
                    <div className="h-7 w-7 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300 shadow-sm">
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 stroke-[2.5]" />
                    </div>
                  </div>

                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}