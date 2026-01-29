import { useMemo } from 'react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { Plus, MoreHorizontal, CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type {
  TaskChecklistItem,
  TaskChecklistSection,
  TaskItemStatus,
  ChecklistMode,
} from '@/types/task-checklists';

interface ChecklistKanbanViewProps {
  items: TaskChecklistItem[];
  sections: TaskChecklistSection[];
  mode: ChecklistMode;
  startDate?: string | null;
  isLoading?: boolean;
  onUpdateItem: (itemId: string, updates: { status?: TaskItemStatus; section_id?: string | null }) => void;
  onEditItem: (item: TaskChecklistItem) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (sectionId?: string | null) => void;
}

const statusColumns: { key: TaskItemStatus; label: string; color: string; icon: typeof Circle }[] = [
  { key: 'todo', label: 'To Do', color: 'border-t-slate-400', icon: Circle },
  { key: 'in_progress', label: 'In Progress', color: 'border-t-blue-500', icon: Clock },
  { key: 'done', label: 'Done', color: 'border-t-green-500', icon: CheckCircle2 },
];

export function ChecklistKanbanView({
  items,
  sections,
  mode,
  startDate,
  isLoading,
  onUpdateItem,
  onEditItem,
  onDeleteItem,
  onAddItem,
}: ChecklistKanbanViewProps) {
  // For quick_list: group by status
  // For structured_list: group by section
  const columns = useMemo(() => {
    if (mode === 'quick_list') {
      return statusColumns.map((col) => ({
        ...col,
        items: items.filter((item) => item.status === col.key),
      }));
    } else {
      // Group by section
      const sectionColumns = sections.map((section) => ({
        key: section.id,
        label: section.name,
        color: 'border-t-primary',
        items: items.filter((item) => item.section_id === section.id),
      }));

      // Add unsectioned column if there are unsectioned items
      const unsectioned = items.filter((item) => !item.section_id);
      if (unsectioned.length > 0 || sections.length === 0) {
        sectionColumns.push({
          key: 'unsectioned',
          label: 'Unsectioned',
          color: 'border-t-muted-foreground',
          items: unsectioned,
        });
      }

      return sectionColumns;
    }
  }, [items, sections, mode]);

  const isOverdue = (item: TaskChecklistItem) => {
    if (!item.due_date || item.status === 'done') return false;
    return isBefore(parseISO(item.due_date), startOfDay(new Date()));
  };

  const getDueLabel = (item: TaskChecklistItem) => {
    if (item.relative_day !== null && startDate) {
      return `Day ${item.relative_day}`;
    }
    if (item.due_date) {
      return format(parseISO(item.due_date), 'MMM d');
    }
    return null;
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
      {columns.map((column) => (
        <div key={column.key} className="flex w-72 shrink-0 flex-col">
          <Card className={cn('border-t-4', column.color)}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>{column.label}</span>
                <Badge variant="secondary" className="ml-2">
                  {column.items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {column.items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No tasks
                </div>
              ) : (
                column.items.map((item) => {
                  const overdue = isOverdue(item);
                  const dueLabel = getDueLabel(item);

                  return (
                    <Card
                      key={item.id}
                      className={cn(
                        'cursor-pointer transition-shadow hover:shadow-md',
                        overdue && 'border-destructive/50 bg-destructive/5'
                      )}
                      onClick={() => onEditItem(item)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1">
                            <p
                              className={cn(
                                'text-sm font-medium',
                                item.status === 'done' && 'line-through opacity-60'
                              )}
                            >
                              {item.title}
                            </p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.description}
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
                              {mode === 'quick_list' ? (
                                // Move between status columns
                                statusColumns
                                  .filter((c) => c.key !== item.status)
                                  .map((c) => (
                                    <DropdownMenuItem
                                      key={c.key}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateItem(item.id, { status: c.key });
                                      }}
                                    >
                                      Move to {c.label}
                                    </DropdownMenuItem>
                                  ))
                              ) : (
                                // Move between sections
                                sections
                                  .filter((s) => s.id !== item.section_id)
                                  .map((s) => (
                                    <DropdownMenuItem
                                      key={s.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateItem(item.id, { section_id: s.id });
                                      }}
                                    >
                                      Move to {s.name}
                                    </DropdownMenuItem>
                                  ))
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteItem(item.id);
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          {/* Status indicator for structured mode */}
                          {mode === 'structured_list' && (
                            <Badge variant="outline" className="text-xs">
                              {item.status.replace('_', ' ')}
                            </Badge>
                          )}

                          {/* Due date */}
                          {dueLabel && (
                            <div className="flex items-center gap-1">
                              {overdue && <AlertTriangle className="h-3 w-3 text-destructive" />}
                              <span className={cn(overdue && 'text-destructive font-medium')}>
                                {dueLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {/* Add Task Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={() => {
                  if (mode === 'quick_list') {
                    onAddItem(null);
                  } else {
                    onAddItem(column.key === 'unsectioned' ? null : column.key);
                  }
                }}
              >
                <Plus className="mr-2 h-3 w-3" />
                Add task
              </Button>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
