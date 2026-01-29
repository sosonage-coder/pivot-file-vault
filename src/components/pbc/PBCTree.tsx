import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { TreeNode } from '@/types/filegrid';
import type { PbcItemWithRelations } from '@/hooks/usePBCItems';

export interface PBCTreeNode {
  id: string;
  name: string;
  type: 'department' | 'process' | 'area' | 'item';
  children?: PBCTreeNode[];
  itemCount?: number;
  pbcItem?: PbcItemWithRelations;
  status?: string;
}

interface PBCTreeProps {
  nodes: PBCTreeNode[];
  selectedId: string | null;
  onSelect: (node: PBCTreeNode) => void;
}

export function PBCTree({ nodes, selectedId, onSelect }: PBCTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <FileText className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">No PBC items found</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={0}
        />
      ))}
    </div>
  );
}

interface TreeNodeItemProps {
  node: PBCTreeNode;
  selectedId: string | null;
  onSelect: (node: PBCTreeNode) => void;
  depth: number;
}

function TreeNodeItem({ node, selectedId, onSelect, depth }: TreeNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isFolder = node.type !== 'item';

  const statusColors: Record<string, string> = {
    Requested: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    Uploaded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Reviewed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    Complete: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <div>
      <div
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors',
          'hover:bg-accent',
          isSelected && 'bg-accent text-accent-foreground'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          }
          onSelect(node);
        }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-4" />
        )}
        
        {isFolder ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-amber-500" />
          )
        ) : (
          <CircleDot className="h-4 w-4 shrink-0 text-primary" />
        )}
        
        <span className="flex-1 truncate">{node.name}</span>
        
        {node.status && (
          <Badge variant="secondary" className={cn('text-xs', statusColors[node.status])}>
            {node.status}
          </Badge>
        )}
        
        {node.itemCount !== undefined && node.itemCount > 0 && !node.status && (
          <Badge variant="secondary" className="text-xs">
            {node.itemCount}
          </Badge>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeItem
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

// Build tree from PBC items using folder structure
export function usePBCTree(
  items: PbcItemWithRelations[],
  folderStructure: TreeNode[]
): PBCTreeNode[] {
  return useMemo(() => {
    // Group items by area
    const itemsByArea = new Map<string, PbcItemWithRelations[]>();
    items.forEach((item) => {
      const existing = itemsByArea.get(item.area_id) || [];
      existing.push(item);
      itemsByArea.set(item.area_id, existing);
    });

    // Build tree from folder structure, only including nodes with items
    const buildTree = (nodes: TreeNode[]): PBCTreeNode[] => {
      const result: PBCTreeNode[] = [];

      for (const node of nodes) {
        let itemCount = 0;
        let children: PBCTreeNode[] = [];

        if (node.type === 'area') {
          const areaItems = itemsByArea.get(node.id) || [];
          itemCount = areaItems.length;
          children = areaItems.map((item) => ({
            id: item.id,
            name: item.document_types.name,
            type: 'item' as const,
            pbcItem: item,
            status: item.status,
          }));
        } else if (node.children) {
          children = buildTree(node.children);
          itemCount = children.reduce((sum, c) => sum + (c.itemCount || 0), 0);
        }

        // Only include nodes that have items
        if (itemCount > 0 || children.length > 0) {
          result.push({
            id: node.id,
            name: node.name,
            type: node.type as 'department' | 'process' | 'area',
            children: children.length > 0 ? children : undefined,
            itemCount,
          });
        }
      }

      return result;
    };

    return buildTree(folderStructure);
  }, [items, folderStructure]);
}
