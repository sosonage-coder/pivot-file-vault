// Reconciliation module type definitions

export type ReconciliationStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'pending_review' 
  | 'rejected' 
  | 'approved' 
  | 'certified';

export type ReconciliationTemplateType = 
  | 'general'
  | 'bank'
  | 'prepaid'
  | 'accrual'
  | 'fixed_asset'
  | 'lease'
  | 'intercompany';

export type ReconciliationLineType = 
  | 'opening'
  | 'addition'
  | 'reversal'
  | 'adjustment'
  | 'closing'
  | 'outstanding'
  | 'deposit_in_transit'
  | 'amortization'
  | 'depreciation'
  | 'interest'
  | 'principal';

export interface TemplateFieldSchema {
  fields?: Array<{
    name: string;
    type: 'number' | 'text' | 'date' | 'select';
    label: string;
    options?: string[];
  }>;
  sections?: Array<{
    name: string;
    label: string;
    lineType: ReconciliationLineType;
  }>;
}

export interface TemplateCalculationRules {
  [key: string]: string;
}

export interface ReconciliationTemplate {
  id: string;
  name: string;
  description: string | null;
  template_type: ReconciliationTemplateType;
  field_schema: TemplateFieldSchema;
  calculation_rules: TemplateCalculationRules;
  template_content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationLineItem {
  id: string;
  reconciliation_id: string;
  line_type: ReconciliationLineType;
  period_month: string | null;
  description: string | null;
  amount: number;
  quantity: number | null;
  rate: number | null;
  start_date: string | null;
  end_date: string | null;
  metadata: Record<string, unknown>;
  sort_order: number;
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
  reconciliation_templates?: ReconciliationTemplate | null;
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
  certified_at?: string | null;
  certified_by?: string | null;
  // Workflow timestamps set automatically based on status
}

export interface CreateLineItemInput {
  reconciliation_id: string;
  line_type: ReconciliationLineType;
  description?: string;
  amount?: number;
  quantity?: number;
  rate?: number;
  start_date?: string;
  end_date?: string;
  period_month?: string;
  metadata?: Record<string, unknown>;
  sort_order?: number;
}

export interface UpdateLineItemInput {
  line_type?: ReconciliationLineType;
  description?: string;
  amount?: number;
  quantity?: number;
  rate?: number;
  start_date?: string;
  end_date?: string;
  period_month?: string;
  metadata?: Record<string, unknown>;
  sort_order?: number;
}

export type ReconciliationViewType = 'list' | 'by-status' | 'by-account';
