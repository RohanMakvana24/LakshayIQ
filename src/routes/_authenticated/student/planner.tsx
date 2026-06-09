import { createFileRoute, Link, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Loader2, CheckCircle2, Clock3, ListTodo, CalendarDays, Sparkles, LayoutDashboard, Calendar, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAllTasks, usePlannerMutations, useMissedTasks } from '@/hooks/use-planner';
import { TaskCard } from '@/components/planner/TaskCard';
import { TaskForm } from '@/components/planner/TaskForm';
import { MissedTasksPanel } from '@/components/planner/MissedTasksPanel';
import type { PlannerTask } from '@/types/planner';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/student/planner')({
  component: PlannerPage,
});

function PlannerPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  
  const { tasks, loading, refresh } = useAllTasks();
  const { tasks: missedTasks, refresh: refreshMissed } = useMissedTasks();
  const { create, update, setStatus, reschedule, remove, mutating } = usePlannerMutations(() => {
    refresh();
    refreshMissed();
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<PlannerTask | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const todayTasks = tasks.filter((t) => t.date === today);
  const selectedTasks = tasks
    .filter((t) => t.date === selectedDate)
    .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));

  const filteredTasks = selectedTasks.filter((t) => {
    if (activeTabFilter === 'pending') return t.status === 'pending';
    if (activeTabFilter === 'completed') return t.status === 'completed';
    return true;
  });

  const completedCount = selectedTasks.filter((t) => t.status === 'completed').length;
  const pendingCount = selectedTasks.filter((t) => t.status === 'pending').length;
  const pct = selectedTasks.length > 0 ? Math.round((completedCount / selectedTasks.length) * 100) : 0;

  const handleCreate = async (data: Parameters<typeof create>[0]) => {
    try {
      await create(data);
      toast.success('Task added!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as any)?.message ?? 'Failed to add task';
      toast.error(msg);
      throw err;
    }
  };

  const handleEdit = async (data: Parameters<typeof create>[0]) => {
    if (!editTask) return;
    try {
      await update(editTask.id, data);
      toast.success('Task updated!');
      setEditTask(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as any)?.message ?? 'Failed to update task';
      toast.error(msg);
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success('Task deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as any)?.message ?? 'Failed to delete task';
      toast.error(msg);
    }
  };

  const handleReschedule = async (id: string, newDate: string) => {
    try {
      await reschedule(id, newDate);
      toast.success('Task rescheduled!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as any)?.message ?? 'Failed to reschedule task';
      toast.error(msg);
    }
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
              <span className="text-[10px] font-bold tracking-wide uppercase">Workspace module</span>
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-foreground">
              Study Planner & Target Board
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
              Map out study topics, log daily targets, reschedule missed tasks, and track syllabus milestone percentages.
            </p>
          </div>
          <button
            onClick={() => { setEditTask(null); setFormOpen(true); }}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/10 shrink-0 self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            Create Target
          </button>
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

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Bento Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Date Picker Bento */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
              Active Date
            </h3>
            
            <div className="flex items-center gap-3 bg-secondary/50 border border-border/60 rounded-xl p-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 bg-transparent text-sm font-bold text-foreground focus:outline-none"
              />
              {selectedDate !== today && (
                <button
                  onClick={() => setSelectedDate(today)}
                  className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition-colors"
                >
                  Today
                </button>
              )}
            </div>
            
            <p className="text-[11px] font-bold text-muted-foreground text-center">
              Selected: {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Progress Circular Bento */}
          {selectedTasks.length > 0 && (
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] backdrop-blur-sm flex flex-col items-center text-center space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground self-start">
                Day Progress
              </h3>
              
              <div className="relative h-28 w-28 flex items-center justify-center">
                <svg className="h-full w-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-muted-foreground/10"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-emerald-500 transition-all duration-700"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - pct / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-foreground">{pct}%</span>
                  <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest leading-none">Done</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-foreground">
                  {completedCount} of {selectedTasks.length} Done
                </p>
                <p className="text-xs text-muted-foreground leading-normal">
                  {pct === 100 ? "Amazing! Clean sweep!" : "Keep pushing to complete your day!"}
                </p>
              </div>
            </div>
          )}

          {/* Missed Tasks Panel (Alert style inside sidebar) */}
          {missedTasks.length > 0 && (
            <div className="space-y-3">
              <MissedTasksPanel
                tasks={missedTasks}
                onReschedule={handleReschedule}
                onDelete={handleDelete}
              />
            </div>
          )}

        </div>

        {/* Right Bento Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Performance Stats Cards row */}
          {selectedTasks.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: ListTodo, label: 'Total', value: selectedTasks.length, color: 'text-blue-500 bg-blue-500/10 border-blue-500/15' },
                { icon: CheckCircle2, label: 'Completed', value: completedCount, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/15' },
                { icon: Clock3, label: 'Pending', value: pendingCount, color: 'text-amber-500 bg-amber-500/10 border-amber-500/15' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-card border border-border/80 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col items-center gap-2 text-center">
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center border", s.color)}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-foreground">{s.value}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Task Feed Container */}
          <div className="bg-card/75 border border-border/80 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4">
            
            {/* Filter Toolbar */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-emerald-500" />
                Active Targets
              </h2>
              
              <div className="flex bg-secondary p-0.5 rounded-lg border border-border/40">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'completed', label: 'Done' }
                ].map((btn) => {
                  const isActive = activeTabFilter === btn.value;
                  return (
                    <button
                      key={btn.value}
                      onClick={() => setActiveTabFilter(btn.value as any)}
                      className={cn(
                        "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                        isActive 
                          ? "bg-card shadow-sm border border-border/50 text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {btn.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Task list viewport */}
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 py-16 text-center space-y-3">
                  <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto text-xl">📋</div>
                  <div>
                    <p className="text-xs font-bold text-foreground">No matching tasks for this day</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Define study targets, homework items, or class test marks above.</p>
                  </div>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={setStatus}
                    onEdit={(t) => { setEditTask(t); setFormOpen(true); }}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Task Form Modal */}
      <TaskForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTask(null); }}
        onSubmit={editTask ? handleEdit : handleCreate}
        defaultDate={selectedDate}
        editTask={editTask}
      />
    </div>
  );
}
