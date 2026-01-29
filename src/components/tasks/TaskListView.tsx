import { useState } from 'react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Calendar, Flag, AlertTriangle, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskWithRelations, TaskStatus, TaskPriority } from '@/types/tasks';

interface TaskListViewProps {
  tasks: TaskWithRelations[];
  isLoading?: boolean;
  onUpdateTask: (taskId: string, updates: { status?: TaskStatus; priority?: TaskPriority }) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: TaskWithRelations) => void;
  selectedTasks: string[];
  onSelectTask: (taskId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

const statusColors: Record<TaskStatus, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-muted text-muted-foreground',
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-muted-foreground' },
  medium: { label: 'Medium', color: 'text-blue-500' },
  high: { label: 'High', color: 'text-orange-500' },
  urgent: { label: 'Urgent', color: 'text-destructive' },
};

export function TaskListView({
  tasks,
  isLoading,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
  selectedTasks,
  onSelectTask,
  onSelectAll,
}: TaskListViewProps) {
  const allSelected = tasks.length > 0 && selectedTasks.length === tasks.length;
  const someSelected = selectedTasks.length > 0 && selectedTasks.length < tasks.length;

  const isOverdue = (task: TaskWithRelations) => {
    if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') return false;
    return isBefore(parseISO(task.due_date), startOfDay(new Date()));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No tasks found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new task to get started
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(ref) => {
                  if (ref) (ref as HTMLButtonElement).dataset.indeterminate = someSelected ? 'true' : 'false';
                }}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead>Task</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-24">Priority</TableHead>
            <TableHead className="w-28">Due Date</TableHead>
            <TableHead className="w-32">Context</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const overdue = isOverdue(task);
            const priority = priorityConfig[task.priority];
            const hasLinks = task.document_id || task.pbc_item_id;

            return (
              <TableRow
                key={task.id}
                className={cn(
                  overdue && 'bg-destructive/5',
                  task.status === 'completed' && 'opacity-60'
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={(checked) => onSelectTask(task.id, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span
                      className={cn(
                        'font-medium',
                        task.status === 'completed' && 'line-through'
                      )}
                    >
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {task.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant="secondary"
                        className={cn('cursor-pointer', statusColors[task.status])}
                      >
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {(['open', 'in_progress', 'completed', 'cancelled'] as TaskStatus[]).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => onUpdateTask(task.id, { status })}
                        >
                          {status.replace('_', ' ')}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Flag className={cn('h-3 w-3', priority.color)} />
                    <span className={cn('text-sm', priority.color)}>{priority.label}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {task.due_date ? (
                    <div className="flex items-center gap-1">
                      {overdue && <AlertTriangle className="h-3 w-3 text-destructive" />}
                      <span className={cn('text-sm', overdue && 'text-destructive font-medium')}>
                        {format(parseISO(task.due_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {task.areas?.name && <span>{task.areas.name}</span>}
                    {task.periods?.label && <span>{task.periods.label}</span>}
                    {hasLinks && (
                      <div className="flex items-center gap-1 text-primary">
                        <Link2 className="h-3 w-3" />
                        <span>Linked</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditTask(task)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDeleteTask(task.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
