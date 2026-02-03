-- Create compliance_items table for tracking compliance deadlines
CREATE TABLE public.compliance_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  period_id uuid REFERENCES public.periods(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  recurrence text NOT NULL DEFAULT 'one-time' CHECK (recurrence IN ('one-time', 'monthly', 'quarterly', 'annual')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  assigned_to uuid,
  category text NOT NULL DEFAULT 'Internal' CHECK (category IN ('Lender', 'Tax', 'Regulatory', 'Internal')),
  evidence_document_ids uuid[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view compliance items in their entities"
  ON public.compliance_items
  FOR SELECT
  USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can create compliance items in their entities"
  ON public.compliance_items
  FOR INSERT
  WITH CHECK (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can update compliance items in their entities"
  ON public.compliance_items
  FOR UPDATE
  USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can delete compliance items in their entities"
  ON public.compliance_items
  FOR DELETE
  USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Admins can manage all compliance items"
  ON public.compliance_items
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_compliance_items_updated_at
  BEFORE UPDATE ON public.compliance_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_compliance_items_entity_id ON public.compliance_items(entity_id);
CREATE INDEX idx_compliance_items_due_date ON public.compliance_items(due_date);
CREATE INDEX idx_compliance_items_status ON public.compliance_items(status);