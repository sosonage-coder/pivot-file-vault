import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ChecklistTemplate,
  ChecklistInstance,
  ChecklistItemCompletion,
  ChecklistInstanceWithCompletions,
  CreateChecklistInstanceInput,
  ChecklistItem
} from '@/types/checklists';
import { toast } from 'sonner';

// Fetch all checklist templates
export function useChecklistTemplates() {
  return useQuery({
    queryKey: ['checklist-templates'],
    queryFn: async (): Promise<ChecklistTemplate[]> => {
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      return (data || []).map(t => ({
        ...t,
        items: (t.items as unknown as ChecklistItem[]) || [],
        applies_to: t.applies_to || ['reconciliation'],
      }));
    },
  });
}

// Fetch checklist instances for a reconciliation
export function useReconciliationChecklists(reconciliationId: string | null) {
  return useQuery({
    queryKey: ['checklist-instances', 'reconciliation', reconciliationId],
    queryFn: async (): Promise<ChecklistInstanceWithCompletions[]> => {
      if (!reconciliationId) return [];
      
      // Fetch instances
      const { data: instances, error: instancesError } = await supabase
        .from('checklist_instances')
        .select('*')
        .eq('reconciliation_id', reconciliationId)
        .order('created_at', { ascending: false });
      
      if (instancesError) throw instancesError;
      if (!instances || instances.length === 0) return [];
      
      // Fetch completions for all instances
      const instanceIds = instances.map(i => i.id);
      const { data: completions, error: completionsError } = await supabase
        .from('checklist_item_completions')
        .select('*')
        .in('instance_id', instanceIds);
      
      if (completionsError) throw completionsError;
      
      // Map completions to instances
      const completionsMap = new Map<string, ChecklistItemCompletion[]>();
      (completions || []).forEach(c => {
        const list = completionsMap.get(c.instance_id) || [];
        list.push(c as ChecklistItemCompletion);
        completionsMap.set(c.instance_id, list);
      });
      
      return instances.map(instance => ({
        ...instance,
        items: (instance.items as unknown as ChecklistItem[]) || [],
        completions: completionsMap.get(instance.id) || [],
      }));
    },
    enabled: !!reconciliationId,
  });
}

// Create checklist instance
export function useCreateChecklistInstance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateChecklistInstanceInput) => {
      const { data, error } = await supabase
        .from('checklist_instances')
        .insert([{
          template_id: input.template_id || null,
          reconciliation_id: input.reconciliation_id || null,
          entity_id: input.entity_id,
          period_id: input.period_id || null,
          name: input.name,
          items: JSON.parse(JSON.stringify(input.items)),
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['checklist-instances', 'reconciliation', variables.reconciliation_id] 
      });
      toast.success('Checklist added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create checklist: ${error.message}`);
    },
  });
}

// Delete checklist instance
export function useDeleteChecklistInstance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reconciliationId }: { id: string; reconciliationId: string }) => {
      const { error } = await supabase
        .from('checklist_instances')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, reconciliationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['checklist-instances', 'reconciliation', data.reconciliationId] 
      });
      toast.success('Checklist removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete checklist: ${error.message}`);
    },
  });
}

// Toggle item completion
export function useToggleChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      instanceId, 
      reconciliationId,
      itemIndex, 
      completed,
      notes 
    }: { 
      instanceId: string;
      reconciliationId: string;
      itemIndex: number; 
      completed: boolean;
      notes?: string;
    }) => {
      // Upsert the completion record
      const { data, error } = await supabase
        .from('checklist_item_completions')
        .upsert({
          instance_id: instanceId,
          item_index: itemIndex,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          notes: notes || null,
        }, {
          onConflict: 'instance_id,item_index',
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, reconciliationId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ 
        queryKey: ['checklist-instances', 'reconciliation', result.reconciliationId] 
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
}
