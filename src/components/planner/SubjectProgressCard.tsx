import { cn } from '@/lib/utils';
import type { SubjectProgress } from '@/types/planner';
import { BookOpen, TrendingUp } from 'lucide-react';

interface SubjectProgressCardProps {
  subjects: SubjectProgress[];
}

const SUBJECT_COLORS = [
  { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', bar: 'bg-gradient-to-r from-violet-500 to-purple-500' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-gradient-to-r from-blue-500 to-indigo-500' },
  { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-gradient-to-r from-amber-500 to-orange-500' },
  { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', bar: 'bg-gradient-to-r from-rose-500 to-pink-500' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-700', bar: 'bg-gradient-to-r from-cyan-500 to-sky-500' },
];

export function SubjectProgressCard({ subjects }: SubjectProgressCardProps) {
  if (subjects.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <BookOpen className="h-4.5 w-4.5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Subject Progress</h3>
            <p className="text-xs text-zinc-400">No subjects yet</p>
          </div>
        </div>
        <p className="text-sm text-zinc-400 text-center py-6">
          Add tasks with a subject to see your progress here
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center">
          <BookOpen className="h-4 w-4 text-violet-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Subject Progress</h3>
          <p className="text-xs text-zinc-400">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} tracked</p>
        </div>
      </div>

      <div className="space-y-4">
        {subjects.map((s, i) => {
          const colorSet = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
          return (
            <div key={s.subject}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', colorSet.bg)} />
                  <span className="text-sm font-semibold text-zinc-800 truncate">{s.subject}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-xs text-zinc-400">{s.completed}/{s.total}</span>
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', colorSet.light, colorSet.text)}>
                    {s.pct}%
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', colorSet.bar)}
                  style={{ width: `${s.pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
