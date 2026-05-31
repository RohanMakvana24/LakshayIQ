// ============================================================
// Hook: use-planner.ts
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import * as plannerService from '@/services/planner';
import type {
  PlannerTask,
  TaskFormData,
  TaskStatus,
  CalendarDayData,
  SubjectProgress,
  StudyStreak,
  WeeklyAnalytics,
  DashboardStats,
  ExpectedCompletion,
} from '@/types/planner';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subDays,
  addDays,
  parseISO,
  differenceInCalendarDays,
  isToday,
  isBefore,
} from 'date-fns';

// -------------------------------------------------------
// All Tasks Hook (for analytics & calendar)
// -------------------------------------------------------
export function useAllTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await plannerService.fetchAllTasks(user.id);
      setTasks(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { tasks, loading, error, refresh: load };
}

// -------------------------------------------------------
// Tasks for a Specific Date
// -------------------------------------------------------
export function useTasksByDate(date: string) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await plannerService.fetchTasksByDate(user.id, date);
      setTasks(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user, date]);

  useEffect(() => { load(); }, [load]);

  return { tasks, loading, error, refresh: load };
}

// -------------------------------------------------------
// Missed Tasks
// -------------------------------------------------------
export function useMissedTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await plannerService.fetchMissedTasks(user.id);
      setTasks(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load missed tasks');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { tasks, loading, error, refresh: load };
}

// -------------------------------------------------------
// Mutations
// -------------------------------------------------------
export function usePlannerMutations(refresh: () => void) {
  const { user } = useAuth();
  const [mutating, setMutating] = useState(false);
  const [mutError, setMutError] = useState<string | null>(null);

  const create = useCallback(async (data: TaskFormData) => {
    if (!user) return;
    setMutating(true);
    setMutError(null);
    try {
      await plannerService.createTask(user.id, data);
      refresh();
    } catch (e: unknown) {
      setMutError(e instanceof Error ? e.message : 'Failed to create task');
      throw e;
    } finally {
      setMutating(false);
    }
  }, [user, refresh]);

  const update = useCallback(async (
    id: string,
    updates: Partial<Omit<PlannerTask, 'id' | 'user_id' | 'created_at'>>,
  ) => {
    setMutating(true);
    setMutError(null);
    try {
      await plannerService.updateTask(id, updates);
      refresh();
    } catch (e: unknown) {
      setMutError(e instanceof Error ? e.message : 'Failed to update task');
      throw e;
    } finally {
      setMutating(false);
    }
  }, [refresh]);

  const setStatus = useCallback(async (id: string, status: TaskStatus) => {
    setMutating(true);
    try {
      await plannerService.updateTaskStatus(id, status);
      refresh();
    } catch (e: unknown) {
      setMutError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setMutating(false);
    }
  }, [refresh]);

  const reschedule = useCallback(async (id: string, newDate: string) => {
    setMutating(true);
    try {
      await plannerService.rescheduleTask(id, newDate);
      refresh();
    } catch (e: unknown) {
      setMutError(e instanceof Error ? e.message : 'Failed to reschedule');
    } finally {
      setMutating(false);
    }
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    setMutating(true);
    try {
      await plannerService.deleteTask(id);
      refresh();
    } catch (e: unknown) {
      setMutError(e instanceof Error ? e.message : 'Failed to delete task');
    } finally {
      setMutating(false);
    }
  }, [refresh]);

  return { create, update, setStatus, reschedule, remove, mutating, mutError };
}

// -------------------------------------------------------
// Calendar data for a month
// -------------------------------------------------------
export function useCalendarMonth(tasks: PlannerTask[], month: Date): CalendarDayData[] {
  const from = startOfMonth(month);
  const to = endOfMonth(month);

  const map: Record<string, CalendarDayData> = {};

  // Initialize all days in month
  let cur = from;
  while (cur <= to) {
    const key = format(cur, 'yyyy-MM-dd');
    map[key] = { date: key, total: 0, completed: 0, pending: 0, skipped: 0, completionPct: 0, color: 'none' };
    cur = addDays(cur, 1);
  }

  // Populate from tasks
  for (const t of tasks) {
    if (map[t.date]) {
      map[t.date].total++;
      if (t.status === 'completed') map[t.date].completed++;
      else if (t.status === 'pending') map[t.date].pending++;
      else if (t.status === 'skipped') map[t.date].skipped++;
    }
  }

  // Compute pct & color
  return Object.values(map).map((d) => {
    const pct = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
    let color: CalendarDayData['color'] = 'none';
    if (d.total > 0) {
      if (pct === 100) color = 'green';
      else if (pct >= 50) color = 'yellow';
      else color = 'red';
    }
    return { ...d, completionPct: pct, color };
  });
}

