import { useState } from 'react';
import { 
  Plus, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  Play, 
  XCircle, 
  Shield,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateReconciliationModal } from './CreateReconciliationModal';
import { useReconciliations, useReconciliationTemplates } from '@/hooks/useReconciliations';
import type { ReconciliationStatus, ReconciliationTemplateType, ReconciliationWithRelations } from '@/types/reconciliations';

interface ReconciliationCategoryListProps {
  categoryType: ReconciliationTemplateType;
  entityId: string;
  periodId?: string | null;
  onSelectReconciliation: (id: string) => void;
}

const statusConfig: Record<ReconciliationStatus, { 
  icon: typeof CheckCircle2; 
  color: string; 
  bgClass: string;
}> = {
  not_started: { 
    icon: Clock, 
    color: 'text-muted-foreground',
    bgClass: 'bg-muted'
  },
  in_progress: { 
    icon: Play, 
    color: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30'
  },
  pending_review: { 
    icon: Clock, 
    color: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30'
  },
  rejected: { 
    icon: XCircle, 
    color: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30'
  },
  approved: { 
    icon: CheckCircle2, 
    color: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30'
  },
  certified: { 
    icon: Shield, 
    color: 'text-primary',
    bgClass: 'bg-primary/10'
  },
};

const CATEGORY_LABELS: Record<ReconciliationTemplateType, { label: string; description: string }> = {
  general: { label: 'General', description: 'General purpose reconciliations' },
  bank: { label: 'Bank Reconciliations', description: 'Cash and bank account reconciliations' },
  prepaid: { label: 'Prepaid Expenses', description: 'Prepaid expense amortization schedules' },
  accrual: { label: 'Accruals', description: 'Accrued expense rollforwards' },
  fixed_asset: { label: 'Fixed Assets', description: 'Property, plant & equipment depreciation' },
  lease: { label: 'Leases', description: 'IFRS 16 / ASC 842 lease accounting' },
  intercompany: { label: 'Intercompany', description: 'Intercompany eliminations and balances' },
};

export function ReconciliationCategoryList({
  categoryType,
  entityId,
  periodId,
  onSelectReconciliation,
}: ReconciliationCategoryListProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { data: allReconciliations = [], isLoading } = useReconciliations(entityId, periodId);
  const { data: templates = [] } = useReconciliationTemplates();
  
  // Filter reconciliations by template type (or no template for 'general')
  const reconciliations = allReconciliations.filter(recon => {
    const template = recon.reconciliation_templates;
    if (categoryType === 'general') {
      return !template || template.template_type === 'general';
    }
    return template?.template_type === categoryType;
  });

  const categoryInfo = CATEGORY_LABELS[categoryType] || CATEGORY_LABELS.general;
  
  // Get templates for this category
  const categoryTemplates = templates.filter(t => t.template_type === categoryType);
  
  // Calculate stats
  const stats = {
    total: reconciliations.length,
    certified: reconciliations.filter(r => r.status === 'certified').length,
    withVariance: reconciliations.filter(r => r.variance && r.variance !== 0).length,
    pendingReview: reconciliations.filter(r => r.status === 'pending_review').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{categoryInfo.label}</h2>
          <p className="text-sm text-muted-foreground mt-1">{categoryInfo.description}</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Reconciliation
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Accounts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.certified}</div>
            <div className="text-xs text-muted-foreground">Certified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats.pendingReview}</div>
            <div className="text-xs text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{stats.withVariance}</div>
            <div className="text-xs text-muted-foreground">With Variance</div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reconciliations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm font-medium">No reconciliations yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a new {categoryInfo.label.toLowerCase()} reconciliation to get started
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Create First Reconciliation
              </Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="divide-y">
                {reconciliations.map((recon) => (
                  <AccountRow 
                    key={recon.id} 
                    reconciliation={recon} 
                    onClick={() => onSelectReconciliation(recon.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <CreateReconciliationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        entityId={entityId}
        defaultPeriodId={periodId}
      />
    </div>
  );
}

function AccountRow({ 
  reconciliation, 
  onClick 
}: { 
  reconciliation: ReconciliationWithRelations;
  onClick: () => void;
}) {
  const config = statusConfig[reconciliation.status];
  const StatusIcon = config.icon;
  const hasVariance = reconciliation.variance && reconciliation.variance !== 0;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50"
    >
      {/* Account Icon */}
      <div className={cn(
        'flex h-10 w-10 items-center justify-center rounded-lg',
        config.bgClass
      )}>
        <FileSpreadsheet className={cn('h-5 w-5', config.color)} />
      </div>

      {/* Account Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {reconciliation.objects?.name || 'Unknown Account'}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{reconciliation.objects?.areas?.name}</span>
          {reconciliation.periods?.label && (
            <>
              <span>•</span>
              <span>{reconciliation.periods.label}</span>
            </>
          )}
        </div>
      </div>

      {/* Balances */}
      <div className="text-right text-sm">
        <div className="font-mono">
          {(reconciliation.gl_balance ?? 0).toLocaleString('en-US', { 
            style: 'currency', 
            currency: 'USD' 
          })}
        </div>
        {hasVariance && (
          <div className="flex items-center justify-end gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span className="font-mono">
              {reconciliation.variance?.toLocaleString('en-US', { 
                style: 'currency', 
                currency: 'USD' 
              })}
            </span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <Badge variant="outline" className={cn('gap-1 capitalize', config.bgClass)}>
        <StatusIcon className={cn('h-3 w-3', config.color)} />
        {reconciliation.status.replace('_', ' ')}
      </Badge>

      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
