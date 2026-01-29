import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Entity } from '@/types/filegrid';

export function useEntities() {
  return useQuery({
    queryKey: ['entities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as Entity[];
    }
  });
}

export function useEntity(id: string | null) {
  return useQuery({
    queryKey: ['entity', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Entity | null;
    },
    enabled: !!id
  });
}
