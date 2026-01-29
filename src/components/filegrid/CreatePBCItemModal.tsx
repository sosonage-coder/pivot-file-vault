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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, ClipboardList } from 'lucide-react';
import { usePeriods } from '@/hooks/usePeriods';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { useCreatePBCItem } from '@/hooks/usePBCItems';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { Entity } from '@/types/filegrid';

const formSchema = z.object({
  periodId: z.string().min(1, 'Period is required'),
  processId: z.string().min(1, 'Process is required'),
  areaId: z.string().min(1, 'Area is required'),
  documentTypeId: z.string().min(1, 'Document type is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface CreatePBCItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Entity;
}

export function CreatePBCItemModal({ open, onOpenChange, entity }: CreatePBCItemModalProps) {
  const [selectedProcessId, setSelectedProcessId] = useState<string>('');

  const { data: periods = [], isLoading: periodsLoading } = usePeriods();
  const { data: documentTypes = [], isLoading: typesLoading } = useDocumentTypes();
  const createPBCItem = useCreatePBCItem();

  // Fetch processes for this entity
  const { data: processes = [], isLoading: processesLoading } = useQuery({
    queryKey: ['processes', entity.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select('id, name')
        .eq('entity_id', entity.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!entity.id
  });

  // Fetch areas for selected process
  const { data: areas = [], isLoading: areasLoading } = useQuery({
    queryKey: ['areas', selectedProcessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('id, name')
        .eq('process_id', selectedProcessId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProcessId
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      periodId: '',
      processId: '',
      areaId: '',
      documentTypeId: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createPBCItem.mutateAsync({
        entityId: entity.id,
        periodId: values.periodId,
        processId: values.processId,
        areaId: values.areaId,
        documentTypeId: values.documentTypeId,
      });

      toast({
        title: 'Request created',
        description: 'PBC request has been added',
      });

      form.reset();
      setSelectedProcessId('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating PBC item:', error);
      toast({
        title: 'Error',
        description: 'Failed to create request',
        variant: 'destructive',
      });
    }
  };

  const isLoading = periodsLoading || typesLoading || processesLoading;
  const isSubmitting = createPBCItem.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Create PBC Request
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <SelectContent className="bg-popover">
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

              {/* Process */}
              <FormField
                control={form.control}
                name="processId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Process</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedProcessId(value);
                        form.setValue('areaId', '');
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select process..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover">
                        {processes.map((process) => (
                          <SelectItem key={process.id} value={process.id}>
                            {process.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Area */}
              <FormField
                control={form.control}
                name="areaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedProcessId || areasLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={areasLoading ? "Loading..." : "Select area..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover">
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
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
                      <SelectContent className="bg-popover">
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
                  Create Request
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
