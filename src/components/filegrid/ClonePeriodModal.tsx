import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, ArrowRight, AlertCircle } from 'lucide-react';
import { usePeriods } from '@/hooks/usePeriods';
import { useDocuments } from '@/hooks/useDocuments';
import { useClonePeriod } from '@/hooks/useClonePeriod';
import { toast } from '@/hooks/use-toast';
import type { Entity } from '@/types/filegrid';

interface ClonePeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Entity;
}

export function ClonePeriodModal({ open, onOpenChange, entity }: ClonePeriodModalProps) {
  const [sourcePeriodId, setSourcePeriodId] = useState<string>('');
  const [targetPeriodId, setTargetPeriodId] = useState<string>('');

  const { data: periods = [], isLoading: periodsLoading } = usePeriods();
  const { data: allDocuments = [] } = useDocuments({ entityId: entity.id, areaId: null, statusFilter: null });
  const clonePeriod = useClonePeriod();

  // Count documents in source period
  const sourceDocCount = useMemo(() => {
    if (!sourcePeriodId) return 0;
    return allDocuments.filter(doc => doc.period_id === sourcePeriodId).length;
  }, [allDocuments, sourcePeriodId]);

  // Check if target already has documents
  const targetDocCount = useMemo(() => {
    if (!targetPeriodId) return 0;
    return allDocuments.filter(doc => doc.period_id === targetPeriodId).length;
  }, [allDocuments, targetPeriodId]);

  const handleClone = async () => {
    if (!sourcePeriodId || !targetPeriodId) return;

    try {
      const result = await clonePeriod.mutateAsync({
        entityId: entity.id,
        sourcePeriodId,
        targetPeriodId,
      });

      toast({
        title: 'Period cloned',
        description: `${result.clonedCount} documents copied to the new period`,
      });

      setSourcePeriodId('');
      setTargetPeriodId('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error cloning period:', error);
      toast({
        title: 'Error',
        description: 'Failed to clone period. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const sourcePeriodLabel = periods.find(p => p.id === sourcePeriodId)?.label;
  const targetPeriodLabel = periods.find(p => p.id === targetPeriodId)?.label;

  const isValid = sourcePeriodId && targetPeriodId && sourcePeriodId !== targetPeriodId && sourceDocCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Clone Period
          </DialogTitle>
          <DialogDescription>
            Copy all documents from one period to another. Status will be reset to Draft.
          </DialogDescription>
        </DialogHeader>

        {periodsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Source Period */}
            <div className="space-y-2">
              <Label>Source Period</Label>
              <Select value={sourcePeriodId} onValueChange={setSourcePeriodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source period..." />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {periods.map((period) => (
                    <SelectItem 
                      key={period.id} 
                      value={period.id}
                      disabled={period.id === targetPeriodId}
                    >
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sourcePeriodId && (
                <p className="text-sm text-muted-foreground">
                  {sourceDocCount} document{sourceDocCount !== 1 ? 's' : ''} to copy
                </p>
              )}
            </div>

            {/* Arrow indicator */}
            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Target Period */}
            <div className="space-y-2">
              <Label>Target Period</Label>
              <Select value={targetPeriodId} onValueChange={setTargetPeriodId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target period..." />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {periods.map((period) => (
                    <SelectItem 
                      key={period.id} 
                      value={period.id}
                      disabled={period.id === sourcePeriodId}
                    >
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targetPeriodId && targetDocCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {targetDocCount} document{targetDocCount !== 1 ? 's' : ''} already exist
                </div>
              )}
            </div>

            {/* Preview */}
            {isValid && (
              <div className="rounded-md border border-dashed p-3 bg-muted/50">
                <p className="text-sm">
                  <span className="font-medium">{sourceDocCount}</span> documents from{' '}
                  <span className="font-medium">{sourcePeriodLabel}</span> will be copied to{' '}
                  <span className="font-medium">{targetPeriodLabel}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  All copied documents will have status set to Draft
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={clonePeriod.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleClone} 
            disabled={!isValid || clonePeriod.isPending}
          >
            {clonePeriod.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Clone {sourceDocCount} Document{sourceDocCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
