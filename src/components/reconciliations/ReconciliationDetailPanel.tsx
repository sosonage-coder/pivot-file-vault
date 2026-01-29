import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useUpdateReconciliation, 
  useReconciliationAttachments,
  useRemoveReconciliationAttachment 
} from '@/hooks/useReconciliations';
import type { ReconciliationWithRelations, ReconciliationStatus } from '@/types/reconciliations';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { 
  AlertTriangle, 
  FileText, 
  Trash2, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  PlayCircle,
  ShieldCheck,
  FileSearch
} from 'lucide-react';

const formSchema = z.object({
  gl_balance: z.coerce.number().optional(),
  sub_balance: z.coerce.number().optional(),
  variance_explanation: z.string().optional(),
  notes: z.string().optional(),
  rejection_notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ReconciliationDetailPanelProps {
  reconciliation: ReconciliationWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<ReconciliationStatus, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}> = {
  not_started: { label: 'Not Started', icon: FileSearch, className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', icon: PlayCircle, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  pending_review: { label: 'Pending Review', icon: Clock, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-destructive/20 text-destructive' },
  approved: { label: 'Approved', icon: CheckCircle, className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  certified: { label: 'Certified', icon: ShieldCheck, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
};

const workflowActions: Record<ReconciliationStatus, { nextStatus: ReconciliationStatus; label: string }[]> = {
  not_started: [{ nextStatus: 'in_progress', label: 'Start Working' }],
  in_progress: [{ nextStatus: 'pending_review', label: 'Submit for Review' }],
  pending_review: [
    { nextStatus: 'approved', label: 'Approve' },
    { nextStatus: 'rejected', label: 'Reject' },
  ],
  rejected: [{ nextStatus: 'in_progress', label: 'Resume Work' }],
  approved: [{ nextStatus: 'certified', label: 'Certify' }],
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

export function ReconciliationDetailPanel({
  reconciliation,
  open,
  onOpenChange,
}: ReconciliationDetailPanelProps) {
  const updateReconciliation = useUpdateReconciliation();
  const { data: attachments = [] } = useReconciliationAttachments(reconciliation?.id || null);
  const removeAttachment = useRemoveReconciliationAttachment();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gl_balance: undefined,
      sub_balance: undefined,
      variance_explanation: '',
      notes: '',
      rejection_notes: '',
    },
  });

  // Reset form when reconciliation changes
  useEffect(() => {
    if (reconciliation) {
      form.reset({
        gl_balance: reconciliation.gl_balance ?? undefined,
        sub_balance: reconciliation.sub_balance ?? undefined,
        variance_explanation: reconciliation.variance_explanation || '',
        notes: reconciliation.notes || '',
        rejection_notes: reconciliation.rejection_notes || '',
      });
    }
  }, [reconciliation, form]);

  if (!reconciliation) return null;

  const statusInfo = statusConfig[reconciliation.status];
  const StatusIcon = statusInfo.icon;
  const hasVariance = reconciliation.variance !== null && reconciliation.variance !== 0;
  const actions = workflowActions[reconciliation.status];

  const onSubmit = async (values: FormValues) => {
    try {
      await updateReconciliation.mutateAsync({
        id: reconciliation.id,
        updates: {
          gl_balance: values.gl_balance ?? null,
          sub_balance: values.sub_balance ?? null,
          variance_explanation: values.variance_explanation || null,
          notes: values.notes || null,
        },
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleStatusChange = async (newStatus: ReconciliationStatus) => {
    const updates: Record<string, unknown> = { status: newStatus };
    
    // If rejecting, include rejection notes from form
    if (newStatus === 'rejected') {
      updates.rejection_notes = form.getValues('rejection_notes') || 'No reason provided';
    }
    
    await updateReconciliation.mutateAsync({
      id: reconciliation.id,
      updates: updates as { status: ReconciliationStatus; rejection_notes?: string },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>{reconciliation.objects?.name || 'Reconciliation'}</span>
            <Badge className={cn('ml-2', statusInfo.className)}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          <div className="space-y-6 py-4">
            {/* Account Info */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <h4 className="mb-2 text-sm font-medium">Account Details</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">Process</dt>
                <dd>{reconciliation.objects?.processes?.name || '—'}</dd>
                <dt className="text-muted-foreground">Area</dt>
                <dd>{reconciliation.objects?.areas?.name || '—'}</dd>
                <dt className="text-muted-foreground">Period</dt>
                <dd>{reconciliation.periods?.label || '—'}</dd>
                <dt className="text-muted-foreground">Template</dt>
                <dd>{reconciliation.reconciliation_templates?.name || 'None'}</dd>
              </dl>
            </div>

            {/* Balance Summary */}
            <div className={cn(
              'rounded-lg border p-4',
              hasVariance && 'border-destructive/50 bg-destructive/5'
            )}>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                {hasVariance && <AlertTriangle className="h-4 w-4 text-destructive" />}
                Balance Summary
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">GL Balance</p>
                  <p className="text-lg font-semibold font-mono">
                    {formatCurrency(reconciliation.gl_balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sub Balance</p>
                  <p className="text-lg font-semibold font-mono">
                    {formatCurrency(reconciliation.sub_balance)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Variance</p>
                  <p className={cn(
                    'text-lg font-semibold font-mono',
                    hasVariance && 'text-destructive'
                  )}>
                    {formatCurrency(reconciliation.variance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Workflow Actions */}
            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.nextStatus}
                    variant={action.nextStatus === 'rejected' ? 'destructive' : 'default'}
                    onClick={() => handleStatusChange(action.nextStatus)}
                    disabled={updateReconciliation.isPending}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            <Separator />

            {/* Edit Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gl_balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GL Balance</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sub_balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub-ledger Balance</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {hasVariance && (
                  <FormField
                    control={form.control}
                    name="variance_explanation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variance Explanation</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain the variance..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add notes..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {reconciliation.status === 'pending_review' && (
                  <FormField
                    control={form.control}
                    name="rejection_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rejection Notes (if rejecting)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Reason for rejection..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" disabled={updateReconciliation.isPending}>
                  Save Changes
                </Button>
              </form>
            </Form>

            <Separator />

            {/* Attachments */}
            <div>
              <h4 className="mb-3 text-sm font-medium">Attachments</h4>
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attachments</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {attachment.documents?.logical_name || 'Unknown document'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {attachment.attachment_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {attachment.documents?.external_file_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a
                              href={attachment.documents.external_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeAttachment.mutate({
                            id: attachment.id,
                            reconciliationId: reconciliation.id,
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Workflow History */}
            <div>
              <h4 className="mb-3 text-sm font-medium">Workflow History</h4>
              <div className="space-y-2 text-sm">
                {reconciliation.prepared_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prepared</span>
                    <span>{format(parseISO(reconciliation.prepared_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
                {reconciliation.submitted_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span>{format(parseISO(reconciliation.submitted_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
                {reconciliation.rejected_at && (
                  <div className="flex justify-between text-destructive">
                    <span>Rejected</span>
                    <span>{format(parseISO(reconciliation.rejected_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
                {reconciliation.approved_at && (
                  <div className="flex justify-between text-primary">
                    <span>Approved</span>
                    <span>{format(parseISO(reconciliation.approved_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
                {reconciliation.certified_at && (
                  <div className="flex justify-between text-primary">
                    <span>Certified</span>
                    <span>{format(parseISO(reconciliation.certified_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
