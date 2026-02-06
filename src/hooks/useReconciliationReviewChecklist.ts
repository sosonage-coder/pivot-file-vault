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

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const anyErr = error as { code?: string; message?: string };
  return anyErr.code === '42P01' || /does not exist/i.test(anyErr.message ?? '');
}

export function useReconciliationReviewChecklist(reconciliationId: string | null) {
  return useQuery({
    queryKey: ['reconciliation-review-checklist', reconciliationId],
    queryFn: async () => {
      if (!reconciliationId) return null;

      const { data, error } = await (supabase as any)
        .from('reconciliation_review_checks')
        .select('*')
        .eq('reconciliation_id', reconciliationId)
        .maybeSingle();

      if (error) {
        if (isMissingTableError(error)) {
          // Table doesn't exist yet, return null (placeholder behavior)
          console.warn('reconciliation_review_checks table not found:', error.message);
          return null;
        }
        throw error;
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
      const { data, error } = await (supabase as any)
        .from('reconciliation_review_checks')
        .upsert({
          reconciliation_id: reconciliationId,
          ...updates,
        })
        .select('*')
        .single();

      if (error) {
        if (isMissingTableError(error)) {
          console.warn('reconciliation_review_checks table not found:', error.message);
          throw new Error('Reviewer checklist backend is not enabled yet.');
        }
        throw error;
      }

      return data as ReconciliationReviewChecklist;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['reconciliation-review-checklist', vars.reconciliationId],
      });
    },
  });
}
