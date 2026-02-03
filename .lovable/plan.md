
# Restore Folder Trees + Add PBC Feature

## ✅ COMPLETED

### What Was Done

1. **Added PBC Requests as 6th Feature** - Now visible in sidebar with ClipboardList icon
2. **Created FeatureSplitLayout** - Resizable split panel component for folder tree + content
3. **Created useFeatureFolderStructure hook** - Builds Process → Area → Object tree for Documents/PBC
4. **Rebuilt DocumentsPage** - Full implementation with folder tree, document list, upload modal
5. **Created PBCRequestsPage** - Full implementation with folder tree and PBC checklist workspace
6. **Updated Navigation** - 6 features with keyboard shortcuts (Cmd+1-6)

### Files Created
- `src/components/layout/FeatureSplitLayout.tsx`
- `src/hooks/useFeatureFolderStructure.ts`
- `src/pages/PBCRequestsPage.tsx`

### Files Modified
- `src/App.tsx` - Added `/pbc/*` route
- `src/components/layout/AppSidebar.tsx` - Added PBC Requests feature
- `src/hooks/useActiveFeature.ts` - Added 'pbc' type and shortcut
- `src/pages/DocumentsPage.tsx` - Complete rewrite with folder tree

### Keyboard Shortcuts

| Shortcut | Feature |
|----------|---------|
| Cmd+1 | Close Calendar |
| Cmd+2 | Reconciliations |
| Cmd+3 | Documents |
| Cmd+4 | PBC Requests |
| Cmd+5 | Checklists |
| Cmd+6 | Meetings |


