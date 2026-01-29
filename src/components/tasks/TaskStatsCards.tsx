import { Card, CardContent } from '@/components/ui/card';
import type { TaskStats } from '@/types/tasks';
import { ListTodo, Clock, CheckCircle2, XCircle, AlertTriangle, CalendarClock, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskStatsCardsProps {
  stats: TaskStats;
  onFilterByStatus?: (status: string | null) => void;
  selectedStatus?: string | null;
}

export function TaskStatsCards({ stats, onFilterByStatus, selectedStatus }: TaskStatsCardsProps) {
  const cards = [
    { key: 'open', label: 'Open', value: stats.open, icon: ListTodo, color: 'text-blue-500' },
    { key: 'in_progress', label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'text-amber-500' },
    { key: 'completed', label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-500' },
    { key: 'cancelled', label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-muted-foreground' },
  ];

  const urgencyCards = [
    { key: 'overdue', label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-destructive' },
    { key: 'dueToday', label: 'Due Today', value: stats.dueToday, icon: CalendarClock, color: 'text-orange-500' },
    { key: 'dueThisWeek', label: 'Due This Week', value: stats.dueThisWeek, icon: CalendarDays, color: 'text-primary' },
  ];

  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = selectedStatus === card.key;
          return (
            <Card
              key={card.key}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary'
              )}
              onClick={() => onFilterByStatus?.(isSelected ? null : card.key)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn('rounded-full bg-muted p-2', card.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Urgency Row */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Urgency:</span>
        </div>
        {urgencyCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4', card.color)} />
              <span className={cn('text-sm font-medium', card.color)}>{card.value}</span>
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Completion Rate:</span>
          <span className="text-sm font-bold text-green-600">{completionRate}%</span>
        </div>
      </div>
    </div>
  );
}
