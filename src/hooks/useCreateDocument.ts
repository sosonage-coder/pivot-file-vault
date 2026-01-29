import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DocumentStatus } from '@/types/filegrid';

interface CreateDocumentInput {
  logicalName: string;
  entityId: string;
  departmentId: string;
  processId: string;
  areaId: string;
  objectId: string | null;
  periodId: string;
  documentTypeId: string;
  status: DocumentStatus;
  externalFileUrl: string;
  notes: string | null;
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDocumentInput) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('documents')
        .insert({
          logical_name: input.logicalName,
          entity_id: input.entityId,
          department_id: input.departmentId,
          process_id: input.processId,
          area_id: input.areaId,
          object_id: input.objectId,
          period_id: input.periodId,
          document_type_id: input.documentTypeId,
          status: input.status,
          external_file_url: input.externalFileUrl,
          notes: input.notes,
          created_by: user?.user?.id || null
        })
        .select(`
          *,
          objects(*),
          periods(*),
          document_types(*),
          areas!inner(
            *,
            processes!inner(
              *,
              departments!inner(*)
            )
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all document queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents-by-period'] });
    }
  });
}
