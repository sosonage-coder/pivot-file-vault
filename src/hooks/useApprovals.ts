import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ApprovalStatus, DocumentApproval } from '@/types/filegrid';

interface UseApprovalsOptions {
  documentId?: string | null;
  entityId?: string | null;
  status?: ApprovalStatus | null;
}

export function useApprovals({ documentId, entityId, status }: UseApprovalsOptions = {}) {
  return useQuery({
    queryKey: ['approvals', { documentId, entityId, status }],
    queryFn: async () => {
      let query = supabase
        .from('document_approvals')
        .select(`
          *,
          documents!inner(
            id,
            entity_id,
            logical_name,
            objects(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (documentId) {
        query = query.eq('document_id', documentId);
      }
      
      if (entityId) {
        query = query.eq('documents.entity_id', entityId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentApproval[];
    },
    enabled: !!(documentId || entityId),
  });
}

export function usePendingApprovalCounts(entityId: string | null) {
  return useQuery({
    queryKey: ['pending-approval-counts', entityId],
    queryFn: async () => {
      if (!entityId) return {};

      const { data, error } = await supabase
        .from('document_approvals')
        .select(`
          id,
          status,
          documents!inner(
            object_id,
            entity_id
          )
        `)
        .eq('status', 'pending')
        .eq('documents.entity_id', entityId);

      if (error) throw error;

      // Count by object_id
      const counts: Record<string, number> = {};
      for (const approval of data || []) {
        const objectId = (approval.documents as any)?.object_id;
        if (objectId) {
          counts[objectId] = (counts[objectId] || 0) + 1;
        }
      }
      return counts;
    },
    enabled: !!entityId,
  });
}

interface CreateApprovalInput {
  documentId: string;
  requestedBy: string;
}

export function useCreateApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateApprovalInput) => {
      const { data, error } = await supabase
        .from('document_approvals')
        .insert({
          document_id: input.documentId,
          requested_by: input.requestedBy,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approval-counts'] });
    },
  });
}

interface UpdateApprovalInput {
  approvalId: string;
  status: 'approved' | 'rejected';
  notes?: string;
  reviewedBy: string;
}

export function useUpdateApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateApprovalInput) => {
      // Update approval record
      const { data: approval, error: approvalError } = await supabase
        .from('document_approvals')
        .update({
          status: input.status,
          notes: input.notes || null,
          reviewed_by: input.reviewedBy,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', input.approvalId)
        .select('document_id')
        .single();

      if (approvalError) throw approvalError;

      // If approved, update document status to Final
      if (input.status === 'approved' && approval) {
        const { error: docError } = await supabase
          .from('documents')
          .update({ status: 'Final' })
          .eq('id', approval.document_id);

        if (docError) throw docError;
      }

      return approval;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approval-counts'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents-by-period'] });
    },
  });
}

export function useDocumentApproval(documentId: string | null) {
  return useQuery({
    queryKey: ['document-approval', documentId],
    queryFn: async () => {
      if (!documentId) return null;

      const { data, error } = await supabase
        .from('document_approvals')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as DocumentApproval | null;
    },
    enabled: !!documentId,
  });
}
