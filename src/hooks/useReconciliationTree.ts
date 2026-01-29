import { useMemo } from 'react';
import type { ReconciliationWithRelations, ReconciliationStatus } from '@/types/reconciliations';

export interface ReconciliationTreeNode {
  id: string;
  name: string;
  type: 'category' | 'area' | 'account';
  status?: ReconciliationStatus;
  variance?: number | null;
  glBalance?: number | null;
  subBalance?: number | null;
  reconciliationId?: string;
  children?: ReconciliationTreeNode[];
  metadata?: {
    areaId?: string;
    processId?: string;
    departmentId?: string;
    objectId?: string;
    periodLabel?: string;
  };
}

// Define account categories based on typical balance sheet structure
const ACCOUNT_CATEGORIES = [
  { id: 'assets', name: 'Assets', order: 1 },
  { id: 'liabilities', name: 'Liabilities', order: 2 },
  { id: 'equity', name: 'Equity', order: 3 },
  { id: 'other', name: 'Other', order: 4 },
] as const;

// Helper to guess category from area/process name
function guessCategory(areaName: string | null | undefined, processName: string | null | undefined): string {
  const combined = `${areaName || ''} ${processName || ''}`.toLowerCase();
  
  if (combined.includes('cash') || combined.includes('bank') || combined.includes('receivable') || 
      combined.includes('prepaid') || combined.includes('inventory') || combined.includes('fixed asset') ||
      combined.includes('asset')) {
    return 'assets';
  }
  if (combined.includes('payable') || combined.includes('accrual') || combined.includes('debt') ||
      combined.includes('lease') || combined.includes('liability')) {
    return 'liabilities';
  }
  if (combined.includes('equity') || combined.includes('retained') || combined.includes('capital')) {
    return 'equity';
  }
  return 'other';
}

export function useReconciliationTree(
  reconciliations: ReconciliationWithRelations[]
): ReconciliationTreeNode[] {
  return useMemo(() => {
    if (!reconciliations.length) return [];

    // Group reconciliations by category -> area -> account
    const categoryMap = new Map<string, Map<string, ReconciliationWithRelations[]>>();

    reconciliations.forEach((recon) => {
      const areaName = recon.objects?.areas?.name || 'Unknown Area';
      const processName = recon.objects?.processes?.name;
      const category = guessCategory(areaName, processName);
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map());
      }
      
      const areaMap = categoryMap.get(category)!;
      const areaKey = recon.objects?.area_id || 'unknown';
      
      if (!areaMap.has(areaKey)) {
        areaMap.set(areaKey, []);
      }
      
      areaMap.get(areaKey)!.push(recon);
    });

    // Build tree structure
    const tree: ReconciliationTreeNode[] = [];

    ACCOUNT_CATEGORIES.forEach((cat) => {
      const areaMap = categoryMap.get(cat.id);
      if (!areaMap || areaMap.size === 0) return;

      const categoryNode: ReconciliationTreeNode = {
        id: cat.id,
        name: cat.name,
        type: 'category',
        children: [],
      };

      areaMap.forEach((recons, areaId) => {
        const firstRecon = recons[0];
        const areaName = firstRecon.objects?.areas?.name || 'Unknown Area';

        const areaNode: ReconciliationTreeNode = {
          id: `area-${areaId}`,
          name: areaName,
          type: 'area',
          children: [],
          metadata: {
            areaId,
            processId: firstRecon.objects?.process_id,
            departmentId: firstRecon.objects?.department_id,
          },
        };

        // Add account nodes
        recons.forEach((recon) => {
          const accountNode: ReconciliationTreeNode = {
            id: recon.id,
            name: recon.objects?.name || 'Unknown Account',
            type: 'account',
            status: recon.status,
            variance: recon.variance,
            glBalance: recon.gl_balance,
            subBalance: recon.sub_balance,
            reconciliationId: recon.id,
            metadata: {
              areaId: recon.objects?.area_id,
              processId: recon.objects?.process_id,
              departmentId: recon.objects?.department_id,
              objectId: recon.object_id,
              periodLabel: recon.periods?.label,
            },
          };
          areaNode.children!.push(accountNode);
        });

        // Sort accounts by name
        areaNode.children!.sort((a, b) => a.name.localeCompare(b.name));
        categoryNode.children!.push(areaNode);
      });

      // Sort areas by name
      categoryNode.children!.sort((a, b) => a.name.localeCompare(b.name));
      tree.push(categoryNode);
    });

    return tree;
  }, [reconciliations]);
}

// Get stats per category for display
export function useReconciliationTreeStats(tree: ReconciliationTreeNode[]) {
  return useMemo(() => {
    const stats: Record<string, { total: number; certified: number; withVariance: number }> = {};

    tree.forEach((category) => {
      let total = 0;
      let certified = 0;
      let withVariance = 0;

      category.children?.forEach((area) => {
        area.children?.forEach((account) => {
          total++;
          if (account.status === 'certified') certified++;
          if (account.variance && account.variance !== 0) withVariance++;
        });
      });

      stats[category.id] = { total, certified, withVariance };
    });

    return stats;
  }, [tree]);
}
