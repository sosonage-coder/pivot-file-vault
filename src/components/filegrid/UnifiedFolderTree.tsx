import { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Briefcase, 
  FolderOpen, 
  Folder, 
  FileBox, 
  FileText,
  ClipboardList,
  ClipboardCheck,
  CheckSquare,
  Scale,
  ShieldCheck,
  Clock,
  Trash2,
  Pencil,
  Plus,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteProcess, useDeleteArea, useDeleteObject } from '@/hooks/useAdminMutations';
import { AddFolderModal } from './AddFolderModal';
import type { TreeNode, TreeNodeType } from '@/types/filegrid';

interface UnifiedFolderTreeProps {
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

const iconMap: Record<TreeNodeType, typeof Briefcase> = {
  entity: Briefcase,
  department: Briefcase,
  process: FolderOpen,
  area: Folder,
  object: FileBox,
  'module-documents': FileText,
  'module-pbc': ClipboardList,
  'module-tasks': CheckSquare,
  'module-reconciliations': Scale,
  'pbc-item': ClipboardList,
  'task-item': CheckSquare,
  'reconciliation-account': Scale,
  // PBC tree hierarchy icons
  'pbc-department': Briefcase,
  'pbc-process': FolderOpen,
  'pbc-area': Folder,
  'pbc-object': FileBox,
  'pbc-request': ClipboardCheck,
};

const moduleColors: Record<string, string> = {
  'module-documents': 'text-blue-600 dark:text-blue-400',
  'module-pbc': 'text-amber-600 dark:text-amber-400',
  'module-tasks': 'text-green-600 dark:text-green-400',
  'module-reconciliations': 'text-purple-600 dark:text-purple-400',
};

// PBC tree node colors
const pbcTreeColors: Record<string, string> = {
  'pbc-department': 'text-slate-500 dark:text-slate-400',
  'pbc-process': 'text-blue-500 dark:text-blue-400',
  'pbc-area': 'text-amber-500 dark:text-amber-400',
  'pbc-object': 'text-purple-500 dark:text-purple-400',
  'pbc-request': 'text-green-500 dark:text-green-400',
};

function TreeItem({ node, level, selectedId, onSelect, pendingCounts, onEditObject }: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<'area' | 'object'>('area');
  
  const deleteProcess = useDeleteProcess();
  const deleteArea = useDeleteArea();
  const deleteObject = useDeleteObject();
  
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const Icon = iconMap[node.type] || Folder;
  
  const pendingCount = node.type === 'object' ? (pendingCounts?.[node.id] || 0) : 0;
  const requiresApproval = node.type === 'object' && node.metadata?.requires_approval;
  const isModuleNode = node.type.startsWith('module-');
  const isPbcTreeNode = node.type.startsWith('pbc-') && !node.type.startsWith('pbc-item');
  const isItemNode = ['pbc-item', 'task-item', 'reconciliation-account'].includes(node.type) || node.type === 'pbc-request';
  
  // Determine if this node type supports context menu actions
  const canDelete = ['process', 'area', 'object'].includes(node.type);
  const canEdit = node.type === 'object';
  const canAddChild = node.type === 'process' || node.type === 'area';

  const handleClick = (e: React.MouseEvent) => {
    // Support Ctrl/Cmd+Click to open in new tab
    if ((e.ctrlKey || e.metaKey) && node.type === 'object') {
      const feature = getFeatureForNode(node);
      if (feature) {
        const entityParam = node.metadata?.entity_id ? `&entityId=${node.metadata.entity_id}` : '';
        window.open(`${feature}?objectId=${node.id}${entityParam}`, '_blank');
        return;
      }
    }
    
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onSelect(node);
  };

  const getFeatureForNode = (node: TreeNode): string | null => {
    // Determine which feature this node belongs to based on type
    if (node.type === 'pbc-request' || node.type === 'pbc-item') return '/pbc';
    if (node.type === 'reconciliation-account') return '/reconciliations';
    if (node.type === 'object') return '/documents';
    return null;
  };

  const handleDoubleClick = () => {
    if (node.type === 'object' && onEditObject) {
      onEditObject(node);
    }
  };

  const handleDelete = () => {
    if (node.type === 'process') {
      deleteProcess.mutate(node.id);
    } else if (node.type === 'area') {
      deleteArea.mutate(node.id);
    } else if (node.type === 'object') {
      deleteObject.mutate(node.id);
    }
    setDeleteDialogOpen(false);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'process') {
      setAddType('area');
    } else if (node.type === 'area') {
      setAddType('object');
    }
    setAddModalOpen(true);
  };

