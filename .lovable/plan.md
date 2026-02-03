
# Sidebar Optimization, Multi-Entity Consolidation, Dashboards, and New Window UX

## Summary of Issues

Based on exploration of the codebase, I've identified these key concerns:

1. **Sidebar Crowding**: The sidebar (280px) contains feature tabs + entity selector + search + add process button + folder tree, which becomes cramped with deep hierarchies
2. **Multi-Entity Companies**: No current support for consolidated views (e.g., viewing BS reconciliations across all subsidiaries)
3. **Missing Dashboards**: Dashboards exist in code (`ReconciliationDashboard`, `TaskDashboard`) but aren't consistently rendering - they show when nothing is selected, but users aren't seeing them
4. **Month Close Info**: Not appearing because the `CloseCalendarPage` shows `ChecklistWorkspace` which displays checklists, not the folder tree + calendar integration expected
5. **New Window Support**: Currently absent - power users need side-by-side comparison

---

## Solution Architecture

### 1. Sidebar Space Optimization

**Current Problem**: Too many elements competing for 280px width

**Solution**: Collapsible sections + reduced visual density

```text
BEFORE (280px, cluttered):
+---------------------------+
| [Logo]         FileGRID   |
+---------------------------+
| Entity: [Acme Corp ▾]     |
+---------------------------+
| [Close][Recons][Docs]     |   <- 3x3 grid of 7 features
| [PBC] [Comply][Lists]     |
| [Meet]                    |
+---------------------------+
| [Search...]               |
| [+ Add Process]           |
+---------------------------+
| ▼ Monthly Close           |
|   ▼ General Ledger        |
|     📄 Cash               |
+---------------------------+

AFTER (280px, streamlined):
+---------------------------+
| [Logo] FileGRID  [Entity▾]|  <- Entity moved to header row
+---------------------------+
| [🕐Close][⚖Recons][📄Docs]|   <- Icon-only tabs (tooltips)
| [📋PBC] [🛡Comply][✓Lists]|
+---------------------------+
| [🔍] [+]                   |  <- Search + Add collapsed to icons
+---------------------------+
| ▼ Monthly Close            |
|   ▼ General Ledger         |
|     📄 Cash                 |
+---------------------------+
```

**Key Changes**:
- Move Entity selector to header row (compact inline)
- Feature tabs become icon-only with tooltips
- Search/Add buttons become icon-only
- More vertical space for tree content

---

### 2. Multi-Entity Consolidated Views

**Business Need**: Controller of a holding company needs to see all subsidiary Balance Sheet reconciliations in one view

**Database Schema Enhancement**:
```sql
-- Add parent_entity_id to support entity hierarchy
ALTER TABLE entities 
ADD COLUMN parent_entity_id UUID REFERENCES entities(id);

-- Add entity_type to distinguish legal entities vs consolidation groups
ALTER TABLE entities 
ADD COLUMN entity_type TEXT DEFAULT 'legal' 
CHECK (entity_type IN ('legal', 'consolidation_group'));
```

**New Entity Selector Behavior**:
```text
+--------------------------------+
| Entity:                         |
| ● All Entities (Consolidated)  |  <- NEW: Shows aggregated data
| ○ Acme Corp                     |
| ○ Acme UK Ltd                   |
| ○ Acme Asia Pte                 |
+--------------------------------+
```

**Consolidated Dashboard View**:
When "All Entities" is selected, dashboards aggregate:
- Total variances across all entities
- Reconciliation completion by entity
- Cross-entity comparison tables

**Implementation**:
1. Add "All Entities" option to `EntitySelector`
2. Modify `useReconciliationDashboard` to support `entityId: null | 'all'`
3. Add entity breakdown columns in dashboard cards
4. Queries use `.in('entity_id', entityIds)` instead of `.eq('entity_id', entityId)`

---

### 3. Dashboard Visibility Fix

