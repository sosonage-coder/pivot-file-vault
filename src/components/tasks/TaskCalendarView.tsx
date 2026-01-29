import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
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
import type { TaskWithRelations, TaskStatus } from '@/types/tasks';

interface TaskCalendarViewProps {
  tasks: TaskWithRelations[];
  isLoading?: boolean;
  onSelectDate?: (date: Date, tasks: TaskWithRelations[]) => void;
  onSelectTask?: (task: TaskWithRelations) => void;
}

const statusColors: Record<TaskStatus, string> = {
  open: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  completed: 'bg-green-500',
  cancelled: 'bg-muted-foreground',
};

export function TaskCalendarView({
  tasks,
  isLoading,
  onSelectDate,
  onSelectTask,
}: TaskCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group tasks by due date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskWithRelations[]>();
    tasks.forEach((task) => {
      if (task.due_date) {
        const key = task.due_date; // Already in YYYY-MM-DD format
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(task);
      }
    });
    return map;
  }, [tasks]);

  // Get all days to display (including padding from prev/next months)
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
          const dayTasks = tasksByDate.get(dateKey) ?? [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[100px] border-b border-r p-1',
                !isCurrentMonth && 'bg-muted/30',
                idx % 7 === 6 && 'border-r-0'
              )}
              onClick={() => onSelectDate?.(day, dayTasks)}
            >
              {/* Day Number */}
              <div
                className={cn(
                  'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-sm',
                  isTodayDate && 'bg-primary text-primary-foreground font-bold',
                  !isCurrentMonth && 'text-muted-foreground'
                )}
              >
                {format(day, 'd')}
              </div>

              {/* Tasks for this day */}
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-xs hover:bg-muted',
                      task.status === 'completed' && 'opacity-50 line-through'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTask?.(task);
                    }}
                  >
                    <div
                      className={cn(
                        'h-2 w-2 shrink-0 rounded-full',
                        statusColors[task.status]
                      )}
                    />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="px-1 text-xs text-muted-foreground">
                    +{dayTasks.length - 3} more
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
