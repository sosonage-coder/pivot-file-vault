-- =============================================
-- Task List & Checklist System Schema
-- =============================================

-- Drop existing checklist tables (we're replacing with new structure)
-- Note: Keep checklist_templates and checklist_instances for reconciliation use

-- 1. Create task_checklists table (replaces old tasks concept)
CREATE TABLE public.task_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  period_id UUID REFERENCES public.periods(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Presentation mode
  mode TEXT NOT NULL DEFAULT 'quick_list' CHECK (mode IN ('quick_list', 'structured_list')),
  
  -- Close schedule fields
  start_date DATE,
  duration_days INTEGER,
  
  -- Template management
  is_template BOOLEAN NOT NULL DEFAULT false,
  template_id UUID REFERENCES public.task_checklists(id) ON DELETE SET NULL,
  
  -- Ownership
  owner_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create task_checklist_sections table (for structured lists)
CREATE TABLE public.task_checklist_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.task_checklists(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create task_checklist_items table (individual tasks)
CREATE TABLE public.task_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.task_checklists(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.task_checklist_sections(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Assignment
  assignee_id UUID,
  
  -- Timing
  due_date DATE,
  due_time TIME,
  relative_day INTEGER, -- For close schedules (Day 0, Day 1, etc.)
  
  -- Status
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  
  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Enable RLS on all tables
ALTER TABLE public.task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for task_checklists
CREATE POLICY "Users can view checklists in their entities"
ON public.task_checklists FOR SELECT
USING (user_has_entity_access(auth.uid(), entity_id) OR is_template = true);

CREATE POLICY "Users can create checklists in their entities"
ON public.task_checklists FOR INSERT
WITH CHECK (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can update checklists in their entities"
ON public.task_checklists FOR UPDATE
USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can delete checklists in their entities"
ON public.task_checklists FOR DELETE
USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Admins can manage all checklists"
ON public.task_checklists FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. RLS Policies for task_checklist_sections
CREATE POLICY "Users can view sections in their checklists"
ON public.task_checklist_sections FOR SELECT
USING (EXISTS (
  SELECT 1 FROM task_checklists tc 
  WHERE tc.id = task_checklist_sections.checklist_id 
  AND (user_has_entity_access(auth.uid(), tc.entity_id) OR tc.is_template = true)
));

CREATE POLICY "Users can create sections in their checklists"
ON public.task_checklist_sections FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM task_checklists tc 
  WHERE tc.id = task_checklist_sections.checklist_id 
  AND user_has_entity_access(auth.uid(), tc.entity_id)
));

CREATE POLICY "Users can update sections in their checklists"
ON public.task_checklist_sections FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM task_checklists tc 
  WHERE tc.id = task_checklist_sections.checklist_id 
  AND user_has_entity_access(auth.uid(), tc.entity_id)
));

CREATE POLICY "Users can delete sections in their checklists"
ON public.task_checklist_sections FOR DELETE
USING (EXISTS (
  SELECT 1 FROM task_checklists tc 
  WHERE tc.id = task_checklist_sections.checklist_id 
  AND user_has_entity_access(auth.uid(), tc.entity_id)
));

CREATE POLICY "Admins can manage all sections"
ON public.task_checklist_sections FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. RLS Policies for task_checklist_items
CREATE POLICY "Users can view items in their checklists"
ON public.task_checklist_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM task_checklists tc 
  WHERE tc.id = task_checklist_items.checklist_id 
  AND (user_has_entity_access(auth.uid(), tc.entity_id) OR tc.is_template = true)
));

CREATE POLICY "Users can create items in their checklists"
ON public.task_checklist_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM task_checklists tc 
  WHERE tc.id = task_checklist_items.checklist_id 
  AND user_has_entity_access(auth.uid(), tc.entity_id)
));

CREATE POLICY "Users can update items in their checklists"
ON public.task_checklist_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM task_checklists tc 
  WHERE tc.id = task_checklist_items.checklist_id 
  AND user_has_entity_access(auth.uid(), tc.entity_id)
));

CREATE POLICY "Users can delete items in their checklists"
ON public.task_checklist_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM task_checklists tc 
  WHERE tc.id = task_checklist_items.checklist_id 
  AND user_has_entity_access(auth.uid(), tc.entity_id)
));

CREATE POLICY "Admins can manage all items"
ON public.task_checklist_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Create updated_at triggers
CREATE TRIGGER update_task_checklists_updated_at
BEFORE UPDATE ON public.task_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_checklist_sections_updated_at
BEFORE UPDATE ON public.task_checklist_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_checklist_items_updated_at
BEFORE UPDATE ON public.task_checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create indexes for performance
CREATE INDEX idx_task_checklists_entity ON public.task_checklists(entity_id);
CREATE INDEX idx_task_checklists_department ON public.task_checklists(department_id);
CREATE INDEX idx_task_checklists_period ON public.task_checklists(period_id);
CREATE INDEX idx_task_checklists_template ON public.task_checklists(is_template) WHERE is_template = true;

CREATE INDEX idx_task_checklist_sections_checklist ON public.task_checklist_sections(checklist_id);
CREATE INDEX idx_task_checklist_sections_order ON public.task_checklist_sections(checklist_id, sort_order);

CREATE INDEX idx_task_checklist_items_checklist ON public.task_checklist_items(checklist_id);
CREATE INDEX idx_task_checklist_items_section ON public.task_checklist_items(section_id);
CREATE INDEX idx_task_checklist_items_assignee ON public.task_checklist_items(assignee_id);
CREATE INDEX idx_task_checklist_items_status ON public.task_checklist_items(status);
CREATE INDEX idx_task_checklist_items_due_date ON public.task_checklist_items(due_date);