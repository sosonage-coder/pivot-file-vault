

# Feature Separation + Compliance Calendar Plan

## Summary

Based on your clarification, we need to implement:

1. **Month Close** - Keep as a separate feature (already exists as "Close Calendar") with folder tree for close-related documents
2. **Documents** - General document management for contracts, agreements, etc. (restructure folder tree)
3. **Compliance Calendar** - NEW feature to track compliance deadlines and requirements

---

## Current State vs. Target State

```text
CURRENT (6 features):
+------------------------------------------+
| Close Calendar  (uses ChecklistWorkspace)|
| Reconciliations                          |
| Documents       (Process -> Area -> Obj) |
| PBC Requests    (Area -> Object)         |
| Checklists                               |
| Meetings                                 |
+------------------------------------------+

TARGET (7 features):
+------------------------------------------+
| Month Close     (Close docs + tasks)     | <- Rename + add folder tree
| Reconciliations                          |
| Documents       (Contracts, agreements)  | <- Filter to general docs
| PBC Requests    (Area -> Object)         | <- Already flattened
| Compliance Cal  (NEW - deadlines)        | <- NEW feature
| Checklists                               |
| Meetings                                 |
+------------------------------------------+
```

---

## Changes Overview

### 1. Rename "Close Calendar" to "Month Close"

Update the feature label and add a folder tree for close-related documents.

Current behavior: Shows `ChecklistWorkspace` for close schedules
New behavior: Shows close-specific folder tree in sidebar + ChecklistWorkspace with Kanban/Calendar views

### 2. Documents Feature - General Documents Only

Filter the Documents module to show ONLY general documents (contracts, agreements, vendor info, etc.) - excluding close-related process folders.

This requires:
- Adding a `document_category` or similar filter to distinguish close vs. general docs
- OR filtering by Process type (e.g., exclude processes tagged as "close-related")

### 3. New Compliance Calendar Feature

A new module to track compliance deadlines:

| Field | Description |
|-------|-------------|
| Compliance items | Lender covenants, regulatory filings, tax deadlines |
| Due dates | Recurring or one-time deadlines |
| Status | Pending, In Progress, Completed, Overdue |
| Responsible party | Assignee |
| Evidence | Linked documents proving compliance |

---

## Files to Create

1. **`src/pages/CompliancePage.tsx`** - New compliance calendar feature page
2. **`src/components/compliance/ComplianceWorkspace.tsx`** - Main workspace with calendar/list views
3. **`src/components/compliance/ComplianceItemModal.tsx`** - Create/edit compliance items
4. **`src/hooks/useComplianceItems.ts`** - Data fetching hooks

## Files to Modify

1. **`src/hooks/useActiveFeature.ts`** - Add `compliance` feature ID, rename `close` label
2. **`src/components/layout/UnifiedSidebar.tsx`** - Add compliance feature tab, update icons
3. **`src/App.tsx`** - Add compliance route
4. **`src/hooks/useFeatureFolderStructure.ts`** - Add `monthclose` feature type for close-specific folder tree

---

## Database Changes

A new table for compliance items:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| entity_id | uuid | FK to entities |
| period_id | uuid | Optional FK to periods |
| title | text | Compliance item name |
| description | text | Details |
| due_date | date | Deadline |
| recurrence | text | monthly, quarterly, annual, one-time |
| status | text | pending, in_progress, completed, overdue |
| assigned_to | uuid | FK to profiles |
| category | text | Lender, Tax, Regulatory, Internal |
| evidence_document_ids | uuid[] | Links to documents |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Technical Details

### Feature Configuration Update

```typescript
// useActiveFeature.ts
export type FeatureId = 'monthclose' | 'reconciliations' | 'documents' | 'pbc' | 'compliance' | 'checklists' | 'meetings';

export const FEATURES: FeatureConfig[] = [
  { id: 'monthclose', label: 'Month Close', path: '/close', shortcut: '1' },
  { id: 'reconciliations', label: 'Reconciliations', path: '/reconciliations', shortcut: '2' },
  { id: 'documents', label: 'Documents', path: '/documents', shortcut: '3' },
  { id: 'pbc', label: 'PBC Requests', path: '/pbc', shortcut: '4' },
  { id: 'compliance', label: 'Compliance', path: '/compliance', shortcut: '5' },
  { id: 'checklists', label: 'Checklists', path: '/checklists', shortcut: '6' },
  { id: 'meetings', label: 'Meetings', path: '/meetings', shortcut: '7' },
];
```

### UnifiedSidebar Feature Tabs Update

```typescript
// Add compliance feature with Shield icon
const FEATURES = [
  { id: 'monthclose', label: 'Close', icon: CalendarClock, ... },
  { id: 'reconciliations', label: 'Recons', icon: Scale, ... },
  { id: 'documents', label: 'Docs', icon: FileText, ... },
  { id: 'pbc', label: 'PBC', icon: ClipboardList, ... },
  { id: 'compliance', label: 'Comply', icon: Shield, color: 'text-orange-500', ... },
  { id: 'checklists', label: 'Lists', icon: CheckSquare, ... },
  { id: 'meetings', label: 'Meet', icon: Users, disabled: true, ... },
];
```

### Compliance Calendar UI

The Compliance workspace will include:
- **Calendar View**: Shows all compliance deadlines in a monthly calendar
- **List View**: Sortable table of compliance items by due date
- **Kanban View**: Columns for Pending, In Progress, Completed, Overdue
- **Filters**: By category (Lender, Tax, Regulatory), status, assignee

### Month Close Sidebar Content

When "Month Close" is active, the sidebar will show:
1. Close-specific folder tree (processes tagged as close-related)
2. Active close schedules (checklists with start_date)

---

## Implementation Order

1. Create database migration for `compliance_items` table
2. Create compliance hooks and types
3. Create CompliancePage and ComplianceWorkspace components
4. Update feature configuration (add compliance, rename close to monthclose)
5. Update UnifiedSidebar with new features
6. Add compliance route to App.tsx
7. Update folder structure hook to support monthclose filtering
8. Test all views (List, Kanban, Calendar) work for both Month Close and Compliance

