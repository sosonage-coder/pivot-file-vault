import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEntities } from '@/hooks/useEntities';
import { useFolderStructure } from '@/hooks/useFolderStructure';
import { useDocuments } from '@/hooks/useDocuments';
import { usePivotDocuments } from '@/hooks/usePivotDocuments';
import { usePendingApprovalCounts } from '@/hooks/useApprovals';
import { useObject } from '@/hooks/useObjects';
import { Header } from '@/components/filegrid/Header';
import { EntitySelector } from '@/components/filegrid/EntitySelector';
import { FolderTree } from '@/components/filegrid/FolderTree';
import { DocumentList } from '@/components/filegrid/DocumentList';
import { UploadDocumentModal } from '@/components/filegrid/UploadDocumentModal';
import { CreateEntityModal } from '@/components/filegrid/CreateEntityModal';
import { CreateProcessModal } from '@/components/filegrid/CreateProcessModal';
import { ClonePeriodModal } from '@/components/filegrid/ClonePeriodModal';
import { EditObjectModal } from '@/components/filegrid/EditObjectModal';
import { ViewSelector, type ViewType } from '@/components/filegrid/ViewSelector';
import { PivotView } from '@/components/filegrid/PivotView';
import { PivotFilterBar } from '@/components/filegrid/PivotFilterBar';
import { WhatsMissingView } from '@/components/filegrid/WhatsMissingView';
import { PBCListView } from '@/components/filegrid/PBCListView';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Copy } from 'lucide-react';
import type { Entity, TreeNode, PivotViewType, PivotFilters, FileObject } from '@/types/filegrid';

const DEFAULT_FILTERS: PivotFilters = {
  statusList: [],
  periodId: null,
  areaId: null,
  objectId: null,
};

