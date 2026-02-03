import { CalendarClock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { useModule } from '@/contexts/ModuleContext';
import { ChecklistWorkspace } from '@/components/checklists/ChecklistWorkspace';

export function CloseCalendarPage() {
  const { selectedEntity, selectedPeriod } = useModule();

  if (!selectedEntity) {
    return (
      <FeatureLayout
        title="Close Calendar"
        description="Manage month-end closing tasks and schedules"
        icon={<CalendarClock className="h-5 w-5" />}
      >
        <FeatureEmptyState
          icon={<CalendarClock className="h-8 w-8" />}
          title="No entity selected"
          description="Please select an entity from the sidebar to view close schedules"
        />
      </FeatureLayout>
    );
  }

  return (
    <FeatureLayout
      title="Close Calendar"
      description={`${selectedEntity.name}${selectedPeriod ? ` • ${selectedPeriod.label}` : ''}`}
      icon={<CalendarClock className="h-5 w-5" />}
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
