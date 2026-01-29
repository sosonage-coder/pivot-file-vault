import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, CheckSquare, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { TreeNode } from '@/types/filegrid';
import type { TaskWithRelations, TaskStatus } from '@/types/tasks';

export interface TaskTreeNode {
  id: string;
  name: string;
  type: 'department' | 'process' | 'area' | 'task';
  children?: TaskTreeNode[];
  taskCount?: number;
  task?: TaskWithRelations;
  status?: TaskStatus;
}

interface TaskTreeProps {
  nodes: TaskTreeNode[];
  selectedId: string | null;
  onSelect: (node: TaskTreeNode) => void;
}

export function TaskTree({ nodes, selectedId, onSelect }: TaskTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <CheckSquare className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">No tasks found</p>
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
  node: TaskTreeNode;
  selectedId: string | null;
  onSelect: (node: TaskTreeNode) => void;
  depth: number;
}

function TreeNodeItem({ node, selectedId, onSelect, depth }: TreeNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isFolder = node.type !== 'task';

  const statusColors: Record<TaskStatus, string> = {
    open: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-muted text-muted-foreground',
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
            {node.status.replace('_', ' ')}
          </Badge>
        )}
        
        {node.taskCount !== undefined && node.taskCount > 0 && !node.status && (
          <Badge variant="secondary" className="text-xs">
            {node.taskCount}
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

// Build tree from tasks using folder structure
export function useTaskTree(
  tasks: TaskWithRelations[],
  folderStructure: { id: string; name: string; type: string; children?: { id: string; name: string; type: string; children?: { id: string; name: string; type: string }[] }[] }[]
): TaskTreeNode[] {
  return useMemo(() => {
    // Group tasks by area (or process if no area)
    const tasksByArea = new Map<string, TaskWithRelations[]>();
    const tasksByProcess = new Map<string, TaskWithRelations[]>();
    const unassignedTasks: TaskWithRelations[] = [];

    tasks.forEach((task) => {
      if (task.area_id) {
        const existing = tasksByArea.get(task.area_id) || [];
        existing.push(task);
        tasksByArea.set(task.area_id, existing);
      } else if (task.process_id) {
        const existing = tasksByProcess.get(task.process_id) || [];
        existing.push(task);
        tasksByProcess.set(task.process_id, existing);
      } else {
        unassignedTasks.push(task);
      }
    });

    // Build tree from folder structure
    type FolderNode = { id: string; name: string; type: string; children?: FolderNode[] };
    
    const buildTree = (nodes: FolderNode[]): TaskTreeNode[] => {
      const result: TaskTreeNode[] = [];

      for (const node of nodes) {
        let taskCount = 0;
        let children: TaskTreeNode[] = [];

        if (node.type === 'area') {
          const areaTasks = tasksByArea.get(node.id) || [];
          taskCount = areaTasks.length;
          children = areaTasks.map((task) => ({
            id: task.id,
            name: task.title,
            type: 'task' as const,
            task,
            status: task.status as TaskStatus,
          }));
        } else if (node.type === 'process') {
          // Include direct process tasks
          const processTasks = tasksByProcess.get(node.id) || [];
          if (node.children) {
            children = buildTree(node.children);
          }
          // Add direct tasks to this process
          processTasks.forEach((task) => {
            children.push({
              id: task.id,
              name: task.title,
              type: 'task' as const,
              task,
              status: task.status as TaskStatus,
            });
          });
          taskCount = children.reduce((sum, c) => sum + (c.taskCount || (c.type === 'task' ? 1 : 0)), 0);
        } else if (node.children) {
          children = buildTree(node.children);
          taskCount = children.reduce((sum, c) => sum + (c.taskCount || 0), 0);
        }

        // Only include nodes that have tasks
        if (taskCount > 0 || children.length > 0) {
          result.push({
            id: node.id,
            name: node.name,
            type: node.type as 'department' | 'process' | 'area',
            children: children.length > 0 ? children : undefined,
            taskCount,
          });
        }
      }

      return result;
    };

    const treeNodes = buildTree(folderStructure);

    // Add unassigned tasks if any
    if (unassignedTasks.length > 0) {
      treeNodes.push({
        id: 'unassigned',
        name: 'Unassigned',
        type: 'department',
        taskCount: unassignedTasks.length,
        children: unassignedTasks.map((task) => ({
          id: task.id,
          name: task.title,
          type: 'task' as const,
          task,
          status: task.status as TaskStatus,
        })),
      });
    }

    return treeNodes;
  }, [tasks, folderStructure]);
}