  const getItemCount = () => {
    if (isModuleNode && typeof node.itemCount === 'number') {
      return node.itemCount;
    }
    if (typeof node.documentCount === 'number' && node.documentCount > 0) {
      return node.documentCount;
    }
    return null;
  };

  const itemCount = getItemCount();

  // Get status badge for item nodes
  const getStatusBadge = () => {
    if (!isItemNode || !node.metadata?.status) return null;
    
    const status = node.metadata.status as string;
    const statusColors: Record<string, string> = {
      // PBC statuses
      'Requested': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      'Uploaded': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'Reviewed': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      'Complete': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      // Task statuses
      'todo': 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
      'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'blocked': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      // Reconciliation statuses
      'not_started': 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
      'pending_review': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      'approved': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'certified': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    
    return (
      <Badge 
        variant="secondary" 
        className={cn('h-4 px-1 text-[10px] font-normal', statusColors[status] || '')}
      >
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getNodeTypeName = () => {
    switch (node.type) {
      case 'process': return 'Process';
      case 'area': return 'Area';
      case 'object': return 'Object';
      default: return 'Item';
    }
  };

  const getAddChildLabel = () => {
    if (node.type === 'process') return 'Add Area';
    if (node.type === 'area') return 'Add Object';
    return 'Add';
  };

  const treeButton = (
    <div 
      className={cn(
        'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        'hover:bg-[hsl(var(--tree-hover))]',
        isSelected && 'bg-[hsl(var(--tree-selected))] font-medium',
        isItemNode && 'py-1'
      )}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
    >
      <button
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className="flex flex-1 items-center gap-2 min-w-0"
      >
        <span className="flex h-4 w-4 items-center justify-center flex-shrink-0">
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
          'h-4 w-4 flex-shrink-0',
          isModuleNode ? moduleColors[node.type] : 
          isPbcTreeNode ? pbcTreeColors[node.type] :
          node.type === 'area' ? 'text-primary' : 
          node.type === 'object' ? 'text-accent-foreground' : 
          isItemNode ? 'text-muted-foreground' :
          'text-muted-foreground'
        )} />
        <span className={cn(
          'flex-1 truncate',
          isItemNode && 'text-xs'
        )}>
          {node.name}
        </span>
      </button>
      
      {/* Show approval indicator */}
      {requiresApproval && (
        <ShieldCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
      )}
      
      {/* Show pending approval count */}
      {pendingCount > 0 && (
        <Badge 
          variant="secondary" 
          className="h-5 px-1.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 flex-shrink-0"
        >
          <Clock className="mr-0.5 h-3 w-3" />
          {pendingCount}
        </Badge>
      )}
      
      {/* Show status badge for item nodes */}
      {getStatusBadge()}
      
      {/* Show item/document count */}
      {!isItemNode && pendingCount === 0 && itemCount !== null && itemCount > 0 && (
        <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
          {itemCount}
        </span>
      )}

      {/* Plus button to add child - shows on hover */}
      {canAddChild && (
        <button
          onClick={handleAddChild}
          className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-accent transition-opacity flex-shrink-0"
          title={getAddChildLabel()}
        >
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );

  const handleOpenInNewTab = () => {
    const feature = getFeatureForNode(node);
    if (feature && node.type === 'object') {
      const entityParam = node.metadata?.entity_id ? `&entityId=${node.metadata.entity_id}` : '';
      window.open(`${feature}?objectId=${node.id}${entityParam}`, '_blank');
    }
  };

  return (
    <div>
      {canDelete || canEdit || canAddChild ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {treeButton}
          </ContextMenuTrigger>
          <ContextMenuContent>
            {node.type === 'object' && (
              <>
                <ContextMenuItem onClick={handleOpenInNewTab}>
                  <Plus className="mr-2 h-4 w-4" />
                  Open in New Tab
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            {canAddChild && (
              <ContextMenuItem onClick={handleAddChild}>
                <Plus className="mr-2 h-4 w-4" />
                {getAddChildLabel()}
              </ContextMenuItem>
            )}
            {canAddChild && (canEdit || canDelete) && <ContextMenuSeparator />}
            {canEdit && onEditObject && (
              <ContextMenuItem onClick={() => onEditObject(node)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit {getNodeTypeName()}
              </ContextMenuItem>
            )}
            {canDelete && (
              <ContextMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {getNodeTypeName()}
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        treeButton
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {getNodeTypeName()}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{node.name}" and all its contents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddFolderModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        parentNode={node}
        type={addType}
      />
      
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

export function UnifiedFolderTree({ nodes, selectedId, onSelect, pendingCounts, onEditObject }: UnifiedFolderTreeProps) {
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
