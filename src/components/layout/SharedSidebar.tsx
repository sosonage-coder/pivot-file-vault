import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useModule } from '@/contexts/ModuleContext';
import { useEntities } from '@/hooks/useEntities';
import { useFolderStructure } from '@/hooks/useFolderStructure';
import { usePendingApprovalCounts } from '@/hooks/useApprovals';
import { EntitySelector } from '@/components/filegrid/EntitySelector';
import { FolderTree } from '@/components/filegrid/FolderTree';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TreeNode, FileObject } from '@/types/filegrid';

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
  const { selectedEntity, setSelectedEntity, activeModule } = useModule();
  const { data: entities, isLoading: entitiesLoading } = useEntities();
  const { data: folderStructure, isLoading: foldersLoading } = useFolderStructure(
    selectedEntity?.id ?? null
  );
  const { data: pendingCounts } = usePendingApprovalCounts(selectedEntity?.id ?? null);

  // Auto-select first entity
  useEffect(() => {
    if (entities?.length && !selectedEntity) {
      setSelectedEntity(entities[0]);
    }
  }, [entities, selectedEntity, setSelectedEntity]);

  // Only Documents shows the full folder tree in SharedSidebar
  // Other modules have their own layouts with integrated trees
  const showFolderTree = activeModule === 'documents';

  // For non-document modules, show a slim sidebar with just entity/period selectors
  if (!showFolderTree) {
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
      </aside>
    );
  }

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
          <FolderTree
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
