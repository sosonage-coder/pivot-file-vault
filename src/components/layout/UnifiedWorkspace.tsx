import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useModule } from '@/contexts/ModuleContext';
import { useDocuments } from '@/hooks/useDocuments';
import { useFolderStructure } from '@/hooks/useFolderStructure';
import { usePivotDocuments } from '@/hooks/usePivotDocuments';
// PBC now uses object-based checklist requests (simplified from tree)
import { useTasks, useUpdateTask, useCreateTask, useDeleteTask } from '@/hooks/useTasks';
import { useReconciliations } from '@/hooks/useReconciliations';
import { usePeriods } from '@/hooks/usePeriods';

// Document components
import { DocumentList } from '@/components/filegrid/DocumentList';
import { UploadDocumentModal } from '@/components/filegrid/UploadDocumentModal';
import { ClonePeriodModal } from '@/components/filegrid/ClonePeriodModal';
import { ViewSelector } from '@/components/filegrid/ViewSelector';
import { PivotView } from '@/components/filegrid/PivotView';
import { PivotFilterBar } from '@/components/filegrid/PivotFilterBar';
import { WhatsMissingView } from '@/components/filegrid/WhatsMissingView';

// PBC components
import { PbcChecklistWorkspace } from '@/components/pbc/PbcChecklistWorkspace';
import { CreatePbcRequestModal } from '@/components/pbc/CreatePbcRequestModal';
import { usePbcObjectRequests, useFulfillPbcRequest } from '@/hooks/usePbcObjectRequests';

// Task components
import { TaskDashboard } from '@/components/tasks/TaskDashboard';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskKanbanView } from '@/components/tasks/TaskKanbanView';
import { TaskCalendarView } from '@/components/tasks/TaskCalendarView';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';

// Reconciliation components
import { ReconciliationWorkspace } from '@/components/reconciliations/ReconciliationWorkspace';
import { ReconciliationDashboard } from '@/components/reconciliations/dashboard/ReconciliationDashboard';
import { CreateReconciliationModal } from '@/components/reconciliations/CreateReconciliationModal';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Copy, LayoutDashboard, List, Columns3, Calendar, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TreeNode, PivotViewType, PivotFilters, DocumentStatus, Process, Area } from '@/types/filegrid';
import type { TaskStatus, TaskWithRelations } from '@/types/tasks';
// PbcTreeNode type no longer needed

type DocumentViewType = 'folder' | PivotViewType | 'whats-missing';
type TaskViewMode = 'dashboard' | 'list' | 'kanban' | 'calendar';
// PbcViewMode type no longer needed
type ReconViewMode = 'dashboard' | 'workspace';

const DEFAULT_FILTERS: PivotFilters = {
  statusList: [],
  selectedYear: null,
  selectedMonthPeriodIds: [],
  periodId: null,
  areaId: null,
  objectId: null,
};

interface UnifiedWorkspaceProps {
  selectedNode: TreeNode | null;
  externalReviewMode: boolean;
}

