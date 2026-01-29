

# Sidebar Cleanup and Right-Click Delete Feature

## Summary
This plan covers three main changes:
1. Delete the unused "Audit" process (with PBC Documents, Work Papers areas)
2. Delete the duplicate empty "Monthly Close" process
3. Rename the remaining "Monthly Close" (with documents) to "Audit"
4. Add right-click context menu with delete option for folders

---

## Phase 1: Data Cleanup

### Delete Unused Folders
Remove from database:
- **Audit process** (id: `2716d6b2-360e-4dbb-83ad-e2e34b6fcc7f`)
  - Area: PBC Documents (`36589d8f-fc42-426c-bd81-189f8dd38601`)
  - Area: Work Papers (`a214ffcd-fd8c-4924-8fa4-0da6aa84b450`)
- **Duplicate Monthly Close** (id: `db91a0ce-b186-42c5-a28d-27f80c4e1e9e`) - the one without documents
  - Areas: Banking, Fixed Assets, Journals, Payables, Receivables (the empty duplicates)

### Rename Process
- Change "Monthly Close" (`22222222-2222-2222-2222-222222222222`) to "Audit"

---

## Phase 2: Right-Click Delete Feature

### New Hook: `useDeleteFolder`
Add delete mutations to `src/hooks/useAdminMutations.ts`:

```text
useDeleteProcess(processId)
  - Deletes process and cascades to areas, objects, documents
  - Invalidates folder-structure query
  
useDeleteArea(areaId)
  - Deletes area and cascades to objects, documents
  - Invalidates folder-structure query
```

### Updated Tree Component
Modify `src/components/filegrid/UnifiedFolderTree.tsx`:

```text
TreeItem component changes:
  - Wrap each tree item button in ContextMenuTrigger
  - Show context menu on right-click with options:
    - "Edit" (for objects, existing behavior)
    - "Delete" (for process/area nodes)
  - Use AlertDialog for delete confirmation
```

### Context Menu Options by Node Type
| Node Type | Right-Click Options |
|-----------|---------------------|
| department | (none) |
| process | Delete Process |
| area | Delete Area |
| object | Edit, Delete Object |
| module-* | (none) |
| pbc-* | (none) |

### Delete Confirmation Dialog
- Title: "Delete [Process/Area]?"
- Message: "This will permanently delete [name] and all its contents. This action cannot be undone."
- Buttons: Cancel, Delete (destructive style)

---

## Files to Create/Modify

| File | Change |
|------|--------|
| `useAdminMutations.ts` | Add `useDeleteProcess`, `useDeleteArea`, `useUpdateProcess` mutations |
| `UnifiedFolderTree.tsx` | Add context menu wrapper and delete confirmation dialog |
| Database | SQL UPDATE/DELETE operations for cleanup |

---

## Technical Details

### Database Operations
```text
-- Delete empty "Audit" process and areas
DELETE FROM areas WHERE process_id = '2716d6b2-...';
DELETE FROM processes WHERE id = '2716d6b2-...';

-- Delete duplicate Monthly Close (empty one)
DELETE FROM areas WHERE process_id = 'db91a0ce-...';
DELETE FROM processes WHERE id = 'db91a0ce-...';

-- Rename remaining Monthly Close to Audit
UPDATE processes SET name = 'Audit' WHERE id = '22222222-...';
```

### Cascade Behavior
The database has `ON DELETE CASCADE` constraints, so:
- Deleting a process automatically deletes its areas
- Deleting an area automatically deletes its objects
- Deleting an object automatically deletes its documents, PBC nodes, etc.

### Safety Check
Before deletion, we should check if the folder has children:
- If process has areas with documents: show warning in confirmation
- If area has objects with documents: show warning in confirmation

