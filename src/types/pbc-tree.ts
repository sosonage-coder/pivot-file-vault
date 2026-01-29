// PBC Tree Model Types
// Hierarchical tree structure matching Documents: Department → Process → Area → Object → Request

import type { PbcStatus } from './filegrid';

/** Node types matching Documents structure */
export type PbcNodeType = 'department' | 'process' | 'area' | 'object' | 'request';

/** Database representation of a PBC template */
export interface PbcTemplate {
  id: string;
  name: string;
  area_type: string | null;
  min_depth: number;
  max_depth: number;
  allowed_sequences: string[][] | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/** Database representation of a PBC node */
export interface PbcNode {
  id: string;
  entity_id: string;
  period_id: string;
  pbc_template_id: string | null;
  parent_id: string | null;
  node_type: PbcNodeType;
  label: string;
  sort_order: number;
  area_id: string | null;
  object_id: string | null;
  // Request-only fields
  status: PbcStatus | null;
  assignee_id: string | null;
  due_date: string | null;
  priority: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Completion statistics for tree rollups */
export interface PbcCompletion {
  total: number;
  complete: number;
  percentage: number;
}

/** Tree node for UI rendering with children and computed fields */
export interface PbcTreeNode extends PbcNode {
  children: PbcTreeNode[];
  depth: number;
  completion: PbcCompletion;
  // Flattened relation data for display
  template?: PbcTemplate;
  areaName?: string;
  objectName?: string;
}

/** Input for creating a new PBC node */
export interface CreatePbcNodeInput {
  entityId: string;
  periodId: string;
  parentId?: string | null;
  nodeType: PbcNodeType;
  label: string;
  templateId?: string | null;
  areaId?: string | null;
  objectId?: string | null;
  status?: PbcStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
  priority?: string;
  notes?: string | null;
  sortOrder?: number;
}

/** Input for updating a PBC node */
export interface UpdatePbcNodeInput {
  id: string;
  entityId: string;
  label?: string;
  status?: PbcStatus | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  priority?: string;
  notes?: string | null;
  sortOrder?: number;
}

/** Node type configuration for UI display */
export const PBC_NODE_CONFIG: Record<PbcNodeType, {
  icon: string;
  colorClass: string;
  label: string;
  description: string;
  canHaveChildren: boolean;
  canHaveStatus: boolean;
}> = {
  department: {
    icon: 'Briefcase',
    colorClass: 'text-slate-500',
    label: 'Department',
    description: 'Top-level organizational grouping (e.g., Finance, Accounting)',
    canHaveChildren: true,
    canHaveStatus: false,
  },
  process: {
    icon: 'FolderOpen',
    colorClass: 'text-blue-500',
    label: 'Process',
    description: 'Business process or function (e.g., Fixed Assets, Revenue)',
    canHaveChildren: true,
    canHaveStatus: false,
  },
  area: {
    icon: 'Folder',
    colorClass: 'text-amber-500',
    label: 'Area',
    description: 'Specific area within a process (e.g., Additions, Disposals)',
    canHaveChildren: true,
    canHaveStatus: false,
  },
  object: {
    icon: 'FileBox',
    colorClass: 'text-purple-500',
    label: 'Object',
    description: 'Specific item or account (e.g., Bank of America, Equipment)',
    canHaveChildren: true,
    canHaveStatus: false,
  },
  request: {
    icon: 'ClipboardCheck',
    colorClass: 'text-green-500',
    label: 'Request',
    description: 'Actionable PBC request item (can have supporting sub-requests)',
    canHaveChildren: true,
    canHaveStatus: true,
  },
};

/** Status colors for request nodes */
export const PBC_STATUS_COLORS: Record<PbcStatus, string> = {
  Requested: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  Uploaded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Reviewed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  Complete: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

/** Helper to get allowed child types for a node type - supports skipping levels */
export function getAllowedChildTypes(nodeType: PbcNodeType): PbcNodeType[] {
  switch (nodeType) {
    case 'department':
      return ['process', 'area', 'request']; // Skip process if not needed
    case 'process':
      return ['area', 'object', 'request']; // Skip area if not needed
    case 'area':
      return ['object', 'request']; // Object optional
    case 'object':
      return ['request']; // Requests only
    case 'request':
      return ['request']; // Requests can have sub-requests (supporting items)
    default:
      return [];
  }
}

/** Helper to check if a node type can be a root */
export function canBeRoot(nodeType: PbcNodeType): boolean {
  // Department, Process, or Area can be root (for flexible depth)
  return nodeType === 'department' || nodeType === 'process' || nodeType === 'area';
}
