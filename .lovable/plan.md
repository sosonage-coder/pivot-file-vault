
# Restore Folder Trees + Add PBC Feature

## Problem Summary

The recent feature-first navigation redesign created a cleaner sidebar with 5 top-level modules, but the **Documents** and **PBC** feature pages are currently placeholders. The rich folder tree navigation (Department → Process → Area → Object) that existed before is missing, along with the PBC Requests functionality.

## What Needs to Be Done

### 1. Add "PBC Requests" as a 6th Feature in Navigation

Currently the sidebar shows:
- Close Calendar
- Reconciliations
- Documents
- Checklists
- Meetings

We'll add **PBC Requests** (ClipboardList icon) between Documents and Checklists, making 6 features total.

### 2. Restore Folder Tree Inside Feature Workspaces

Each feature that needs hierarchical navigation (Documents, PBC Requests, Reconciliations) will have a **resizable split layout**:

```text
+-------------------------------------------+
| Feature Header (Documents)                 |
+-------------------------------------------+
| Folder Tree  |  Content Area              |
| (240px)      |  (flexible)                |
|              |                             |
| - Process    |  [Pivot View / List]       |
|   - Area     |                             |
|     - Object |                             |
+-------------------------------------------+
```

### 3. Feature-Specific Trees

| Feature | Tree Structure | Content |
|---------|---------------|---------|
| Documents | Process → Area → Object | Document list, pivot views, upload |
| PBC Requests | Process → Area → Object | PBC checklist workspace |
| Reconciliations | (Already has internal tree) | Reconciliation workspace |

---

## Files to Create

1. **`src/pages/PBCRequestsPage.tsx`** - New feature page for PBC Requests
2. **`src/components/layout/FeatureSplitLayout.tsx`** - Reusable split layout with resizable folder tree sidebar

## Files to Modify

1. **`src/App.tsx`** - Add `/pbc/*` route for PBC Requests
2. **`src/components/layout/AppSidebar.tsx`** - Add PBC Requests to navigation (Cmd+6 shortcut)
3. **`src/hooks/useActiveFeature.ts`** - Add 'pbc' feature type
4. **`src/pages/DocumentsPage.tsx`** - Replace placeholder with full implementation including folder tree
5. **`src/components/layout/FeatureLayout.tsx`** - Enhance to optionally support sidebar content

---

## Technical Details

### Navigation Update (AppSidebar.tsx)

```typescript
const FEATURES = [
  { id: 'close', label: 'Close Calendar', icon: CalendarClock, path: '/close' },
  { id: 'reconciliations', label: 'Reconciliations', icon: Scale, path: '/reconciliations' },
  { id: 'documents', label: 'Documents', icon: FileText, path: '/documents' },
  { id: 'pbc', label: 'PBC Requests', icon: ClipboardList, path: '/pbc' },  // NEW
  { id: 'checklists', label: 'Checklists', icon: CheckSquare, path: '/checklists' },
  { id: 'meetings', label: 'Meetings', icon: Users, path: '/meetings' },
];
```

### Feature Split Layout

The layout uses `react-resizable-panels` (already installed) for a resizable sidebar within each feature:

```text
+------------------+---------------------------+
| Folder Tree      | Content Area              |
| (min: 200px)     | (flexible)                |
| (default: 280px) |                           |
| (collapsible)    |                           |
+------------------+---------------------------+
```

### Documents Page Implementation

The Documents page will include:
- Left panel: `UnifiedFolderTree` filtered to show only Document-relevant nodes (Process → Area → Object)
- Right panel: `DocumentList` or `PivotView` based on selected view
- Header actions: View selector, Upload button, Clone Period

### PBC Requests Page Implementation

The PBC page will include:
- Left panel: Same folder tree structure, showing PBC request counts per object
- Right panel: `PbcChecklistWorkspace` for the selected object
- Header actions: Add Request button

---

## Data Flow

```text
AppSidebar (feature nav)
    ↓
DocumentsPage / PBCRequestsPage
    ↓
FeatureSplitLayout
    ├── UnifiedFolderTree (filtered by feature type)
    └── Content Component (DocumentList, PbcChecklistWorkspace, etc.)
```

### Folder Structure Hook

The existing `useUnifiedFolderStructure` hook already builds the tree with all data. Each feature page will filter the tree to show only relevant node types:

- **Documents**: Shows process/area/object with document counts
- **PBC Requests**: Shows process/area/object with PBC request counts

---

## Sample Data Preserved

The existing database already contains:
- Finance → Monthly Close → Banking → Chase Operating (3 docs, 3 PBC)
- Finance → Monthly Close → Banking → Chase Payroll (2 docs, 1 PBC)  
- Finance → Monthly Close → Fixed Assets → Depreciation (1 doc)
- Finance → Monthly Close → Journals → Accruals (2 docs)
- HR → Employee Onboarding → Forms, Policies
- Legal → Contract Management → Active/Expired Contracts

All this data will be visible in the restored folder trees.

---

## Implementation Order

1. Create `FeatureSplitLayout` component (resizable panels)
2. Update `AppSidebar` to add PBC Requests feature
3. Update `useActiveFeature` hook
4. Rebuild `DocumentsPage` with folder tree and full functionality
5. Create `PBCRequestsPage` with folder tree and PBC workspace
6. Add route for `/pbc/*`

---

## Keyboard Shortcuts (Updated)

| Shortcut | Feature |
|----------|---------|
| Cmd+1 | Close Calendar |
| Cmd+2 | Reconciliations |
| Cmd+3 | Documents |
| Cmd+4 | PBC Requests |
| Cmd+5 | Checklists |
| Cmd+6 | Meetings |

