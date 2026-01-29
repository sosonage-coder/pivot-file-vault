-- Create tasks table with structural anchors and cross-module links
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) NOT NULL,
  title text NOT NULL,
  description text,
  
  -- Structural anchors (all optional for flexibility)
  department_id uuid REFERENCES public.departments(id),
  process_id uuid REFERENCES public.processes(id),
  area_id uuid REFERENCES public.areas(id),
  object_id uuid REFERENCES public.objects(id),
  period_id uuid REFERENCES public.periods(id),
  
  -- Linkage to other modules
  document_id uuid REFERENCES public.documents(id),
  pbc_item_id uuid REFERENCES public.pbc_items(id),
  
  -- Task properties
  assignee_id uuid,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date date,
  completed_at timestamptz,
  
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_tasks_entity ON public.tasks(entity_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_pbc_item ON public.tasks(pbc_item_id);
CREATE INDEX idx_tasks_document ON public.tasks(document_id);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view tasks in their entities"
  ON public.tasks FOR SELECT
  USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can create tasks in their entities"
  ON public.tasks FOR INSERT
  WITH CHECK (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can update tasks in their entities"
  ON public.tasks FOR UPDATE
  USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can delete tasks in their entities"
  ON public.tasks FOR DELETE
  USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Admins can manage all tasks"
  ON public.tasks FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();