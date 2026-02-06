import { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useReconciliations } from '@/hooks/useReconciliations';

export interface ReconciliationFolderNode {
  id: string;
  name: string;
  type: 'category' | 'subcategory';
  children?: ReconciliationFolderNode[];
  // Stats for folders
  total?: number;
  certified?: number;
  // For filtering accounts on page
  areaId?: string;
  departmentId?: string;
}

interface ReconciliationSidebarTreeProps {
  entityId: string | null;
  periodId?: string | null;
  selectedId: string | null;
  onSelectNode: (node: ReconciliationFolderNode) => void;
}

export function ReconciliationSidebarTree({
  entityId,
  periodId,
  selectedId,
  onSelectNode,
}: ReconciliationSidebarTreeProps) {
  const { data: reconciliations = [], isLoading } = useReconciliations(entityId, periodId);
  
  // Build hierarchical tree: Category (Department) → Subcategory (Area)
  // Accounts will be shown on the page, not in the sidebar
  const tree = useMemo((): ReconciliationFolderNode[] => {
    if (!reconciliations.length) return [];

    const deptMap = new Map<string, {
      id: string;
      name: string;
      areas: Map<string, {
        id: string;
        name: string;
        total: number;
        certified: number;
      }>;
    }>();

    for (const recon of reconciliations) {
      const obj = recon.objects;
      if (!obj) continue;

      const deptId = obj.department_id || 'unknown';
      const areaId = obj.area_id || 'general';
      const areaName = obj.areas?.name || 'General';
      const deptName = obj.processes?.name || 'Finance'; // Use process name as category

      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, {
          id: deptId,
          name: deptName,
          areas: new Map(),
        });
      }

      const dept = deptMap.get(deptId)!;
      if (!dept.areas.has(areaId)) {
        dept.areas.set(areaId, {
          id: areaId,
          name: areaName,
          total: 0,
          certified: 0,
        });
      }

      const area = dept.areas.get(areaId)!;
      area.total++;
      if (recon.status === 'certified') {
        area.certified++;
      }
    }

    // Convert to tree structure - only 2 levels (Category → Subcategory)
    const nodes: ReconciliationFolderNode[] = [];
    for (const [deptId, dept] of deptMap) {
      const subcategoryNodes: ReconciliationFolderNode[] = [];
      let deptTotal = 0;
      let deptCertified = 0;

      for (const [areaId, area] of dept.areas) {
        deptTotal += area.total;
        deptCertified += area.certified;

        subcategoryNodes.push({
          id: `area-${areaId}`,
          name: area.name,
          type: 'subcategory',
          total: area.total,
          certified: area.certified,
          areaId: areaId,
          departmentId: deptId,
        });
      }

      nodes.push({
        id: `dept-${deptId}`,
        name: dept.name,
        type: 'category',
        children: subcategoryNodes.sort((a, b) => a.name.localeCompare(b.name)),
        total: deptTotal,
        certified: deptCertified,
        departmentId: deptId,
      });
    }

    return nodes.sort((a, b) => a.name.localeCompare(b.name));
  }, [reconciliations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Folder className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          No reconciliations yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create a reconciliation to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <ReconciliationTreeNode
          key={node.id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelectNode}
          depth={0}
        />
      ))}
    </div>
  );
}

interface ReconciliationTreeNodeProps {
  node: ReconciliationFolderNode;
  selectedId: string | null;
  onSelect: (node: ReconciliationFolderNode) => void;
  depth: number;
}

function ReconciliationTreeNode({ node, selectedId, onSelect, depth }: ReconciliationTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 1); // Auto-expand first level
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedId;
  const isCategory = node.type === 'category';
  
  const handleClick = () => {
    if (isCategory && hasChildren) {
      // Categories toggle expand/collapse
      setIsOpen(!isOpen);
    } else {
      // Subcategories are selectable - will show accounts on page
      onSelect(node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
          'hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          isSelected && 'bg-accent ring-1 ring-primary/20'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {/* Expand/Collapse Arrow */}
        {hasChildren ? (
          <span className="flex h-4 w-4 items-center justify-center">
            {isOpen ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </span>
        ) : (
          <span className="w-4" />
        )}
        
        {/* Folder Icon */}
        {isOpen && hasChildren ? (
          <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <Folder className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        
        {/* Label */}
        <span className="flex-1 truncate">{node.name}</span>
        
        {/* Count Badge */}
        {node.total !== undefined && node.total > 0 && (
          <Badge
            variant="secondary"
            className={cn(
              'h-4 px-1.5 text-[10px]',
              node.certified === node.total && 'bg-primary/10 text-primary'
            )}
          >
            {node.certified}/{node.total}
          </Badge>
        )}
      </button>

      {/* Children */}
      {hasChildren && isOpen && (
        <div className="mt-0.5">
          {node.children!.map((child) => (
            <ReconciliationTreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
