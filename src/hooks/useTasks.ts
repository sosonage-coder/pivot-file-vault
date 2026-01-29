import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Task, TaskWithRelations, TaskStats, CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/types/tasks';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, isAfter, isBefore, parseISO } from 'date-fns';

// Fetch tasks for an entity with optional filters
export function useTasks(
  entityId: string | null,
  options?: {
    status?: TaskStatus | null;
    periodId?: string | null;
    assigneeId?: string | null;
  }
) {
  return useQuery({
    queryKey: ['tasks', entityId, options],
    queryFn: async (): Promise<TaskWithRelations[]> => {
      if (!entityId) return [];

      let query = supabase
        .from('tasks')
        .select(`
          *,
          periods(label),
          processes(name),
          areas(name),
          objects(name)
        `)
        .eq('entity_id', entityId)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.periodId) {
        query = query.eq('period_id', options.periodId);
      }
      if (options?.assigneeId) {
        query = query.eq('assignee_id', options.assigneeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as TaskWithRelations[];
    },
    enabled: !!entityId,
  });
}

// Get task statistics for dashboard
export function useTaskStats(entityId: string | null, periodId?: string | null) {
  return useQuery({
    queryKey: ['task-stats', entityId, periodId],
    queryFn: async (): Promise<TaskStats> => {
      if (!entityId) {
        return { open: 0, in_progress: 0, completed: 0, cancelled: 0, total: 0, overdue: 0, dueToday: 0, dueThisWeek: 0 };
      }

      let query = supabase
        .from('tasks')
        .select('status, due_date')
        .eq('entity_id', entityId);

      if (periodId) {
        query = query.eq('period_id', periodId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const tasks = data ?? [];
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

      const stats: TaskStats = {
        open: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        total: tasks.length,
        overdue: 0,
        dueToday: 0,
        dueThisWeek: 0,
      };

      tasks.forEach((task) => {
        // Count by status
        if (task.status === 'open') stats.open++;
        else if (task.status === 'in_progress') stats.in_progress++;
        else if (task.status === 'completed') stats.completed++;
        else if (task.status === 'cancelled') stats.cancelled++;

        // Count due date metrics for non-completed tasks
        if (task.due_date && task.status !== 'completed' && task.status !== 'cancelled') {
          const dueDate = parseISO(task.due_date);
          
          if (isBefore(dueDate, todayStart)) {
            stats.overdue++;
          } else if (!isAfter(dueDate, todayEnd)) {
            stats.dueToday++;
          } else if (!isAfter(dueDate, weekEnd)) {
            stats.dueThisWeek++;
          }
        }
      });

      return stats;
    },
    enabled: !!entityId,
  });
}

// Create a new task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput): Promise<Task> => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...input,
          created_by: userData.user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.entity_id] });
      queryClient.invalidateQueries({ queryKey: ['task-stats', variables.entity_id] });
    },
  });
}

// Update a task
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      taskId, 
      entityId, 
      updates 
    }: { 
      taskId: string; 
      entityId: string; 
      updates: UpdateTaskInput 
    }): Promise<Task> => {
      // Auto-set completed_at when marking as completed
      if (updates.status === 'completed' && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
      }
      // Clear completed_at when reopening
      if (updates.status && updates.status !== 'completed') {
        updates.completed_at = null;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['task-stats', variables.entityId] });
    },
  });
}

// Delete a task
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, entityId }: { taskId: string; entityId: string }) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['task-stats', variables.entityId] });
    },
  });
}

// Bulk update tasks status
export function useBulkUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      taskIds, 
      entityId, 
      status 
    }: { 
      taskIds: string[]; 
      entityId: string; 
      status: TaskStatus 
    }) => {
      const updates: UpdateTaskInput = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .in('id', taskIds);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['task-stats', variables.entityId] });
    },
  });
}
