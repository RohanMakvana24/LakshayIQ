import { useState } from 'react';
import { AlertTriangle, CalendarClock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { PlannerTask } from '@/types/planner';

interface MissedTasksPanelProps {
  tasks: PlannerTask[];
  onReschedule: (id: string, newDate: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MissedTasksPanel({ tasks, onReschedule, onDelete }: MissedTasksPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDates, setNewDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  const handleReschedule = async (id: string) => {
    const date = newDates[id] || today;
    setLoading(id);
    try {
      await onReschedule(id, date);
      setReschedulingId(null);
      setNewDates((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this missed task permanently?')) return;
    setLoading(id);
    try {
      await onDelete(id);
    } finally {
      setLoading(null);
    }
  };

  if (tasks.length === 0) return null;

  return (
    <div className="rounded-3xl border border-rose-100 bg-rose-50/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-rose-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-rose-100 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-rose-800">Missed Tasks</p>
            <p className="text-xs text-rose-500">{tasks.length} overdue task{tasks.length !== 1 ? 's' : ''} need attention</p>
          </div>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-rose-400" />
        ) : (
          <ChevronUp className="h-4 w-4 text-rose-400" />
        )}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {tasks.map((task) => {
            const isRescheduling = reschedulingId === task.id;
            const isLoading = loading === task.id;
            const daysDiff = Math.abs(
              Math.round((new Date().getTime() - parseISO(task.date).getTime()) / (1000 * 60 * 60 * 24))
            );

            return (
              <div key={task.id} className="rounded-2xl bg-white border border-rose-100 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{task.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {task.subject && (
                        <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                          {task.subject}
                        </span>
                      )}
                      <span className="text-[10px] text-rose-500 font-medium">
                        {format(parseISO(task.date), 'MMM d')} · {daysDiff}d overdue
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setReschedulingId(isRescheduling ? null : task.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      disabled={isLoading}
                      className="rounded-xl px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-rose-100 hover:text-rose-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '✕'}
                    </button>
                  </div>
                </div>

                {isRescheduling && (
                  <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <input
                      type="date"
                      min={today}
                      value={newDates[task.id] ?? today}
                      onChange={(e) => setNewDates((prev) => ({ ...prev, [task.id]: e.target.value }))}
                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                    />
                    <button
                      onClick={() => handleReschedule(task.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60"
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
