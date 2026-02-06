
# Plan: Clean Up UI with Relevant Module-Specific Folders

## Summary
Replace the current cluttered sidebar with relevant, module-specific folder structures that make sense for each feature. Each module will show only the folders and hierarchy that are meaningful for its purpose.

## Current Problem
The sidebar currently shows a generic Process/Area/Object tree from the `processes`, `areas`, and `objects` tables for ALL modules. This creates confusion because:

| Module | What it Shows Now | What it Should Show |
|--------|-------------------|---------------------|
| **Documents** | All processes including HR, Legal with empty folders | Only processes with documents (Monthly Close) |
| **PBC Requests** | Generic Area/Object tree (12 folders) | Financial statement hierarchy (Assets/Liabilities/Equity) from `pbc_nodes` |
| **Reconciliations** | Already uses its own tree | Keep as-is |
| **Compliance** | Generic folder tree (not used) | No tree needed - uses dashboard/list views |
| **Checklists** | Generic folder tree (not used) | No tree needed - uses its own workspace |
| **Month Close** | Monthly Close process only | Keep as-is (correct behavior) |

## Solution

### 1. PBC Module: Use its Own Hierarchy from `pbc_nodes`
The PBC module has a separate hierarchical structure stored in `pbc_nodes` table that follows financial statement classification:

```text
Assets (process)
├── Current Assets (area)
│   ├── Cash (object)
│   │   ├── Bank Statement (request)
│   │   ├── Bank Reconciliation (request)
│   │   └── Outstanding Checks List (request)
│   ├── Accounts Receivable (object)
│   │   └── AR Aging Schedule (request)
│   └── Inventory (object)
├── Non-Current Assets (area)
│   ├── Fixed Assets (object)
│   └── Intangibles (object)
Liabilities (process)
├── Current Liabilities (area)
│   ├── Accounts Payable (object)
│   └── Accrued Expenses (object)
Equity (process)
└── Retained Earnings (area)
```

This is the actual audit-centric structure that makes sense for PBC requests.

### 2. Documents Module: Filter Empty Folders
Only show processes/areas/objects that have actual documents or objects.

### 3. Compliance & Checklists: Hide Folder Tree
These modules don't need folder navigation - they use their own dashboard/list/kanban views.

## Technical Changes

### File 1: `src/components/layout/UnifiedSidebar.tsx`

**Change**: Update the `showFolderTree` logic to exclude modules that don't need folders:

```typescript
// Line 149: Change the condition
// Before:
const showFolderTree = ['documents', 'pbc', 'monthclose', 'compliance', 'checklists'].includes(activeFeature) && !isConsolidated;

// After:
const showFolderTree = ['documents', 'monthclose'].includes(activeFeature) && !isConsolidated;
const showPbcTree = activeFeature === 'pbc' && !isConsolidated;
```

**Add**: New section for PBC-specific tree rendering that uses `usePbcTree` hook and displays the `pbc_nodes` hierarchy.

### File 2: `src/hooks/useFeatureFolderStructure.ts`

**Change**: Filter out empty folders:

```typescript
// For documents view - skip empty areas (no objects)
for (const area of processAreas) {
  const areaObjects = objects.filter(o => o.area_id === area.id);
  if (areaObjects.length === 0) continue; // ADD THIS LINE
  // ... rest of the code
}

// Skip processes with no populated areas
if (areaNodes.length > 0) { // Already exists
  processNodes.push({ ... });
}
```

### File 3: Create `src/components/pbc/PbcSidebarTree.tsx` (New File)

A new component that renders the `pbc_nodes` hierarchy in the sidebar:

```typescript
// Uses usePbcTree hook to get the financial statement hierarchy
// Renders: Assets → Current Assets → Cash → (requests as leaf nodes)
// Allows selection of any node type (process/area/object)
// Shows completion badges for each branch
```

### File 4: Database Cleanup (SQL Migration)

Remove duplicate and empty records:

```sql
-- Delete one duplicate "Contract Management" process
DELETE FROM areas WHERE process_id = 'd8ba0901-391c-416b-9172-b69ebcfc48b4';
DELETE FROM processes WHERE id = 'd8ba0901-391c-416b-9172-b69ebcfc48b4';

-- Delete empty HR process (Employee Onboarding - has 0 objects)
DELETE FROM areas WHERE process_id = 'cf22fc4b-0f29-444b-a9e6-0f3cbdcd5a5f';
DELETE FROM processes WHERE id = 'cf22fc4b-0f29-444b-a9e6-0f3cbdcd5a5f';

-- Delete remaining duplicate Legal process
DELETE FROM areas WHERE process_id = '34c667ed-f3ea-4ce0-af72-b100410f7d32';
DELETE FROM processes WHERE id = '34c667ed-f3ea-4ce0-af72-b100410f7d32';

-- Delete empty areas in Monthly Close
DELETE FROM areas WHERE id IN (
  '33333333-3333-3333-3333-333333333303', -- Payables (0 objects)
  '33333333-3333-3333-3333-333333333304'  -- Receivables (0 objects)
);
```

## Result After Implementation

### Documents Module Sidebar
```text
Navigation
└── Monthly Close
    ├── Banking (2 objects)
    │   ├── Chase Operating
    │   └── Chase Payroll
    ├── Equity (1 object)
    │   └── Dividends Paid
    ├── Fixed Assets (1 object)
    │   └── Depreciation
    └── Journals (1 object)
        └── Accruals
```

### PBC Module Sidebar
```text
Navigation (PBC Tree)
├── Assets
│   ├── Current Assets
│   │   ├── Cash (5 requests)
│   │   ├── Accounts Receivable (2 requests)
│   │   └── Inventory (1 request)
│   └── Non-Current Assets
│       ├── Fixed Assets (2 requests)
│       └── Intangibles (1 request)
├── Liabilities
│   ├── Current Liabilities
│   │   ├── Accounts Payable (2 requests)
│   │   └── Accrued Expenses (1 request)
│   └── Long-term Liabilities
│       └── Debt (1 request)
└── Equity
    └── Retained Earnings (1 request)
```

### Compliance & Checklists Modules
No folder tree - just their existing dashboard/list/kanban workspace views.

## Files to Modify
1. `src/components/layout/UnifiedSidebar.tsx` - Update tree display logic
2. `src/hooks/useFeatureFolderStructure.ts` - Filter empty folders
3. `src/components/pbc/PbcSidebarTree.tsx` - New file for PBC hierarchy
4. Database migration - Clean up duplicates

## Effort Estimate
- Code changes: ~150 lines
- Database cleanup: 4 SQL statements
- No breaking changes to existing functionality
