import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DocumentStatus } from '@/types/filegrid';

interface ClonePeriodInput {
  entityId: string;
  sourcePeriodId: string;
  targetPeriodId: string;
}

interface ClonePeriodResult {
  clonedCount: number;
}

export function useClonePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityId, sourcePeriodId, targetPeriodId }: ClonePeriodInput): Promise<ClonePeriodResult> => {
      // 1. Fetch all documents from the source period for this entity
      const { data: sourceDocuments, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_id', entityId)
        .eq('period_id', sourcePeriodId);

      if (fetchError) throw fetchError;
      if (!sourceDocuments || sourceDocuments.length === 0) {
        return { clonedCount: 0 };
      }

      // 2. Prepare cloned documents with new period and reset status
      const clonedDocuments = sourceDocuments.map((doc) => ({
        logical_name: doc.logical_name,
        entity_id: doc.entity_id,
        department_id: doc.department_id,
        process_id: doc.process_id,
        area_id: doc.area_id,
        object_id: doc.object_id,
        period_id: targetPeriodId, // New period
        document_type_id: doc.document_type_id,
        status: 'Draft' as DocumentStatus, // Reset to Draft
        external_file_url: doc.external_file_url,
        notes: doc.notes,
        // version will be auto-set by trigger
      }));

      // 3. Insert all cloned documents
      const { error: insertError } = await supabase
        .from('documents')
        .insert(clonedDocuments);

      if (insertError) throw insertError;

      return { clonedCount: clonedDocuments.length };
    },
    onSuccess: (_, variables) => {
      // Invalidate documents queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['documents', variables.entityId] });
    },
  });
}
