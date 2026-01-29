// Checklist module type definitions

export interface ChecklistItem {
  order: number;
  label: string;
  required: boolean;
  category?: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
  applies_to: string[];
  items: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface ChecklistInstance {
  id: string;
  template_id: string | null;
  reconciliation_id: string | null;
  entity_id: string;
  period_id: string | null;
  name: string;
  items: ChecklistItem[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ChecklistItemCompletion {
  id: string;
  instance_id: string;
  item_index: number;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ChecklistInstanceWithCompletions extends ChecklistInstance {
  completions: ChecklistItemCompletion[];
}

export interface CreateChecklistInstanceInput {
  template_id?: string;
  reconciliation_id?: string;
  entity_id: string;
  period_id?: string;
  name: string;
  items: ChecklistItem[];
}

export interface UpdateChecklistCompletionInput {
  instance_id: string;
  item_index: number;
  completed: boolean;
  notes?: string;
}
