import { useState } from 'react';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { FeatureSplitLayout } from '@/components/layout/FeatureSplitLayout';
import { UnifiedFolderTree } from '@/components/filegrid/UnifiedFolderTree';
import { PbcChecklistWorkspace } from '@/components/pbc/PbcChecklistWorkspace';
import { CreatePbcRequestModal } from '@/components/pbc/CreatePbcRequestModal';
import { useModule } from '@/contexts/ModuleContext';
import { useFeatureFolderStructure } from '@/hooks/useFeatureFolderStructure';
import { usePbcTree } from '@/hooks/usePbcTree';
import type { TreeNode } from '@/types/filegrid';

export function PBCRequestsPage() {
  const { selectedEntity, selectedPeriod } = useModule();
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddRequest, setShowAddRequest] = useState(false);

  const { data: folderTree = [], isLoading: isLoadingTree } = useFeatureFolderStructure({
    entityId: selectedEntity?.id || null,
    periodId: selectedPeriod?.id || null,
    featureType: 'pbc',
  });

  // Get PBC requests for selected object
  const { tree: pbcTree, isLoading: isLoadingPbc } = usePbcTree({
    entityId: selectedEntity?.id || null,
    periodId: selectedPeriod?.id || null,
  });

  // Get requests for the selected object
  const selectedObjectId = selectedNode?.type === 'object' ? selectedNode.id : null;
  const objectRequests = pbcTree
    .flatMap(node => collectRequestsForObject(node, selectedObjectId))
    .filter(Boolean);

  const handleNodeSelect = (node: TreeNode) => {
    setSelectedNode(node);
  };

  const handleFulfillRequest = async (requestId: string, fileUrl: string) => {
    // This will be handled by the PbcChecklistWorkspace
    console.log('Fulfill request:', requestId, fileUrl);
  };

  if (!selectedEntity) {
    return (
      <FeatureLayout
        title="PBC Requests"
        description="Manage audit documentation requests"
        icon={<ClipboardList className="h-5 w-5" />}
      >
        <FeatureEmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No entity selected"
          description="Please select an entity from the sidebar to view PBC requests"
        />
      </FeatureLayout>
    );
  }

  return (
    <FeatureLayout
      title="PBC Requests"
      description={`${selectedEntity.name}${selectedPeriod ? ` • ${selectedPeriod.label}` : ''}`}
      icon={<ClipboardList className="h-5 w-5" />}
      actions={
        selectedObjectId && (
          <Button onClick={() => setShowAddRequest(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Request
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
                placeholder="Search..."
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
              />
            )
          }
        >
          {selectedNode?.type === 'object' ? (
            <PbcChecklistWorkspace
              objectNode={selectedNode}
              requests={objectRequests.map(req => ({
                id: req.id,
                label: req.label,
                status: req.status,
                assignee_id: req.assignee_id,
                due_date: req.due_date,
                notes: req.notes,
                priority: req.priority,
              }))}
              isLoading={isLoadingPbc}
              onFulfillRequest={handleFulfillRequest}
              onAddRequest={() => setShowAddRequest(true)}
              entityId={selectedEntity.id}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">Select an object</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Choose an object from the folder tree to view and manage its PBC requests
              </p>
            </div>
          )}
        </FeatureSplitLayout>
      </FeatureContent>

      {showAddRequest && selectedObjectId && selectedPeriod && (
        <CreatePbcRequestModal
          open={showAddRequest}
          onOpenChange={setShowAddRequest}
          entityId={selectedEntity.id}
          periodId={selectedPeriod.id}
          objectId={selectedObjectId}
          objectName={selectedNode?.name || ''}
        />
      )}
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

// Helper to collect requests for a specific object from the PBC tree
function collectRequestsForObject(node: any, objectId: string | null): any[] {
  if (!objectId) return [];
  
  const results: any[] = [];
  
  if (node.node_type === 'request' && node.object_id === objectId) {
    results.push(node);
  }
  
  if (node.children) {
    for (const child of node.children) {
      results.push(...collectRequestsForObject(child, objectId));
    }
  }
  
  return results;
}
