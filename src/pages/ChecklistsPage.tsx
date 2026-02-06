import { CheckSquare } from 'lucide-react';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { WorkspaceFilterBar } from '@/components/layout/WorkspaceFilterBar';
import { useModule } from '@/contexts/ModuleContext';
import { ChecklistWorkspace } from '@/components/checklists/ChecklistWorkspace';
import { isConsolidatedEntity } from '@/lib/entities';

export function ChecklistsPage() {
  const { selectedEntity, selectedPeriod } = useModule();

  if (!selectedEntity) {
    return (
      <FeatureLayout
        title="Checklists"
        description="Task lists and checklist management"
        icon={<CheckSquare className="h-5 w-5" />}
      >
        <FeatureEmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title="No entity selected"
          description="Please select an entity from the sidebar to view checklists"
        />
      </FeatureLayout>
    );
  }

  if (isConsolidatedEntity(selectedEntity)) {
    return (
      <FeatureLayout
        title="Checklists"
        description="Task lists and checklist management"
        icon={<CheckSquare className="h-5 w-5" />}
      >
        <FeatureEmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title="Select a specific entity"
          description="Checklists are managed per entity. Choose an entity to continue."
        />
      </FeatureLayout>
    );
  }

  return (
    <FeatureLayout
      title="Checklists"
      description={selectedEntity.name}
      icon={<CheckSquare className="h-5 w-5" />}
      filterBar={<WorkspaceFilterBar />}
    >
      <FeatureContent noPadding>
        <ChecklistWorkspace
          entityId={selectedEntity.id}
          periodId={selectedPeriod?.id}
        />
      </FeatureContent>
    </FeatureLayout>
  );
}
