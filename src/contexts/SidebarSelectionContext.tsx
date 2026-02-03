import { createContext, useContext, useState, ReactNode } from 'react';
import type { TreeNode } from '@/types/filegrid';

interface SidebarSelectionContextType {
  selectedNode: TreeNode | null;
  setSelectedNode: (node: TreeNode | null) => void;
}

const SidebarSelectionContext = createContext<SidebarSelectionContextType | undefined>(undefined);

interface SidebarSelectionProviderProps {
  children: ReactNode;
}

export function SidebarSelectionProvider({ children }: SidebarSelectionProviderProps) {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  return (
    <SidebarSelectionContext.Provider value={{ selectedNode, setSelectedNode }}>
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
