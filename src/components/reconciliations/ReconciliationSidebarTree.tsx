import { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder,
  FolderOpen,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useReconciliations } from '@/hooks/useReconciliations';

export interface ReconciliationFolderNode {
  id: string;
  name: string;
  type: 'department' | 'area' | 'account';
  children?: ReconciliationFolderNode[];
  // For accounts
  objectId?: string;
  reconciliationId?: string;
  status?: string;
  glBalance?: number;
  variance?: number;
  // Stats for folders
  total?: number;
  certified?: number;
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
  
  // Build hierarchical tree: Department → Area → Account
  const tree = useMemo((): ReconciliationFolderNode[] => {
    if (!reconciliations.length) return [];

    const deptMap = new Map<string, {
      id: string;
      name: string;
      areas: Map<string, {
        id: string;
        name: string;
        accounts: ReconciliationFolderNode[];
      }>;
    }>();

    for (const recon of reconciliations) {
      const obj = recon.objects;
      if (!obj) continue;

      const deptId = obj.department_id || 'unknown';
      // Use area name from the object's area relationship
      const areaId = obj.area_id || 'general';
      const areaName = obj.areas?.name || 'General';
      
      // Get department name - we don't have it in the current query, use placeholder
      const deptName = 'Finance'; // Default since we don't fetch department name

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
          accounts: [],
        });
      }

      const area = dept.areas.get(areaId)!;
      area.accounts.push({
        id: recon.id,
        name: obj.name,
        type: 'account',
        objectId: recon.object_id,
        reconciliationId: recon.id,
        status: recon.status,
        glBalance: recon.gl_balance || undefined,
        variance: recon.variance || undefined,
      });
    }

    // Convert to tree structure
    const nodes: ReconciliationFolderNode[] = [];
    for (const [, dept] of deptMap) {
      const areaNodes: ReconciliationFolderNode[] = [];
      let deptTotal = 0;
      let deptCertified = 0;

      for (const [areaId, area] of dept.areas) {
        const areaTotal = area.accounts.length;
        const areaCertified = area.accounts.filter(a => a.status === 'certified').length;
        deptTotal += areaTotal;
        deptCertified += areaCertified;

        areaNodes.push({
          id: `area-${areaId}`,
          name: area.name,
          type: 'area',
          children: area.accounts,
          total: areaTotal,
          certified: areaCertified,
        });
      }

      nodes.push({
        id: `dept-${dept.id}`,
        name: dept.name,
        type: 'department',
        children: areaNodes,
        total: deptTotal,
        certified: deptCertified,
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
        <FileText className="h-10 w-10 text-muted-foreground/50" />
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
  const isAccount = node.type === 'account';
  
  const getNodeIcon = () => {
    if (isAccount) return <FileText className="h-3.5 w-3.5 text-primary" />;
    if (isOpen && hasChildren) return <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />;
    return <Folder className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const handleClick = () => {
    if (isAccount) {
      onSelect(node);
    } else if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  const getStatusBadge = () => {
    if (!isAccount || !node.status) return null;
    const statusColors: Record<string, string> = {
      not_started: 'bg-muted text-muted-foreground',
      in_progress: 'bg-primary/10 text-primary',
      pending_review: 'bg-accent text-accent-foreground',
      approved: 'bg-primary/20 text-primary',
      certified: 'bg-primary/30 text-primary',
      rejected: 'bg-destructive/10 text-destructive',
    };
    const labels: Record<string, string> = {
      not_started: 'New',
      in_progress: 'WIP',
      pending_review: 'Review',
      approved: 'OK',
      certified: '✓',
      rejected: '!',
    };
    return (
      <Badge
        variant="secondary"
        className={cn('h-4 px-1.5 text-[10px]', statusColors[node.status])}
      >
        {labels[node.status] || node.status}
      </Badge>
    );
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
        
        {/* Icon */}
        {getNodeIcon()}
        
        {/* Label */}
        <span className="flex-1 truncate">{node.name}</span>
        
        {/* Badge - status for accounts, count for folders */}
        {isAccount ? (
          getStatusBadge()
        ) : node.total !== undefined && node.total > 0 ? (
          <Badge
            variant="secondary"
            className={cn(
              'h-4 px-1.5 text-[10px]',
              node.certified === node.total && 'bg-primary/10 text-primary'
            )}
          >
            {node.certified}/{node.total}
          </Badge>
        ) : null}
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
