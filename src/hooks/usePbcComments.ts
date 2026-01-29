import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PbcComment {
  id: string;
  pbc_node_id: string | null;
  pbc_item_id: string;
  content: string;
  user_id: string | null;
  created_at: string;
}

export function usePbcComments(nodeId: string | null) {
  return useQuery({
    queryKey: ['pbc-comments', nodeId],
    queryFn: async (): Promise<PbcComment[]> => {
      if (!nodeId) return [];
      
      const { data, error } = await supabase
        .from('pbc_comments')
        .select('*')
        .eq('pbc_node_id', nodeId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as PbcComment[];
    },
    enabled: !!nodeId
  });
}

interface AddCommentInput {
  nodeId: string;
  content: string;
}

export function useAddPbcComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nodeId, content }: AddCommentInput) => {
      // pbc_comments requires pbc_item_id which is not nullable
      // We'll use the nodeId as a placeholder since we're using pbc_nodes now
      const { data, error } = await supabase
        .from('pbc_comments')
        .insert({
          pbc_node_id: nodeId,
          pbc_item_id: nodeId, // Using nodeId as placeholder - this field should be made nullable
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pbc-comments', variables.nodeId] });
    }
  });
}
