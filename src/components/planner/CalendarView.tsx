import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlannerTask, CalendarDayData } from '@/types/planner';
import { useCalendarMonth } from '@/hooks/use-planner';
import { TaskCard } from './TaskCard';
import type { TaskStatus } from '@/types/planner';

interface CalendarViewProps {
  tasks: PlannerTask[];
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  onEdit: (task: PlannerTask) => void;
  onDelete: (id: string) => Promise<void>;
}

const COLOR_MAP: Record<CalendarDayData['color'], string> = {
  green:  'bg-emerald-500 text-white shadow-sm shadow-emerald-200',
  yellow: 'bg-amber-400 text-white shadow-sm shadow-amber-200',
  red:    'bg-rose-500 text-white shadow-sm shadow-rose-200',
  none:   'bg-transparent text-zinc-700',
};

const DOT_MAP: Record<CalendarDayData['color'], string> = {
  green:  'bg-emerald-400',
  yellow: 'bg-amber-300',
  red:    'bg-rose-400',
  none:   '',
};

export function CalendarView({ tasks, onStatusChange, onEdit, onDelete }: CalendarViewProps) {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const calData = useCalendarMonth(tasks, month);
  const calMap = useMemo(() => {
    const m: Record<string, CalendarDayData> = {};
    calData.forEach((d) => { m[d.date] = d; });
    return m;
  }, [calData]);

  // Build calendar grid (6 weeks)
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const weeks: Date[][] = [];
  let cur = gridStart;
  while (cur <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cur);
      cur = addDays(cur, 1);
    }
    weeks.push(week);
  }

  const selectedTasks = selectedDate
    ? tasks.filter((t) => t.date === selectedDate).sort((a, b) =>
        (a.start_time ?? '').localeCompare(b.start_time ?? ''))
    : [];

  return (
    <div className="space-y-6">
      {/* Calendar Card */}
      <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
        {/* Month Nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <button
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-base font-bold text-zinc-900">{format(month, 'MMMM yyyy')}</h2>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-zinc-50">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="py-3 text-center text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="p-4">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5 mb-1.5">
              {week.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const data = calMap[key];
                const inMonth = isSameMonth(day, month);
                const today = isToday(day);
                const isSelected = selectedDate === key;
                const color = inMonth && data ? data.color : 'none';

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-2xl aspect-square text-sm font-semibold transition-all duration-150',
                      inMonth ? 'cursor-pointer' : 'opacity-20 pointer-events-none',
                      today && color === 'none' && 'ring-2 ring-emerald-400 ring-offset-1',
                      isSelected && 'scale-95 ring-2 ring-zinc-900 ring-offset-1',
                      inMonth && color !== 'none' ? COLOR_MAP[color] : 'hover:bg-zinc-50 text-zinc-700',
                    )}
                  >
                    <span className="text-xs sm:text-sm leading-none">{format(day, 'd')}</span>
                    {inMonth && data && data.total > 0 && (
                      <span className="mt-0.5 text-[8px] font-bold opacity-80">
                        {data.completionPct}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 px-6 py-3 border-t border-zinc-50 bg-zinc-50/50">
          {[
            { color: 'bg-emerald-500', label: '100%' },
            { color: 'bg-amber-400', label: '50–99%' },
            { color: 'bg-rose-500', label: '<50%' },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
              <span className={cn('h-2.5 w-2.5 rounded-full', l.color)} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Selected Date Tasks Drawer */}
      {selectedDate && (
        <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                {format(parseISO(selectedDate), 'EEEE, MMMM d')}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
                {calMap[selectedDate]?.total > 0 && ` · ${calMap[selectedDate].completionPct}% done`}
              </p>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {selectedTasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-400">
                No tasks for this day
              </div>
            ) : (
              selectedTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
