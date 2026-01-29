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
}

export function usePBCItems({ entityId, periodId }: UsePBCItemsOptions) {
  return useQuery({
    queryKey: ['pbc-items', entityId, periodId],
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

interface CreatePBCItemInput {
  entityId: string;
  periodId: string;
  processId: string;
  areaId: string;
  documentTypeId: string;
  objectId?: string | null;
  assigneeId?: string | null;
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
          status: 'Requested'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pbc-items', variables.entityId] });
    }
  });
}

export function useUpdatePBCStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, entityId }: { id: string; status: PbcStatus; entityId: string }) => {
      const { data, error } = await supabase
        .from('pbc_items')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, entityId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pbc-items', result.entityId] });
    }
  });
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
