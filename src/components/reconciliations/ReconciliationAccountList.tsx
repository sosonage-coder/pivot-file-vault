import { useMemo } from 'react';
import { FileText, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useReconciliations } from '@/hooks/useReconciliations';
import type { ReconciliationFolderNode } from './ReconciliationSidebarTree';

interface ReconciliationAccountListProps {
  entityId: string;
  periodId?: string | null;
  selectedFolder: ReconciliationFolderNode;
  onSelectAccount: (reconciliationId: string) => void;
}

export function ReconciliationAccountList({
  entityId,
  periodId,
  selectedFolder,
  onSelectAccount,
}: ReconciliationAccountListProps) {
  const { data: reconciliations = [], isLoading } = useReconciliations(entityId, periodId);

  // Filter accounts based on selected folder (subcategory = area)
  const accounts = useMemo(() => {
    if (!selectedFolder.areaId) return [];
    
    return reconciliations.filter(recon => {
      const obj = recon.objects;
      if (!obj) return false;
      return obj.area_id === selectedFolder.areaId;
    });
  }, [reconciliations, selectedFolder.areaId]);

  // Calculate stats for header cards
  const stats = useMemo(() => {
    const total = accounts.length;
    const certified = accounts.filter(a => a.status === 'certified').length;
    const pending = accounts.filter(a => a.status === 'pending_review').length;
    const withVariance = accounts.filter(a => a.variance !== null && a.variance !== 0).length;
    const totalGLBalance = accounts.reduce((sum, a) => sum + (a.gl_balance || 0), 0);
    
    return { total, certified, pending, withVariance, totalGLBalance };
  }, [accounts]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      not_started: { label: 'Not Started', className: 'bg-muted text-muted-foreground' },
      in_progress: { label: 'In Progress', className: 'bg-primary/10 text-primary' },
      pending_review: { label: 'Pending Review', className: 'bg-accent text-accent-foreground' },
      approved: { label: 'Approved', className: 'bg-primary/20 text-primary' },
      certified: { label: 'Certified', className: 'bg-primary/30 text-primary' },
      rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
    };
    
    const config = statusConfig[status] || statusConfig.not_started;
    return (
      <Badge variant="secondary" className={cn('text-[10px]', config.className)}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-muted/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="mt-1 text-lg font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-muted/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Certified</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-primary">{stats.certified}</p>
          </CardContent>
        </Card>
        <Card className="border-muted/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="mt-1 text-lg font-semibold">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-muted/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">GL Balance</span>
            </div>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(stats.totalGLBalance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Account List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Accounts in {selectedFolder.name}
        </h3>
        
        {accounts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No accounts in this folder</p>
              <p className="text-xs text-muted-foreground">Create a reconciliation to add accounts</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => onSelectAccount(account.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border border-muted/50 bg-card p-3 text-left transition-colors',
                  'hover:border-primary/30 hover:bg-accent/50',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                )}
              >
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {account.objects?.name || 'Unnamed Account'}
                  </p>
                  {account.gl_balance !== null && (
                    <p className="text-xs text-muted-foreground">
                      GL: {formatCurrency(account.gl_balance)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {account.variance !== null && account.variance !== 0 && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        'text-[10px]',
                        account.variance > 0 ? 'bg-destructive/10 text-destructive' : 'bg-accent text-accent-foreground'
                      )}
                    >
                      Var: {formatCurrency(account.variance)}
                    </Badge>
                  )}
                  {getStatusBadge(account.status)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
