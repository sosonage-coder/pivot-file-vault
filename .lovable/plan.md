

# FileGRID Enhancement Plan: Combined Filters + Object Sub-Folders

## Summary

This plan addresses two key enhancements:
1. **Multi-filter pivot views**: Add filter chips to combine status (Final/Draft), period, and other filters simultaneously
2. **Object as sub-folder level**: Display Objects as expandable folders under Areas in the sidebar tree

---

## Current State Analysis

### Hierarchy Today
```text
Entity → Department → Process → Area → Documents (flat list)
```

### Pivot Views Today
- Each view applies ONE grouping dimension
- "Final Only" is a separate view, not a combinable filter
- No way to say "Show me Final documents for Q4-2025 in the Accruals area"

---

## Proposed Changes

### Part 1: Combinable Filter Bar for Pivot Views

Add a filter bar that appears on all pivot views with these options:

| Filter      | Type        | Options                              |
|-------------|-------------|--------------------------------------|
| Status      | Multi-check | Draft, Final, Superseded, Archived   |
| Period      | Dropdown    | All periods / specific period        |
| Area        | Dropdown    | All areas / specific area            |

**User Experience:**
- Select "By Period" view from the dropdown
- Filter bar shows above the grouped documents  
- Toggle "Final only" checkbox → list updates in real-time
- Select specific period → further narrows results
- Filters persist when switching between pivot views

### Part 2: Objects as Sub-Folders in Tree

Extend the folder tree to show Objects under each Area:

```text
Finance (Department)
└── Monthly Close (Process)
    └── Accruals (Area)
        ├── Payroll Accruals (Object) → 3 docs
        ├── Vendor Accruals (Object) → 2 docs
        └── (No Object) → 1 doc
```

**Behavior:**
- Clicking an Area still shows all documents in that area
- Clicking an Object filters to only documents linked to that object
- Objects are user-creatable (existing functionality)
- New TreeNode type: `'object'`

---

## Technical Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/filegrid/PivotFilterBar.tsx` | Filter chip/dropdown component |

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/filegrid.ts` | Add `'object'` to TreeNode type; add filter state type |
| `src/hooks/useFolderStructure.ts` | Fetch objects per area; build 5-level tree |
| `src/hooks/useDocuments.ts` | Accept new filter parameters: periodId, objectId, statusList |
| `src/hooks/usePivotDocuments.ts` | Pre-filter documents before grouping |
| `src/pages/Index.tsx` | Add filter state; render PivotFilterBar; pass filters to hooks |
| `src/components/filegrid/FolderTree.tsx` | Add icon for 'object' type |

### Database Changes
None required. Objects already exist and are linked to Areas.

---

## Detailed Implementation Steps

### Step 1: Define Filter State Type
Add to `src/types/filegrid.ts`:
```typescript
export interface PivotFilters {
  statusList: DocumentStatus[];
  periodId: string | null;
  areaId: string | null;
  objectId: string | null;
}
```

### Step 2: Create PivotFilterBar Component
New component with:
- Status checkboxes (Draft, Final, etc.)
- Period dropdown (populated from usePeriods)
- Area dropdown (populated from folder structure)
- Clear filters button

### Step 3: Extend useDocuments Hook
Add optional filter parameters:
```typescript
interface UseDocumentsOptions {
  areaId?: string | null;
  entityId?: string | null;
  statusFilter?: DocumentStatus[] | null;  // Changed from single status
  periodId?: string | null;
  objectId?: string | null;
}
```

### Step 4: Extend Folder Tree with Objects
Modify `useFolderStructure.ts` to:
1. Fetch objects for each area
2. Count documents per object
3. Add object children under area nodes

Update TreeNode type to include `'object'`.

### Step 5: Wire Up in Index.tsx
- Add `pivotFilters` state
- Pass to useDocuments and usePivotDocuments
- Render PivotFilterBar when on a pivot view
- Handle object node selection from tree

---

## UI Mockup

```text
+----------------------------------------------------------+
| Acme Corp — By Period                                     |
+----------------------------------------------------------+
| Filters: [x] Final  [ ] Draft  |  Period: [All ▼]  |  Area: [All ▼]  |  [Clear]
+----------------------------------------------------------+
| ▼ 2025-12                                           (8)  |
|   ▼ Accruals                                        (4)  |
|       Payroll_Accruals_Invoice_2025-12_Final             |
|       Vendor_Accruals_Invoice_2025-12_Final              |
|   ▼ Banking                                         (4)  |
|       Main_Account_Reconciliation_2025-12_Final          |
+----------------------------------------------------------+
```

---

## Trade-offs Considered

| Approach | Pros | Cons |
|----------|------|------|
| **Objects as sub-folders** (chosen) | Uses existing data model; no schema changes | Objects are optional, so some docs won't nest |
| Sub-Area table | Cleaner forced hierarchy | Requires migration; more complex relationships |
| **Filter bar** (chosen) | Flexible; combinable | Slight UI complexity |
| Separate filter views | Simpler implementation | Explosion of view options |

---

## Success Criteria

1. User can select "By Period" view and toggle "Final only" → sees only finalized documents grouped by period
2. User can filter to a specific period across any pivot view
3. Folder tree shows Objects under Areas with document counts
4. Clicking an Object in the tree shows only that object's documents
5. Filters reset when switching entities

