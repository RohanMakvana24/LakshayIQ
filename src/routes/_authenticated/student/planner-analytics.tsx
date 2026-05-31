import { createFileRoute } from '@tanstack/react-router';
import { Loader2, CheckCircle2, Clock3, ListTodo, AlertTriangle, TrendingUp, CalendarCheck, Star } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import {
  useAllTasks,
  useDashboardStats,
  useStudyStreak,
  useSubjectProgress,
  useWeeklyAnalytics,
  useExpectedCompletion,
} from '@/hooks/use-planner';
import { StreakCard } from '@/components/planner/StreakCard';
import { SubjectProgressCard } from '@/components/planner/SubjectProgressCard';
import { WeeklyChart } from '@/components/planner/WeeklyChart';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/student/planner-analytics')({
  component: PlannerAnalyticsPage,
});

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-3xl bg-white border border-zinc-100 p-5 shadow-sm flex flex-col gap-3">
      <div className={cn('h-10 w-10 rounded-2xl flex items-center justify-center', bg)}>
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <div>
        <p className={cn('text-3xl font-black leading-none', color)}>{value}</p>
        <p className="text-sm font-semibold text-zinc-700 mt-1">{label}</p>
        {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function PlannerAnalyticsPage() {
  const { tasks, loading } = useAllTasks();
  const stats = useDashboardStats(tasks);
  const streak = useStudyStreak(tasks);
  const subjects = useSubjectProgress(tasks);
  const weekly = useWeeklyAnalytics(tasks);
  const expected = useExpectedCompletion(tasks);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Analytics</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Your study performance insights
        </p>
      </div>

      {/* ── Today's Dashboard ─────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Today's Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={ListTodo}
            label="Total Tasks"
            value={stats.todayTotal}
            sub="scheduled today"
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={stats.todayCompleted}
            sub={`${stats.todayCompletionPct}% done`}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <StatCard
            icon={Clock3}
            label="Pending"
            value={stats.todayPending}
            sub="still to do"
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <StatCard
            icon={AlertTriangle}
            label="Missed"
            value={stats.todayMissed}
            sub="overdue tasks"
            color="text-rose-600"
            bg="bg-rose-50"
          />
        </div>

        {/* Today's progress bar */}
        {stats.todayTotal > 0 && (
          <div className="mt-4 rounded-2xl bg-white border border-zinc-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-zinc-800">Today's Completion</span>
              <span className={cn(
                'text-sm font-black',
                stats.todayCompletionPct === 100 ? 'text-emerald-600' :
                stats.todayCompletionPct >= 50 ? 'text-amber-600' : 'text-rose-600'
              )}>
                {stats.todayCompletionPct}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  stats.todayCompletionPct === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                  stats.todayCompletionPct >= 50 ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                  'bg-gradient-to-r from-rose-500 to-pink-500'
                )}
                style={{ width: `${stats.todayCompletionPct}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Streak & Expected Completion ──────────────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Study Streak</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <StreakCard streak={streak} />

          {/* Expected Completion Card */}
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm relative overflow-hidden">
            <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-100/50 to-purple-100/50 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <CalendarCheck className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Expected Completion</h3>
                  <p className="text-xs text-zinc-400">Based on your average pace</p>
                </div>
              </div>

              {expected.pendingCount === 0 ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="text-sm font-bold text-emerald-600">All caught up!</p>
                  <p className="text-xs text-zinc-400 mt-1">No pending tasks remain</p>
                </div>
              ) : expected.expectedDate === null ? (
                <div className="text-center py-4">
                  <p className="text-sm font-semibold text-zinc-700">{expected.pendingCount} pending</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Complete more tasks to get a prediction
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-indigo-50 p-4 text-center">
                    <p className="text-2xl font-black text-indigo-700">
                      {format(parseISO(expected.expectedDate), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-indigo-500 mt-1 font-medium">
                      {expected.daysFromNow === 1 ? 'Tomorrow!' :
                       expected.daysFromNow === 0 ? 'Today!' :
                       `In ${expected.daysFromNow} days`}
                    </p>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500 font-medium px-1">
                    <span>📋 {expected.pendingCount} tasks pending</span>
                    <span>⚡ {expected.avgPerDay}/day avg</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Weekly Analytics ──────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">This Week</h2>
        <div className="grid sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Created', value: weekly.totalCreated, color: 'text-zinc-700' },
            { label: 'Completed', value: weekly.totalCompleted, color: 'text-emerald-600' },
            { label: 'Rate', value: `${weekly.completionRate}%`, color: 'text-blue-600' },
            { label: 'Most Active', value: weekly.mostActiveDay, color: 'text-violet-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white border border-zinc-100 p-4 shadow-sm text-center">
              <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
              <p className="text-[11px] font-semibold text-zinc-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <WeeklyChart analytics={weekly} />
      </section>

      {/* ── Subject Progress ──────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Subject Breakdown</h2>
        <SubjectProgressCard subjects={subjects} />
      </section>
    </div>
  );
}
