

# Retroactive Approval Request Feature

## Summary

Add a "Request Approval" button for existing documents that were uploaded before their Object had approval enabled. This allows users to retroactively submit documents for approval when an Object's approval requirement is turned on after documents already exist.

---

## Current Behavior

When `ApprovalActions` receives a document ID:
1. It queries for an approval record
2. If **no approval exists** → returns `null` (shows nothing)
3. If approval exists → shows badge + approve/reject buttons

## Problem

Documents uploaded before an Object had `requires_approval = true` have no approval records, so they show nothing in the Approval column - even though the Object now requires approval.

---

## Proposed Solution

Enhance `ApprovalActions` component to:
1. Check if the document's Object has `requires_approval = true`
2. If yes AND no approval record exists AND document is `Draft`:
   - Show a "Request Approval" button
   - Clicking it creates a pending approval record

---

## Technical Changes

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/filegrid/ApprovalActions.tsx` | Add logic to show "Request Approval" button; accept `objectRequiresApproval` and `documentStatus` props |
| `src/components/filegrid/DocumentList.tsx` | Pass object's `requires_approval` flag and document status to ApprovalActions |

### Implementation Details

**ApprovalActions.tsx Changes:**

```typescript
interface ApprovalActionsProps {
  documentId: string;
  objectRequiresApproval?: boolean;  // NEW
  documentStatus?: string;            // NEW
}
```

New logic flow:
1. If approval record exists → show current badge/buttons (no change)
2. If no approval AND `objectRequiresApproval = true` AND `documentStatus = 'Draft'`:
   - Show "Request Approval" button with upload icon
   - On click: call `useCreateApproval` mutation
3. Otherwise → show nothing (unchanged)

**DocumentList.tsx Changes:**

Pass additional props to ApprovalActions:
```tsx
<ApprovalActions 
  documentId={doc.id}
  objectRequiresApproval={doc.objects?.requires_approval}
  documentStatus={doc.status}
/>
```

---

## User Experience

### Before (current)
| Name | Status | Approval |
|------|--------|----------|
| Payroll_Invoice_2025-12 | Draft | (empty) |

### After (with this feature)
| Name | Status | Approval |
|------|--------|----------|
| Payroll_Invoice_2025-12 | Draft | [Request Approval] |

When user clicks "Request Approval":
1. Button shows loading spinner
2. Approval record is created as `pending`
3. Button transforms to show `Pending` badge + Approve/Reject buttons
4. Folder tree badge count updates

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Object has `requires_approval = false` | No button shown |
| Document is `Final` status | No button shown (already finalized) |
| Approval already exists | Shows existing badge/buttons |
| Document has no Object (object_id is null) | No button shown |

---

## Implementation Steps

1. Update `ApprovalActions` props interface to accept `objectRequiresApproval` and `documentStatus`
2. Add conditional rendering for "Request Approval" button when no approval exists
3. Wire up `useCreateApproval` mutation to the button click handler
4. Update `DocumentList` to pass the new props from document data
5. Add success toast notification

---

## Success Criteria

1. Documents in approval-required Objects that lack an approval record show "Request Approval" button
2. Clicking the button creates a pending approval and shows the Approve/Reject actions
3. Final documents do not show the button (already finalized)
4. Documents in non-approval Objects show nothing

