

# FileGRID v1 — Implementation Plan

## Overview
A metadata-driven document coordination layer with enforced 4-level folder structure (Entity → Department → Process → Area), pivot views, and external file references. FileGRID indexes documents — it doesn't store them.

---

## Phase 1: Database Foundation & Authentication

### Core Tables (Supabase)
**Structural Tables:**
- `entities` — Admin-created organizational units
- `departments` — Controlled list (Finance, Legal, HR, Marketing, Ops)
- `processes` — Created from templates, linked to departments
- `areas` — Controlled list per process

**Document System:**
- `periods` — System-controlled (month/quarter/year/phase)
- `objects` — Reusable anchors (bank accounts, contracts, employees)
- `documents` — Core table with metadata + external_file_url
- `document_types` — Controlled reference list

**Scaffolding for v1.1:**
- `pbc_items` — Request list items (Requested → Uploaded → Reviewed → Complete)

### Reference Data
- Seed departments, document types, and area templates
- Process templates with expected document configurations

### Authentication & Roles
- Email/password login via Supabase Auth
- Role-based access: Admin, User, External Reviewer
- Entity-scoped data isolation via RLS policies

---

## Phase 2: Structure Explorer

### Left Panel — Folder Tree
- Collapsible 4-level hierarchy: Entity → Department → Process → Area
- Visual indicators showing document counts
- No "New Folder" button — only guided creation via controlled lists
- Clicking an Area loads its documents in the right panel

### Right Panel — Document List
- Table view with columns: Name, Object, Period, Status, Type, Updated
- Status badges with color coding (Draft, Final, Superseded, Archived)
- Click to open external file URL in new tab
- Hover for quick metadata preview

### Guided Creation Flows
- **Admin only**: Create new Entity
- **Template-based**: Create Process from predefined templates
- **Controlled list**: Add Area from master list for that Process

---

## Phase 3: Upload Flow & Naming Engine

### Upload Modal (Context-Aware)
When user clicks "Upload" within an Area:
1. **Auto-inferred**: Entity, Department, Process, Area (from current location)
2. **User selects**:
   - Object (search existing or create new — with reuse prompt)
   - Period (dropdown of system periods)
   - Document Type (from allowed types for this Area)
   - Status (Draft / Final)
3. **Paste**: External file URL (SharePoint/Drive link)

### Naming Logic (System-Controlled)
- **Logical Name**: `<Object>_<DocumentType>` — generated once, immutable
- **Rendered Filename**: `<Object>_<DocumentType>_<Period>_<Status>` — display only
- **Version**: Auto-incremented when same logical name uploaded again

### Rename Protection
- No direct filename editing
- Attempted rename shows soft block: "FileGRID manages naming automatically. Add notes instead."
- Notes field available for user context

---

## Phase 4: Pivot Views

### View Selector (Header Toggle)
Five predefined views — no custom pivots:

1. **By Period → Area → Object**
   - Primary view for monthly close
   - Group documents by time period first

2. **By Object → Period**
   - Track document history for a specific Object
   - Timeline view per bank account, contract, etc.

3. **By Area → Period**
   - Department-level review
   - All Banking docs across months

4. **By Document Type**
   - Cross-cutting view: all Reconciliations, all Invoices
   
5. **By Status (Final Only)**
   - Clean view of completed work
   - Ready for review/export

### Implementation
- Same `documents` table, different GROUP BY logic
- Maintains current Entity/Department context
- Collapsible groupings with document counts

---

## Phase 5: External Review View

### Toggle Mode
- Switch in header: "External Review Mode"
- Activates read-only interface

### Filters Applied
- `status = 'Final'` only
- Hide internal notes
- Hide Draft/Superseded/Archived documents

### Use Case
- Share with auditors without creating separate folders
- Clients see only finalized deliverables

---

## Phase 6: "What's Missing" View

### Gap Analysis Logic
- **Expected**: Documents defined in Process templates (e.g., Monthly Close requires Bank Rec, Journal Summary, Trial Balance)
- **Uploaded**: Documents matching those types for current Period
- **Missing**: Expected minus Uploaded

### Display
- Grouped by Period / Area / Object
- Checklist-style (✓ uploaded, ○ missing)
- No tasks, no assignments, no reminders

### Export
- Download as CSV for offline tracking

---

## Phase 7: PBC Request Lists (Scaffold)

### PBC Item Structure
- Links to: entity, period, process, area, object (optional), document_type
- Status flow: Requested → Uploaded → Reviewed → Complete

### Auto-Complete Logic
- When document uploaded matches PBC item criteria → status moves to "Uploaded"
- No manual task management

### UI
- Separate tab: "Requests"
- Filter by Period, status
- Basic list view (full features in v1.1)

---

## Phase 8: AI Metadata Assist (Scaffold)

### Upload Enhancement
- Optional toggle: "Suggest metadata from file"
- Placeholder for future OCR/regex integration

### Confirmation Flow
- Show suggested: Object, Period, Document Type
- Display confidence score
- User must confirm or edit — never auto-apply

---

## UI Design Approach

### Visual Style
- Clean, calm, professional
- Muted grays with accent colors for status
- No dashboard metrics or charts
- Tree navigation feels like a file explorer
- Dense but readable tables

### Layout
- **Left**: Fixed-width folder tree (collapsible)
- **Center**: Document list with pivot controls
- **Right**: Optional detail panel on selection

### Key Interactions
- Single-click to select, double-click to open external URL
- Keyboard navigation in tree
- Bulk select for status changes

---

## Technical Implementation

### Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, RLS)
- **State**: React Query for server state
- **Forms**: React Hook Form + Zod validation

### Data Integrity
- Foreign keys enforce Entity → Dept → Process → Area chain
- Check constraints prevent invalid status values
- Triggers auto-increment document versions
- RLS policies scope all queries to user's Entity

### Controlled Lists
- Departments, Areas, Document Types stored as reference tables
- Process templates define expected documents per Area
- No user-editable metadata schemas

---

## Build Sequence

### Sprint 1: Foundation
- Database schema + seed data
- Authentication + role setup
- Structure Explorer (tree + document list)

### Sprint 2: Core Workflows
- Upload flow with naming engine
- Object creation/reuse logic
- Version tracking

### Sprint 3: Pivot Views
- All 5 predefined views
- External Review mode toggle

### Sprint 4: Analysis & Polish
- "What's Missing" view
- PBC scaffold
- AI assist placeholder
- Rename protection messaging

