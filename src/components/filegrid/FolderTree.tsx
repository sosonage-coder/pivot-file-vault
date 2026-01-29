import { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, Briefcase, FolderOpen, Folder, FileBox, ShieldCheck, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { TreeNode } from '@/types/filegrid';

interface FolderTreeProps {
  nodes: TreeNode[];
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  pendingCounts?: Record<string, number>;
  onEditObject?: (node: TreeNode) => void;
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  pendingCounts?: Record<string, number>;
  onEditObject?: (node: TreeNode) => void;
}

const iconMap = {
  entity: Building2,
  department: Briefcase,
  process: FolderOpen,
  area: Folder,
  object: FileBox
};

function TreeItem({ node, level, selectedId, onSelect, pendingCounts, onEditObject }: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const Icon = iconMap[node.type];
  
  const pendingCount = node.type === 'object' ? (pendingCounts?.[node.id] || 0) : 0;
  const requiresApproval = node.type === 'object' && node.metadata?.requires_approval;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onSelect(node);
  };

  const handleDoubleClick = () => {
    if (node.type === 'object' && onEditObject) {
      onEditObject(node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
          'hover:bg-[hsl(var(--tree-hover))]',
          isSelected && 'bg-[hsl(var(--tree-selected))] font-medium'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <span className="flex h-4 w-4 items-center justify-center">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )
          ) : (
            <span className="w-3.5" />
          )}
        </span>
        <Icon className={cn(
          'h-4 w-4',
          node.type === 'area' ? 'text-primary' : 
          node.type === 'object' ? 'text-accent-foreground' : 'text-muted-foreground'
        )} />
        <span className="flex-1 truncate">{node.name}</span>
        
        {/* Show approval indicator */}
        {requiresApproval && (
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        )}
        
        {/* Show pending approval count */}
        {pendingCount > 0 && (
          <Badge 
            variant="secondary" 
            className="h-5 bg-amber-100 px-1.5 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
          >
            <Clock className="mr-0.5 h-3 w-3" />
            {pendingCount}
          </Badge>
        )}
        
        {/* Show document count if no pending */}
        {pendingCount === 0 && typeof node.documentCount === 'number' && node.documentCount > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {node.documentCount}
          </span>
        )}
      </button>
      
      {hasChildren && isExpanded && (
        <div className="relative">
          <div 
            className="absolute left-0 top-0 bottom-0 w-px bg-[hsl(var(--tree-line))]"
            style={{ marginLeft: `${level * 12 + 18}px` }}
          />
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              pendingCounts={pendingCounts}
              onEditObject={onEditObject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({ nodes, selectedId, onSelect, pendingCounts, onEditObject }: FolderTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Folder className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          No folders yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create a process to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          level={0}
          selectedId={selectedId}
          onSelect={onSelect}
          pendingCounts={pendingCounts}
          onEditObject={onEditObject}
        />
      ))}
    </div>
  );
}
