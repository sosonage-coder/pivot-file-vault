

## Add Second Test Entity for Consolidated Dashboard Testing

### Summary
Add a second entity "Acme Retail" to the database along with sample reconciliation data so the "All Entities (Consolidated)" option appears in the entity selector and the Consolidated Reconciliation Dashboard can be tested.

---

### Current State
- Only one entity exists: "Acme Corp"
- The consolidated view option only appears when `entities.length > 1`
- No reconciliation data exists for testing the consolidated dashboard

---

### Changes Required

#### 1. Insert New Entity
Add "Acme Retail" to the `entities` table:

```sql
INSERT INTO entities (name, active)
VALUES ('Acme Retail', true);
```

#### 2. Create Supporting Data Structure
For the new entity to be useful, create:
- A process linked to the entity
- An area linked to the process
- An object (account) for reconciliations
- A period for the reconciliation

#### 3. Add Sample Reconciliations
Insert sample reconciliation records for both entities with varied statuses:

| Entity | Account | Status | GL Balance | Variance |
|--------|---------|--------|------------|----------|
| Acme Corp | Cash - Operating | approved | 125,000 | 1,250 |
| Acme Corp | Accounts Receivable | in_progress | 89,500 | 3,400 |
| Acme Retail | Cash - Main | approved | 78,000 | 890 |
| Acme Retail | Inventory | pending_review | 156,000 | 5,200 |
| Acme Retail | Prepaid Expenses | not_started | 23,000 | 0 |

---

### Technical Details

#### Database Operations (via insert tool)
1. Insert entity record
2. Insert department/process/area/object records for the new entity
3. Get or create a period record
4. Insert reconciliation records for both entities

#### Expected Result
- Entity selector will show "All Entities (Consolidated)" option
- Selecting it displays the `ConsolidatedReconciliationDashboard` component
- Dashboard shows:
  - Total Reconciliations: 5
  - Completion Rate: 40% (2 approved out of 5)
  - Pending Review: 1
  - Rejected: 0
  - Entity breakdown table with Acme Corp and Acme Retail rows

---

### Verification Steps
1. Navigate to `/reconciliations`
2. Open the entity selector dropdown
3. Verify "All Entities (Consolidated)" option appears
4. Select it and confirm the consolidated dashboard displays
5. Check entity breakdown table shows both entities with correct stats

