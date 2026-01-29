import { useState, useCallback } from 'react';
import { List, LayoutGrid, Calendar as CalendarIcon, CalendarDays, Plus, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

import { ChecklistListView } from './ChecklistListView';
import { ChecklistKanbanView } from './ChecklistKanbanView';
import { ChecklistCalendarView } from './ChecklistCalendarView';
import { CloseCalendarView } from './CloseCalendarView';
import { ChecklistItemModal } from './ChecklistItemModal';

import {
  useTaskChecklist,
  useChecklistStats,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
} from '@/hooks/useTaskChecklists';

import type {
  TaskChecklistWithRelations,
  TaskChecklistItem,
  ChecklistViewType,
  TaskItemStatus,
} from '@/types/task-checklists';

interface ChecklistDetailViewProps {
  checklist: TaskChecklistWithRelations;
  onBack?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ChecklistDetailView({
  checklist,
  onBack,
  onEdit,
  onDelete,
}: ChecklistDetailViewProps) {
  const [view, setView] = useState<ChecklistViewType>('list');
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TaskChecklistItem | null>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Fetch full checklist data with sections and items
  const { data: fullChecklist, isLoading } = useTaskChecklist(checklist.id);
  const { data: stats } = useChecklistStats(checklist.id);

  // Mutations
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItemMutation = useDeleteItem();

  const items = fullChecklist?.items ?? [];
  const sections = fullChecklist?.sections ?? [];

  // Determine if this is a close schedule
  const isCloseSchedule = !!checklist.start_date && !!checklist.duration_days;

  // Available views based on checklist type
  const availableViews: { key: ChecklistViewType; label: string; icon: typeof List }[] = [
    { key: 'list', label: 'List', icon: List },
    { key: 'kanban', label: 'Kanban', icon: LayoutGrid },
    ...(isCloseSchedule
      ? [{ key: 'close_calendar' as ChecklistViewType, label: 'Close', icon: CalendarDays }]
      : [{ key: 'calendar' as ChecklistViewType, label: 'Calendar', icon: CalendarIcon }]),
  ];

  // Handlers
  const handleAddItem = useCallback((sectionId?: string | null) => {
    setEditingItem(null);
    setDefaultSectionId(sectionId ?? null);
    setItemModalOpen(true);
  }, []);

  const handleEditItem = useCallback((item: TaskChecklistItem) => {
    setEditingItem(item);
    setDefaultSectionId(item.section_id);
    setItemModalOpen(true);
  }, []);

  const handleUpdateItem = useCallback(
    (itemId: string, updates: { status?: TaskItemStatus; section_id?: string | null }) => {
      updateItem.mutate({
        itemId,
        checklistId: checklist.id,
        updates,
      });
    },
    [updateItem, checklist.id]
  );

  const handleDeleteItem = useCallback((itemId: string) => {
    setItemToDelete(itemId);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteItem = useCallback(() => {
    if (itemToDelete) {
      deleteItemMutation.mutate({
        itemId: itemToDelete,
        checklistId: checklist.id,
      });
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  }, [itemToDelete, deleteItemMutation, checklist.id]);

  const handleSaveItem = useCallback(
    async (data: {
      title: string;
      description?: string;
      section_id?: string | null;
      due_date?: string | null;
      relative_day?: number | null;
      status?: TaskItemStatus;
    }) => {
      if (editingItem) {
        await updateItem.mutateAsync({
          itemId: editingItem.id,
          checklistId: checklist.id,
          updates: data,
        });
      } else {
        await createItem.mutateAsync({
          checklist_id: checklist.id,
          title: data.title,
          description: data.description,
          section_id: data.section_id,
          due_date: data.due_date,
          relative_day: data.relative_day,
          status: 'todo',
        });
      }
    },
    [editingItem, updateItem, createItem, checklist.id]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">{checklist.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {checklist.mode === 'quick_list' ? 'Quick List' : 'Structured'}
              </Badge>
              {isCloseSchedule && (
                <Badge variant="secondary" className="text-xs">
                  Close Schedule
                </Badge>
              )}
              {checklist.departments?.name && (
                <Badge variant="outline" className="text-xs">
                  {checklist.departments.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress */}
          {stats && stats.total > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-32">
                <Progress value={stats.completionRate} className="h-2" />
              </div>
              <span className="text-sm text-muted-foreground">
                {stats.done}/{stats.total}
              </span>
            </div>
          )}

          {/* View Tabs */}
          <Tabs value={view} onValueChange={(v) => setView(v as ChecklistViewType)}>
            <TabsList>
              {availableViews.map(({ key, label, icon: Icon }) => (
                <TabsTrigger key={key} value={key} className="gap-1.5">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Add Task */}
          <Button onClick={() => handleAddItem(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  Edit Checklist
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Checklist
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        {view === 'list' && (
          <ChecklistListView
            items={items}
            sections={sections}
            mode={checklist.mode}
            startDate={checklist.start_date}
            isLoading={isLoading}
            onUpdateItem={handleUpdateItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
          />
        )}

        {view === 'kanban' && (
          <ChecklistKanbanView
            items={items}
            sections={sections}
            mode={checklist.mode}
            startDate={checklist.start_date}
            isLoading={isLoading}
            onUpdateItem={handleUpdateItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
          />
        )}

        {view === 'calendar' && (
          <ChecklistCalendarView
            items={items}
            startDate={checklist.start_date}
            isLoading={isLoading}
            onSelectItem={handleEditItem}
          />
        )}

        {view === 'close_calendar' && isCloseSchedule && (
          <CloseCalendarView
            items={items}
            startDate={checklist.start_date!}
            durationDays={checklist.duration_days!}
            isLoading={isLoading}
            onSelectItem={handleEditItem}
          />
        )}
      </ScrollArea>

      {/* Item Modal */}
      <ChecklistItemModal
        open={itemModalOpen}
        onOpenChange={setItemModalOpen}
        mode={checklist.mode}
        sections={sections}
        item={editingItem}
        defaultSectionId={defaultSectionId}
        hasRelativeDays={isCloseSchedule}
        onSave={handleSaveItem}
        isLoading={createItem.isPending || updateItem.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
