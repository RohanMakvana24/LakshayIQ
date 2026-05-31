// ============================================================
// Types: Student Planner & Progress Tracker
// ============================================================

export type TaskStatus = 'pending' | 'completed' | 'skipped';

export interface PlannerTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  date: string; // ISO date string "YYYY-MM-DD"
  start_time: string | null; // "HH:MM"
  end_time: string | null;   // "HH:MM"
  status: TaskStatus;
  created_at: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  subject: string;
  date: string;
  start_time: string;
  end_time: string;
}

// -------------------------------------------------------
// Calendar
// -------------------------------------------------------
export interface CalendarDayData {
  date: string; // "YYYY-MM-DD"
  total: number;
  completed: number;
  pending: number;
  skipped: number;
  completionPct: number; // 0–100
  color: 'green' | 'yellow' | 'red' | 'none';
}

// -------------------------------------------------------
// Analytics
// -------------------------------------------------------
export interface SubjectProgress {
  subject: string;
  total: number;
  completed: number;
  pct: number;
}

export interface StudyStreak {
  current: number;
  best: number;
}

export interface WeeklyAnalytics {
  totalCreated: number;
  totalCompleted: number;
  completionRate: number; // 0–100
  mostActiveDay: string; // day name e.g. "Monday"
  dailyCounts: { day: string; created: number; completed: number }[];
}

export interface DashboardStats {
  todayTotal: number;
  todayCompleted: number;
  todayPending: number;
  todayMissed: number;
  todayCompletionPct: number;
}

export interface ExpectedCompletion {
  pendingCount: number;
  avgPerDay: number;
  expectedDate: string | null; // ISO date string or null if no data
  daysFromNow: number | null;
}
