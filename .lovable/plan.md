

# FileGRID Modular Platform: Phased Implementation Plan

## ✅ Phase 1 Complete - Module Navigation Foundation

**Implemented:**
- `ModuleContext` for shared entity/period/module state
- `AppLayout` with shared header and sidebar via `<Outlet />`
- `ModuleNav` with horizontal module tabs (Documents, PBC, Tasks, Recon)
- `SharedSidebar` with entity selector and context-aware folder tree
- Route-based module switching (`/`, `/pbc`, `/tasks`, `/reconciliations`)
- `DocumentsModule` with all pivot views migrated
- `PBCModule` elevated as standalone module with view toggle
- Placeholder pages for Tasks and Reconciliations

**Next:** Phase 2 - PBC Module Enhancement (dashboard, kanban, comments)

---

## Current State Analysis

```text
+------------------------------------------+
|  Current Architecture (Index.tsx)        |
+------------------------------------------+
|  Header                                  |
|  +-------------+-----------------------+ |
|  | Folder Tree |  ViewSelector dropdown| |
|  |             |  +-----------------+  | |
|  | Entity      |  | folder          |  | |
|  | Selector    |  | period-area-obj |  | |
|  |             |  | object-period   |  | |
|  | Dept→Proc   |  | area-period     |  | |
|  | →Area→Obj   |  | doc-type        |  | |
|  |             |  | status-final    |  | |
|  |             |  | whats-missing   |  | |
|  |             |  | pbc-requests    |  | |
|  |             |  +-----------------+  | |
|  +-------------+-----------------------+ |
+------------------------------------------+
```

**Issues with current approach:**
- PBC and "What's Missing" feel like afterthoughts in a dropdown
- Single route (`/`) handles everything with conditional rendering
- No URL-based navigation for direct linking to modules
- Module-specific actions mixed into general header area

---

## Target Architecture

```text
+-------------------------------------------------------------+
|  Future Architecture                                        |
+-------------------------------------------------------------+
|  Global Header  [FileGRID]  [Docs] [PBC] [Tasks] [Recon]   |
+-------------------------------------------------------------+
|  +-------------+------------------------------------------+ |
|  | Shared      |                                          | |
|  | Sidebar     |     Module-Specific Content Area         | |
|  |             |                                          | |
|  | Entity      |     - Own routes (/pbc, /tasks, /recon)  | |
|  | Selector    |     - Own view options                   | |
|  |             |     - Own action buttons                 | |
|  | Folder Tree |     - Own data hooks                     | |
|  | (filtered   |                                          | |
|  | per module) |                                          | |
|  +-------------+------------------------------------------+ |
+-------------------------------------------------------------+
```

---

## Phase 1: Module Navigation Foundation

**Goal:** Refactor navigation to support true module switching without losing the folder-based document browsing experience.

### 1.1 Create Shared Layout Component

| New File | Purpose |
|----------|---------|
| `src/components/layout/AppLayout.tsx` | Shared shell with header, sidebar, outlet |
| `src/components/layout/ModuleNav.tsx` | Horizontal module tabs in header |
| `src/components/layout/SharedSidebar.tsx` | Entity selector + context-aware folder tree |

**AppLayout structure:**
```text
<AppLayout>
  <Header>
    <Logo />
    <ModuleNav />  <!-- Documents | PBC | Tasks | Recon -->
    <UserMenu />
  </Header>
  <Sidebar>
    <EntitySelector />
    <FolderTree />  <!-- Filtered by module context -->
  </Sidebar>
  <Outlet />  <!-- Module-specific content -->
</AppLayout>
```

### 1.2 Establish Routes

| Route | Module | Component |
|-------|--------|-----------|
| `/` | Documents | `<DocumentsModule />` |
| `/pbc` | PBC Requests | `<PBCModule />` |
| `/tasks` | Tasks | `<TasksModule />` (Phase 2) |
| `/reconciliations` | Recon | `<ReconciliationsModule />` (Phase 3) |

### 1.3 Create Module Context

Shared context to hold:
- Selected entity
- Selected period (if applicable)
- Current module identifier

```text
ModuleContext
├── selectedEntity: Entity | null
├── selectedPeriod: Period | null  
├── activeModule: 'documents' | 'pbc' | 'tasks' | 'reconciliations'
└── setters for each
```

### 1.4 Migrate Documents Views

