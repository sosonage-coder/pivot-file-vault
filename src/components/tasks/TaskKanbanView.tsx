import type { TaskWithRelations, TaskStatus } from '@/types/tasks';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { Flag, Calendar, MoreHorizontal, AlertTriangle, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskKanbanViewProps {
  tasks: TaskWithRelations[];
  isLoading?: boolean;
  onUpdateTask: (taskId: string, updates: { status: TaskStatus }) => void;
  onEditTask: (task: TaskWithRelations) => void;
  onDeleteTask: (taskId: string) => void;
}

const columns: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'open', label: 'Open', color: 'border-t-blue-500' },
  { key: 'in_progress', label: 'In Progress', color: 'border-t-amber-500' },
  { key: 'completed', label: 'Completed', color: 'border-t-green-500' },
  { key: 'cancelled', label: 'Cancelled', color: 'border-t-muted-foreground' },
];

const priorityColors: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-destructive',
};

export function TaskKanbanView({
  tasks,
  isLoading,
  onUpdateTask,
  onEditTask,
  onDeleteTask,
}: TaskKanbanViewProps) {
  const groupedTasks = columns.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.key),
  }));

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

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {groupedTasks.map((column) => (
        <div key={column.key} className="flex w-72 shrink-0 flex-col">
          <Card className={cn('border-t-4', column.color)}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>{column.label}</span>
                <Badge variant="secondary" className="ml-2">
                  {column.tasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {column.tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No tasks
                </div>
              ) : (
                column.tasks.map((task) => {
                  const overdue = isOverdue(task);
                  return (
                    <Card
                      key={task.id}
                      className={cn(
                        'cursor-pointer transition-shadow hover:shadow-md',
                        overdue && 'border-destructive/50 bg-destructive/5'
                      )}
                      onClick={() => onEditTask(task)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <p
                              className={cn(
                                'text-sm font-medium',
                                task.status === 'completed' && 'line-through opacity-60'
                              )}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {columns
                                .filter((c) => c.key !== task.status)
                                .map((c) => (
                                  <DropdownMenuItem
                                    key={c.key}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onUpdateTask(task.id, { status: c.key });
                                    }}
                                  >
                                    Move to {c.label}
                                  </DropdownMenuItem>
                                ))}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTask(task.id);
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Flag className={cn('h-3 w-3', priorityColors[task.priority])} />
                            <span className="capitalize">{task.priority}</span>
                          </div>
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              {overdue && <AlertTriangle className="h-3 w-3 text-destructive" />}
                              <Calendar className={cn('h-3 w-3', overdue && 'text-destructive')} />
                              <span className={cn(overdue && 'text-destructive font-medium')}>
                                {format(parseISO(task.due_date), 'MMM d')}
                              </span>
                            </div>
                          )}
                        </div>

                        {(task.areas?.name || task.periods?.label) && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {task.areas?.name && (
                              <Badge variant="outline" className="text-xs">
                                {task.areas.name}
                              </Badge>
                            )}
                            {task.periods?.label && (
                              <Badge variant="outline" className="text-xs">
                                {task.periods.label}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
