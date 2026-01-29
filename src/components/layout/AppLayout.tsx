import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useModule } from '@/contexts/ModuleContext';
import { AppHeader } from './AppHeader';
import { SharedSidebar } from './SharedSidebar';
import { CreateEntityModal } from '@/components/filegrid/CreateEntityModal';
import { CreateProcessModal } from '@/components/filegrid/CreateProcessModal';
import { EditObjectModal } from '@/components/filegrid/EditObjectModal';
import type { TreeNode, FileObject } from '@/types/filegrid';

export function AppLayout() {
  const { user, loading: authLoading, isExternalReviewer, isAdmin } = useAuth();
  const { selectedEntity } = useModule();
  
  const [externalReviewMode, setExternalReviewMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [createEntityModalOpen, setCreateEntityModalOpen] = useState(false);
  const [createProcessModalOpen, setCreateProcessModalOpen] = useState(false);
  const [editObjectModalOpen, setEditObjectModalOpen] = useState(false);
  const [objectToEdit, setObjectToEdit] = useState<FileObject | null>(null);

  // External reviewers always see review mode
  useEffect(() => {
    if (isExternalReviewer) {
      setExternalReviewMode(true);
    }
  }, [isExternalReviewer]);

  // Reset selected node when entity changes
  useEffect(() => {
    setSelectedNode(null);
  }, [selectedEntity?.id]);

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

  const handleEditObject = (node: TreeNode) => {
    if (node.type === 'object') {
      const obj: FileObject = {
        id: node.id,
        name: node.name,
        entity_id: selectedEntity?.id || '',
        department_id: (node.metadata?.department_id as string) || '',
        process_id: (node.metadata?.process_id as string) || '',
        area_id: (node.metadata?.area_id as string) || '',
        requires_approval: (node.metadata?.requires_approval as boolean) || false,
        created_at: '',
        updated_at: '',
      };
      setObjectToEdit(obj);
      setEditObjectModalOpen(true);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader
        externalReviewMode={externalReviewMode}
        onToggleReviewMode={setExternalReviewMode}
      />

      <div className="flex flex-1 overflow-hidden">
        <SharedSidebar
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
          onEditObject={handleEditObject}
          isAdmin={isAdmin}
          onCreateEntity={() => setCreateEntityModalOpen(true)}
          onCreateProcess={() => setCreateProcessModalOpen(true)}
        />

        {/* Module content rendered via Outlet */}
        <Outlet context={{ 
          selectedNode, 
          setSelectedNode,
          externalReviewMode,
        }} />
      </div>

      {/* Global Modals */}
      <CreateEntityModal
        open={createEntityModalOpen}
        onOpenChange={setCreateEntityModalOpen}
      />

      {selectedEntity && (
        <CreateProcessModal
          open={createProcessModalOpen}
          onOpenChange={setCreateProcessModalOpen}
          entity={selectedEntity}
        />
      )}

      <EditObjectModal
        open={editObjectModalOpen}
        onOpenChange={(open) => {
          setEditObjectModalOpen(open);
          if (!open) setObjectToEdit(null);
        }}
        object={objectToEdit}
      />
    </div>
  );
}
