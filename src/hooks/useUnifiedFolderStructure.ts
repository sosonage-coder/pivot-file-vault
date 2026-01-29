import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TreeNode, Department, Process, Area, FileObject, TreeNodeType } from '@/types/filegrid';
import type { Tables } from '@/integrations/supabase/types';

interface ProcessWithDepartment extends Process {
  departments: Department;
}

interface AreaWithProcess extends Area {
  processes: ProcessWithDepartment;
}

type PbcNodeRow = Tables<'pbc_nodes'>;

// Map PBC node types to sidebar TreeNodeType
const pbcNodeTypeMap: Record<string, TreeNodeType> = {
  'department': 'pbc-department',
  'process': 'pbc-process',
  'area': 'pbc-area',
  'object': 'pbc-object',
  'request': 'pbc-request',
};

// Build hierarchical tree from flat pbc_nodes
function buildPbcTreeNodes(nodes: PbcNodeRow[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];

  // First pass: create all TreeNode objects
  for (const node of nodes) {
    const treeNode: TreeNode = {
      id: node.id,
      name: node.label,
      type: pbcNodeTypeMap[node.node_type] || 'pbc-request',
      children: [],
      metadata: {
        status: node.status,
        priority: node.priority,
        due_date: node.due_date,
        node_type: node.node_type,
        parent_id: node.parent_id,
      },
    };
    nodeMap.set(node.id, treeNode);
  }

  // Second pass: build parent-child relationships
  for (const node of nodes) {
    const treeNode = nodeMap.get(node.id)!;
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      const parent = nodeMap.get(node.parent_id)!;
      parent.children = parent.children || [];
      parent.children.push(treeNode);
    } else {
      rootNodes.push(treeNode);
    }
  }

  // Clean up empty children arrays
  for (const node of nodeMap.values()) {
    if (node.children?.length === 0) {
      node.children = undefined;
    }
  }

  // Count requests in each node
  function countRequests(node: TreeNode): number {
    if (node.type === 'pbc-request') return 1;
    let count = 0;
    if (node.children) {
      for (const child of node.children) {
        count += countRequests(child);
      }
    }
    node.itemCount = count > 0 ? count : undefined;
    return count;
  }

  rootNodes.forEach(countRequests);

  return rootNodes;
}

