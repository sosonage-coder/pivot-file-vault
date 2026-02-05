-- Seed additional multi-entity sample data for consolidated dashboards/workflows
DO $$
DECLARE
  v_acme_corp_id uuid;
  v_acme_retail_id uuid;
  v_finance_department_id uuid;

  v_monthly_close_template_id uuid;
  v_audit_template_id uuid;

  v_jan_2025_period_id uuid;

  v_corp_close_process_id uuid;
  v_retail_close_process_id uuid;
  v_corp_audit_process_id uuid;
  v_retail_audit_process_id uuid;

  v_corp_banking_area_id uuid;
  v_retail_banking_area_id uuid;

  v_corp_cash_object_id uuid;
  v_retail_cash_object_id uuid;
  v_retail_ar_object_id uuid;

  v_bank_template_id uuid;
  v_prepaid_template_id uuid;

  v_checklist_template_id uuid;
  v_retail_recon_id uuid;

  v_pbc_process_id uuid;
  v_pbc_area_id uuid;
  v_pbc_object_id uuid;
BEGIN
  -- Entities
  SELECT id INTO v_acme_corp_id FROM public.entities WHERE name = 'Acme Corp' LIMIT 1;
  IF v_acme_corp_id IS NULL THEN
    INSERT INTO public.entities (name, active)
    VALUES ('Acme Corp', true)
    RETURNING id INTO v_acme_corp_id;
  END IF;

  SELECT id INTO v_acme_retail_id FROM public.entities WHERE name = 'Acme Retail' LIMIT 1;
  IF v_acme_retail_id IS NULL THEN
    INSERT INTO public.entities (name, active)
    VALUES ('Acme Retail', true)
    RETURNING id INTO v_acme_retail_id;
  END IF;

  -- Core references
  SELECT id INTO v_finance_department_id FROM public.departments WHERE name = 'Finance' LIMIT 1;
  IF v_finance_department_id IS NULL THEN
    SELECT id INTO v_finance_department_id FROM public.departments ORDER BY created_at ASC LIMIT 1;
  END IF;
  IF v_finance_department_id IS NULL THEN
    INSERT INTO public.departments (name) VALUES ('Finance') RETURNING id INTO v_finance_department_id;
  END IF;
  SELECT id INTO v_monthly_close_template_id FROM public.process_templates WHERE name = 'Monthly Close' LIMIT 1;
  SELECT id INTO v_audit_template_id FROM public.process_templates WHERE name = 'Audit' LIMIT 1;
  SELECT id INTO v_jan_2025_period_id FROM public.periods WHERE label = '2025-01' AND type = 'month' LIMIT 1;


  -- Ensure base 2025 monthly periods exist (idempotent)
  INSERT INTO public.periods (label, type, start_date, end_date)
  SELECT *
  FROM (
    VALUES
      ('2025-01', 'month'::public.period_type, DATE '2025-01-01', DATE '2025-01-31'),
      ('2025-02', 'month'::public.period_type, DATE '2025-02-01', DATE '2025-02-28'),
      ('2025-03', 'month'::public.period_type, DATE '2025-03-01', DATE '2025-03-31'),
      ('2025-04', 'month'::public.period_type, DATE '2025-04-01', DATE '2025-04-30'),
      ('2025-05', 'month'::public.period_type, DATE '2025-05-01', DATE '2025-05-31'),
      ('2025-06', 'month'::public.period_type, DATE '2025-06-01', DATE '2025-06-30'),
      ('2025-07', 'month'::public.period_type, DATE '2025-07-01', DATE '2025-07-31'),
      ('2025-08', 'month'::public.period_type, DATE '2025-08-01', DATE '2025-08-31'),
      ('2025-09', 'month'::public.period_type, DATE '2025-09-01', DATE '2025-09-30'),
      ('2025-10', 'month'::public.period_type, DATE '2025-10-01', DATE '2025-10-31'),
      ('2025-11', 'month'::public.period_type, DATE '2025-11-01', DATE '2025-11-30'),
      ('2025-12', 'month'::public.period_type, DATE '2025-12-01', DATE '2025-12-31')
  ) AS p(label, type, start_date, end_date)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.periods e
    WHERE e.label = p.label AND e.type = p.type
  );

  -- Ensure Jan 2025 exists if prior seed was not applied
  IF v_jan_2025_period_id IS NULL THEN
    INSERT INTO public.periods (label, type, start_date, end_date)
    VALUES ('2025-01', 'month', '2025-01-01', '2025-01-31')
    RETURNING id INTO v_jan_2025_period_id;
  END IF;

  -- Processes per entity
  SELECT id INTO v_corp_close_process_id
  FROM public.processes
  WHERE entity_id = v_acme_corp_id AND name = 'Monthly Close'
  LIMIT 1;

  IF v_corp_close_process_id IS NULL THEN
    INSERT INTO public.processes (name, entity_id, department_id, template_id)
    VALUES ('Monthly Close', v_acme_corp_id, v_finance_department_id, v_monthly_close_template_id)
    RETURNING id INTO v_corp_close_process_id;
  END IF;

  SELECT id INTO v_retail_close_process_id
  FROM public.processes
  WHERE entity_id = v_acme_retail_id AND name = 'Monthly Close'
  LIMIT 1;

  IF v_retail_close_process_id IS NULL THEN
    INSERT INTO public.processes (name, entity_id, department_id, template_id)
    VALUES ('Monthly Close', v_acme_retail_id, v_finance_department_id, v_monthly_close_template_id)
    RETURNING id INTO v_retail_close_process_id;
  END IF;

  SELECT id INTO v_corp_audit_process_id
  FROM public.processes
  WHERE entity_id = v_acme_corp_id AND name = 'Audit'
  LIMIT 1;

  IF v_corp_audit_process_id IS NULL THEN
    INSERT INTO public.processes (name, entity_id, department_id, template_id)
    VALUES ('Audit', v_acme_corp_id, v_finance_department_id, v_audit_template_id)
    RETURNING id INTO v_corp_audit_process_id;
  END IF;

  SELECT id INTO v_retail_audit_process_id
  FROM public.processes
  WHERE entity_id = v_acme_retail_id AND name = 'Audit'
  LIMIT 1;

  IF v_retail_audit_process_id IS NULL THEN
    INSERT INTO public.processes (name, entity_id, department_id, template_id)
    VALUES ('Audit', v_acme_retail_id, v_finance_department_id, v_audit_template_id)
    RETURNING id INTO v_retail_audit_process_id;
  END IF;

  -- Areas
  SELECT id INTO v_corp_banking_area_id
  FROM public.areas
  WHERE process_id = v_corp_close_process_id AND name = 'Banking'
  LIMIT 1;

  IF v_corp_banking_area_id IS NULL THEN
    INSERT INTO public.areas (name, process_id)
    VALUES ('Banking', v_corp_close_process_id)
    RETURNING id INTO v_corp_banking_area_id;
  END IF;

  SELECT id INTO v_retail_banking_area_id
  FROM public.areas
  WHERE process_id = v_retail_close_process_id AND name = 'Banking'
  LIMIT 1;

  IF v_retail_banking_area_id IS NULL THEN
    INSERT INTO public.areas (name, process_id)
    VALUES ('Banking', v_retail_close_process_id)
    RETURNING id INTO v_retail_banking_area_id;
  END IF;

  -- Objects
  SELECT id INTO v_corp_cash_object_id
  FROM public.objects
  WHERE entity_id = v_acme_corp_id AND process_id = v_corp_close_process_id AND area_id = v_corp_banking_area_id AND name = 'Operating Cash'
  LIMIT 1;

  IF v_corp_cash_object_id IS NULL THEN
    INSERT INTO public.objects (name, entity_id, department_id, process_id, area_id)
    VALUES ('Operating Cash', v_acme_corp_id, v_finance_department_id, v_corp_close_process_id, v_corp_banking_area_id)
    RETURNING id INTO v_corp_cash_object_id;
  END IF;

  SELECT id INTO v_retail_cash_object_id
  FROM public.objects
  WHERE entity_id = v_acme_retail_id AND process_id = v_retail_close_process_id AND area_id = v_retail_banking_area_id AND name = 'Retail Operating Cash'
  LIMIT 1;

  IF v_retail_cash_object_id IS NULL THEN
    INSERT INTO public.objects (name, entity_id, department_id, process_id, area_id)
    VALUES ('Retail Operating Cash', v_acme_retail_id, v_finance_department_id, v_retail_close_process_id, v_retail_banking_area_id)
    RETURNING id INTO v_retail_cash_object_id;
  END IF;

  SELECT id INTO v_retail_ar_object_id
  FROM public.objects
  WHERE entity_id = v_acme_retail_id AND process_id = v_retail_close_process_id AND area_id = v_retail_banking_area_id AND name = 'Retail Receivables Clearing'
  LIMIT 1;

  IF v_retail_ar_object_id IS NULL THEN
    INSERT INTO public.objects (name, entity_id, department_id, process_id, area_id)
    VALUES ('Retail Receivables Clearing', v_acme_retail_id, v_finance_department_id, v_retail_close_process_id, v_retail_banking_area_id)
    RETURNING id INTO v_retail_ar_object_id;
  END IF;

  -- Reconciliation template references
  SELECT id INTO v_bank_template_id FROM public.reconciliation_templates WHERE name = 'Bank Reconciliation' LIMIT 1;
  SELECT id INTO v_prepaid_template_id FROM public.reconciliation_templates WHERE name = 'Prepaid Expense Reconciliation' LIMIT 1;

  -- Reconciliations with mixed statuses for consolidated dashboard testing
  IF NOT EXISTS (
    SELECT 1 FROM public.reconciliations
    WHERE entity_id = v_acme_retail_id AND period_id = v_jan_2025_period_id AND object_id = v_retail_cash_object_id
  ) THEN
    INSERT INTO public.reconciliations (entity_id, object_id, period_id, template_id, status, gl_balance, sub_balance, notes)
    VALUES
      (v_acme_retail_id, v_retail_cash_object_id, v_jan_2025_period_id, v_bank_template_id, 'not_started', 450000, 450000, 'Seed: not started reconciliation'),
      (v_acme_retail_id, v_retail_ar_object_id, v_jan_2025_period_id, v_prepaid_template_id, 'in_progress', 132000, 131100, 'Seed: in progress reconciliation'),
      (v_acme_retail_id, v_retail_cash_object_id, v_jan_2025_period_id, v_bank_template_id, 'pending_review', 775000, 773900, 'Seed: pending review reconciliation'),
      (v_acme_retail_id, v_retail_ar_object_id, v_jan_2025_period_id, v_prepaid_template_id, 'approved', 98500, 98500, 'Seed: approved reconciliation')
    RETURNING id INTO v_retail_recon_id;
  ELSE
    SELECT id INTO v_retail_recon_id
    FROM public.reconciliations
    WHERE entity_id = v_acme_retail_id AND period_id = v_jan_2025_period_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.reconciliations
    WHERE entity_id = v_acme_corp_id AND period_id = v_jan_2025_period_id AND object_id = v_corp_cash_object_id
  ) THEN
    INSERT INTO public.reconciliations (entity_id, object_id, period_id, template_id, status, gl_balance, sub_balance, notes)
    VALUES
      (v_acme_corp_id, v_corp_cash_object_id, v_jan_2025_period_id, v_bank_template_id, 'approved', 1250000, 1249400, 'Seed: corp approved reconciliation');
  END IF;

  -- PBC node sample for Acme Retail
  IF NOT EXISTS (
    SELECT 1 FROM public.pbc_nodes
    WHERE entity_id = v_acme_retail_id AND period_id = v_jan_2025_period_id AND node_type = 'process' AND label = 'Assets'
  ) THEN
    INSERT INTO public.pbc_nodes (entity_id, period_id, node_type, label, sort_order)
    VALUES (v_acme_retail_id, v_jan_2025_period_id, 'process', 'Assets', 1)
    RETURNING id INTO v_pbc_process_id;

    INSERT INTO public.pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
    VALUES (v_acme_retail_id, v_jan_2025_period_id, v_pbc_process_id, 'area', 'Current Assets', 1)
    RETURNING id INTO v_pbc_area_id;

    INSERT INTO public.pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
    VALUES (v_acme_retail_id, v_jan_2025_period_id, v_pbc_area_id, 'object', 'Cash', 1)
    RETURNING id INTO v_pbc_object_id;

    INSERT INTO public.pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, priority, sort_order)
    VALUES (v_acme_retail_id, v_jan_2025_period_id, v_pbc_object_id, 'request', 'Retail bank reconciliation package', 'Requested', 'high', 1);
  END IF;

  -- Compliance sample
  IF NOT EXISTS (
    SELECT 1 FROM public.compliance_items
    WHERE entity_id = v_acme_retail_id AND title = 'Sales tax filing package'
  ) THEN
    INSERT INTO public.compliance_items (entity_id, period_id, title, description, due_date, recurrence, status, category)
    VALUES
      (v_acme_retail_id, v_jan_2025_period_id, 'Sales tax filing package', 'Prepare and submit monthly sales tax support.', '2025-02-15', 'monthly', 'in_progress', 'Tax'),
      (v_acme_retail_id, v_jan_2025_period_id, 'Lender covenant certificate', 'Quarter-end covenant package for lender reporting.', '2025-02-20', 'quarterly', 'pending', 'Lender');
  END IF;

  -- Checklist sample (instance + one completion)
  SELECT id INTO v_checklist_template_id
  FROM public.checklist_templates
  WHERE name = 'Monthly Close Checklist'
  LIMIT 1;

  IF v_checklist_template_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.checklist_instances
       WHERE entity_id = v_acme_retail_id AND period_id = v_jan_2025_period_id AND name = 'Acme Retail Jan Close Checklist'
     ) THEN
    INSERT INTO public.checklist_instances (template_id, reconciliation_id, entity_id, period_id, name, items)
    SELECT v_checklist_template_id, v_retail_recon_id, v_acme_retail_id, v_jan_2025_period_id, 'Acme Retail Jan Close Checklist', items
    FROM public.checklist_templates
    WHERE id = v_checklist_template_id;

    INSERT INTO public.checklist_item_completions (instance_id, item_index, completed, notes)
    SELECT ci.id, 0, true, 'Seed completion: first checklist item completed.'
    FROM public.checklist_instances ci
    WHERE ci.entity_id = v_acme_retail_id
      AND ci.period_id = v_jan_2025_period_id
      AND ci.name = 'Acme Retail Jan Close Checklist'
      AND NOT EXISTS (
        SELECT 1 FROM public.checklist_item_completions c
        WHERE c.instance_id = ci.id AND c.item_index = 0
      );
  END IF;

  -- Task/checklist style sample records
  IF NOT EXISTS (
    SELECT 1 FROM public.tasks
    WHERE entity_id = v_acme_retail_id AND title = 'Finalize Jan retail close packet'
  ) THEN
    INSERT INTO public.tasks (entity_id, title, description, process_id, area_id, object_id, period_id, status, priority, due_date)
    VALUES
      (v_acme_retail_id, 'Finalize Jan retail close packet', 'Complete tie-out and upload support docs.', v_retail_close_process_id, v_retail_banking_area_id, v_retail_cash_object_id, v_jan_2025_period_id, 'in_progress', 'high', '2025-02-05'),
      (v_acme_retail_id, 'Review open recon variances', 'Resolve pending variance notes before reviewer signoff.', v_retail_close_process_id, v_retail_banking_area_id, v_retail_ar_object_id, v_jan_2025_period_id, 'open', 'medium', '2025-02-08');
  END IF;
END
$$;
