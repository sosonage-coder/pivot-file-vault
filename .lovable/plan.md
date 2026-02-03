

# Fix Reconciliation Tree in Sidebar + New Tab UX Analysis

## Problem Summary

You're right - we already built the `ReconciliationTree` component (with Category → Area → Account hierarchy), but it's **NOT connected to the UnifiedSidebar**. Currently:

- Sidebar only shows trees for Documents and PBC (line 139 of UnifiedSidebar)
- ReconciliationsPage always shows dashboard (passes `null` as reconciliationId)
- The tree exists but is orphaned

---

## Fix 1: Add Reconciliation Tree to Sidebar

### Changes to UnifiedSidebar.tsx

Current code:
```typescript
const showFolderTree = activeFeature === 'documents' || activeFeature === 'pbc';
```

Needs to become:
```typescript
const showFolderTree = activeFeature === 'documents' || activeFeature === 'pbc' || activeFeature === 'reconciliations';
```

But the reconciliation tree has a **different structure** (it groups by account category, not by Process → Area), so we need to:

1. Add the reconciliation feature type to `useFeatureFolderStructure` hook, OR
2. Use the existing `useReconciliationTree` hook directly in the sidebar

The cleaner approach is option 2 - conditionally render `ReconciliationTree` when on the reconciliations feature.

### Changes to ReconciliationsPage.tsx

Currently:
```typescript
<ReconciliationWorkspace
  reconciliationId={null}
  entityId={selectedEntity.id}
  ...
/>
```

Needs to consume `selectedNode` from `useSidebarSelection()` context to pass the selected reconciliation ID.

---

## Fix 2: New Tab UX Analysis

Opening features in new browser tabs could help in specific scenarios:

| Feature | Open in New Tab? | Reasoning |
|---------|------------------|-----------|
| Reconciliations | Yes (optional) | Users often compare reconciliations side-by-side |
| Documents | No | Standard navigation is fine |
| PBC Requests | Yes (optional) | Auditors may want to view request in one tab while uploading in another |
| Compliance | No | Calendar view is contextual |
| Checklists | Maybe | Power users might want checklist + recon open together |
| Meetings | No | Single context |

### Implementation Options

**Option A: Ctrl/Cmd+Click to open in new tab**
- Standard web behavior
- No UI changes needed
- Works with React Router via `<a href>` instead of `navigate()`

**Option B: Explicit "Open in New Tab" button**
- Add a small icon button next to selected items
- More discoverable but adds visual clutter

**Option C: Right-click context menu**
- "Open in New Tab" as a menu option
- Familiar pattern from IDEs

**Recommended: Option A + C**
- Support Ctrl/Cmd+Click on tree items (standard web pattern)
- Add right-click context menu for power users

---

## Technical Implementation

### Files to Modify

1. **`src/components/layout/UnifiedSidebar.tsx`**
   - Add reconciliations to features that show sidebar content
   - Import and render `ReconciliationTree` when `activeFeature === 'reconciliations'`
   - Fetch reconciliations data using existing hooks

2. **`src/pages/ReconciliationsPage.tsx`**
   - Use `useSidebarSelection()` to get selected node
   - Extract reconciliation ID from selected tree node
   - Pass to `ReconciliationWorkspace`

3. **`src/components/reconciliations/ReconciliationTree.tsx`** (optional enhancement)
   - Add support for Ctrl/Cmd+Click to open in new tab
   - Add right-click context menu with "Open in New Tab" option

4. **`src/hooks/useReconciliationTree.ts`**
   - May need to fetch reconciliations if not already available

---

## Summary

| Issue | Fix |
|-------|-----|
| Recon tree not showing | Add reconciliations to sidebar tree rendering logic |
| Can't select individual recons | Wire up `useSidebarSelection` in ReconciliationsPage |
| New tab UX | Implement Ctrl+Click and right-click context menu |

