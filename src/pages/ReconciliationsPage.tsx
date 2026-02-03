import { Scale } from 'lucide-react';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { useModule } from '@/contexts/ModuleContext';
import { ReconciliationWorkspace } from '@/components/reconciliations/ReconciliationWorkspace';

export function ReconciliationsPage() {
  const { selectedEntity, selectedPeriod } = useModule();

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

  return (
    <FeatureLayout
      title="Reconciliations"
      description={`${selectedEntity.name}${selectedPeriod ? ` • ${selectedPeriod.label}` : ''}`}
      icon={<Scale className="h-5 w-5" />}
    >
      <FeatureContent noPadding>
        <ReconciliationWorkspace
          reconciliationId={null}
          entityId={selectedEntity.id}
          periodId={selectedPeriod?.id}
        />
      </FeatureContent>
    </FeatureLayout>
  );
}