**Current Issue**: Dashboards render inside workspace components when `reconciliationId` is null, but:
- Users don't see them because sidebar selection behavior jumps to first item
- No explicit "Dashboard" navigation option

**Solution**: Explicit Dashboard Toggle

```text
Workspace Header:
+---------------------------------------------------------------+
| Reconciliations | Acme Corp                                    |
|---------------------------------------------------------------|
| [📊 Dashboard] [📋 List] [📦 Kanban]    [Year: 2025▾] [...]   |
+---------------------------------------------------------------+
```

When "Dashboard" view is selected:
- Show `ReconciliationDashboard` regardless of sidebar selection
- Clicking an item in the dashboard switches to List/Detail view

**Implementation**:
1. Add `viewMode: 'dashboard' | 'list' | 'detail'` state to each workspace
2. Add view toggle buttons to `WorkspaceFilterBar` or `FeatureLayout` actions
3. Dashboard becomes the default view when entering a feature

---

### 4. Month Close Calendar Integration

**Current Problem**: `CloseCalendarPage` renders `ChecklistWorkspace` which shows a list of checklists, not the expected close calendar view

**Solution**: Hybrid Month Close Workspace

The Month Close feature should combine:
1. **Close Schedule Calendar** - Task calendar view with relative day mapping (existing `TaskCalendarView`)
2. **Closing Documents Tree** - Folder tree filtered for closing processes
3. **Progress Dashboard** - Close completion metrics

```text
Month Close Workspace:
+---------------------------------------------------------------+
| Close Calendar | Acme Corp | Jan 2025                         |
|---------------------------------------------------------------|
| [📊 Dashboard] [📅 Calendar] [📋 Tasks] [📁 Documents]        |
+---------------------------------------------------------------+
|                                                                |
|  [Dashboard Tab]:                                              |
|    Close Progress: 45% complete                                |
|    Days Remaining: 3                                           |
|    Blocked Tasks: 2                                            |
|                                                                |
|  [Calendar Tab]:                                               |
|    |Mon|Tue|Wed|Thu|Fri|                                      |
|    |T1 |T2 |T3 |T4 |   |  <- Tasks mapped to close days       |
|                                                                |
|  [Tasks Tab]:                                                  |
|    ☐ Day 1: Trial Balance upload                              |
|    ☐ Day 2: Bank Reconciliations                              |
|    ☑ Day 3: AP Accruals                                       |
|                                                                |
|  [Documents Tab]:                                              |
|    Monthly Close folder tree                                   |
+---------------------------------------------------------------+
```

**Implementation**:
1. Create `MonthCloseWorkspace.tsx` combining:
   - Close schedule checklist (from `ChecklistWorkspace`)
   - Calendar view (from `TaskCalendarView`)
   - Documents view (using `UnifiedFolderTree` with `monthclose` filter)
   - Dashboard summary
2. Add tab navigation within the workspace
3. Wire up the `CloseCalendarPage` to use this new component

---

### 5. Open in New Tab/Window Support

**Use Case**: Compare reconciliations side-by-side, or keep dashboard open while reviewing individual items

**Implementation**:

**A) URL-Based Routing**:
Routes already support IDs, but need to add:
```typescript
// Current: /reconciliations
// Enhanced: /reconciliations/:reconciliationId

// Example routes:
/reconciliations                    <- Dashboard/list view
/reconciliations/abc123            <- Specific reconciliation
/reconciliations?entity=x&period=y <- Filtered view
```

**B) Context Menu on Sidebar Items**:
```typescript
// Right-click on sidebar tree item
<ContextMenu>
  <ContextMenuItem onClick={() => openInNewTab(node)}>
    <ExternalLink className="mr-2 h-4 w-4" />
    Open in New Tab
  </ContextMenuItem>
</ContextMenu>
```

