import { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { PbcChecklistWorkspace } from '@/components/pbc/PbcChecklistWorkspace';
import { CreatePbcRequestModal } from '@/components/pbc/CreatePbcRequestModal';
import { useModule } from '@/contexts/ModuleContext';
import { useSidebarSelection } from '@/contexts/SidebarSelectionContext';
import { usePbcTree } from '@/hooks/usePbcTree';

export function PBCRequestsPage() {
  const { selectedEntity, selectedPeriod } = useModule();
  const { selectedNode } = useSidebarSelection();
  const [showAddRequest, setShowAddRequest] = useState(false);

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
      <FeatureContent>
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
        ) : selectedNode?.type === 'area' ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-medium">Select an object</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Expand "{selectedNode.name}" and select an object to view its PBC requests
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-medium">Select an object</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Choose an area and object from the sidebar to view and manage PBC requests
            </p>
          </div>
        )}
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
