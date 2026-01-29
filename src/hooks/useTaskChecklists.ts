import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
  parseISO,
  addDays,
} from 'date-fns';
import type {
  TaskChecklist,
  TaskChecklistWithRelations,
  TaskChecklistSection,
  TaskChecklistItem,
  TaskChecklistItemWithSection,
  ChecklistStats,
  CreateChecklistInput,
  UpdateChecklistInput,
  CreateSectionInput,
  UpdateSectionInput,
  CreateItemInput,
  UpdateItemInput,
  TaskItemStatus,
} from '@/types/task-checklists';

// =============================================================================
// Checklist Queries
// =============================================================================

/**
 * Fetch all checklists for an entity with optional filters
 */
export function useTaskChecklists(
  entityId: string | null,
  options?: {
    departmentId?: string | null;
    periodId?: string | null;
    isTemplate?: boolean;
  }
) {
  return useQuery({
    queryKey: ['task-checklists', entityId, options],
    queryFn: async (): Promise<TaskChecklistWithRelations[]> => {
      if (!entityId) return [];

      let query = supabase
        .from('task_checklists')
        .select(`
          *,
          departments(name),
          periods(label)
        `)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (options?.departmentId) {
        query = query.eq('department_id', options.departmentId);
      }
      if (options?.periodId) {
        query = query.eq('period_id', options.periodId);
      }
      if (options?.isTemplate !== undefined) {
        query = query.eq('is_template', options.isTemplate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as TaskChecklistWithRelations[];
    },
    enabled: !!entityId,
  });
}

/**
 * Fetch checklist templates (global + entity-specific)
 */
export function useChecklistTemplates(entityId: string | null) {
  return useQuery({
    queryKey: ['checklist-templates', entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_checklists')
        .select('*')
        .eq('is_template', true)
        .order('name');

      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Fetch a single checklist with all its sections and items
 */
export function useTaskChecklist(checklistId: string | null) {
  return useQuery({
    queryKey: ['task-checklist', checklistId],
    queryFn: async (): Promise<TaskChecklistWithRelations | null> => {
      if (!checklistId) return null;

      // Fetch checklist
      const { data: checklist, error: checklistError } = await supabase
        .from('task_checklists')
        .select(`
          *,
          departments(name),
          periods(label)
        `)
        .eq('id', checklistId)
        .single();

      if (checklistError) throw checklistError;
      if (!checklist) return null;

      // Fetch sections
      const { data: sections, error: sectionsError } = await supabase
        .from('task_checklist_sections')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('sort_order');

      if (sectionsError) throw sectionsError;

      // Fetch items
      const { data: items, error: itemsError } = await supabase
        .from('task_checklist_items')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('sort_order');

      if (itemsError) throw itemsError;

      return {
        ...checklist,
        sections: sections ?? [],
        items: items ?? [],
      } as TaskChecklistWithRelations;
    },
    enabled: !!checklistId,
  });
}

// =============================================================================
// Checklist Items Query (for a specific checklist)
// =============================================================================

export function useChecklistItems(checklistId: string | null) {
  return useQuery({
    queryKey: ['checklist-items', checklistId],
    queryFn: async (): Promise<TaskChecklistItemWithSection[]> => {
      if (!checklistId) return [];

      const { data, error } = await supabase
        .from('task_checklist_items')
        .select(`
          *,
          section:task_checklist_sections(*)
        `)
        .eq('checklist_id', checklistId)
        .order('sort_order');

      if (error) throw error;
      return (data ?? []) as TaskChecklistItemWithSection[];
    },
    enabled: !!checklistId,
  });
}

// =============================================================================
// Checklist Stats
// =============================================================================

export function useChecklistStats(checklistId: string | null) {
  return useQuery({
    queryKey: ['checklist-stats', checklistId],
    queryFn: async (): Promise<ChecklistStats> => {
      if (!checklistId) {
        return { total: 0, todo: 0, in_progress: 0, done: 0, overdue: 0, dueToday: 0, completionRate: 0 };
      }

      const { data, error } = await supabase
        .from('task_checklist_items')
        .select('status, due_date')
        .eq('checklist_id', checklistId);

      if (error) throw error;

      const items = data ?? [];
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      const stats: ChecklistStats = {
        total: items.length,
        todo: 0,
        in_progress: 0,
        done: 0,
        overdue: 0,
        dueToday: 0,
        completionRate: 0,
      };

      items.forEach((item) => {
        if (item.status === 'todo') stats.todo++;
        else if (item.status === 'in_progress') stats.in_progress++;
        else if (item.status === 'done') stats.done++;

        // Count due date metrics for non-done items
        if (item.due_date && item.status !== 'done') {
          const dueDate = parseISO(item.due_date);
          if (isBefore(dueDate, todayStart)) {
            stats.overdue++;
          } else if (!isAfter(dueDate, todayEnd)) {
            stats.dueToday++;
          }
        }
      });

      stats.completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

      return stats;
    },
    enabled: !!checklistId,
  });
}

// =============================================================================
// Checklist Mutations
// =============================================================================

export function useCreateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateChecklistInput): Promise<TaskChecklist> => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('task_checklists')
        .insert({
          ...input,
          owner_id: userData.user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TaskChecklist;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklists', data.entity_id] });
      toast.success('Checklist created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create checklist: ${error.message}`);
    },
  });
}

export function useUpdateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      checklistId,
      entityId,
      updates,
    }: {
      checklistId: string;
      entityId: string;
      updates: UpdateChecklistInput;
    }): Promise<TaskChecklist> => {
      const { data, error } = await supabase
        .from('task_checklists')
        .update(updates)
        .eq('id', checklistId)
        .select()
        .single();

      if (error) throw error;
      return data as TaskChecklist;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklists', variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.checklistId] });
      toast.success('Checklist updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update checklist: ${error.message}`);
    },
  });
}

