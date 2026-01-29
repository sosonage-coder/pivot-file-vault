import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Play, 
  Shield,
  AlertTriangle,
  FileText,
  Plus,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  useReconciliation, 
  useUpdateReconciliation,
  useReconciliationAttachments 
} from '@/hooks/useReconciliations';
import type { ReconciliationStatus } from '@/types/reconciliations';

interface ReconciliationWorkspaceProps {
  reconciliationId: string | null;
  onClose?: () => void;
}

const statusConfig: Record<ReconciliationStatus, { 
  label: string;
  icon: typeof CheckCircle2; 
  color: string; 
  bgClass: string;
}> = {
  not_started: { 
    label: 'Not Started',
    icon: Clock, 
    color: 'text-muted-foreground',
    bgClass: 'bg-muted text-muted-foreground'
  },
  in_progress: { 
    label: 'In Progress',
    icon: Play, 
    color: 'text-blue-600',
    bgClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  },
  pending_review: { 
    label: 'Pending Review',
    icon: Clock, 
    color: 'text-amber-600',
    bgClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
  },
  rejected: { 
    label: 'Rejected',
    icon: XCircle, 
    color: 'text-red-600',
    bgClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  },
  approved: { 
    label: 'Approved',
    icon: CheckCircle2, 
    color: 'text-green-600',
    bgClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  },
  certified: { 
    label: 'Certified',
    icon: Shield, 
    color: 'text-primary',
    bgClass: 'bg-primary/10 text-primary'
  },
};

const workflowTransitions: Record<ReconciliationStatus, ReconciliationStatus[]> = {
  not_started: ['in_progress'],
  in_progress: ['pending_review'],
  pending_review: ['approved', 'rejected'],
  rejected: ['in_progress'],
  approved: ['certified'],
  certified: [],
};

