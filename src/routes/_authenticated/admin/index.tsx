import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Building2, BookOpen, Layers, FileText, Users, Video } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — Lakshay IQ" }] }),
  component: AdminHome,
});

const stats = [
  { label: "Universities", value: 124, icon: Building2, trend: "+4 this month" },
  { label: "Courses", value: 856, icon: BookOpen, trend: "+22" },
  { label: "Subjects", value: 4_812, icon: Layers, trend: "+108" },
  { label: "Units", value: 18_240, icon: FileText, trend: "+412" },
  { label: "Students", value: 12_456, icon: Users, trend: "+312" },
  { label: "Materials", value: 38_910, icon: Video, trend: "+1.2k" },
];

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

function AdminHome() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Welcome back, admin</h1>
        <p className="text-sm text-muted-foreground">Here's what's happening across Lakshay IQ.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground"><s.icon className="h-4 w-4" /></div>
              <span className="text-[10px] font-medium text-success">{s.trend}</span>
            </div>
            <p className="mt-4 font-display text-2xl font-bold">{s.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 shadow-soft">
          <h3 className="font-display text-lg font-semibold">Most viewed subjects</h3>
          <p className="text-xs text-muted-foreground">Top 5 this week</p>
          <ChartContainer className="mt-4 h-64" config={{ views: { label: "Views", color: "hsl(var(--primary))" } }}>
            <BarChart data={subjectViews}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="views" fill="var(--color-primary)" radius={[6,6,0,0]} />
            </BarChart>
          </ChartContainer>
        </Card>
        <Card className="p-5 shadow-soft">
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
