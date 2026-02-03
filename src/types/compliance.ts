export type ComplianceRecurrence = 'one-time' | 'monthly' | 'quarterly' | 'annual';
export type ComplianceStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type ComplianceCategory = 'Lender' | 'Tax' | 'Regulatory' | 'Internal';

export interface ComplianceItem {
  id: string;
  entity_id: string;
  period_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  recurrence: ComplianceRecurrence;
  status: ComplianceStatus;
  assigned_to: string | null;
  category: ComplianceCategory;
  evidence_document_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ComplianceItemInsert {
  entity_id: string;
  period_id?: string | null;
  title: string;
  description?: string | null;
  due_date: string;
  recurrence?: ComplianceRecurrence;
  status?: ComplianceStatus;
  assigned_to?: string | null;
  category?: ComplianceCategory;
  evidence_document_ids?: string[];
}

export interface ComplianceItemUpdate {
  title?: string;
  description?: string | null;
  due_date?: string;
  recurrence?: ComplianceRecurrence;
  status?: ComplianceStatus;
  assigned_to?: string | null;
  category?: ComplianceCategory;
  evidence_document_ids?: string[];
}