// -------------------------------------------------------
// Dashboard stats (today)
// -------------------------------------------------------
export function useDashboardStats(tasks: PlannerTask[]): DashboardStats {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = tasks.filter((t) => t.date === today);
  const todayCompleted = todayTasks.filter((t) => t.status === 'completed').length;
  const todayPending = todayTasks.filter((t) => t.status === 'pending').length;
  const todayMissed = tasks.filter(
    (t) => t.status === 'pending' && isBefore(parseISO(t.date), new Date()) && t.date !== today
  ).length;
  const todayCompletionPct = todayTasks.length > 0
    ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;

  return {
    todayTotal: todayTasks.length,
    todayCompleted,
    todayPending,
    todayMissed,
    todayCompletionPct,
  };
}

// -------------------------------------------------------
// Study Streak
// -------------------------------------------------------
export function useStudyStreak(tasks: PlannerTask[]): StudyStreak {
  // Build a set of dates that have at least 1 completed task
  const completedDates = new Set(
    tasks.filter((t) => t.status === 'completed').map((t) => t.date)
  );

  // Calculate current streak (going backward from today)
  let current = 0;
  let check = new Date();
  // If today has no completed tasks, start from yesterday for the streak count
  // but if today has them include today
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  if (!completedDates.has(todayKey)) {
    check = subDays(check, 1);
  }
  while (completedDates.has(format(check, 'yyyy-MM-dd'))) {
    current++;
    check = subDays(check, 1);
  }

  // Calculate best streak
  const sortedDates = Array.from(completedDates).sort();
  let best = 0;
  let streak = 0;
  let prev: string | null = null;
  for (const d of sortedDates) {
    if (prev) {
      const diff = differenceInCalendarDays(parseISO(d), parseISO(prev));
      if (diff === 1) {
        streak++;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }
    if (streak > best) best = streak;
    prev = d;
  }

  return { current, best };
}

// -------------------------------------------------------
// Subject Progress
// -------------------------------------------------------
export function useSubjectProgress(tasks: PlannerTask[]): SubjectProgress[] {
  const map: Record<string, { total: number; completed: number }> = {};
  for (const t of tasks) {
    const subj = t.subject || 'General';
    if (!map[subj]) map[subj] = { total: 0, completed: 0 };
    map[subj].total++;
    if (t.status === 'completed') map[subj].completed++;
  }
  return Object.entries(map)
    .map(([subject, v]) => ({
      subject,
      total: v.total,
      completed: v.completed,
      pct: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// -------------------------------------------------------
// Weekly Analytics
// -------------------------------------------------------
export function useWeeklyAnalytics(tasks: PlannerTask[]): WeeklyAnalytics {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const weekTasks = tasks.filter((t) => {
    const d = parseISO(t.date);
    return d >= weekStart && d <= weekEnd;
  });

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyCounts = dayNames.map((day, i) => {
    const dayDate = addDays(weekStart, i);
    const key = format(dayDate, 'yyyy-MM-dd');
    const dayTasks = weekTasks.filter((t) => t.date === key);
    return {
      day,
      created: dayTasks.length,
      completed: dayTasks.filter((t) => t.status === 'completed').length,
    };
  });

  const totalCreated = weekTasks.length;
  const totalCompleted = weekTasks.filter((t) => t.status === 'completed').length;
  const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

  const mostActive = [...dailyCounts].sort((a, b) => b.created - a.created)[0];
  const mostActiveDay = mostActive?.created > 0 ? mostActive.day : '—';

  return { totalCreated, totalCompleted, completionRate, mostActiveDay, dailyCounts };
}

// -------------------------------------------------------
// Expected Completion
// -------------------------------------------------------
export function useExpectedCompletion(tasks: PlannerTask[]): ExpectedCompletion {
  const today = format(new Date(), 'yyyy-MM-dd');
  const pendingTasks = tasks.filter((t) => t.status === 'pending' && t.date >= today);
  const pendingCount = pendingTasks.length;

  // Avg completed per day over last 7 days
  const last7Start = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const last7Completed = tasks.filter(
    (t) => t.status === 'completed' && t.date >= last7Start && t.date < today
  );

  // Count distinct days with at least 1 completed
  const distinctDays = new Set(last7Completed.map((t) => t.date)).size;
  const avgPerDay = distinctDays > 0 ? last7Completed.length / distinctDays : 0;

  if (avgPerDay === 0 || pendingCount === 0) {
    return { pendingCount, avgPerDay: 0, expectedDate: null, daysFromNow: null };
  }

  const daysFromNow = Math.ceil(pendingCount / avgPerDay);
  const expectedDate = format(addDays(new Date(), daysFromNow), 'yyyy-MM-dd');

  return { pendingCount, avgPerDay: Math.round(avgPerDay * 10) / 10, expectedDate, daysFromNow };
}
