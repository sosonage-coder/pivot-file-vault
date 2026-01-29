-- Insert sample PBC nodes following financial statement classification
-- Assets → Current Assets → Cash → Requests (with sub-requests)
-- Liabilities → Current/Long-term → Objects → Requests
-- Equity → Retained Earnings → Requests

-- Get context for first entity and January 2025 period
DO $$
DECLARE
  v_entity_id uuid;
  v_period_id uuid;
  -- Process IDs
  v_assets_id uuid;
  v_liabilities_id uuid;
  v_equity_id uuid;
  -- Area IDs
  v_current_assets_id uuid;
  v_noncurrent_assets_id uuid;
  v_current_liabilities_id uuid;
  v_longterm_liabilities_id uuid;
  v_retained_earnings_id uuid;
  -- Object IDs
  v_cash_id uuid;
  v_ar_id uuid;
  v_inventory_id uuid;
  v_fixed_assets_id uuid;
  v_intangibles_id uuid;
  v_ap_id uuid;
  v_accrued_id uuid;
  v_debt_id uuid;
  -- Request IDs (for parent requests that have children)
  v_bank_recon_id uuid;
BEGIN
  -- Get first entity and January 2025 period
  SELECT id INTO v_entity_id FROM entities LIMIT 1;
  SELECT id INTO v_period_id FROM periods WHERE label = '2025-01' LIMIT 1;
  
  -- Exit if no entity or period found
  IF v_entity_id IS NULL OR v_period_id IS NULL THEN
    RAISE NOTICE 'No entity or period found, skipping sample data';
    RETURN;
  END IF;

  -- ===== ASSETS PROCESS =====
  INSERT INTO pbc_nodes (entity_id, period_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, 'process', 'Assets', 1)
  RETURNING id INTO v_assets_id;

  -- Current Assets (Area)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, v_assets_id, 'area', 'Current Assets', 1)
  RETURNING id INTO v_current_assets_id;

  -- Cash (Object)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, v_current_assets_id, 'object', 'Cash', 1)
  RETURNING id INTO v_cash_id;

  -- Bank Reconciliation (Request with children)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, priority, sort_order)
  VALUES (v_entity_id, v_period_id, v_cash_id, 'request', 'Bank Reconciliation', 'Requested', 'high', 1)
  RETURNING id INTO v_bank_recon_id;

  -- Sub-requests under Bank Reconciliation
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, sort_order)
  VALUES 
    (v_entity_id, v_period_id, v_bank_recon_id, 'request', 'Bank Statement', 'Requested', 1),
    (v_entity_id, v_period_id, v_bank_recon_id, 'request', 'Outstanding Checks List', 'Requested', 2),
    (v_entity_id, v_period_id, v_bank_recon_id, 'request', 'Deposits in Transit', 'Requested', 3);

  -- Petty Cash Count (Request)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, sort_order)
  VALUES (v_entity_id, v_period_id, v_cash_id, 'request', 'Petty Cash Count', 'Requested', 2);

  -- Accounts Receivable (Object)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, v_current_assets_id, 'object', 'Accounts Receivable', 2)
  RETURNING id INTO v_ar_id;

  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, sort_order)
  VALUES 
    (v_entity_id, v_period_id, v_ar_id, 'request', 'AR Aging Schedule', 'Requested', 1),
    (v_entity_id, v_period_id, v_ar_id, 'request', 'Credit Memo Support', 'Requested', 2);

  -- Inventory (Object)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, v_current_assets_id, 'object', 'Inventory', 3)
  RETURNING id INTO v_inventory_id;

  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, sort_order)
  VALUES (v_entity_id, v_period_id, v_inventory_id, 'request', 'Inventory Count Sheet', 'Requested', 1);

  -- Non-Current Assets (Area)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, v_assets_id, 'area', 'Non-Current Assets', 2)
  RETURNING id INTO v_noncurrent_assets_id;

  -- Fixed Assets (Object)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, v_noncurrent_assets_id, 'object', 'Fixed Assets', 1)
  RETURNING id INTO v_fixed_assets_id;

  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, sort_order)
  VALUES 
    (v_entity_id, v_period_id, v_fixed_assets_id, 'request', 'FA Rollforward', 'Requested', 1),
    (v_entity_id, v_period_id, v_fixed_assets_id, 'request', 'Depreciation Schedule', 'Requested', 2);

  -- Intangibles (Object)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, v_noncurrent_assets_id, 'object', 'Intangibles', 2)
  RETURNING id INTO v_intangibles_id;

  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, sort_order)
  VALUES (v_entity_id, v_period_id, v_intangibles_id, 'request', 'Amortization Schedule', 'Requested', 1);

  -- ===== LIABILITIES PROCESS =====
  INSERT INTO pbc_nodes (entity_id, period_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, 'process', 'Liabilities', 2)
  RETURNING id INTO v_liabilities_id;

  -- Current Liabilities (Area)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, v_liabilities_id, 'area', 'Current Liabilities', 1)
  RETURNING id INTO v_current_liabilities_id;

  -- Accounts Payable (Object)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, v_current_liabilities_id, 'object', 'Accounts Payable', 1)
  RETURNING id INTO v_ap_id;

  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, sort_order)
  VALUES (v_entity_id, v_period_id, v_ap_id, 'request', 'AP Aging Schedule', 'Requested', 1);

  -- Accrued Expenses (Object)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, v_current_liabilities_id, 'object', 'Accrued Expenses', 2)
  RETURNING id INTO v_accrued_id;

  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, sort_order)
  VALUES (v_entity_id, v_period_id, v_accrued_id, 'request', 'Accrual Rollforward', 'Requested', 1);

  -- Long-term Liabilities (Area)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, v_liabilities_id, 'area', 'Long-term Liabilities', 2)
  RETURNING id INTO v_longterm_liabilities_id;

  -- Debt (Object)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, v_longterm_liabilities_id, 'object', 'Debt', 1)
  RETURNING id INTO v_debt_id;

  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, sort_order)
  VALUES (v_entity_id, v_period_id, v_debt_id, 'request', 'Debt Schedule', 'Requested', 1);

  -- ===== EQUITY PROCESS =====
  INSERT INTO pbc_nodes (entity_id, period_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, 'process', 'Equity', 3)
  RETURNING id INTO v_equity_id;

  -- Retained Earnings (Area)
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  VALUES (v_entity_id, v_period_id, v_equity_id, 'area', 'Retained Earnings', 1)
  RETURNING id INTO v_retained_earnings_id;

  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, sort_order)
  VALUES (v_entity_id, v_period_id, v_retained_earnings_id, 'request', 'Equity Rollforward', 'Requested', 1);

  RAISE NOTICE 'Sample PBC data created successfully';
END $$;