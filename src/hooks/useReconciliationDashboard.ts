import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ReconciliationStatus } from '@/types/reconciliations';

export interface VarianceItem {
  id: string;
  accountName: string;
  areaName: string;
  periodLabel: string;
  glBalance: number;
  subBalance: number;
  variance: number;
  varianceExplanation: string | null;
  status: ReconciliationStatus;
}

export interface PendingReviewItem {
  id: string;
  accountName: string;
  areaName: string;
  periodLabel: string;
  submittedAt: string | null;
  daysPending: number;
  preparerId: string | null;
}

export interface BottleneckItem {
  status: ReconciliationStatus;
  count: number;
  avgDaysInStatus: number;
  oldestItem: {
    id: string;
    accountName: string;
    daysStuck: number;
  } | null;
}

export interface CompletionByArea {
  areaName: string;
  total: number;
  completed: number;
  percentage: number;
}

export interface DashboardData {
  topVariances: VarianceItem[];
  pendingReviews: PendingReviewItem[];
  bottlenecks: BottleneckItem[];
  completionByArea: CompletionByArea[];
  summary: {
    totalReconciliations: number;
    completionRate: number;
    avgVariance: number;
    itemsNeedingAttention: number;
  };
}

export function useReconciliationDashboard(entityId: string | null, periodId?: string | null) {
  return useQuery({
    queryKey: ['reconciliation-dashboard', entityId, periodId],
    queryFn: async (): Promise<DashboardData> => {
      if (!entityId) {
        return getEmptyDashboard();
      }

      let query = supabase
        .from('reconciliations')
        .select(`
          id,
          status,
          gl_balance,
          sub_balance,
          variance,
          variance_explanation,
          submitted_at,
          prepared_at,
          approved_at,
          rejected_at,
          created_at,
          updated_at,
          preparer_id,
          objects (
            name,
            areas (name)
          ),
          periods (label)
        `)
        .eq('entity_id', entityId);

      if (periodId) {
        query = query.eq('period_id', periodId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const reconciliations = data || [];
      const now = new Date();

      // Calculate top variances (unexplained or large)
      const topVariances: VarianceItem[] = reconciliations
        .filter((r) => r.variance !== null && r.variance !== 0)
        .map((r) => ({
          id: r.id,
          accountName: r.objects?.name || 'Unknown',
          areaName: r.objects?.areas?.name || 'Unknown',
          periodLabel: r.periods?.label || 'Unknown',
          glBalance: Number(r.gl_balance) || 0,
          subBalance: Number(r.sub_balance) || 0,
          variance: Number(r.variance) || 0,
          varianceExplanation: r.variance_explanation,
          status: r.status as ReconciliationStatus,
        }))
        .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
        .slice(0, 10);

      // Calculate pending reviews
      const pendingReviews: PendingReviewItem[] = reconciliations
        .filter((r) => r.status === 'pending_review')
        .map((r) => {
          const submittedDate = r.submitted_at ? new Date(r.submitted_at) : null;
          const daysPending = submittedDate
            ? Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          return {
            id: r.id,
            accountName: r.objects?.name || 'Unknown',
            areaName: r.objects?.areas?.name || 'Unknown',
            periodLabel: r.periods?.label || 'Unknown',
            submittedAt: r.submitted_at,
            daysPending,
            preparerId: r.preparer_id,
          };
        })
        .sort((a, b) => b.daysPending - a.daysPending);

      // Calculate bottlenecks by status
      const statusGroups: Record<ReconciliationStatus, typeof reconciliations> = {
        not_started: [],
        in_progress: [],
        pending_review: [],
        rejected: [],
        approved: [],
        certified: [],
      };

      reconciliations.forEach((r) => {
        const status = r.status as ReconciliationStatus;
        if (statusGroups[status]) {
          statusGroups[status].push(r);
        }
      });

      const bottlenecks: BottleneckItem[] = Object.entries(statusGroups)
        .filter(([status]) => ['in_progress', 'pending_review', 'rejected'].includes(status))
        .map(([status, items]) => {
          const statusKey = status as ReconciliationStatus;
          
          // Calculate average days in status
          const daysInStatus = items.map((item) => {
            const entryDate = getStatusEntryDate(item, statusKey);
            if (!entryDate) return 0;
            return Math.floor((now.getTime() - new Date(entryDate).getTime()) / (1000 * 60 * 60 * 24));
          });

          const avgDays = daysInStatus.length > 0
            ? Math.round(daysInStatus.reduce((a, b) => a + b, 0) / daysInStatus.length)
            : 0;

          // Find oldest item
          let oldestItem: BottleneckItem['oldestItem'] = null;
          if (items.length > 0) {
            const oldest = items.reduce((prev, curr) => {
              const prevDate = getStatusEntryDate(prev, statusKey);
              const currDate = getStatusEntryDate(curr, statusKey);
              if (!prevDate) return curr;
              if (!currDate) return prev;
              return new Date(prevDate) < new Date(currDate) ? prev : curr;
            });
            
            const oldestDate = getStatusEntryDate(oldest, statusKey);
            oldestItem = {
              id: oldest.id,
              accountName: oldest.objects?.name || 'Unknown',
              daysStuck: oldestDate
                ? Math.floor((now.getTime() - new Date(oldestDate).getTime()) / (1000 * 60 * 60 * 24))
                : 0,
            };
          }

          return {
            status: statusKey,
            count: items.length,
            avgDaysInStatus: avgDays,
            oldestItem,
          };
        })
        .filter((b) => b.count > 0)
        .sort((a, b) => b.avgDaysInStatus - a.avgDaysInStatus);

      // Calculate completion by area
      const areaMap = new Map<string, { total: number; completed: number }>();
      reconciliations.forEach((r) => {
        const areaName = r.objects?.areas?.name || 'Uncategorized';
        const current = areaMap.get(areaName) || { total: 0, completed: 0 };
        current.total++;
        if (r.status === 'approved' || r.status === 'certified') {
          current.completed++;
        }
        areaMap.set(areaName, current);
      });

      const completionByArea: CompletionByArea[] = Array.from(areaMap.entries())
        .map(([areaName, data]) => ({
          areaName,
          total: data.total,
          completed: data.completed,
          percentage: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        }))
        .sort((a, b) => a.percentage - b.percentage);

      // Calculate summary
      const totalReconciliations = reconciliations.length;
      const completedCount = reconciliations.filter(
        (r) => r.status === 'approved' || r.status === 'certified'
      ).length;
      const completionRate = totalReconciliations > 0
        ? Math.round((completedCount / totalReconciliations) * 100)
        : 0;

      const varianceValues = reconciliations
        .map((r) => Math.abs(Number(r.variance) || 0))
        .filter((v) => v > 0);
      const avgVariance = varianceValues.length > 0
        ? varianceValues.reduce((a, b) => a + b, 0) / varianceValues.length
        : 0;

      const itemsNeedingAttention = 
        topVariances.filter((v) => !v.varianceExplanation).length +
        pendingReviews.filter((p) => p.daysPending > 3).length +
        reconciliations.filter((r) => r.status === 'rejected').length;

      return {
        topVariances,
        pendingReviews,
        bottlenecks,
        completionByArea,
        summary: {
          totalReconciliations,
          completionRate,
          avgVariance,
          itemsNeedingAttention,
        },
      };
    },
    enabled: !!entityId,
  });
}

function getStatusEntryDate(
  item: { 
    prepared_at: string | null; 
    submitted_at: string | null; 
    rejected_at: string | null;
    created_at: string;
  },
  status: ReconciliationStatus
): string | null {
  switch (status) {
    case 'in_progress':
      return item.prepared_at || item.created_at;
    case 'pending_review':
      return item.submitted_at;
    case 'rejected':
      return item.rejected_at;
    default:
      return item.created_at;
  }
}

function getEmptyDashboard(): DashboardData {
  return {
    topVariances: [],
    pendingReviews: [],
    bottlenecks: [],
    completionByArea: [],
    summary: {
      totalReconciliations: 0,
      completionRate: 0,
      avgVariance: 0,
      itemsNeedingAttention: 0,
    },
  };
}
