import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AuditDocumentStatus } from '@/types/filegrid';

interface UpdateDocumentAuditInput {
  documentId: string;
  pbcReady?: boolean;
  auditStatus?: AuditDocumentStatus | null;
}

export function useUpdateDocumentAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateDocumentAuditInput) => {
      const payload: Record<string, unknown> = {};
      if (input.pbcReady !== undefined) payload.pbc_ready = input.pbcReady;
      if (input.auditStatus !== undefined) payload.audit_status = input.auditStatus;

      const { data, error } = await supabase
        .from('documents')
        .update(payload as any)
        .eq('id', input.documentId)
        .select('id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents-by-period'] });
    },
  });
}