export function useDeleteChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ checklistId, entityId }: { checklistId: string; entityId: string }) => {
      const { error } = await supabase
        .from('task_checklists')
        .delete()
        .eq('id', checklistId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklists', variables.entityId] });
      toast.success('Checklist deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete checklist: ${error.message}`);
    },
  });
}

// =============================================================================
// Section Mutations
// =============================================================================

export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSectionInput): Promise<TaskChecklistSection> => {
      const { data, error } = await supabase
        .from('task_checklist_sections')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as TaskChecklistSection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', data.checklist_id] });
      toast.success('Section added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create section: ${error.message}`);
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      checklistId,
      updates,
    }: {
      sectionId: string;
      checklistId: string;
      updates: UpdateSectionInput;
    }): Promise<TaskChecklistSection> => {
      const { data, error } = await supabase
        .from('task_checklist_sections')
        .update(updates)
        .eq('id', sectionId)
        .select()
        .single();

      if (error) throw error;
      return data as TaskChecklistSection;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.checklistId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update section: ${error.message}`);
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sectionId, checklistId }: { sectionId: string; checklistId: string }) => {
      const { error } = await supabase
        .from('task_checklist_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.checklistId] });
      toast.success('Section deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete section: ${error.message}`);
    },
  });
}

// =============================================================================
// Item Mutations
// =============================================================================

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateItemInput): Promise<TaskChecklistItem> => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as TaskChecklistItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', data.checklist_id] });
      queryClient.invalidateQueries({ queryKey: ['checklist-items', data.checklist_id] });
      queryClient.invalidateQueries({ queryKey: ['checklist-stats', data.checklist_id] });
      toast.success('Task added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      checklistId,
      updates,
    }: {
      itemId: string;
      checklistId: string;
      updates: UpdateItemInput;
    }): Promise<TaskChecklistItem> => {
      // Auto-set completed_at when marking as done
      const finalUpdates: UpdateItemInput & { completed_at?: string | null; completed_by?: string | null } = { ...updates };
      
      if (updates.status === 'done') {
        const { data: userData } = await supabase.auth.getUser();
        finalUpdates.completed_at = new Date().toISOString();
        finalUpdates.completed_by = userData.user?.id ?? null;
      } else if (updates.status) {
        finalUpdates.completed_at = null;
        finalUpdates.completed_by = null;
      }

      const { data, error } = await supabase
        .from('task_checklist_items')
        .update(finalUpdates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data as TaskChecklistItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.checklistId] });
      queryClient.invalidateQueries({ queryKey: ['checklist-items', variables.checklistId] });
      queryClient.invalidateQueries({ queryKey: ['checklist-stats', variables.checklistId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, checklistId }: { itemId: string; checklistId: string }) => {
      const { error } = await supabase
        .from('task_checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.checklistId] });
      queryClient.invalidateQueries({ queryKey: ['checklist-items', variables.checklistId] });
      queryClient.invalidateQueries({ queryKey: ['checklist-stats', variables.checklistId] });
      toast.success('Task deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });
}

// =============================================================================
// Template Instantiation
// =============================================================================

export function useInstantiateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      entityId,
      name,
      startDate,
      periodId,
      departmentId,
    }: {
      templateId: string;
      entityId: string;
      name: string;
      startDate: string;
      periodId?: string;
      departmentId?: string;
    }): Promise<TaskChecklist> => {
      // 1. Fetch template with sections and items
      const { data: template, error: templateError } = await supabase
        .from('task_checklists')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      const { data: templateSections } = await supabase
        .from('task_checklist_sections')
        .select('*')
        .eq('checklist_id', templateId)
        .order('sort_order');

      const { data: templateItems } = await supabase
        .from('task_checklist_items')
        .select('*')
        .eq('checklist_id', templateId)
        .order('sort_order');

      // 2. Create new checklist
      const { data: userData } = await supabase.auth.getUser();
      const startDateParsed = parseISO(startDate);

      const { data: newChecklist, error: checklistError } = await supabase
        .from('task_checklists')
        .insert({
          entity_id: entityId,
          department_id: departmentId || template.department_id,
          period_id: periodId || null,
          name,
          description: template.description,
          mode: template.mode,
          start_date: startDate,
          duration_days: template.duration_days,
          is_template: false,
          template_id: templateId,
          owner_id: userData.user?.id ?? null,
        })
        .select()
        .single();

      if (checklistError) throw checklistError;

      // 3. Create sections with ID mapping
      const sectionIdMap = new Map<string, string>();
      
      if (templateSections && templateSections.length > 0) {
        for (const section of templateSections) {
          const { data: newSection, error: sectionError } = await supabase
            .from('task_checklist_sections')
            .insert({
              checklist_id: newChecklist.id,
              name: section.name,
              sort_order: section.sort_order,
            })
            .select()
            .single();

          if (sectionError) throw sectionError;
          sectionIdMap.set(section.id, newSection.id);
        }
      }

      // 4. Create items with calculated due dates
      if (templateItems && templateItems.length > 0) {
        const itemsToInsert = templateItems.map((item) => ({
          checklist_id: newChecklist.id,
          section_id: item.section_id ? sectionIdMap.get(item.section_id) : null,
          title: item.title,
          description: item.description,
          assignee_id: null, // Don't copy assignee from template
          due_date: typeof item.relative_day === 'number'
            ? addDays(startDateParsed, item.relative_day).toISOString().split('T')[0]
            : null,
          due_time: item.due_time,
          relative_day: item.relative_day,
          status: 'todo' as TaskItemStatus,
          sort_order: item.sort_order,
        }));

        const { error: itemsError } = await supabase
          .from('task_checklist_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return newChecklist as TaskChecklist;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklists', data.entity_id] });
      toast.success('Checklist created from template');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create checklist: ${error.message}`);
    },
  });
}