export default function Index() {
  const { user, loading: authLoading, isExternalReviewer, isAdmin } = useAuth();
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [externalReviewMode, setExternalReviewMode] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createEntityModalOpen, setCreateEntityModalOpen] = useState(false);
  const [createProcessModalOpen, setCreateProcessModalOpen] = useState(false);
  const [clonePeriodModalOpen, setClonePeriodModalOpen] = useState(false);
  const [editObjectModalOpen, setEditObjectModalOpen] = useState(false);
  const [objectToEdit, setObjectToEdit] = useState<FileObject | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('folder');
  const [pivotFilters, setPivotFilters] = useState<PivotFilters>(DEFAULT_FILTERS);

  const { data: entities, isLoading: entitiesLoading } = useEntities();
  const { data: folderStructure, isLoading: foldersLoading } = useFolderStructure(
    selectedEntity?.id ?? null
  );
  const { data: pendingCounts } = usePendingApprovalCounts(selectedEntity?.id ?? null);
  
  // Get object data for editing
  const { data: objectData } = useObject(objectToEdit?.id ?? null);
  
  // Determine if we need documents (not for analysis views)
  const isAnalysisView = currentView === 'whats-missing' || currentView === 'pbc-requests';
  const isPivotView = !['folder', 'whats-missing', 'pbc-requests'].includes(currentView);

  // Build status filter based on context
  const getStatusFilter = () => {
    // External reviewers or review mode always see Final only
    if (externalReviewMode || isExternalReviewer) {
      return 'Final' as const;
    }
    // If in pivot view and user has status filters, use those
    if (isPivotView && pivotFilters.statusList.length > 0) {
      return pivotFilters.statusList;
    }
    // "Final Only" view
    if (currentView === 'status-final') {
      return 'Final' as const;
    }
    return null;
  };

  // For folder view, filter by area/object; for pivot views, apply pivot filters
  const { data: documents, isLoading: documentsLoading } = useDocuments({
    areaId: currentView === 'folder' 
      ? (selectedNode?.type === 'area' ? selectedNode.id : 
         selectedNode?.type === 'object' ? (selectedNode.metadata?.area_id as string) : null)
      : (isPivotView ? pivotFilters.areaId : null),
    entityId: selectedEntity?.id ?? null,
    statusFilter: getStatusFilter(),
    periodId: isPivotView ? pivotFilters.periodId : null,
    objectId: currentView === 'folder' && selectedNode?.type === 'object' 
      ? selectedNode.id 
      : (isPivotView ? pivotFilters.objectId : null),
  });

  // Group documents for pivot views
  const pivotGroups = usePivotDocuments(
    documents || [],
    isPivotView ? currentView as PivotViewType : 'period-area-object'
  );

  // Auto-select first entity
  useEffect(() => {
    if (entities?.length && !selectedEntity) {
      setSelectedEntity(entities[0]);
    }
  }, [entities, selectedEntity]);

  // External reviewers always see review mode
  useEffect(() => {
    if (isExternalReviewer) {
      setExternalReviewMode(true);
    }
  }, [isExternalReviewer]);

  // Reset filters when switching entities
  useEffect(() => {
    setPivotFilters(DEFAULT_FILTERS);
    setSelectedNode(null);
  }, [selectedEntity?.id]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleNodeSelect = (node: TreeNode) => {
    setSelectedNode(node);
    // Switch to folder view when selecting a node
    if (currentView !== 'folder') {
      setCurrentView('folder');
    }
  };

  const handleEditObject = (node: TreeNode) => {
    if (node.type === 'object') {
      // Create a FileObject from the tree node
      const obj: FileObject = {
        id: node.id,
        name: node.name,
        entity_id: selectedEntity?.id || '',
        department_id: (node.metadata?.department_id as string) || '',
        process_id: (node.metadata?.process_id as string) || '',
        area_id: (node.metadata?.area_id as string) || '',
        requires_approval: (node.metadata?.requires_approval as boolean) || false,
        created_at: '',
        updated_at: '',
      };
      setObjectToEdit(obj);
      setEditObjectModalOpen(true);
    }
  };

  const getSelectedPath = (): string => {
    if (currentView !== 'folder') {
      const viewLabels: Record<ViewType, string> = {
        'folder': 'All Documents',
        'period-area-object': 'By Period',
        'object-period': 'By Object',
        'area-period': 'By Area',
        'document-type': 'By Document Type',
        'status-final': 'Final Documents',
        'whats-missing': "What's Missing",
        'pbc-requests': 'PBC Requests',
      };
      return `${selectedEntity?.name} — ${viewLabels[currentView]}`;
    }
    if (!selectedNode) return 'All Documents';
    if (selectedNode.type === 'object') {
      // Show Area / Object path
      const areaName = folderStructure?.flatMap(d => 
        d.children?.flatMap(p => 
          p.children?.filter(a => a.id === selectedNode.metadata?.area_id)
        )
      ).filter(Boolean)[0]?.name || '';
      return `${selectedEntity?.name} / ${areaName} / ${selectedNode.name}`;
    }
    if (selectedNode.type === 'area') {
      return `${selectedEntity?.name} / ${selectedNode.name}`;
    }
    return selectedNode.name;
  };

  const renderMainContent = () => {
    if (isAnalysisView && selectedEntity) {
      if (currentView === 'whats-missing') {
        return <WhatsMissingView entity={selectedEntity} />;
      }
      if (currentView === 'pbc-requests') {
        return <PBCListView entity={selectedEntity} />;
      }
    }

    if (isPivotView) {
      return (
        <div className="space-y-4">
          <PivotFilterBar
            filters={pivotFilters}
            onFiltersChange={setPivotFilters}
            areas={folderStructure || []}
          />
          <PivotView
            groups={pivotGroups}
            isLoading={documentsLoading || entitiesLoading}
          />
        </div>
      );
    }

    return (
      <DocumentList
        documents={documents || []}
        isLoading={documentsLoading || entitiesLoading}
      />
    );
  };

  // Get area info for Add Document button when object is selected
  const getAreaForUpload = (): TreeNode | null => {
    if (selectedNode?.type === 'area') return selectedNode;
    if (selectedNode?.type === 'object') {
      // Find the parent area
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

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header 
        externalReviewMode={externalReviewMode}
        onToggleReviewMode={setExternalReviewMode}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Folder Tree */}
        <aside className="flex w-64 flex-col border-r bg-sidebar-background">
          <div className="border-b p-3">
            <EntitySelector
              entities={entities || []}
              selectedEntity={selectedEntity}
              onSelect={setSelectedEntity}
              isAdmin={isAdmin}
              onCreateEntity={() => setCreateEntityModalOpen(true)}
              onCreateProcess={() => setCreateProcessModalOpen(true)}
            />
          </div>

          <ScrollArea className="flex-1 p-2">
            {foldersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <FolderTree
                nodes={folderStructure || []}
                selectedId={currentView === 'folder' ? (selectedNode?.id ?? null) : null}
                onSelect={handleNodeSelect}
                pendingCounts={pendingCounts}
                onEditObject={handleEditObject}
              />
            )}
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg font-medium">{getSelectedPath()}</h2>
                {(externalReviewMode || isExternalReviewer) && currentView === 'folder' && (
                  <p className="text-sm text-muted-foreground">
                    Viewing finalized documents only
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ViewSelector value={currentView} onChange={setCurrentView} />
              
              {/* Clone Period button - show for admins/users on pivot views */}
              {selectedEntity && !isExternalReviewer && isPivotView && (
                <Button variant="outline" onClick={() => setClonePeriodModalOpen(true)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Clone Period
                </Button>
              )}
              
              {/* Add Document button - show when Area or Object is selected in folder view */}
              {currentView === 'folder' && uploadArea && selectedEntity && !isExternalReviewer && (
                <Button onClick={() => setUploadModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Document
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            {renderMainContent()}
          </ScrollArea>
        </main>
      </div>

      {/* Upload Document Modal */}
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

      {/* Admin: Create Entity Modal */}
      <CreateEntityModal
        open={createEntityModalOpen}
        onOpenChange={setCreateEntityModalOpen}
      />

      {/* Admin: Create Process Modal */}
      {selectedEntity && (
        <CreateProcessModal
          open={createProcessModalOpen}
          onOpenChange={setCreateProcessModalOpen}
          entity={selectedEntity}
        />
      )}

      {/* Clone Period Modal */}
      {selectedEntity && (
        <ClonePeriodModal
          open={clonePeriodModalOpen}
          onOpenChange={setClonePeriodModalOpen}
          entity={selectedEntity}
        />
      )}

      {/* Edit Object Modal */}
      <EditObjectModal
        open={editObjectModalOpen}
        onOpenChange={(open) => {
          setEditObjectModalOpen(open);
          if (!open) setObjectToEdit(null);
        }}
        object={objectToEdit}
      />
    </div>
  );
}
