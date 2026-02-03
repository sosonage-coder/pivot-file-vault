import { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  FolderOpen, 
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Play,
  Shield,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { ReconciliationTreeNode } from '@/hooks/useReconciliationTree';
import type { ReconciliationStatus } from '@/types/reconciliations';

interface ReconciliationTreeProps {
  nodes: ReconciliationTreeNode[];
  selectedId: string | null;
  onSelect: (node: ReconciliationTreeNode) => void;
}

interface TreeItemProps {
  node: ReconciliationTreeNode;
  level: number;
  selectedId: string | null;
  onSelect: (node: ReconciliationTreeNode) => void;
}

const iconMap = {
  category: Layers,
  area: FolderOpen,
  account: FileSpreadsheet,
};

const statusConfig: Record<ReconciliationStatus, { 
  icon: typeof CheckCircle2; 
  color: string; 
  bg: string;
}> = {
  not_started: { 
    icon: Clock, 
    color: 'text-muted-foreground',
    bg: 'bg-muted'
  },
  in_progress: { 
    icon: Play, 
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30'
  },
  pending_review: { 
    icon: Clock, 
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30'
  },
  rejected: { 
    icon: XCircle, 
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30'
  },
  approved: { 
    icon: CheckCircle2, 
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30'
  },
  certified: { 
    icon: Shield, 
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
};

function TreeItem({ node, level, selectedId, onSelect }: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id || selectedId === node.reconciliationId;
  const Icon = iconMap[node.type];
  
  const handleClick = (e: React.MouseEvent) => {
    // Support Ctrl/Cmd+Click to open in new tab
    if ((e.ctrlKey || e.metaKey) && node.type === 'account' && node.reconciliationId) {
      window.open(`/reconciliations?id=${node.reconciliationId}`, '_blank');
      return;
    }
    
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onSelect(node);
  };

  const handleOpenInNewTab = () => {
    if (node.type === 'account' && node.reconciliationId) {
      window.open(`/reconciliations?id=${node.reconciliationId}`, '_blank');
    }
  };

  // Calculate stats for non-account nodes
  const getChildStats = () => {
    if (node.type === 'account' || !node.children) return null;
    
    let total = 0;
    let certified = 0;
    
    const countChildren = (children: ReconciliationTreeNode[]) => {
      children.forEach((child) => {
        if (child.type === 'account') {
          total++;
          if (child.status === 'certified') certified++;
        } else if (child.children) {
          countChildren(child.children);
        }
      });
    };
    
    countChildren(node.children);
    return { total, certified };
  };

  const stats = getChildStats();

  const treeItemContent = (
    <button
      onClick={handleClick}
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
        node.type === 'category' ? 'text-primary' : 
        node.type === 'area' ? 'text-muted-foreground' : 'text-accent-foreground'
      )} />
      
      <span className="flex-1 truncate">{node.name}</span>
      
      {/* Status indicator for accounts */}
      {node.type === 'account' && node.status && (
        <StatusIndicator status={node.status} variance={node.variance} />
      )}
      
      {/* Stats for categories/areas */}
      {stats && stats.total > 0 && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {stats.certified}/{stats.total}
        </span>
      )}
    </button>
  );

  // Wrap account nodes with context menu for "Open in New Tab"
  const wrappedContent = node.type === 'account' ? (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {treeItemContent}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleOpenInNewTab}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in New Tab
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ) : (
    treeItemContent
  );

  return (
    <div>
      {wrappedContent}
      
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusIndicator({ status, variance }: { status: ReconciliationStatus; variance?: number | null }) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const hasVariance = variance && variance !== 0;
  
  return (
    <div className="flex items-center gap-1">
      {hasVariance && (
        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
      )}
      <StatusIcon className={cn('h-3.5 w-3.5', config.color)} />
    </div>
  );
}

export function ReconciliationTree({ nodes, selectedId, onSelect }: ReconciliationTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50" />
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
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          level={0}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
