import { useState, useEffect, useCallback } from 'react';
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
  ExternalLink,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useReconciliationLineItems } from '@/hooks/useReconciliationLineItems';
import { TemplateRenderer } from './templates/TemplateRenderer';
import { EvidencePanel } from './EvidencePanel';
import { ChecklistPanel } from './ChecklistPanel';
import { ReconciliationDashboard } from './dashboard';
import type { ReconciliationStatus, ReconciliationTemplate } from '@/types/reconciliations';
import { useReconciliationReviewChecklist, useUpsertReconciliationReviewChecklist } from '@/hooks/useReconciliationReviewChecklist';

interface ReconciliationWorkspaceProps {
  reconciliationId: string | null;
  entityId?: string | null;
  periodId?: string | null;
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
    color: 'text-destructive',
    bgClass: 'bg-destructive/10 text-destructive'
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

const MATERIALITY_THRESHOLD = 1000;

const workflowTransitions: Record<ReconciliationStatus, ReconciliationStatus[]> = {
  not_started: ['in_progress'],
  in_progress: ['pending_review'],
  pending_review: ['approved', 'rejected'],
  rejected: ['in_progress'],
  approved: ['certified'],
  certified: [],
};

export function ReconciliationWorkspace({ reconciliationId, entityId, periodId }: ReconciliationWorkspaceProps) {
  const { data: reconciliation, isLoading, refetch: refetchReconciliation } = useReconciliation(reconciliationId);
  const { data: attachments = [] } = useReconciliationAttachments(reconciliationId);
  const { data: reviewChecklist } = useReconciliationReviewChecklist(reconciliationId);
  const { data: lineItems = [], refetch: refetchLineItems } = useReconciliationLineItems(reconciliationId);
  const updateReconciliation = useUpdateReconciliation();
  const upsertReviewChecklist = useUpsertReconciliationReviewChecklist();
  
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

  const handleLineItemsChange = useCallback(() => {
    refetchLineItems();
  }, [refetchLineItems]);

  // Show dashboard when no reconciliation is selected
  if (!reconciliationId) {
    return (
      <ReconciliationDashboard
        entityId={entityId || null}
        periodId={periodId}
        onSelectReconciliation={(id) => {
          // This will be handled by parent component through tree selection
          console.log('Select reconciliation:', id);
        }}
      />
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
  const isMaterialVariance = Math.abs(variance) > MATERIALITY_THRESHOLD;

  // Editable if not yet approved/certified
  const isEditable = !['approved', 'certified'].includes(currentStatus);

  // Get template info
  const template = reconciliation.reconciliation_templates as ReconciliationTemplate | null;

  const handleStatusChange = (newStatus: ReconciliationStatus) => {
    const requiresControlProof = ['pending_review', 'approved', 'certified'].includes(newStatus);
    const requiresReviewChecklist = ['approved', 'certified'].includes(newStatus);

    if (requiresReviewChecklist) {
      const checklistComplete =
        !!reviewChecklist?.support_attached &&
        !!reviewChecklist?.tie_out_complete &&
        !!reviewChecklist?.variance_explained &&
        !!reviewChecklist?.sign_off_complete;

      if (!checklistComplete) {
        toast.error('Complete the reviewer checklist before approving or certifying.');
        return;
      }
    }

    if (requiresControlProof && isMaterialVariance) {
      if (!varianceExplanation.trim()) {
        toast.error(`Variance explanation is required when variance exceeds ${MATERIALITY_THRESHOLD.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}.`);
        return;
      }

      if (attachments.length === 0) {
        toast.error('Attach at least one evidence document before moving a material variance for review/approval.');
        return;
      }
    }

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

  const handlePopOut = () => {
    if (!reconciliation) return;
    const entityParam = reconciliation.entity_id ? `&entityId=${reconciliation.entity_id}` : '';
    window.open(`/reconciliations?id=${reconciliation.id}${entityParam}`, '_blank');
  };

  const toggleReviewCheck = (key: 'support_attached' | 'tie_out_complete' | 'variance_explained' | 'sign_off_complete', checked: boolean) => {
    if (!reconciliationId) return;

    upsertReviewChecklist.mutate({
      reconciliationId,
      updates: {
        support_attached: reviewChecklist?.support_attached ?? false,
        tie_out_complete: reviewChecklist?.tie_out_complete ?? false,
        variance_explained: reviewChecklist?.variance_explained ?? false,
        sign_off_complete: reviewChecklist?.sign_off_complete ?? false,
        [key]: checked,
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
              {template && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">
                    {template.name}
                  </Badge>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={cn('gap-1', config.bgClass)}>
              <StatusIcon className="h-3.5 w-3.5" />
              {config.label}
            </Badge>

            <Button variant="outline" size="sm" onClick={handlePopOut}>
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Pop Out
            </Button>
            
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reviewer Checklist</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { key: 'support_attached', label: 'Support attached' },
              { key: 'tie_out_complete', label: 'Tie-out complete' },
              { key: 'variance_explained', label: 'Variance explained' },
              { key: 'sign_off_complete', label: 'Sign-off complete' },
            ].map((item) => (
              <label key={item.key} className="inline-flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(reviewChecklist?.[item.key as 'support_attached' | 'tie_out_complete' | 'variance_explained' | 'sign_off_complete'])}
                  onCheckedChange={(checked) => toggleReviewCheck(item.key as 'support_attached' | 'tie_out_complete' | 'variance_explained' | 'sign_off_complete', checked === true)}
                />
                {item.label}
              </label>
            ))}
          </CardContent>
        </Card>

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
                  disabled={!isEditable}
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
                  disabled={!isEditable}
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
              <>
                <div className="rounded-md border border-amber-400/50 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-200">
                  <div className="font-medium">Controls rule for material variances</div>
                  <div className="mt-1">
                    Variances above {MATERIALITY_THRESHOLD.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} require both an explanation and at least one evidence document before review/approval.
                  </div>
                </div>
                <div>
                  <Label htmlFor="variance-explanation">Variance Explanation</Label>
                  <Textarea
                    id="variance-explanation"
                    value={varianceExplanation}
                    onChange={(e) => setVarianceExplanation(e.target.value)}
                    placeholder="Explain the variance..."
                    className="mt-1.5"
                    rows={3}
                    disabled={!isEditable}
                  />
                </div>
              </>
            )}
            
            {isEditable && (
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
            )}
          </CardContent>
        </Card>

        {/* Template Content */}
        <Tabs defaultValue="reconciliation" className="w-full">
          <TabsList>
            <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
            <TabsTrigger value="checklists">Checklists</TabsTrigger>
            <TabsTrigger value="evidence">Evidence ({attachments.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reconciliation" className="mt-4">
            <TemplateRenderer
              template={template}
              reconciliationId={reconciliation.id}
              lineItems={lineItems}
              glBalance={parseFloat(glBalance) || 0}
              subBalance={parseFloat(subBalance) || 0}
              isEditable={isEditable}
              onLineItemsChange={handleLineItemsChange}
            />
          </TabsContent>
          
          <TabsContent value="checklists" className="mt-4">
            <ChecklistPanel
              reconciliationId={reconciliation.id}
              entityId={reconciliation.entity_id}
              periodId={reconciliation.period_id}
              isEditable={isEditable}
            />
          </TabsContent>
          
          <TabsContent value="evidence" className="mt-4">
            <EvidencePanel
              reconciliationId={reconciliation.id}
              isEditable={isEditable}
              onAddDocument={(category) => {
                // TODO: Implement document picker modal
                console.log('Add document to category:', category);
              }}
            />
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
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
                      color="text-destructive"
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
          </TabsContent>
        </Tabs>

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
