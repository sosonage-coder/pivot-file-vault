import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useModule } from '@/contexts/ModuleContext';
import { useDocuments } from '@/hooks/useDocuments';
import { useFolderStructure } from '@/hooks/useFolderStructure';
import { usePivotDocuments } from '@/hooks/usePivotDocuments';
import { DocumentList } from '@/components/filegrid/DocumentList';
import { UploadDocumentModal } from '@/components/filegrid/UploadDocumentModal';
import { ClonePeriodModal } from '@/components/filegrid/ClonePeriodModal';
import { ViewSelector } from '@/components/filegrid/ViewSelector';
import { PivotView } from '@/components/filegrid/PivotView';
import { PivotFilterBar } from '@/components/filegrid/PivotFilterBar';
import { WhatsMissingView } from '@/components/filegrid/WhatsMissingView';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, Copy } from 'lucide-react';
import type { TreeNode, PivotViewType, PivotFilters, DocumentStatus } from '@/types/filegrid';

// Document-specific view types (excludes PBC which is now a separate module)
type DocumentViewType = 'folder' | PivotViewType | 'whats-missing';

const DEFAULT_FILTERS: PivotFilters = {
  statusList: [],
  periodId: null,
  areaId: null,
  objectId: null,
};

interface OutletContextType {
  selectedNode: TreeNode | null;
  setSelectedNode: (node: TreeNode | null) => void;
  externalReviewMode: boolean;
}

export default function DocumentsModule() {
  const { isExternalReviewer } = useAuth();
  const { selectedEntity } = useModule();
  const { selectedNode, setSelectedNode, externalReviewMode } = useOutletContext<OutletContextType>();
  
  const [currentView, setCurrentView] = useState<DocumentViewType>('folder');
  const [pivotFilters, setPivotFilters] = useState<PivotFilters>(DEFAULT_FILTERS);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [clonePeriodModalOpen, setClonePeriodModalOpen] = useState(false);

  const { data: folderStructure } = useFolderStructure(selectedEntity?.id ?? null);

  // Determine view type
  const isAnalysisView = currentView === 'whats-missing';
  const isPivotView = !['folder', 'whats-missing'].includes(currentView);

  // Build status filter
  const getStatusFilter = (): DocumentStatus | DocumentStatus[] | null => {
    if (externalReviewMode || isExternalReviewer) {
      return 'Final';
    }
    if (isPivotView && pivotFilters.statusList.length > 0) {
      return pivotFilters.statusList;
    }
    if (currentView === 'status-final') {
      return 'Final';
    }
    return null;
  };

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

  const pivotGroups = usePivotDocuments(
    documents || [],
    isPivotView ? currentView as PivotViewType : 'period-area-object'
  );

  // Handle node selection - switch to folder view
  const handleNodeClick = () => {
    if (currentView !== 'folder') {
      setCurrentView('folder');
    }
  };

  // Get path for breadcrumb display
  const getSelectedPath = (): string => {
    if (currentView !== 'folder') {
      const viewLabels: Record<DocumentViewType, string> = {
        'folder': 'All Documents',
        'period-area-object': 'By Period',
        'object-period': 'By Object',
        'area-period': 'By Area',
        'document-type': 'By Document Type',
        'status-final': 'Final Documents',
        'whats-missing': "What's Missing",
      };
      return `${selectedEntity?.name} — ${viewLabels[currentView]}`;
    }
    if (!selectedNode) return 'All Documents';
    if (selectedNode.type === 'object') {
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

  // Get area for upload button
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

  const renderMainContent = () => {
    if (isAnalysisView && selectedEntity) {
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
          <PivotView
            groups={pivotGroups}
            isLoading={documentsLoading}
          />
        </div>
      );
    }

    return (
      <DocumentList
        documents={documents || []}
        isLoading={documentsLoading}
      />
    );
  };

  // Filter view options for documents module (exclude pbc-requests)
  const handleViewChange = (view: string) => {
    if (view === 'pbc-requests') {
      // Redirect to PBC module (handled via navigation)
      return;
    }
    setCurrentView(view as DocumentViewType);
  };

  return (
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
          <ViewSelector value={currentView} onChange={handleViewChange} />

          {selectedEntity && !isExternalReviewer && isPivotView && (
            <Button variant="outline" onClick={() => setClonePeriodModalOpen(true)}>
              <Copy className="mr-2 h-4 w-4" />
              Clone Period
            </Button>
          )}

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

      {/* Module-specific modals */}
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
    </main>
  );
}
