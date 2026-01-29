// FileGRID type definitions

export type DocumentStatus = 'Draft' | 'Final' | 'Superseded' | 'Archived';
export type PeriodType = 'month' | 'quarter' | 'year' | 'phase';
export type PbcStatus = 'Requested' | 'Uploaded' | 'Reviewed' | 'Complete';
export type AppRole = 'admin' | 'user' | 'external_reviewer';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Entity {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface ProcessTemplate {
  id: string;
  name: string;
  department_id: string;
  description: string | null;
  created_at: string;
}

export interface Process {
  id: string;
  name: string;
  entity_id: string;
  department_id: string;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AreaTemplate {
  id: string;
  name: string;
  process_template_id: string;
  created_at: string;
}

export interface Area {
  id: string;
  name: string;
  process_id: string;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Period {
  id: string;
  label: string;
  type: PeriodType;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface FileObject {
  id: string;
  name: string;
  entity_id: string;
  department_id: string;
  process_id: string;
  area_id: string;
  requires_approval: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentApproval {
  id: string;
  document_id: string;
  status: ApprovalStatus;
  requested_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  logical_name: string;
  entity_id: string;
  department_id: string;
  process_id: string;
  area_id: string;
  object_id: string | null;
  period_id: string;
  document_type_id: string;
  status: DocumentStatus;
  version: number;
  external_file_url: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PbcItem {
  id: string;
  entity_id: string;
  period_id: string;
  process_id: string;
  area_id: string;
  object_id: string | null;
  document_type_id: string;
  status: PbcStatus;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface UserEntity {
  id: string;
  user_id: string;
  entity_id: string;
  created_at: string;
}

// Extended types with relations
export interface ProcessWithDepartment extends Process {
  departments?: Department;
}

export interface AreaWithProcess extends Area {
  processes?: ProcessWithDepartment;
}

export interface DocumentWithRelations extends Document {
  objects?: FileObject;
  periods?: Period;
  document_types?: DocumentType;
  areas?: AreaWithProcess;
}

// Tree node structure for folder hierarchy
export interface TreeNode {
  id: string;
  name: string;
  type: 'entity' | 'department' | 'process' | 'area' | 'object';
  children?: TreeNode[];
  documentCount?: number;
  metadata?: Record<string, unknown>;
}

// Pivot view filter state
export interface PivotFilters {
  statusList: DocumentStatus[];
  periodId: string | null;
  areaId: string | null;
  objectId: string | null;
}

// Pivot view types
export type PivotViewType = 
  | 'period-area-object'
  | 'object-period'
  | 'area-period'
  | 'document-type'
  | 'status-final';

export type AnalysisViewType = 'whats-missing' | 'pbc-requests';
