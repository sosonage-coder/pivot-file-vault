
# Approval Workflow for Objects (Last Folder Level)

## Summary

This plan adds an **optional approval workflow** at the Object level (the last folder level in the hierarchy). Objects can be marked as requiring approval, and documents uploaded to those Objects will need to go through an approval process before becoming "Final".

---

## Current State

```text
Department → Process → Area → Object → Documents
                               ↑
                         Last folder level
```

- Documents have statuses: `Draft`, `Final`, `Superseded`, `Archived`
- No approval mechanism exists currently
- Users can directly set documents to "Final" on upload

---

## Proposed Workflow

### How It Works

1. **Enable approval on an Object** (optional toggle)
   - Each Object gets a new `requires_approval` boolean field (default: `false`)
   - When editing or creating an Object, toggle "Require Approval" on/off

2. **Document upload behavior**
   - If Object has `requires_approval = true`:
     - Documents are created as `Draft` (status dropdown hidden or locked)
     - A new record is created in `document_approvals` table tracking pending approval
   - If Object has `requires_approval = false`:
     - Current behavior (user picks Draft or Final)

3. **Approval UI**
   - New "Pending Approvals" badge on Objects in the folder tree
   - Document list shows "Approve" / "Reject" buttons for users with approval rights
   - Approving → changes document status to `Final`
   - Rejecting → keeps as `Draft` with rejection note

---

## Database Changes

### New Table: `document_approvals`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| document_id | uuid | FK to documents |
| status | enum | `pending`, `approved`, `rejected` |
| requested_by | uuid | User who uploaded |
| reviewed_by | uuid | User who approved/rejected (nullable) |
| reviewed_at | timestamp | When reviewed (nullable) |
| notes | text | Rejection reason or approval note |
| created_at | timestamp | When approval was requested |

### Modify Table: `objects`

Add column:
```sql
requires_approval BOOLEAN NOT NULL DEFAULT false
```

### New Enum: `approval_status`
```sql
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
```

---

## Technical Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useApprovals.ts` | CRUD hooks for document_approvals |
| `src/components/filegrid/ApprovalActions.tsx` | Approve/Reject buttons for document rows |
| `src/components/filegrid/EditObjectModal.tsx` | Modal to edit Object settings including approval toggle |

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/filegrid.ts` | Add `ApprovalStatus` type; extend `FileObject` with `requires_approval` |
| `src/hooks/useObjects.ts` | Add `useUpdateObject` mutation for toggling approval requirement |
| `src/components/filegrid/UploadDocumentModal.tsx` | Check if Object requires approval; lock status to Draft if so |
| `src/components/filegrid/DocumentList.tsx` | Add approval badge and Approve/Reject actions |
| `src/components/filegrid/FolderTree.tsx` | Show pending approval count badge on Objects |
| `src/hooks/useFolderStructure.ts` | Fetch `requires_approval` and pending approval counts |
| `src/pages/Index.tsx` | Add context menu or button to edit Object settings |

---

## User Experience Flow

### Enabling Approval on an Object

1. Right-click Object in folder tree → "Edit Object"
2. Toggle "Require Approval for Documents"
3. Save

### Uploading to Approval-Required Object

1. User clicks "Add Document" (Object is selected)
2. Modal shows "(Approval Required)" badge
3. Status field is locked to "Draft"
4. On submit, document created + approval record created

### Approving Documents

1. Folder tree shows: `Payroll Accruals (2 pending)`
2. Click to view documents
3. Documents with pending approval show "Approve" / "Reject" buttons
4. Click "Approve" → document status changes to "Final"
5. Click "Reject" → modal asks for rejection reason → status stays "Draft"

---

## Visual Indicators

```text
Finance
└── Monthly Close
    └── Accruals
        ├── Payroll Accruals  🔒 (2 pending)  ← Approval enabled
        └── Vendor Accruals                   ← No approval
```

In Document List:

| Name | Status | Actions |
|------|--------|---------|
| Payroll_Invoice_2025-12 | Draft ⏳ | [Approve] [Reject] |
| Vendor_Invoice_2025-12 | Final ✓ | — |

---

## RLS Policies for `document_approvals`

```sql
-- Users can view approvals for documents in their entities
CREATE POLICY "Users can view approvals in their entities"
ON document_approvals FOR SELECT
USING (EXISTS (
  SELECT 1 FROM documents d
  WHERE d.id = document_approvals.document_id
  AND user_has_entity_access(auth.uid(), d.entity_id)
));

-- Users can create approval requests for their documents
CREATE POLICY "Users can create approval requests"
ON document_approvals FOR INSERT
WITH CHECK (requested_by = auth.uid());

-- Admins can update approvals (approve/reject)
CREATE POLICY "Admins can manage approvals"
ON document_approvals FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Users with entity access can approve (extend later for specific approver roles)
CREATE POLICY "Users can approve in their entities"
ON document_approvals FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM documents d
  WHERE d.id = document_approvals.document_id
  AND user_has_entity_access(auth.uid(), d.entity_id)
));
```

---

## Implementation Steps

### Step 1: Database Migration
- Create `approval_status` enum
- Create `document_approvals` table with RLS
- Add `requires_approval` column to `objects` table

### Step 2: Type Definitions
- Add `ApprovalStatus` and `DocumentApproval` types
- Extend `FileObject` interface

### Step 3: Hooks
- Create `useApprovals.ts` with query and mutations
- Add `useUpdateObject` mutation

### Step 4: Upload Flow
- Modify `UploadDocumentModal` to detect approval-required Objects
- Auto-create approval record on document creation

### Step 5: Document List
- Add approval status badge and actions
- Implement approve/reject handlers

### Step 6: Folder Tree
- Show pending count badge on Objects
- Add context menu for "Edit Object"

### Step 7: Edit Object Modal
- Create modal with approval toggle
- Wire up to update mutation

---

## Success Criteria

1. User can toggle "Require Approval" on an Object
2. Documents uploaded to approval-required Objects start as "Draft" with pending approval
3. Users can approve documents, changing status to "Final"
4. Users can reject documents with a reason, keeping status as "Draft"
5. Folder tree shows pending approval count on Objects
6. Approval is completely optional - Objects without the flag work as before
