import { useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Plus,
  ClipboardList,
  LayoutList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

import { CreateChecklistModal } from './CreateChecklistModal';
import { ChecklistDetailView } from './ChecklistDetailView';

import {
  useTaskChecklists,
  useChecklistStats,
  useCreateChecklist,
  useDeleteChecklist,
} from '@/hooks/useTaskChecklists';

import type { TaskChecklistWithRelations, ChecklistMode } from '@/types/task-checklists';

interface ChecklistWorkspaceProps {
  entityId: string;
  departmentId?: string | null;
  periodId?: string | null;
}

function ChecklistCard({
  checklist,
  onClick,
  onDelete,
}: {
  checklist: TaskChecklistWithRelations;
  onClick: () => void;
  onDelete: () => void;
}) {
  const { data: stats } = useChecklistStats(checklist.id);
  const isCloseSchedule = !!checklist.start_date;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {checklist.mode === 'quick_list' ? (
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            ) : (
              <LayoutList className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle className="text-base">{checklist.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {checklist.description && (
          <CardDescription className="line-clamp-1">
            {checklist.description}
          </CardDescription>
        )}
        {/* Visual hint for available views */}
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          Click to open List • Kanban • Calendar views
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Badges */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {checklist.mode === 'quick_list' ? 'Quick List' : 'Structured'}
            </Badge>
            {isCloseSchedule && (
              <Badge variant="secondary" className="text-xs">
                Close Schedule
              </Badge>
            )}
            {checklist.is_template && (
              <Badge variant="default" className="text-xs">
                Template
              </Badge>
            )}
          </div>

          {/* Progress */}
          {stats && stats.total > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-1.5" />
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>{stats.done} done</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-500" />
                <span>{stats.in_progress} in progress</span>
              </div>
              {stats.overdue > 0 && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{stats.overdue} overdue</span>
                </div>
              )}
            </div>
          )}

          {/* Date Info */}
          {isCloseSchedule && checklist.start_date && (
            <div className="text-xs text-muted-foreground">
              Started: {format(parseISO(checklist.start_date), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ChecklistWorkspace({
  entityId,
  departmentId,
  periodId,
}: ChecklistWorkspaceProps) {
  const [selectedChecklist, setSelectedChecklist] = useState<TaskChecklistWithRelations | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState<TaskChecklistWithRelations | null>(null);

  // Fetch checklists
  const { data: checklists = [], isLoading } = useTaskChecklists(entityId, {
    departmentId,
    periodId,
    isTemplate: false,
  });

  // Mutations
  const createChecklist = useCreateChecklist();
  const deleteChecklist = useDeleteChecklist();

  // Handlers
  const handleCreateChecklist = useCallback(
    async (data: {
      name: string;
      description?: string;
      mode: ChecklistMode;
      start_date?: string;
      duration_days?: number;
      is_template?: boolean;
    }) => {
      await createChecklist.mutateAsync({
        entity_id: entityId,
        department_id: departmentId,
        period_id: periodId,
        ...data,
      });
    },
    [createChecklist, entityId, departmentId, periodId]
  );

  const handleDeleteChecklist = useCallback((checklist: TaskChecklistWithRelations) => {
    setChecklistToDelete(checklist);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteChecklist = useCallback(() => {
    if (checklistToDelete) {
      deleteChecklist.mutate({
        checklistId: checklistToDelete.id,
        entityId,
      });
      if (selectedChecklist?.id === checklistToDelete.id) {
        setSelectedChecklist(null);
      }
    }
    setDeleteConfirmOpen(false);
    setChecklistToDelete(null);
  }, [checklistToDelete, deleteChecklist, entityId, selectedChecklist]);

  // If a checklist is selected, show its detail view
  if (selectedChecklist) {
    return (
      <ChecklistDetailView
        checklist={selectedChecklist}
        onBack={() => setSelectedChecklist(null)}
        onDelete={() => handleDeleteChecklist(selectedChecklist)}
      />
    );
  }

  // Otherwise, show the checklist list
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold">Checklists</h2>
          <p className="text-sm text-muted-foreground">
            Manage task lists and close schedules
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Checklist
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading checklists...</div>
          </div>
        ) : checklists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No checklists yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first checklist to start tracking tasks
            </p>
            <Button className="mt-4" onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Checklist
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {checklists.map((checklist) => (
              <ChecklistCard
                key={checklist.id}
                checklist={checklist}
                onClick={() => setSelectedChecklist(checklist)}
                onDelete={() => handleDeleteChecklist(checklist)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Create Modal */}
      <CreateChecklistModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSave={handleCreateChecklist}
        isLoading={createChecklist.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checklist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{checklistToDelete?.name}"? All tasks in this checklist will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteChecklist}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
