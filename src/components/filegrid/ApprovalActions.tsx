import { useState } from 'react';
import { Check, X, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUpdateApproval, useDocumentApproval } from '@/hooks/useApprovals';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { ApprovalStatus } from '@/types/filegrid';

interface ApprovalActionsProps {
  documentId: string;
}

const statusConfig: Record<ApprovalStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: <Check className="h-3 w-3" />,
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: <X className="h-3 w-3" />,
  },
};

export function ApprovalActions({ documentId }: ApprovalActionsProps) {
  const { user } = useAuth();
  const { data: approval, isLoading } = useDocumentApproval(documentId);
  const updateApproval = useUpdateApproval();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (!approval) {
    return null;
  }

  const config = statusConfig[approval.status as ApprovalStatus];

  const handleApprove = async () => {
    if (!user?.id) return;

    try {
      await updateApproval.mutateAsync({
        approvalId: approval.id,
        status: 'approved',
        reviewedBy: user.id,
      });
      toast({
        title: 'Document approved',
        description: 'The document has been finalized.',
      });
    } catch (error) {
      console.error('Approval error:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve document.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!user?.id) return;

    try {
      await updateApproval.mutateAsync({
        approvalId: approval.id,
        status: 'rejected',
        notes: rejectionNotes,
        reviewedBy: user.id,
      });
      toast({
        title: 'Document rejected',
        description: 'The document remains as draft.',
      });
      setRejectDialogOpen(false);
      setRejectionNotes('');
    } catch (error) {
      console.error('Rejection error:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject document.',
        variant: 'destructive',
      });
    }
  };

  if (approval.status !== 'pending') {
    return (
      <Badge variant="secondary" className={config.className}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Badge variant="secondary" className={config.className}>
          <span className="mr-1">{config.icon}</span>
          {config.label}
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={handleApprove}
          disabled={updateApproval.isPending}
        >
          {updateApproval.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => setRejectDialogOpen(true)}
          disabled={updateApproval.isPending}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rejection-notes">Reason for rejection</Label>
              <Textarea
                id="rejection-notes"
                placeholder="Provide feedback for the uploader..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={updateApproval.isPending}
            >
              {updateApproval.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
