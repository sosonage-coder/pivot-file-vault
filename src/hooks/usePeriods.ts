import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Period } from '@/types/filegrid';

export function usePeriods() {
  return useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('periods')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as Period[];
    }
  });
}

export function useCurrentPeriod() {
  return useQuery({
    queryKey: ['current-period'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('periods')
        .select('*')
        .eq('type', 'month')
        .lte('start_date', today)
        .gte('end_date', today)
        .maybeSingle();
      
      if (error) throw error;
      return data as Period | null;
    }
  });
}
