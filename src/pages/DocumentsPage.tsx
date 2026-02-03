import { FileText, Upload, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { DocumentList } from '@/components/filegrid/DocumentList';
import { UploadDocumentModal } from '@/components/filegrid/UploadDocumentModal';
import { EditObjectModal } from '@/components/filegrid/EditObjectModal';
import { useModule } from '@/contexts/ModuleContext';
import { useSidebarSelection } from '@/contexts/SidebarSelectionContext';
import { useDocuments } from '@/hooks/useDocuments';
import { useObject } from '@/hooks/useObjects';
import { useState } from 'react';

export function DocumentsPage() {
  const { selectedEntity, selectedPeriod } = useModule();
  const { selectedNode } = useSidebarSelection();
  const [showUpload, setShowUpload] = useState(false);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);

  // Get selected area or object for document filtering
  const selectedAreaId = selectedNode?.type === 'area' 
    ? selectedNode.id 
    : selectedNode?.type === 'object' 
      ? selectedNode.metadata?.area_id as string 
      : null;
  
  const selectedObjectId = selectedNode?.type === 'object' ? selectedNode.id : null;

  const { data: documents = [], isLoading: isLoadingDocs } = useDocuments({
    areaId: selectedAreaId,
    entityId: selectedEntity?.id || null,
    periodId: selectedPeriod?.id || null,
    objectId: selectedObjectId,
  });

  // Fetch object data for edit modal
  const { data: editingObject } = useObject(editingObjectId);

  if (!selectedEntity) {
    return (
      <FeatureLayout
        title="Documents"
        description="File management and approvals"
        icon={<FileText className="h-5 w-5" />}
      >
        <FeatureEmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No entity selected"
          description="Please select an entity from the sidebar to view documents"
        />
      </FeatureLayout>
    );
  }

  // Check if we have an area selected (either directly or via object) for upload
  const canUpload = selectedNode && (
    selectedNode.type === 'area' || 
    (selectedNode.type === 'object' && selectedNode.metadata?.area_id)
  );

  const uploadAreaNode = selectedNode?.type === 'area' 
    ? selectedNode 
    : selectedNode?.type === 'object' && selectedNode.metadata?.area_id 
      ? { 
          id: selectedNode.metadata.area_id as string, 
          name: 'Area', 
          type: 'area' as const,
          metadata: selectedNode.metadata 
        }
      : null;

  // Build breadcrumb text from node metadata
  const getBreadcrumb = () => {
    if (!selectedNode) return '';
    const parts: string[] = [];
    
    if (selectedNode.metadata?.department_name) {
      parts.push(selectedNode.metadata.department_name as string);
    }
    
    parts.push(selectedNode.name);
    
    return parts.join(' / ');
  };

  return (
    <FeatureLayout
      title="Documents"
      description={`${selectedEntity.name}${selectedPeriod ? ` • ${selectedPeriod.label}` : ''}`}
      icon={<FileText className="h-5 w-5" />}
      actions={
        canUpload && (
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        )
      }
    >
      <FeatureContent>
        {selectedNode ? (
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <FolderOpen className="h-4 w-4" />
              <span>{getBreadcrumb()}</span>
            </div>
            <DocumentList documents={documents} isLoading={isLoadingDocs} />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-medium">Select a folder</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Choose a process, area, or object from the sidebar to view documents
            </p>
          </div>
        )}
      </FeatureContent>

      {showUpload && uploadAreaNode && selectedPeriod && (
        <UploadDocumentModal
          open={showUpload}
          onOpenChange={setShowUpload}
          selectedNode={uploadAreaNode}
          selectedEntity={selectedEntity}
          departmentId={uploadAreaNode.metadata?.department_id as string || ''}
          processId={uploadAreaNode.metadata?.process_id as string || ''}
        />
      )}

      <EditObjectModal
        open={!!editingObjectId}
        onOpenChange={(open) => !open && setEditingObjectId(null)}
        object={editingObject || null}
      />
    </FeatureLayout>
  );
}
