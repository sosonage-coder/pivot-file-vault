import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DocumentType, Area, Document } from '@/types/filegrid';

interface ExpectedDocument {
  areaId: string;
  areaName: string;
  processName: string;
  departmentName: string;
  documentTypeId: string;
  documentTypeName: string;
  required: boolean;
  uploaded: boolean;
  document?: Document;
}

interface UseExpectedDocumentsOptions {
  entityId: string | null;
  periodId: string | null;
}

export function useExpectedDocuments({ entityId, periodId }: UseExpectedDocumentsOptions) {
  return useQuery({
    queryKey: ['expected-documents', entityId, periodId],
    queryFn: async (): Promise<ExpectedDocument[]> => {
      if (!entityId || !periodId) return [];

      // 1. Get all areas for this entity with their templates
      const { data: areas, error: areasError } = await supabase
        .from('areas')
        .select(`
          id,
          name,
          template_id,
          processes!inner(
            id,
            name,
            entity_id,
            departments!inner(
              id,
              name
            )
          )
        `)
        .eq('processes.entity_id', entityId);

      if (areasError) throw areasError;
      if (!areas?.length) return [];

      // 2. Get all area_document_types for templates used by these areas
      const templateIds = areas
        .map(a => a.template_id)
        .filter((id): id is string => id !== null);

      let areaDocTypes: { area_template_id: string; document_type_id: string; required: boolean; document_types: DocumentType }[] = [];
      
      if (templateIds.length > 0) {
        const { data, error } = await supabase
          .from('area_document_types')
          .select(`
            area_template_id,
            document_type_id,
            required,
            document_types(*)
          `)
          .in('area_template_id', templateIds);

        if (error) throw error;
        areaDocTypes = data || [];
      }

      // 3. Get uploaded documents for this entity and period
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_id', entityId)
        .eq('period_id', periodId);

      if (docsError) throw docsError;

      // 4. Build expected documents list
      const expected: ExpectedDocument[] = [];
      const uploadedMap = new Map<string, Document>();
      
      // Index uploaded documents by area_id + document_type_id
      for (const doc of documents || []) {
        const key = `${doc.area_id}:${doc.document_type_id}`;
        uploadedMap.set(key, doc);
      }

      // For each area, check expected document types
      for (const area of areas) {
        const process = area.processes as any;
        const department = process?.departments;
        
        // Find document types expected for this area's template
        const expectedTypes = areaDocTypes.filter(
          adt => adt.area_template_id === area.template_id
        );

        for (const expectedType of expectedTypes) {
          const key = `${area.id}:${expectedType.document_type_id}`;
          const uploadedDoc = uploadedMap.get(key);

          expected.push({
            areaId: area.id,
            areaName: area.name,
            processName: process?.name || 'Unknown Process',
            departmentName: department?.name || 'Unknown Department',
            documentTypeId: expectedType.document_type_id,
            documentTypeName: expectedType.document_types?.name || 'Unknown Type',
            required: expectedType.required,
            uploaded: !!uploadedDoc,
            document: uploadedDoc
          });
        }
      }

      // Sort by department, process, area, document type
      return expected.sort((a, b) => {
        const deptCompare = a.departmentName.localeCompare(b.departmentName);
        if (deptCompare !== 0) return deptCompare;
        const procCompare = a.processName.localeCompare(b.processName);
        if (procCompare !== 0) return procCompare;
        const areaCompare = a.areaName.localeCompare(b.areaName);
        if (areaCompare !== 0) return areaCompare;
        return a.documentTypeName.localeCompare(b.documentTypeName);
      });
    },
    enabled: !!(entityId && periodId)
  });
}

// Helper to export as CSV
export function exportExpectedDocumentsCSV(
  documents: ExpectedDocument[],
  periodLabel: string
): void {
  const headers = ['Department', 'Process', 'Area', 'Document Type', 'Required', 'Status', 'Period'];
  const rows = documents.map(doc => [
    doc.departmentName,
    doc.processName,
    doc.areaName,
    doc.documentTypeName,
    doc.required ? 'Yes' : 'No',
    doc.uploaded ? 'Uploaded' : 'Missing',
    periodLabel
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `whats-missing-${periodLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
