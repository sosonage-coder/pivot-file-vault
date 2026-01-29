import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DocumentWithRelations } from '@/types/filegrid';

interface UseDocumentsOptions {
  areaId?: string | null;
  entityId?: string | null;
  statusFilter?: 'Final' | null;
}

export function useDocuments({ areaId, entityId, statusFilter }: UseDocumentsOptions) {
  return useQuery({
    queryKey: ['documents', { areaId, entityId, statusFilter }],
    queryFn: async () => {
      let query = supabase
        .from('documents')
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
        .order('updated_at', { ascending: false });

      if (areaId) {
        query = query.eq('area_id', areaId);
      }

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as DocumentWithRelations[];
    },
    enabled: !!(areaId || entityId)
  });
}

export function useDocumentsByPeriod(entityId: string | null, periodId: string | null) {
  return useQuery({
    queryKey: ['documents-by-period', entityId, periodId],
    queryFn: async () => {
      if (!entityId || !periodId) return [];

      const { data, error } = await supabase
        .from('documents')
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
        .eq('entity_id', entityId)
        .eq('period_id', periodId)
        .order('area_id')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as DocumentWithRelations[];
    },
    enabled: !!(entityId && periodId)
  });
}
