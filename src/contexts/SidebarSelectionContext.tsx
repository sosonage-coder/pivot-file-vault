import { createContext, useContext, useState, ReactNode } from 'react';
import type { TreeNode } from '@/types/filegrid';
import type { ReconciliationFolderNode } from '@/components/reconciliations/ReconciliationSidebarTree';

interface SidebarSelectionContextType {
  selectedNode: TreeNode | null;
  setSelectedNode: (node: TreeNode | null) => void;
  // For reconciliations - hierarchical folder/account selection
  selectedReconciliationNode: ReconciliationFolderNode | null;
  setSelectedReconciliationNode: (node: ReconciliationFolderNode | null) => void;
}

const SidebarSelectionContext = createContext<SidebarSelectionContextType | undefined>(undefined);

interface SidebarSelectionProviderProps {
  children: ReactNode;
}

export function SidebarSelectionProvider({ children }: SidebarSelectionProviderProps) {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [selectedReconciliationNode, setSelectedReconciliationNode] = useState<ReconciliationFolderNode | null>(null);

  return (
    <SidebarSelectionContext.Provider value={{ 
      selectedNode, 
      setSelectedNode,
      selectedReconciliationNode,
      setSelectedReconciliationNode,
    }}>
      {children}
    </SidebarSelectionContext.Provider>
  );
}

export function useSidebarSelection() {
  const context = useContext(SidebarSelectionContext);
  if (context === undefined) {
    throw new Error('useSidebarSelection must be used within a SidebarSelectionProvider');
  }
  return context;
}
