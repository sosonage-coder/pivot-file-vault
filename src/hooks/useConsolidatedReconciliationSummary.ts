import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Entity } from '@/types/filegrid';
import type { ReconciliationStatus } from '@/types/reconciliations';

const COMPLETED_STATUSES: ReconciliationStatus[] = ['approved', 'certified'];

export interface ConsolidatedEntitySummary {
  entityId: string;
  entityName: string;
  total: number;
  completed: number;
  completionRate: number;
  pendingReview: number;
  rejected: number;
  varianceTotal: number;
}

export interface ConsolidatedReconciliationSummary {
  totalReconciliations: number;
  completionRate: number;
  pendingReview: number;
  rejected: number;
  varianceTotal: number;
  entities: ConsolidatedEntitySummary[];
}

const EMPTY_SUMMARY: ConsolidatedReconciliationSummary = {
  totalReconciliations: 0,
  completionRate: 0,
  pendingReview: 0,
  rejected: 0,
  varianceTotal: 0,
  entities: [],
};

export function useConsolidatedReconciliationSummary(entities: Entity[]) {
  return useQuery({
    queryKey: ['consolidated-reconciliation-summary', entities.map(e => e.id).join(',')],
    queryFn: async (): Promise<ConsolidatedReconciliationSummary> => {
      if (entities.length === 0) {
        return EMPTY_SUMMARY;
      }

      const entityIds = entities.map(entity => entity.id);
      const { data, error } = await supabase
        .from('reconciliations')
        .select('id,status,variance,entity_id')
        .in('entity_id', entityIds);

      if (error) throw error;

      const rows = data || [];
      const entityMap = new Map<string, ConsolidatedEntitySummary>();

      entities.forEach((entity) => {
        entityMap.set(entity.id, {
          entityId: entity.id,
          entityName: entity.name,
          total: 0,
          completed: 0,
          completionRate: 0,
          pendingReview: 0,
          rejected: 0,
          varianceTotal: 0,
        });
      });

      rows.forEach((row) => {
        const entry = entityMap.get(row.entity_id);
        if (!entry) return;

        entry.total += 1;
        if (COMPLETED_STATUSES.includes(row.status as ReconciliationStatus)) {
          entry.completed += 1;
        }
        if (row.status === 'pending_review') {
          entry.pendingReview += 1;
        }
        if (row.status === 'rejected') {
          entry.rejected += 1;
        }
        entry.varianceTotal += Math.abs(Number(row.variance) || 0);
      });

      let totalReconciliations = 0;
      let completed = 0;
      let pendingReview = 0;
      let rejected = 0;
      let varianceTotal = 0;

      const entitySummaries = Array.from(entityMap.values())
        .map((entry) => {
          const completionRate = entry.total > 0
            ? Math.round((entry.completed / entry.total) * 100)
            : 0;

          totalReconciliations += entry.total;
          completed += entry.completed;
          pendingReview += entry.pendingReview;
          rejected += entry.rejected;
          varianceTotal += entry.varianceTotal;

          return {
            ...entry,
            completionRate,
          };
        })
        .sort((a, b) => b.total - a.total);

      const completionRate = totalReconciliations > 0
        ? Math.round((completed / totalReconciliations) * 100)
        : 0;

      return {
        totalReconciliations,
        completionRate,
        pendingReview,
        rejected,
        varianceTotal,
        entities: entitySummaries,
      };
    },
    enabled: entities.length > 0,
  });
}
