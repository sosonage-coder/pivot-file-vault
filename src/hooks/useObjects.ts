import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FileObject } from '@/types/filegrid';

interface UseObjectsOptions {
  areaId: string | null;
  entityId: string | null;
}

export function useObjects({ areaId, entityId }: UseObjectsOptions) {
  return useQuery({
    queryKey: ['objects', { areaId, entityId }],
    queryFn: async () => {
      if (!areaId || !entityId) return [];

      const { data, error } = await supabase
        .from('objects')
        .select('*')
        .eq('area_id', areaId)
        .eq('entity_id', entityId)
        .order('name');

      if (error) throw error;
      return data as FileObject[];
    },
    enabled: !!(areaId && entityId)
  });
}

interface CreateObjectInput {
  name: string;
  entityId: string;
  departmentId: string;
  processId: string;
  areaId: string;
}

export function useCreateObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateObjectInput) => {
      const { data, error } = await supabase
        .from('objects')
        .insert({
          name: input.name,
          entity_id: input.entityId,
          department_id: input.departmentId,
          process_id: input.processId,
          area_id: input.areaId
        })
        .select()
        .single();

      if (error) throw error;
      return data as FileObject;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['objects', { areaId: data.area_id, entityId: data.entity_id }] 
      });
    }
  });
}
