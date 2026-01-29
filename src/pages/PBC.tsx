import { useState } from 'react';
import { useModule } from '@/contexts/ModuleContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePBCItems } from '@/hooks/usePBCItems';
import { usePeriods } from '@/hooks/usePeriods';
import { useFolderStructure } from '@/hooks/useFolderStructure';
import { CreatePBCItemModal } from '@/components/filegrid/CreatePBCItemModal';
import { FulfillPBCModal } from '@/components/filegrid/FulfillPBCModal';
import { PBCTree, usePBCTree, type PBCTreeNode } from '@/components/pbc/PBCTree';
import { PBCWorkspace } from '@/components/pbc/PBCWorkspace';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Plus, Loader2 } from 'lucide-react';
import type { PbcItemWithRelations } from '@/hooks/usePBCItems';

export default function PBCModule() {
  const { selectedEntity } = useModule();
  const { isExternalReviewer } = useAuth();
  
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [fulfillItem, setFulfillItem] = useState<PbcItemWithRelations | null>(null);
  const [selectedNode, setSelectedNode] = useState<PBCTreeNode | null>(null);

  const periodId = selectedPeriodId !== 'all' ? selectedPeriodId : null;

  const { data: periods = [] } = usePeriods();
  const { data: folderStructure = [], isLoading: foldersLoading } = useFolderStructure(selectedEntity?.id ?? null);
  const { data: items = [], isLoading: itemsLoading } = usePBCItems({
    entityId: selectedEntity?.id ?? null,
    periodId,
  });

  // Build tree from items and folder structure
  const tree = usePBCTree(items, folderStructure);

  // Get selected item
  const selectedItem = selectedNode?.type === 'item' ? selectedNode.pbcItem || null : null;

  // Calculate stats
  const stats = {
    total: items.length,
    complete: items.filter(i => i.status === 'Complete').length,
  };

  const handleNodeSelect = (node: PBCTreeNode) => {
    setSelectedNode(node);
  };

  if (!selectedEntity) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Select an entity to view PBC requests</p>
      </main>
    );
  }

  const isLoading = foldersLoading || itemsLoading;

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-medium">{selectedEntity.name} — PBC Requests</h2>
          <p className="text-sm text-muted-foreground">
            {stats.total > 0
              ? `${stats.complete} of ${stats.total} requests complete`
              : 'Manage document requests and track fulfillment'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Filter */}
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All periods</SelectItem>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!isExternalReviewer && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          )}
        </div>
      </div>

      {/* Main Content - Split Pane Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: PBC Tree */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="flex h-full flex-col border-r bg-sidebar-background">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-medium">Requests</h3>
            </div>
            <ScrollArea className="flex-1 p-2">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <PBCTree
                  nodes={tree}
                  selectedId={selectedNode?.id || null}
                  onSelect={handleNodeSelect}
                />
              )}
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Workspace */}
        <ResizablePanel defaultSize={75}>
          <PBCWorkspace
            item={selectedItem}
            entityId={selectedEntity.id}
            onFulfill={(item) => setFulfillItem(item)}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Create Modal */}
      <CreatePBCItemModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        entity={selectedEntity}
      />

      {/* Fulfill Modal */}
      {fulfillItem && (
        <FulfillPBCModal
          open={!!fulfillItem}
          onOpenChange={(open) => !open && setFulfillItem(null)}
          pbcItem={fulfillItem}
        />
      )}
    </main>
  );
}
