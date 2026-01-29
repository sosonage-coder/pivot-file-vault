
# Formal PBC Tree Model Implementation

## Overview

This plan transforms the current flat PBC list structure into a hierarchical tree model that reflects how auditors actually think about evidence requests. The new model supports variable depth (3-6 levels) with typed nodes (Area, Dimension, Object, Request) and enforces structural rules at the application layer.

## Current State Analysis

```text
Current Implementation:
┌────────────────────────────────────────┐
│ pbc_items (flat table)                 │
│ - entity_id, period_id                 │
│ - process_id, area_id, object_id       │
│ - document_type_id, status             │
│ - assignee_id, due_date, notes         │
└────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ UI: Simple list grouped by Area        │
│ - No intermediate dimensions           │
│ - Fixed depth (Area → Request)         │
│ - Flat request structure               │
└────────────────────────────────────────┘
```

## Target Architecture

```text
New Tree Model:
┌─────────────────────────────────────────────────────────────────┐
│ pbc_templates                                                   │
│ - name, min_depth, max_depth                                    │
│ - area_type (Fixed Assets, Cash, Revenue, etc.)                 │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ pbc_nodes (self-referential tree)                               │
│ - entity_id, period_id, pbc_template_id                         │
│ - parent_id (FK to self)                                        │
│ - node_type: 'area' | 'dimension' | 'object' | 'request'        │
│ - label, sort_order                                             │
│ - area_id (optional anchor to FileGRID areas)                   │
│ - object_id (optional anchor to FileGRID objects)               │
│                                                                 │
│ Request-only fields:                                            │
│ - status, assignee_id, due_date, priority, notes                │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ UI: Interactive collapsible tree                                │
│ - Variable depth per area type                                  │
│ - Dimension nodes for slicing (Movement Type, Institution)      │
│ - Completion rolls up from leaves to branches                   │
│ - Context-aware views for auditors vs clients                   │
└─────────────────────────────────────────────────────────────────┘
```

## Example Tree Structures

### Fixed Assets (3-4 levels)
```text
[Area] Fixed Assets
├── [Dimension] Additions
│   ├── [Request] Additions Listing
│   └── [Request] Supporting Invoices
└── [Dimension] Disposals
    ├── [Request] Disposals Listing
    └── [Request] Gain/Loss Calculation
```

### Cash (5 levels)
```text
[Area] Cash
└── [Dimension] Bank
    └── [Object] Bank of America
        └── [Object] Operating Account
            ├── [Request] Bank Statements
            └── [Request] Bank Reconciliation
```

### Revenue (6 levels)
```text
[Area] Revenue
└── [Dimension] Revenue Stream
    └── [Object] Subscription Revenue
        └── [Dimension] Risk Area
            └── [Dimension] Cut-off Testing
                └── [Request] Sample Invoices
```

---

## Technical Implementation

### Phase 1: Database Schema

Create new tables with proper RLS policies:

**Table: `pbc_templates`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Template name (e.g., "Fixed Assets", "Cash") |
| area_type | text | Maps to FileGRID areas |
| min_depth | int | Minimum tree depth (default: 2) |
| max_depth | int | Maximum tree depth (default: 6) |
| allowed_sequences | jsonb | Valid node type paths |
| description | text | Optional guidance |
| created_at | timestamptz | Timestamp |

**Table: `pbc_nodes`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| entity_id | uuid | FK to entities |
| period_id | uuid | FK to periods |
| pbc_template_id | uuid | FK to pbc_templates (nullable) |
| parent_id | uuid | Self-reference (nullable for roots) |
| node_type | enum | 'area', 'dimension', 'object', 'request' |
| label | text | Display name |
| sort_order | int | Ordering within siblings |
| area_id | uuid | FK to areas (optional anchor) |
| object_id | uuid | FK to objects (optional anchor) |
| status | enum | Request status (only for request nodes) |
| assignee_id | uuid | FK to auth.users (only for requests) |
| due_date | date | Due date (only for requests) |
| priority | text | Priority level (only for requests) |
| notes | text | Notes/description |
| created_at | timestamptz | Timestamp |
| updated_at | timestamptz | Timestamp |

**Enum: `pbc_node_type`**
```sql
CREATE TYPE pbc_node_type AS ENUM ('area', 'dimension', 'object', 'request');
```

### Phase 2: Data Migration Strategy

Migrate existing `pbc_items` to `pbc_nodes`:
1. Each existing item becomes a 2-level tree: Area Node → Request Node
2. Preserve all status, assignee, due_date, notes data
3. Keep `pbc_items` table temporarily for backward compatibility
4. Comments table (`pbc_comments`) can be updated to reference `pbc_nodes`

### Phase 3: New Hooks and Types

**Types (`src/types/pbc-tree.ts`)**
```typescript
export type PbcNodeType = 'area' | 'dimension' | 'object' | 'request';

export interface PbcNode {
  id: string;
  entity_id: string;
  period_id: string;
  pbc_template_id: string | null;
  parent_id: string | null;
  node_type: PbcNodeType;
  label: string;
  sort_order: number;
  area_id: string | null;
  object_id: string | null;
  status: PbcStatus | null;
  assignee_id: string | null;
  due_date: string | null;
  priority: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PbcTemplate {
  id: string;
  name: string;
  area_type: string;
  min_depth: number;
  max_depth: number;
  description: string | null;
}

// Tree node for UI rendering
export interface PbcTreeNode extends PbcNode {
  children: PbcTreeNode[];
  depth: number;
  completion: {
    total: number;
    complete: number;
    percentage: number;
  };
}
```

