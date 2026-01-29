-- Create enum for PBC node types
CREATE TYPE pbc_node_type AS ENUM ('area', 'dimension', 'object', 'request');

-- Create templates table for PBC tree templates
CREATE TABLE public.pbc_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area_type text,
  min_depth integer NOT NULL DEFAULT 2,
  max_depth integer NOT NULL DEFAULT 6,
  allowed_sequences jsonb DEFAULT '[]'::jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create nodes table for hierarchical PBC tree
CREATE TABLE public.pbc_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  pbc_template_id uuid REFERENCES public.pbc_templates(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES public.pbc_nodes(id) ON DELETE CASCADE,
  node_type pbc_node_type NOT NULL,
  label text NOT NULL,
  sort_order integer DEFAULT 0,
  area_id uuid REFERENCES public.areas(id) ON DELETE SET NULL,
  object_id uuid REFERENCES public.objects(id) ON DELETE SET NULL,
  status pbc_status,
  assignee_id uuid,
  due_date date,
  priority text DEFAULT 'normal',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraint: only request nodes can have status
  CONSTRAINT pbc_nodes_request_only_status CHECK (
    node_type = 'request' OR status IS NULL
  ),
  -- Constraint: only area nodes can be roots (have null parent_id)
  CONSTRAINT pbc_nodes_area_is_root CHECK (
    parent_id IS NOT NULL OR node_type = 'area'
  )
);

-- Create indexes for performance
CREATE INDEX idx_pbc_nodes_entity_period ON public.pbc_nodes(entity_id, period_id);
CREATE INDEX idx_pbc_nodes_parent ON public.pbc_nodes(parent_id);
CREATE INDEX idx_pbc_nodes_template ON public.pbc_nodes(pbc_template_id);
CREATE INDEX idx_pbc_nodes_status ON public.pbc_nodes(status) WHERE status IS NOT NULL;

-- Enable RLS on both tables
ALTER TABLE public.pbc_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pbc_nodes ENABLE ROW LEVEL SECURITY;

-- RLS policies for pbc_templates (read-only for authenticated users, admin manage)
CREATE POLICY "Authenticated users can view pbc templates"
  ON public.pbc_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage pbc templates"
  ON public.pbc_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for pbc_nodes (entity-scoped access)
CREATE POLICY "Users can view pbc nodes in their entities"
  ON public.pbc_nodes
  FOR SELECT
  USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can create pbc nodes in their entities"
  ON public.pbc_nodes
  FOR INSERT
  WITH CHECK (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can update pbc nodes in their entities"
  ON public.pbc_nodes
  FOR UPDATE
  USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can delete pbc nodes in their entities"
  ON public.pbc_nodes
  FOR DELETE
  USING (user_has_entity_access(auth.uid(), entity_id));

-- Trigger for updated_at on pbc_templates
CREATE TRIGGER update_pbc_templates_updated_at
  BEFORE UPDATE ON public.pbc_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on pbc_nodes
CREATE TRIGGER update_pbc_nodes_updated_at
  BEFORE UPDATE ON public.pbc_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default PBC templates
INSERT INTO public.pbc_templates (name, area_type, min_depth, max_depth, description) VALUES
  ('Fixed Assets', 'fixed_assets', 2, 4, 'Standard fixed asset audit requests including additions, disposals, and depreciation'),
  ('Cash', 'cash', 3, 5, 'Bank reconciliations, statements, and cash management requests'),
  ('Revenue', 'revenue', 3, 6, 'Revenue recognition, cut-off testing, and contract documentation'),
  ('Leases', 'leases', 3, 5, 'Lease schedules, contracts, and right-of-use asset documentation'),
  ('Accounts Receivable', 'receivables', 2, 4, 'Receivables aging, confirmations, and allowance documentation'),
  ('Accounts Payable', 'payables', 2, 4, 'Payables reconciliation, accruals, and vendor documentation'),
  ('Equity', 'equity', 2, 3, 'Equity transactions, stock compensation, and ownership documentation'),
  ('Accruals', 'accruals', 2, 4, 'Accrual schedules, rollforward analyses, and support');

-- Update pbc_comments to optionally reference pbc_nodes
ALTER TABLE public.pbc_comments 
  ADD COLUMN pbc_node_id uuid REFERENCES public.pbc_nodes(id) ON DELETE CASCADE;