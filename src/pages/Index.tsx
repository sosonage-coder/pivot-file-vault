import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEntities } from '@/hooks/useEntities';
import { useFolderStructure } from '@/hooks/useFolderStructure';
import { useDocuments } from '@/hooks/useDocuments';
import { Header } from '@/components/filegrid/Header';
import { EntitySelector } from '@/components/filegrid/EntitySelector';
import { FolderTree } from '@/components/filegrid/FolderTree';
import { DocumentList } from '@/components/filegrid/DocumentList';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import type { Entity, TreeNode } from '@/types/filegrid';

export default function Index() {
  const { user, loading: authLoading, isExternalReviewer } = useAuth();
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [externalReviewMode, setExternalReviewMode] = useState(false);

  const { data: entities, isLoading: entitiesLoading } = useEntities();
  const { data: folderStructure, isLoading: foldersLoading } = useFolderStructure(
    selectedEntity?.id ?? null
  );
  const { data: documents, isLoading: documentsLoading } = useDocuments({
    areaId: selectedNode?.type === 'area' ? selectedNode.id : null,
    entityId: selectedEntity?.id ?? null,
    statusFilter: (externalReviewMode || isExternalReviewer) ? 'Final' : null
  });

  // Auto-select first entity
  useEffect(() => {
    if (entities?.length && !selectedEntity) {
      setSelectedEntity(entities[0]);
    }
  }, [entities, selectedEntity]);

  // External reviewers always see review mode
  useEffect(() => {
    if (isExternalReviewer) {
      setExternalReviewMode(true);
    }
  }, [isExternalReviewer]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleNodeSelect = (node: TreeNode) => {
    setSelectedNode(node);
  };

  const getSelectedPath = (): string => {
    if (!selectedNode) return 'All Documents';
    if (selectedNode.type === 'area') {
      return `${selectedEntity?.name} / ${selectedNode.name}`;
    }
    return selectedNode.name;
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header 
        externalReviewMode={externalReviewMode}
        onToggleReviewMode={setExternalReviewMode}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Folder Tree */}
        <aside className="flex w-64 flex-col border-r bg-sidebar-background">
          <div className="border-b p-3">
            <EntitySelector
              entities={entities || []}
              selectedEntity={selectedEntity}
              onSelect={setSelectedEntity}
              isAdmin={false}
            />
          </div>

          <ScrollArea className="flex-1 p-2">
            {foldersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <FolderTree
                nodes={folderStructure || []}
                selectedId={selectedNode?.id ?? null}
                onSelect={handleNodeSelect}
              />
            )}
          </ScrollArea>
        </aside>

        {/* Main Content - Document List */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-lg font-medium">{getSelectedPath()}</h2>
              {(externalReviewMode || isExternalReviewer) && (
                <p className="text-sm text-muted-foreground">
                  Viewing finalized documents only
                </p>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 p-6">
            <DocumentList
              documents={documents || []}
              isLoading={documentsLoading || entitiesLoading}
            />
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
