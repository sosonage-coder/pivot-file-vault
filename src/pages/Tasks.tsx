import { useState } from 'react';
import { useModule } from '@/contexts/ModuleContext';
import { useTasks, useUpdateTask, useCreateTask } from '@/hooks/useTasks';
import { usePeriods } from '@/hooks/usePeriods';
import { useFolderStructure } from '@/hooks/useFolderStructure';
import { TaskTree, useTaskTree, type TaskTreeNode } from '@/components/tasks/TaskTree';
import { TaskWorkspace } from '@/components/tasks/TaskWorkspace';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TaskStatus, TaskWithRelations } from '@/types/tasks';
import type { Process, Area } from '@/types/filegrid';

export default function TasksModule() {
  const { selectedEntity, selectedPeriod, setSelectedPeriod } = useModule();
  const { toast } = useToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [selectedNode, setSelectedNode] = useState<TaskTreeNode | null>(null);

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

  // Build tree from tasks
  const tree = useTaskTree(tasks, folderStructure);

  // Get selected task
  const selectedTask = selectedNode?.type === 'task' ? selectedNode.task || null : null;

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

  const handleNodeSelect = (node: TaskTreeNode) => {
    setSelectedNode(node);
  };

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

  if (!selectedEntity) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center">
        <p className="text-muted-foreground">Select an entity to view tasks</p>
      </main>
    );
  }

  const isLoading = foldersLoading || tasksLoading;

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

          <Button onClick={() => { setEditingTask(null); setCreateModalOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Main Content - Split Pane Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: Task Tree */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="flex h-full flex-col border-r bg-sidebar-background">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-medium">Tasks</h3>
            </div>
            <ScrollArea className="flex-1 p-2">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <TaskTree
                  nodes={tree}
                  selectedId={selectedNode?.id || null}
                  onSelect={handleNodeSelect}
                />
              )}
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Workspace */}
        <ResizablePanel defaultSize={75}>
          <TaskWorkspace
            task={selectedTask}
            onUpdateTask={handleUpdateTask}
            onEditTask={handleEditTask}
            isUpdating={updateTask.isPending}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

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
