import { useState } from 'react';
import { useModule } from '@/contexts/ModuleContext';
import { useTasks, useTaskStats, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { usePeriods } from '@/hooks/usePeriods';
import { useFolderStructure } from '@/hooks/useFolderStructure';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, List, Calendar, LayoutGrid } from 'lucide-react';
import { TaskStatsCards } from '@/components/tasks/TaskStatsCards';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskCalendarView } from '@/components/tasks/TaskCalendarView';
import { TaskKanbanView } from '@/components/tasks/TaskKanbanView';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { useToast } from '@/hooks/use-toast';
import type { TaskViewType, TaskStatus, TaskWithRelations } from '@/types/tasks';
import type { Process, Area } from '@/types/filegrid';

export default function TasksModule() {
  const { selectedEntity, selectedPeriod, setSelectedPeriod } = useModule();
  const { toast } = useToast();

  const [view, setView] = useState<TaskViewType>('list');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);

  // Data hooks
  const { data: periods = [] } = usePeriods();
  const { data: folderStructure = [] } = useFolderStructure(selectedEntity?.id ?? null);
  const { data: stats, isLoading: statsLoading } = useTaskStats(
    selectedEntity?.id ?? null,
    selectedPeriod?.id
  );
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(
    selectedEntity?.id ?? null,
    { status: statusFilter, periodId: selectedPeriod?.id }
  );

  // Mutations
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Extract processes and areas from folder structure
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

  // Handlers
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
      setSelectedTasks((prev) => prev.filter((id) => id !== taskId));
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

  const handleSelectTask = (taskId: string, selected: boolean) => {
    setSelectedTasks((prev) =>
      selected ? [...prev, taskId] : prev.filter((id) => id !== taskId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedTasks(selected ? tasks.map((t) => t.id) : []);
  };

  const handleFilterByStatus = (status: string | null) => {
    setStatusFilter(status as TaskStatus | null);
    setSelectedTasks([]);
  };

  if (!selectedEntity) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center">
        <p className="text-muted-foreground">Select an entity to view tasks</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-medium">{selectedEntity.name} — Tasks</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track tasks across your organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedPeriod?.id ?? 'all'}
            onValueChange={(val) => {
              const period = periods.find((p) => p.id === val);
              setSelectedPeriod(period ?? null);
            }}
          >
            <SelectTrigger className="w-[180px]">
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

          <Tabs value={view} onValueChange={(v) => setView(v as TaskViewType)}>
            <TabsList>
              <TabsTrigger value="list" className="gap-1">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-1">
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1">
                <Calendar className="h-4 w-4" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button onClick={() => { setEditingTask(null); setCreateModalOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="border-b px-6 py-4">
        <TaskStatsCards
          stats={stats ?? { open: 0, in_progress: 0, completed: 0, cancelled: 0, total: 0, overdue: 0, dueToday: 0, dueThisWeek: 0 }}
          selectedStatus={statusFilter}
          onFilterByStatus={handleFilterByStatus}
        />
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1 p-6">
        {view === 'list' && (
          <TaskListView
            tasks={tasks}
            isLoading={tasksLoading}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            selectedTasks={selectedTasks}
            onSelectTask={handleSelectTask}
            onSelectAll={handleSelectAll}
          />
        )}
        {view === 'kanban' && (
          <TaskKanbanView
            tasks={tasks}
            isLoading={tasksLoading}
            onUpdateTask={handleUpdateTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
        {view === 'calendar' && (
          <TaskCalendarView
            tasks={tasks}
            isLoading={tasksLoading}
            onSelectTask={handleEditTask}
          />
        )}
      </ScrollArea>

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
