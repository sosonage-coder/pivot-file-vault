import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TreeNode, Department, Process, Area, FileObject } from '@/types/filegrid';

interface ProcessWithDepartment extends Process {
  departments: Department;
}

interface AreaWithProcess extends Area {
  processes: ProcessWithDepartment;
}

export type FeatureType = 'documents' | 'pbc';

interface UseFeatureFolderStructureOptions {
  entityId: string | null;
  periodId: string | null;
  featureType: FeatureType;
}

/**
 * Builds a Process → Area → Object tree for feature pages (Documents, PBC)
 * This replaces the department-centric view with a flat feature-first tree.
 */
export function useFeatureFolderStructure({
  entityId,
  periodId,
  featureType,
}: UseFeatureFolderStructureOptions) {
  return useQuery({
    queryKey: ['feature-folder-structure', entityId, periodId, featureType],
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

      // Get counts based on feature type
      let countsByObject: Record<string, number> = {};
      
      if (featureType === 'documents' && areaIds.length > 0) {
        // Get document counts per object
        let docQuery = supabase
          .from('documents')
          .select('object_id')
          .in('area_id', areaIds);
        
        if (periodId) {
          docQuery = docQuery.eq('period_id', periodId);
        }
        
        const { data: counts } = await docQuery;
        
        if (counts) {
          countsByObject = counts.reduce((acc, doc) => {
            if (doc.object_id) {
              acc[doc.object_id] = (acc[doc.object_id] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>);
        }
      } else if (featureType === 'pbc') {
        // Get PBC request counts per object
        let pbcQuery = supabase
          .from('pbc_nodes')
          .select('object_id')
          .eq('entity_id', entityId)
          .eq('node_type', 'request');
        
        if (periodId) {
          pbcQuery = pbcQuery.eq('period_id', periodId);
        }
        
        const { data: pbcNodes } = await pbcQuery;
        
        if (pbcNodes) {
          countsByObject = pbcNodes.reduce((acc, node) => {
            if (node.object_id) {
              acc[node.object_id] = (acc[node.object_id] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>);
        }
      }

      // Build tree: Process → Area → Object (no department grouping)
      const processNodes: TreeNode[] = [];

      for (const process of (processes as ProcessWithDepartment[]) || []) {
        const processAreas = areas.filter(a => a.process_id === process.id);
        
        if (processAreas.length === 0) continue;
        
        const areaNodes: TreeNode[] = [];
        let processItemCount = 0;

        for (const area of processAreas) {
          const areaObjects = objects.filter(o => o.area_id === area.id);
          
          const objectNodes: TreeNode[] = areaObjects.map(obj => {
            const count = countsByObject[obj.id] || 0;
            return {
              id: obj.id,
              name: obj.name,
              type: 'object' as const,
              documentCount: featureType === 'documents' ? count : undefined,
              itemCount: featureType === 'pbc' ? count : undefined,
              metadata: {
                department_id: process.departments.id,
                process_id: process.id,
                area_id: area.id,
                entity_id: entityId,
                requires_approval: obj.requires_approval || false,
              },
            };
          });

          const areaItemCount = objectNodes.reduce(
            (sum, o) => sum + ((featureType === 'documents' ? o.documentCount : o.itemCount) || 0),
            0
          );

          areaNodes.push({
            id: area.id,
            name: area.name,
            type: 'area' as const,
            children: objectNodes.length > 0 ? objectNodes : undefined,
            documentCount: featureType === 'documents' ? areaItemCount : undefined,
            itemCount: featureType === 'pbc' ? areaItemCount : undefined,
            metadata: {
              department_id: process.departments.id,
              process_id: process.id,
              entity_id: entityId,
              template_id: area.template_id,
            },
          });

          processItemCount += areaItemCount;
        }

        if (areaNodes.length > 0) {
          processNodes.push({
            id: process.id,
            name: process.name,
            type: 'process' as const,
            children: areaNodes,
            documentCount: featureType === 'documents' ? processItemCount : undefined,
            itemCount: featureType === 'pbc' ? processItemCount : undefined,
            metadata: {
              department_id: process.departments.id,
              department_name: process.departments.name,
              entity_id: entityId,
            },
          });
        }
      }

      return processNodes;
    },
    enabled: !!entityId,
  });
}
