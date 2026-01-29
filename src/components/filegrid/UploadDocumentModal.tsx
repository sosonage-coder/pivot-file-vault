import { useState, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, FileText, Sparkles } from 'lucide-react';
import { useObjects, useCreateObject } from '@/hooks/useObjects';
import { useAreaDocumentTypes } from '@/hooks/useDocumentTypes';
import { usePeriods } from '@/hooks/usePeriods';
import { useCreateDocument } from '@/hooks/useCreateDocument';
import { checkAndUpdatePBCItem } from '@/hooks/usePBCItems';
import { toast } from '@/hooks/use-toast';
import type { TreeNode, Entity, DocumentStatus } from '@/types/filegrid';

const formSchema = z.object({
  objectId: z.string().optional(),
  newObjectName: z.string().optional(),
  periodId: z.string().min(1, 'Period is required'),
  documentTypeId: z.string().min(1, 'Document type is required'),
  status: z.enum(['Draft', 'Final'] as const),
  externalFileUrl: z.string().url('Must be a valid URL'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNode: TreeNode;
  selectedEntity: Entity;
  departmentId: string;
  processId: string;
}

export function UploadDocumentModal({
  open,
  onOpenChange,
  selectedNode,
  selectedEntity,
  departmentId,
  processId,
}: UploadDocumentModalProps) {
  const [isCreatingObject, setIsCreatingObject] = useState(false);
  const [aiAssistEnabled, setAiAssistEnabled] = useState(false);

  // Fetch data
  const { data: objects = [], isLoading: objectsLoading } = useObjects({
    areaId: selectedNode.id,
    entityId: selectedEntity.id,
  });

  const areaTemplateId = (selectedNode.metadata?.template_id as string) || null;
  const { data: documentTypes = [], isLoading: typesLoading } = useAreaDocumentTypes(areaTemplateId);
  const { data: periods = [], isLoading: periodsLoading } = usePeriods();

  // Mutations
  const createObject = useCreateObject();
  const createDocument = useCreateDocument();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objectId: '',
      newObjectName: '',
      periodId: '',
      documentTypeId: '',
      status: 'Draft',
      externalFileUrl: '',
      notes: '',
    },
  });

  const watchedValues = form.watch();

  // Generate preview of the filename
  const filenamePreview = useMemo(() => {
    const objectName = isCreatingObject
      ? watchedValues.newObjectName
      : objects.find(o => o.id === watchedValues.objectId)?.name;
    const docType = documentTypes.find(t => t.id === watchedValues.documentTypeId)?.name;
    const period = periods.find(p => p.id === watchedValues.periodId)?.label;
    const status = watchedValues.status;

    if (!objectName || !docType) return null;
    
    const parts = [objectName, docType];
    if (period) parts.push(period);
    if (status) parts.push(status);
    
    return parts.join('_');
  }, [watchedValues, objects, documentTypes, periods, isCreatingObject]);

  const onSubmit = async (values: FormValues) => {
    try {
      let objectId = values.objectId || null;

      // Create new object if needed
      if (isCreatingObject && values.newObjectName) {
        const newObject = await createObject.mutateAsync({
          name: values.newObjectName.trim(),
          entityId: selectedEntity.id,
          departmentId,
          processId,
          areaId: selectedNode.id,
        });
        objectId = newObject.id;
      }

      // Validate we have an object
      if (!objectId && !isCreatingObject) {
        toast({
          title: 'Object required',
          description: 'Please select or create an object',
          variant: 'destructive',
        });
        return;
      }

      // Generate logical name
      const objectName = isCreatingObject
        ? values.newObjectName!.trim()
        : objects.find(o => o.id === objectId)?.name || '';
      const docTypeName = documentTypes.find(t => t.id === values.documentTypeId)?.name || '';
      const logicalName = `${objectName}_${docTypeName}`;

      // Create document
      await createDocument.mutateAsync({
        logicalName,
        entityId: selectedEntity.id,
        departmentId,
        processId,
        areaId: selectedNode.id,
        objectId,
        periodId: values.periodId,
        documentTypeId: values.documentTypeId,
        status: values.status as DocumentStatus,
        externalFileUrl: values.externalFileUrl,
        notes: values.notes || null,
      });

      // Auto-complete any matching PBC requests
      await checkAndUpdatePBCItem(
        selectedEntity.id,
        selectedNode.id,
        values.documentTypeId,
        values.periodId,
        objectId
      );

      toast({
        title: 'Document added',
        description: `${filenamePreview} has been created`,
      });

      form.reset();
      setIsCreatingObject(false);
      setAiAssistEnabled(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to create document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isLoading = objectsLoading || typesLoading || periodsLoading;
  const isSubmitting = createObject.isPending || createDocument.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Document
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* AI Assist Toggle */}
              <div className="flex items-center justify-between rounded-md border border-dashed p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div>
                    <Label htmlFor="ai-assist" className="text-sm font-medium">
                      AI Metadata Assist
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Suggest metadata from URL
                    </p>
                  </div>
                </div>
                <Switch
                  id="ai-assist"
                  checked={aiAssistEnabled}
                  onCheckedChange={setAiAssistEnabled}
                />
              </div>

              {aiAssistEnabled && (
                <div className="rounded-md bg-muted/50 p-3 text-center text-sm text-muted-foreground">
                  <Sparkles className="mx-auto mb-2 h-5 w-5" />
                  AI analysis coming soon
                </div>
              )}

              {/* Read-only location context */}
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Entity:</span>{' '}
                    <span className="font-medium">{selectedEntity.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Area:</span>{' '}
                    <span className="font-medium">{selectedNode.name}</span>
                  </div>
                </div>
              </div>

              {/* Object Selection */}
              <div className="space-y-2">
                <Label>Object</Label>
                {!isCreatingObject ? (
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="objectId"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select object..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {objects.map((obj) => (
                                <SelectItem key={obj.id} value={obj.id}>
                                  {obj.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCreatingObject(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="newObjectName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="New object name..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      This object will be reusable across periods
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsCreatingObject(false);
                        form.setValue('newObjectName', '');
                      }}
                    >
                      Cancel - use existing
                    </Button>
                  </div>
                )}
              </div>

              {/* Period */}
              <FormField
                control={form.control}
                name="periodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {periods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Document Type */}
              <FormField
                control={form.control}
                name="documentTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                          <RadioGroupItem value="Draft" id="draft" />
                          <Label htmlFor="draft" className="font-normal">Draft</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Final" id="final" />
                          <Label htmlFor="final" className="font-normal">Final</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* External URL */}
              <FormField
                control={form.control}
                name="externalFileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External File URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://sharepoint.com/..." 
                        {...field} 
                      />
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

              {/* Filename Preview */}
              {filenamePreview && (
                <div className="rounded-md border border-dashed p-3">
                  <p className="text-xs text-muted-foreground">Generated filename:</p>
                  <p className="font-mono text-sm font-medium">{filenamePreview}</p>
                </div>
              )}

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
                  Add Document
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
