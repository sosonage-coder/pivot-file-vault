
# Transforming Reconciliations into Financial Truth Infrastructure

## Executive Summary

This plan transforms the Reconciliation module from a simple tracking tool into a first-class experience that mirrors the Documents module's familiar navigation while introducing powerful accounting-specific functionality through intelligent templates.

---

## Progress Tracker

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Layout Transformation | ✅ Complete | Tree navigation, workspace, split-pane layout |
| Phase 2: Intelligent Templates | ✅ Complete | 6 template types with auto-calculations |
| Phase 3: Evidence vs. Primary | ✅ Complete | Categorized attachments (evidence, workpaper, report) |
| Phase 4: Task List Templates | ⏳ Pending | Checklists tied to reconciliations |
| Phase 5: Intelligent Dashboards | ⏳ Pending | Actionable insights |
| Phase 6: Cross-Module Linking | ⏳ Pending | Links between modules |

---

## Phase 1: Mirror the Documents Experience ✅ COMPLETE

**Implemented**:
- `ReconciliationTree.tsx` - Tree organized by area/account hierarchy with status indicators
- `ReconciliationWorkspace.tsx` - Full-page workspace with tabs (Reconciliation, Evidence, History)
- `useReconciliationTree.ts` - Hook to transform flat data into hierarchical tree
- Split-pane layout matching Documents module

---

## Phase 2: Intelligent Template System ✅ COMPLETE

**Database Changes**:
- Added `template_type`, `field_schema`, `calculation_rules` to `reconciliation_templates`
- Created `reconciliation_line_items` table with RLS policies

**Templates Created** (6 total):
| Template | Type | Auto-Calculations |
|----------|------|-------------------|
| Bank Reconciliation | `bank` | Adjusted book balance, variance |
| Prepaid Expense | `prepaid` | Monthly amortization, remaining balance |
| Accrual Rollforward | `accrual` | Opening + additions - reversals = closing |
| Fixed Asset | `fixed_asset` | NBV = cost - accumulated depreciation |
| Lease (IFRS 16) | `lease` | PV calculation, liability rollforward |
| Intercompany | `intercompany` | Net position, variance |

**Components Created**:
- `TemplateRenderer.tsx` - Routes to correct template based on type
- `LineItemSection.tsx` - Reusable line item table with CRUD
- `BankReconciliationTemplate.tsx` - Outstanding checks, deposits in transit
- `PrepaidExpenseTemplate.tsx` - Amortization schedule visualization
- `AccrualRollforwardTemplate.tsx` - Opening/closing balance rollforward
- `FixedAssetTemplate.tsx` - Cost/depreciation/NBV tracking
- `LeaseTemplate.tsx` - IFRS 16 liability rollforward with PV calculator
- `GeneralTemplate.tsx` - Fallback for untyped templates

**Hook Created**:
- `useReconciliationLineItems.ts` - CRUD for line items

---

## Phase 3: Evidence vs. Primary Artifact (NEXT)

**Goal**: Clear distinction between the reconciliation (primary) and its attachments (evidence)

**Changes Needed**:
1. Categorized attachments: evidence, workpaper, report
2. UI to show attachments grouped by category
3. Link to Documents module for browsing available evidence

---

## Phase 4: Task List Templates (Checklists)

**Goal**: Pre-defined checklists that enforce best practices

**Database Needed**:
- `checklist_templates` - Template definitions
- `checklist_instances` - Instantiated checklists
- `checklist_item_completions` - Completion tracking

---

## Phase 5: Intelligent Dashboards

**Goal**: Actionable insights, not vanity metrics

**Sections**:
1. Attention Required (unexplained variances, pending reviews)
2. Completion Tracker (progress by account category)
3. Variance Analysis (top variances, trends)
4. Workflow Bottlenecks (avg time in review, stuck items)

---

## Phase 6: Cross-Module Linking

**Links from Reconciliations**:
- Tasks: "Create task: Investigate AR variance"
- Documents: "View supporting docs for this account"
- PBC: "Request missing bank statement"

**Links to Reconciliations**:
- From Tasks: "Related reconciliation: Bank A - Dec 2025"
- From Documents: "Used as evidence in: Bank A reconciliation"
