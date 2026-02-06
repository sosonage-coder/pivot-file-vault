import { useMemo, useState } from 'react';
import { ClipboardList, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { WorkspaceFilterBar } from '@/components/layout/WorkspaceFilterBar';
import { WhyEmptyPanel } from '@/components/layout/WhyEmptyPanel';
import { PbcChecklistWorkspace } from '@/components/pbc/PbcChecklistWorkspace';
import { CreatePbcRequestModal } from '@/components/pbc/CreatePbcRequestModal';
import { useModule } from '@/contexts/ModuleContext';
import { useSidebarSelection } from '@/contexts/SidebarSelectionContext';
import { usePbcTree } from '@/hooks/usePbcTree';
import { isConsolidatedEntity } from '@/lib/entities';
import type { PbcStatus } from '@/types/filegrid';
import type { PbcTreeNode } from '@/types/pbc-tree';
import { mapPbcToReviewState } from '@/lib/reviewState';

interface PbcRequestWithPath {
  id: string;
  label: string;
  status: PbcStatus;
  dueDate: string | null;
  priority: string | null;
  process: string;
  area: string;
  object: string;
}

export function PBCRequestsPage() {
  const { selectedEntity, selectedPeriod, showExceptionsOnly } = useModule();
  const { selectedNode } = useSidebarSelection();
  const [showAddRequest, setShowAddRequest] = useState(false);
  const [auditMode, setAuditMode] = useState(false);

  const { tree: pbcTree, isLoading: isLoadingPbc } = usePbcTree({
    entityId: selectedEntity?.id || null,
    periodId: selectedPeriod?.id || null,
  });

  const allRequests = useMemo(() => flattenPbcRequests(pbcTree), [pbcTree]);

  const selectedObjectId = selectedNode?.type === 'object' ? selectedNode.id : null;
  const objectRequests = pbcTree
    .flatMap((node) => collectRequestsForObject(node, selectedObjectId))
    .filter(Boolean)
    .filter((request) => (auditMode ? request.status === 'Uploaded' || request.status === 'Reviewed' || request.status === 'Complete' : true))
    .filter((request) => (showExceptionsOnly ? request.status !== 'Complete' : true));
    .filter((request) => (auditMode ? request.status === 'Uploaded' || request.status === 'Reviewed' || request.status === 'Complete' : true));

  const handleFulfillRequest = async (requestId: string, fileUrl: string) => {
    console.log('Fulfill request:', requestId, fileUrl);
  };

  const handleExportPbcIndex = () => {
    const rows = allRequests.map((request) => {
      const phase = mapPbcToReviewState(request.status);
      const phase = request.status === 'Requested'
        ? 'Requested'
        : request.status === 'Complete'
          ? 'Complete'
          : 'Provided';

      return [
        selectedEntity?.name || 'Unknown Entity',
        selectedPeriod?.label || 'All Periods',
        request.process,
        request.area,
        request.object,
        request.label,
        request.status,
        phase,
        request.priority || 'normal',
        request.dueDate || '',
      ];
    });

    const headers = ['Entity', 'Period', 'Process', 'Area', 'Object', 'Request', 'Status', 'PBC Phase', 'Priority', 'Due Date'];
    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))].join('\n');
    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).split('"').join('""')}"`).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pbc-index-${selectedEntity?.name || 'entity'}-${selectedPeriod?.label || 'all-periods'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
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

  if (isConsolidatedEntity(selectedEntity)) {
    return (
      <FeatureLayout
        title="PBC Requests"
        description="Manage audit documentation requests"
        icon={<ClipboardList className="h-5 w-5" />}
      >
        <FeatureEmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="Select a specific entity"
          description="PBC requests are managed per entity. Choose an entity to view requests."
        />
      </FeatureLayout>
    );
  }

  return (
    <FeatureLayout
      title="PBC Requests"
      description={selectedEntity.name}
      icon={<ClipboardList className="h-5 w-5" />}
      filterBar={<WorkspaceFilterBar />}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
            <Switch id="pbc-audit-mode" checked={auditMode} onCheckedChange={setAuditMode} />
            <Label htmlFor="pbc-audit-mode" className="text-xs">Audit Mode</Label>
          </div>

          <Button variant="outline" onClick={handleExportPbcIndex}>
            <Download className="mr-2 h-4 w-4" />
            Export PBC Index
          </Button>

          {selectedObjectId && (
            <Button onClick={() => setShowAddRequest(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Request
            </Button>
          )}
        </div>
      }
    >
      <FeatureContent>
        {selectedNode?.type === 'object' ? (
          <>
            <PbcChecklistWorkspace
              objectNode={selectedNode}
              requests={objectRequests.map((req) => ({
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
            <WhyEmptyPanel show={!isLoadingPbc && objectRequests.length === 0} contextLabel="PBC requests" />
          </>
          <PbcChecklistWorkspace
            objectNode={selectedNode}
            requests={objectRequests.map((req) => ({
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

function flattenPbcRequests(tree: PbcTreeNode[]): PbcRequestWithPath[] {
  const results: PbcRequestWithPath[] = [];

  const walk = (node: PbcTreeNode, path: { process: string; area: string; object: string }) => {
    let nextPath = { ...path };

    if (node.node_type === 'process') nextPath.process = node.label;
    if (node.node_type === 'area') nextPath.area = node.label;
    if (node.node_type === 'object') nextPath.object = node.label;

    if (node.node_type === 'request' && node.status) {
      results.push({
        id: node.id,
        label: node.label,
        status: node.status,
        dueDate: node.due_date,
        priority: node.priority,
        process: nextPath.process || 'Unknown Process',
        area: nextPath.area || 'Unknown Area',
        object: nextPath.object || 'Unknown Object',
      });
    }

    node.children.forEach((child) => walk(child, nextPath));
  };

  tree.forEach((root) => walk(root, { process: '', area: '', object: '' }));
  return results;
}
