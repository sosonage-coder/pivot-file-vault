import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, FileBox, ShieldCheck } from 'lucide-react';
import { useUpdateObject } from '@/hooks/useObjects';
import { toast } from '@/hooks/use-toast';
import type { FileObject } from '@/types/filegrid';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  requiresApproval: z.boolean(),
  ownerName: z.string().optional(),
  reviewerName: z.string().optional(),
  approverName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditObjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  object: FileObject | null;
}

export function EditObjectModal({ open, onOpenChange, object }: EditObjectModalProps) {
  const updateObject = useUpdateObject();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      requiresApproval: false,
    },
  });

  useEffect(() => {
    if (object) {
      form.reset({
        name: object.name,
        requiresApproval: object.requires_approval || false,
        ownerName: object.owner_name || '',
        reviewerName: object.reviewer_name || '',
        approverName: object.approver_name || '',
      });
    }
  }, [object, form]);

  const onSubmit = async (values: FormValues) => {
    if (!object) return;

    try {
      await updateObject.mutateAsync({
        objectId: object.id,
        name: values.name.trim(),
        requiresApproval: values.requiresApproval,
        ownerName: values.ownerName?.trim() || null,
        reviewerName: values.reviewerName?.trim() || null,
        approverName: values.approverName?.trim() || null,
      });

      toast({
        title: 'Object updated',
        description: values.requiresApproval 
          ? 'Documents will require approval before finalizing.'
          : 'Object settings saved.',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating object:', error);
      toast({
        title: 'Error',
        description: 'Failed to update object. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBox className="h-5 w-5" />
            Edit Object
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requiresApproval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Require Approval
                    </FormLabel>
                    <FormDescription>
                      Documents must be approved before becoming final
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid gap-3">
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner (Preparer)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Team A" {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reviewerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reviewer</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Controller" {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="approverName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approver (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Finance Director" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      Tip: use approval-required for high-risk objects (Revenue, Cash, Accruals) and material variances.
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateObject.isPending}>
                {updateObject.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
