import { AlertTriangle, FileText, Upload, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { WorkspaceFilterBar } from '@/components/layout/WorkspaceFilterBar';
import { DocumentList } from '@/components/filegrid/DocumentList';
import { UploadDocumentModal } from '@/components/filegrid/UploadDocumentModal';
import { EditObjectModal } from '@/components/filegrid/EditObjectModal';
import { useEffect, useMemo, useState } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useModule } from '@/contexts/ModuleContext';
import { useSidebarSelection } from '@/contexts/SidebarSelectionContext';
import { useDocuments } from '@/hooks/useDocuments';
import { useObject } from '@/hooks/useObjects';
import { useEntities } from '@/hooks/useEntities';
import { useExpectedDocuments } from '@/hooks/useExpectedDocuments';
import { isConsolidatedEntity } from '@/lib/entities';

export function DocumentsPage() {
  const { selectedEntity, selectedPeriod, setSelectedEntity } = useModule();
  const { selectedNode } = useSidebarSelection();
  const { data: entities = [] } = useEntities();
  const [showUpload, setShowUpload] = useState(false);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const urlObjectId = searchParams.get('objectId');
  const urlEntityId = searchParams.get('entityId');

  const selectedAreaId = selectedNode?.type === 'area'
    ? selectedNode.id
    : selectedNode?.type === 'object'
      ? (selectedNode.metadata?.area_id as string)
      : null;

  const selectedObjectId = selectedNode?.type === 'object' ? selectedNode.id : null;

  useEffect(() => {
    if (!urlEntityId || !entities.length) return;
    if (selectedEntity?.id === urlEntityId) return;
    const matchedEntity = entities.find((entity) => entity.id === urlEntityId);
    const matchedEntity = entities.find(entity => entity.id === urlEntityId);
    if (matchedEntity) {
      setSelectedEntity(matchedEntity);
    }
  }, [entities, selectedEntity?.id, setSelectedEntity, urlEntityId]);

  const { data: urlObject } = useObject(urlObjectId);
  const activeObjectId = urlObjectId || selectedObjectId;
  const activeAreaId = urlObject?.area_id || selectedAreaId;

  const { data: documents = [], isLoading: isLoadingDocs } = useDocuments({
    areaId: activeAreaId,
    entityId: selectedEntity?.id || null,
    periodId: selectedPeriod?.id || null,
    objectId: activeObjectId,
  });

  const { data: expectedDocuments = [] } = useExpectedDocuments({
    entityId: selectedEntity?.id || null,
    periodId: selectedPeriod?.id || null,
  });

  const requirementsForSelection = useMemo(() => {
    if (!activeAreaId) return [];
    return expectedDocuments.filter((doc) => doc.areaId === activeAreaId);
  }, [expectedDocuments, activeAreaId]);

  const requirementStats = useMemo(() => {
    const requiredRows = requirementsForSelection.filter((row) => row.required);
    const required = requiredRows.length;
    const missing = requiredRows.filter((row) => !row.uploaded).length;
    const draft = requiredRows.filter((row) => row.document?.status === 'Draft').length;
    const final = requiredRows.filter((row) => row.document?.status === 'Final').length;

    return { required, missing, draft, final };
  }, [requirementsForSelection]);

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

  if (isConsolidatedEntity(selectedEntity)) {
    return (
      <FeatureLayout
        title="Documents"
        description="File management and approvals"
        icon={<FileText className="h-5 w-5" />}
      >
        <FeatureEmptyState
          icon={<FileText className="h-8 w-8" />}
          title="Select a specific entity"
          description="Documents are available per entity. Choose an entity to view files."
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
          metadata: selectedNode.metadata,
        }
      : null;

  const getBreadcrumb = () => {
    if (selectedNode) {
      const parts: string[] = [];

      if (selectedNode.metadata?.department_name) {
        parts.push(selectedNode.metadata.department_name as string);
      }

      parts.push(selectedNode.name);

      return parts.join(' / ');
    }

    if (urlObject) {
      return urlObject.name;
    }

      
      if (selectedNode.metadata?.department_name) {
        parts.push(selectedNode.metadata.department_name as string);
      }
      
      parts.push(selectedNode.name);
      
      return parts.join(' / ');
    }

    if (urlObject) {
      return urlObject.name;
    }

    return '';
  };

  return (
    <FeatureLayout
      title="Documents"
      description={selectedEntity.name}
      icon={<FileText className="h-5 w-5" />}
      filterBar={<WorkspaceFilterBar showStatusFilter />}
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
        {selectedNode || urlObject ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <FolderOpen className="h-4 w-4" />
              <span>{getBreadcrumb()}</span>
            </div>

            {!!activeAreaId && !!selectedPeriod?.id && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Deliverable Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Required: {requirementStats.required}</Badge>
                    <Badge variant="outline">Missing: {requirementStats.missing}</Badge>
                    <Badge variant="outline">Draft: {requirementStats.draft}</Badge>
                    <Badge variant="outline">Final: {requirementStats.final}</Badge>
                  </div>

                  {requirementStats.missing > 0 && (
                    <div className="rounded-md border border-amber-400/50 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-200">
                      <div className="inline-flex items-center gap-2 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Soft policy warning
                      </div>
                      <div className="mt-1">
                        This area still has missing required deliverables for the selected period. Uploading them will improve close completeness and review readiness.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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

      {showUpload && uploadAreaNode && (
        <UploadDocumentModal
          open={showUpload}
          onOpenChange={setShowUpload}
          selectedNode={uploadAreaNode}
          selectedEntity={selectedEntity}
          departmentId={(uploadAreaNode.metadata?.department_id as string) || ''}
          processId={(uploadAreaNode.metadata?.process_id as string) || ''}
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
