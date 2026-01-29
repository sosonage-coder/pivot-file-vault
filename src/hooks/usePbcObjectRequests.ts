import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PbcStatus } from '@/types/filegrid';

export interface PbcObjectRequest {
  id: string;
  label: string;
  status: PbcStatus | null;
  assignee_id: string | null;
  due_date: string | null;
  notes: string | null;
  sort_order: number | null;
}

interface UsePbcObjectRequestsOptions {
  entityId: string | null;
  objectId: string | null;
  periodId: string | null;
}

export function usePbcObjectRequests({ entityId, objectId, periodId }: UsePbcObjectRequestsOptions) {
  return useQuery({
    queryKey: ['pbc-object-requests', entityId, objectId, periodId],
    queryFn: async (): Promise<PbcObjectRequest[]> => {
      if (!entityId || !objectId) return [];

      let query = supabase
        .from('pbc_nodes')
        .select('id, label, status, assignee_id, due_date, notes, sort_order')
        .eq('entity_id', entityId)
        .eq('object_id', objectId)
        .eq('node_type', 'request')
        .order('sort_order', { ascending: true });

      if (periodId) {
        query = query.eq('period_id', periodId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []) as PbcObjectRequest[];
    },
    enabled: !!entityId && !!objectId
  });
}

interface CreatePbcRequestInput {
  entityId: string;
  objectId: string;
  periodId: string;
  label: string;
  notes?: string;
  dueDate?: string;
  assigneeId?: string;
}

export function useCreatePbcRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePbcRequestInput) => {
      // Get the object's metadata (area_id, department_id) 
      const { data: obj, error: objError } = await supabase
        .from('objects')
        .select('area_id, department_id')
        .eq('id', input.objectId)
        .single();
      
      if (objError) throw objError;

      const { data, error } = await supabase
        .from('pbc_nodes')
        .insert({
          entity_id: input.entityId,
          period_id: input.periodId,
          object_id: input.objectId,
          area_id: obj.area_id,
          department_id: obj.department_id,
          label: input.label,
          notes: input.notes || null,
          due_date: input.dueDate || null,
          assignee_id: input.assigneeId || null,
          node_type: 'request',
          status: 'Requested'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['pbc-object-requests', variables.entityId, variables.objectId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['unified-folder-structure', variables.entityId] 
      });
    }
  });
}

interface FulfillPbcRequestInput {
  requestId: string;
  entityId: string;
  objectId: string;
  fileUrl: string;
}

export function useFulfillPbcRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, fileUrl }: FulfillPbcRequestInput) => {
      // Update status to Complete and store the file URL in notes for now
      const { data, error } = await supabase
        .from('pbc_nodes')
        .update({ 
          status: 'Complete',
          notes: `Fulfilled: ${fileUrl}`
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['pbc-object-requests', variables.entityId, variables.objectId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['unified-folder-structure', variables.entityId] 
      });
    }
  });
}
