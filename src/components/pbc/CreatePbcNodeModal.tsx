import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePbcTemplates } from '@/hooks/usePbcTemplates';
import { useCreatePbcNode } from '@/hooks/usePbcTree';
import { getAllowedChildTypes, canBeRoot } from '@/types/pbc-tree';
import type { PbcTreeNode, PbcNodeType } from '@/types/pbc-tree';

const formSchema = z.object({
  nodeType: z.enum(['area', 'dimension', 'object', 'request']),
  label: z.string().min(1, 'Label is required'),
  templateId: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreatePbcNodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  periodId: string;
  parentNode: PbcTreeNode | null;
}

export function CreatePbcNodeModal({
  open,
  onOpenChange,
  entityId,
  periodId,
  parentNode,
}: CreatePbcNodeModalProps) {
  const { data: templates } = usePbcTemplates();
  const createNode = useCreatePbcNode();

  // Determine allowed node types
  const allowedTypes: PbcNodeType[] = parentNode
    ? getAllowedChildTypes(parentNode.node_type)
    : ['area']; // Only area can be root

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nodeType: allowedTypes[0] || 'request',
      label: '',
      priority: 'normal',
      notes: '',
    },
  });

  const watchedNodeType = form.watch('nodeType');
  const isRequest = watchedNodeType === 'request';
  const isArea = watchedNodeType === 'area';

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        nodeType: allowedTypes[0] || 'request',
        label: '',
        priority: 'normal',
        notes: '',
      });
    }
  }, [open, form, allowedTypes]);

  const onSubmit = async (values: FormValues) => {
    try {
      await createNode.mutateAsync({
        entityId,
        periodId,
        parentId: parentNode?.id || null,
        nodeType: values.nodeType as PbcNodeType,
        label: values.label,
        templateId: isArea ? values.templateId : (parentNode?.pbc_template_id || undefined),
        priority: isRequest ? values.priority : undefined,
        dueDate: isRequest && values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : undefined,
        notes: values.notes || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create node:', error);
    }
  };

  const nodeTypeLabels: Record<PbcNodeType, string> = {
    area: 'Area (e.g., Fixed Assets, Cash)',
    dimension: 'Dimension (e.g., Additions, Bank)',
    object: 'Object (e.g., Bank of America)',
    request: 'Request (actionable item)',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {parentNode 
              ? `Add Child to "${parentNode.label}"`
              : 'Create PBC Area'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Node Type */}
            <FormField
              control={form.control}
              name="nodeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Node Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allowedTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {nodeTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Label */}
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={
                        isArea ? 'e.g., Fixed Assets' : 
                        isRequest ? 'e.g., Bank Reconciliation' : 
                        'e.g., Additions'
                      } 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Template selection for areas */}
            {isArea && templates && templates.length > 0 && (
              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Request-specific fields */}
            {isRequest && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional context or instructions..."
                      className="resize-none"
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
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createNode.isPending}>
                {createNode.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
