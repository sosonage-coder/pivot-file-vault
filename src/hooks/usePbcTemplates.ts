import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PbcTemplate } from '@/types/pbc-tree';

/** Fetch all available PBC templates */
export function usePbcTemplates() {
  return useQuery({
    queryKey: ['pbc-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pbc_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as PbcTemplate[];
    },
  });
}

/** Get a single template by ID */
export function usePbcTemplate(templateId: string | null) {
  return useQuery({
    queryKey: ['pbc-template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      
      const { data, error } = await supabase
        .from('pbc_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return data as PbcTemplate;
    },
    enabled: !!templateId,
  });
}

/** Validate tree depth against template constraints */
export function validateDepth(
  template: PbcTemplate | null,
  currentDepth: number
): { valid: boolean; message?: string } {
  if (!template) return { valid: true };

  if (currentDepth < template.min_depth - 1) {
    return {
      valid: false,
      message: `Tree requires at least ${template.min_depth} levels for ${template.name}`,
    };
  }

  if (currentDepth >= template.max_depth) {
    return {
      valid: false,
      message: `Maximum depth of ${template.max_depth} levels reached for ${template.name}`,
    };
  }

  return { valid: true };
}
