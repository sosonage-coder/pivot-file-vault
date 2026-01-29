// Reconciliation module type definitions

export type ReconciliationStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'pending_review' 
  | 'rejected' 
  | 'approved' 
  | 'certified';

export interface ReconciliationTemplate {
  id: string;
  name: string;
  description: string | null;
  template_content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Reconciliation {
  id: string;
  entity_id: string;
  object_id: string;
  period_id: string;
  template_id: string | null;
  
  // Workflow assignments
  preparer_id: string | null;
  reviewer_id: string | null;
  
  // Status
  status: ReconciliationStatus;
  
  // Balances
  gl_balance: number | null;
  sub_balance: number | null;
  variance: number | null;
  variance_explanation: string | null;
  
  // Workflow timestamps
  prepared_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_notes: string | null;
  
  // Certification
  certified_at: string | null;
  certified_by: string | null;
  
  // Notes
  notes: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface ReconciliationWithRelations extends Reconciliation {
  objects?: { 
    name: string;
    area_id: string;
    process_id: string;
    department_id: string;
    areas?: { name: string } | null;
    processes?: { name: string } | null;
  } | null;
  periods?: { label: string } | null;
  reconciliation_templates?: { name: string } | null;
}

export interface ReconciliationAttachment {
  id: string;
  reconciliation_id: string;
  document_id: string;
  attachment_type: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface ReconciliationAttachmentWithDocument extends ReconciliationAttachment {
  documents?: { logical_name: string; external_file_url: string } | null;
}

export interface ReconciliationStats {
  not_started: number;
  in_progress: number;
  pending_review: number;
  rejected: number;
  approved: number;
  certified: number;
  total: number;
  withVariance: number;
}

export interface CreateReconciliationInput {
  entity_id: string;
  object_id: string;
  period_id: string;
  template_id?: string | null;
  preparer_id?: string | null;
  reviewer_id?: string | null;
  gl_balance?: number | null;
  sub_balance?: number | null;
  notes?: string | null;
}

export interface UpdateReconciliationInput {
  status?: ReconciliationStatus;
  gl_balance?: number | null;
  sub_balance?: number | null;
  variance_explanation?: string | null;
  preparer_id?: string | null;
  reviewer_id?: string | null;
  notes?: string | null;
  rejection_notes?: string | null;
  // Workflow timestamps set automatically based on status
}

export type ReconciliationViewType = 'list' | 'by-status' | 'by-account';
