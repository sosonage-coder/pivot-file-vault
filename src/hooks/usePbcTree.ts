import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  PbcNode, 
  PbcTreeNode, 
  PbcCompletion, 
  CreatePbcNodeInput, 
  UpdatePbcNodeInput 
} from '@/types/pbc-tree';
import type { PbcStatus } from '@/types/filegrid';
import { useMemo } from 'react';

interface UsePbcTreeOptions {
  entityId: string | null;
  periodId?: string | null;
}

/** Fetch all PBC nodes for an entity/period and build tree structure */
export function usePbcTree({ entityId, periodId }: UsePbcTreeOptions) {
  const query = useQuery({
    queryKey: ['pbc-nodes', entityId, periodId],
    queryFn: async () => {
      if (!entityId) return [];

      let q = supabase
        .from('pbc_nodes')
        .select(`
          *,
          pbc_templates(id, name, area_type, min_depth, max_depth, description),
          areas(name),
          objects(name)
        `)
        .eq('entity_id', entityId)
        .order('sort_order', { ascending: true });

      if (periodId) {
        q = q.eq('period_id', periodId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!entityId,
  });

  // Build tree structure from flat data
  const tree = useMemo(() => {
    if (!query.data) return [];
    return buildPbcTree(query.data as any[]);
  }, [query.data]);

  // Calculate stats
  const stats = useMemo(() => {
    return calculateTreeStats(tree);
  }, [tree]);

  return {
    ...query,
    tree,
    stats,
  };
}

/** Build hierarchical tree from flat node array */
function buildPbcTree(nodes: any[]): PbcTreeNode[] {
  const nodeMap = new Map<string, PbcTreeNode>();
  const roots: PbcTreeNode[] = [];

  // First pass: create tree nodes
  for (const node of nodes) {
    const treeNode: PbcTreeNode = {
      ...node,
      node_type: node.node_type as any,
      children: [],
      depth: 0,
      completion: { total: 0, complete: 0, percentage: 0 },
      template: node.pbc_templates || undefined,
      areaName: node.areas?.name,
      objectName: node.objects?.name,
    };
    nodeMap.set(node.id, treeNode);
  }

  // Second pass: build parent-child relationships
  for (const node of nodes) {
    const treeNode = nodeMap.get(node.id)!;
    if (node.parent_id) {
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        parent.children.push(treeNode);
        treeNode.depth = parent.depth + 1;
      }
    } else {
      roots.push(treeNode);
    }
  }

  // Third pass: calculate depths for nested nodes and completion
  function setDepthAndCompletion(node: PbcTreeNode, depth: number): PbcCompletion {
    node.depth = depth;
    
    if (node.node_type === 'request') {
      const isComplete = node.status === 'Complete';
      node.completion = {
        total: 1,
        complete: isComplete ? 1 : 0,
        percentage: isComplete ? 100 : 0,
      };
      return node.completion;
    }

    // Aggregate from children
    let total = 0;
    let complete = 0;
    for (const child of node.children) {
      const childCompletion = setDepthAndCompletion(child, depth + 1);
      total += childCompletion.total;
      complete += childCompletion.complete;
    }

    node.completion = {
      total,
      complete,
      percentage: total > 0 ? Math.round((complete / total) * 100) : 0,
    };
    return node.completion;
  }

  for (const root of roots) {
    setDepthAndCompletion(root, 0);
  }

  return roots;
}

/** Calculate overall stats from tree */
function calculateTreeStats(tree: PbcTreeNode[]) {
  const stats = {
    Requested: 0,
    Uploaded: 0,
    Reviewed: 0,
    Complete: 0,
    total: 0,
    overdue: 0,
  };

  const today = new Date().toISOString().split('T')[0];

  function traverse(node: PbcTreeNode) {
    if (node.node_type === 'request' && node.status) {
      stats[node.status as PbcStatus]++;
      stats.total++;
      if (node.due_date && node.due_date < today && node.status !== 'Complete') {
        stats.overdue++;
      }
    }
    for (const child of node.children) {
      traverse(child);
    }
  }

  for (const root of tree) {
    traverse(root);
  }

  return stats;
}

/** Create a new PBC node */
export function useCreatePbcNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePbcNodeInput) => {
      const insertData = {
        entity_id: input.entityId,
        period_id: input.periodId,
        department_id: input.departmentId || null,
        parent_id: input.parentId || null,
        node_type: input.nodeType as 'department' | 'process' | 'area' | 'object' | 'request',
        label: input.label,
        pbc_template_id: input.templateId || null,
        area_id: input.areaId || null,
        object_id: input.objectId || null,
        sort_order: input.sortOrder ?? 0,
        notes: input.notes || null,
        priority: input.priority || 'normal',
        // Request-specific fields (null for non-requests)
        status: input.nodeType === 'request' ? (input.status || 'Requested') : null,
        assignee_id: input.nodeType === 'request' ? (input.assigneeId || null) : null,
        due_date: input.nodeType === 'request' ? (input.dueDate || null) : null,
      };

      const { data, error } = await supabase
        .from('pbc_nodes')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pbc-nodes', variables.entityId] });
    },
  });
}

/** Update a PBC node */
export function useUpdatePbcNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, entityId, ...updates }: UpdatePbcNodeInput) => {
      const updateData: Record<string, unknown> = {};
      
      if (updates.label !== undefined) updateData.label = updates.label;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.assigneeId !== undefined) updateData.assignee_id = updates.assigneeId;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;

      const { data, error } = await supabase
        .from('pbc_nodes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, entityId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pbc-nodes', result.entityId] });
    },
  });
}

/** Delete a PBC node (cascades to children) */
export function useDeletePbcNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, entityId }: { id: string; entityId: string }) => {
      const { error } = await supabase
        .from('pbc_nodes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { entityId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pbc-nodes', result.entityId] });
    },
  });
}

/** Find a node by ID in the tree */
export function findNodeInTree(tree: PbcTreeNode[], nodeId: string): PbcTreeNode | null {
  for (const node of tree) {
    if (node.id === nodeId) return node;
    const found = findNodeInTree(node.children, nodeId);
    if (found) return found;
  }
  return null;
}

/** Get all ancestor IDs for a node */
export function getAncestorIds(tree: PbcTreeNode[], nodeId: string): string[] {
  const ancestors: string[] = [];
  
  function findPath(nodes: PbcTreeNode[], targetId: string, path: string[]): boolean {
    for (const node of nodes) {
      if (node.id === targetId) {
        ancestors.push(...path);
        return true;
      }
      if (findPath(node.children, targetId, [...path, node.id])) {
        return true;
      }
    }
    return false;
  }

  findPath(tree, nodeId, []);
  return ancestors;
}
