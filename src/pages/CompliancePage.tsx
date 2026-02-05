import { Shield } from 'lucide-react';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { WorkspaceFilterBar } from '@/components/layout/WorkspaceFilterBar';
import { ComplianceWorkspace } from '@/components/compliance/ComplianceWorkspace';
import { useModule } from '@/contexts/ModuleContext';
import { isConsolidatedEntity } from '@/lib/entities';

export function CompliancePage() {
  const { selectedEntity } = useModule();

  if (!selectedEntity) {
    return (
      <FeatureLayout
        title="Compliance"
        description="Regulatory compliance tracking"
        icon={<Shield className="h-5 w-5" />}
      >
        <FeatureEmptyState
          icon={<Shield className="h-8 w-8" />}
          title="No entity selected"
          description="Please select an entity from the sidebar to view compliance items"
        />
      </FeatureLayout>
    );
  }

  if (isConsolidatedEntity(selectedEntity)) {
    return (
      <FeatureLayout
        title="Compliance"
        description="Regulatory compliance tracking"
        icon={<Shield className="h-5 w-5" />}
      >
        <FeatureEmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Select a specific entity"
          description="Compliance items are tracked per entity. Choose an entity to continue."
        />
      </FeatureLayout>
    );
  }

  return (
    <FeatureLayout
      title="Compliance"
      description={selectedEntity.name}
      icon={<Shield className="h-5 w-5" />}
      filterBar={<WorkspaceFilterBar />}
    >
      <FeatureContent noPadding>
        <ComplianceWorkspace />
      </FeatureContent>
    </FeatureLayout>
  );
}
