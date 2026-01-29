-- Phase 4: Checklist Templates and Instances for Reconciliations

-- Checklist templates table (reusable checklist definitions)
CREATE TABLE public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  applies_to text[] DEFAULT ARRAY['reconciliation']::text[], -- 'reconciliation', 'period', 'entity'
  items jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{order, label, required, category}]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Checklist instances (instantiated from templates, linked to reconciliations)
CREATE TABLE public.checklist_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  reconciliation_id uuid REFERENCES public.reconciliations(id) ON DELETE CASCADE,
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  period_id uuid REFERENCES public.periods(id) ON DELETE SET NULL,
  name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb, -- Copy of template items at creation time
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

-- Checklist item completions (tracks individual item completion)
CREATE TABLE public.checklist_item_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES public.checklist_instances(id) ON DELETE CASCADE NOT NULL,
  item_index integer NOT NULL,
  completed boolean DEFAULT false,
  completed_by uuid,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(instance_id, item_index)
);

-- Enable RLS
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_item_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checklist_templates (viewable by all, managed by admins)
CREATE POLICY "Authenticated users can view checklist templates"
  ON public.checklist_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage checklist templates"
  ON public.checklist_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for checklist_instances (entity-scoped)
CREATE POLICY "Users can view checklist instances in their entities"
  ON public.checklist_instances FOR SELECT
  USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can create checklist instances in their entities"
  ON public.checklist_instances FOR INSERT
  WITH CHECK (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can update checklist instances in their entities"
  ON public.checklist_instances FOR UPDATE
  USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Users can delete checklist instances in their entities"
  ON public.checklist_instances FOR DELETE
  USING (user_has_entity_access(auth.uid(), entity_id));

CREATE POLICY "Admins can manage all checklist instances"
  ON public.checklist_instances FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for checklist_item_completions (via instance entity)
CREATE POLICY "Users can view completions in their entities"
  ON public.checklist_item_completions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.checklist_instances ci
    WHERE ci.id = checklist_item_completions.instance_id
    AND user_has_entity_access(auth.uid(), ci.entity_id)
  ));

CREATE POLICY "Users can create completions in their entities"
  ON public.checklist_item_completions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.checklist_instances ci
    WHERE ci.id = checklist_item_completions.instance_id
    AND user_has_entity_access(auth.uid(), ci.entity_id)
  ));

CREATE POLICY "Users can update completions in their entities"
  ON public.checklist_item_completions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.checklist_instances ci
    WHERE ci.id = checklist_item_completions.instance_id
    AND user_has_entity_access(auth.uid(), ci.entity_id)
  ));

CREATE POLICY "Admins can manage all completions"
  ON public.checklist_item_completions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed standard checklist templates
INSERT INTO public.checklist_templates (name, description, applies_to, items) VALUES
(
  'Bank Reconciliation Checklist',
  'Standard checklist for completing bank account reconciliations',
  ARRAY['reconciliation'],
  '[
    {"order": 1, "label": "Obtain bank statement for the period", "required": true, "category": "Documentation"},
    {"order": 2, "label": "Verify opening balance matches prior period closing", "required": true, "category": "Verification"},
    {"order": 3, "label": "Identify and list outstanding checks", "required": true, "category": "Reconciling Items"},
    {"order": 4, "label": "Identify and list deposits in transit", "required": true, "category": "Reconciling Items"},
    {"order": 5, "label": "Record bank fees and interest", "required": false, "category": "Adjustments"},
    {"order": 6, "label": "Investigate items outstanding > 90 days", "required": true, "category": "Review"},
    {"order": 7, "label": "Document variance explanation if applicable", "required": false, "category": "Documentation"},
    {"order": 8, "label": "Attach supporting documentation", "required": true, "category": "Documentation"}
  ]'::jsonb
),
(
  'Prepaid Expense Review',
  'Checklist for reviewing prepaid expense accounts',
  ARRAY['reconciliation'],
  '[
    {"order": 1, "label": "Verify amortization schedule is accurate", "required": true, "category": "Verification"},
    {"order": 2, "label": "Confirm current period amortization posted", "required": true, "category": "Verification"},
    {"order": 3, "label": "Review for expired prepaids requiring write-off", "required": true, "category": "Review"},
    {"order": 4, "label": "Verify vendor invoices for new prepaids", "required": false, "category": "Documentation"},
    {"order": 5, "label": "Confirm GL balance matches schedule", "required": true, "category": "Verification"},
    {"order": 6, "label": "Update schedule with new additions", "required": false, "category": "Adjustments"}
  ]'::jsonb
),
(
  'Accrual Review Checklist',
  'Standard review checklist for accrual reconciliations',
  ARRAY['reconciliation'],
  '[
    {"order": 1, "label": "Review prior period accruals for reversal", "required": true, "category": "Review"},
    {"order": 2, "label": "Identify new accruals needed for current period", "required": true, "category": "Review"},
    {"order": 3, "label": "Verify accrual amounts with supporting documentation", "required": true, "category": "Documentation"},
    {"order": 4, "label": "Confirm proper cutoff (expenses in correct period)", "required": true, "category": "Verification"},
    {"order": 5, "label": "Document rollforward from opening to closing", "required": true, "category": "Documentation"},
    {"order": 6, "label": "Investigate aged accruals > 3 months", "required": true, "category": "Review"}
  ]'::jsonb
),
(
  'Monthly Close Checklist',
  'General monthly close procedures for account reconciliation',
  ARRAY['reconciliation', 'period'],
  '[
    {"order": 1, "label": "Confirm all transactions posted for the period", "required": true, "category": "Verification"},
    {"order": 2, "label": "Reconcile GL balance to sub-ledger", "required": true, "category": "Reconciliation"},
    {"order": 3, "label": "Explain and document any variances", "required": true, "category": "Documentation"},
    {"order": 4, "label": "Review for unusual or large transactions", "required": true, "category": "Review"},
    {"order": 5, "label": "Attach all supporting evidence", "required": true, "category": "Documentation"},
    {"order": 6, "label": "Complete template-specific requirements", "required": false, "category": "Other"},
    {"order": 7, "label": "Submit for reviewer approval", "required": true, "category": "Workflow"}
  ]'::jsonb
),
(
  'Audit Readiness Checklist',
  'Preparation checklist for audit review of reconciliations',
  ARRAY['reconciliation'],
  '[
    {"order": 1, "label": "Verify all supporting documents are attached", "required": true, "category": "Documentation"},
    {"order": 2, "label": "Confirm preparer and reviewer sign-off complete", "required": true, "category": "Workflow"},
    {"order": 3, "label": "Check variance explanations are clear and sufficient", "required": true, "category": "Review"},
    {"order": 4, "label": "Verify reconciliation ties to trial balance", "required": true, "category": "Verification"},
    {"order": 5, "label": "Ensure template is fully completed", "required": true, "category": "Verification"},
    {"order": 6, "label": "Confirm no open items from prior periods", "required": false, "category": "Review"}
  ]'::jsonb
);