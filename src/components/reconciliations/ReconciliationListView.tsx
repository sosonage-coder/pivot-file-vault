import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, AlertTriangle, ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReconciliationWithRelations, ReconciliationStatus } from '@/types/reconciliations';
import { WhyEmptyPanel } from '@/components/layout/WhyEmptyPanel';

interface ReconciliationListViewProps {
  reconciliations: ReconciliationWithRelations[];
  isLoading?: boolean;
  onUpdateStatus: (id: string, status: ReconciliationStatus) => void;
  onEdit: (recon: ReconciliationWithRelations) => void;
  onDelete: (id: string) => void;
  selectedItems: string[];
  onSelectItem: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

const statusConfig: Record<ReconciliationStatus, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  pending_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  rejected: { label: 'Rejected', className: 'bg-destructive/20 text-destructive' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  certified: { label: 'Certified', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
};

const workflowTransitions: Record<ReconciliationStatus, ReconciliationStatus[]> = {
  not_started: ['in_progress'],
  in_progress: ['pending_review'],
  pending_review: ['approved', 'rejected'],
  rejected: ['in_progress'],
  approved: ['certified'],
  certified: [],
};

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function ReconciliationListView({
  reconciliations,
  isLoading,
  onUpdateStatus,
  onEdit,
  onDelete,
  selectedItems,
  onSelectItem,
  onSelectAll,
}: ReconciliationListViewProps) {
  const allSelected = reconciliations.length > 0 && selectedItems.length === reconciliations.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < reconciliations.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading reconciliations...</div>
      </div>
    );
  }

  if (reconciliations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No reconciliations found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new reconciliation to get started
        </p>
        <div className="mt-6 w-full max-w-xl">
          <WhyEmptyPanel show contextLabel="reconciliations" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(ref) => {
                  if (ref) (ref as HTMLButtonElement).dataset.indeterminate = someSelected ? 'true' : 'false';
                }}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead>Account</TableHead>
            <TableHead className="w-28">Period</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-32 text-right">GL Balance</TableHead>
            <TableHead className="w-32 text-right">Sub Balance</TableHead>
            <TableHead className="w-32 text-right">Variance</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reconciliations.map((recon) => {
            const hasVariance = recon.variance !== null && recon.variance !== 0;
            const statusInfo = statusConfig[recon.status];
            const allowedTransitions = workflowTransitions[recon.status];

            return (
              <TableRow
                key={recon.id}
                className={cn(hasVariance && 'bg-destructive/5')}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(recon.id)}
                    onCheckedChange={(checked) => onSelectItem(recon.id, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{recon.objects?.name || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">
                      {recon.objects?.processes?.name} → {recon.objects?.areas?.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{recon.periods?.label || '—'}</span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant="secondary"
                        className={cn('cursor-pointer', statusInfo.className)}
                      >
                        {statusInfo.label}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {allowedTransitions.length === 0 ? (
                        <DropdownMenuItem disabled>
                          No transitions available
                        </DropdownMenuItem>
                      ) : (
                        allowedTransitions.map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => onUpdateStatus(recon.id, status)}
                          >
                            {statusConfig[status].label}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(recon.gl_balance)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(recon.sub_balance)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {hasVariance && <AlertTriangle className="h-3 w-3 text-destructive" />}
                    <span className={cn(
                      'font-mono text-sm',
                      hasVariance && 'font-medium text-destructive'
                    )}>
                      {formatCurrency(recon.variance)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(recon)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(recon.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
