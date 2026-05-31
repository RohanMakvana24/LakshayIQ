import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus, Loader2, CheckCircle2, Clock3, ListTodo, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAllTasks, usePlannerMutations, useMissedTasks } from '@/hooks/use-planner';
import { TaskCard } from '@/components/planner/TaskCard';
import { TaskForm } from '@/components/planner/TaskForm';
import { MissedTasksPanel } from '@/components/planner/MissedTasksPanel';
import type { PlannerTask } from '@/types/planner';

export const Route = createFileRoute('/_authenticated/student/planner')({
  component: PlannerPage,
});

function PlannerPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { tasks, loading, refresh } = useAllTasks();
  const { tasks: missedTasks, refresh: refreshMissed } = useMissedTasks();
  const { create, update, setStatus, reschedule, remove, mutating } = usePlannerMutations(() => {
    refresh();
    refreshMissed();
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<PlannerTask | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);

  const todayTasks = tasks.filter((t) => t.date === today);
  const selectedTasks = tasks
    .filter((t) => t.date === selectedDate)
    .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));

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
      throw err; // re-throw so TaskForm shows inline error too
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Study Planner</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <button
          onClick={() => { setEditTask(null); setFormOpen(true); }}
          className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-sm shadow-emerald-200"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {/* Date Selector */}
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CalendarDays className="h-4 w-4 text-zinc-400 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 focus:outline-none"
          />
        </div>
        {selectedDate !== today && (
          <button
            onClick={() => setSelectedDate(today)}
            className="shrink-0 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Today
          </button>
        )}
      </div>

      {/* Stats Row */}
      {selectedTasks.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ListTodo, label: 'Total', value: selectedTasks.length, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: CheckCircle2, label: 'Done', value: completedCount, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: Clock3, label: 'Pending', value: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white border border-zinc-100 p-4 shadow-sm flex flex-col items-center gap-1.5">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[11px] font-semibold text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {selectedTasks.length > 0 && (
        <div className="rounded-2xl bg-white border border-zinc-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-700">
              {selectedDate === today ? "Today's Progress" : `${format(new Date(selectedDate + 'T00:00:00'), 'MMM d')} Progress`}
            </span>
            <span className="text-xs font-black text-emerald-600">{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : selectedTasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-semibold text-zinc-600">No tasks for this day</p>
            <p className="text-xs text-zinc-400 mt-1">Click "Add Task" to create one</p>
          </div>
        ) : (
          selectedTasks.map((task) => (
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

      {/* Missed Tasks */}
      {missedTasks.length > 0 && (
        <MissedTasksPanel
          tasks={missedTasks}
          onReschedule={handleReschedule}
          onDelete={handleDelete}
        />
      )}

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
