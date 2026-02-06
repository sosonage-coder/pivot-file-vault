import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Scale, Plus, CloudDownload } from 'lucide-react';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { WorkspaceFilterBar, ViewMode } from '@/components/layout/WorkspaceFilterBar';
import { Button } from '@/components/ui/button';
import { useModule } from '@/contexts/ModuleContext';
import { useSidebarSelection } from '@/contexts/SidebarSelectionContext';
import { ReconciliationWorkspace } from '@/components/reconciliations/ReconciliationWorkspace';
import { ReconciliationDashboard } from '@/components/reconciliations/dashboard';
import { ReconciliationCategoryList } from '@/components/reconciliations/ReconciliationCategoryList';
import { ConsolidatedReconciliationDashboard } from '@/components/reconciliations/ConsolidatedReconciliationDashboard';
import { CreateReconciliationModal } from '@/components/reconciliations/CreateReconciliationModal';
import { ReconciliationImportModal } from '@/components/reconciliations/ReconciliationImportModal';
import { useEntities } from '@/hooks/useEntities';
import { isConsolidatedEntity } from '@/lib/entities';
import type { ReconciliationTemplateType } from '@/types/reconciliations';

export function ReconciliationsPage() {
  const { selectedEntity, selectedPeriod, setSelectedEntity } = useModule();
  const { selectedNode, selectedReconciliationCategory, setSelectedReconciliationCategory } = useSidebarSelection();
  const { data: entities = [] } = useEntities();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedReconciliationId, setSelectedReconciliationId] = useState<string | null>(null);
  const isConsolidated = isConsolidatedEntity(selectedEntity);

  // Get reconciliation ID from URL params or sidebar selection
  const urlReconciliationId = searchParams.get('id');
  const urlEntityId = searchParams.get('entityId');
  const sidebarReconciliationId = (selectedNode?.metadata?.reconciliationId as string | undefined) || null;
  const activeReconciliationId = urlReconciliationId || sidebarReconciliationId || selectedReconciliationId;

  useEffect(() => {
    if (!urlEntityId || !entities.length) return;
    if (selectedEntity?.id === urlEntityId) return;
    const matchedEntity = entities.find(entity => entity.id === urlEntityId);
    if (matchedEntity) {
      setSelectedEntity(matchedEntity);
    }
  }, [entities, selectedEntity?.id, setSelectedEntity, urlEntityId]);

  // When a reconciliation is selected from sidebar, show detail view
  useEffect(() => {
    if (sidebarReconciliationId && !urlReconciliationId) {
      setSelectedReconciliationId(sidebarReconciliationId);
    }
  }, [sidebarReconciliationId, urlReconciliationId]);

  // Reset to dashboard when entity changes
  useEffect(() => {
    setViewMode('dashboard');
    setSelectedReconciliationId(null);
    setSelectedReconciliationCategory(null);
    setSearchParams({});
  }, [selectedEntity?.id, setSearchParams, setSelectedReconciliationCategory]);

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

  if (isConsolidated) {
    return (
      <FeatureLayout
        title="Reconciliations"
        description="All Entities (Consolidated)"
        icon={<Scale className="h-5 w-5" />}
      >
        <FeatureContent noPadding>
          <ConsolidatedReconciliationDashboard entities={entities} />
        </FeatureContent>
      </FeatureLayout>
    );
  }

  const handleSelectReconciliation = (id: string) => {
    setSelectedReconciliationId(id);
    setSearchParams({
      id,
      entityId: selectedEntity.id,
    });
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'dashboard') {
      setSelectedReconciliationId(null);
      setSelectedReconciliationCategory(null);
      setSearchParams({ entityId: selectedEntity.id });
    }
  };

  const handleBackToDashboard = () => {
    setSelectedReconciliationId(null);
    // Go back to category list if a category was selected
    if (selectedReconciliationCategory) {
      setSearchParams({ entityId: selectedEntity.id });
    } else {
      setSearchParams({ entityId: selectedEntity.id });
      setViewMode('dashboard');
    }
  };

  const renderContent = () => {
    // If a specific reconciliation is selected, show detail workspace
    if (activeReconciliationId) {
      return (
        <ReconciliationWorkspace
          reconciliationId={activeReconciliationId}
          entityId={selectedEntity.id}
          periodId={selectedPeriod?.id}
          onClose={handleBackToDashboard}
        />
      );
    }

    // If a category is selected, show accounts for that category
    if (selectedReconciliationCategory) {
      return (
        <ReconciliationCategoryList
          categoryType={selectedReconciliationCategory}
          entityId={selectedEntity.id}
          periodId={selectedPeriod?.id}
          onSelectReconciliation={handleSelectReconciliation}
        />
      );
    }

    // Otherwise show dashboard
    return (
      <ReconciliationDashboard
        entityId={selectedEntity.id}
        periodId={selectedPeriod?.id}
        onSelectReconciliation={handleSelectReconciliation}
      />
    );
  };

  const getDescription = () => {
    if (selectedReconciliationCategory) {
      const labels: Record<ReconciliationTemplateType, string> = {
        general: 'General',
        bank: 'Bank Reconciliations',
        prepaid: 'Prepaid Expenses',
        accrual: 'Accruals',
        fixed_asset: 'Fixed Assets',
        lease: 'Leases',
        intercompany: 'Intercompany',
      };
      return labels[selectedReconciliationCategory] || selectedEntity.name;
    }
    return selectedEntity.name;
  };

  return (
    <FeatureLayout
      title="Reconciliations"
      description={getDescription()}
      icon={<Scale className="h-5 w-5" />}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}>
            <CloudDownload className="h-4 w-4 mr-1.5" />
            Import Data
          </Button>
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Reconciliation
          </Button>
        </div>
      }
      filterBar={
        !activeReconciliationId ? (
          <WorkspaceFilterBar
            showViewModeToggle
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            availableViewModes={['dashboard']}
          />
        ) : null
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

      <ReconciliationImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
      />
    </FeatureLayout>
  );
}
