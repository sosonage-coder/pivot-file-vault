import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { Entity, Period } from '@/types/filegrid';
import { isConsolidatedEntity } from '@/lib/entities';
import { usePeriods } from '@/hooks/usePeriods';

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
  const { data: periods = [] } = usePeriods();

  const latestPeriod = useMemo(() => {
    if (periods.length === 0) return null;
    return [...periods].sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
  }, [periods]);

  const getStoredPeriodId = (entityId: string | null) => {
    if (!entityId) return null;
    return localStorage.getItem(`selected-period:${entityId}`);
  };

  const handleSetSelectedEntity = (entity: Entity | null) => {
    if (isConsolidatedEntity(entity)) {
      setSelectedPeriod(null);
    }
    setSelectedEntity(entity);
  };

  useEffect(() => {
    if (!selectedEntity || isConsolidatedEntity(selectedEntity)) return;
    if (!periods.length) return;

    const storedPeriodId = getStoredPeriodId(selectedEntity.id);
    const storedPeriod = storedPeriodId ? periods.find((period) => period.id === storedPeriodId) : null;
    const nextPeriod = storedPeriod || latestPeriod;

    if (nextPeriod && selectedPeriod?.id !== nextPeriod.id) {
      setSelectedPeriod(nextPeriod);
    }
  }, [latestPeriod, periods, selectedEntity, selectedPeriod?.id]);

  const handleSetSelectedPeriod = (period: Period | null) => {
    setSelectedPeriod(period);
    if (selectedEntity && period) {
      localStorage.setItem(`selected-period:${selectedEntity.id}`, period.id);
    }
  };

  return (
    <ModuleContext.Provider
      value={{
        selectedEntity,
        setSelectedEntity: handleSetSelectedEntity,
        selectedPeriod,
        setSelectedPeriod: handleSetSelectedPeriod,
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
