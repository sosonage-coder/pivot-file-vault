import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  parseISO,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskChecklistItem, TaskItemStatus } from '@/types/task-checklists';

interface ChecklistCalendarViewProps {
  items: TaskChecklistItem[];
  startDate?: string | null;
  isLoading?: boolean;
  onSelectDate?: (date: Date, items: TaskChecklistItem[]) => void;
  onSelectItem?: (item: TaskChecklistItem) => void;
}

const statusColors: Record<TaskItemStatus, string> = {
  todo: 'bg-slate-500',
  in_progress: 'bg-blue-500',
  done: 'bg-green-500',
};

export function ChecklistCalendarView({
  items,
  startDate,
  isLoading,
  onSelectDate,
  onSelectItem,
}: ChecklistCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group items by due date
  const itemsByDate = useMemo(() => {
    const map = new Map<string, TaskChecklistItem[]>();
    items.forEach((item) => {
      if (item.due_date) {
        const key = item.due_date;
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(item);
      }
    });
    return map;
  }, [items]);

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Calendar Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayItems = itemsByDate.get(dateKey) ?? [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[100px] border-b border-r p-1 transition-colors cursor-pointer hover:bg-muted/50',
                !isCurrentMonth && 'bg-muted/30',
                idx % 7 === 6 && 'border-r-0'
              )}
              onClick={() => onSelectDate?.(day, dayItems)}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between mb-1">
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-sm',
                    isTodayDate && 'bg-primary text-primary-foreground font-bold',
                    !isCurrentMonth && 'text-muted-foreground'
                  )}
                >
                  {format(day, 'd')}
                </div>
                {dayItems.length > 0 && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {dayItems.length}
                  </Badge>
                )}
              </div>

              {/* Items for this day */}
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-xs hover:bg-muted',
                      item.status === 'done' && 'opacity-50 line-through'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem?.(item);
                    }}
                  >
                    <div
                      className={cn(
                        'h-2 w-2 shrink-0 rounded-full',
                        statusColors[item.status]
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <div className="px-1 text-xs text-muted-foreground">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t p-3">
        <span className="text-xs text-muted-foreground">Status:</span>
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={cn('h-2 w-2 rounded-full', color)} />
            <span className="text-xs capitalize">{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
