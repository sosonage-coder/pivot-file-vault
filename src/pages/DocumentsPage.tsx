import { useState } from 'react';
import { FileText, Upload, Search, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { FeatureSplitLayout } from '@/components/layout/FeatureSplitLayout';
import { UnifiedFolderTree } from '@/components/filegrid/UnifiedFolderTree';
import { DocumentList } from '@/components/filegrid/DocumentList';
import { UploadDocumentModal } from '@/components/filegrid/UploadDocumentModal';
import { EditObjectModal } from '@/components/filegrid/EditObjectModal';
import { useModule } from '@/contexts/ModuleContext';
import { useFeatureFolderStructure } from '@/hooks/useFeatureFolderStructure';
import { useDocuments } from '@/hooks/useDocuments';
import { usePendingApprovalCounts } from '@/hooks/useApprovals';
import { useObject } from '@/hooks/useObjects';
import type { TreeNode } from '@/types/filegrid';

export function DocumentsPage() {
  const { selectedEntity, selectedPeriod } = useModule();
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);

  const { data: folderTree = [], isLoading: isLoadingTree } = useFeatureFolderStructure({
    entityId: selectedEntity?.id || null,
    periodId: selectedPeriod?.id || null,
    featureType: 'documents',
  });

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

  // Get pending approval counts per object
  const { data: pendingCounts = {} } = usePendingApprovalCounts(selectedEntity?.id || null);

  // Fetch object data for edit modal
  const { data: editingObject } = useObject(editingObjectId);

  const handleNodeSelect = (node: TreeNode) => {
    setSelectedNode(node);
  };

  const handleEditObject = (node: TreeNode) => {
    if (node.type === 'object') {
      setEditingObjectId(node.id);
    }
  };

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
      <FeatureContent noPadding>
        <FeatureSplitLayout
          sidebarHeader={
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          }
          sidebar={
            isLoadingTree ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <UnifiedFolderTree
                nodes={filterNodes(folderTree, searchQuery)}
                selectedId={selectedNode?.id || null}
                onSelect={handleNodeSelect}
                pendingCounts={pendingCounts}
                onEditObject={handleEditObject}
              />
            )
          }
        >
          {selectedNode ? (
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <FolderOpen className="h-4 w-4" />
                <span>{getBreadcrumb(selectedNode)}</span>
              </div>
              <DocumentList documents={documents} isLoading={isLoadingDocs} />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">Select a folder</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Choose a process, area, or object from the folder tree to view documents
              </p>
            </div>
          )}
        </FeatureSplitLayout>
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

// Helper function to filter nodes by search query
function filterNodes(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query.trim()) return nodes;
  
  const lowerQuery = query.toLowerCase();
  
  return nodes.reduce<TreeNode[]>((acc, node) => {
    const matchesQuery = node.name.toLowerCase().includes(lowerQuery);
    const filteredChildren = node.children ? filterNodes(node.children, query) : undefined;
    
    if (matchesQuery || (filteredChildren && filteredChildren.length > 0)) {
      acc.push({
        ...node,
        children: filteredChildren,
      });
    }
    
    return acc;
  }, []);
}

// Helper to build breadcrumb text from node metadata
function getBreadcrumb(node: TreeNode): string {
  const parts: string[] = [];
  
  if (node.metadata?.department_name) {
    parts.push(node.metadata.department_name as string);
  }
  
  parts.push(node.name);
  
  return parts.join(' / ');
}
