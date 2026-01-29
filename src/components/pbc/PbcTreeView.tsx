import { useState, useCallback } from 'react';
import { FileText, Plus, ChevronDown, ChevronRight, Expand, Shrink, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PbcNodeItem } from './PbcNodeItem';
import { PbcCompletionBadge } from './PbcCompletionBadge';
import type { PbcTreeNode } from '@/types/pbc-tree';

interface PbcTreeViewProps {
  tree: PbcTreeNode[];
  selectedNodeId: string | null;
  onSelectNode: (node: PbcTreeNode | null) => void;
  onAddNode?: (parentNode: PbcTreeNode | null) => void;
  onEditNode?: (node: PbcTreeNode) => void;
  onDeleteNode?: (node: PbcTreeNode) => void;
  isLoading?: boolean;
  className?: string;
}

export function PbcTreeView({
  tree,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onEditNode,
  onDeleteNode,
  isLoading,
  className,
}: PbcTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Auto-expand first two levels
    const expanded = new Set<string>();
    const expandLevel = (nodes: PbcTreeNode[], depth: number) => {
      if (depth >= 2) return;
      for (const node of nodes) {
        if (node.children.length > 0) {
          expanded.add(node.id);
          expandLevel(node.children, depth + 1);
        }
      }
    };
    expandLevel(tree, 0);
    return expanded;
  });

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collect = (nodes: PbcTreeNode[]) => {
      for (const node of nodes) {
        if (node.children.length > 0) {
          allIds.add(node.id);
          collect(node.children);
        }
      }
    };
    collect(tree);
    setExpandedNodes(allIds);
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Calculate overall completion
  const overallCompletion = tree.reduce(
    (acc, node) => ({
      total: acc.total + node.completion.total,
      complete: acc.complete + node.completion.complete,
      percentage: 0,
    }),
    { total: 0, complete: 0, percentage: 0 }
  );
  overallCompletion.percentage = overallCompletion.total > 0 
    ? Math.round((overallCompletion.complete / overallCompletion.total) * 100) 
    : 0;

  const renderNode = (node: PbcTreeNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id}>
        <PbcNodeItem
          node={node}
          isSelected={isSelected}
          isExpanded={isExpanded}
          onSelect={onSelectNode}
          onToggle={toggleNode}
          onAddChild={onAddNode}
          onEdit={onEditNode}
          onDelete={onDeleteNode}
        />
        {isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map(renderNode)}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="text-muted-foreground">Loading PBC tree...</div>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
        <FileText className="mb-2 h-8 w-8 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">No PBC requests found</p>
        {onAddNode && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => onAddNode(null)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Area
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header with actions */}
      <div className="flex items-center justify-between px-2 py-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">PBC Requests</span>
          {overallCompletion.total > 0 && (
            <PbcCompletionBadge completion={overallCompletion} showProgress />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={expandAll}
            title="Expand all"
          >
            <Expand className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={collapseAll}
            title="Collapse all"
          >
            <Shrink className="h-4 w-4" />
          </Button>
          {onAddNode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onAddNode(null)}
              title="Add area"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tree content */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {tree.map(renderNode)}
        </div>
      </ScrollArea>
    </div>
  );
}
