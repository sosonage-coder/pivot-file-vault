import { CheckSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { useModule } from '@/contexts/ModuleContext';
import { ChecklistWorkspace } from '@/components/checklists/ChecklistWorkspace';

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

  return (
    <FeatureLayout
      title="Checklists"
      description={`${selectedEntity.name}${selectedPeriod ? ` • ${selectedPeriod.label}` : ''}`}
      icon={<CheckSquare className="h-5 w-5" />}
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
