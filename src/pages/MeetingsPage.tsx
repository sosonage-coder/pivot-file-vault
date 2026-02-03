import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { useModule } from '@/contexts/ModuleContext';

export function MeetingsPage() {
  const { selectedEntity } = useModule();

  return (
    <FeatureLayout
      title="Meetings"
      description="Meeting agendas and action items"
      icon={<Users className="h-5 w-5" />}
    >
      <FeatureContent>
        <FeatureEmptyState
          icon={<Users className="h-8 w-8" />}
          title="Meetings coming soon"
          description="Track meeting agendas, notes, and action items in one place"
          action={
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Button>
          }
        />
      </FeatureContent>
    </FeatureLayout>
  );
}
