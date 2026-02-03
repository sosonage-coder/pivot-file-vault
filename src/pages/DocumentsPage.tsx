import { FileText, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeatureLayout, FeatureContent, FeatureEmptyState } from '@/components/layout/FeatureLayout';
import { useModule } from '@/contexts/ModuleContext';

export function DocumentsPage() {
  const { selectedEntity, selectedPeriod } = useModule();

  if (!selectedEntity) {
    return (
      <FeatureLayout
        title="Documents"
        description="File management and approvals"
        icon={<FileText className="h-5 w-5" />}
      >
        <FeatureEmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No entity selected"
          description="Please select an entity from the sidebar to view documents"
        />
      </FeatureLayout>
    );
  }

  return (
    <FeatureLayout
      title="Documents"
      description={`${selectedEntity.name}${selectedPeriod ? ` • ${selectedPeriod.label}` : ''}`}
      icon={<FileText className="h-5 w-5" />}
      actions={
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      }
    >
      <FeatureContent>
        <FeatureEmptyState
          icon={<FileText className="h-8 w-8" />}
          title="Documents coming soon"
          description="Document management features are being built"
          action={
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Document
            </Button>
          }
        />
      </FeatureContent>
    </FeatureLayout>
  );
}
