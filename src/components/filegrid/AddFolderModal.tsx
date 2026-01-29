import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateArea } from '@/hooks/useAdminMutations';
import { useCreateObject } from '@/hooks/useObjects';
import type { TreeNode } from '@/types/filegrid';

interface AddFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentNode: TreeNode | null;
  type: 'area' | 'object';
}

export function AddFolderModal({ open, onOpenChange, parentNode, type }: AddFolderModalProps) {
  const [name, setName] = useState('');
  
  const createArea = useCreateArea();
  const createObject = useCreateObject();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !parentNode) return;

    if (type === 'area' && parentNode.type === 'process') {
      createArea.mutate(
        { name: name.trim(), processId: parentNode.id },
        {
          onSuccess: () => {
            setName('');
            onOpenChange(false);
          },
        }
      );
    } else if (type === 'object' && parentNode.type === 'area') {
      // Get parent metadata for required fields
      const entityId = parentNode.metadata?.entity_id as string;
      const departmentId = parentNode.metadata?.department_id as string;
      const processId = parentNode.metadata?.process_id as string;
      
      if (entityId && departmentId && processId) {
        createObject.mutate(
          {
            name: name.trim(),
            areaId: parentNode.id,
            entityId,
            departmentId,
            processId,
          },
          {
            onSuccess: () => {
              setName('');
              onOpenChange(false);
            },
          }
        );
      }
    }
  };

  const isPending = createArea.isPending || createObject.isPending;
  const title = type === 'area' ? 'Add Area' : 'Add Object';
  const description = type === 'area' 
    ? `Create a new area under "${parentNode?.name}"`
    : `Create a new object under "${parentNode?.name}"`;
  const placeholder = type === 'area' ? 'e.g., Prepayments' : 'e.g., Chase Savings';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={placeholder}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