**C) Cmd/Ctrl+Click Support**:
```typescript
const handleNodeClick = (e: React.MouseEvent, node: TreeNode) => {
  if (e.metaKey || e.ctrlKey) {
    // Open in new tab
    window.open(`/reconciliations/${node.id}`, '_blank');
  } else {
    // Normal selection
    onSelect(node);
  }
};
```

**D) New Window for Detail Views**:
For heavy workspaces like individual reconciliation detail:
```typescript
// Button in detail header
<Button variant="outline" size="sm" onClick={() => openInNewWindow()}>
  <ExternalLink className="h-4 w-4 mr-2" />
  Pop Out
</Button>
```

---

## Implementation Files

| Change | File(s) | Description |
|--------|---------|-------------|
| Sidebar optimization | `UnifiedSidebar.tsx` | Compact entity selector, icon-only tabs |
| Entity hierarchy | Database migration | Add `parent_entity_id` column |
| Consolidated selector | `EntitySelector.tsx` | Add "All Entities" option |
| Dashboard queries | `useReconciliationDashboard.ts` | Support multi-entity aggregation |
| View mode toggle | `WorkspaceFilterBar.tsx` | Add Dashboard/List/Kanban toggles |
| Dashboard visibility | `ReconciliationWorkspace.tsx` | Default to dashboard, explicit toggle |
| Month Close workspace | `MonthCloseWorkspace.tsx` (New) | Combined calendar + tasks + docs |
| Close calendar page | `CloseCalendarPage.tsx` | Use new workspace |
| New tab support | `UnifiedFolderTree.tsx` | Cmd+Click handler |
| Context menu | `UnifiedFolderTree.tsx` | "Open in New Tab" option |
| Route params | `App.tsx` | Add `:id` params to feature routes |
| Detail pop-out | `ReconciliationWorkspace.tsx` | Pop-out button in header |

---

## Technical Details

### Sidebar Compaction Code

```typescript
// UnifiedSidebar.tsx - Compact header with inline entity
<div className="flex h-12 items-center justify-between border-b px-3">
  <div className="flex items-center gap-2">
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
      <span className="text-xs font-bold text-primary-foreground">F</span>
    </div>
    {!collapsed && <span className="font-semibold">FileGRID</span>}
  </div>
  
  {/* Compact entity selector inline */}
  {!collapsed && (
    <Select value={selectedEntity?.id} onValueChange={...}>
      <SelectTrigger className="h-7 w-28 text-xs border-0 bg-muted">
        <SelectValue />
      </SelectTrigger>
    </Select>
  )}
</div>
```

### Consolidated Entity Query

```typescript
// When "All Entities" selected
const { data } = useReconciliationDashboard(
  entityId === 'all' ? null : entityId,
  periodId,
  { consolidated: entityId === 'all' }
);

// In hook:
let query = supabase.from('reconciliations').select('*');
if (entityId) {
  query = query.eq('entity_id', entityId);
} else if (consolidated) {
  // Get all accessible entities
  const entityIds = await getAccessibleEntityIds();
  query = query.in('entity_id', entityIds);
}
```

### View Mode State

```typescript
// Add to WorkspaceFilterBar or workspace component
type ViewMode = 'dashboard' | 'list' | 'kanban' | 'calendar';

const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

// Render based on mode
{viewMode === 'dashboard' && <ReconciliationDashboard />}
{viewMode === 'list' && <ReconciliationListView />}
```

---

## Priority Order

1. **Fix Dashboard Visibility** (Quick win - add view toggle)
2. **Sidebar Optimization** (Visual improvement)
3. **Month Close Integration** (Core feature fix)
4. **New Tab Support** (Power user feature)
5. **Multi-Entity Consolidation** (Schema change + UI updates)

---

## Summary

This plan addresses the practical UX concerns for multi-entity companies while maintaining the existing feature architecture. The sidebar becomes more compact, dashboards become explicitly accessible, Month Close shows integrated calendar/task/document views, and power users can open items in new tabs for comparison workflows.
