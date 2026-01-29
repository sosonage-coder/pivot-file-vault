

# Plan: Align PBC Tree Levels with Documents Structure

## Overview

This plan updates the PBC Tree to use the same level terminology as the Documents/Monthly Close structure, while maintaining the flexible depth capability. The new structure will be:

**Department → Process → Area → Object → Request**

This creates consistency across all modules and makes the PBC tree immediately familiar to users who work with the Documents folder structure.

## Current vs. Proposed Structure Comparison

```text
Current PBC Tree:              Proposed PBC Tree:
┌─────────────────────┐        ┌─────────────────────┐
│ Area                │        │ Department          │  Level 1 (optional)
├─────────────────────┤        ├─────────────────────┤
│ Dimension           │        │ Process             │  Level 2 (optional)
├─────────────────────┤        ├─────────────────────┤
│ Object              │        │ Area                │  Level 3
├─────────────────────┤        ├─────────────────────┤
│ Request (leaf)      │        │ Object              │  Level 4 (optional)
└─────────────────────┘        ├─────────────────────┤
                               │ Request (leaf)      │  Leaf node
                               └─────────────────────┘
```

## Flexible Depth Examples

### Minimal Depth (2 levels): Equity
```text
[Area] Equity
└── [Request] Equity Schedule
```

### Standard Depth (3 levels): Fixed Assets
```text
[Process] Fixed Assets
├── [Area] Additions
│   ├── [Request] Additions Listing
│   └── [Request] Supporting Invoices
└── [Area] Disposals
    └── [Request] Disposals Listing
```

### Full Depth (5 levels): Cash
```text
[Department] Finance
└── [Process] Banking
    └── [Area] Cash
        └── [Object] Bank of America
            ├── [Request] Bank Statements
            └── [Request] Bank Reconciliation
```

---

## Technical Changes

### Phase 1: Database Schema Update

**Update the enum to align with FileGRID terminology:**

```sql
-- Rename the enum values to match Documents structure
ALTER TYPE pbc_node_type RENAME VALUE 'dimension' TO 'process';
-- Keep 'area', 'object', 'request' as they already align
-- Add 'department' as a new option
ALTER TYPE pbc_node_type ADD VALUE 'department' BEFORE 'area';

-- Update constraint: now department OR area can be root
ALTER TABLE pbc_nodes DROP CONSTRAINT pbc_nodes_area_is_root;
ALTER TABLE pbc_nodes ADD CONSTRAINT pbc_nodes_valid_root CHECK (
  parent_id IS NOT NULL OR node_type IN ('department', 'area')
);
```

### Phase 2: Update Type Definitions

**File: `src/types/pbc-tree.ts`**

```typescript
// Updated to match Documents structure
export type PbcNodeType = 'department' | 'process' | 'area' | 'object' | 'request';

export const PBC_NODE_CONFIG: Record<PbcNodeType, {...}> = {
  department: {
    icon: 'Briefcase',
    colorClass: 'text-slate-500',
    label: 'Department',
    canHaveChildren: true,
    canHaveStatus: false,
  },
  process: {
    icon: 'FolderOpen',
    colorClass: 'text-blue-500',
    label: 'Process',
    canHaveChildren: true,
    canHaveStatus: false,
  },
  area: {
    icon: 'Folder',
    colorClass: 'text-amber-500',
    label: 'Area',
    canHaveChildren: true,
    canHaveStatus: false,
  },
  object: {
    icon: 'FileBox',
    colorClass: 'text-purple-500',
    label: 'Object',
    canHaveChildren: true,
    canHaveStatus: false,
  },
  request: {
    icon: 'ClipboardCheck',
    colorClass: 'text-green-500',
    label: 'Request',
    canHaveChildren: false,
    canHaveStatus: true,
  },
};
```

### Phase 3: Update Allowed Child Types

```typescript
export function getAllowedChildTypes(nodeType: PbcNodeType): PbcNodeType[] {
  switch (nodeType) {
    case 'department':
      return ['process', 'area', 'request'];  // Skip process if not needed
    case 'process':
      return ['area', 'object', 'request'];   // Skip area if not needed
    case 'area':
      return ['object', 'request'];           // Object optional
    case 'object':
      return ['request'];                     // Requests only
    case 'request':
      return [];                              // Leaf node
  }
}

export function canBeRoot(nodeType: PbcNodeType): boolean {
  // Either Department or Area can be root (for minimal depth)
  return nodeType === 'department' || nodeType === 'area';
}
```

### Phase 4: Template-Based Depth Control

Templates will define which levels are **required** vs. **optional**:

| Template | Min Depth | Max Depth | Required Levels | Optional Levels |
|----------|-----------|-----------|-----------------|-----------------|
| Equity | 2 | 3 | Area → Request | Department, Object |
| Fixed Assets | 3 | 4 | Process → Area → Request | Department, Object |
| Cash | 4 | 5 | Process → Area → Object → Request | Department |
| Revenue | 3 | 6 | Process → Area → Request | Department, Object, nested Areas |

### Phase 5: Update UI Components

**Files to update:**
- `PbcNodeItem.tsx` - Update icons to match Documents icons
- `CreatePbcNodeModal.tsx` - Update allowed types and labels
- `usePbcTree.ts` - Update type handling

---

## Files to Modify

| File | Change |
|------|--------|
| `src/types/pbc-tree.ts` | Update `PbcNodeType` enum, `PBC_NODE_CONFIG`, helper functions |
| `src/components/pbc/PbcNodeItem.tsx` | Update icons to match Documents tree |
| `src/components/pbc/CreatePbcNodeModal.tsx` | Update node type labels and descriptions |
| `src/hooks/usePbcTree.ts` | Update type references |
| `supabase/migrations/` | New migration to update enum |

## Database Migration (New)

```sql
-- Add department to enum and rename dimension to process
ALTER TYPE pbc_node_type ADD VALUE IF NOT EXISTS 'department' BEFORE 'area';

-- Update existing data: rename 'dimension' nodes to 'process'
UPDATE pbc_nodes SET node_type = 'process' WHERE node_type = 'dimension';

-- Drop and recreate enum (if rename not supported)
-- Alternative: create new enum and migrate

-- Update root constraint
ALTER TABLE pbc_nodes DROP CONSTRAINT pbc_nodes_area_is_root;
ALTER TABLE pbc_nodes ADD CONSTRAINT pbc_nodes_valid_root CHECK (
  parent_id IS NOT NULL OR node_type IN ('department', 'area')
);
```

---

## User Experience

After this change:
- PBC tree will use the same terminology as Documents
- Users can create trees starting at any level (Department, Process, or Area)
- Templates control the minimum and maximum depth
- Familiar icons from the Documents tree appear in PBC

## Implementation Order

1. Create database migration to update enum
2. Update TypeScript types and configurations
3. Update UI components (icons, labels)
4. Update hooks and validation logic
5. Test tree creation at various depths
6. Verify existing data remains functional

