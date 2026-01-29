
# Plan: Enable Request Children + Add Sample PBC Data

## Summary

This plan addresses two requests:
1. **Allow Request nodes to have children** (like supporting documents)
2. **Add sample data** using financial statement classification (Assets → Current Assets → Cash → Request items)

---

## Part 1: Current vs Proposed Structure

### Current PBC Hierarchy (5 levels, flexible depth)

```text
[Department] Finance           ← Can be root
  └── [Process] Monthly Close  ← Can be root  
      └── [Area] Banking       ← Can be root
          └── [Object] BofA Checking
              └── [Request] Bank Statement  ← LEAF (no children)
```

**Flexibility today:**
- Can start tree at Department, Process, or Area (skipping higher levels)
- Example: Area → Request (minimal depth)

### Proposed Change: Request Can Have Children (6 levels max)

```text
[Process] Assets
  └── [Area] Current Assets
      └── [Object] Cash
          └── [Request] Bank Reconciliation      ← Now can have children
              └── [Request] Bank Statement       ← Supporting item
              └── [Request] Outstanding Checks   ← Supporting item
```

---

## Part 2: Database Changes

### Update pbc_node_type Enum Constraint

The current code already defines `request` as allowing no children:

```typescript
// src/types/pbc-tree.ts
case 'request':
  return []; // Currently: no children
```

**Change to:**

```typescript
case 'request':
  return ['request']; // Requests can contain sub-requests (supporting items)
```

No database migration needed - this is purely a TypeScript logic change.

### Update UI Config

```typescript
// src/types/pbc-tree.ts - Update PBC_NODE_CONFIG
request: {
  // ... existing
  canHaveChildren: true,  // Changed from false
}
```

---

## Part 3: Sample Data Structure (Asset Classification)

Following financial statement presentation order:

```text
Finance (Department - optional, can skip)
└── Assets (Process)
    ├── Current Assets (Area)
    │   ├── Cash (Object)
    │   │   ├── Bank Reconciliation [Request - Requested]
    │   │   │   └── Bank Statement [Request - child]
    │   │   │   └── Outstanding Checks [Request - child]
    │   │   └── Petty Cash Count [Request]
    │   ├── Accounts Receivable (Object)
    │   │   ├── AR Aging Schedule [Request]
    │   │   └── Credit Memo Support [Request]
    │   └── Inventory (Object)
    │       └── Inventory Count [Request]
    │
    └── Non-Current Assets (Area)
        ├── Fixed Assets (Object)
        │   ├── FA Rollforward [Request]
        │   └── Depreciation Schedule [Request]
        └── Intangibles (Object)
            └── Amortization Schedule [Request]

└── Liabilities (Process)
    ├── Current Liabilities (Area)
    │   ├── Accounts Payable (Object)
    │   │   └── AP Aging Schedule [Request]
    │   └── Accrued Expenses (Object)
    │       └── Accrual Rollforward [Request]
    └── Long-term Liabilities (Area)
        └── Debt (Object)
            └── Debt Schedule [Request]

└── Equity (Process)
    └── Retained Earnings (Area)
        └── Equity Rollforward [Request]
```

---

## Part 4: Technical Implementation

### Files to Modify

| File | Change |
|------|--------|
| `src/types/pbc-tree.ts` | Update `getAllowedChildTypes` for request, set `canHaveChildren: true` |
| `src/components/pbc/PbcNodeItem.tsx` | Allow "Add child" action on request nodes |
| `supabase/migrations/NEW` | Insert sample PBC nodes with hierarchical structure |

### Migration SQL Structure

```sql
-- Insert sample PBC nodes for first entity and period
WITH context AS (
  SELECT 
    e.id AS entity_id,
    p.id AS period_id
  FROM entities e
  CROSS JOIN periods p
  WHERE p.label = '2025-01'
  LIMIT 1
),
-- Root level: Assets process
assets AS (
  INSERT INTO pbc_nodes (entity_id, period_id, node_type, label, sort_order)
  SELECT entity_id, period_id, 'process', 'Assets', 1
  FROM context
  RETURNING id, entity_id, period_id
),
-- Area: Current Assets
current_assets AS (
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  SELECT entity_id, period_id, id, 'area', 'Current Assets', 1
  FROM assets
  RETURNING id, entity_id, period_id
),
-- Object: Cash
cash AS (
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, sort_order)
  SELECT entity_id, period_id, id, 'object', 'Cash', 1
  FROM current_assets
  RETURNING id, entity_id, period_id
),
-- Request: Bank Reconciliation
bank_recon AS (
  INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, sort_order)
  SELECT entity_id, period_id, id, 'request', 'Bank Reconciliation', 'Requested', 1
  FROM cash
  RETURNING id, entity_id, period_id
)
-- Sub-request: Bank Statement (child of Bank Reconciliation)
INSERT INTO pbc_nodes (entity_id, period_id, parent_id, node_type, label, status, sort_order)
SELECT entity_id, period_id, id, 'request', 'Bank Statement', 'Requested', 1
FROM bank_recon;
-- ... continue for all sample items
```

---

## Part 5: Comparison Summary

| Feature | Documents | PBC Tree |
|---------|-----------|----------|
| Levels | Dept → Process → Area → Object → Document | Dept → Process → Area → Object → Request (→ Sub-request) |
| Flexible root | Yes (any level) | Yes (dept, process, or area) |
| Leaf can have children | Documents can have versions | Requests can have sub-requests |
| Max depth | 5 | 6 (with nested requests) |
| Sample data | Monthly Close process | Asset/Liability classification |

---

## Implementation Order

1. Update `src/types/pbc-tree.ts` - Allow requests to have children
2. Update `src/components/pbc/PbcNodeItem.tsx` - Show "Add child" on requests
3. Create database migration with sample data following asset classification
4. Test that nested requests appear correctly in sidebar and main tree
