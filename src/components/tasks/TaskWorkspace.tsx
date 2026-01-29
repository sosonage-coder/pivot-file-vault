import { useState } from 'react';
import { format } from 'date-fns';
import { 
  CheckSquare, 
  Calendar, 
  User, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  XCircle,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TaskWithRelations, TaskStatus } from '@/types/tasks';

interface TaskWorkspaceProps {
  task: TaskWithRelations | null;
  onUpdateTask: (taskId: string, updates: { status?: TaskStatus; priority?: string }) => Promise<void>;
  onEditTask?: (task: TaskWithRelations) => void;
  isUpdating?: boolean;
}

const statusConfig: Record<TaskStatus, {
  label: string;
  icon: typeof CheckSquare;
  color: string;
  bgClass: string;
}> = {
  open: {
    label: 'Open',
    icon: Clock,
    color: 'text-slate-600',
    bgClass: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
  },
  in_progress: {
    label: 'In Progress',
    icon: Play,
    color: 'text-blue-600',
    bgClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-muted-foreground',
    bgClass: 'bg-muted text-muted-foreground',
  },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-slate-600' },
  medium: { label: 'Medium', color: 'text-amber-600' },
  high: { label: 'High', color: 'text-orange-600' },
  urgent: { label: 'Urgent', color: 'text-destructive' },
};

const statusOrder: TaskStatus[] = ['open', 'in_progress', 'completed', 'cancelled'];

export function TaskWorkspace({ task, onUpdateTask, onEditTask, isUpdating }: TaskWorkspaceProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  if (!task) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Select a Task</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a task from the tree to view details
          </p>
        </div>
      </div>
    );
  }

  const config = statusConfig[task.status as TaskStatus];
  const StatusIcon = config.icon;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && task.status !== 'cancelled';

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setIsChangingStatus(true);
    await onUpdateTask(task.id, { status: newStatus });
    setIsChangingStatus(false);
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {task.title}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              {task.processes?.name && <span>{task.processes.name}</span>}
              {task.areas?.name && (
                <>
                  <span>•</span>
                  <span>{task.areas.name}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={cn('gap-1', config.bgClass)}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
            
            {isOverdue && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </Badge>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isChangingStatus}>
                  {isChangingStatus && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Change Status
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {statusOrder.map((status) => {
                  const statusCfg = statusConfig[status];
                  const Icon = statusCfg.icon;
                  return (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={status === task.status}
                    >
                      <Icon className={cn('mr-2 h-4 w-4', statusCfg.color)} />
                      {statusCfg.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {onEditTask && (
              <Button variant="outline" size="sm" onClick={() => onEditTask(task)}>
                Edit
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.periods?.label && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Period</p>
                    <p className="text-sm text-muted-foreground">{task.periods.label}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className={cn('text-sm', isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                    {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'Not set'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Priority</p>
                  <Badge variant="outline" className={cn('capitalize', priorityConfig[task.priority]?.color)}>
                    {task.priority}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.status === 'open' && (
                <Button 
                  className="w-full" 
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={isChangingStatus}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Working
                </Button>
              )}
              
              {task.status === 'in_progress' && (
                <Button 
                  className="w-full"
                  onClick={() => handleStatusChange('completed')}
                  disabled={isChangingStatus}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
              )}
              
              {task.status === 'completed' && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Task Completed</span>
                </div>
              )}
              
              {task.status === 'cancelled' && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-4 text-muted-foreground">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Task Cancelled</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {task.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {task.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span>Created on {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
              </div>
              {task.completed_at && (
                <div className="flex items-center gap-3 text-sm text-green-600">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Completed on {format(new Date(task.completed_at), 'MMM d, yyyy')}</span>
                </div>
              )}
              {task.updated_at !== task.created_at && !task.completed_at && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-muted" />
                  <span>Last updated {format(new Date(task.updated_at), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
