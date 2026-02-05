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

      const { data, error } = await supabase
        .from('reconciliation_review_checks')
        .select('*')
        .eq('reconciliation_id', reconciliationId)
        .maybeSingle();

      if (error) throw error;
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
      const { data, error } = await supabase
        .from('reconciliation_review_checks')
        .upsert({
          reconciliation_id: reconciliationId,
          ...updates,
        } as any)
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
