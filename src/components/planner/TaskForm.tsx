import { useState, useEffect } from 'react';
import { X, Plus, Loader2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlannerTask, TaskFormData } from '@/types/planner';
import { format } from 'date-fns';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  defaultDate?: string;
  editTask?: PlannerTask | null;
}

const COMMON_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'History',
  'Geography',
  'Economics',
  'Statistics',
  'Programming',
  'Data Structures',
  'Algorithms',
  'Machine Learning',
  'Networking',
  'Database',
  'Operating Systems',
];

const empty = (date?: string): TaskFormData => ({
  title: '',
  description: '',
  subject: '',
  date: date ?? format(new Date(), 'yyyy-MM-dd'),
  start_time: '',
  end_time: '',
});

const CUSTOM_SENTINEL = '__custom__';

export function TaskForm({ open, onClose, onSubmit, defaultDate, editTask }: TaskFormProps) {
  const [form, setForm] = useState<TaskFormData>(empty(defaultDate));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subject mode: 'select' or 'custom'
  const [subjectMode, setSubjectMode] = useState<'select' | 'custom'>('select');

  useEffect(() => {
    if (editTask) {
      const isCustom = editTask.subject
        ? !COMMON_SUBJECTS.includes(editTask.subject)
        : false;
      setSubjectMode(isCustom ? 'custom' : 'select');
      setForm({
        title: editTask.title,
        description: editTask.description ?? '',
        subject: editTask.subject ?? '',
        date: editTask.date,
        start_time: editTask.start_time ?? '',
        end_time: editTask.end_time ?? '',
      });
    } else {
      setForm(empty(defaultDate));
      setSubjectMode('select');
    }
    setError(null);
  }, [editTask, defaultDate, open]);

  const set = (key: keyof TaskFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === CUSTOM_SENTINEL) {
      setSubjectMode('custom');
      setForm((prev) => ({ ...prev, subject: '' }));
    } else {
      setSubjectMode('select');
      setForm((prev) => ({ ...prev, subject: val }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.date) { setError('Date is required'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ||
            (err as { details?: string })?.details ||
            'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // Which value to show in the <select>
  const selectValue =
    subjectMode === 'custom'
      ? CUSTOM_SENTINEL
      : form.subject || '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-zinc-950/30 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-100 animate-in slide-in-from-bottom-4 duration-300 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">{editTask ? 'Edit Task' : 'New Task'}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {editTask ? 'Update task details' : 'Add a study task to your planner'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Study Chapter 5 – Calculus"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Optional notes..."
              rows={2}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-none"
            />
          </div>

          {/* Subject — Select box */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Subject</label>

            {/* Dropdown */}
            <select
              value={selectValue}
              onChange={handleSubjectSelect}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all appearance-none cursor-pointer"
            >
              <option value="">— No Subject —</option>
              {COMMON_SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value={CUSTOM_SENTINEL}>✏️ Add Custom Subject...</option>
            </select>

            {/* Custom text input — shown only when "Add Custom" is selected */}
            {subjectMode === 'custom' && (
              <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <input
                  value={form.subject}
                  onChange={set('subject')}
                  placeholder="Type your subject name..."
                  autoFocus
                  className="flex-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSubjectMode('select');
                    setForm((prev) => ({ ...prev, subject: '' }));
                  }}
                  className="h-9 w-9 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0"
                  title="Cancel custom"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Badge preview of chosen subject */}
            {form.subject && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Selected:</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                  {form.subject}
                </span>
              </div>
            )}
          </div>

          {/* Date + Times */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={set('date')}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Start</label>
              <input
                type="time"
                value={form.start_time}
                onChange={set('start_time')}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">End</label>
              <input
                type="time"
                value={form.end_time}
                onChange={set('end_time')}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs text-rose-600 font-medium border border-rose-100">
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60 shadow-sm shadow-emerald-200"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {editTask ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
