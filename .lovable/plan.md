
# Plan: Show PBC Tree in the Sidebar

## Overview

This plan integrates the new hierarchical PBC tree (Department/Process/Area/Object/Request) into the SharedSidebar, replacing the flat list of PBC items. The sidebar will now display the full PBC tree structure matching the same terminology as the Documents module.

## Current State

```text
Sidebar Structure Now:
[Department]
├── Documents
│   └── Process → Area → Object (hierarchical)
├── PBC Requests
│   └── PBC Request abc123... (flat list - old pbc_items table)
├── Tasks
└── Reconciliations
```

## Proposed Structure

```text
Sidebar Structure After:
[Department]
├── Documents
│   └── Process → Area → Object
├── PBC Requests
│   ├── [Department] Finance (if present)
│   │   └── [Process] Fixed Assets
│   │       └── [Area] Additions
│   │           └── [Request] Additions Listing
│   └── [Area] Equity (minimal depth example)
│       └── [Request] Equity Schedule
├── Tasks
└── Reconciliations
```

---

## Technical Changes

### Phase 1: Update useUnifiedFolderStructure Hook

**File: `src/hooks/useUnifiedFolderStructure.ts`**

Replace the fetch from `pbc_items` with `pbc_nodes` and build a nested tree structure:

```typescript
// Current (fetches flat pbc_items):
const pbcQuery = supabase
  .from('pbc_items')
  .select('*, processes!inner(department_id)')
  ...

// Updated (fetches hierarchical pbc_nodes):
const { data: pbcNodes = [] } = await supabase
  .from('pbc_nodes')
  .select('*')
  .eq('entity_id', entityId)
  .eq('period_id', periodId)
  .order('sort_order');

// Then build tree and group by department (from node metadata or parent chain)
```

The hook will:
1. Fetch all `pbc_nodes` for the entity/period
2. Build a hierarchical tree structure (reusing the `buildPbcTree` logic)
3. Convert `PbcTreeNode` objects into sidebar-compatible `TreeNode` objects
4. Nest these under the "PBC Requests" module node

### Phase 2: Add New TreeNode Types

**File: `src/types/filegrid.ts`**

Add PBC-specific node types to the `TreeNodeType` union:

```typescript
export type TreeNodeType = 
  | 'entity' | 'department' | 'process' | 'area' | 'object'
  | 'module-documents' | 'module-pbc' | 'module-tasks' | 'module-reconciliations'
  | 'pbc-item' | 'task-item' | 'reconciliation-account'
  // New PBC tree types for sidebar:
  | 'pbc-department' | 'pbc-process' | 'pbc-area' | 'pbc-object' | 'pbc-request';
```

### Phase 3: Update UnifiedFolderTree Component

**File: `src/components/filegrid/UnifiedFolderTree.tsx`**

Add icons and styling for the new PBC tree node types:

```typescript
const iconMap: Record<TreeNodeType, typeof Briefcase> = {
  // ... existing icons
  'pbc-department': Briefcase,
  'pbc-process': FolderOpen,
  'pbc-area': Folder,
  'pbc-object': FileBox,
  'pbc-request': ClipboardCheck,
};

const pbcColors: Record<string, string> = {
  'pbc-department': 'text-slate-500',
  'pbc-process': 'text-blue-500',
  'pbc-area': 'text-amber-500',
  'pbc-object': 'text-purple-500',
  'pbc-request': 'text-green-500',
};
```

### Phase 4: Update UnifiedWorkspace to Handle Sidebar Selection

**File: `src/components/layout/UnifiedWorkspace.tsx`**

Update the `getActiveModule` function to recognize PBC tree node types:

```typescript
const getActiveModule = (): string | null => {
  const type = selectedNode?.type;
  if (type?.startsWith('pbc-')) {
    return 'pbc';
  }
  // ... existing logic
};
```

When a sidebar PBC node is selected, sync it with the PBC tree in the main panel.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/types/filegrid.ts` | Add `pbc-department`, `pbc-process`, `pbc-area`, `pbc-object`, `pbc-request` to `TreeNodeType` |
| `src/hooks/useUnifiedFolderStructure.ts` | Replace `pbc_items` fetch with `pbc_nodes`, build hierarchical tree |
| `src/components/filegrid/UnifiedFolderTree.tsx` | Add icons and styling for PBC tree node types |
| `src/components/layout/UnifiedWorkspace.tsx` | Update module detection to handle PBC tree types |

---

## Visual Result

After implementation, clicking on "PBC Requests" in the sidebar will expand to show the full tree structure:

```text
[Finance]
├── Documents
│   └── Fixed Assets
│       └── Additions (3 docs)
├── PBC Requests
│   ├── Fixed Assets (process)
│   │   ├── Additions (area)
│   │   │   ├── Additions Listing [Complete]
│   │   │   └── Supporting Invoices [Requested]
│   │   └── Disposals (area)
│   │       └── Disposal Schedule [Uploaded]
│   └── Equity (area - minimal depth)
│       └── Equity Schedule [Complete]
├── Tasks (5)
└── Reconciliations (3)
```

## Implementation Order

1. Add new node types to `TreeNodeType`
2. Update `useUnifiedFolderStructure` to fetch and build PBC tree
3. Add icons and colors to `UnifiedFolderTree`
4. Update workspace module detection
5. Test tree rendering and selection
