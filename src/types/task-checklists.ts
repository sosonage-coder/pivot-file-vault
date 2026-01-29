// Task Checklist System Type Definitions

export type ChecklistMode = 'quick_list' | 'structured_list';
export type TaskItemStatus = 'todo' | 'in_progress' | 'done';

// =============================================================================
// Core Entities
// =============================================================================

export interface TaskChecklist {
  id: string;
  entity_id: string;
  department_id: string | null;
  period_id: string | null;
  
  name: string;
  description: string | null;
  mode: ChecklistMode;
  
  // Close schedule fields
  start_date: string | null;
  duration_days: number | null;
  
  // Template management
  is_template: boolean;
  template_id: string | null;
  
  // Ownership
  owner_id: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface TaskChecklistSection {
  id: string;
  checklist_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskChecklistItem {
  id: string;
  checklist_id: string;
  section_id: string | null;
  
  title: string;
  description: string | null;
  
  // Assignment
  assignee_id: string | null;
  
  // Timing
  due_date: string | null;
  due_time: string | null;
  relative_day: number | null;
  
  // Status
  status: TaskItemStatus;
  completed_at: string | null;
  completed_by: string | null;
  
  // Ordering
  sort_order: number;
  
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Extended Types with Relations
// =============================================================================

export interface TaskChecklistWithRelations extends TaskChecklist {
  departments?: { name: string } | null;
  periods?: { label: string } | null;
  sections?: TaskChecklistSection[];
  items?: TaskChecklistItem[];
}

export interface TaskChecklistItemWithSection extends TaskChecklistItem {
  section?: TaskChecklistSection | null;
}

// =============================================================================
// Statistics
// =============================================================================

export interface ChecklistStats {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
  dueToday: number;
  completionRate: number;
}

// =============================================================================
// Input Types for Mutations
// =============================================================================

export interface CreateChecklistInput {
  entity_id: string;
  department_id?: string | null;
  period_id?: string | null;
  name: string;
  description?: string | null;
  mode: ChecklistMode;
  start_date?: string | null;
  duration_days?: number | null;
  is_template?: boolean;
  template_id?: string | null;
}

export interface UpdateChecklistInput {
  name?: string;
  description?: string | null;
  start_date?: string | null;
  duration_days?: number | null;
}

export interface CreateSectionInput {
  checklist_id: string;
  name: string;
  sort_order?: number;
}

export interface UpdateSectionInput {
  name?: string;
  sort_order?: number;
}

export interface CreateItemInput {
  checklist_id: string;
  section_id?: string | null;
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  relative_day?: number | null;
  status?: TaskItemStatus;
  sort_order?: number;
}

export interface UpdateItemInput {
  section_id?: string | null;
  title?: string;
  description?: string | null;
  assignee_id?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  relative_day?: number | null;
  status?: TaskItemStatus;
  sort_order?: number;
}

// =============================================================================
// View Configuration
// =============================================================================

export type ChecklistViewType = 'list' | 'kanban' | 'calendar' | 'close_calendar';

export interface ChecklistViewConfig {
  type: ChecklistViewType;
  // Kanban column grouping
  kanbanGroupBy?: 'status' | 'section';
  // Calendar range (for close calendar)
  calendarStartDay?: number;
  calendarEndDay?: number;
}
