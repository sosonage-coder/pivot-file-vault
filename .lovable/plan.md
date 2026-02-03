

# Unified Sidebar + PBC Flattening Plan

## Summary

This plan addresses three issues:
1. Merge the folder tree and feature navigation into a **single sidebar** (eliminate the split-panel layout)
2. **Flatten PBC tree** to show Areas directly (skip Process level like "Monthly Close")
3. Ensure **Checklist views** (List, Kanban, Calendar) are accessible without confusion

---

## Current Architecture Problem

```text
Current Layout (Too Much):
+--------+------------+----------------------+
| Main   | Folder     |                      |
| Side   | Tree       |  Content Area        |
| bar    | (240px)    |                      |
| (60px) |            |                      |
+--------+------------+----------------------+
```

**Proposed Layout (Single Sidebar):**
```text
+------------------------+--------------------+
| Unified Sidebar        |                    |
| - Entity/Period        |                    |
| - Feature Tabs         |   Content Area     |
| - Folder Tree          |                    |
| (280px, collapsible)   |                    |
+------------------------+--------------------+
```

---

## Changes Overview

### 1. Unified Sidebar Architecture

Replace the current two-panel approach with a **context-aware single sidebar**:

- **Header Section**: Logo, Entity selector, Period selector (compact)
- **Feature Navigation**: Horizontal tabs or compact vertical list showing active feature
- **Context Panel**: Folder tree OR feature-specific content depending on active feature

| Feature | Sidebar Content |
|---------|-----------------|
| Close Calendar | Checklist list (cards) |
| Reconciliations | Reconciliation tree |
| Documents | Folder tree (Process → Area → Object) |
| PBC Requests | Folder tree (Areas → Objects only) |
| Checklists | Checklist list |
| Meetings | (placeholder) |

### 2. PBC Tree Flattening

Modify `useFeatureFolderStructure` hook to **skip the Process level** for PBC:

**Before:**
```text
Monthly Close (Process)
  └─ Banking (Area)
      └─ Chase Operating (Object)
```

**After:**
```text
Banking (Area)
  └─ Chase Operating (Object)
Fixed Assets (Area)
  └─ Depreciation (Object)
```

This is done by changing the tree building logic to return Area nodes at the root level for PBC feature type.

### 3. Checklist Views Visibility

The Kanban/Calendar views already exist in `ChecklistDetailView`. The confusion is:
- `ChecklistWorkspace` shows a grid of checklist cards
- You must click a card to enter `ChecklistDetailView` which has the view tabs

To make this clearer, we'll:
- Add a visual hint on cards ("Click to view List/Kanban/Calendar")
- Consider showing a "quick preview" of the selected checklist in the sidebar

---

## Files to Create

1. **`src/components/layout/UnifiedSidebar.tsx`** - New single sidebar with context-aware content

## Files to Modify

1. **`src/components/layout/AppLayout.tsx`** - Use UnifiedSidebar instead of split layout
2. **`src/hooks/useFeatureFolderStructure.ts`** - Flatten tree for PBC (Areas at root)
3. **`src/pages/DocumentsPage.tsx`** - Remove split layout, use single-panel content
4. **`src/pages/PBCRequestsPage.tsx`** - Remove split layout, use single-panel content
5. **`src/components/checklists/ChecklistWorkspace.tsx`** - Add visual hints for view discovery

## Files to Remove

1. **`src/components/layout/FeatureSplitLayout.tsx`** - No longer needed

---

## Technical Details

### UnifiedSidebar Structure

```text
+----------------------------+
| [Logo] FileGRID      [<>]  |  <- Collapse toggle
+----------------------------+
| Entity: Acme Corp     [v]  |  <- Dropdown
| Period: Dec 2024      [v]  |
+----------------------------+
| [Close] [Recon] [Docs]     |  <- Feature tabs (horizontal)
| [PBC] [Lists] [Meet]       |
+----------------------------+
|                            |
|  Context Content:          |
|  - Folder tree for Docs    |
|  - Folder tree for PBC     |
|  - Checklist cards         |
|  - Recon tree              |
|                            |
+----------------------------+
| [Settings] [Sign out]      |
+----------------------------+
```

### PBC Flattening Logic

In `useFeatureFolderStructure.ts`, for PBC feature type:

```typescript
// Instead of: Process → Area → Object
// Return: Area → Object (skip Process level)

if (featureType === 'pbc') {
  // Return area nodes directly as root level
  return areaNodes; // Not wrapped in processNodes
}
```

### Documents Page (Without Split)

```typescript
// DocumentsPage.tsx - simplified
export function DocumentsPage() {
  // Content area shows documents based on selected node from sidebar
  return (
    <FeatureLayout title="Documents">
      <DocumentList
        areaId={selectedNode?.type === 'area' ? selectedNode.id : null}
        objectId={selectedNode?.type === 'object' ? selectedNode.id : null}
      />
    </FeatureLayout>
  );
}
```

The folder tree selection now comes from UnifiedSidebar context, not an internal split panel.

---

## User Experience Improvements

1. **Single sidebar** reduces cognitive load - one navigation panel to understand
2. **Feature tabs** at top of sidebar provide quick switching (like Slack channels)
3. **PBC flattening** reduces one click to reach Areas
4. **Checklist views** remain unchanged but with clearer visual cues

---

## Implementation Order

1. Create `UnifiedSidebar` component with feature tabs + context panel
2. Update `AppLayout` to use UnifiedSidebar
3. Modify `useFeatureFolderStructure` to flatten PBC tree
4. Update feature pages (Documents, PBC) to use sidebar selection context
5. Remove `FeatureSplitLayout`
6. Add visual hints to checklist cards

