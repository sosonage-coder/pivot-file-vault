import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  Reconciliation, 
  ReconciliationWithRelations, 
  ReconciliationStatus,
  ReconciliationStats,
  CreateReconciliationInput,
  UpdateReconciliationInput,
  ReconciliationTemplate,
  ReconciliationAttachmentWithDocument
} from '@/types/reconciliations';
import { toast } from 'sonner';

// Fetch reconciliations for an entity with optional period filter
export function useReconciliations(entityId: string | null, periodId?: string | null) {
  return useQuery({
    queryKey: ['reconciliations', entityId, periodId],
    queryFn: async (): Promise<ReconciliationWithRelations[]> => {
      if (!entityId) return [];
      
      let query = supabase
        .from('reconciliations')
        .select(`
          *,
          objects (
            name,
            area_id,
            process_id,
            department_id,
            areas (name),
            processes (name)
          ),
          periods (label),
          reconciliation_templates (name)
        `)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
      
      if (periodId) {
        query = query.eq('period_id', periodId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as ReconciliationWithRelations[];
    },
    enabled: !!entityId,
  });
}

// Fetch a single reconciliation by ID
// Fetch a single reconciliation by ID with full template data
export function useReconciliation(reconciliationId: string | null) {
  return useQuery({
    queryKey: ['reconciliation', reconciliationId],
    queryFn: async (): Promise<ReconciliationWithRelations | null> => {
      if (!reconciliationId) return null;
      
      const { data, error } = await supabase
        .from('reconciliations')
        .select(`
          *,
          objects (
            name,
            area_id,
            process_id,
            department_id,
            areas (name),
            processes (name)
          ),
          periods (label),
          reconciliation_templates (
            id,
            name,
            description,
            template_type,
            field_schema,
            calculation_rules,
            template_content,
            created_at,
            updated_at
          )
        `)
        .eq('id', reconciliationId)
        .single();
      
      if (error) throw error;
      
      // Ensure template fields have defaults
      if (data?.reconciliation_templates) {
        const template = data.reconciliation_templates as Record<string, unknown>;
        template.template_type = template.template_type || 'general';
        template.field_schema = template.field_schema || {};
        template.calculation_rules = template.calculation_rules || {};
        template.template_content = template.template_content || {};
      }
      
      return data as ReconciliationWithRelations;
    },
    enabled: !!reconciliationId,
  });
}

// Fetch reconciliation stats
export function useReconciliationStats(entityId: string | null, periodId?: string | null) {
  return useQuery({
    queryKey: ['reconciliation-stats', entityId, periodId],
    queryFn: async (): Promise<ReconciliationStats> => {
      if (!entityId) {
        return {
          not_started: 0,
          in_progress: 0,
          pending_review: 0,
          rejected: 0,
          approved: 0,
          certified: 0,
          total: 0,
          withVariance: 0,
        };
      }
      
      let query = supabase
        .from('reconciliations')
        .select('status, variance')
        .eq('entity_id', entityId);
      
      if (periodId) {
        query = query.eq('period_id', periodId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const items = data || [];
      const stats: ReconciliationStats = {
        not_started: 0,
        in_progress: 0,
        pending_review: 0,
        rejected: 0,
        approved: 0,
        certified: 0,
        total: items.length,
        withVariance: 0,
      };
      
      items.forEach((item) => {
        const status = item.status as ReconciliationStatus;
        if (status in stats) {
          stats[status]++;
        }
        if (item.variance !== null && item.variance !== 0) {
          stats.withVariance++;
        }
      });
      
      return stats;
    },
    enabled: !!entityId,
  });
}

// Fetch reconciliation templates with full schema
export function useReconciliationTemplates() {
  return useQuery({
    queryKey: ['reconciliation-templates'],
    queryFn: async (): Promise<ReconciliationTemplate[]> => {
      const { data, error } = await supabase
        .from('reconciliation_templates')
        .select('id, name, description, template_type, field_schema, calculation_rules, template_content, created_at, updated_at')
        .order('name');
      
      if (error) throw error;
      
      // Cast the data to match our ReconciliationTemplate type
      return (data || []).map(template => ({
        ...template,
        template_type: template.template_type || 'general',
        field_schema: template.field_schema || {},
        calculation_rules: template.calculation_rules || {},
        template_content: template.template_content || {},
      })) as ReconciliationTemplate[];
    },
  });
}

// Fetch attachments for a reconciliation
export function useReconciliationAttachments(reconciliationId: string | null) {
  return useQuery({
    queryKey: ['reconciliation-attachments', reconciliationId],
    queryFn: async (): Promise<ReconciliationAttachmentWithDocument[]> => {
      if (!reconciliationId) return [];
      
      const { data, error } = await supabase
        .from('reconciliation_attachments')
        .select(`
          *,
          documents (logical_name, external_file_url)
        `)
        .eq('reconciliation_id', reconciliationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as ReconciliationAttachmentWithDocument[];
    },
    enabled: !!reconciliationId,
  });
}

// Create reconciliation mutation
export function useCreateReconciliation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateReconciliationInput) => {
      const { data, error } = await supabase
        .from('reconciliations')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations', variables.entity_id] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-stats', variables.entity_id] });
      toast.success('Reconciliation created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create reconciliation: ${error.message}`);
    },
  });
}

// Update reconciliation mutation
export function useUpdateReconciliation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateReconciliationInput }) => {
      // Add workflow timestamps based on status changes
      const timestampedUpdates: Record<string, unknown> = { ...updates };
      
      if (updates.status === 'in_progress' && !timestampedUpdates.prepared_at) {
        timestampedUpdates.prepared_at = new Date().toISOString();
      }
      if (updates.status === 'pending_review' && !timestampedUpdates.submitted_at) {
        timestampedUpdates.submitted_at = new Date().toISOString();
      }
      if (updates.status === 'approved' && !timestampedUpdates.approved_at) {
        timestampedUpdates.approved_at = new Date().toISOString();
      }
      if (updates.status === 'rejected' && !timestampedUpdates.rejected_at) {
        timestampedUpdates.rejected_at = new Date().toISOString();
      }
      if (updates.status === 'certified' && !timestampedUpdates.certified_at) {
        timestampedUpdates.certified_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('reconciliations')
        .update(timestampedUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Reconciliation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations', data.entity_id] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation', data.id] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-stats', data.entity_id] });
      toast.success('Reconciliation updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update reconciliation: ${error.message}`);
    },
  });
}

// Delete reconciliation mutation
export function useDeleteReconciliation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, entityId }: { id: string; entityId: string }) => {
      const { error } = await supabase
        .from('reconciliations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, entityId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations', data.entityId] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-stats', data.entityId] });
      toast.success('Reconciliation deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete reconciliation: ${error.message}`);
    },
  });
}

// Add attachment mutation
export function useAddReconciliationAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: { 
      reconciliation_id: string; 
      document_id: string; 
      attachment_type?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('reconciliation_attachments')
        .insert({
          reconciliation_id: input.reconciliation_id,
          document_id: input.document_id,
          attachment_type: input.attachment_type || 'evidence',
          notes: input.notes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['reconciliation-attachments', variables.reconciliation_id] 
      });
      toast.success('Attachment added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add attachment: ${error.message}`);
    },
  });
}

// Remove attachment mutation
export function useRemoveReconciliationAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reconciliationId }: { id: string; reconciliationId: string }) => {
      const { error } = await supabase
        .from('reconciliation_attachments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id, reconciliationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['reconciliation-attachments', data.reconciliationId] 
      });
      toast.success('Attachment removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove attachment: ${error.message}`);
    },
  });
}