export function ReconciliationWorkspace({ reconciliationId }: ReconciliationWorkspaceProps) {
  const { data: reconciliation, isLoading } = useReconciliation(reconciliationId);
  const { data: attachments = [] } = useReconciliationAttachments(reconciliationId);
  const updateReconciliation = useUpdateReconciliation();
  
  const [glBalance, setGlBalance] = useState<string>('');
  const [subBalance, setSubBalance] = useState<string>('');
  const [varianceExplanation, setVarianceExplanation] = useState<string>('');

  // Sync local state with reconciliation data
  useEffect(() => {
    if (reconciliation) {
      setGlBalance(reconciliation.gl_balance?.toString() || '');
      setSubBalance(reconciliation.sub_balance?.toString() || '');
      setVarianceExplanation(reconciliation.variance_explanation || '');
    }
  }, [reconciliation]);

  if (!reconciliationId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Select an Account</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose an account from the tree to view its reconciliation
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!reconciliation) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Reconciliation Not Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The selected reconciliation could not be loaded
          </p>
        </div>
      </div>
    );
  }

  const currentStatus = reconciliation.status;
  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;
  const availableTransitions = workflowTransitions[currentStatus];

  const variance = (parseFloat(glBalance) || 0) - (parseFloat(subBalance) || 0);
  const hasVariance = variance !== 0;

  const handleStatusChange = (newStatus: ReconciliationStatus) => {
    updateReconciliation.mutate({
      id: reconciliation.id,
      updates: { status: newStatus },
    });
  };

  const handleSaveBalances = () => {
    updateReconciliation.mutate({
      id: reconciliation.id,
      updates: {
        gl_balance: parseFloat(glBalance) || null,
        sub_balance: parseFloat(subBalance) || null,
        variance_explanation: varianceExplanation || null,
      },
    });
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {reconciliation.objects?.name || 'Unknown Account'}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span>{reconciliation.objects?.areas?.name}</span>
              <span>•</span>
              <span>{reconciliation.periods?.label}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={cn('gap-1', config.bgClass)}>
              <StatusIcon className="h-3.5 w-3.5" />
              {config.label}
            </Badge>
            
            {availableTransitions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Move to
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {availableTransitions.map((status) => {
                    const StatusConfig = statusConfig[status];
                    const TransitionIcon = StatusConfig.icon;
                    return (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleStatusChange(status)}
                      >
                        <TransitionIcon className={cn('mr-2 h-4 w-4', StatusConfig.color)} />
                        {StatusConfig.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <Separator />

        {/* Balance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="gl-balance">GL Balance</Label>
                <Input
                  id="gl-balance"
                  type="number"
                  value={glBalance}
                  onChange={(e) => setGlBalance(e.target.value)}
                  placeholder="0.00"
                  className="mt-1.5 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="sub-balance">Sub-Ledger Balance</Label>
                <Input
                  id="sub-balance"
                  type="number"
                  value={subBalance}
                  onChange={(e) => setSubBalance(e.target.value)}
                  placeholder="0.00"
                  className="mt-1.5 font-mono"
                />
              </div>
              <div>
                <Label>Variance</Label>
                <div className={cn(
                  'mt-1.5 flex h-10 items-center rounded-md border px-3 font-mono text-sm',
                  hasVariance ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'border-input bg-muted'
                )}>
                  {variance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </div>
              </div>
            </div>
            
            {hasVariance && (
              <div>
                <Label htmlFor="variance-explanation">Variance Explanation</Label>
                <Textarea
                  id="variance-explanation"
                  value={varianceExplanation}
                  onChange={(e) => setVarianceExplanation(e.target.value)}
                  placeholder="Explain the variance..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveBalances}
                disabled={updateReconciliation.isPending}
              >
                {updateReconciliation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Balances
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Supporting Evidence</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add Document
            </Button>
          </CardHeader>
          <CardContent>
            {attachments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No documents attached yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {attachment.documents?.logical_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.attachment_type}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a 
                        href={attachment.documents?.external_file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reconciliation.certified_at && (
                <WorkflowStep
                  label="Certified"
                  timestamp={reconciliation.certified_at}
                  icon={Shield}
                  color="text-primary"
                />
              )}
              {reconciliation.approved_at && (
                <WorkflowStep
                  label="Approved"
                  timestamp={reconciliation.approved_at}
                  icon={CheckCircle2}
                  color="text-green-600"
                />
              )}
              {reconciliation.rejected_at && (
                <WorkflowStep
                  label="Rejected"
                  timestamp={reconciliation.rejected_at}
                  icon={XCircle}
                  color="text-red-600"
                  notes={reconciliation.rejection_notes}
                />
              )}
              {reconciliation.reviewed_at && (
                <WorkflowStep
                  label="Reviewed"
                  timestamp={reconciliation.reviewed_at}
                  icon={CheckCircle2}
                  color="text-blue-600"
                />
              )}
              {reconciliation.submitted_at && (
                <WorkflowStep
                  label="Submitted for Review"
                  timestamp={reconciliation.submitted_at}
                  icon={Clock}
                  color="text-amber-600"
                />
              )}
              {reconciliation.prepared_at && (
                <WorkflowStep
                  label="Preparation Started"
                  timestamp={reconciliation.prepared_at}
                  icon={Play}
                  color="text-blue-600"
                />
              )}
              <WorkflowStep
                label="Created"
                timestamp={reconciliation.created_at}
                icon={Plus}
                color="text-muted-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {reconciliation.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {reconciliation.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

function WorkflowStep({ 
  label, 
  timestamp, 
  icon: Icon, 
  color,
  notes 
}: { 
  label: string; 
  timestamp: string; 
  icon: typeof CheckCircle2; 
  color: string;
  notes?: string | null;
}) {
  return (
    <div className="flex gap-3">
      <div className={cn('mt-0.5', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(timestamp), 'MMM d, yyyy h:mm a')}
        </p>
        {notes && (
          <p className="mt-1 text-sm text-muted-foreground">{notes}</p>
        )}
      </div>
    </div>
  );
}
