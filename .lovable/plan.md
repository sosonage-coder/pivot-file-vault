
# Unified Navigation Plan: Integrated Folder Tree

## Overview

This plan consolidates all module navigation (Documents, PBC, Tasks, Reconciliations) into a single unified tree structure in the SharedSidebar. Instead of separate navigation panels for each module, everything lives within the same folder hierarchy.

## Current Problem

```text
Current Layout (with wasted space):
┌────────────────────────────────────────────────────────────────┐
│ Header: FileGRID  | Documents | PBC | Tasks | Recon           │
├─────────────┬──────────────┬──────────────────────────────────┤
│ SharedSidebar│ Module Tree  │  Workspace                      │
│ (Entity +   │ (PBC/Task    │                                  │
│  Empty      │  specific)   │                                  │
│  Space!)    │              │                                  │
└─────────────┴──────────────┴──────────────────────────────────┘
```

## Proposed Solution

```text
New Layout (integrated tree):
┌───────────────────────────────────────────────────────────────┐
│ Header: FileGRID                                              │
├──────────────────────────┬────────────────────────────────────┤
│ Unified Sidebar          │  Workspace Content                 │
│ ┌──────────────────────┐ │                                    │
│ │ [Entity Selector]    │ │                                    │
│ ├──────────────────────┤ │                                    │
│ │ ▼ Finance            │ │                                    │
│ │   ├─ 📂 Documents    │ │                                    │
│ │   │  ├─ Banking      │ │                                    │
│ │   │  └─ Payables     │ │                                    │
│ │   ├─ 📋 PBC Requests │ │                                    │
│ │   │  ├─ Item 1       │ │                                    │
│ │   │  └─ Item 2       │ │                                    │
│ │   ├─ ✓ Tasks         │ │                                    │
│ │   │  ├─ Task 1       │ │                                    │
│ │   │  └─ Task 2       │ │                                    │
│ │   └─ ⚖ Reconciliations│ │                                   │
│ │      ├─ Account 1    │ │                                    │
│ │      └─ Account 2    │ │                                    │
│ │ ▶ HR                 │ │                                    │
│ │ ▶ Legal              │ │                                    │
│ └──────────────────────┘ │                                    │
└──────────────────────────┴────────────────────────────────────┘
```

## Technical Approach

### Phase 1: Extend TreeNode Type

Add new node types to support module categories:

```typescript
// src/types/filegrid.ts
export interface TreeNode {
  id: string;
  name: string;
  type: 'entity' | 'department' | 'process' | 'area' | 'object' 
      | 'module-documents' | 'module-pbc' | 'module-tasks' | 'module-reconciliations';
  children?: TreeNode[];
  documentCount?: number;
  metadata?: Record<string, unknown>;
}
```

### Phase 2: Create Unified Folder Structure Hook

Create `useUnifiedFolderStructure.ts` that builds the complete tree:

```text
Department
├─ Documents (module node)
│  ├─ Process → Area → Object (existing structure)
├─ PBC Requests (module node)
│  ├─ PBC Items grouped by process/area
├─ Tasks (module node)
│  ├─ Tasks grouped by process/area
└─ Reconciliations (module node)
   └─ Accounts grouped by process/area
```

### Phase 3: Enhanced FolderTree Component

Update `FolderTree.tsx` to:
- Render different icons for module categories
- Handle selection of different node types
- Route clicks to appropriate workspace views

### Phase 4: Unified Workspace Rendering

Update `AppLayout.tsx` or create a `UnifiedWorkspace.tsx` that:
- Detects the selected node type
- Renders appropriate content (document list, PBC detail, task detail, reconciliation workspace)
- Maintains consistent workspace layout regardless of content type

### Phase 5: Remove Module-Specific Routes

Simplify routing by removing separate `/pbc`, `/tasks`, `/reconciliations` routes. Instead:
- Single route `/` handles all content
- Workspace content is determined by selected tree node
- Top header bar simplified (no more module tabs)

### Phase 6: Remove Redundant Components

Clean up unused:
- `ModuleNav.tsx` (module tabs in header)
- Separate tree components (`PBCTree.tsx`, `TaskTree.tsx`, `ReconciliationTree.tsx`)
- Module-specific page layouts

## Files to Modify

| File | Change |
|------|--------|
| `src/types/filegrid.ts` | Add module node types |
| `src/hooks/useFolderStructure.ts` | Rename to `useUnifiedFolderStructure.ts`, add PBC/Task/Recon data |
| `src/components/filegrid/FolderTree.tsx` | Add module icons, handle new node types |
| `src/components/layout/SharedSidebar.tsx` | Always show full tree (remove module check) |
| `src/components/layout/AppLayout.tsx` | Add unified workspace rendering |
| `src/components/layout/ModuleNav.tsx` | Remove or repurpose |
| `src/App.tsx` | Simplify routes |
| `src/contexts/ModuleContext.tsx` | Remove activeModule tracking |
| `src/pages/Documents.tsx` | Convert to workspace component |
| `src/pages/PBC.tsx` | Remove (content moves to workspace) |
| `src/pages/Tasks.tsx` | Remove (content moves to workspace) |
| `src/pages/Reconciliations.tsx` | Remove (content moves to workspace) |

## New Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useUnifiedFolderStructure.ts` | Combined tree with all module data |
| `src/components/layout/UnifiedWorkspace.tsx` | Renders appropriate content based on selection |

## User Experience Changes

| Before | After |
|--------|-------|
| Click module tab to switch context | Click module category in tree to expand |
| Separate navigation trees per module | Single unified tree |
| Empty sidebar space when not on Documents | Full tree always visible |
| Must navigate to PBC page to see requests | PBC items visible under each department |

## Implementation Order

1. Extend type definitions
2. Create unified folder structure hook
3. Update FolderTree component
4. Create UnifiedWorkspace component
5. Update AppLayout and routing
6. Remove deprecated components
7. Test all workflows
