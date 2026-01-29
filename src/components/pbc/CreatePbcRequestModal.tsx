import { useState } from 'react';
import { 
  Plus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreatePbcRequest } from '@/hooks/usePbcObjectRequests';
import { toast } from '@/hooks/use-toast';

interface CreatePbcRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  objectId: string;
  objectName: string;
  periodId: string;
}

export function CreatePbcRequestModal({
  open,
  onOpenChange,
  entityId,
  objectId,
  objectName,
  periodId
}: CreatePbcRequestModalProps) {
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  const createRequest = useCreatePbcRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!label.trim()) {
      toast({ title: 'Please enter a request description', variant: 'destructive' });
      return;
    }

    try {
      await createRequest.mutateAsync({
        entityId,
        objectId,
        periodId,
        label: label.trim(),
        notes: notes.trim() || undefined,
        dueDate: dueDate || undefined
      });
      
      toast({ title: 'Request created' });
      setLabel('');
      setNotes('');
      setDueDate('');
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Failed to create request', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add PBC Request</DialogTitle>
          <DialogDescription>
            Create a new request for <strong>{objectName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Request Description *</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Upload 12 month bank statements"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional instructions..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRequest.isPending}>
              {createRequest.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
