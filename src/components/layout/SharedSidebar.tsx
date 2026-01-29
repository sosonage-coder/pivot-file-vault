import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useModule } from '@/contexts/ModuleContext';
import { useEntities } from '@/hooks/useEntities';
import { usePeriods } from '@/hooks/usePeriods';
import { useUnifiedFolderStructure } from '@/hooks/useUnifiedFolderStructure';
import { usePendingApprovalCounts } from '@/hooks/useApprovals';
import { EntitySelector } from '@/components/filegrid/EntitySelector';
import { UnifiedFolderTree } from '@/components/filegrid/UnifiedFolderTree';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TreeNode } from '@/types/filegrid';

interface SharedSidebarProps {
  selectedNode: TreeNode | null;
  onSelectNode: (node: TreeNode) => void;
  onEditObject?: (node: TreeNode) => void;
  isAdmin?: boolean;
  onCreateEntity?: () => void;
  onCreateProcess?: () => void;
}

export function SharedSidebar({
  selectedNode,
  onSelectNode,
  onEditObject,
  isAdmin,
  onCreateEntity,
  onCreateProcess,
}: SharedSidebarProps) {
  const { selectedEntity, setSelectedEntity, selectedPeriod, setSelectedPeriod } = useModule();
  const { data: entities, isLoading: entitiesLoading } = useEntities();
  const { data: periods } = usePeriods();
  const { data: folderStructure, isLoading: foldersLoading } = useUnifiedFolderStructure(
    selectedEntity?.id ?? null,
    selectedPeriod?.id ?? null
  );
  const { data: pendingCounts } = usePendingApprovalCounts(selectedEntity?.id ?? null);

  // Auto-select first entity
  useEffect(() => {
    if (entities?.length && !selectedEntity) {
      setSelectedEntity(entities[0]);
    }
  }, [entities, selectedEntity, setSelectedEntity]);

  // Auto-select first period
  useEffect(() => {
    if (periods?.length && !selectedPeriod) {
      setSelectedPeriod(periods[0]);
    }
  }, [periods, selectedPeriod, setSelectedPeriod]);

  return (
    <aside className="flex w-64 flex-col border-r bg-sidebar-background">
      <div className="border-b p-3">
        <EntitySelector
          entities={entities || []}
          selectedEntity={selectedEntity}
          onSelect={setSelectedEntity}
          isAdmin={isAdmin}
          onCreateEntity={onCreateEntity}
          onCreateProcess={onCreateProcess}
        />
      </div>

      <ScrollArea className="flex-1 p-2">
        {foldersLoading || entitiesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <UnifiedFolderTree
            nodes={folderStructure || []}
            selectedId={selectedNode?.id ?? null}
            onSelect={onSelectNode}
            pendingCounts={pendingCounts}
            onEditObject={onEditObject}
          />
        )}
      </ScrollArea>
    </aside>
  );
}
