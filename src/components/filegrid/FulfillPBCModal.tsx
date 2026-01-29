import { useState } from 'react';
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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, FileCheck } from 'lucide-react';
import { useCreateDocument } from '@/hooks/useCreateDocument';
import { useUpdatePBCStatus } from '@/hooks/usePBCItems';
import { toast } from '@/hooks/use-toast';
import type { DocumentStatus } from '@/types/filegrid';

const formSchema = z.object({
  status: z.enum(['Draft', 'Final'] as const),
  externalFileUrl: z.string().url('Must be a valid URL'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PBCItemForFulfill {
  id: string;
  entity_id: string;
  period_id: string;
  process_id: string;
  area_id: string;
  object_id: string | null;
  document_type_id: string;
  areas: { name: string; processes: { name: string; departments: { name: string } } };
  periods: { label: string };
  document_types: { name: string };
  objects: { name: string } | null;
}

interface FulfillPBCModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pbcItem: PBCItemForFulfill | null;
}

export function FulfillPBCModal({ open, onOpenChange, pbcItem }: FulfillPBCModalProps) {
  const createDocument = useCreateDocument();
  const updatePBCStatus = useUpdatePBCStatus();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'Final',
      externalFileUrl: '',
      notes: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!pbcItem) return;

    try {
      // Generate logical name from object (if exists) and document type
      const objectName = pbcItem.objects?.name || 'General';
      const docTypeName = pbcItem.document_types.name;
      const logicalName = `${objectName}_${docTypeName}`;

      // Get department_id from the process hierarchy
      // We need to query it since it's not directly on the PBC item
      const { data: processData } = await import('@/integrations/supabase/client').then(
        ({ supabase }) => supabase
          .from('processes')
          .select('department_id')
          .eq('id', pbcItem.process_id)
          .single()
      );

      if (!processData) {
        throw new Error('Could not find process information');
      }

      // Create the document
      await createDocument.mutateAsync({
        logicalName,
        entityId: pbcItem.entity_id,
        departmentId: processData.department_id,
        processId: pbcItem.process_id,
        areaId: pbcItem.area_id,
        objectId: pbcItem.object_id,
        periodId: pbcItem.period_id,
        documentTypeId: pbcItem.document_type_id,
        status: values.status as DocumentStatus,
        externalFileUrl: values.externalFileUrl,
        notes: values.notes || null,
      });

      // Update PBC status to Uploaded
      await updatePBCStatus.mutateAsync({
        id: pbcItem.id,
        status: 'Uploaded',
        entityId: pbcItem.entity_id,
      });

      toast({
        title: 'Document created',
        description: `${logicalName} has been added and request marked as Uploaded`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error fulfilling PBC request:', error);
      toast({
        title: 'Error',
        description: 'Failed to create document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isSubmitting = createDocument.isPending || updatePBCStatus.isPending;

  if (!pbcItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Fulfill PBC Request
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Pre-filled context (read-only) */}
            <div className="rounded-md bg-muted p-3 text-sm space-y-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="text-muted-foreground">Area:</span>{' '}
                  <span className="font-medium">{pbcItem.areas.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Period:</span>{' '}
                  <span className="font-medium">{pbcItem.periods.label}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Document Type:</span>{' '}
                  <span className="font-medium">{pbcItem.document_types.name}</span>
                </div>
                {pbcItem.objects && (
                  <div>
                    <span className="text-muted-foreground">Object:</span>{' '}
                    <span className="font-medium">{pbcItem.objects.name}</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground pt-1 border-t">
                {pbcItem.areas.processes.departments.name} / {pbcItem.areas.processes.name}
              </div>
            </div>

            {/* External URL - auto-focused */}
            <FormField
              control={form.control}
              name="externalFileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://sharepoint.com/..." 
                      autoFocus
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Draft" id="fulfill-draft" />
                        <Label htmlFor="fulfill-draft" className="font-normal">Draft</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Final" id="fulfill-final" />
                        <Label htmlFor="fulfill-final" className="font-normal">Final</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional context..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Document
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