Move current pivot views into DocumentsModule:
- Folder View (default)
- By Period / By Object / By Area / By Doc Type
- Final Only
- What's Missing (remains as document analysis)

---

## Phase 2: Elevate PBC to Full Module

**Goal:** Transform PBC from a view into a standalone coordination module with its own dashboard, workflows, and tracking.

### 2.1 Create PBC Module Pages

| Component | Purpose |
|-----------|---------|
| `src/pages/PBC.tsx` | Module entry point |
| `src/components/pbc/PBCDashboard.tsx` | Overview with status cards, charts |
| `src/components/pbc/PBCListView.tsx` | Enhanced table (move from filegrid) |
| `src/components/pbc/PBCKanban.tsx` | Kanban board view by status |
| `src/components/pbc/PBCByAssignee.tsx` | Group by assignee |

### 2.2 PBC Dashboard Design

```text
+----------------------------------------------------------+
| PBC Module Header                         [+ New Request] |
+----------------------------------------------------------+
| Period: [Dec 2024 v]   Filter: [All Statuses v]          |
+----------------------------------------------------------+
|  Status Cards                                             |
|  +----------+ +----------+ +----------+ +----------+     |
|  | Requested| | Uploaded | | Reviewed | | Complete |     |
|  |    12    | |     8    | |     3    | |    15    |     |
|  +----------+ +----------+ +----------+ +----------+     |
+----------------------------------------------------------+
|  View Toggle: [List] [Kanban] [By Assignee]              |
+----------------------------------------------------------+
|  Main Content (list/kanban/grouped)                      |
+----------------------------------------------------------+
```

### 2.3 PBC-Specific Features

| Feature | Description |
|---------|-------------|
| Bulk status updates | Select multiple, update status |
| Assignee management | Assign/reassign team members |
| Due dates | Add optional due date per item |
| Comments thread | Discussion per PBC item |
| Email notifications | Notify assignee on status change |

### 2.4 Database Changes for PBC

