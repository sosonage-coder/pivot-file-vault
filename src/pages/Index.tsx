import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEntities } from '@/hooks/useEntities';
import { useFolderStructure } from '@/hooks/useFolderStructure';
import { useDocuments } from '@/hooks/useDocuments';
import { usePivotDocuments } from '@/hooks/usePivotDocuments';
import { Header } from '@/components/filegrid/Header';
import { EntitySelector } from '@/components/filegrid/EntitySelector';
import { FolderTree } from '@/components/filegrid/FolderTree';
import { DocumentList } from '@/components/filegrid/DocumentList';
import { UploadDocumentModal } from '@/components/filegrid/UploadDocumentModal';
import { ViewSelector, type ViewType } from '@/components/filegrid/ViewSelector';
import { PivotView } from '@/components/filegrid/PivotView';
import { WhatsMissingView } from '@/components/filegrid/WhatsMissingView';
import { PBCListView } from '@/components/filegrid/PBCListView';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import type { Entity, TreeNode, PivotViewType } from '@/types/filegrid';

export default function Index() {
  const { user, loading: authLoading, isExternalReviewer } = useAuth();
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [externalReviewMode, setExternalReviewMode] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('folder');

  const { data: entities, isLoading: entitiesLoading } = useEntities();
  const { data: folderStructure, isLoading: foldersLoading } = useFolderStructure(
    selectedEntity?.id ?? null
  );
  
  // Determine if we need documents (not for analysis views)
  const isAnalysisView = currentView === 'whats-missing' || currentView === 'pbc-requests';
  const isPivotView = !['folder', 'whats-missing', 'pbc-requests'].includes(currentView);

  // For folder view, filter by area; for pivot views, get all entity documents
  const { data: documents, isLoading: documentsLoading } = useDocuments({
    areaId: currentView === 'folder' && selectedNode?.type === 'area' ? selectedNode.id : null,
    entityId: selectedEntity?.id ?? null,
    statusFilter: (externalReviewMode || isExternalReviewer || currentView === 'status-final') ? 'Final' : null
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
        <PivotView
          groups={pivotGroups}
          isLoading={documentsLoading || entitiesLoading}
        />
      );
    }

    return (
      <DocumentList
        documents={documents || []}
        isLoading={documentsLoading || entitiesLoading}
      />
    );
  };

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
              isAdmin={false}
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
              
              {/* Add Document button - only show when Area is selected in folder view */}
              {currentView === 'folder' && selectedNode?.type === 'area' && selectedEntity && !isExternalReviewer && (
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
      {selectedNode?.type === 'area' && selectedEntity && (
        <UploadDocumentModal
          open={uploadModalOpen}
          onOpenChange={setUploadModalOpen}
          selectedNode={selectedNode}
          selectedEntity={selectedEntity}
          departmentId={(selectedNode.metadata?.department_id as string) || ''}
          processId={(selectedNode.metadata?.process_id as string) || ''}
        />
      )}
    </div>
  );
}
