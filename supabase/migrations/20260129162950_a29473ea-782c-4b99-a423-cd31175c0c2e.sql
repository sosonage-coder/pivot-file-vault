-- Phase 4: Reconciliations Module Schema

-- Reconciliation status enum
DO $$ BEGIN
  CREATE TYPE public.reconciliation_status AS ENUM (
    'not_started',
    'in_progress', 
    'pending_review',
    'rejected',
    'approved',
    'certified'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Reconciliation templates table
CREATE TABLE public.reconciliation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_content jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on templates
ALTER TABLE public.reconciliation_templates ENABLE ROW LEVEL SECURITY;

-- Templates are viewable by all authenticated users
CREATE POLICY "Authenticated users can view reconciliation templates"
ON public.reconciliation_templates FOR SELECT
USING (true);

-- Only admins can manage templates
CREATE POLICY "Admins can manage reconciliation templates"
ON public.reconciliation_templates FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Reconciliations table
CREATE TABLE public.reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) NOT NULL,
  object_id uuid REFERENCES public.objects(id) NOT NULL,
  period_id uuid REFERENCES public.periods(id) NOT NULL,
  
  -- Template reference
  template_id uuid REFERENCES public.reconciliation_templates(id),
  
  -- Workflow assignments
  preparer_id uuid,
  reviewer_id uuid,
  
  -- Status tracking
  status public.reconciliation_status NOT NULL DEFAULT 'not_started',
  
  -- Balance data
  gl_balance numeric DEFAULT 0,
  sub_balance numeric DEFAULT 0,
  variance numeric GENERATED ALWAYS AS (gl_balance - sub_balance) STORED,
  
  -- Explanation for variance
  variance_explanation text,
  
  -- Workflow timestamps
  prepared_at timestamptz,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_notes text,
  
  -- Certification
  certified_at timestamptz,
  certified_by uuid,
  
  -- Notes
  notes text,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Unique constraint: one reconciliation per object per period
  UNIQUE (object_id, period_id)
);

-- Create indexes for common queries
CREATE INDEX idx_reconciliations_entity ON public.reconciliations(entity_id);
CREATE INDEX idx_reconciliations_period ON public.reconciliations(period_id);
CREATE INDEX idx_reconciliations_preparer ON public.reconciliations(preparer_id);
CREATE INDEX idx_reconciliations_reviewer ON public.reconciliations(reviewer_id);
CREATE INDEX idx_reconciliations_status ON public.reconciliations(status);

-- Enable RLS
ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;

-- RLS policies for reconciliations
CREATE POLICY "Users can view reconciliations in their entities"
ON public.reconciliations FOR SELECT
USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can create reconciliations in their entities"
ON public.reconciliations FOR INSERT
WITH CHECK (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can update reconciliations in their entities"
ON public.reconciliations FOR UPDATE
USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can delete reconciliations in their entities"
ON public.reconciliations FOR DELETE
USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Admins can manage all reconciliations"
ON public.reconciliations FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Reconciliation attachments table (links documents to reconciliations)
CREATE TABLE public.reconciliation_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id uuid REFERENCES public.reconciliations(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  attachment_type text NOT NULL DEFAULT 'evidence',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  
  -- Unique constraint: a document can only be attached once per reconciliation
  UNIQUE (reconciliation_id, document_id)
);

-- Enable RLS
ALTER TABLE public.reconciliation_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for attachments
CREATE POLICY "Users can view attachments in their entities"
ON public.reconciliation_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reconciliations r
    WHERE r.id = reconciliation_attachments.reconciliation_id
    AND user_has_entity_access(auth.uid(), r.entity_id)
  )
);

CREATE POLICY "Users can create attachments in their entities"
ON public.reconciliation_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reconciliations r
    WHERE r.id = reconciliation_attachments.reconciliation_id
    AND user_has_entity_access(auth.uid(), r.entity_id)
  )
);

CREATE POLICY "Users can delete attachments in their entities"
ON public.reconciliation_attachments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.reconciliations r
    WHERE r.id = reconciliation_attachments.reconciliation_id
    AND user_has_entity_access(auth.uid(), r.entity_id)
  )
);

CREATE POLICY "Admins can manage all attachments"
ON public.reconciliation_attachments FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger for reconciliations
CREATE TRIGGER update_reconciliations_updated_at
  BEFORE UPDATE ON public.reconciliations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for templates
CREATE TRIGGER update_reconciliation_templates_updated_at
  BEFORE UPDATE ON public.reconciliation_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();