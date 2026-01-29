import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DocumentType } from '@/types/filegrid';

// Fetch all document types
export function useDocumentTypes() {
  return useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as DocumentType[];
    }
  });
}

// Fetch document types allowed for a specific area (via area template)
export function useAreaDocumentTypes(areaTemplateId: string | null) {
  return useQuery({
    queryKey: ['area-document-types', areaTemplateId],
    queryFn: async () => {
      if (!areaTemplateId) {
        // If no template, return all document types
        const { data, error } = await supabase
          .from('document_types')
          .select('*')
          .order('name');

        if (error) throw error;
        return data as DocumentType[];
      }

      // Get document types linked to this area template
      const { data, error } = await supabase
        .from('area_document_types')
        .select(`
          document_type_id,
          required,
          document_types(*)
        `)
        .eq('area_template_id', areaTemplateId);

      if (error) throw error;

      // Extract document types from the join
      return data.map(item => ({
        ...item.document_types,
        required: item.required
      })) as (DocumentType & { required?: boolean })[];
    },
    enabled: true // Always enabled - returns all types if no template
  });
}
