

# Fix Process Creation, Add Missing Sidebar Trees, Move Filters to Horizontal View

## Issues Identified

### Issue 1: Process "Add" only shows for some features
The `showFolderTree` condition in `UnifiedSidebar.tsx` only includes `documents`, `pbc`, and `monthclose`:
```typescript
const showFolderTree = activeFeature === 'documents' || activeFeature === 'pbc' || activeFeature === 'monthclose';
```
The "+ Add Process" button is inside this block, so it's only visible for those features.

### Issue 2: Filters are cluttering the sidebar
The sidebar currently contains Entity/Period selectors. The plan calls for filters (especially the new hierarchical date picker with multi-month selection) to move to a horizontal bar in the workspace.

### Issue 3: Pivot Filter Bar not visible
The `PivotFilterBar` is only rendered in `UnifiedWorkspace.tsx` when viewing a pivot view - but users navigating via the per-feature pages (`DocumentsPage.tsx`, `PBCRequestsPage.tsx`) don't see it because those pages don't use `UnifiedWorkspace`.

### Issue 4: Add Process requires too many steps
Current flow: Department dropdown → Template dropdown → Name input
User wants: Simple input field (like AddFolderModal) - just type a name

---

## Solution Overview

### 1. Simplify "Add Process" Modal
Create a new `SimpleAddProcessModal` that works like the `AddFolderModal`:
- Single input field for process name
- Auto-select a default department (e.g., "Finance" or first available)
- No template required (template_id is nullable)
- Creates empty process that user can add Areas to manually

### 2. Show Folder Tree + Add Process for ALL Features
Update `UnifiedSidebar.tsx` to show the folder tree section for all features that need structural navigation:
- `documents`
- `pbc`
- `monthclose`
- `reconciliations` (uses its own tree but should also allow process creation)
- `checklists`
- `compliance`

### 3. Move Filters from Sidebar to Horizontal Header Bar
Remove Entity/Period selectors from the sidebar and add them to:
- A horizontal filter bar at the top of each workspace
- Keep Entity selector in sidebar (global context)
- Move Period/Year/Month selection to the horizontal workspace filter bar

### 4. Integrate PivotFilterBar in Feature Pages
Add the filter bar (with hierarchical date picker) to `DocumentsPage.tsx` and other pages that need it, making it always visible in the workspace area.

---

## Files to Modify

### 1. Create `src/components/filegrid/SimpleAddProcessModal.tsx`
A simplified modal with just a name input:
```text
+----------------------------------+
| Add Process                      |
+----------------------------------+
| Process Name: [______________]   |
|                                  |
| [Cancel]              [Create]   |
+----------------------------------+
```

### 2. Modify `src/hooks/useAdminMutations.ts`
Add a new `useCreateProcess` hook that creates a process without requiring a template:
```typescript
interface SimpleCreateProcessData {
  name: string;
  entity_id: string;
  department_id?: string; // Optional - use default
}
```

### 3. Modify `src/components/layout/UnifiedSidebar.tsx`
- Replace `CreateProcessModal` with `SimpleAddProcessModal`
- Show folder tree for more features (checklists, compliance)
- Keep Entity selector in sidebar
- Move Period selector to workspace header

### 4. Modify `src/pages/DocumentsPage.tsx`
Add horizontal filter bar with:
- Year/Month hierarchical picker (from `HierarchicalDatePicker`)
- View selector (already exists)
- Status filters for pivot views
- Dimension selectors when in pivot mode

### 5. Modify `src/pages/PBCRequestsPage.tsx`
Add filter bar for period selection (Year → Month multi-select)

### 6. Modify other feature pages
Add similar filter bars to:
- `CloseCalendarPage.tsx`
- `ReconciliationsPage.tsx`
- `CompliancePage.tsx`
- `ChecklistsPage.tsx`

---

## Technical Implementation Details

### Simple Process Creation Hook
```typescript
export function useCreateProcess() {
  return useMutation({
    mutationFn: async (data: { name: string; entity_id: string }) => {
      // Get default department (Finance) or first available
      const { data: depts } = await supabase
        .from('departments')
        .select('id')
        .order('name')
        .limit(1);
      
      const { data: process, error } = await supabase
        .from('processes')
        .insert({
          name: data.name,
          entity_id: data.entity_id,
          department_id: depts?.[0]?.id,
          template_id: null, // No template
        })
        .select()
        .single();
      
      if (error) throw error;
      return process;
    },
  });
}
```

### Horizontal Filter Bar Pattern
Each feature page will include a filter header:
```text
+-----------------------------------------------------------------------+
| [Year: 2025 ▾] [Months: Jan, Feb, Mar... ▾]  [Status: □D □F □S □A]   |
+-----------------------------------------------------------------------+
|                        [Main Content Area]                            |
+-----------------------------------------------------------------------+
```

### Sidebar Simplification
Before:
```text
+------------------------+
| Entity: [Acme ▾]      |
| Period: [2025-01 ▾]   |  <- Remove this
+------------------------+
| + Add Process          |
| [Folder Tree]          |
+------------------------+
```

After:
```text
+------------------------+
| Entity: [Acme ▾]      |
+------------------------+
| + Add Process          |
| [Folder Tree]          |
+------------------------+
```

Period selection moves to the workspace horizontal bar.

---

## Summary of Changes

| Change | File(s) | Description |
|--------|---------|-------------|
| Create simple add process modal | `SimpleAddProcessModal.tsx` | Single input, no dropdowns |
| Add simple create hook | `useAdminMutations.ts` | No template/department selection |
| Show folder tree for all features | `UnifiedSidebar.tsx` | Enable for compliance, checklists |
| Remove Period from sidebar | `UnifiedSidebar.tsx` | Only keep Entity selector |
| Add filter bar to Documents | `DocumentsPage.tsx` | Hierarchical date picker + view selector |
| Add filter bar to PBC | `PBCRequestsPage.tsx` | Year/Month multi-select |
| Add filter bar to other pages | `CloseCalendarPage.tsx`, etc. | Consistent filter pattern |