export function useUnifiedFolderStructure(entityId: string | null, periodId: string | null) {
  return useQuery({
    queryKey: ['unified-folder-structure', entityId, periodId],
    queryFn: async (): Promise<TreeNode[]> => {
      if (!entityId) return [];

      // Fetch all processes for this entity with their departments
      const { data: processes, error: processError } = await supabase
        .from('processes')
        .select(`
          *,
          departments!inner(*)
        `)
        .eq('entity_id', entityId)
        .order('name');

      if (processError) throw processError;

      // Fetch all areas for these processes
      const processIds = (processes as ProcessWithDepartment[])?.map(p => p.id) || [];
      
      let areas: AreaWithProcess[] = [];
      if (processIds.length > 0) {
        const { data: areasData, error: areasError } = await supabase
          .from('areas')
          .select(`
            *,
            processes!inner(
              *,
              departments!inner(*)
            )
          `)
          .in('process_id', processIds)
          .order('name');

        if (areasError) throw areasError;
        areas = areasData as AreaWithProcess[];
      }

      // Get all area IDs
      const areaIds = areas.map(a => a.id);
      
      // Fetch objects for all areas
      let objects: FileObject[] = [];
      if (areaIds.length > 0) {
        const { data: objectsData, error: objectsError } = await supabase
          .from('objects')
          .select('*')
          .eq('entity_id', entityId)
          .in('area_id', areaIds)
          .order('name');

        if (!objectsError && objectsData) {
          objects = objectsData as FileObject[];
        }
      }

      // Get document counts per area and per object
      let documentCountsByArea: Record<string, number> = {};
      let documentCountsByObject: Record<string, number> = {};
      
      if (areaIds.length > 0) {
        const { data: counts, error: countError } = await supabase
          .from('documents')
          .select('area_id, object_id')
          .in('area_id', areaIds);

        if (!countError && counts) {
          documentCountsByArea = counts.reduce((acc, doc) => {
            acc[doc.area_id] = (acc[doc.area_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          documentCountsByObject = counts.reduce((acc, doc) => {
            if (doc.object_id) {
              acc[doc.object_id] = (acc[doc.object_id] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>);
        }
      }

      // Fetch PBC nodes (hierarchical tree) instead of flat pbc_items
      const pbcNodesQuery = supabase
        .from('pbc_nodes')
        .select('*')
        .eq('entity_id', entityId)
        .order('sort_order');
      
      if (periodId) {
        pbcNodesQuery.eq('period_id', periodId);
      }
      
      const { data: pbcNodes = [] } = await pbcNodesQuery;

      // Fetch Tasks grouped by department
      const tasksQuery = supabase
        .from('tasks')
        .select('*, processes(department_id)')
        .eq('entity_id', entityId);
      
      if (periodId) {
        tasksQuery.eq('period_id', periodId);
      }
      
      const { data: tasks = [] } = await tasksQuery;

      // Fetch Reconciliations grouped by department
      const reconQuery = supabase
        .from('reconciliations')
        .select('*, objects!inner(department_id, name)')
        .eq('entity_id', entityId);
      
      if (periodId) {
        reconQuery.eq('period_id', periodId);
      }
      
      const { data: reconciliations = [] } = await reconQuery;

      // Group tasks by department
      const tasksByDept: Record<string, typeof tasks> = {};
      tasks?.forEach((item: any) => {
        const deptId = item.processes?.department_id || item.department_id;
        if (deptId) {
          if (!tasksByDept[deptId]) tasksByDept[deptId] = [];
          tasksByDept[deptId].push(item);
        }
      });

      const reconByDept: Record<string, typeof reconciliations> = {};
      reconciliations?.forEach((item: any) => {
        const deptId = item.objects?.department_id;
        if (deptId) {
          if (!reconByDept[deptId]) reconByDept[deptId] = [];
          reconByDept[deptId].push(item);
        }
      });

      // Build PBC tree from nodes
      const pbcTreeNodes = buildPbcTreeNodes(pbcNodes as PbcNodeRow[]);

      // Build tree structure: Department → Modules (Documents, PBC, Tasks, Recon)
      const departmentMap = new Map<string, TreeNode>();

      for (const process of (processes as ProcessWithDepartment[]) || []) {
        const dept = process.departments;
        
        if (!departmentMap.has(dept.id)) {
          departmentMap.set(dept.id, {
            id: dept.id,
            name: dept.name,
            type: 'department',
            children: [],
            documentCount: 0,
            metadata: { entity_id: entityId }
          });
        }
      }

      // Now build each department's children
      for (const [deptId, deptNode] of departmentMap) {
        const deptProcesses = (processes as ProcessWithDepartment[])?.filter(p => p.departments.id === deptId) || [];
        
        // 1. Documents Module Node
        const documentsChildren: TreeNode[] = [];
        let totalDeptDocs = 0;
        
        for (const process of deptProcesses) {
          const processNode: TreeNode = {
            id: process.id,
            name: process.name,
            type: 'process',
            children: [],
            documentCount: 0,
            metadata: {
              department_id: deptId,
              entity_id: entityId
            }
          };

          const processAreas = areas.filter(a => a.process_id === process.id);
          for (const area of processAreas) {
            const areaDocCount = documentCountsByArea[area.id] || 0;
            
            const areaObjects = objects.filter(o => o.area_id === area.id);
            const objectNodes: TreeNode[] = areaObjects.map(obj => ({
              id: obj.id,
              name: obj.name,
              type: 'object' as const,
              documentCount: documentCountsByObject[obj.id] || 0,
              metadata: {
                department_id: deptId,
                process_id: process.id,
                area_id: area.id,
                entity_id: entityId,
                requires_approval: obj.requires_approval || false
              }
            }));

            const areaNode: TreeNode = {
              id: area.id,
              name: area.name,
              type: 'area',
              children: objectNodes.length > 0 ? objectNodes : undefined,
              documentCount: areaDocCount,
              metadata: {
                department_id: deptId,
                process_id: process.id,
                template_id: area.template_id
              }
            };

            processNode.children!.push(areaNode);
            processNode.documentCount = (processNode.documentCount || 0) + areaDocCount;
          }

          if (processNode.children!.length > 0) {
            documentsChildren.push(processNode);
            totalDeptDocs += processNode.documentCount || 0;
          }
        }

        const documentsModule: TreeNode = {
          id: `${deptId}-documents`,
          name: 'Documents',
          type: 'module-documents',
          children: documentsChildren,
          documentCount: totalDeptDocs,
          metadata: { department_id: deptId, entity_id: entityId }
        };

        // 2. PBC Module Node - now uses hierarchical tree
        const pbcModule: TreeNode = {
          id: `${deptId}-pbc`,
          name: 'PBC Requests',
          type: 'module-pbc',
          children: pbcTreeNodes.length > 0 ? pbcTreeNodes : undefined,
          itemCount: pbcNodes.length,
          metadata: { department_id: deptId, entity_id: entityId }
        };

        // 3. Tasks Module Node
        const deptTasks = tasksByDept[deptId] || [];
        const taskChildren: TreeNode[] = deptTasks.map((item: any) => ({
          id: item.id,
          name: item.title,
          type: 'task-item' as const,
          metadata: {
            status: item.status,
            priority: item.priority,
            due_date: item.due_date,
            department_id: deptId,
            entity_id: entityId
          }
        }));

        const tasksModule: TreeNode = {
          id: `${deptId}-tasks`,
          name: 'Tasks',
          type: 'module-tasks',
          children: taskChildren.length > 0 ? taskChildren : undefined,
          itemCount: deptTasks.length,
          metadata: { department_id: deptId, entity_id: entityId }
        };

        // 4. Reconciliations Module Node
        const deptRecons = reconByDept[deptId] || [];
        const reconChildren: TreeNode[] = deptRecons.map((item: any) => ({
          id: item.id,
          name: item.objects?.name || `Account ${item.id.slice(0, 8)}`,
          type: 'reconciliation-account' as const,
          metadata: {
            status: item.status,
            variance: item.variance,
            department_id: deptId,
            entity_id: entityId,
            object_id: item.object_id
          }
        }));

        const reconModule: TreeNode = {
          id: `${deptId}-reconciliations`,
          name: 'Reconciliations',
          type: 'module-reconciliations',
          children: reconChildren.length > 0 ? reconChildren : undefined,
          itemCount: deptRecons.length,
          metadata: { department_id: deptId, entity_id: entityId }
        };

        // Add all modules to department
        deptNode.children = [documentsModule, pbcModule, tasksModule, reconModule];
        deptNode.documentCount = totalDeptDocs;
      }

      return Array.from(departmentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!entityId
  });
}
