
# Fix: Connect PBC Sample Data to Department Structure

## Problem Identified

The PBC sample data exists in the database but isn't appearing in the sidebar because:

1. **Sidebar is department-first**: Each department shows its own "PBC Requests" module
2. **PBC nodes have no department link**: The `pbc_nodes` table lacks a `department_id` column
3. **Current code shows same PBC tree to all departments**: Line 321 uses global `pbcTreeNodes` instead of filtering by department

## Solution Options

### Option A: Add department_id to pbc_nodes (Recommended)

Add a `department_id` column to `pbc_nodes` table and update the sidebar to filter PBC nodes by department.

**Pros:**
- Matches how Documents/Tasks/Reconciliations work
- Each department shows only its PBC requests
- Clean data model

**Cons:**
- Requires database migration
- Needs to update seed data

### Option B: Show all PBC nodes under first department only

Quick fix without database changes - show PBC tree only once.

**Pros:**
- No database changes
- Quick to implement

**Cons:**
- PBC requests would all appear under one department
- Doesn't scale well for multi-department organizations

---

## Recommended Implementation (Option A)

### Step 1: Add department_id column to pbc_nodes

```sql
ALTER TABLE pbc_nodes ADD COLUMN department_id UUID REFERENCES departments(id);

-- Create index for performance
CREATE INDEX idx_pbc_nodes_department ON pbc_nodes(department_id);
```

### Step 2: Update seed data with department linkage

```sql
-- Get the Finance department ID
UPDATE pbc_nodes 
SET department_id = (SELECT id FROM departments WHERE name = 'Finance' LIMIT 1)
WHERE entity_id = '11111111-1111-1111-1111-111111111111';
```

### Step 3: Update useUnifiedFolderStructure.ts

Filter PBC nodes by department when building each department's tree:

```typescript
// Group PBC nodes by department
const pbcByDept: Record<string, PbcNodeRow[]> = {};
(pbcNodes as PbcNodeRow[])?.forEach((node: any) => {
  if (node.department_id) {
    if (!pbcByDept[node.department_id]) pbcByDept[node.department_id] = [];
    pbcByDept[node.department_id].push(node);
  }
});

// Inside the department loop:
const deptPbcNodes = pbcByDept[deptId] || [];
const pbcTreeNodes = buildPbcTreeNodes(deptPbcNodes);
```

### Step 4: Update CreatePbcNodeModal to require department selection

When creating new PBC nodes, capture department_id.

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/NEW` | Add department_id column, update seed data |
| `src/hooks/useUnifiedFolderStructure.ts` | Filter PBC nodes by department |
| `src/hooks/usePbcTree.ts` | Include department_id in queries |
| `src/components/pbc/CreatePbcNodeModal.tsx` | Add department selector for root nodes |
| `src/types/pbc-tree.ts` | Add department_id to interfaces |

---

## Expected Result

After implementation:
- Navigate to **Finance** department in sidebar
- Expand **PBC Requests** under Finance
- See the full Asset/Liability/Equity hierarchy with all sample requests
- Each department will only show its own PBC requests
