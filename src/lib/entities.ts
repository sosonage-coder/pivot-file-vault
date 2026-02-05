import type { Entity } from '@/types/filegrid';

export const CONSOLIDATED_ENTITY_ID = 'consolidated';

export const CONSOLIDATED_ENTITY: Entity = {
  id: CONSOLIDATED_ENTITY_ID,
  name: 'All Entities (Consolidated)',
  active: true,
  created_at: '',
  updated_at: '',
};

export const isConsolidatedEntity = (entity: Entity | null): boolean =>
  entity?.id === CONSOLIDATED_ENTITY_ID;
