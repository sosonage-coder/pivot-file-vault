import { useMemo } from 'react';
import { format, addDays, parseISO, isBefore, startOfDay, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskChecklistItem, TaskItemStatus } from '@/types/task-checklists';

interface CloseCalendarViewProps {
  items: TaskChecklistItem[];
  startDate: string;
  durationDays: number;
  isLoading?: boolean;
  onSelectItem?: (item: TaskChecklistItem) => void;
}

const statusConfig: Record<TaskItemStatus, { icon: typeof Circle; color: string }> = {
  todo: { icon: Circle, color: 'text-muted-foreground' },
  in_progress: { icon: Clock, color: 'text-blue-500' },
  done: { icon: CheckCircle2, color: 'text-green-500' },
};

function getDayLabel(day: number) {
  if (day === 0) return 'D0';
  return day > 0 ? `D+${day}` : `D${day}`;
}

export function CloseCalendarView({
  items,
  startDate,
  durationDays,
  isLoading,
  onSelectItem,
}: CloseCalendarViewProps) {
  const startDateParsed = parseISO(startDate);
  const today = startOfDay(new Date());

  const dayRange = useMemo(() => {
    const itemDays = items
      .map((item) => item.relative_day)
      .filter((day): day is number => day !== null);

    const minDay = Math.min(0, ...(itemDays.length ? itemDays : [0]));
    const maxDay = Math.max(durationDays, ...(itemDays.length ? itemDays : [durationDays]));

    return { minDay, maxDay };
  }, [items, durationDays]);

  const days = useMemo(() => {
    const values: { day: number; date: Date }[] = [];
    for (let day = dayRange.minDay; day <= dayRange.maxDay; day += 1) {
      values.push({ day, date: addDays(startDateParsed, day) });
    }
    return values;
  }, [dayRange.maxDay, dayRange.minDay, startDateParsed]);

  const itemsByDay = useMemo(() => {
    const map = new Map<number, TaskChecklistItem[]>();

    items.forEach((item) => {
      if (item.relative_day !== null) {
        if (!map.has(item.relative_day)) {
          map.set(item.relative_day, []);
        }
        map.get(item.relative_day)!.push(item);
      }
    });

    return map;
  }, [items]);

  const dayStats = useMemo(() => {
    return days.map(({ day }) => {
      const dayItems = itemsByDay.get(day) ?? [];
      const total = dayItems.length;
      const done = dayItems.filter((i) => i.status === 'done').length;
      return { day, total, done, percentage: total > 0 ? Math.round((done / total) * 100) : 0 };
    });
  }, [days, itemsByDay]);

  const currentCloseDay = useMemo(() => {
    const diffMs = today.getTime() - startDateParsed.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }, [today, startDateParsed]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading close calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Close Calendar</h3>
          <p className="text-sm text-muted-foreground">
            {format(addDays(startDateParsed, dayRange.minDay), 'MMM d, yyyy')} – {format(addDays(startDateParsed, dayRange.maxDay), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            {items.filter((i) => i.status === 'done').length}/{items.length}
          </p>
          <p className="text-xs text-muted-foreground">Tasks Complete</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-2 pb-2 min-w-max">
          {days.map(({ day, date }) => {
            const dayItems = itemsByDay.get(day) ?? [];
            const stats = dayStats.find((s) => s.day === day)!;
            const isCurrentDay = currentCloseDay === day;
            const isPast = isBefore(date, today) && !isSameDay(date, today);
            const hasOverdue = isPast && dayItems.some((i) => i.status !== 'done');

            return (
              <div
                key={day}
                className={cn(
                  'flex flex-col w-48 shrink-0 rounded-lg border bg-card',
                  isCurrentDay && 'ring-2 ring-primary',
                  hasOverdue && 'border-destructive/50'
                )}
              >
                <div className={cn('flex items-center justify-between p-3 border-b', isCurrentDay && 'bg-primary/10', hasOverdue && 'bg-destructive/10')}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{getDayLabel(day)}</span>
                      {isCurrentDay && <Badge variant="default" className="text-xs">Today</Badge>}
                      {hasOverdue && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{format(date, 'EEE, MMM d')}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{stats.done}/{stats.total}</Badge>
                </div>

                <div className="px-3 py-2 border-b">
                  <Progress value={stats.percentage} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{stats.percentage}%</p>
                </div>

                <div className="flex-1 p-2 space-y-1 max-h-[300px] overflow-y-auto">
                  {dayItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
                  ) : (
                    dayItems.map((item) => {
                      const StatusIcon = statusConfig[item.status].icon;
                      return (
                        <div
                          key={item.id}
                          className={cn('flex items-start gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors', item.status === 'done' && 'opacity-60')}
                          onClick={() => onSelectItem?.(item)}
                        >
                          <StatusIcon className={cn('h-4 w-4 shrink-0 mt-0.5', statusConfig[item.status].color)} />
                          <span className={cn('text-sm', item.status === 'done' && 'line-through')}>{item.title}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2 border-t">
        <span className="text-xs text-muted-foreground">Status:</span>
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          return (
            <div key={status} className="flex items-center gap-1">
              <Icon className={cn('h-3 w-3', config.color)} />
              <span className="text-xs capitalize">{status.replace('_', ' ')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
