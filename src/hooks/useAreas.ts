import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Area } from '@/types/filegrid';

export function useAreasForEntity(entityId: string | null) {
  return useQuery({
    queryKey: ['areas', 'entity', entityId],
    queryFn: async () => {
      if (!entityId) return [];

      const { data, error } = await supabase
        .from('areas')
        .select('id, name, process_id, template_id, owner_name, reviewer_name, approver_name, created_at, updated_at, processes!inner(entity_id)')
        .eq('processes.entity_id', entityId)
        .order('name');

      if (error) throw error;
      return (data || []) as Area[];
    },
    enabled: !!entityId,
  });
}
