import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReconciliationReviewChecklist {
  reconciliation_id: string;
  support_attached: boolean;
  tie_out_complete: boolean;
  variance_explained: boolean;
  sign_off_complete: boolean;
  updated_at: string;
}

export function useReconciliationReviewChecklist(reconciliationId: string | null) {
  return useQuery({
    queryKey: ['reconciliation-review-checklist', reconciliationId],
    queryFn: async () => {
      if (!reconciliationId) return null;

      // Note: This table may not exist yet - the hook provides a placeholder implementation
      const { data, error } = await (supabase as any)
        .from('reconciliation_review_checks')
        .select('*')
        .eq('reconciliation_id', reconciliationId)
        .maybeSingle();

      if (error) {
        // Table doesn't exist yet, return null
        console.warn('reconciliation_review_checks table not found:', error.message);
        return null;
      }
      return data as ReconciliationReviewChecklist | null;
    },
    enabled: !!reconciliationId,
  });
}

interface UpsertChecklistInput {
  reconciliationId: string;
  updates: Partial<Omit<ReconciliationReviewChecklist, 'reconciliation_id' | 'updated_at'>>;
}

export function useUpsertReconciliationReviewChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reconciliationId, updates }: UpsertChecklistInput) => {
      // Note: This table may not exist yet - the hook provides a placeholder implementation
      const { data, error } = await (supabase as any)
        .from('reconciliation_review_checks')
        .upsert({
          reconciliation_id: reconciliationId,
          ...updates,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as ReconciliationReviewChecklist;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-review-checklist', vars.reconciliationId] });
    },
  });
}
