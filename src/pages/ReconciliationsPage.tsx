import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Scale, Plus } from 'lucide-react';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { WorkspaceFilterBar, ViewMode } from '@/components/layout/WorkspaceFilterBar';
import { Button } from '@/components/ui/button';
import { useModule } from '@/contexts/ModuleContext';
import { useSidebarSelection } from '@/contexts/SidebarSelectionContext';
import { ReconciliationWorkspace } from '@/components/reconciliations/ReconciliationWorkspace';
import { ReconciliationDashboard } from '@/components/reconciliations/dashboard';
import { CreateReconciliationModal } from '@/components/reconciliations/CreateReconciliationModal';

export function ReconciliationsPage() {
  const { selectedEntity, selectedPeriod } = useModule();
  const { selectedNode } = useSidebarSelection();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Get reconciliation ID from URL params or sidebar selection
  const urlReconciliationId = searchParams.get('id');
  const sidebarReconciliationId = (selectedNode?.metadata?.reconciliationId as string | undefined) || null;
  const selectedReconciliationId = urlReconciliationId || sidebarReconciliationId;

  // When a reconciliation is selected from sidebar, show detail view
  useEffect(() => {
    if (sidebarReconciliationId && !urlReconciliationId) {
      setViewMode('list');
    }
  }, [sidebarReconciliationId, urlReconciliationId]);

  // Reset to dashboard when entity changes
  useEffect(() => {
    setViewMode('dashboard');
    setSearchParams({});
  }, [selectedEntity?.id, setSearchParams]);

  if (!selectedEntity) {
    return (
      <FeatureLayout
        title="Reconciliations"
        description="Account reconciliation workflows"
        icon={<Scale className="h-5 w-5" />}
      >
        <FeatureEmptyState
          icon={<Scale className="h-8 w-8" />}
          title="No entity selected"
          description="Please select an entity from the sidebar to view reconciliations"
        />
      </FeatureLayout>
    );
  }

  const handleSelectReconciliation = (id: string) => {
    setSearchParams({ id });
    setViewMode('list');
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'dashboard') {
      setSearchParams({});
    }
  };

  const renderContent = () => {
    if (selectedReconciliationId) {
      return (
        <ReconciliationWorkspace
          reconciliationId={selectedReconciliationId}
          entityId={selectedEntity.id}
          periodId={selectedPeriod?.id}
        />
      );
    }

    return (
      <ReconciliationDashboard
        entityId={selectedEntity.id}
        periodId={selectedPeriod?.id}
        onSelectReconciliation={handleSelectReconciliation}
      />
    );
  };

  return (
    <FeatureLayout
      title="Reconciliations"
      description={selectedEntity.name}
      icon={<Scale className="h-5 w-5" />}
      actions={
        <Button size="sm" onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Reconciliation
        </Button>
      }
      filterBar={
        <WorkspaceFilterBar
          showViewModeToggle
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          availableViewModes={['dashboard', 'list']}
        />
      }
    >
      <FeatureContent noPadding>
        {renderContent()}
      </FeatureContent>

      <CreateReconciliationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        entityId={selectedEntity.id}
        defaultPeriodId={selectedPeriod?.id}
      />
    </FeatureLayout>
  );
}