export function UnifiedWorkspace({ selectedNode, externalReviewMode }: UnifiedWorkspaceProps) {
  const { isExternalReviewer } = useAuth();
  const { selectedEntity, selectedPeriod, setSelectedPeriod } = useModule();
  const { toast } = useToast();
  const { data: periods = [] } = usePeriods();

  // Document state
  const [documentView, setDocumentView] = useState<DocumentViewType>('folder');
  const [pivotFilters, setPivotFilters] = useState<PivotFilters>(DEFAULT_FILTERS);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [clonePeriodModalOpen, setClonePeriodModalOpen] = useState(false);

  // PBC state
  const [createPbcRequestModalOpen, setCreatePbcRequestModalOpen] = useState(false);

  // Task state
  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>('dashboard');
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);

  // Recon state
  const [reconViewMode, setReconViewMode] = useState<ReconViewMode>('dashboard');
  const [createReconModalOpen, setCreateReconModalOpen] = useState(false);

  // Data hooks
  const { data: folderStructure } = useFolderStructure(selectedEntity?.id ?? null);
  
  // Determine active module from selected node
  const getActiveModule = (): 'documents' | 'pbc' | 'tasks' | 'reconciliations' | null => {
    if (!selectedNode) return null;
    
    const type = selectedNode.type;
    if (type === 'module-documents' || type === 'process' || type === 'area' || type === 'object') {
      return 'documents';
    }
    // Handle PBC tree node types from sidebar
    if (type === 'module-pbc' || type === 'pbc-item' || type.startsWith('pbc-')) {
      return 'pbc';
    }
    if (type === 'module-tasks' || type === 'task-item') {
      return 'tasks';
    }
    if (type === 'module-reconciliations' || type === 'reconciliation-account') {
      return 'reconciliations';
    }
    if (type === 'department') {
      return 'documents'; // Default to documents for department
    }
    return null;
  };

  const activeModule = getActiveModule();
  const departmentId = selectedNode?.metadata?.department_id as string || null;

  // Document queries
  const isPivotView = activeModule === 'documents' && !['folder', 'whats-missing'].includes(documentView);
  const isAnalysisView = activeModule === 'documents' && documentView === 'whats-missing';
  
  const getStatusFilter = (): DocumentStatus | DocumentStatus[] | null => {
    if (externalReviewMode || isExternalReviewer) return 'Final';
    if (isPivotView && pivotFilters.statusList.length > 0) return pivotFilters.statusList;
    if (documentView === 'status-final') return 'Final';
    return null;
  };

  const { data: documents, isLoading: documentsLoading } = useDocuments({
    areaId: documentView === 'folder'
      ? (selectedNode?.type === 'area' ? selectedNode.id :
         selectedNode?.type === 'object' ? (selectedNode.metadata?.area_id as string) : null)
      : (isPivotView ? pivotFilters.areaId : null),
    entityId: selectedEntity?.id ?? null,
    statusFilter: getStatusFilter(),
    periodId: isPivotView ? pivotFilters.periodId : null,
    objectId: documentView === 'folder' && selectedNode?.type === 'object'
      ? selectedNode.id
      : (isPivotView ? pivotFilters.objectId : null),
  });

  const pivotGroups = usePivotDocuments(
    documents || [],
    isPivotView ? documentView as PivotViewType : 'period-area-object'
  );

  // PBC queries - get requests for selected object
  const selectedPbcObjectId = selectedNode?.type === 'pbc-object' 
    ? (selectedNode.metadata?.object_id as string) 
    : null;
  
  const { data: pbcRequests = [], isLoading: pbcLoading } = usePbcObjectRequests({
    entityId: selectedEntity?.id ?? null,
    objectId: selectedPbcObjectId,
    periodId: selectedPeriod?.id ?? null
  });
  
  const fulfillPbcRequest = useFulfillPbcRequest();

  // Task queries and mutations
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(
    selectedEntity?.id ?? null,
    { periodId: selectedPeriod?.id }
  );
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Extract processes and areas for task modal
  const processes: Process[] = [];
  const areas: Area[] = [];
  folderStructure?.forEach((dept) => {
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

  // Task handlers
  const handleCreateTask = async (data: Parameters<typeof createTask.mutate>[0]) => {
    try {
      await createTask.mutateAsync(data);
      toast({ title: 'Task created successfully' });
      setCreateTaskModalOpen(false);
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
    setCreateTaskModalOpen(true);
  };

  const handleSaveEditTask = async (data: Parameters<typeof createTask.mutate>[0]) => {
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
      setCreateTaskModalOpen(false);
    } catch (error) {
      toast({ title: 'Failed to update task', variant: 'destructive' });
    }
  };

  // Reconciliation queries
  const { data: reconciliations = [] } = useReconciliations(
    selectedEntity?.id || null,
    selectedPeriod?.id || null
  );

  const selectedReconciliationId = selectedNode?.type === 'reconciliation-account' 
    ? selectedNode.id 
    : null;

  // Get area for upload
  const getAreaForUpload = (): TreeNode | null => {
    if (selectedNode?.type === 'area') return selectedNode;
    if (selectedNode?.type === 'object') {
      const areaId = selectedNode.metadata?.area_id as string;
      const area = folderStructure?.flatMap(d =>
        d.children?.flatMap(p =>
          p.children?.filter(a => a.id === areaId)
        )
      ).filter(Boolean)[0];
      return area || null;
    }
    return null;
  };

  const uploadArea = getAreaForUpload();

  // Get path for breadcrumb
  const getSelectedPath = (): string => {
    if (!selectedNode) return 'Select a folder or module';
    
    if (selectedNode.type === 'department') {
      return `${selectedEntity?.name} / ${selectedNode.name}`;
    }
    if (selectedNode.type.startsWith('module-')) {
      const moduleName = selectedNode.name;
      return `${selectedEntity?.name} — ${moduleName}`;
    }
    if (selectedNode.type === 'area') {
      return `${selectedEntity?.name} / ${selectedNode.name}`;
    }
    if (selectedNode.type === 'object') {
      return `${selectedEntity?.name} / ${selectedNode.name}`;
    }
    return selectedNode.name;
  };

  // If no entity selected
  if (!selectedEntity) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Select an entity to get started</p>
      </main>
    );
  }

  // If no node selected, show welcome
  if (!selectedNode) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center">
        <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-medium mb-2">Welcome to {selectedEntity.name}</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Select a department and module from the sidebar to view documents, PBC requests, tasks, or reconciliations.
        </p>
      </main>
    );
  }

  // Render based on active module
  const renderContent = () => {
    switch (activeModule) {
      case 'documents':
        if (isAnalysisView) {
          return <WhatsMissingView entity={selectedEntity} />;
        }
        if (isPivotView) {
          return (
            <div className="space-y-4">
              <PivotFilterBar
                filters={pivotFilters}
                onFiltersChange={setPivotFilters}
                areas={folderStructure || []}
              />
              <PivotView groups={pivotGroups} isLoading={documentsLoading} />
            </div>
          );
        }
        return <DocumentList documents={documents || []} isLoading={documentsLoading} />;

      case 'pbc':
        // Show checklist when an object is selected
        if (selectedNode?.type === 'pbc-object' && selectedPbcObjectId) {
          return (
            <PbcChecklistWorkspace
              objectNode={selectedNode}
              requests={pbcRequests}
              isLoading={pbcLoading}
              entityId={selectedEntity.id}
              onFulfillRequest={async (requestId, fileUrl) => {
                await fulfillPbcRequest.mutateAsync({
                  requestId,
                  entityId: selectedEntity.id,
                  objectId: selectedPbcObjectId,
                  fileUrl
                });
              }}
              onAddRequest={() => setCreatePbcRequestModalOpen(true)}
            />
          );
        }
        
        // Show placeholder for other PBC nodes
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">PBC Requests</h3>
            <p className="text-muted-foreground max-w-md">
              Select an account (like Cash or Accounts Receivable) from the sidebar to view and manage its PBC requests.
            </p>
          </div>
        );

      case 'tasks':
        if (tasksLoading) {
          return (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          );
        }
        switch (taskViewMode) {
          case 'dashboard':
            return (
              <TaskDashboard
                tasks={tasks}
                isLoading={tasksLoading}
                onSelectTask={(task) => { setEditingTask(task); setCreateTaskModalOpen(true); }}
              />
            );
          case 'list':
            return (
              <TaskListView
                tasks={tasks}
                isLoading={tasksLoading}
                onUpdateTask={handleUpdateTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            );
          case 'kanban':
            return (
              <TaskKanbanView
                tasks={tasks}
                isLoading={tasksLoading}
                onUpdateTask={(id, updates) => handleUpdateTask(id, updates)}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            );
          case 'calendar':
            return (
              <TaskCalendarView
                tasks={tasks}
                isLoading={tasksLoading}
                onSelectTask={(task) => { setEditingTask(task); setCreateTaskModalOpen(true); }}
              />
            );
        }
        break;

      case 'reconciliations':
        if (reconViewMode === 'dashboard') {
          return (
            <ReconciliationDashboard
              entityId={selectedEntity.id}
              periodId={selectedPeriod?.id}
              onSelectReconciliation={() => setReconViewMode('workspace')}
            />
          );
        }
        return (
          <ReconciliationWorkspace
            reconciliationId={selectedReconciliationId}
            entityId={selectedEntity.id}
            periodId={selectedPeriod?.id}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Select a module to view content</p>
          </div>
        );
    }
  };

  const renderHeader = () => {
    const commonHeader = (
      <div>
        <h2 className="text-lg font-medium">{getSelectedPath()}</h2>
        {activeModule === 'documents' && (externalReviewMode || isExternalReviewer) && documentView === 'folder' && (
          <p className="text-sm text-muted-foreground">Viewing finalized documents only</p>
        )}
      </div>
    );

    switch (activeModule) {
      case 'documents':
        return (
          <>
            {commonHeader}
            <div className="flex items-center gap-3">
              <ViewSelector value={documentView} onChange={(v) => setDocumentView(v as DocumentViewType)} />
              {!isExternalReviewer && isPivotView && (
                <Button variant="outline" onClick={() => setClonePeriodModalOpen(true)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Clone Period
                </Button>
              )}
              {documentView === 'folder' && uploadArea && !isExternalReviewer && (
                <Button onClick={() => setUploadModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Document
                </Button>
              )}
            </div>
          </>
        );

      case 'pbc':
        return (
          <>
            {commonHeader}
            <div className="flex items-center gap-3">
              {/* Add Request button shows only when an object is selected */}
              {!isExternalReviewer && selectedPeriod && selectedPbcObjectId && (
                <Button onClick={() => setCreatePbcRequestModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Request
                </Button>
              )}
            </div>
          </>
        );

      case 'tasks':
        return (
          <>
            {commonHeader}
            <div className="flex items-center gap-3">
              <Tabs value={taskViewMode} onValueChange={(v) => setTaskViewMode(v as TaskViewMode)}>
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
              <Button onClick={() => { setEditingTask(null); setCreateTaskModalOpen(true); }}>
                <Plus className="mr-1 h-4 w-4" />
                New Task
              </Button>
            </div>
          </>
        );

      case 'reconciliations':
        return (
          <>
            {commonHeader}
            <div className="flex items-center gap-3">
              <Tabs value={reconViewMode} onValueChange={(v) => setReconViewMode(v as ReconViewMode)}>
                <TabsList>
                  <TabsTrigger value="dashboard" className="gap-1.5">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="workspace" className="gap-1.5">
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">Workspace</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={() => setCreateReconModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Reconciliation
              </Button>
            </div>
          </>
        );

      default:
        return commonHeader;
    }
  };

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        {renderHeader()}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        {renderContent()}
      </ScrollArea>

      {/* Document Modals */}
      {uploadArea && selectedEntity && (
        <UploadDocumentModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          selectedNode={uploadArea}
          selectedEntity={selectedEntity}
          departmentId={(uploadArea.metadata?.department_id as string) || ''}
          processId={(uploadArea.metadata?.process_id as string) || ''}
        />
      )}
      {selectedEntity && (
        <ClonePeriodModal
          open={clonePeriodModalOpen}
          onOpenChange={setClonePeriodModalOpen}
          entity={selectedEntity}
        />
      )}

      {/* PBC Request Modal */}
      {selectedEntity && selectedPeriod && selectedPbcObjectId && (
        <CreatePbcRequestModal
          open={createPbcRequestModalOpen}
          onOpenChange={setCreatePbcRequestModalOpen}
          entityId={selectedEntity.id}
          periodId={selectedPeriod.id}
          objectId={selectedPbcObjectId}
          objectName={selectedNode?.name || 'Item'}
        />
      )}

      {/* Task Modal */}
      <CreateTaskModal
        open={createTaskModalOpen}
        onOpenChange={(open) => {
          setCreateTaskModalOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={editingTask ? handleSaveEditTask : handleCreateTask}
        entityId={selectedEntity.id}
        periods={periods}
        processes={processes}
        areas={areas}
        isLoading={createTask.isPending || updateTask.isPending}
        editTask={editingTask}
      />

      {/* Reconciliation Modal */}
      <CreateReconciliationModal
        open={createReconModalOpen}
        onOpenChange={setCreateReconModalOpen}
        entityId={selectedEntity.id}
        defaultPeriodId={selectedPeriod?.id}
      />
    </main>
  );
}