```sql
-- Add columns to pbc_items
ALTER TABLE pbc_items ADD COLUMN due_date date;
ALTER TABLE pbc_items ADD COLUMN notes text;
ALTER TABLE pbc_items ADD COLUMN priority text DEFAULT 'normal';

-- Create pbc_comments table
CREATE TABLE pbc_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pbc_item_id uuid REFERENCES pbc_items(id) ON DELETE CASCADE,
  user_id uuid,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

---

## Phase 3: Tasks Module

**Goal:** Add task management with list and calendar views, linked to the structural hierarchy.

### 3.1 Data Model

```sql
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES entities(id) NOT NULL,
  title text NOT NULL,
  description text,
  
  -- Structural anchors (all optional for flexibility)
  department_id uuid REFERENCES departments(id),
  process_id uuid REFERENCES processes(id),
  area_id uuid REFERENCES areas(id),
  object_id uuid REFERENCES objects(id),
  period_id uuid REFERENCES periods(id),
  
  -- Linkage to other modules
  document_id uuid REFERENCES documents(id),
  pbc_item_id uuid REFERENCES pbc_items(id),
  reconciliation_id uuid REFERENCES reconciliations(id),  -- Phase 4
  
  -- Task properties
  assignee_id uuid,
  status text DEFAULT 'open',  -- open, in_progress, completed, cancelled
  priority text DEFAULT 'medium',  -- low, medium, high, urgent
  due_date date,
  completed_at timestamptz,
  
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tasks_entity ON tasks(entity_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

### 3.2 Task Module Views

| View | Description |
|------|-------------|
| My Tasks | Assigned to current user |
| All Tasks | Entity-wide task list |
| Calendar | Calendar grid with due dates |
| By Status | Kanban-style columns |
| By Priority | Grouped by priority level |

### 3.3 Task Module Components

| Component | Purpose |
|-----------|---------|
| `src/pages/Tasks.tsx` | Module entry |
| `src/components/tasks/TaskList.tsx` | Filterable list |
| `src/components/tasks/TaskCalendar.tsx` | Month/week calendar |
| `src/components/tasks/TaskCard.tsx` | Individual task card |
| `src/components/tasks/CreateTaskModal.tsx` | New task form |
| `src/components/tasks/TaskDetailPanel.tsx` | Side panel for task details |

### 3.4 Cross-Module Task Creation

Tasks can be created from:
- PBC items (auto-link)
- Documents (auto-link)
- Standalone (no link)
- Future: Reconciliations

---

## Phase 4: Reconciliations Module (Future)

**Goal:** BlackLine-light functionality using the same structural backbone.

### 4.1 Conceptual Mapping

| FileGRID Concept | Reconciliation Concept |
|------------------|------------------------|
| Entity | Company/Legal Entity |
| Department | Function (Accounting, Treasury) |
| Process | Reconciliation Category |
| Area | Account Group |
| Object | **Reconciliation Account** |
| Period | Reconciliation Period |
| Document | Supporting Evidence |

### 4.2 Data Model (High-Level)

```sql
CREATE TABLE reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES entities(id) NOT NULL,
  object_id uuid REFERENCES objects(id) NOT NULL,  -- The "account"
  period_id uuid REFERENCES periods(id) NOT NULL,
  
  -- Reconciliation data
  template_id uuid REFERENCES reconciliation_templates(id),
  preparer_id uuid,
  reviewer_id uuid,
  status text DEFAULT 'not_started',
  
  -- Balances
  gl_balance numeric,
  sub_balance numeric,
  variance numeric GENERATED ALWAYS AS (gl_balance - sub_balance) STORED,
  
  -- Certification
  certified_at timestamptz,
  certified_by uuid,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE reconciliation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_content jsonb,  -- Structure definition
  created_at timestamptz DEFAULT now()
);

CREATE TABLE reconciliation_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id uuid REFERENCES reconciliations(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id),  -- Link to FileGRID doc
  attachment_type text,  -- 'evidence', 'report', 'workpaper'
  created_at timestamptz DEFAULT now()
);
```

### 4.3 Reconciliation Workflow

```text
Not Started → In Progress → Pending Review → Approved → Certified
                    ↓              ↓
               Rejected ←──────────┘
```

---

## Implementation Timeline

| Phase | Scope | Estimated Effort |
|-------|-------|------------------|
| **Phase 1** | Navigation refactor, module routing | 2-3 sessions |
| **Phase 2** | PBC Module elevation | 2-3 sessions |
| **Phase 3** | Tasks Module (list + calendar) | 3-4 sessions |
| **Phase 4** | Reconciliations Module | 4-6 sessions |

---

## Technical Details

### Shared Components (used across modules)

| Component | Current Location | Shared Across |
|-----------|------------------|---------------|
| `EntitySelector` | filegrid/ | All modules |
| `FolderTree` | filegrid/ | Docs, PBC, Recon |
| `Header` | filegrid/ | → AppLayout |
| Period selectors | Various | All modules |

### New Hooks Structure

```text
src/hooks/
├── shared/
│   ├── useSelectedEntity.ts     (from context)
│   ├── useSelectedPeriod.ts     (from context)
│   └── useFolderStructure.ts    (existing)
├── documents/
│   ├── useDocuments.ts          (existing)
│   ├── usePivotDocuments.ts     (existing)
│   └── useApprovals.ts          (existing)
├── pbc/
│   ├── usePBCItems.ts           (existing)
│   ├── usePBCStats.ts           (new)
│   └── usePBCComments.ts        (new)
├── tasks/
│   ├── useTasks.ts              (new)
│   ├── useTasksByAssignee.ts    (new)
│   └── useTaskCalendar.ts       (new)
└── reconciliations/
    ├── useReconciliations.ts    (future)
    └── useReconciliationStatus.ts
```

### URL Structure

| URL | Module | View |
|-----|--------|------|
| `/` | Documents | Folder view |
| `/?view=by-period` | Documents | Period pivot |
| `/pbc` | PBC | Dashboard |
| `/pbc?view=kanban` | PBC | Kanban board |
| `/tasks` | Tasks | My Tasks |
| `/tasks/calendar` | Tasks | Calendar view |
| `/reconciliations` | Recon | Dashboard |
| `/reconciliations/:id` | Recon | Single recon detail |

---

## Success Metrics

After full implementation:

1. **Navigation clarity** - Users immediately understand they're in different "apps"
2. **Deep linking** - Share URLs to specific modules/views
3. **Consistent UX** - Shared sidebar, entity selection persists across modules
4. **Extensibility** - Adding new modules follows established patterns
5. **Performance** - Code splitting per module, lazy loading

---

## Recommended Starting Point

**Begin with Phase 1** (Navigation Foundation) to establish the architectural pattern, then immediately proceed with **Phase 2** (PBC Module) as it's already partially built and will demonstrate the module pattern clearly.

