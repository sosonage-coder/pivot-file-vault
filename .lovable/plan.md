
# Enable Tasks and Reconciliations Navigation

## Overview
Both the Tasks and Reconciliations modules have been fully implemented (Phase 3 and Phase 4), but the navigation still shows them as disabled. This is a simple configuration fix.

## Change Required

**File:** `src/components/layout/ModuleNav.tsx`

Remove the `disabled: true` property from both the Tasks and Reconciliations module entries:

```typescript
const modules = [
  { path: '/', label: 'Documents', icon: FileText },
  { path: '/pbc', label: 'PBC', icon: ClipboardList },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },           // Remove disabled
  { path: '/reconciliations', label: 'Recon', icon: Scale },       // Remove disabled
];
```

## Result
After this change, all four modules (Documents, PBC, Tasks, Reconciliations) will be fully navigable from the header.
