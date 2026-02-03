import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type FeatureId = 'monthclose' | 'reconciliations' | 'documents' | 'pbc' | 'compliance' | 'checklists' | 'meetings';

interface FeatureConfig {
  id: FeatureId;
  label: string;
  path: string;
  shortcut: string;
}

export const FEATURES: FeatureConfig[] = [
  { id: 'monthclose', label: 'Month Close', path: '/close', shortcut: '1' },
  { id: 'reconciliations', label: 'Reconciliations', path: '/reconciliations', shortcut: '2' },
  { id: 'documents', label: 'Documents', path: '/documents', shortcut: '3' },
  { id: 'pbc', label: 'PBC Requests', path: '/pbc', shortcut: '4' },
  { id: 'compliance', label: 'Compliance', path: '/compliance', shortcut: '5' },
  { id: 'checklists', label: 'Checklists', path: '/checklists', shortcut: '6' },
  { id: 'meetings', label: 'Meetings', path: '/meetings', shortcut: '7' },
];

export function useActiveFeature() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Derive active feature from current path
  const activeFeature = FEATURES.find(f => location.pathname.startsWith(f.path))?.id || 'monthclose';
  
  const setActiveFeature = useCallback((featureId: FeatureId) => {
    const feature = FEATURES.find(f => f.id === featureId);
    if (feature) {
      navigate(feature.path);
    }
  }, [navigate]);

  // Keyboard shortcuts (Cmd/Ctrl + 1-5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const feature = FEATURES.find(f => f.shortcut === e.key);
        if (feature) {
          e.preventDefault();
          setActiveFeature(feature.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveFeature]);

  return {
    activeFeature,
    setActiveFeature,
    features: FEATURES,
  };
}
