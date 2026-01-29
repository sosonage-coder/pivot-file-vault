

# FileGRID v1 — Remaining Features Implementation Plan

## Current State Summary
The foundation is complete with authentication, folder tree navigation, and basic document list display. The database has all required tables with seed data including:
- 5 departments (Finance, Legal, HR, Marketing, Operations)
- 5 process templates with 13 area templates
- 10 document types
- 12 months of periods (2025)
- Area-document type mappings for "What's Missing" logic

---

## Sprint 2: Core Workflows

### 2.1 Upload Modal with Naming Engine

**New Component: `UploadDocumentModal.tsx`**

A dialog that opens when user clicks "Add Document" button (shown when viewing an Area):

| Field | Behavior |
|-------|----------|
| Entity/Dept/Process/Area | Auto-filled from current location (read-only) |
| Object | Searchable dropdown with "Create new" option |
| Period | Dropdown of available periods (most recent first) |
| Document Type | Filtered to allowed types for this Area |
| Status | Radio: Draft or Final |
| External URL | Text input for SharePoint/Drive link |
| Notes | Optional textarea |

**Naming Engine Logic:**
- On submit, generate `logical_name` = `{ObjectName}_{DocumentType}`
- Display preview of rendered filename: `{Object}_{DocType}_{Period}_{Status}`
- If `logical_name` + `period_id` already exists, system auto-increments version

**Technical Implementation:**
- New hook: `useObjects.ts` - fetch/create Objects for an area
- New hook: `useDocumentTypes.ts` - fetch document types (filtered by area template)
- Form validation with Zod schema
- Insert document with all foreign keys

---

### 2.2 Object Creation/Reuse Flow

**Within Upload Modal:**
- Object dropdown shows existing Objects for current Area
- "Create new Object" option opens inline form
- When creating new Object, prompt user: "This will be reusable across periods"
- New Object inherits entity_id, department_id, process_id, area_id from current location

---

### 2.3 Rename Protection

**In DocumentList:**
- No edit button on filename
- If user attempts any rename action, show toast: "FileGRID manages naming automatically. Use the Notes field for additional context."
- Notes field visible in document detail panel (future enhancement)

---

### 2.4 Admin Guided Creation Flows

**Entity Creation (Admin only):**
- New component: `CreateEntityModal.tsx`
- Simple form: Entity name only
- Visible in EntitySelector when user is admin
- On create, entity appears in dropdown

**Process Creation (From Templates):**
- New component: `CreateProcessModal.tsx`
- Step 1: Select Department
- Step 2: Select Process Template (filtered by department)
- Step 3: Process name (pre-filled from template)
- On create: Copy all Area Templates as Areas linked to new Process

---

## Sprint 3: Pivot Views

### 3.1 View Selector Component

**New Component: `ViewSelector.tsx`**
- Dropdown in header area of main content panel
- Options:
  1. Default (Folder View) - current behavior
  2. By Period - Area - Object
  3. By Object - Period
  4. By Area - Period
  5. By Document Type
  6. By Status (Final Only)

### 3.2 Pivot View Components

**New Component: `PivotView.tsx`**
- Receives `viewType` and renders appropriate grouping
- Uses same `documents` data, different grouping logic

**Grouping Logic:**

| View | Primary Group | Secondary Group | Display |
|------|---------------|-----------------|---------|
| Period-Area-Object | Period label | Area name | Collapsible sections |
| Object-Period | Object name | Period label | Timeline per object |
| Area-Period | Area name | Period label | Department overview |
| Document Type | Type name | None | Flat list by type |
| Status Final | None | None | Filtered to Final only |

**New Hooks:**
- `useDocumentsByPeriod.ts` - already exists, enhance for pivot grouping
- `usePivotDocuments.ts` - central hook that transforms documents based on view type

---

## Sprint 4: Analysis and Polish

### 4.1 "What's Missing" View

