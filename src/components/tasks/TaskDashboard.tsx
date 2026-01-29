import { useMemo } from 'react';
import { format, parseISO, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  ListTodo,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { TaskWithRelations, TaskStatus } from '@/types/tasks';

interface TaskDashboardProps {
  tasks: TaskWithRelations[];
  isLoading?: boolean;
  onSelectTask?: (task: TaskWithRelations) => void;
}

const statusConfig: Record<TaskStatus, { label: string; color: string; bgClass: string }> = {
  open: { label: 'Open', color: 'text-slate-600', bgClass: 'bg-slate-100 dark:bg-slate-900/30' },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bgClass: 'bg-blue-100 dark:bg-blue-900/30' },
  completed: { label: 'Completed', color: 'text-green-600', bgClass: 'bg-green-100 dark:bg-green-900/30' },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground', bgClass: 'bg-muted' },
};

export function TaskDashboard({ tasks, isLoading, onSelectTask }: TaskDashboardProps) {
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    
    let open = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;
    let overdue = 0;
    let dueToday = 0;
    let dueThisWeek = 0;
    
    const overdueTasks: TaskWithRelations[] = [];
    const upcomingTasks: TaskWithRelations[] = [];
    const recentlyCompleted: TaskWithRelations[] = [];
    
    tasks.forEach((task) => {
      // Count by status
      if (task.status === 'open') open++;
      else if (task.status === 'in_progress') inProgress++;
      else if (task.status === 'completed') completed++;
      else if (task.status === 'cancelled') cancelled++;
      
      // Recently completed (last 7 days)
      if (task.status === 'completed' && task.completed_at) {
        const completedDate = parseISO(task.completed_at);
        if (differenceInDays(today, completedDate) <= 7) {
          recentlyCompleted.push(task);
        }
      }
      
      // Due date analysis for non-completed tasks
      if (task.due_date && task.status !== 'completed' && task.status !== 'cancelled') {
        const dueDate = parseISO(task.due_date);
        const daysUntilDue = differenceInDays(dueDate, today);
        
        if (daysUntilDue < 0) {
          overdue++;
          overdueTasks.push(task);
        } else if (daysUntilDue === 0) {
          dueToday++;
          upcomingTasks.push(task);
        } else if (daysUntilDue <= 7) {
          dueThisWeek++;
          upcomingTasks.push(task);
        }
      }
    });
    
    // Sort overdue by most overdue first
    overdueTasks.sort((a, b) => {
      if (!a.due_date || !b.due_date) return 0;
      return parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime();
    });
    
    // Sort upcoming by soonest first
    upcomingTasks.sort((a, b) => {
      if (!a.due_date || !b.due_date) return 0;
      return parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime();
    });
    
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const activeTotal = open + inProgress;
    
    return {
      open,
      inProgress,
      completed,
      cancelled,
      overdue,
      dueToday,
      dueThisWeek,
      total,
      activeTotal,
      completionRate,
      overdueTasks: overdueTasks.slice(0, 5),
      upcomingTasks: upcomingTasks.slice(0, 5),
      recentlyCompleted: recentlyCompleted.slice(0, 5),
    };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CheckSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No Tasks Yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first task to get started
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeTotal} active, {stats.completed} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <Progress value={stats.completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className={cn(stats.overdue > 0 && 'border-destructive/50')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className={cn('h-4 w-4', stats.overdue > 0 ? 'text-destructive' : 'text-muted-foreground')} />
            </CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-bold', stats.overdue > 0 && 'text-destructive')}>
                {stats.overdue}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.dueToday} due today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dueThisWeek}</div>
              <p className="text-xs text-muted-foreground">
                Next 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <div className="grid gap-4 md:grid-cols-4">
          {(['open', 'in_progress', 'completed', 'cancelled'] as TaskStatus[]).map((status) => {
            const config = statusConfig[status];
            const count = stats[status === 'in_progress' ? 'inProgress' : status];
            return (
              <Card key={status} className={cn('border-t-4', 
                status === 'open' && 'border-t-slate-500',
                status === 'in_progress' && 'border-t-blue-500',
                status === 'completed' && 'border-t-green-500',
                status === 'cancelled' && 'border-t-muted-foreground'
              )}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{config.label}</span>
                    <Badge className={config.bgClass}>{count}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Task Lists */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Overdue Tasks */}
          <Card className={cn(stats.overdueTasks.length > 0 && 'border-destructive/30')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Overdue Tasks
              </CardTitle>
              <CardDescription>
                Tasks past their due date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.overdueTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  No overdue tasks!
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.overdueTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3 cursor-pointer hover:bg-destructive/10 transition-colors"
                      onClick={() => onSelectTask?.(task)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.areas?.name || task.processes?.name || 'Unassigned'}
                        </p>
                      </div>
                      <Badge variant="destructive" className="ml-2 shrink-0">
                        {task.due_date && format(parseISO(task.due_date), 'MMM d')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-blue-500" />
                Upcoming Tasks
              </CardTitle>
              <CardDescription>
                Due in the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.upcomingTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No upcoming deadlines
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onSelectTask?.(task)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.areas?.name || task.processes?.name || 'Unassigned'}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2 shrink-0">
                        {task.due_date && format(parseISO(task.due_date), 'MMM d')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recently Completed */}
        {stats.recentlyCompleted.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Recently Completed
              </CardTitle>
              <CardDescription>
                Tasks completed in the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentlyCompleted.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border bg-green-50/50 dark:bg-green-950/20 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate line-through opacity-60">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.areas?.name || task.processes?.name || 'Unassigned'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">
                      {task.completed_at && format(parseISO(task.completed_at), 'MMM d')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
