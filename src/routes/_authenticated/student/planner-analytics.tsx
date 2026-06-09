import { createFileRoute, Link, useRouterState } from '@tanstack/react-router';
import { Loader2, CheckCircle2, Clock3, ListTodo, AlertTriangle, Sparkles, LayoutDashboard, Calendar, BarChart3, CalendarCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
    <div className="rounded-2xl bg-card border border-border/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col gap-3">
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center border', bg)}>
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <div>
        <p className={cn('text-2xl font-black leading-none', color)}>{value}</p>
        <p className="text-xs font-bold text-foreground mt-1.5 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function PlannerAnalyticsPage() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
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
    <div className="w-full py-2 space-y-6">
      {/* Premium Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary/[0.02] via-card to-emerald-500/[0.01] border border-border/80 overflow-hidden shadow-[0_12px_40px_-12px_rgba(0,0,0,0.03)] dark:shadow-none">
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-6 py-6 md:px-8 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 rounded-full px-2.5 py-0.5">
              <Sparkles className="h-3 w-3" />
              <span className="text-[10px] font-bold tracking-wide uppercase">Workspace Analytics</span>
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-foreground">
              Performance & Streaks Analytics
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm max-w-2xl leading-relaxed">
              Track completion metrics, study streak records, weekly analytics charts, and subject duration progress.
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

      {/* Today's Summary Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Today's Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={ListTodo}
            label="Total Tasks"
            value={stats.todayTotal}
            sub="scheduled today"
            color="text-blue-500"
            bg="bg-blue-500/10 border-blue-500/15"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={stats.todayCompleted}
            sub={`${stats.todayCompletionPct}% done`}
            color="text-emerald-500"
            bg="bg-emerald-500/10 border-emerald-500/15"
          />
          <StatCard
            icon={Clock3}
            label="Pending"
            value={stats.todayPending}
            sub="still to do"
            color="text-amber-500"
            bg="bg-amber-500/10 border-amber-500/15"
          />
          <StatCard
            icon={AlertTriangle}
            label="Missed"
            value={stats.todayMissed}
            sub="overdue tasks"
            color="text-rose-500"
            bg="bg-rose-500/10 border-rose-500/15"
          />
        </div>

        {/* Progress Bar Bento */}
        {stats.todayTotal > 0 && (
          <div className="rounded-2xl bg-card border border-border/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Today's Completion</span>
              <span className={cn(
                'text-xs font-black uppercase tracking-wider',
                stats.todayCompletionPct === 100 ? 'text-emerald-500' :
                stats.todayCompletionPct >= 50 ? 'text-amber-500' : 'text-rose-500'
              )}>
                {stats.todayCompletionPct}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
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

      {/* Streak & Completion Prediction */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Study Streak & Forecast</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <StreakCard streak={streak} />

          {/* Forecast Completion Date Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 blur-2xl" />
            
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center">
                <CalendarCheck className="h-4 w-4 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Expected Completion</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Based on average pace</p>
              </div>
            </div>

            <div className="my-6">
              {expected.pendingCount === 0 ? (
                <div className="text-center py-2">
                  <div className="text-3xl mb-1">🎉</div>
                  <p className="text-xs font-bold text-emerald-500">All caught up!</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">No pending targets remain</p>
                </div>
              ) : expected.expectedDate === null ? (
                <div className="text-center py-2">
                  <p className="text-sm font-bold text-foreground">{expected.pendingCount} pending</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Complete more tasks to get a prediction
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-4 text-center">
                    <p className="text-2xl font-black text-indigo-600">
                      {format(parseISO(expected.expectedDate), 'MMM d, yyyy')}
                    </p>
                    <p className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-widest mt-1">
                      {expected.daysFromNow === 1 ? 'Tomorrow!' :
                       expected.daysFromNow === 0 ? 'Today!' :
                       `In ${expected.daysFromNow} days`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider border-t border-border/60 pt-3">
              <span>📋 {expected.pendingCount} tasks pending</span>
              <span>⚡ {expected.avgPerDay}/day avg</span>
            </div>
          </div>

        </div>
      </section>

      {/* Weekly Analytics Chart */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Weekly Overview</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Created', value: weekly.totalCreated, color: 'text-foreground' },
            { label: 'Completed', value: weekly.totalCompleted, color: 'text-emerald-500' },
            { label: 'Rate', value: `${weekly.completionRate}%`, color: 'text-blue-500' },
            { label: 'Most Active', value: weekly.mostActiveDay, color: 'text-violet-500' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-card border border-border/80 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.01)] text-center">
              <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
          <WeeklyChart analytics={weekly} />
        </div>
      </section>

      {/* Subject Breakdown Card */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground font-bold">Subject Breakdown</h2>
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
          <SubjectProgressCard subjects={subjects} />
        </div>
      </section>

    </div>
  );
}