**Hook: `usePbcTree.ts`**
- Fetch all nodes for entity/period
- Build tree structure from flat data
- Calculate completion rollups
- Support CRUD operations on nodes

**Hook: `usePbcTemplates.ts`**
- Fetch available templates
- Validation helpers for depth/sequence rules

### Phase 4: UI Components

**New Components:**

| Component | Purpose |
|-----------|---------|
| `PbcTreeView.tsx` | Main collapsible tree rendering |
| `PbcNodeItem.tsx` | Individual node with type-specific icons |
| `CreatePbcNodeModal.tsx` | Add nodes at any level |
| `PbcRequestDetail.tsx` | Detailed view for request (leaf) nodes |
| `PbcTreeHeader.tsx` | Tree-level actions (expand all, collapse all, filter) |
| `PbcCompletionBadge.tsx` | Shows rollup completion percentage |

**Tree Node Icons by Type:**
| Node Type | Icon | Color |
|-----------|------|-------|
| Area | `Briefcase` | Amber |
| Dimension | `GitBranch` | Blue |
| Object | `FileBox` | Purple |
| Request | `ClipboardCheck` | Green/Status-based |

### Phase 5: Integration with Unified Folder Tree

Update `useUnifiedFolderStructure.ts` to:
1. Fetch `pbc_nodes` instead of `pbc_items`
2. Build nested tree for PBC module section
3. Show completion rollups at each level
4. Support expanding into the full tree from sidebar

### Phase 6: Template Management (Admin)

Create admin UI for:
1. Defining new templates (area types)
2. Setting depth constraints
3. Defining allowed node sequences
4. Pre-populating standard trees (Fixed Assets, Cash, Revenue, etc.)

---

## Files to Create

| File | Description |
|------|-------------|
| `src/types/pbc-tree.ts` | TypeScript types for PBC tree model |
| `src/hooks/usePbcTree.ts` | Data fetching and tree operations |
| `src/hooks/usePbcTemplates.ts` | Template management |
| `src/components/pbc/PbcTreeView.tsx` | Main tree component |
| `src/components/pbc/PbcNodeItem.tsx` | Individual tree node |
| `src/components/pbc/CreatePbcNodeModal.tsx` | Node creation modal |
| `src/components/pbc/PbcRequestDetail.tsx` | Request detail panel |
| `src/components/pbc/PbcCompletionBadge.tsx` | Completion indicator |

## Files to Modify

| File | Change |
|------|--------|
| `src/types/filegrid.ts` | Add pbc-tree node types |
| `src/hooks/useUnifiedFolderStructure.ts` | Integrate PBC tree data |
| `src/components/filegrid/UnifiedFolderTree.tsx` | Handle nested PBC nodes |
| `src/components/layout/UnifiedWorkspace.tsx` | Render PBC tree workspace |
| `src/components/pbc/PBCWorkspace.tsx` | Update for tree model |

## Database Migration

```sql
-- Create enum for node types
CREATE TYPE pbc_node_type AS ENUM ('area', 'dimension', 'object', 'request');

-- Create templates table
CREATE TABLE public.pbc_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area_type text,
  min_depth integer NOT NULL DEFAULT 2,
  max_depth integer NOT NULL DEFAULT 6,
  allowed_sequences jsonb DEFAULT '[]',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create nodes table
CREATE TABLE public.pbc_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  pbc_template_id uuid REFERENCES pbc_templates(id),
  parent_id uuid REFERENCES pbc_nodes(id) ON DELETE CASCADE,
  node_type pbc_node_type NOT NULL,
  label text NOT NULL,
  sort_order integer DEFAULT 0,
  area_id uuid REFERENCES areas(id),
  object_id uuid REFERENCES objects(id),
  status pbc_status,
  assignee_id uuid REFERENCES auth.users(id),
  due_date date,
  priority text DEFAULT 'normal',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraint: only request nodes can have status
  CONSTRAINT request_only_status CHECK (
    node_type = 'request' OR status IS NULL
  ),
  -- Constraint: only area nodes can be roots
  CONSTRAINT area_is_root CHECK (
    parent_id IS NOT NULL OR node_type = 'area'
  )
);

-- Enable RLS
ALTER TABLE public.pbc_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pbc_nodes ENABLE ROW LEVEL SECURITY;

-- RLS policies (similar to existing patterns)
```

---

## Implementation Order

1. **Database First**: Create migration with new tables and RLS
2. **Types**: Define TypeScript interfaces
3. **Hooks**: Build data layer (usePbcTree, usePbcTemplates)
4. **Core UI**: PbcTreeView, PbcNodeItem components
5. **CRUD Modals**: CreatePbcNodeModal, update existing modals
6. **Integration**: Update UnifiedFolderStructure and workspace
7. **Migration Script**: Move existing pbc_items to pbc_nodes
8. **Testing**: Verify tree operations and completion rollups
9. **Cleanup**: Remove deprecated flat-list components

## User Experience Benefits

| Before (Flat List) | After (Tree Model) |
|-------------------|-------------------|
| "Did you upload this?" | "Did we prove this area?" |
| Fixed 2-level structure | Variable 3-6 level depth |
| No intermediate context | Dimension nodes for slicing |
| Manual completion tracking | Automatic rollup from leaves |
| One-size-fits-all | Area-specific templates |
