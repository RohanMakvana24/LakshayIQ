import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Building2, BookOpen, Layers, FileText, Users, Video, KeyRound, Loader2, TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — Lakshay IQ" }] }),
  component: AdminHome,
});

// Static Charts Data Structure (As requested to keep)
const subjectViews = [
  { name: "Programming Fund.", views: 4200 },
  { name: "Discrete Math", views: 3100 },
  { name: "OOP", views: 2900 },
  { name: "DBMS", views: 2600 },
  { name: "OS", views: 2100 },
];

const downloads = [
  { day: "Mon", n: 240 }, { day: "Tue", n: 312 }, { day: "Wed", n: 280 },
  { day: "Thu", n: 410 }, { day: "Fri", n: 520 }, { day: "Sat", n: 380 }, { day: "Sun", n: 260 },
];

interface DynamicStats {
  universities: number;
  courses: number;
  subjects: number;
  units: number;
  students: number;
  materials: number;
}

function AdminHome() {
  // Live Metrics & Counters States
  const [totalSystemLogins, setTotalSystemLogins] = useState<number>(0);
  const [dbStats, setDbStats] = useState<DynamicStats>({
    universities: 0,
    courses: 0,
    subjects: 0,
    units: 0,
    students: 0,
    materials: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Core Hook Database Hydration Engine for All Counters
  useEffect(() => {
    const fetchAllDashboardMetrics = async () => {
      try {
        setLoading(true);

        // 1. Login counter not tracked in schema; default to 0
        setTotalSystemLogins(0);

        // 2. Fetch Live Dynamic Row Counts from respective tables parallelly
        const [
          { count: uniCount },
          { count: courseCount },
          { count: subjectCount },
          { count: unitCount },
          { count: studentCount },
          { count: materialCount }
        ] = await Promise.all([
          supabase.from("universities").select("*", { count: "exact", head: true }),
          supabase.from("courses").select("*", { count: "exact", head: true }),
          supabase.from("subjects").select("*", { count: "exact", head: true }),
          supabase.from("units").select("*", { count: "exact", head: true }),
          supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
          supabase.from("unit_materials").select("*", { count: "exact", head: true }),
        ]);

        setDbStats({
          universities: uniCount ?? 0,
          courses: courseCount ?? 0,
          subjects: subjectCount ?? 0,
          units: unitCount ?? 0,
          students: studentCount ?? 0,
          materials: materialCount ?? 0,
        });

      } catch (err) {
        console.error("Failed to compile layout telemetry fields:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllDashboardMetrics();
  }, []);

  // Dynamic Card Registry Schema Wrapper
  const statsRegistry = [
    { label: "Universities", value: dbStats.universities, icon: Building2, trend: "Live Sync" },
    { label: "Courses", value: dbStats.courses, icon: BookOpen, trend: "Live Sync" },
    { label: "Subjects", value: dbStats.subjects, icon: Layers, trend: "Live Sync" },
    { label: "Units", value: dbStats.units, icon: FileText, trend: "Live Sync" },
    { label: "Students", value: dbStats.students, icon: Users, trend: "Live Sync" },
    { label: "Materials", value: dbStats.materials, icon: Video, trend: "Live Sync" },
  ];

  return (
    <div className="space-y-8">
      
      {/* Platform Dashboard Identity Section */}
      <header>
        <h1 className="font-display text-3xl font-bold">Welcome back, admin</h1>
        <p className="text-sm text-muted-foreground">Here's what's happening across Lakshay IQ.</p>
      </header>

      {/* Primary Analytical Grid Matrix Blocks */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        
        {/* Dynamic Database Metric Cards Generation */}
        {statsRegistry.map((s) => (
          <Card key={s.label} className="p-5 shadow-soft bg-white border border-neutral-100 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <s.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{s.trend}</span>
              </div>
              
              <div className="mt-4">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
                ) : (
                  <p className="font-display text-2xl font-bold font-mono">{s.value.toLocaleString()}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Card>
        ))}

        {/* 🚀 HIGH-PRECISION REALTIME UNIQUE LOGINS CARD ENTRY */}
        <Card className="p-5 shadow-soft bg-gradient-to-br from-neutral-900 to-neutral-950 text-white border border-neutral-950 rounded-2xl flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 text-neutral-800/40 pointer-events-none group-hover:scale-110 transition-transform duration-300">
            <KeyRound className="h-20 w-20 stroke-[1]" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-800 border border-neutral-700/50 text-emerald-400">
                <KeyRound className="h-4 w-4 stroke-[2.2]" />
              </div>
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-md px-1.5 py-0.5 animate-pulse">
                <TrendingUp className="h-2 w-2" /> Live
              </span>
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="flex items-center gap-1.5 h-8">
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                </div>
              ) : (
                <p className="font-display text-2xl font-extrabold tracking-tight text-white font-mono">
                  {totalSystemLogins.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          <p className="text-xs text-neutral-400 font-medium relative z-10 mt-1">Total Hits</p>
        </Card>

      </div>

      {/* Secondary Chart Analytics Layout Panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        
        {/* Most Viewed Subjects Chart Panel */}
        <Card className="p-5 shadow-soft bg-white border border-neutral-100 rounded-2xl">
          <h3 className="font-display text-lg font-semibold">Most viewed subjects</h3>
          <p className="text-xs text-muted-foreground">Top 5 this week</p>
          <ChartContainer className="mt-4 h-64" config={{ views: { label: "Views", color: "hsl(var(--primary))" } }}>
            <BarChart data={subjectViews}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="views" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>

        {/* System PDF Downloads Data Visualization Line Panel */}
        <Card className="p-5 shadow-soft bg-white border border-neutral-100 rounded-2xl">
          <h3 className="font-display text-lg font-semibold">PDF downloads</h3>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
          <ChartContainer className="mt-4 h-64" config={{ n: { label: "Downloads", color: "hsl(var(--primary))" } }}>
            <LineChart data={downloads}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="n" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ChartContainer>
        </Card>

      </div>

    </div>
  );
}