**Logic Flow:**
1. For selected Entity + Period:
2. Get all Areas (from processes in this entity)
3. For each Area, get expected Document Types (from `area_document_types` via `template_id`)
4. Compare against uploaded Documents in that Period
5. Display gaps as checklist

**New Component: `WhatsMissingView.tsx`**
- Period selector at top
- Grouped by: Department - Process - Area
- Each item shows: Document Type name, Required flag, Status icon
- Legend: Checkmark (uploaded), Circle (missing), Warning (missing + required)

**New Hook: `useExpectedDocuments.ts`**
- Fetches area templates and their required document types
- Joins with actual documents to calculate gaps

**Export Feature:**
- CSV download button
- Columns: Area, Document Type, Required, Status, Period

---

### 4.2 PBC Request List UI

**New Component: `PBCListView.tsx`**
- Separate tab/route: "Requests"
- Table columns: Area, Document Type, Object, Period, Status, Assignee
- Status flow: Requested - Uploaded - Reviewed - Complete

**New Component: `CreatePBCItemModal.tsx`**
- Select: Process, Area, Document Type, Period
- Optional: Object, Assignee
- Creates PBC item with status "Requested"

**Auto-Complete Logic:**
- When document uploaded, check if matching PBC item exists
- If match found (same area_id, document_type_id, period_id, optional object_id):
  - Update PBC item status to "Uploaded"
  - This runs in the upload mutation's onSuccess callback

---

### 4.3 AI Metadata Assist Placeholder

**Upload Modal Enhancement:**
- Toggle: "Suggest metadata from URL" (disabled by default)
- When enabled: Show placeholder message "AI analysis coming soon"
- Scaffold the UI flow without actual AI integration

**Future-Ready Structure:**
- Create `useAIMetadataSuggestion.ts` hook (returns empty/mock data)
- UI shows: Suggested Object, Period, Document Type with confidence %
- All fields editable - user must confirm before saving

---

## Implementation Order

### Phase 1: Upload Flow (Critical Path)
1. Create `useObjects.ts` hook
2. Create `useDocumentTypes.ts` hook  
3. Build `UploadDocumentModal.tsx` with naming engine
4. Add "Add Document" button to Index page (visible when Area selected)
5. Test upload flow end-to-end

### Phase 2: Pivot Views
6. Create `ViewSelector.tsx` component
7. Build `PivotView.tsx` with grouping logic
8. Add view state to Index page
9. Test all 5 view types

### Phase 3: Admin Flows
10. Create `CreateEntityModal.tsx` (admin only)
11. Create `CreateProcessModal.tsx` (from templates)
12. Integrate into EntitySelector and sidebar

### Phase 4: Analysis Features
13. Build `WhatsMissingView.tsx` with gap calculation
14. Add CSV export functionality
15. Build `PBCListView.tsx` with CRUD
16. Implement PBC auto-complete on upload

### Phase 5: Polish
17. Add AI assist placeholder UI
18. Rename protection messaging
19. Loading states and error handling
20. Final testing across all features

---

## Technical Notes

### New Files to Create
```
src/components/filegrid/
  UploadDocumentModal.tsx
  CreateEntityModal.tsx
  CreateProcessModal.tsx
  ViewSelector.tsx
  PivotView.tsx
  WhatsMissingView.tsx
  PBCListView.tsx
  CreatePBCItemModal.tsx

src/hooks/
  useObjects.ts
  useDocumentTypes.ts
  usePivotDocuments.ts
  useExpectedDocuments.ts
  usePBCItems.ts
```

### Database Considerations
- All tables and relationships already exist
- No schema changes needed for core features
- May add index on `documents(logical_name, period_id)` for version lookup performance

### UI Patterns
- All modals use shadcn Dialog component
- Forms use React Hook Form + Zod
- Queries use TanStack Query with proper cache invalidation
- Toast notifications for success/error feedback

