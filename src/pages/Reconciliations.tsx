import { useState, useMemo } from 'react';
import { useModule } from '@/contexts/ModuleContext';
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
import { usePeriods } from '@/hooks/usePeriods';
import { useReconciliations } from '@/hooks/useReconciliations';
import { useReconciliationTree, type ReconciliationTreeNode } from '@/hooks/useReconciliationTree';
import { ReconciliationTree } from '@/components/reconciliations/ReconciliationTree';
import { ReconciliationWorkspace } from '@/components/reconciliations/ReconciliationWorkspace';
import { CreateReconciliationModal } from '@/components/reconciliations/CreateReconciliationModal';

export default function ReconciliationsModule() {
  const { selectedEntity, selectedPeriod, setSelectedPeriod } = useModule();
  const { data: periods = [] } = usePeriods();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ReconciliationTreeNode | null>(null);
  
  const { data: reconciliations = [], isLoading } = useReconciliations(
    selectedEntity?.id || null,
    selectedPeriod?.id || null
  );
  
  // Build tree from reconciliations
  const tree = useReconciliationTree(reconciliations);
  
  // Get selected reconciliation ID
  const selectedReconciliationId = selectedNode?.type === 'account' 
    ? selectedNode.reconciliationId || null 
    : null;

  // Calculate stats for header
  const stats = useMemo(() => {
    let total = 0;
    let certified = 0;
    
    reconciliations.forEach((r) => {
      total++;
      if (r.status === 'certified') certified++;
    });
    
    return { total, certified };
  }, [reconciliations]);

  const handleNodeSelect = (node: ReconciliationTreeNode) => {
    setSelectedNode(node);
  };

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-medium">
            {selectedEntity?.name ?? 'Reconciliations'} — Balance Sheet Reconciliations
          </h2>
          <p className="text-sm text-muted-foreground">
            {stats.total > 0 
              ? `${stats.certified} of ${stats.total} accounts certified`
              : 'Track account reconciliations through preparer/reviewer workflow'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <Select
            value={selectedPeriod?.id || 'all'}
            onValueChange={(value) => {
              const period = periods.find((p) => p.id === value);
              setSelectedPeriod(period || null);
              setSelectedNode(null);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Periods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Create Button */}
          <Button onClick={() => setIsCreateModalOpen(true)} disabled={!selectedEntity}>
            <Plus className="mr-2 h-4 w-4" />
            New Reconciliation
          </Button>
        </div>
      </div>

      {/* Main Content - Split Pane Layout (matching Documents) */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: Account Tree */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="flex h-full flex-col border-r bg-sidebar-background">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-medium">Accounts</h3>
            </div>
            <ScrollArea className="flex-1 p-2">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ReconciliationTree
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
          <ReconciliationWorkspace 
            reconciliationId={selectedReconciliationId}
            entityId={selectedEntity?.id || null}
            periodId={selectedPeriod?.id}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Create Modal */}
      {selectedEntity && (
        <CreateReconciliationModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          entityId={selectedEntity.id}
          defaultPeriodId={selectedPeriod?.id}
        />
      )}
    </main>
  );
}
