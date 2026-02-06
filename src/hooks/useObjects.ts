import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FileObject } from '@/types/filegrid';

interface UseObjectsOptions {
  areaId: string | null;
  entityId: string | null;
}

export function useObjects({ areaId, entityId }: UseObjectsOptions) {
  return useQuery({
    queryKey: ['objects', { areaId, entityId }],
    queryFn: async () => {
      if (!areaId || !entityId) return [];

      const { data, error } = await supabase
        .from('objects')
        .select('*')
        .eq('area_id', areaId)
        .eq('entity_id', entityId)
        .order('name');

      if (error) throw error;
      return data as FileObject[];
    },
    enabled: !!(areaId && entityId)
  });
}

// Fetch all objects for an entity (used in reconciliations)
export function useAllObjectsForEntity(entityId: string | null) {
  return useQuery({
    queryKey: ['objects', 'all', entityId],
    queryFn: async () => {
      if (!entityId) return [];

      const { data, error } = await supabase
        .from('objects')
        .select(`
          *,
          areas (name, owner_name, reviewer_name, approver_name),
          processes (name)
        `)
        .eq('entity_id', entityId)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!entityId
  });
}

export function useObject(objectId: string | null) {
  return useQuery({
    queryKey: ['object', objectId],
    queryFn: async () => {
      if (!objectId) return null;

      const { data, error } = await supabase
        .from('objects')
        .select('*')
        .eq('id', objectId)
        .maybeSingle();

      if (error) throw error;
      return data as FileObject | null;
    },
    enabled: !!objectId
  });
}

interface CreateObjectInput {
  name: string;
  entityId: string;
  departmentId: string;
  processId: string;
  areaId: string;
}

interface OwnershipDefaults {
  owner_name: string | null;
  reviewer_name: string | null;
  approver_name: string | null;
  requires_approval: boolean;
  variance_threshold: number | null;
}

function getOwnershipDefaults(objectName: string): OwnershipDefaults {
  const normalized = objectName.toLowerCase();

  if (/(cash|bank)/.test(normalized)) {
    return {
      owner_name: 'Team A',
      reviewer_name: 'Controller',
      approver_name: 'Finance Director',
      requires_approval: true,
      variance_threshold: 1000,
    };
  }

  if (/(revenue|accrual)/.test(normalized)) {
    return {
      owner_name: 'Accounting',
      reviewer_name: 'Controller',
      approver_name: 'CAO',
      requires_approval: true,
      variance_threshold: 1000,
    };
  }

  return {
    owner_name: null,
    reviewer_name: null,
    approver_name: null,
    requires_approval: false,
    variance_threshold: 1000,
  };
}

export function useCreateObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateObjectInput) => {
      const ownershipDefaults = getOwnershipDefaults(input.name);
      const { data: areaDefaults, error: areaError } = await supabase
        .from('areas')
        .select('owner_name, reviewer_name, approver_name')
        .eq('id', input.areaId)
        .maybeSingle();

      if (areaError) throw areaError;

      const roleDefaults = {
        owner_name: areaDefaults?.owner_name ?? ownershipDefaults.owner_name,
        reviewer_name: areaDefaults?.reviewer_name ?? ownershipDefaults.reviewer_name,
        approver_name: areaDefaults?.approver_name ?? ownershipDefaults.approver_name,
      };

      const { data, error } = await supabase
        .from('objects')
        .insert({
          name: input.name,
          entity_id: input.entityId,
          department_id: input.departmentId,
          process_id: input.processId,
          area_id: input.areaId,
          ...ownershipDefaults,
          ...roleDefaults,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as FileObject;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['objects', { areaId: data.area_id, entityId: data.entity_id }] 
      });
      queryClient.invalidateQueries({ queryKey: ['folder-structure'] });
    }
  });
}

interface UpdateObjectInput {
  objectId: string;
  name: string;
  requiresApproval: boolean;
  ownerName?: string | null;
  reviewerName?: string | null;
  approverName?: string | null;
  varianceThreshold?: number | null;
}

export function useUpdateObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateObjectInput) => {
      const { data, error } = await supabase
        .from('objects')
        .update({
          name: input.name,
          requires_approval: input.requiresApproval,
          owner_name: input.ownerName ?? null,
          reviewer_name: input.reviewerName ?? null,
          approver_name: input.approverName ?? null,
          variance_threshold: input.varianceThreshold ?? null,
        } as any)
        .eq('id', input.objectId)
        .select()
        .single();

      if (error) throw error;
      return data as FileObject;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['objects'] });
      queryClient.invalidateQueries({ queryKey: ['object', data.id] });
      queryClient.invalidateQueries({ queryKey: ['folder-structure'] });
    }
  });
}
