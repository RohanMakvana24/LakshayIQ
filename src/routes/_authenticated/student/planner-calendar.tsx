import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAllTasks, usePlannerMutations } from '@/hooks/use-planner';
import { CalendarView } from '@/components/planner/CalendarView';
import { TaskForm } from '@/components/planner/TaskForm';
import type { PlannerTask } from '@/types/planner';

export const Route = createFileRoute('/_authenticated/student/planner-calendar')({
  component: PlannerCalendarPage,
});

function PlannerCalendarPage() {
  const { tasks, loading, refresh } = useAllTasks();
  const { update, setStatus, remove, mutating } = usePlannerMutations(refresh);

  const [editTask, setEditTask] = useState<PlannerTask | null>(null);

  const handleDelete = async (id: string) => {
    await remove(id);
    toast.success('Task deleted');
  };

  const handleEdit = async (data: Parameters<typeof update>[1]) => {
    if (!editTask) return;
    await update(editTask.id, data);
    toast.success('Task updated!');
    setEditTask(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Planner Calendar</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Monthly view of your study progress
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : (
        <CalendarView
          tasks={tasks}
          onStatusChange={setStatus}
          onEdit={(t) => setEditTask(t)}
          onDelete={handleDelete}
        />
      )}

      {/* Edit Modal */}
      <TaskForm
        open={!!editTask}
        onClose={() => setEditTask(null)}
        onSubmit={handleEdit}
        editTask={editTask}
      />
    </div>
  );
}
