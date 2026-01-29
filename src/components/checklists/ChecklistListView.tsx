import { useState, useMemo } from 'react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { Plus, MoreHorizontal, CheckCircle2, Circle, Clock, Flag } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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

interface ChecklistListViewProps {
  items: TaskChecklistItem[];
  sections: TaskChecklistSection[];
  mode: ChecklistMode;
  startDate?: string | null;
  isLoading?: boolean;
  onUpdateItem: (itemId: string, updates: { status?: TaskItemStatus }) => void;
  onEditItem: (item: TaskChecklistItem) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (sectionId?: string | null) => void;
}

const statusConfig: Record<TaskItemStatus, { label: string; color: string; icon: typeof Circle }> = {
  todo: { label: 'To Do', color: 'text-muted-foreground', icon: Circle },
  in_progress: { label: 'In Progress', color: 'text-blue-500', icon: Clock },
  done: { label: 'Done', color: 'text-green-500', icon: CheckCircle2 },
};

export function ChecklistListView({
  items,
  sections,
  mode,
  startDate,
  isLoading,
  onUpdateItem,
  onEditItem,
  onDeleteItem,
  onAddItem,
}: ChecklistListViewProps) {
  // For structured list, group items by section
  const groupedItems = useMemo(() => {
    if (mode === 'quick_list') {
      return [{ section: null, items }];
    }

    const sectionMap = new Map<string | null, TaskChecklistItem[]>();
    
    // Initialize with all sections
    sectionMap.set(null, []); // Unsectioned items
    sections.forEach((s) => sectionMap.set(s.id, []));
    
    // Group items
    items.forEach((item) => {
      const key = item.section_id;
      if (!sectionMap.has(key)) {
        sectionMap.set(key, []);
      }
      sectionMap.get(key)!.push(item);
    });

    // Convert to array with section info
    const result: { section: TaskChecklistSection | null; items: TaskChecklistItem[] }[] = [];
    
    // Add sections in order
    sections.forEach((section) => {
      result.push({ section, items: sectionMap.get(section.id) ?? [] });
    });
    
    // Add unsectioned items at the end
    const unsectioned = sectionMap.get(null) ?? [];
    if (unsectioned.length > 0) {
      result.push({ section: null, items: unsectioned });
    }

    return result;
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

  const handleQuickToggle = (item: TaskChecklistItem) => {
    const newStatus: TaskItemStatus = item.status === 'done' ? 'todo' : 'done';
    onUpdateItem(item.id, { status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (items.length === 0 && sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No tasks yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first task to get started
        </p>
        <Button className="mt-4" onClick={() => onAddItem(null)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedItems.map((group, groupIdx) => (
        <div key={group.section?.id ?? 'unsectioned'}>
          {/* Section Header (for structured lists) */}
          {mode === 'structured_list' && group.section && (
            <div className="flex items-center justify-between mb-2 px-1">
              <h4 className="text-sm font-semibold text-foreground">
                {group.section.name}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddItem(group.section?.id)}
                className="h-7 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
          )}

          {/* Tasks Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24">Due</TableHead>
                  {mode === 'structured_list' && !group.section && (
                    <TableHead className="w-28">Section</TableHead>
                  )}
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={mode === 'structured_list' ? 6 : 5} className="text-center text-muted-foreground py-8">
                      No tasks in this section
                    </TableCell>
                  </TableRow>
                ) : (
                  group.items.map((item) => {
                    const overdue = isOverdue(item);
                    const dueLabel = getDueLabel(item);
                    const status = statusConfig[item.status];
                    const StatusIcon = status.icon;

                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          overdue && 'bg-destructive/5',
                          item.status === 'done' && 'opacity-60'
                        )}
                      >
                        {/* Checkbox */}
                        <TableCell>
                          <Checkbox
                            checked={item.status === 'done'}
                            onCheckedChange={() => handleQuickToggle(item)}
                          />
                        </TableCell>

                        {/* Task Title */}
                        <TableCell>
                          <div
                            className="cursor-pointer"
                            onClick={() => onEditItem(item)}
                          >
                            <span
                              className={cn(
                                'font-medium',
                                item.status === 'done' && 'line-through'
                              )}
                            >
                              {item.title}
                            </span>
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Badge
                                variant="outline"
                                className={cn('cursor-pointer gap-1', status.color)}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {status.label}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {(['todo', 'in_progress', 'done'] as TaskItemStatus[]).map((s) => {
                                const cfg = statusConfig[s];
                                const Icon = cfg.icon;
                                return (
                                  <DropdownMenuItem
                                    key={s}
                                    onClick={() => onUpdateItem(item.id, { status: s })}
                                    disabled={s === item.status}
                                  >
                                    <Icon className={cn('mr-2 h-4 w-4', cfg.color)} />
                                    {cfg.label}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>

                        {/* Due Date */}
                        <TableCell>
                          {dueLabel ? (
                            <span
                              className={cn(
                                'text-sm',
                                overdue && 'text-destructive font-medium'
                              )}
                            >
                              {dueLabel}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Section (for unsectioned items in structured mode) */}
                        {mode === 'structured_list' && !group.section && (
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {sections.find((s) => s.id === item.section_id)?.name ?? 'Unsectioned'}
                            </span>
                          </TableCell>
                        )}

                        {/* Actions */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditItem(item)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => onDeleteItem(item.id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      {/* Add Task Button (for quick lists) */}
      {mode === 'quick_list' && (
        <Button variant="outline" onClick={() => onAddItem(null)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      )}
    </div>
  );
}
