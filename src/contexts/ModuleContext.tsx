import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { Entity, Period } from '@/types/filegrid';

export type ModuleType = 'documents' | 'pbc' | 'tasks' | 'reconciliations';

interface ModuleContextType {
  activeModule: ModuleType;
  selectedEntity: Entity | null;
  setSelectedEntity: (entity: Entity | null) => void;
  selectedPeriod: Period | null;
  setSelectedPeriod: (period: Period | null) => void;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

// Map routes to module types
const routeToModule: Record<string, ModuleType> = {
  '/': 'documents',
  '/pbc': 'pbc',
  '/tasks': 'tasks',
  '/reconciliations': 'reconciliations',
};

interface ModuleProviderProps {
  children: ReactNode;
}

export function ModuleProvider({ children }: ModuleProviderProps) {
  const location = useLocation();
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  // Derive active module from current route
  const activeModule: ModuleType = routeToModule[location.pathname] || 'documents';

  return (
    <ModuleContext.Provider
      value={{
        activeModule,
        selectedEntity,
        setSelectedEntity,
        selectedPeriod,
        setSelectedPeriod,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModule must be used within a ModuleProvider');
  }
  return context;
}
