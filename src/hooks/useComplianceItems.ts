import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ComplianceItem, ComplianceItemInsert, ComplianceItemUpdate } from '@/types/compliance';

export function useComplianceItems(entityId: string | null, periodId?: string | null) {
  return useQuery({
    queryKey: ['compliance-items', entityId, periodId],
    queryFn: async (): Promise<ComplianceItem[]> => {
      if (!entityId) return [];

      let query = supabase
        .from('compliance_items')
        .select('*')
        .eq('entity_id', entityId)
        .order('due_date', { ascending: true });

      if (periodId) {
        query = query.eq('period_id', periodId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ComplianceItem[];
    },
    enabled: !!entityId,
  });
}

export function useCreateComplianceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: ComplianceItemInsert) => {
      const { data, error } = await supabase
        .from('compliance_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data as ComplianceItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['compliance-items', data.entity_id] });
    },
  });
}

export function useUpdateComplianceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ComplianceItemUpdate }) => {
      const { data, error } = await supabase
        .from('compliance_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ComplianceItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['compliance-items', data.entity_id] });
    },
  });
}

export function useDeleteComplianceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, entityId }: { id: string; entityId: string }) => {
      const { error } = await supabase
        .from('compliance_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, entityId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['compliance-items', data.entityId] });
    },
  });
}
