import { useState, useMemo } from 'react';
import { useModule } from '@/contexts/ModuleContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, List, Columns, Building2 } from 'lucide-react';
import { usePeriods } from '@/hooks/usePeriods';
import { 
  useReconciliations, 
  useReconciliationStats, 
  useUpdateReconciliation,
  useDeleteReconciliation
} from '@/hooks/useReconciliations';
import { ReconciliationStatsCards } from '@/components/reconciliations/ReconciliationStatsCards';
import { ReconciliationListView } from '@/components/reconciliations/ReconciliationListView';
import { CreateReconciliationModal } from '@/components/reconciliations/CreateReconciliationModal';
import { ReconciliationDetailPanel } from '@/components/reconciliations/ReconciliationDetailPanel';
import type { ReconciliationWithRelations, ReconciliationStatus, ReconciliationViewType } from '@/types/reconciliations';

export default function ReconciliationsModule() {
  const { selectedEntity, selectedPeriod, setSelectedPeriod } = useModule();
  const { data: periods = [] } = usePeriods();
  
  const [viewType, setViewType] = useState<ReconciliationViewType>('list');
  const [statusFilter, setStatusFilter] = useState<ReconciliationStatus | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState<ReconciliationWithRelations | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  
  const { data: reconciliations = [], isLoading } = useReconciliations(
    selectedEntity?.id || null,
    selectedPeriod?.id || null
  );
  
  const { data: stats, isLoading: statsLoading } = useReconciliationStats(
    selectedEntity?.id || null,
    selectedPeriod?.id || null
  );
  
  const updateReconciliation = useUpdateReconciliation();
  const deleteReconciliation = useDeleteReconciliation();
  
  // Filter reconciliations by status
  const filteredReconciliations = useMemo(() => {
    if (!statusFilter) return reconciliations;
    return reconciliations.filter((r) => r.status === statusFilter);
  }, [reconciliations, statusFilter]);
  
  const handleUpdateStatus = (id: string, status: ReconciliationStatus) => {
    updateReconciliation.mutate({ id, updates: { status } });
  };
  
  const handleEdit = (recon: ReconciliationWithRelations) => {
    setSelectedReconciliation(recon);
    setIsDetailPanelOpen(true);
  };
  
  const handleDelete = (id: string) => {
    if (!selectedEntity) return;
    if (confirm('Are you sure you want to delete this reconciliation?')) {
      deleteReconciliation.mutate({ id, entityId: selectedEntity.id });
    }
  };
  
  const handleSelectItem = (id: string, selected: boolean) => {
    setSelectedItems((prev) =>
      selected ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };
  
  const handleSelectAll = (selected: boolean) => {
    setSelectedItems(selected ? filteredReconciliations.map((r) => r.id) : []);
  };
  
  const handleFilterChange = (status: ReconciliationStatus | null) => {
    setStatusFilter(status);
    setSelectedItems([]);
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
            Track account reconciliations through preparer/reviewer workflow
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <Select
            value={selectedPeriod?.id || 'all'}
            onValueChange={(value) => {
              const period = periods.find((p) => p.id === value);
              setSelectedPeriod(period || null);
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
          
          {/* View Toggle */}
          <Tabs value={viewType} onValueChange={(v) => setViewType(v as ReconciliationViewType)}>
            <TabsList>
              <TabsTrigger value="list" className="gap-1">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </TabsTrigger>
              <TabsTrigger value="by-status" className="gap-1">
                <Columns className="h-4 w-4" />
                <span className="hidden sm:inline">By Status</span>
              </TabsTrigger>
              <TabsTrigger value="by-account" className="gap-1">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">By Account</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Create Button */}
          <Button onClick={() => setIsCreateModalOpen(true)} disabled={!selectedEntity}>
            <Plus className="mr-2 h-4 w-4" />
            New Reconciliation
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {/* Stats Cards */}
          <ReconciliationStatsCards
            stats={stats || {
              not_started: 0,
              in_progress: 0,
              pending_review: 0,
              rejected: 0,
              approved: 0,
              certified: 0,
              total: 0,
              withVariance: 0,
            }}
            isLoading={statsLoading}
            activeFilter={statusFilter}
            onFilterChange={handleFilterChange}
          />
          
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
              <span className="text-sm font-medium">
                {selectedItems.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItems([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
          
          {/* Main Content */}
          {viewType === 'list' && (
            <ReconciliationListView
              reconciliations={filteredReconciliations}
              isLoading={isLoading}
              onUpdateStatus={handleUpdateStatus}
              onEdit={handleEdit}
              onDelete={handleDelete}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onSelectAll={handleSelectAll}
            />
          )}
          
          {viewType === 'by-status' && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Kanban view by status coming soon</p>
            </div>
          )}
          
          {viewType === 'by-account' && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Grouped by account view coming soon</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Modal */}
      {selectedEntity && (
        <CreateReconciliationModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          entityId={selectedEntity.id}
          defaultPeriodId={selectedPeriod?.id}
        />
      )}

      {/* Detail Panel */}
      <ReconciliationDetailPanel
        reconciliation={selectedReconciliation}
        open={isDetailPanelOpen}
        onOpenChange={setIsDetailPanelOpen}
      />
    </main>
  );
}
