
# Transforming Reconciliations into Financial Truth Infrastructure

## Executive Summary

This plan transforms the Reconciliation module from a simple tracking tool into a first-class experience that mirrors the Documents module's familiar navigation while introducing powerful accounting-specific functionality through intelligent templates.

---

## Current State Analysis

### What We Have
- Basic reconciliation tracking (GL balance vs. sub-ledger)
- Simple workflow (not_started → certified)
- Document attachments
- List view with status filtering
- Stats cards with variance tracking

### What's Missing (The Vision Gap)
1. **No tree navigation** - Users see a flat list, not the familiar structural hierarchy
2. **Dumb templates** - Current templates store only `template_content: jsonb` with no accounting logic
3. **No workspace experience** - Clicking opens a side panel, not a dedicated workspace
4. **No period rollforwards** - No way to track balances across time
5. **No intelligent dashboards** - Stats show counts, not actionable insights
6. **No task list templates** - Checklists are free-form, not standardized

---

## Phased Implementation

### Phase 1: Mirror the Documents Experience (Layout Transformation)
*Make it feel familiar before making it powerful*

**Goal**: Same left-tree, right-content pattern as Documents

```text
+--------------------+--------------------------------+
|  BS Tree           |   Reconciliation Workspace     |
|  ├─ Assets         |                                |
|  │  ├─ Cash        |   [Account Header + Status]    |
|  │  │  ├─ Bank A ◉ |   [Balance Summary Box]        |
|  │  │  └─ Bank B   |   [Template Content Area]      |
|  │  ├─ AR          |   [Attachments Section]        |
|  │  └─ Prepaids    |   [Workflow History]           |
|  └─ Liabilities    |                                |
|     ├─ Accruals    |                                |
|     └─ Leases      |                                |
+--------------------+--------------------------------+
```

**Changes**:
1. Create `ReconciliationTree.tsx` - A tree organized by GL account hierarchy
2. Create `ReconciliationWorkspace.tsx` - Full-page workspace (not a side panel)
3. Update `Reconciliations.tsx` to use split-pane layout like Documents
4. Add account grouping concept (Assets, Liabilities, Equity)

**Database**:
- Add `account_group` field to objects table (or create new account_categories table)
- Add `gl_account_number` to objects for sorting/grouping

---

### Phase 2: Intelligent Template System
*This is where the magic happens*

**Goal**: Templates that encode accounting logic, not just metadata

**Template Types to Support**:

| Template | Key Fields | Auto-Calculations |
|----------|-----------|-------------------|
| Bank Reconciliation | Book balance, adjustments, outstanding items | Adjusted balance |
| Prepaid Expense | Original amount, start/end dates, method | Monthly amortization, remaining balance |
| Accrual (Monthly) | Opening, additions, reversals per month | Closing balance, 12-month rollforward |
| Accrual (Quarterly) | Same as above, quarterly buckets | Quarterly totals |
| Lease (IFRS 16) | PV, discount rate, lease term, payments | ROU asset, lease liability, interest |
| Fixed Asset | Cost, accumulated depreciation, additions | NBV, period depreciation |
| Intercompany | IC partner, amounts due to/from | Net position |

**Database Schema**:
```sql
-- Enhanced reconciliation_templates
ALTER TABLE reconciliation_templates ADD COLUMN template_type text;
ALTER TABLE reconciliation_templates ADD COLUMN field_schema jsonb; -- defines input fields
ALTER TABLE reconciliation_templates ADD COLUMN calculation_rules jsonb; -- defines formulas

-- Reconciliation template data (stores user entries)
CREATE TABLE reconciliation_line_items (
  id uuid PRIMARY KEY,
  reconciliation_id uuid REFERENCES reconciliations(id),
  line_type text, -- 'opening', 'addition', 'reversal', 'adjustment', 'closing'
  period_month date, -- for rollforward views
  description text,
  amount numeric,
  metadata jsonb,
  created_at timestamptz
);
```

**Components**:
1. `TemplateRenderer.tsx` - Dynamic form based on template type
2. `AmortizationTable.tsx` - For prepaid schedules
3. `RollforwardTable.tsx` - For accrual/lease multi-period views
4. `LeaseCalculator.tsx` - PV calculations for IFRS 16

---

### Phase 3: Evidence vs. Primary Artifact
*Documents support the reconciliation, not the other way around*

**Goal**: Clear distinction between the reconciliation (primary) and its attachments (evidence)

**Changes**:
1. Categorized attachments:
   - `evidence` - Bank statements, invoices
   - `workpaper` - Excel schedules, calculations
   - `report` - Final reconciliation report (auto-generated)
   
