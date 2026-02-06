import { createContext, useContext, useState, ReactNode } from 'react';
import type { Entity, Period } from '@/types/filegrid';
import { isConsolidatedEntity } from '@/lib/entities';

interface ModuleContextType {
  selectedEntity: Entity | null;
  setSelectedEntity: (entity: Entity | null) => void;
  selectedPeriod: Period | null;
  setSelectedPeriod: (period: Period | null) => void;
  showExceptionsOnly: boolean;
  setShowExceptionsOnly: (value: boolean) => void;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

interface ModuleProviderProps {
  children: ReactNode;
}

export function ModuleProvider({ children }: ModuleProviderProps) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [showExceptionsOnly, setShowExceptionsOnly] = useState(false);

  const handleSetSelectedEntity = (entity: Entity | null) => {
    if (isConsolidatedEntity(entity)) {
      setSelectedPeriod(null);
    }
    setSelectedEntity(entity);
  };

  return (
    <ModuleContext.Provider
      value={{
        selectedEntity,
        setSelectedEntity: handleSetSelectedEntity,
        selectedPeriod,
        setSelectedPeriod,
        showExceptionsOnly,
        setShowExceptionsOnly,
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
