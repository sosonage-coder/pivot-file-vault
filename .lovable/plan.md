

# Enhanced Pivot Filters, Dashboards, and Process Creation Plan

## Summary

Based on your requirements, we need to implement:

1. **Multi-Dimensional Pivot Filter** - Select 2-3 dimensions for cross-tabulation views
2. **Dashboard Strategy** - Central dashboard vs. per-feature dashboards
3. **Hierarchical Date Selector** - Year → Month with multi-select capability
4. **Process Creation** - How to add main folders (Processes) via the sidebar

---

## Current State Analysis

### Existing Pivot Filter
The current `PivotFilterBar.tsx` supports:
- Status checkboxes (multi-select: Draft, Final, Superseded, Archived)
- Period dropdown (single select)
- Area dropdown (single select)

### Existing Periods
Database contains periods with types: `month`, `quarter`, `year`
- Months: 2025-01 through 2025-12
- Quarters: Q1-2025 through Q4-2025
- Year: FY-2025

### Existing Dashboards
- `ReconciliationDashboard` - Shows variances, pending reviews, bottlenecks, completion by area
- `TaskDashboard` - Shows overdue, upcoming, completion rate, status breakdown

---

## Proposed Solutions

### 1. Multi-Dimensional Pivot Filter

Create a new enhanced filter component that allows selecting 2-3 dimensions for pivot views:

```text
+-------------------------------------------------------------------+
| Dimensions:                                                        |
| [Row: Period ▾]  [Column: Area ▾]  [+ Add Layer]                  |
|                                                                    |
| Filters:                                                           |
| [Status: □Draft □Final □Superseded □Archived]                      |
| [Year: 2025 ▾] [Months: □Jan □Feb ... ☑All]                       |
+-------------------------------------------------------------------+
```

| Dimension Options | Description |
|-------------------|-------------|
| Period | Group by month/quarter |
| Area | Group by process area |
| Object | Group by specific account/entity |
| Status | Group by document status |
| Document Type | Group by file type |

### 2. Dashboard Strategy

**Recommendation: Hybrid Approach**

| Dashboard | Purpose | Location |
|-----------|---------|----------|
| Global Command Center | Cross-feature metrics, alerts | New `/dashboard` route or header widget |
| Reconciliation Dashboard | Variance analysis, bottlenecks | When no recon selected |
| Task Dashboard | Overdue, completion tracking | When no task selected |
| Compliance Dashboard | Upcoming deadlines, overdue items | When no item selected |
| Month Close Dashboard | Close status, blockers | When no folder selected |

Each feature shows its dashboard when nothing is selected, but we can add a "Command Center" view accessible from the header.

### 3. Hierarchical Date Selector

Replace the flat period dropdown with a two-level selector:

```text
+---------------------------+
| Year: [2025 ▾]           |
+---------------------------+
| Months:                   |
| ☑ All  ☐ Clear            |
| ☑ Jan ☑ Feb ☐ Mar ☐ Apr  |
| ☐ May ☐ Jun ☐ Jul ☐ Aug  |
| ☐ Sep ☐ Oct ☐ Nov ☐ Dec  |
+---------------------------+
```

**Features:**
- Select year first (filters available months)
- Multi-select months within that year
- "All" checkbox to select/deselect all months
- Visual indication of selected count

### 4. Process Creation Flow

Processes are created via the `CreateProcessModal` component. Here's how to expose it:

**Current Method:**
The modal exists but needs a trigger. Add a "+" button at the top of the sidebar tree.

**Proposed Sidebar Enhancement:**

```text
+----------------------------------+
| Entity: [Acme Corp ▾]           |
| Year: [2025 ▾] Months: [3 sel]  |
+----------------------------------+
| [+ Add Process]  [🔍 Search]    |
+----------------------------------+
| ▼ Monthly Close (Process)       |
|   ▼ General Ledger (Area)       |
|     📄 Cash (Object)            |
+----------------------------------+
```

---

## Files to Modify

1. **`src/components/filegrid/PivotFilterBar.tsx`**
   - Add hierarchical date selector (Year → Months with multi-select)
   - Add dimension selector for pivot rows/columns

2. **`src/components/layout/UnifiedSidebar.tsx`**
   - Replace single period dropdown with Year + Month multi-select
   - Add "+ Add Process" button that opens CreateProcessModal

3. **`src/types/filegrid.ts`**
   - Extend `PivotFilters` to support:
     - `selectedYears: string[]`
     - `selectedMonths: string[]`
     - `pivotRowDimension`, `pivotColumnDimension`

4. **`src/components/filegrid/HierarchicalDatePicker.tsx`** (New)
   - Reusable year/month multi-select component

5. **`src/components/filegrid/DimensionSelector.tsx`** (New)
   - Dropdown to pick pivot dimensions

6. **`src/hooks/usePivotDocuments.ts`**
   - Update to support multi-period filtering

---

## Database Considerations

No schema changes needed - the `periods` table already has:
- `type` field (month, quarter, year)
- `start_date` and `end_date` for filtering
- `label` for display (e.g., "2025-01", "Q1-2025", "FY-2025")

---

## Implementation Details

### Hierarchical Date Picker Component

```typescript
interface HierarchicalDatePickerProps {
  years: string[];              // ["2025", "2024"]
  selectedYear: string | null;
  selectedMonths: string[];     // ["2025-01", "2025-02"]
  onYearChange: (year: string) => void;
  onMonthsChange: (months: string[]) => void;
}
```

**Logic:**
1. Extract unique years from periods data
2. When year changes, filter months to that year
3. Allow multi-select of months via checkboxes
4. Pass selected period IDs to parent filter

### Process Creation Button

Add to `UnifiedSidebar.tsx`:

```typescript
// At top of tree section
<Button
  variant="ghost"
  size="sm"
  onClick={() => setShowCreateProcess(true)}
  className="w-full justify-start"
>
  <Plus className="h-4 w-4 mr-2" />
  Add Process
</Button>

<CreateProcessModal
  open={showCreateProcess}
  onOpenChange={setShowCreateProcess}
  entity={selectedEntity}
/>
```

### Multi-Dimension Pivot View

The enhanced pivot will support selecting which dimension appears on rows vs columns:

| Row \ Column | Jan 2025 | Feb 2025 | Mar 2025 |
|--------------|----------|----------|----------|
| Cash Area    | 5 docs   | 3 docs   | 7 docs   |
| AP Area      | 2 docs   | 4 docs   | 1 doc    |
| GL Area      | 8 docs   | 6 docs   | 9 docs   |

---

## Technical Implementation

### Filter State Update

```typescript
// Extended PivotFilters type
export interface PivotFilters {
  statusList: DocumentStatus[];
  selectedYear: string | null;
  selectedMonthPeriodIds: string[];  // Multi-select months
  areaId: string | null;
  objectId: string | null;
  pivotRowDimension?: 'period' | 'area' | 'object' | 'status';
  pivotColDimension?: 'period' | 'area' | 'object' | 'status';
}
```

### Query Modification

The `usePivotDocuments` hook will be updated to:
1. Accept array of period IDs instead of single ID
2. Use `.in('period_id', selectedMonthPeriodIds)` for filtering

---

## Summary Table

| Feature | Component | Status |
|---------|-----------|--------|
| Year/Month hierarchical picker | `HierarchicalDatePicker.tsx` | New |
| Multi-month selection | `PivotFilterBar.tsx` | Modify |
| Dimension selector | `DimensionSelector.tsx` | New |
| Process creation button | `UnifiedSidebar.tsx` | Modify |
| Per-feature dashboards | Already exist for Recons/Tasks | Add for Compliance/Close |