2. Auto-generate reconciliation report as PDF attachment
3. Link to Documents module for browsing available evidence

**UI**:
```text
Attachments
┌────────────────────────────────────────────────┐
│ Evidence (3)                              + Add│
│ ├─ Bank Statement Dec 2025.pdf         📎 🗑  │
│ ├─ Deposit confirmation.pdf            📎 🗑  │
│ └─ Outstanding checks list.xlsx        📎 🗑  │
├────────────────────────────────────────────────┤
│ Workpapers (1)                           + Add │
│ └─ Bank rec calculation.xlsx           📎 🗑  │
├────────────────────────────────────────────────┤
│ Reports (auto-generated)                       │
│ └─ Bank A Reconciliation - Dec 2025.pdf   📄  │
└────────────────────────────────────────────────┘
```

---

### Phase 4: Task List Templates (Checklists)
*Standardized, reusable checklists tied to reconciliations*

**Goal**: Pre-defined checklists that enforce best practices

**Templates**:
- Monthly Close Checklist
- Bank Reconciliation Checklist
- Accrual Review Checklist
- Quarter-End Checklist
- Audit Readiness Checklist

**Database**:
```sql
CREATE TABLE checklist_templates (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  items jsonb NOT NULL, -- [{order, label, required}]
  applies_to text[] -- ['reconciliation', 'period', 'entity']
);

CREATE TABLE checklist_instances (
  id uuid PRIMARY KEY,
  template_id uuid REFERENCES checklist_templates(id),
  reconciliation_id uuid REFERENCES reconciliations(id),
  period_id uuid REFERENCES periods(id),
  entity_id uuid REFERENCES entities(id),
  created_at timestamptz
);

CREATE TABLE checklist_item_completions (
  id uuid PRIMARY KEY,
  instance_id uuid REFERENCES checklist_instances(id),
  item_index int,
  completed boolean DEFAULT false,
  completed_by uuid,
  completed_at timestamptz,
  notes text
);
```

---

### Phase 5: Intelligent Dashboards
*Problems that explain themselves*

**Goal**: Actionable insights, not vanity metrics

**Dashboard Sections**:

1. **Attention Required** (sorted by urgency)
   - "3 reconciliations with unexplained variances > $10k"
   - "5 accounts pending review for 7+ days"
   - "2 accounts rejected, awaiting rework"

2. **Completion Tracker**
   - Progress bar by account category
   - "Assets: 12/15 certified (80%)"
   - "Liabilities: 8/10 certified (80%)"

3. **Variance Analysis**
   - Top 5 variances by amount
   - Trend: "Variance increased 15% vs. prior period"

4. **Workflow Bottlenecks**
   - "Avg. time in review: 3.2 days"
   - "Accounts stuck in progress: 4"

---

### Phase 6: Cross-Module Linking
*Everything connects to everything*

**Links from Reconciliations**:
- Tasks: "Create task: Investigate AR variance"
- Documents: "View supporting docs for this account"
- PBC: "Request missing bank statement"

**Links to Reconciliations**:
- From Tasks: "Related reconciliation: Bank A - Dec 2025"
- From Documents: "Used as evidence in: Bank A reconciliation"

---

## Technical Summary

### New Database Tables
1. `reconciliation_line_items` - Template data entries
2. `checklist_templates` - Standardized checklists
3. `checklist_instances` - Instantiated checklists
4. `checklist_item_completions` - Completion tracking

### Modified Tables
1. `objects` - Add `gl_account_number`, `account_category`
2. `reconciliation_templates` - Add `template_type`, `field_schema`, `calculation_rules`
3. `reconciliation_attachments` - Add more attachment_type values

### New Components
1. `ReconciliationTree.tsx` - Tree navigation by account structure
2. `ReconciliationWorkspace.tsx` - Full-page workspace
3. `TemplateRenderer.tsx` - Dynamic template forms
4. `RollforwardTable.tsx` - Multi-period views
5. `ReconciliationDashboard.tsx` - Intelligent insights
6. `ChecklistPanel.tsx` - Task list management

### New Hooks
1. `useReconciliationTree` - Build account hierarchy
2. `useReconciliationLineItems` - Template data CRUD
3. `useChecklists` - Checklist management
4. `useReconciliationInsights` - Dashboard queries

---

## Recommended Starting Point

**Begin with Phase 1** (Layout Transformation) as it:
- Immediately aligns with the vision's core principle: "Same structure, same navigation"
- Is purely UI/UX - no database changes needed
- Sets the foundation for all subsequent phases
- Provides immediate user value and familiarity

After Phase 1, proceed to **Phase 2** (Templates) which is the "real power" per the vision.
