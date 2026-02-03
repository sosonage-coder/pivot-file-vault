# Reconciliation Tree in Sidebar + New Tab UX

## ✅ Completed

### Fix 1: Reconciliation Tree in Sidebar
- Updated `UnifiedSidebar.tsx` to render `ReconciliationTree` when `activeFeature === 'reconciliations'`
- Added imports for `useReconciliations`, `useReconciliationTree`, and `ReconciliationTree`
- Tree shows Category → Area → Account hierarchy with status indicators

### Fix 2: Wire ReconciliationsPage to Sidebar Selection
- Updated `ReconciliationsPage.tsx` to use `useSidebarSelection()` hook
- Extracts `reconciliationId` from selected tree node's metadata
- Passes selected ID to `ReconciliationWorkspace` (shows dashboard when null, detail view when selected)

### Fix 3: New Tab UX
- Added **Ctrl/Cmd+Click** support on account nodes to open in new tab
- Added **right-click context menu** with "Open in New Tab" option
- Uses `ContextMenu` from shadcn/ui for native-feeling interaction

## Technical Notes

### Tree Node Selection Flow
1. User clicks account in `ReconciliationTree`
2. `handleReconciliationNodeSelect` converts `ReconciliationTreeNode` → `TreeNode`
3. Stores `reconciliationId` in `metadata.reconciliationId`
4. `ReconciliationsPage` reads from `selectedNode.metadata.reconciliationId`
5. Passes to `ReconciliationWorkspace` for detail view
