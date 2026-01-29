import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ReconciliationLineItem, 
  CreateLineItemInput, 
  UpdateLineItemInput,
  ReconciliationLineType 
} from '@/types/reconciliations';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Fetch line items for a reconciliation
export function useReconciliationLineItems(reconciliationId: string | null) {
  return useQuery({
    queryKey: ['reconciliation-line-items', reconciliationId],
    queryFn: async (): Promise<ReconciliationLineItem[]> => {
      if (!reconciliationId) return [];
      
      const { data, error } = await supabase
        .from('reconciliation_line_items')
        .select('*')
        .eq('reconciliation_id', reconciliationId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data || []) as ReconciliationLineItem[];
    },
    enabled: !!reconciliationId,
  });
}

// Create line item mutation
export function useCreateLineItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateLineItemInput) => {
      const insertData: {
        reconciliation_id: string;
        line_type: string;
        description: string | null;
        amount: number;
        quantity: number | null;
        rate: number | null;
        start_date: string | null;
        end_date: string | null;
        period_month: string | null;
        metadata: Json;
        sort_order: number;
      } = {
        reconciliation_id: input.reconciliation_id,
        line_type: input.line_type,
        description: input.description || null,
        amount: input.amount ?? 0,
        quantity: input.quantity ?? null,
        rate: input.rate ?? null,
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        period_month: input.period_month || null,
        metadata: (input.metadata || {}) as Json,
        sort_order: input.sort_order ?? 0,
      };

      const { data, error } = await supabase
        .from('reconciliation_line_items')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return data as ReconciliationLineItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['reconciliation-line-items', variables.reconciliation_id] 
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add line item: ${error.message}`);
    },
  });
}

// Update line item mutation
export function useUpdateLineItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      reconciliationId, 
      updates 
    }: { 
      id: string; 
      reconciliationId: string; 
      updates: UpdateLineItemInput 
    }) => {
      // Convert to database-compatible format
      const updateData: Record<string, unknown> = {};
      if (updates.line_type !== undefined) updateData.line_type = updates.line_type;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.rate !== undefined) updateData.rate = updates.rate;
      if (updates.start_date !== undefined) updateData.start_date = updates.start_date;
      if (updates.end_date !== undefined) updateData.end_date = updates.end_date;
      if (updates.period_month !== undefined) updateData.period_month = updates.period_month;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata as Json;
      if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order;

      const { data, error } = await supabase
        .from('reconciliation_line_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { item: data as ReconciliationLineItem, reconciliationId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ 
        queryKey: ['reconciliation-line-items', result.reconciliationId] 
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update line item: ${error.message}`);
    },
  });
}

// Delete line item mutation
export function useDeleteLineItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reconciliationId }: { id: string; reconciliationId: string }) => {
      const { error } = await supabase
        .from('reconciliation_line_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, reconciliationId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ 
        queryKey: ['reconciliation-line-items', result.reconciliationId] 
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete line item: ${error.message}`);
    },
  });
}

// Bulk update line items (for reordering)
export function useBulkUpdateLineItems() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      items, 
      reconciliationId 
    }: { 
      items: Array<{ id: string; sort_order: number }>; 
      reconciliationId: string;
    }) => {
      // Update each item's sort order
      const updates = items.map(item => 
        supabase
          .from('reconciliation_line_items')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id)
      );
      
      await Promise.all(updates);
      return reconciliationId;
    },
    onSuccess: (reconciliationId) => {
      queryClient.invalidateQueries({ 
        queryKey: ['reconciliation-line-items', reconciliationId] 
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to reorder items: ${error.message}`);
    },
  });
}
