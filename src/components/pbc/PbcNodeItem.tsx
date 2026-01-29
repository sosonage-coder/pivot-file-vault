import { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Briefcase, 
  GitBranch, 
  FileBox, 
  ClipboardCheck,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PbcCompletionBadge } from './PbcCompletionBadge';
import type { PbcTreeNode, PbcNodeType } from '@/types/pbc-tree';
import { PBC_STATUS_COLORS, PBC_NODE_CONFIG } from '@/types/pbc-tree';

interface PbcNodeItemProps {
  node: PbcTreeNode;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (node: PbcTreeNode) => void;
  onToggle: (nodeId: string) => void;
  onAddChild?: (parentNode: PbcTreeNode) => void;
  onEdit?: (node: PbcTreeNode) => void;
  onDelete?: (node: PbcTreeNode) => void;
}

const NODE_ICONS: Record<PbcNodeType, React.ElementType> = {
  area: Briefcase,
  dimension: GitBranch,
  object: FileBox,
  request: ClipboardCheck,
};

export function PbcNodeItem({
  node,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
}: PbcNodeItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const hasChildren = node.children.length > 0;
  const config = PBC_NODE_CONFIG[node.node_type];
  const Icon = NODE_ICONS[node.node_type];
  const canAddChild = config.canHaveChildren;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(node.id);
    }
    onSelect(node);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddChild?.(node);
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer',
        'hover:bg-accent',
        isSelected && 'bg-accent text-accent-foreground'
      )}
      style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Expand/collapse chevron */}
      {hasChildren ? (
        isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )
      ) : (
        <span className="w-4" />
      )}

      {/* Node type icon */}
      <Icon className={cn('h-4 w-4 shrink-0', config.colorClass)} />

      {/* Label */}
      <span className="flex-1 truncate">{node.label}</span>

      {/* Status badge for requests */}
      {node.node_type === 'request' && node.status && (
        <Badge 
          variant="secondary" 
          className={cn('text-xs', PBC_STATUS_COLORS[node.status])}
        >
          {node.status}
        </Badge>
      )}

      {/* Completion badge for non-requests */}
      {node.node_type !== 'request' && node.completion.total > 0 && (
        <PbcCompletionBadge completion={node.completion} />
      )}

      {/* Actions menu (visible on hover) */}
      {isHovered && (onAddChild || onEdit || onDelete) && (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          {canAddChild && onAddChild && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleAddChild}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(node)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(node)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
