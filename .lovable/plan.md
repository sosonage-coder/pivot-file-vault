

## Fix Build Errors in ConsolidatedReconciliationDashboard.tsx

### Summary
The build is failing due to duplicate variable declarations and malformed JSX in `ConsolidatedReconciliationDashboard.tsx`. The second entity "Acme Retail" **already exists** in the database - no data seeding is needed.

---

### Problem Analysis
The `<current-code>` section shows the file has merge conflict artifacts:

```typescript
// Lines 68-71 have duplicates:
const dashboardData = showSampleData ? sampleData : data;
const hasLiveData = Boolean(data && data.totalReconciliations > 0);
const hasLiveData = Boolean(data && data.totalReconciliations > 0);  // DUPLICATE
const dashboardData = showSampleData ? sampleData : data;           // DUPLICATE
```

Plus duplicate UI elements and malformed JSX closing tags.

---

### Fix Required
Rewrite the component with the clean, working version that:

1. Declares `hasLiveData` and `dashboardData` only once
2. Has properly structured JSX (all Card/CardHeader/CardContent tags balanced)
3. Removes duplicate Button elements
4. Keeps the sample data toggle functionality

---

### Database Status (Already Complete)
| Entity | ID | Status |
|--------|-----|--------|
| Acme Corp | 11111111-1111-1111-1111-111111111111 | Active |
| Acme Retail | 22222222-2222-2222-2222-222222222222 | Active |

The consolidated view should work once the component compiles.

---

### Verification Steps
1. Build succeeds without errors
2. Navigate to `/reconciliations`
3. Entity selector shows "All Entities (Consolidated)" option
4. Selecting it displays the consolidated dashboard
5. "View sample data" button works when no live reconciliation data exists

