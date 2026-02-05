import { CalendarClock } from 'lucide-react';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { WorkspaceFilterBar } from '@/components/layout/WorkspaceFilterBar';
import { useModule } from '@/contexts/ModuleContext';
import { MonthCloseWorkspace } from '@/components/monthclose/MonthCloseWorkspace';
import { isConsolidatedEntity } from '@/lib/entities';

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

  if (isConsolidatedEntity(selectedEntity)) {
    return (
      <FeatureLayout
        title="Close Calendar"
        description="Manage month-end closing tasks and schedules"
        icon={<CalendarClock className="h-5 w-5" />}
      >
        <FeatureEmptyState
          icon={<CalendarClock className="h-8 w-8" />}
          title="Select a specific entity"
          description="Close schedules are managed per entity. Choose an entity to view close activities."
        />
      </FeatureLayout>
    );
  }

  return (
    <FeatureLayout
      title="Close Calendar"
      description={selectedEntity.name}
      icon={<CalendarClock className="h-5 w-5" />}
      filterBar={<WorkspaceFilterBar />}
    >
      <FeatureContent noPadding>
        <MonthCloseWorkspace
          entityId={selectedEntity.id}
          periodId={selectedPeriod?.id}
        />
      </FeatureContent>
    </FeatureLayout>
  );
}
