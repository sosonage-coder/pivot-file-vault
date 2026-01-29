import { useState } from 'react';
import { useModule } from '@/contexts/ModuleContext';
import { useTasks, useUpdateTask, useCreateTask, useDeleteTask } from '@/hooks/useTasks';
import { usePeriods } from '@/hooks/usePeriods';
import { useFolderStructure } from '@/hooks/useFolderStructure';
import { TaskDashboard } from '@/components/tasks/TaskDashboard';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskKanbanView } from '@/components/tasks/TaskKanbanView';
import { TaskCalendarView } from '@/components/tasks/TaskCalendarView';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, LayoutDashboard, List, Columns3, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TaskStatus, TaskWithRelations } from '@/types/tasks';
import type { Process, Area } from '@/types/filegrid';

type ViewMode = 'dashboard' | 'list' | 'kanban' | 'calendar';

export default function TasksModule() {
  const { selectedEntity, selectedPeriod, setSelectedPeriod } = useModule();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);

  // Data hooks
  const { data: periods = [] } = usePeriods();
  const { data: folderStructure = [], isLoading: foldersLoading } = useFolderStructure(selectedEntity?.id ?? null);
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(
    selectedEntity?.id ?? null,
    { periodId: selectedPeriod?.id }
  );

  // Mutations
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Calculate stats
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  // Extract processes and areas from folder structure for create modal
  const processes: Process[] = [];
  const areas: Area[] = [];
  folderStructure.forEach((dept) => {
    dept.children?.forEach((proc) => {
      processes.push({
        id: proc.id,
        name: proc.name,
        entity_id: selectedEntity?.id ?? '',
        department_id: dept.id,
        template_id: null,
        created_at: '',
        updated_at: '',
      });
      proc.children?.forEach((area) => {
        areas.push({
          id: area.id,
          name: area.name,
          process_id: proc.id,
          template_id: null,
          created_at: '',
          updated_at: '',
        });
      });
    });
  });

  const handleCreateTask = async (data: Parameters<typeof createTask.mutate>[0]) => {
    try {
      await createTask.mutateAsync(data);
      toast({ title: 'Task created successfully' });
      setCreateModalOpen(false);
    } catch (error) {
      toast({ title: 'Failed to create task', variant: 'destructive' });
    }
  };

  const handleUpdateTask = async (taskId: string, updates: { status?: TaskStatus; priority?: string }) => {
    if (!selectedEntity) return;
    try {
      await updateTask.mutateAsync({
        taskId,
        entityId: selectedEntity.id,
        updates: updates as Parameters<typeof updateTask.mutate>[0]['updates'],
      });
      toast({ title: 'Task updated' });
    } catch (error) {
      toast({ title: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedEntity) return;
    try {
      await deleteTask.mutateAsync({ taskId, entityId: selectedEntity.id });
      toast({ title: 'Task deleted' });
    } catch (error) {
      toast({ title: 'Failed to delete task', variant: 'destructive' });
    }
  };

  const handleEditTask = (task: TaskWithRelations) => {
    setEditingTask(task);
    setCreateModalOpen(true);
  };

  const handleSaveEdit = async (data: Parameters<typeof createTask.mutate>[0]) => {
    if (!editingTask || !selectedEntity) return;
    try {
      await updateTask.mutateAsync({
        taskId: editingTask.id,
        entityId: selectedEntity.id,
        updates: {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          due_date: data.due_date,
        },
      });
      toast({ title: 'Task updated successfully' });
      setEditingTask(null);
      setCreateModalOpen(false);
    } catch (error) {
      toast({ title: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleSelectTask = (task: TaskWithRelations) => {
    setEditingTask(task);
    setCreateModalOpen(true);
  };

  if (!selectedEntity) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center">
        <p className="text-muted-foreground">Select an entity to view tasks</p>
      </main>
    );
  }

  const isLoading = foldersLoading || tasksLoading;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    switch (viewMode) {
      case 'dashboard':
        return (
          <TaskDashboard
            tasks={tasks}
            isLoading={isLoading}
            onSelectTask={handleSelectTask}
          />
        );
      case 'list':
        return (
          <ScrollArea className="flex-1 p-6">
            <TaskListView
              tasks={tasks}
              isLoading={isLoading}
              onUpdateTask={handleUpdateTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          </ScrollArea>
        );
      case 'kanban':
        return (
          <ScrollArea className="flex-1 p-6">
            <TaskKanbanView
              tasks={tasks}
              isLoading={isLoading}
              onUpdateTask={(id, updates) => handleUpdateTask(id, updates)}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          </ScrollArea>
        );
      case 'calendar':
        return (
          <ScrollArea className="flex-1 p-6">
            <TaskCalendarView
              tasks={tasks}
              isLoading={isLoading}
              onSelectTask={handleSelectTask}
            />
          </ScrollArea>
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-medium">{selectedEntity.name} — Tasks</h2>
          <p className="text-sm text-muted-foreground">
            {stats.total > 0
              ? `${stats.completed} of ${stats.total} tasks completed`
              : 'Manage and track tasks across your organization'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="dashboard" className="gap-1.5">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-1.5">
                <Columns3 className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Period Selector */}
          <Select
            value={selectedPeriod?.id ?? 'all'}
            onValueChange={(val) => {
              const period = periods.find((p) => p.id === val);
              setSelectedPeriod(period ?? null);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {periods.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={() => { setEditingTask(null); setCreateModalOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Create/Edit Modal */}
      <CreateTaskModal
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={editingTask ? handleSaveEdit : handleCreateTask}
        entityId={selectedEntity.id}
        periods={periods}
        processes={processes}
        areas={areas}
        isLoading={createTask.isPending || updateTask.isPending}
        editTask={editingTask}
      />
    </main>
  );
}
