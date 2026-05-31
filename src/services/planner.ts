// ============================================================
// Service Layer: Planner Tasks (Supabase queries)
// ============================================================
import { supabase } from '@/integrations/supabase/client';
import type { PlannerTask, TaskFormData, TaskStatus } from '@/types/planner';

/** Convert a Supabase PostgrestError (or anything) into a proper Error */
function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  // PostgrestError has .message .details .hint .code
  const msg =
    (e as { message?: string })?.message ||
    (e as { details?: string })?.details ||
    JSON.stringify(e);
  return new Error(msg);
}

// -------------------------------------------------------
// Fetch
// -------------------------------------------------------

/** Fetch all tasks for the user */
export async function fetchAllTasks(userId: string): Promise<PlannerTask[]> {
  const { data, error } = await supabase
    .from('planner_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw toError(error);
  return (data ?? []) as PlannerTask[];
}

/** Fetch tasks for a specific date */
export async function fetchTasksByDate(userId: string, date: string): Promise<PlannerTask[]> {
  const { data, error } = await supabase
    .from('planner_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('start_time', { ascending: true });

  if (error) throw toError(error);
  return (data ?? []) as PlannerTask[];
}

/** Fetch tasks within a date range (for calendar / analytics) */
export async function fetchTasksByDateRange(
  userId: string,
  from: string,
  to: string,
): Promise<PlannerTask[]> {
  const { data, error } = await supabase
    .from('planner_tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw toError(error);
  return (data ?? []) as PlannerTask[];
}

/** Fetch missed tasks: pending tasks whose date is before today */
export async function fetchMissedTasks(userId: string): Promise<PlannerTask[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('planner_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('date', today)
    .order('date', { ascending: false });

  if (error) throw toError(error);
  return (data ?? []) as PlannerTask[];
}

// -------------------------------------------------------
// Mutations
// -------------------------------------------------------

/** Create a new task */
export async function createTask(
  userId: string,
  formData: TaskFormData,
): Promise<PlannerTask> {
  const { data, error } = await supabase
    .from('planner_tasks')
    .insert({
      user_id: userId,
      title: formData.title,
      description: formData.description || null,
      subject: formData.subject || null,
      date: formData.date,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      status: 'pending' as TaskStatus,
    })
    .select()
    .single();

  if (error) throw toError(error);
  return data as PlannerTask;
}

/** Update a task's fields (partial) */
export async function updateTask(
  id: string,
  updates: Partial<Omit<PlannerTask, 'id' | 'user_id' | 'created_at'>>,
): Promise<PlannerTask> {
  const { data, error } = await supabase
    .from('planner_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw toError(error);
  return data as PlannerTask;
}

/** Update only the status of a task */
export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const { error } = await supabase
    .from('planner_tasks')
    .update({ status })
    .eq('id', id);

  if (error) throw toError(error);
}

/** Reschedule a missed task to a new date (resets status to pending) */
export async function rescheduleTask(id: string, newDate: string): Promise<PlannerTask> {
  const { data, error } = await supabase
    .from('planner_tasks')
    .update({ date: newDate, status: 'pending' as TaskStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) throw toError(error);
  return data as PlannerTask;
}

/** Delete a task */
export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('planner_tasks').delete().eq('id', id);
  if (error) throw toError(error);
}
