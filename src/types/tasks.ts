// Task module type definitions

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  entity_id: string;
  title: string;
  description: string | null;
  
  // Structural anchors
  department_id: string | null;
  process_id: string | null;
  area_id: string | null;
  object_id: string | null;
  period_id: string | null;
  
  // Cross-module links
  document_id: string | null;
  pbc_item_id: string | null;
  
  // Task properties
  assignee_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWithRelations extends Task {
  periods?: { label: string } | null;
  processes?: { name: string } | null;
  areas?: { name: string } | null;
  objects?: { name: string } | null;
  documents?: { logical_name: string } | null;
  pbc_items?: { id: string } | null;
}

export interface TaskStats {
  open: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  total: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}

export interface CreateTaskInput {
  entity_id: string;
  title: string;
  description?: string | null;
  department_id?: string | null;
  process_id?: string | null;
  area_id?: string | null;
  object_id?: string | null;
  period_id?: string | null;
  document_id?: string | null;
  pbc_item_id?: string | null;
  assignee_id?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  assignee_id?: string | null;
  completed_at?: string | null;
}

export type TaskViewType = 'list' | 'calendar' | 'kanban';
