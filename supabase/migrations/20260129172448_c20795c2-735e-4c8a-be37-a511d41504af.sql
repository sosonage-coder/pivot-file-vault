-- Phase 2: Intelligent Template System Schema

-- Add template type and schema fields to reconciliation_templates
ALTER TABLE public.reconciliation_templates 
ADD COLUMN IF NOT EXISTS template_type text DEFAULT 'general';

ALTER TABLE public.reconciliation_templates 
ADD COLUMN IF NOT EXISTS field_schema jsonb DEFAULT '{}';

ALTER TABLE public.reconciliation_templates 
ADD COLUMN IF NOT EXISTS calculation_rules jsonb DEFAULT '{}';

-- Create enum for line item types
DO $$ BEGIN
  CREATE TYPE reconciliation_line_type AS ENUM (
    'opening',
    'addition', 
    'reversal',
    'adjustment',
    'closing',
    'outstanding',
    'deposit_in_transit',
    'amortization',
    'depreciation',
    'interest',
    'principal'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create reconciliation_line_items table for template data entries
CREATE TABLE IF NOT EXISTS public.reconciliation_line_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reconciliation_id uuid NOT NULL REFERENCES public.reconciliations(id) ON DELETE CASCADE,
  line_type text NOT NULL DEFAULT 'adjustment',
  period_month date,
  description text,
  amount numeric DEFAULT 0,
  quantity numeric,
  rate numeric,
  start_date date,
  end_date date,
  metadata jsonb DEFAULT '{}',
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on reconciliation_line_items
ALTER TABLE public.reconciliation_line_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for reconciliation_line_items
CREATE POLICY "Admins can manage all line items"
ON public.reconciliation_line_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view line items in their entities"
ON public.reconciliation_line_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reconciliations r
    WHERE r.id = reconciliation_line_items.reconciliation_id
    AND user_has_entity_access(auth.uid(), r.entity_id)
  )
);

CREATE POLICY "Users can create line items in their entities"
ON public.reconciliation_line_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reconciliations r
    WHERE r.id = reconciliation_line_items.reconciliation_id
    AND user_has_entity_access(auth.uid(), r.entity_id)
  )
);

CREATE POLICY "Users can update line items in their entities"
ON public.reconciliation_line_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.reconciliations r
    WHERE r.id = reconciliation_line_items.reconciliation_id
    AND user_has_entity_access(auth.uid(), r.entity_id)
  )
);

CREATE POLICY "Users can delete line items in their entities"
ON public.reconciliation_line_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.reconciliations r
    WHERE r.id = reconciliation_line_items.reconciliation_id
    AND user_has_entity_access(auth.uid(), r.entity_id)
  )
);

-- Add updated_at trigger for line_items
CREATE TRIGGER update_reconciliation_line_items_updated_at
BEFORE UPDATE ON public.reconciliation_line_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default reconciliation templates with accounting logic
INSERT INTO public.reconciliation_templates (name, description, template_type, field_schema, calculation_rules)
VALUES 
  (
    'Bank Reconciliation',
    'Standard bank account reconciliation with book-to-bank adjustments',
    'bank',
    '{"sections": [{"name": "outstanding_checks", "label": "Outstanding Checks", "lineType": "outstanding"}, {"name": "deposits_in_transit", "label": "Deposits in Transit", "lineType": "deposit_in_transit"}, {"name": "other_adjustments", "label": "Other Adjustments", "lineType": "adjustment"}]}',
    '{"adjusted_book_balance": "gl_balance - outstanding_checks + deposits_in_transit + other_adjustments", "variance": "adjusted_book_balance - sub_balance"}'
  ),
  (
    'Prepaid Expense',
    'Prepaid expense amortization with straight-line or custom schedule',
    'prepaid',
    '{"fields": [{"name": "original_amount", "type": "number", "label": "Original Amount"}, {"name": "start_date", "type": "date", "label": "Start Date"}, {"name": "end_date", "type": "date", "label": "End Date"}, {"name": "amortization_method", "type": "select", "label": "Method", "options": ["straight_line", "accelerated", "custom"]}]}',
    '{"monthly_amortization": "original_amount / months_remaining", "remaining_balance": "original_amount - total_amortized"}'
  ),
  (
    'Accrual Rollforward',
    'Monthly accrual with opening balance, additions, and reversals',
    'accrual',
    '{"sections": [{"name": "additions", "label": "Additions", "lineType": "addition"}, {"name": "reversals", "label": "Reversals", "lineType": "reversal"}]}',
    '{"closing_balance": "opening_balance + additions - reversals"}'
  ),
  (
    'Fixed Asset',
    'Fixed asset reconciliation with depreciation tracking',
    'fixed_asset',
    '{"fields": [{"name": "cost", "type": "number", "label": "Original Cost"}, {"name": "useful_life", "type": "number", "label": "Useful Life (months)"}, {"name": "salvage_value", "type": "number", "label": "Salvage Value"}], "sections": [{"name": "additions", "label": "Additions", "lineType": "addition"}, {"name": "disposals", "label": "Disposals", "lineType": "reversal"}, {"name": "depreciation", "label": "Depreciation", "lineType": "depreciation"}]}',
    '{"accumulated_depreciation": "sum(depreciation)", "net_book_value": "cost + additions - disposals - accumulated_depreciation"}'
  ),
  (
    'Lease (IFRS 16)',
    'Lease liability and ROU asset reconciliation per IFRS 16',
    'lease',
    '{"fields": [{"name": "lease_term", "type": "number", "label": "Lease Term (months)"}, {"name": "discount_rate", "type": "number", "label": "Discount Rate (%)"}, {"name": "monthly_payment", "type": "number", "label": "Monthly Payment"}], "sections": [{"name": "interest", "label": "Interest Expense", "lineType": "interest"}, {"name": "principal", "label": "Principal Payment", "lineType": "principal"}]}',
    '{"present_value": "pv(monthly_payment, discount_rate, lease_term)", "closing_liability": "opening_liability + interest - principal"}'
  ),
  (
    'Intercompany',
    'Intercompany balance reconciliation between entities',
    'intercompany',
    '{"fields": [{"name": "counterparty", "type": "text", "label": "Counterparty Entity"}, {"name": "currency", "type": "text", "label": "Currency"}], "sections": [{"name": "charges", "label": "Charges To", "lineType": "addition"}, {"name": "credits", "label": "Credits From", "lineType": "reversal"}]}',
    '{"net_position": "charges - credits", "variance": "gl_balance - counterparty_balance"}'
  )
ON CONFLICT DO NOTHING;