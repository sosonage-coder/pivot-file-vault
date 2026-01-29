

# Plan: Improve PBC List, Document Metadata & Streamlined Creation

## Problem Summary

You've identified three key usability issues:

1. **PBC List Not Showing Data**: The sample PBC data exists in the database but may not be displaying correctly
2. **Missing Metadata Features**: Document metadata is hard to work with and "AI Assist" isn't functional
3. **Tedious Monthly Document Creation**: Creating documents each month requires too many manual selections

---

## Solution Overview

```text
+------------------------------------------+
|           Quick Add Workflows            |
+------------------------------------------+
|  [1] PBC Request → Document (1-click)    |
|  [2] Clone Period (bulk copy)            |
|  [3] Simplified Form (smart defaults)    |
+------------------------------------------+
```

---

## Phase 1: Fix PBC List Display Issue

**Investigation & Fix:**
- The `usePBCItems` hook uses `!inner` joins which fail silently if any related record is missing
- Change joins to left joins where appropriate to handle optional relationships
- Add error boundary and loading states for better debugging

**Files to modify:**
- `src/hooks/usePBCItems.ts` - Fix the query joins

---

## Phase 2: Add "Quick Add from PBC" Feature

When viewing PBC Requests, allow one-click document creation:

**User Experience:**
1. User sees PBC request list with "Requested" status
2. Clicks "Fulfill" button on a request
3. Opens simplified modal pre-filled with:
   - Area (from PBC item)
   - Document Type (from PBC item)
   - Period (from PBC item)
   - Object (from PBC item if specified)
4. User only needs to add the URL
5. Document created + PBC status auto-updates to "Uploaded"

**Files to create/modify:**
- `src/components/filegrid/FulfillPBCModal.tsx` - New streamlined modal
- `src/components/filegrid/PBCListView.tsx` - Add "Fulfill" action button

---

## Phase 3: Clone Period Feature (Bulk Copy)

For recurring monthly work, allow copying all documents from one period to another:

**User Experience:**
1. User goes to "Clone Period" action in View menu
2. Selects source period (e.g., "2025-11")
3. Selects target period (e.g., "2025-12")
4. System shows preview: "8 documents will be copied"
5. User confirms, documents are cloned (status reset to Draft)

**Files to create/modify:**
- `src/components/filegrid/ClonePeriodModal.tsx` - New wizard component
- `src/hooks/useClonePeriod.ts` - Bulk copy mutation
- `src/pages/Index.tsx` - Add Clone Period to header/menu

---

## Phase 4: Simplified "Quick Add" Form

Streamline the existing upload modal:

**Improvements:**
1. **Smart Defaults**: Pre-select most recent period, remember last-used Object
2. **Recent History**: Show "Recently Used" section at top of dropdowns
3. **Keyboard Shortcuts**: Tab through fields quickly
4. **URL Paste Detection**: Auto-focus URL field when modal opens

**Files to modify:**
- `src/components/filegrid/UploadDocumentModal.tsx` - Add smart defaults
- `src/hooks/useRecentSelections.ts` - Track user's recent choices (localStorage)

---

## Phase 5: Period-Based Batch Request Creation

Allow creating multiple PBC requests at once:

**User Experience:**
1. User clicks "Generate Requests from Template" in PBC view
2. Selects a Period
3. System auto-generates requests for all expected documents from templates
4. Shows preview: "12 requests will be created based on templates"
5. User confirms

**Files to create/modify:**
- `src/components/filegrid/GeneratePBCRequestsModal.tsx` - Batch creation wizard
- `src/hooks/useBatchPBCCreation.ts` - Bulk insert based on templates

---

## Technical Details

### Query Fix for PBC Items (Phase 1)

The current query:
```typescript
.select(`
  *,
  areas!inner(...),      // Fails if area missing
  periods!inner(label),  // Fails if period missing
  document_types!inner(name),  // Fails if doc type missing
  objects(name)          // OK - already left join
`)
```

Will be changed to verify all FK relationships exist for the test data and add proper error handling.

### Clone Period Logic (Phase 3)

```text
Source Period Documents → Copy to Target Period
  ├─ Reset status to "Draft"
  ├─ Update period_id to target
  ├─ Increment version if same object+docType exists
  └─ Preserve all other metadata
```

### Fulfill PBC Modal (Phase 2)

Pre-filled fields (read-only):
- Entity, Area, Document Type, Period, Object

User fills:
- External URL (required)
- Notes (optional)
- Status (default: Final)

---

## Outcome Summary

| Current Pain | Solution |
|-------------|----------|
| Must select 6+ fields each time | Pre-filled from PBC request or smart defaults |
| Repeat same work monthly | Clone Period copies previous month |
| PBC list empty | Fix query joins |
| No batch operations | Generate requests from templates |

---

## Implementation Order

1. **Fix PBC display** - Quick win, unblocks testing
2. **Fulfill PBC modal** - High impact for daily workflow
3. **Clone Period** - Reduces monthly repetition
4. **Smart defaults** - Incremental UX improvement
5. **Batch PBC generation** - Advanced admin feature

