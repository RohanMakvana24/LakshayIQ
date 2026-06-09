import { createFileRoute, Link, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { Loader2, Sparkles, LayoutDashboard, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useAllTasks, usePlannerMutations } from '@/hooks/use-planner';
import { CalendarView } from '@/components/planner/CalendarView';
import { TaskForm } from '@/components/planner/TaskForm';
import type { PlannerTask } from '@/types/planner';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/student/planner-calendar')({
  component: PlannerCalendarPage,
});

function PlannerCalendarPage() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { tasks, loading, refresh } = useAllTasks();
  const { update, setStatus, remove } = usePlannerMutations(refresh);

  const [editTask, setEditTask] = useState<PlannerTask | null>(null);

  const handleDelete = async (id: string) => {
    await remove(id);
    toast.success('Task deleted');
  };

  const handleEdit = async (data: Parameters<typeof update>[1]) => {
    if (!editTask) return;
    await update(editTask.id, data);
    toast.success('Task updated!');
    setEditTask(null);
  };

  return (
    <div className="w-full py-2 space-y-6">
      {/* Premium Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary/[0.02] via-card to-emerald-500/[0.01] border border-border/80 overflow-hidden shadow-[0_12px_40px_-12px_rgba(0,0,0,0.03)] dark:shadow-none">
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-6 py-6 md:px-8 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-full px-2.5 py-0.5">
              <Sparkles className="h-3 w-3" />
              <span className="text-[10px] font-bold tracking-wide uppercase">Workspace Calendar</span>
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-foreground">
              Monthly Study Calendar
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
              Track your day-to-day completion rates over the whole month. Click a day to view its detailed target feed.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-border/80 pb-px overflow-x-auto scrollbar-none">
        {[
          { to: '/student/planner', label: 'Daily Planner', icon: LayoutDashboard },
          { to: '/student/planner-calendar', label: 'Monthly Calendar', icon: Calendar },
          { to: '/student/planner-analytics', label: 'Performance Analytics', icon: BarChart3 },
        ].map((tab) => {
          const isActive = pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to as any}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-xs font-extrabold transition-all relative border-b-2 -mb-[2px] whitespace-nowrap",
                isActive 
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Main Calendar View Wrapper */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : (
          <CalendarView
            tasks={tasks}
            onStatusChange={setStatus}
            onEdit={(t) => setEditTask(t)}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Edit Modal */}
      <TaskForm
        open={!!editTask}
        onClose={() => setEditTask(null)}
        onSubmit={handleEdit}
        editTask={editTask}
      />
    </div>
  );
}
