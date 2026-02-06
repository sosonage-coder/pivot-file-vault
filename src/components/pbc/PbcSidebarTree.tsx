import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { PbcTreeNode } from '@/types/pbc-tree';

interface PbcSidebarTreeProps {
  nodes: PbcTreeNode[];
  selectedId: string | null;
  onSelect: (node: PbcTreeNode) => void;
}

export function PbcSidebarTree({ nodes, selectedId, onSelect }: PbcSidebarTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-muted-foreground">
        No PBC items found
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <PbcTreeNodeItem
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

interface PbcTreeNodeItemProps {
  node: PbcTreeNode;
  selectedId: string | null;
  onSelect: (node: PbcTreeNode) => void;
  depth: number;
}

function PbcTreeNodeItem({ node, selectedId, onSelect, depth }: PbcTreeNodeItemProps) {
  const [isOpen, setIsOpen] = useState(depth < 2); // Auto-expand first 2 levels
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedId;
  const isRequest = node.node_type === 'request';
  
  // Get request count for non-request nodes
  const requestCount = useMemo(() => {
    if (isRequest) return 0;
    return node.completion?.total || 0;
  }, [isRequest, node.completion]);
  
  // Get completion percentage for badge color
  const completionPct = node.completion?.percentage || 0;
  
  const getNodeIcon = () => {
    if (isRequest) return <FileText className="h-3.5 w-3.5 text-amber-500" />;
    if (isOpen && hasChildren) return <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />;
    return <Folder className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const handleClick = () => {
    onSelect(node);
    if (hasChildren) {
      setIsOpen(!isOpen);
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
        
        {/* Icon */}
        {getNodeIcon()}
        
        {/* Label */}
        <span className="flex-1 truncate">{node.label}</span>
        
        {/* Request count badge or status */}
        {isRequest ? (
          <Badge
            variant={node.status === 'Complete' ? 'default' : 'secondary'}
            className={cn(
              'h-4 px-1.5 text-[10px]',
              node.status === 'Complete' && 'bg-green-500/10 text-green-600',
              node.status === 'Requested' && 'bg-amber-500/10 text-amber-600'
            )}
          >
            {node.status}
          </Badge>
        ) : requestCount > 0 ? (
          <Badge
            variant="secondary"
            className={cn(
              'h-4 px-1.5 text-[10px]',
              completionPct === 100 && 'bg-green-500/10 text-green-600',
              completionPct > 0 && completionPct < 100 && 'bg-blue-500/10 text-blue-600'
            )}
          >
            {node.completion?.complete}/{requestCount}
          </Badge>
        ) : null}
      </button>

      {/* Children */}
      {hasChildren && isOpen && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <PbcTreeNodeItem
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
