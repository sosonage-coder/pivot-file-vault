import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DocumentWithRelations } from '@/types/filegrid';

export interface PbcAttachment {
  id: string;
  pbc_node_id: string;
  entity_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export function usePbcAttachments(nodeId: string | null) {
  return useQuery({
    queryKey: ['pbc-attachments', nodeId],
    queryFn: async (): Promise<PbcAttachment[]> => {
      if (!nodeId) return [];
      
      const { data, error } = await supabase
        .from('pbc_attachments')
        .select('*')
        .eq('pbc_node_id', nodeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PbcAttachment[];
    },
    enabled: !!nodeId
  });
}

interface UploadAttachmentInput {
  nodeId: string;
  entityId: string;
  file: File;
}

export function useUploadPbcAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nodeId, entityId, file }: UploadAttachmentInput) => {
      // Generate unique file path
      const fileName = `${nodeId}/${Date.now()}-${file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('pbc-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pbc-files')
        .getPublicUrl(fileName);

      // Create attachment record
      const { data, error } = await supabase
        .from('pbc_attachments')
        .insert({
          pbc_node_id: nodeId,
          entity_id: entityId,
          file_name: file.name,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, publicUrl: urlData.publicUrl };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pbc-attachments', variables.nodeId] });
    }
  });
}

export function useDeletePbcAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath, nodeId }: { id: string; filePath: string; nodeId: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('pbc-files')
        .remove([filePath]);

      if (storageError) console.warn('Storage delete failed:', storageError);

      // Delete record
      const { error } = await supabase
        .from('pbc_attachments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { nodeId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pbc-attachments', result.nodeId] });
    }
  });
}


interface UploadPbcFileInput {
  file: File;
  folder?: string;
}

export function useUploadPbcFile() {
  return useMutation({
    mutationFn: async ({ file, folder = 'evidence' }: UploadPbcFileInput) => {
      const filePath = `${folder}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('pbc-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('pbc-files').getPublicUrl(filePath);
      return { filePath, publicUrl: data.publicUrl };
    },
  });
}

export function usePbcEvidenceDocuments(nodeId: string | null, entityId: string) {
  return useQuery({
    queryKey: ['pbc-evidence-documents', nodeId, entityId],
    queryFn: async (): Promise<DocumentWithRelations[]> => {
      if (!nodeId) return [];

      const { data: attachments, error: attachmentError } = await supabase
        .from('pbc_attachments')
        .select('file_path')
        .eq('pbc_node_id', nodeId);

      if (attachmentError) throw attachmentError;
      if (!attachments?.length) return [];

      const urls = attachments.map((attachment) =>
        supabase.storage.from('pbc-files').getPublicUrl(attachment.file_path).data.publicUrl
      );

      const { data: documents, error } = await supabase
        .from('documents')
        .select(`
          *,
          objects(*),
          periods(*),
          document_types(*),
          areas!inner(
            *,
            processes!inner(
              *,
              departments!inner(*)
            )
          )
        `)
        .eq('entity_id', entityId)
        .in('external_file_url', urls)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (documents ?? []) as DocumentWithRelations[];
    },
    enabled: Boolean(nodeId && entityId),
  });
}
