import { useState } from 'react';
import { CheckCircle2, Circle, SkipForward, Pencil, Trash2, Clock, BookOpen, AlarmClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlannerTask, TaskStatus } from '@/types/planner';

interface TaskCardProps {
  task: PlannerTask;
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onEdit: (task: PlannerTask) => void;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_META: Record<TaskStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending:   { label: 'Pending',   bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-400' },
  completed: { label: 'Done',      bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  skipped:   { label: 'Skipped',   bg: 'bg-zinc-100',   text: 'text-zinc-500',   dot: 'bg-zinc-400' },
};

export function TaskCard({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  const [loading, setLoading] = useState(false);
  const meta = STATUS_META[task.status];

  const handleStatus = async (s: TaskStatus) => {
    if (loading) return;
    setLoading(true);
    try {
      await onStatusChange(task.id, s);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (loading) return;
    if (!confirm('Delete this task?')) return;
    setLoading(true);
    try {
      await onDelete(task.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        task.status === 'completed' && 'opacity-70',
        task.status === 'skipped' && 'opacity-50',
      )}
    >
      {/* Left accent bar */}
      <div className={cn(
        'absolute left-0 top-3 bottom-3 w-1 rounded-full',
        task.status === 'completed' ? 'bg-emerald-500' :
        task.status === 'skipped' ? 'bg-zinc-300' : 'bg-amber-400'
      )} />

      <div className="pl-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'font-semibold text-sm text-zinc-900 leading-snug',
              task.status === 'completed' && 'line-through text-zinc-400'
            )}>
              {task.title}
            </h3>

            {task.description && (
              <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{task.description}</p>
            )}
          </div>

          {/* Status badge */}
          <span className={cn('shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', meta.bg, meta.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
            {meta.label}
          </span>
        </div>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          {task.subject && (
            <span className="flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-violet-700 font-medium">
              <BookOpen className="h-3 w-3" />
              {task.subject}
            </span>
          )}
          {(task.start_time || task.end_time) && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.start_time ?? '—'}{task.end_time ? ` – ${task.end_time}` : ''}
            </span>
          )}
        </div>

        {/* Action row */}
        <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-3">
          {/* Status toggles */}
          {task.status !== 'completed' && (
            <button
              onClick={() => handleStatus('completed')}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </button>
          )}
          {task.status === 'completed' && (
            <button
              onClick={() => handleStatus('pending')}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              <Circle className="h-3.5 w-3.5" />
              Undo
            </button>
          )}
          {task.status === 'pending' && (
            <button
              onClick={() => handleStatus('skipped')}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip
            </button>
          )}

          <div className="flex-1" />

          {/* Edit */}
          <button
            onClick={() => onEdit(task)}
            disabled={loading}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 transition-colors disabled:opacity-50"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
