import { useMemo } from 'react';
import type { DocumentWithRelations, PivotViewType } from '@/types/filegrid';

export interface GroupedDocuments {
  key: string;
  label: string;
  documents: DocumentWithRelations[];
  subgroups?: GroupedDocuments[];
}

export function usePivotDocuments(
  documents: DocumentWithRelations[],
  viewType: PivotViewType
): GroupedDocuments[] {
  return useMemo(() => {
    if (!documents.length) return [];

    switch (viewType) {
      case 'period-area-object':
        return groupByPeriodAreaObject(documents);
      case 'object-period':
        return groupByObjectPeriod(documents);
      case 'area-period':
        return groupByAreaPeriod(documents);
      case 'document-type':
        return groupByDocumentType(documents);
      case 'status-final':
        return groupByStatusFinal(documents);
      default:
        return [];
    }
  }, [documents, viewType]);
}

function groupByPeriodAreaObject(documents: DocumentWithRelations[]): GroupedDocuments[] {
  const periodMap = new Map<string, { label: string; docs: DocumentWithRelations[] }>();

  for (const doc of documents) {
    const periodId = doc.period_id;
    const periodLabel = doc.periods?.label || 'Unknown Period';

    if (!periodMap.has(periodId)) {
      periodMap.set(periodId, { label: periodLabel, docs: [] });
    }
    periodMap.get(periodId)!.docs.push(doc);
  }

  return Array.from(periodMap.entries())
    .sort((a, b) => b[1].label.localeCompare(a[1].label)) // Most recent first
    .map(([periodId, { label, docs }]) => {
      // Subgroup by Area
      const areaMap = new Map<string, { label: string; docs: DocumentWithRelations[] }>();
      
      for (const doc of docs) {
        const areaId = doc.area_id;
        const areaLabel = doc.areas?.name || 'Unknown Area';

        if (!areaMap.has(areaId)) {
          areaMap.set(areaId, { label: areaLabel, docs: [] });
        }
        areaMap.get(areaId)!.docs.push(doc);
      }

      return {
        key: periodId,
        label,
        documents: docs,
        subgroups: Array.from(areaMap.entries())
          .sort((a, b) => a[1].label.localeCompare(b[1].label))
          .map(([areaId, { label: areaLabel, docs: areaDocs }]) => ({
            key: areaId,
            label: areaLabel,
            documents: areaDocs
          }))
      };
    });
}

function groupByObjectPeriod(documents: DocumentWithRelations[]): GroupedDocuments[] {
  const objectMap = new Map<string, { label: string; docs: DocumentWithRelations[] }>();

  for (const doc of documents) {
    const objectId = doc.object_id || 'no-object';
    const objectLabel = doc.objects?.name || 'No Object';

    if (!objectMap.has(objectId)) {
      objectMap.set(objectId, { label: objectLabel, docs: [] });
    }
    objectMap.get(objectId)!.docs.push(doc);
  }

  return Array.from(objectMap.entries())
    .sort((a, b) => a[1].label.localeCompare(b[1].label))
    .map(([objectId, { label, docs }]) => {
      // Subgroup by Period
      const periodMap = new Map<string, { label: string; docs: DocumentWithRelations[] }>();
      
      for (const doc of docs) {
        const periodId = doc.period_id;
        const periodLabel = doc.periods?.label || 'Unknown Period';

        if (!periodMap.has(periodId)) {
          periodMap.set(periodId, { label: periodLabel, docs: [] });
        }
        periodMap.get(periodId)!.docs.push(doc);
      }

      return {
        key: objectId,
        label,
        documents: docs,
        subgroups: Array.from(periodMap.entries())
          .sort((a, b) => b[1].label.localeCompare(a[1].label))
          .map(([periodId, { label: periodLabel, docs: periodDocs }]) => ({
            key: periodId,
            label: periodLabel,
            documents: periodDocs
          }))
      };
    });
}

function groupByAreaPeriod(documents: DocumentWithRelations[]): GroupedDocuments[] {
  const areaMap = new Map<string, { label: string; deptName: string; docs: DocumentWithRelations[] }>();

  for (const doc of documents) {
    const areaId = doc.area_id;
    const areaLabel = doc.areas?.name || 'Unknown Area';
    const deptName = doc.areas?.processes?.departments?.name || '';

    if (!areaMap.has(areaId)) {
      areaMap.set(areaId, { label: areaLabel, deptName, docs: [] });
    }
    areaMap.get(areaId)!.docs.push(doc);
  }

  return Array.from(areaMap.entries())
    .sort((a, b) => {
      const deptCompare = a[1].deptName.localeCompare(b[1].deptName);
      if (deptCompare !== 0) return deptCompare;
      return a[1].label.localeCompare(b[1].label);
    })
    .map(([areaId, { label, deptName, docs }]) => {
      // Subgroup by Period
      const periodMap = new Map<string, { label: string; docs: DocumentWithRelations[] }>();
      
      for (const doc of docs) {
        const periodId = doc.period_id;
        const periodLabel = doc.periods?.label || 'Unknown Period';

        if (!periodMap.has(periodId)) {
          periodMap.set(periodId, { label: periodLabel, docs: [] });
        }
        periodMap.get(periodId)!.docs.push(doc);
      }

      return {
        key: areaId,
        label: deptName ? `${deptName} / ${label}` : label,
        documents: docs,
        subgroups: Array.from(periodMap.entries())
          .sort((a, b) => b[1].label.localeCompare(a[1].label))
          .map(([periodId, { label: periodLabel, docs: periodDocs }]) => ({
            key: periodId,
            label: periodLabel,
            documents: periodDocs
          }))
      };
    });
}

function groupByDocumentType(documents: DocumentWithRelations[]): GroupedDocuments[] {
  const typeMap = new Map<string, { label: string; docs: DocumentWithRelations[] }>();

  for (const doc of documents) {
    const typeId = doc.document_type_id;
    const typeLabel = doc.document_types?.name || 'Unknown Type';

    if (!typeMap.has(typeId)) {
      typeMap.set(typeId, { label: typeLabel, docs: [] });
    }
    typeMap.get(typeId)!.docs.push(doc);
  }

  return Array.from(typeMap.entries())
    .sort((a, b) => a[1].label.localeCompare(b[1].label))
    .map(([typeId, { label, docs }]) => ({
      key: typeId,
      label,
      documents: docs.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    }));
}

function groupByStatusFinal(documents: DocumentWithRelations[]): GroupedDocuments[] {
  const finalDocs = documents.filter(doc => doc.status === 'Final');
  
  if (!finalDocs.length) return [];

  return [{
    key: 'final',
    label: 'Final Documents',
    documents: finalDocs.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  }];
}
