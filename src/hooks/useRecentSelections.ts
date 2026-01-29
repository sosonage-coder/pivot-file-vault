import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'filegrid-recent-selections';
const MAX_RECENT = 5;

interface RecentSelections {
  periodId?: string;
  objectId?: string;
  documentTypeId?: string;
}

interface StoredSelections {
  [entityId: string]: RecentSelections;
}

export function useRecentSelections(entityId: string | null) {
  const [selections, setSelections] = useState<RecentSelections>({});

  // Load from localStorage on mount
  useEffect(() => {
    if (!entityId) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredSelections = JSON.parse(stored);
        if (parsed[entityId]) {
          setSelections(parsed[entityId]);
        }
      }
    } catch (error) {
      console.error('Error loading recent selections:', error);
    }
  }, [entityId]);

  // Save a selection
  const saveSelection = useCallback((key: keyof RecentSelections, value: string) => {
    if (!entityId || !value) return;

    setSelections((prev) => {
      const updated = { ...prev, [key]: value };

      // Persist to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed: StoredSelections = stored ? JSON.parse(stored) : {};
        parsed[entityId] = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch (error) {
        console.error('Error saving recent selection:', error);
      }

      return updated;
    });
  }, [entityId]);

  // Get default value with fallback to most recent period
  const getDefaultPeriodId = useCallback((periods: { id: string; label: string }[]): string => {
    // First check if we have a saved selection
    if (selections.periodId) {
      // Verify it still exists
      const exists = periods.some(p => p.id === selections.periodId);
      if (exists) return selections.periodId;
    }
    
    // Otherwise return the most recent (first) period
    return periods.length > 0 ? periods[0].id : '';
  }, [selections.periodId]);

  const getDefaultObjectId = useCallback((objects: { id: string }[]): string => {
    if (selections.objectId) {
      const exists = objects.some(o => o.id === selections.objectId);
      if (exists) return selections.objectId;
    }
    return '';
  }, [selections.objectId]);

  const getDefaultDocumentTypeId = useCallback((types: { id: string }[]): string => {
    if (selections.documentTypeId) {
      const exists = types.some(t => t.id === selections.documentTypeId);
      if (exists) return selections.documentTypeId;
    }
    return '';
  }, [selections.documentTypeId]);

  return {
    selections,
    saveSelection,
    getDefaultPeriodId,
    getDefaultObjectId,
    getDefaultDocumentTypeId,
  };
}
