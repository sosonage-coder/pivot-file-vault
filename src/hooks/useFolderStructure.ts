import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TreeNode, Department, Process, Area } from '@/types/filegrid';

interface ProcessWithDepartment extends Process {
  departments: Department;
}

interface AreaWithProcess extends Area {
  processes: ProcessWithDepartment;
}

export function useFolderStructure(entityId: string | null) {
  return useQuery({
    queryKey: ['folder-structure', entityId],
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

      // Get document counts per area
      const areaIds = areas.map(a => a.id);
      let documentCounts: Record<string, number> = {};
      
      if (areaIds.length > 0) {
        const { data: counts, error: countError } = await supabase
          .from('documents')
          .select('area_id')
          .in('area_id', areaIds);

        if (!countError && counts) {
          documentCounts = counts.reduce((acc, doc) => {
            acc[doc.area_id] = (acc[doc.area_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      // Build tree structure: Department → Process → Area
      const departmentMap = new Map<string, TreeNode>();

      for (const process of (processes as ProcessWithDepartment[]) || []) {
        const dept = process.departments;
        
        if (!departmentMap.has(dept.id)) {
          departmentMap.set(dept.id, {
            id: dept.id,
            name: dept.name,
            type: 'department',
            children: [],
            documentCount: 0
          });
        }

        const deptNode = departmentMap.get(dept.id)!;
        
        const processNode: TreeNode = {
          id: process.id,
          name: process.name,
          type: 'process',
          children: [],
          documentCount: 0,
          metadata: {
            department_id: dept.id,
            entity_id: entityId
          }
        };

        // Add areas to this process
        const processAreas = areas.filter(a => a.process_id === process.id);
        for (const area of processAreas) {
          const areaDocCount = documentCounts[area.id] || 0;
          processNode.children!.push({
            id: area.id,
            name: area.name,
            type: 'area',
            documentCount: areaDocCount,
            metadata: {
              department_id: dept.id,
              process_id: process.id,
              template_id: area.template_id
            }
          });
          processNode.documentCount = (processNode.documentCount || 0) + areaDocCount;
        }

        deptNode.children!.push(processNode);
        deptNode.documentCount = (deptNode.documentCount || 0) + (processNode.documentCount || 0);
      }

      return Array.from(departmentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!entityId
  });
}
