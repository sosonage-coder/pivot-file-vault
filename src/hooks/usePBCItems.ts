import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PbcStatus } from '@/types/filegrid';

export interface PbcItemWithRelations {
  id: string;
  entity_id: string;
  period_id: string;
  process_id: string;
  area_id: string;
  object_id: string | null;
  document_type_id: string;
  status: PbcStatus;
  assignee_id: string | null;
  due_date: string | null;
  notes: string | null;
  priority: string | null;
  created_at: string;
  updated_at: string;
  areas: { 
    name: string; 
    processes: { 
      name: string; 
      departments: { name: string } 
    } 
  };
  periods: { label: string };
  document_types: { name: string };
  objects: { name: string } | null;
}

interface UsePBCItemsOptions {
  entityId: string | null;
  periodId?: string | null;
  status?: PbcStatus | null;
}

export function usePBCItems({ entityId, periodId, status }: UsePBCItemsOptions) {
  return useQuery({
    queryKey: ['pbc-items', entityId, periodId, status],
    queryFn: async () => {
      if (!entityId) return [];

      let query = supabase
        .from('pbc_items')
        .select(`
          *,
          areas(
            name,
            processes(
              name,
              departments(name)
            )
          ),
          periods(label),
          document_types(name),
          objects(name)
        `)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (periodId) {
        query = query.eq('period_id', periodId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter out items with missing required relations and type safely
      return (data || []).filter((item): item is PbcItemWithRelations => 
        item.areas !== null && 
        item.periods !== null && 
        item.document_types !== null
      );
    },
    enabled: !!entityId
  });
}

// Get stats by status for dashboard
export function usePBCStats(entityId: string | null, periodId?: string | null) {
  return useQuery({
    queryKey: ['pbc-stats', entityId, periodId],
    queryFn: async () => {
      if (!entityId) return { Requested: 0, Uploaded: 0, Reviewed: 0, Complete: 0, total: 0, overdue: 0 };

      let query = supabase
        .from('pbc_items')
        .select('status, due_date')
        .eq('entity_id', entityId);

      if (periodId) {
        query = query.eq('period_id', periodId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const stats = {
        Requested: 0,
        Uploaded: 0,
        Reviewed: 0,
        Complete: 0,
        total: data?.length || 0,
        overdue: 0
      };

      data?.forEach(item => {
        stats[item.status as PbcStatus]++;
        if (item.due_date && item.due_date < today && item.status !== 'Complete') {
          stats.overdue++;
        }
      });

      return stats;
    },
    enabled: !!entityId
  });
}

interface CreatePBCItemInput {
  entityId: string;
  periodId: string;
  processId: string;
  areaId: string;
  documentTypeId: string;
  objectId?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  priority?: string;
}

export function useCreatePBCItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePBCItemInput) => {
      const { data, error } = await supabase
        .from('pbc_items')
        .insert({
          entity_id: input.entityId,
          period_id: input.periodId,
          process_id: input.processId,
          area_id: input.areaId,
          document_type_id: input.documentTypeId,
          object_id: input.objectId || null,
          assignee_id: input.assigneeId || null,
          due_date: input.dueDate || null,
          notes: input.notes || null,
          priority: input.priority || 'normal',
          status: 'Requested'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pbc-items', variables.entityId] });
      queryClient.invalidateQueries({ queryKey: ['pbc-stats', variables.entityId] });
    }
  });
}

interface UpdatePBCItemInput {
  id: string;
  entityId: string;
  status?: PbcStatus;
  dueDate?: string | null;
  notes?: string | null;
  priority?: string;
  assigneeId?: string | null;
}

export function useUpdatePBCItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, entityId, ...updates }: UpdatePBCItemInput) => {
      const updatePayload: Record<string, unknown> = {};
      if (updates.status !== undefined) updatePayload.status = updates.status;
      if (updates.dueDate !== undefined) updatePayload.due_date = updates.dueDate;
      if (updates.notes !== undefined) updatePayload.notes = updates.notes;
      if (updates.priority !== undefined) updatePayload.priority = updates.priority;
      if (updates.assigneeId !== undefined) updatePayload.assignee_id = updates.assigneeId;

      const { data, error } = await supabase
        .from('pbc_items')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, entityId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pbc-items', result.entityId] });
      queryClient.invalidateQueries({ queryKey: ['pbc-stats', result.entityId] });
    }
  });
}

// Keep backward compatibility alias
export function useUpdatePBCStatus() {
  const updateItem = useUpdatePBCItem();
  
  return {
    ...updateItem,
    mutateAsync: async ({ id, status, entityId }: { id: string; status: PbcStatus; entityId: string }) => {
      return updateItem.mutateAsync({ id, entityId, status });
    }
  };
}

export function useDeletePBCItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, entityId }: { id: string; entityId: string }) => {
      const { error } = await supabase
        .from('pbc_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { entityId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pbc-items', result.entityId] });
      queryClient.invalidateQueries({ queryKey: ['pbc-stats', result.entityId] });
    }
  });
}

// Auto-complete: Check if a matching PBC item exists and update status
export async function checkAndUpdatePBCItem(
  entityId: string,
  areaId: string,
  documentTypeId: string,
  periodId: string,
  objectId: string | null
): Promise<void> {
  // Find matching PBC item
  let query = supabase
    .from('pbc_items')
    .select('id, status')
    .eq('entity_id', entityId)
    .eq('area_id', areaId)
    .eq('document_type_id', documentTypeId)
    .eq('period_id', periodId)
    .eq('status', 'Requested');

  if (objectId) {
    query = query.eq('object_id', objectId);
  }

  const { data } = await query.maybeSingle();

  if (data) {
    // Update status to Uploaded
    await supabase
      .from('pbc_items')
      .update({ status: 'Uploaded' })
      .eq('id', data.id);
  }
}
