import { useState } from 'react';
import { Building2 } from 'lucide-react';
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
import { useCreateEntity } from '@/hooks/useAdminMutations';

interface CreateEntityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEntityModal({ open, onOpenChange }: CreateEntityModalProps) {
  const [name, setName] = useState('');
  const createEntity = useCreateEntity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    try {
      await createEntity.mutateAsync({ name: name.trim() });
      setName('');
      onOpenChange(false);
    } catch {
      // Error handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Entity
          </DialogTitle>
          <DialogDescription>
            Add a new entity to the system. Entities represent organizations, companies, or business units.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entity-name">Entity Name</Label>
              <Input
                id="entity-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Acme Corporation"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createEntity.isPending}
            >
              {createEntity.isPending ? 'Creating...' : 'Create Entity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
