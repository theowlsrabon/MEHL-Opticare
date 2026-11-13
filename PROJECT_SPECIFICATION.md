# PROJECT SPECIFICATION
## Madina Eye Hospital Ltd. (MEHL) — OptiVision Optical ERP & Lab Management System

> **Assessment Purpose:** This document is a complete technical specification for rebuilding the MEHL OptiVision application from scratch. Engineers must deliver 100% functional parity using their own UI/UX design creativity while adhering to the exact tech stack described herein.
>
> **Two-Phase Structure:**
> - **Phase 1** — React + Vite Frontend with a Mock API service layer (no backend required).
> - **Phase 2** — Node.js + Neon PostgreSQL Backend wired to the Phase 1 frontend.

---

# PART 1: FRONTEND SPECIFICATION — React + Vite (Phase 1 Deliverable)

## 1. Tech Stack & Environment Setup

### 1.1 Required Stack

| Concern | Required Technology |
|---|---|
| Build Tool | Vite (v5+) |
| UI Framework | React 18 or 19 |
| Language | TypeScript |
| Styling | TailwindCSS v4 (utility-first; engineers choose their own design) |
| Icons | Google Material Symbols (via CDN link) OR Lucide React |
| Charts | Recharts |
| Barcode Rendering | react-barcode |
| QR Code Generation | qrcode (npm) |
| Camera/Barcode Scan | html5-qrcode or jsqr |
| Animations | motion (Framer Motion) |
| AI Integration (optional) | @google/genai (via backend proxy; no direct frontend API key) |

### 1.2 Project Folder Structure

`
/src
  /components        — All UI components and view modules
  /pages             — Top-level page wrappers (if using file-based routing)
  /services          — api.ts (Mock API layer in Phase 1; real fetch in Phase 2)
  /context           — React Context providers (Auth, Theme, Toast)
  /hooks             — Custom hooks (useAuth, useToast, useDarkMode, etc.)
  /data              — Mock/initial seed data files
  /utils             — Helper functions (print, barcode, formatting, SMS)
  /types             — All TypeScript interfaces (types.ts)
  index.css          — Global CSS + design tokens
  App.tsx            — Root component with view-switching router
  main.tsx           — ReactDOM.createRoot entry point
`

### 1.3 Vite Environment Variables (.env)

`env
VITE_API_BASE_URL=http://localhost:9000
VITE_APP_NAME=OptiVision MEHL ERP
VITE_GEMINI_API_KEY=   # Only used by backend proxy; leave empty in frontend
`

> **Rule:** All API calls must read VITE_API_BASE_URL as the base. In Phase 1, the mock service layer intercepts before any fetch is called.

### 1.4 Global UI Requirements

| Feature | Requirement |
|---|---|
| Responsive Layout | Full support for mobile (< 768px), tablet, and desktop |
| Dark / Light Mode | Must support both. Toggle persisted in localStorage |
| Language Toggle | Bengali (BN) / English (EN) — UI text switches globally |
| Toast Notifications | Non-blocking toast system for all mutation actions (success, error, info, warning) |
| Loading States | Skeleton loaders or spinners on all async data-fetched areas |
| Empty States | Illustrated empty-state message whenever a list/table has no data |
| Error States | Inline error banners or toast on failed API calls |
| Scroll Restoration | Top-of-page scroll on view navigation |
| Print Support | All print-trigger buttons must call window.print() on a designated DOM id with print-only CSS |

---

## 2. Routing & Navigation Architecture

Navigation is managed via a single currentView string state in App.tsx. All "routes" are conditional renders within the main layout. Engineers may implement this as a router (React Router v6) or as the same string-switch pattern.

### 2.1 View Registry (All Application Views)

| View ID | Display Name | Access Level | Navigation Origin |
|---|---|---|---|
| executive-dashboard | Executive Dashboard | Admin / Branch Manager | Sidebar, Login default |
| lab-pipeline | Lab Glazing Conveyor Queue | Lab Tech, Admin | Sidebar |
| modina-erp | Unified POS & Sales ERP | Cashier, Admin | Sidebar |
| stock-master | Stock & Frames Master Registry | Admin, Lab Tech | Sidebar |
| pos-terminal | Full POS Terminal (standalone) | Cashier, Admin | Sidebar |
| prescriptions | Diagnostic Prescriptions | Doctor, Optometrist, Admin | Sidebar |
| multi-branch-ibt | Inter-Branch Stock Transfer | Branch Manager, Admin | Sidebar |
| supplier-grn | Suppliers & GRN | Admin | Sidebar |
| financial-accounting | Profit Analytics & P&L | Admin | Sidebar |
| returns-refunds | Returns, Refunds & Credit Notes | Admin, Cashier | Sidebar |
| due-collections | Due Collections & Customer Ledger | Cashier, Admin | Sidebar |
| reports | Workshop Analytics & Telemetry | Admin, Lab Tech | Sidebar |
| salesmen | Sales Staff & Commission Ledgers | Admin | Sidebar |
| settings-roles | Settings, Role Permissions & Audit | Admin only | Sidebar |
| ai-glazing | AI Glazing Assistant (Modal) | Admin, Lab Tech | Overlay modal |
| ai-eyewear | AI Virtual Eyewear Studio (Modal) | Admin | Overlay modal |

### 2.2 Access Control Model

- **Public Route:** Only the LoginPage is public. All other views require an authenticated session.
- **Session Storage:** On login, the user object is saved to sessionStorage under key mehl_session_user. On page refresh, app reads this key first; if valid, skips login.
- **View-Level Access:** Each UserAccount has an allowedViews: ViewMode[] array. Sidebar only shows items in the current user's allowedViews.
- **Role-Level Permissions:** Fine-grained controls (canAdvanceStages, canViewPurchaseCost, canEditInventory) come from the UserProfile.permissions object resolved from the user's role.
- **Admin Protection:** The admin role always has access to all views and all permissions.

### 2.3 Navigation Structure

- **Sidebar Navigation (SideNavBar/menubar):** Collapsible on mobile/pc. Contains grouped icon+label nav items. Active item is visually highlighted. Shows hospital logo at top, user profile info at bottom.
- **Top Navigation Bar (TopNavBar):** Contains: current view title, breadcrumb subtitle, notification bell (dropdown with actionable alerts), language toggle (EN/BN), dark/light mode toggle, global search bar (jobs/patient/SKU), user avatar + logout button.
- **Floating Action Buttons:** F4 key triggers Quick Barcode Scan; camera icon triggers live camera barcode scanner.

---

## 3. Page-by-Page & Module Breakdown

---

### 3.1 Login Page

**Purpose:** Authenticate users with username + password before granting access to any view.

**Displayed Data Elements:**
- Hospital name and logo
- "OptiVision" product branding
- Login form (username + password)
- Demo credential hints below the form (for evaluation)

**Form Fields & Validation:**
- username — text input; required; minimum 3 characters; trimmed
- password — password input (masked); required; minimum 6 characters
- Login button — submits credentials; disabled while loading
- Inline error alert on wrong credentials or inactive account

**User Flows:**
1. Fill username + password → click Login → POST /api/auth/login
2. On success: save user to sessionStorage → navigate to executive-dashboard
3. On 401: display "Invalid username or password" inline alert
4. On 403 (inactive): display "This account is inactive. Contact admin" alert
5. On network error: display "Server unreachable. Retrying…" with retry option

**UI States:** Default → Submitting (spinner, fields disabled) → Error (inline alert) → Success (fade → redirect)

---

### 3.2 Executive Dashboard (executive-dashboard)

**Purpose:** High-level operational overview for management — key metrics, quick actions, branch statuses, IBT summaries.

**Displayed Data Elements:**
- Metric Card 1: Total lab jobs in pipeline (count) with stage breakdown
- Metric Card 2: Pending due collections total (outstanding receivables in BDT)
- Metric Card 3: Lab Glazing QC Pass Rate (calculated or static metric)
- Metric Card 4: Multi-branch IBT Orders pending approval (count)
- Branch Status Grid: Cards for each HospitalBranch (name, type, status badge, staff count, open trays count, total stock units)
- Quick Action Cards: Navigable tiles (Stock Master, IBT, Reports)
- Financial Summary Strip: Gross optical revenue, consultation revenue

**Interactive Components:**
- Branch cards clickable → navigate to multi-branch-ibt
- Quick action tiles → navigate to respective views
- Metric cards may have "View All" link

---

### 3.3 Lab Glazing Conveyor Queue (lab-pipeline)

**Purpose:** Track optical glazing jobs through a 5-stage production conveyor. Lab techs advance jobs, trigger SMS at Stage 5, and view job details.

**Sub-Modes:**
- Conveyor View (default): 5-column Kanban board by stage
- Telemetry View: machine performance analytics (velocity charts, wheel wear, spoilage rates)

**Conveyor View — Displayed Data:**
- 5 stage columns: 1.Rx Verification → 2.Lens Pulling → 3.Edger Queue → 4.QC Inspection → 5.Ready for Pickup
- Each job card: job code, tray number, patient name, frame name, urgency badge (Rush/Standard), due amount, SMS status badge, action buttons
- Stage column counters (e.g., "3 jobs in Stage 2")
- Filter bar: urgency (All/Rush/Standard), stage filter (All/Ready/Pending)
- Free-text search: patient name or job code

**Interactive Components:**
- Stage Advance Button: advances job to next stage; appends StageAuditEntry; at Stage 5 prompts SMS modal
- Job Detail Button: opens JobDetailModal (full Rx, audit trail, lens/frame specs)
- SMS Send Button (Stage 5 cards): opens SmsNotificationModal pre-filled with job data
- Create Lab Tray Button: opens CreateLabTrayModal
- Print Tray Barcode Button: opens PrintTrayBarcodesModal
- Quick Scanner Button: opens QuickScannerModal to look up a job by barcode
- Restock Button: triggers inventory restock flow

**Stage Advancement Flow:**
1. Tech clicks advance → handleAdvanceJob(jobId) called
2. job.stage increments; StageAuditEntry appended to job.auditTrail
3. If advancing TO Stage 5: toast prompts "Send SMS" action
4. On Stage 5 SMS sent: job.smsNotificationStatus → 'sent' → 'delivered'

**Stage 5 Check-In (Pickup) Flow:**
1. Cashier scans QR or enters job code → handleHandoverClose(jobId)
2. Job: isCheckedIn=true, checkInTimestamp set; removed from active board

**Telemetry View — Displayed Data:**
- Hourly velocity chart (bar or line)
- Diamond wheel wear percentage gauge
- Lens spoilage/rejection rate
- Edger uptime %
- KPI cards: total glazed today, avg cycle time, QC pass rate

---

### 3.4 Unified POS & Sales ERP (modina-erp)

**Purpose:** Primary point-of-sale for optical retail. Capture patient info, build a sales order, apply discounts, assign salesman, process payment, print invoice.

**Step-Based Vertical Workflow:**

| Step | Name | Description |
|---|---|---|
| 1 | Patient & Rx Info | Patient name, phone, doctor, optional Rx (OD/OS Sph/Cyl/Axis/Add/PD) |
| 2 | Frame Selection | Scan or enter frame SKU; auto-fills frame name, brand, price, cost cipher |
| 3 | Lens Selection | Pick lens category, index, coating; calculates lens price |
| 4 | Pricing & Discount | Subtotal, apply discount (% or fixed), advance payment, shows remaining due |
| 5 | Salesman & Payment | Assign salesman (dropdown), select payment method (Cash/bKash/Card/Nagad), confirm |
| 6 | Invoice Preview & Print | Final invoice; buttons: Print, WhatsApp Share, Create Lab Tray |

**Top-Right Quick Actions (compact icon buttons):**
- Camera Scan — activates floating live camera barcode reader
- Quick Barcode— opens QuickScannerModal
- Quick Scan — alternate scanner trigger

**Form Validation:**
- patientName — required; min 2 characters
- patientPhone — required; BD format: 01[3-9][0-9]{8}
- Frame SKU — triggers auto-fill from inventory; error if SKU not found
- Discount — 0–100 if %; must not exceed subtotal if fixed amount
- Advance payment — 0 to gross total
- Salesman — required; from salesmen list
- Payment method — required; one of Cash/bKash/Card/Nagad
- Submit Sale — disabled until all required fields are valid

**On Confirm:** SaleRecord created; salesmen state updated; sale synced via POST /api/sales; invoice rendered; optionally opens CreateLabTrayModal pre-filled.

---

### 3.5 Stock & Frames Master Registry (stock-master)

**Purpose:** Manage optical inventory (frames, lenses, contact lenses, accessories). View stock levels, search/filter, add items, print barcodes, trigger restocks.

**Displayed Data:**
- Table columns: SKU, Name, Brand, Category, Stock Qty, Min Threshold, Status Badge (Healthy/Low/Critical), Sell Price, Storage Bin, Actions
- Summary metrics: Total Items, Low Stock Count, Critical Stock Count, Total Inventory Value
- Status badges: Healthy=green, Low=amber, Critical=red
- Hover on row reveals wholesale cost cipher (if canViewPurchaseCost permission)

**Interactive Components:**
- Search Bar — filter by SKU, name, or brand (inline clear × button)
- Category Filter Dropdown — dynamic; all unique categories in inventory
- Brand Filter Dropdown — dynamic; all unique brands
- Status Filter Toggle — All / Healthy / Low / Critical
- Sort Controls — sortable columns (name, stock qty, category)
- + Add New Item Button — opens AddGlassesStockModal
- Print Barcode Button (per row) — opens OpticalBarcodePrintModal
- + Restock Button (per row, always visible) — opens inline qty input; increments stockQty; syncs to backend
- Bulk Barcode Print Button — opens BatchBarcodePrintModal

**Add New Item Modal Fields:**
- SKU (auto-generated or manual) — required, unique
- Item Name — required
- Brand — required
- Category — required; one of: Optical Frame / Finished Lens / Premium Frame / Contact Lens / Accessories
- Specs / Description
- Optical Specs (lens index, coating)
- Stock Quantity — required; integer >= 0
- Min Threshold (reorder point) — required; integer >= 0
- Cost Price — required; decimal >= 0
- Selling Price — required; decimal >= 0; must be >= cost price
- Storage Bin (e.g., A-04, Shelf 3)
- Color, Frame Size, Frame Material (optional, for frames)
- Admin Cost Code (hidden; only for canViewPurchaseCost roles)

**Restock Flow:** + Restock → inline qty input → confirm → handleRestock(itemId, qty) → stockQty incremented → status recalculated → POST /api/inventory

**Barcode Print Modal:** Shows barcode128 preview for item SKU; optional butterfly/dumbbell tag layout; print button triggers window.print()

---

### 3.6 Diagnostic Prescriptions (prescriptions)

**Purpose:** View, inspect, and print ophthalmic prescription slips. Launch AI Glazing Assistant.

**Displayed Data:**
- Responsive grid of prescription cards (3 columns desktop, 1 mobile)
- Each card: Rx Number, Exam Date, Patient Name, Age, Gender, Referring Doctor
- Compact OD/OS table: Sph, Cyl, Axis, Add per eye; PD values; Visual Acuity
- Clinical Recommendations (truncated)

**Interactive Components:**
- Inspect Slip Button (per card) — opens full prescription detail modal
- AI Lab Audit & Glazing Check Button (top bar) — opens AIGlazingAssistantModal

**Prescription Detail Modal:**
- Full OD/OS table (Sph, Cyl, Axis, Add, PD, VA)
- Clinical Recommendations text
- IOP Tonometry values (OD/OS, if present)
- Print Rx Slip Button — printElementById('prescription-printable-slip')

---

### 3.7 Due Collections & Customer Ledger (due-collections)

**Purpose:** Track and collect outstanding customer dues. Process partial/full payments, apply counter discounts, send SMS reminders.

**Displayed Data:**
- Top Summary Metrics (4 cards):
  1. Total Outstanding Due (sum of all remainingDue)
  2. Collected Today (sum of payments today)
  3. Overdue Invoices (count where daysOverdue > 0)
  4. Ready-to-Deliver Trays (Stage 5 job count)
- Invoice List (left): Invoice #, Patient Name, Phone, Gross Bill, Paid, Remaining Due, Days Overdue badge
- Active Invoice Detail Panel (right):
  - Items table: Item Name, SKU, Category, Rate, Discount %, Qty, Net Total
  - Payment summary: Subtotal, Gross Bill, Previously Paid, Remaining Due
  - Counter Discount / Waiver input
  - Payment method selector (Cash/bKash/Card/Nagad)
  - Collection Amount input
  - Collect Payment Button; Send SMS Reminder Button
- Recent Collections Audit Table (bottom): Invoice #, Patient, Amount, Method, Date/Time

**Validation:**
- Collection Amount: numeric; 0 < amount <= remainingDue
- Counter Discount: 0 <= discount <= remainingDue
- Collect Payment: disabled if amount is 0 or invalid

**Payment Collection Flow:**
1. Select invoice → detail panel fills
2. Optionally apply counter discount → net due recalculates
3. Enter amount + method → Collect
4. paidAmount increments; remainingDue decrements; if 0 → status='paid'
5. Transaction appended to audit table; success toast: "৳X collected from [Patient]"

**New Invoice Modal Fields:** Patient Name, Phone, invoice items (name/category/rate/qty/discount rows), Gross Total (auto), Previous Payment, Remaining Due (auto)

---

### 3.8 Analytics & Workshop Telemetry (reports)

**Purpose:** Performance analytics — salesman commission reports, item-wise sales velocity, machine telemetry.

**Tabs:**
1. Salesman Performance: per-salesman table (name, total sales count, volume BDT, commission earned, target vs actual progress bar)
2. Item-Wise Sales Velocity: top 10 bar chart + table (SKU, Name, Units Sold, Revenue, Avg Margin %)
3. Lab Machine Telemetry: KPI cards (glazed count, edger uptime %, spoilage rate, wheel cycles remaining)

**Interactive Components:**
- Date Range Filter — month/year for report period
- Export PDF Button — SalesmanPdfReportModal → browser print
- Navigate to Salesmen / Navigate to Stock buttons

---

### 3.9 Salesman & Commission Management (salesmen)

**Purpose:** Manage sales team roster, track performance, update commission rates, toggle active/inactive.

**Displayed Data:** Salesman cards/rows — Name, Employee ID, Phone, Commission %, Monthly Target, Total Sales Volume, Status badge; Commission earned this month (calculated from salesRecords).

**Interactive Components:**
- Add Salesman Button — form: Name (req), Employee ID (req, unique), Phone (req, BD format), Commission % (req, 0-100), Monthly Target BDT (req), Password (optional)
- Edit Button (per salesman) — pre-fills form
- Toggle Status Button — Active <-> Inactive with confirmation
- View Performance Button — navigates to reports filtered for that salesman

---

### 3.10 Inter-Branch Stock Transfer (multi-branch-ibt)

**Purpose:** Manage stock transfers between branches and central glazing lab.

**Tabs:**
1. IBT Orders — list with status timeline
2. Branch Registry — all HospitalBranch records with add/edit

**IBT Orders Tab — Displayed Data:**
- Table: Transfer #, Source Branch, Destination Branch, Status badge, Priority, Items Count, Total Value BDT, Created At, Actions
- Status timeline: Requested → Approved → In Transit → Received / Rejected
- Gate Pass Number displayed when in transit

**IBT Order Detail Modal:**
- Items sub-table: SKU, Name, Category, Requested/Approved/Dispatched/Received Qty, Unit Cost
- Courier/carrier info; Remarks; Action buttons by current status

**Create New IBT Form:** Source Branch, Destination Branch (must differ), Priority (Routine/Urgent/Emergency OT), Items rows (SKU, Name, Category, Qty, Unit Cost), Remarks — all required; at least 1 item

**Status Transitions:**
- Approve (requested → approved): sets approvedQty per item
- Dispatch (approved → in_transit): requires Gate Pass Number input
- Mark Received (in_transit → received): records receivedQty per item
- Reject (requested or approved → rejected)

**Branch Registry Tab:** Grid of branch cards (name, type badge, location, phone, incharge, status); Add Branch form (name, bangla name, location, phone, email, incharge name, branch type, status); Edit Branch button.

---

### 3.11 Supplier Management & GRN (supplier-grn)

**Purpose:** Manage vendor directory, create POs, record goods received with QC inspection.

**Tabs:** Suppliers / Purchase Orders / GRN Register

**Suppliers Tab:** Supplier cards/rows (code, name, category, contact person, phone, email, payment terms days, rating stars, total purchased BDT, active orders count); Add Supplier / Edit Supplier forms.

**Purchase Orders Tab:** PO list (PO #, Supplier, Date, Expected Delivery, Status badge, Total Amount, Payment Status); Create PO form (Supplier dropdown, Expected Delivery Date, Items rows: name/category/ordered qty/unit price — total auto-calculated); PO Status: Draft→Approved→Dispatched→Partially Received→Completed.

**GRN Tab:** GRN list (GRN #, PO #, Supplier, Received Date, Inspector, QC Status badge); Create GRN form linked to PO: Challan Number, Received Date, Inspected By, per-item (received/accepted/rejected qty, unit cost, batch number, expiry date), QC Status (Passed/Partial Pass/Rejected), warehouse location, notes.

---

### 3.12 Financial Accounting & P&L (financial-accounting)

**Purpose:** View monthly income/expense statements, gross profit, brand margin breakdowns, optical revenue composition.

**Displayed Data:**
- Revenue Summary: Gross Optical Revenue, Consultation Revenue, Total Revenue
- COGS: Optical Lens & Material COGS, Total COGS
- Profit Metrics: Gross Profit (BDT + %), Net Operating Profit, Profit Margin %
- Cash Flow: Cash Collected, Digital Payments, Outstanding Receivables
- Expense Register Table: Voucher #, Date, Category, Description, Amount, Payment Mode, Paid To, Approved By
- Brand Margin Table: Brand, Category, Cost Price (masked), Selling Price, Margin %, Tier
- Cost Cipher Toggle: reveal/hide wholesale costs (requires canViewPurchaseCost); logs audit entry

**Add Expense Form Fields:** Voucher Number (auto or manual), Date (req), Category (req; select), Description (req), Amount BDT (req; > 0), Payment Mode (req), Paid To (req), Approved By (req)

---

### 3.13 Returns, Refunds & Credit/Debit Notes (returns-refunds)

**Purpose:** Process customer sales returns and supplier purchase returns. Generate credit notes and debit notes.

**Tabs:** Sales Returns (Customer) / Purchase Returns (Supplier)

**Sales Returns Tab:** Table (Return #, Original Invoice #, Date, Patient, Return Type, Total Refund, Method, Status); Create Sales Return form: Original Invoice # (req), Patient Name (req), Phone (req), Return Type (req: Warranty Defect/Power Recheck Change/Frame Discomfort/Wrong Color), items rows (name, type, reason, qty, original price, refund amount, disposition: Restock/Quarantine/Send to Vendor), Refund Method (req: Credit Note/Cash Refund/bKash Reversal/Exchange), Credit Note # (auto if Credit Note), Processed By + Authorized By (req). Status: Pending → Approved → Completed.

**Purchase Returns Tab:** Table (Debit Note #, Supplier, Date, Reason, Total Claim, Status); Create Purchase Return form: Supplier (dropdown), Date, Reason (Near Expiry/Damaged on Arrival/Edging Coating Peel/Wrong Specification), items rows (name, batch #, qty, unit cost, total claim), Remarks. Status: Submitted → Accepted by Supplier → Credit Adjusted.

---

### 3.14 Settings, Role Permissions & Security Audit (settings-roles)

**Purpose:** Manage role-based access, system config parameters, and view security audit trail.

**Sections:**
1. Role Permission Matrix: cards for Admin, Doctor, Optometrist, Lab Tech, Cashier, Branch Manager — each shows read-only permission toggles: canAdvanceStages, canCollectDues, canEditInventory, canCreateRx, canProcessPOS, canViewFinancials, canViewPurchaseCost, canDispatchTrays, canUseAI, canApproveIBT, canProcessReturns, canManageSuppliers, canConfigureSettings
2. System Configuration: Hospital Name, Lens Reorder Threshold (days), Enable SMS Pickup Notification (toggle), Enable Auto Tray Conveyor Dispatch (toggle), Primary Currency Symbol (default: BDT symbol), Secret Cipher Key (masked, admin only)
3. Security Audit Log Table (read-only): Timestamp, User, Role, Action Type, Details, IP Address, Status badges (Success/Flagged/Denied). Action types: ROLE_SWITCH / COST_CIPHER_REVEAL / IBT_DISPATCH / CREDIT_NOTE_ISSUED / PRICE_MODIFIED / BACKUP_CREATED

---

### 3.15 User Accounts Manager

**Purpose:** Admin-only panel for creating, editing, and deactivating system user accounts.

**Displayed Data:** Table — Username, Full Name, Role, Role Title, Allowed Views (count), Status, Created At.

**Interactive Components:**
- Add User form: Username (req, unique, alphanumeric+underscore), Password (req, min 6 chars), Full Name (req), Role (req; dropdown: admin/staff/doctor/optometrist/lab_tech/cashier/pharmacist/branch_manager), Role Title (free text, req), Allowed Views (multi-select checklist of ViewMode values), Status (Active/Inactive)
- Edit User — pre-fills all; password field shows "leave blank to keep existing" placeholder
- Delete User — confirmation dialog; admin account cannot be deleted (server prevents)
- Toggle Status — Active <-> Inactive

**Validation:** Username uniqueness checked client-side; password min 6 chars on create; optional on edit; at least one allowedView required.

---


### 3.18 SMS Notification Center Modal

**Purpose:** Send SMS pickup notifications for Stage 5 jobs. View SMS dispatch history.

**Tabs:** Send SMS / SMS History

**Send SMS Tab:**
- Job selector (searchable dropdown of Stage 5 jobs; auto-selected if launched from a job card)
- Selected job preview: tray number, patient name, phone, frame name, due amount
- Language toggle: English/Bengali (switches message template)
- Drawer location input
- Custom message override (optional; pre-fills with template)
- Message character counter (shows SMS parts count)
- Send SMS Button — POST /api/notifications/sms

**SMS History Tab:** Table (Message ID, Job Code, Patient, Phone, Status badge, Gateway, Cost BDT, Dispatched At, Language); Gateway balance indicator; Delivery success rate.

**Flow:** Select job → message auto-populates → optionally edit → Send → entry added to history tab; job.smsNotificationStatus → 'delivered'

---

### 3.19 Job Detail Modal

**Purpose:** Comprehensive overlay for a single optical job — Rx, frame/lens specs, audit trail, payment info, edger instructions.

**Displayed Data:**
- Job code, tray number, patient name/phone, referring doctor
- Full Rx summary (OD/OS Sph/Cyl/Axis/Add/PD)
- Frame name, lens name, bevel type, assigned technician
- Axis status badge (Passed/Pending/Failed), QC checks (scratch, power verification)
- Payment: total amount, advance paid, due amount
- Current stage and progress indicator
- Urgency badge (Rush/Standard), estimated delivery time
- Full stage audit trail table: Timestamp, Stage From→To, Actor, Action, Notes
- SMS notification status and last sent time

**Interactive Components:** Advance Stage, Send SMS, Print Job Card, Print QR Code, AI Glazing Check, Close.

---

### 3.20 Quick Scanner Modal

**Purpose:** Scan or manually enter barcode/job code to locate a job or inventory item.

**Displayed Data:** Camera viewfinder (if camera mode), last scanned barcode, lookup result (job card preview OR inventory item preview), recent scan history (last 10).

**Interactive Components:**
- Camera Toggle Button — starts/stops camera feed
- Manual Barcode Input — text field; Enter triggers lookup
- Jump to Job Button — if barcode matches job code, navigates to that job in lab pipeline
- Jump to Inventory Button — if matches SKU, scrolls to that item in stock master

---

### 3.21 Create Lab Tray Modal

**Purpose:** Create a new optical glazing job/tray. Launched from POS after a sale or independently.

**Form Fields:**
- Patient Name (req), Patient Phone (req; BD format), Referring Doctor
- Frame Name (req), Lens Name (req)
- Rx Summary (free text, e.g., "OD -3.50/-1.25x85, OS -3.25/-1.00x95 Add +2.00")
- Tray Number / Drawer Location (req; alphanumeric; must be unique among active jobs)
- Urgency (req; Rush/Standard)
- Advance Paid BDT (req; >= 0), Total Amount BDT (req; >= advance paid)
- Bevel Type (optional; Full/Half/Grooved/Drill)
- Salesman (dropdown, optional), Notes

**On Submit:** New OpticalJob created with stage:1; added to jobs state; synced via POST /api/jobs.

---

### 3.22 POS Terminal Standalone (pos-terminal)

**Purpose:** Alternative traditional register layout — product panel left, cart right.

**Displayed Data:** Product grid (inventory items) with search and category tabs; Shopping cart with selected items, quantities, prices; Order total, discount, payment section.

**Interactive Components:** Product search, category filter tabs, add to cart (click item), qty +/- in cart, discount input, payment method selector, Complete Sale Button (creates SaleRecord, clears cart).

---

## 4. Mock Data Contracts & Service Layer

### 4.1 Service Layer Architecture

Create /src/services/api.ts with all functions returning Promise<T> so Phase 2 is a drop-in replacement.

`	ypescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';
// Phase 1: return mock data  |  Phase 2: replace with fetch()
`

### 4.2 Complete Mock API Service Functions

`	ypescript
// AUTH
export const login = (username: string, password: string): Promise<LoginResponse>
// JOBS
export const getJobs = (): Promise<ApiListResponse<OpticalJob>>
export const upsertJob = (job: OpticalJob): Promise<ApiActionResponse>
export const deleteJob = (id: string): Promise<ApiActionResponse>
export const bulkSyncJobs = (jobs: OpticalJob[]): Promise<ApiActionResponse>
// INVENTORY
export const getInventory = (): Promise<ApiListResponse<InventoryItem>>
export const upsertInventoryItem = (item: InventoryItem): Promise<ApiActionResponse>
// SALES
export const getSales = (): Promise<ApiListResponse<SaleRecord>>
export const recordSale = (sale: SaleRecord): Promise<ApiActionResponse>
// SALESMEN
export const getSalesmen = (): Promise<ApiListResponse<Salesman>>
export const upsertSalesman = (s: Salesman): Promise<ApiActionResponse>
// USERS
export const getUsers = (): Promise<ApiListResponse<UserAccount>>
export const createUser = (user: UserAccount): Promise<ApiSingleResponse<UserAccount>>
export const updateUser = (id: string, user: Partial<UserAccount>): Promise<ApiActionResponse>
export const deleteUser = (id: string): Promise<ApiActionResponse>
// SMS
export const sendSmsNotification = (payload: SmsPayload): Promise<SmsResponse>
export const getSmsLogs = (): Promise<SmsLogsResponse>
// AI
export const aiGlazingAnalysis = (payload: GlazingPayload): Promise<AiTextResponse>
export const aiGenerateImage = (payload: ImageGenPayload): Promise<AiImageResponse>
export const aiEditImage = (payload: ImageEditPayload): Promise<AiImageResponse>
// DB STATUS
export const getDbStatus = (): Promise<DbStatusResponse>
`

> Phase 2 Instruction: Replace each mock function body with fetch(BASE_URL + endpoint) calls matching exact paths in Part 2 Section 4. No UI component code changes required.


---

# PART 2: BACKEND SPECIFICATION — Node.js + Neon PostgreSQL (Phase 2 Deliverable)

## 1. Tech Stack & Environment Setup

### 1.1 Required Stack

| Concern | Required Technology |
|---|---|
| Runtime | Node.js v20+ |
| Framework | Express.js v4 |
| Language | TypeScript (ts-node or tsx for dev) |
| Database Driver | @neondatabase/serverless (pg-compatible pool) |
| Auth | Session-based OR JWT (stateless) — engineer's choice |
| Password Hashing | bcrypt (min 10 rounds) |
| AI Proxy | @google/genai (Gemini 2.5 Flash) |
| SMS Gateway | BDBULKSMS REST API (or any BD SMS gateway) |
| CORS | cors npm package |
| Body Parser | express.json() built-in |
| Environment | dotenv |

### 1.2 Environment Variables (.env)

`env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
GEMINI_API_KEY=your-gemini-api-key
BDBULKSMS_API_KEY=your-sms-api-key
BDBULKSMS_SENDER_ID=OPTIVISION
SESSION_SECRET=change-this-to-a-random-secret
PORT=9000
NODE_ENV=production
`

### 1.3 Project Folder Structure

`
/
  server.ts            — Express app entry; all routes registered here
  serverDb.ts          — Neon pool, repository functions per table
  schema_neon.sql      — Full DB migration SQL
  /controllers         — Business logic per domain (optional; can be inline)
  /middleware          — auth.ts, error.ts, rateLimiter.ts
  /utils               — smsService.ts, aiService.ts, cipherUtils.ts
  .env
  package.json
  tsconfig.json
`

---

## 2. Database Schema (Neon PostgreSQL)

All tables use UUID primary keys, JSONB for complex nested data, and updated_at auto-updated via trigger.

### 2.1 Table: optical_jobs

`sql
CREATE TABLE optical_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data            JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
`

**JSONB data shape (OpticalJob):**
`	ypescript
{
  id: string;                // UUID
  jobCode: string;           // e.g., "MH-2506-0042"
  trayNumber: string;        // e.g., "T-14"
  patientName: string;
  patientPhone: string;
  referringDoctor?: string;
  frameName: string;
  lensName: string;
  rxSummary: string;         // Free text Rx description
  stage: 1 | 2 | 3 | 4 | 5;
  urgency: 'Rush' | 'Standard';
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  salesman?: string;
  assignedTechnician?: string;
  bevelType?: 'Full' | 'Half' | 'Grooved' | 'Drill';
  isCheckedIn: boolean;
  checkInTimestamp?: string;
  smsNotificationStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  axisStatus?: 'Passed' | 'Pending' | 'Failed';
  estimatedDelivery?: string;
  notes?: string;
  auditTrail: StageAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

type StageAuditEntry = {
  timestamp: string;
  stageFrom: number;
  stageTo: number;
  actor: string;
  action: string;
  notes?: string;
}
`

### 2.2 Table: inventory_items

`sql
CREATE TABLE inventory_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data            JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
`

**JSONB data shape (InventoryItem):**
`	ypescript
{
  id: string;
  sku: string;                // Unique; e.g., "MH-FR-0042"
  name: string;
  brand: string;
  category: 'Optical Frame' | 'Finished Lens' | 'Premium Frame' | 'Contact Lens' | 'Accessories';
  description?: string;
  opticalSpecs?: string;
  stockQty: number;
  minThreshold: number;
  costPrice: number;
  sellingPrice: number;
  storageBin?: string;
  color?: string;
  frameSize?: string;
  frameMaterial?: string;
  adminCostCode?: string;     // Masked cipher; only shown to canViewPurchaseCost roles
  status: 'Healthy' | 'Low' | 'Critical';  // Derived: qty >= min+buffer=Healthy; qty < min=Low; qty=0=Critical
  createdAt: string;
  updatedAt: string;
}
`

### 2.3 Table: sales_records

`sql
CREATE TABLE sales_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data            JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
`

**JSONB data shape (SaleRecord):**
`	ypescript
{
  id: string;
  invoiceNumber: string;      // e.g., "INV-2506-0099"
  patientName: string;
  patientPhone: string;
  referringDoctor?: string;
  rx?: PrescriptionRx;        // Optional Rx data embedded
  frameId?: string;
  frameName?: string;
  frameSku?: string;
  lensName?: string;
  lensCategory?: string;
  subtotal: number;
  discount: number;
  discountType: 'percent' | 'fixed';
  grossTotal: number;
  advancePaid: number;
  remainingDue: number;
  paymentMethod: 'Cash' | 'bKash' | 'Card' | 'Nagad';
  salesman: string;
  salesmanId: string;
  status: 'paid' | 'partial' | 'due';
  items: SaleItem[];
  daysOverdue: number;
  collectionHistory: CollectionEntry[];
  createdAt: string;
  updatedAt: string;
}

type SaleItem = {
  name: string;
  sku?: string;
  category: string;
  rate: number;
  discountPercent: number;
  qty: number;
  netTotal: number;
}

type CollectionEntry = {
  timestamp: string;
  amount: number;
  method: string;
  counterDiscount?: number;
  collectedBy: string;
}
`

### 2.4 Table: salesmen

`sql
CREATE TABLE salesmen (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data            JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
`

**JSONB data shape (Salesman):**
`	ypescript
{
  id: string;
  name: string;
  employeeId: string;         // Unique
  phone: string;
  commissionPercent: number;
  monthlyTarget: number;
  totalSalesVolume: number;   // Updated on each sale
  status: 'Active' | 'Inactive';
  password?: string;          // Hashed if present (for salesman login)
  createdAt: string;
  updatedAt: string;
}
`

### 2.5 Table: sms_logs

`sql
CREATE TABLE sms_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data            JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
`

**JSONB data shape (SmsLog):**
`	ypescript
{
  id: string;
  messageId: string;          // Gateway-returned message ID
  jobCode: string;
  patientName: string;
  patientPhone: string;
  message: string;
  language: 'en' | 'bn';
  status: 'sent' | 'delivered' | 'failed';
  gateway: string;
  costBDT?: number;
  dispatchedAt: string;
}
`

### 2.6 Table: user_accounts

`sql
CREATE TABLE user_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data            JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
`

**JSONB data shape (UserAccount):**
`	ypescript
{
  id: string;
  username: string;           // Unique; alphanumeric + underscore
  passwordHash: string;       // bcrypt hash; NEVER returned to frontend
  fullName: string;
  role: 'admin' | 'staff' | 'doctor' | 'optometrist' | 'lab_tech' | 'cashier' | 'pharmacist' | 'branch_manager';
  roleTitle: string;          // Display title (e.g., "Senior Lab Technician")
  allowedViews: ViewMode[];   // List of accessible view IDs
  permissions: UserPermissions;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

type UserPermissions = {
  canAdvanceStages: boolean;
  canCollectDues: boolean;
  canEditInventory: boolean;
  canCreateRx: boolean;
  canProcessPOS: boolean;
  canViewFinancials: boolean;
  canViewPurchaseCost: boolean;
  canDispatchTrays: boolean;
  canUseAI: boolean;
  canApproveIBT: boolean;
  canProcessReturns: boolean;
  canManageSuppliers: boolean;
  canConfigureSettings: boolean;
}
`

### 2.7 Additional Tables (Extend as Required)

| Table | Purpose |
|---|---|
| ibt_orders | Inter-branch transfer order records (JSONB) |
| suppliers | Supplier directory records (JSONB) |
| purchase_orders | PO records linked to suppliers (JSONB) |
| grn_records | Goods Received Notes linked to POs (JSONB) |
| expense_records | Financial expense vouchers (JSONB) |
| return_records | Sales & purchase return records (JSONB) |
| branch_registry | Hospital branch records (JSONB) |
| system_config | Key-value system configuration (text key, jsonb value) |
| audit_log | Security & operational audit trail (JSONB) |

> All additional tables follow the same pattern: UUID pk, JSONB data, created_at, updated_at.

### 2.8 Shared Trigger for updated_at

`sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS 
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
 LANGUAGE plpgsql;

-- Apply to each table:
CREATE TRIGGER set_updated_at BEFORE UPDATE ON optical_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- (Repeat for all tables with updated_at)
`

---

## 3. Middleware Requirements

### 3.1 CORS

`	ypescript
app.use(cors({
  origin: ['http://localhost:5173', process.env.FRONTEND_URL],
  credentials: true
}));
`

### 3.2 Authentication Middleware

Every protected route must pass through an auth guard that:
1. Reads Authorization: Bearer <token> header OR session cookie
2. Validates token / session
3. Attaches req.user = { id, username, role, permissions, allowedViews }
4. Returns 401 if missing/invalid; 403 if account inactive

### 3.3 Permission Middleware Factory

`	ypescript
requirePermission('canViewFinancials') // Returns 403 if req.user.permissions[key] is false
requireRole('admin')                   // Returns 403 if role doesn't match
`

### 3.4 Rate Limiter

- Login endpoint: max 5 attempts per 15 minutes per IP
- AI endpoints: max 30 requests per minute per user
- SMS endpoint: max 10 per minute per user

### 3.5 Error Handler

Global error handler returning:
`json
{ "success": false, "error": "Human-readable message", "code": "ERROR_CODE" }
`

---

## 4. REST API Endpoints

All endpoints return JSON. All mutation endpoints require auth. Admin-only endpoints check role. All list responses include pagination metadata.

### 4.1 Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/login | Public | Login; returns user (no passwordHash) + token/session |
| POST | /api/auth/logout | Required | Invalidates session/token |
| GET | /api/auth/me | Required | Returns current authenticated user object |

**POST /api/auth/login Request:**
`json
{ "username": "admin", "password": "securepass" }
`
**POST /api/auth/login Response (200):**
`json
{
  "success": true,
  "user": { "id": "...", "username": "admin", "fullName": "...", "role": "admin", "roleTitle": "...", "allowedViews": [...], "permissions": {...}, "status": "Active" },
  "token": "jwt-token-here"
}
`
**Error Responses:** 401 invalid credentials; 403 account inactive.

---

### 4.2 Optical Jobs (Lab Pipeline)

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | /api/jobs | Required | Any | List all non-checked-in jobs |
| POST | /api/jobs | Required | canAdvanceStages | Create new optical job |
| PUT | /api/jobs/:id | Required | canAdvanceStages | Update job (stage, status, etc.) |
| DELETE | /api/jobs/:id | Required | admin | Delete job |
| POST | /api/jobs/bulk-sync | Required | canAdvanceStages | Upsert multiple jobs (sync from frontend) |

**GET /api/jobs Response:**
`json
{ "success": true, "data": [ { ...OpticalJob } ], "count": 42 }
`

**POST /api/jobs Request Body:** Full OpticalJob object (sans id; server generates UUID).

**PUT /api/jobs/:id Request Body:** Partial OpticalJob (only updated fields required).

---

### 4.3 Inventory

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | /api/inventory | Required | Any | List all inventory items |
| POST | /api/inventory | Required | canEditInventory | Create new inventory item |
| PUT | /api/inventory/:id | Required | canEditInventory | Update item (incl. restock) |
| DELETE | /api/inventory/:id | Required | admin | Delete item |

**Response shape same pattern as jobs.**

**Restock Endpoint (shortcut):**
`
PUT /api/inventory/:id  { "stockQty": <new qty>, "operation": "restock", "addQty": 10 }
`
Server increments stockQty by addQty; recalculates status badge; logs audit entry.

**costPrice / adminCostCode** — included in response only if 
eq.user.permissions.canViewPurchaseCost === true. Strip these fields in middleware for unauthorized users.

---

### 4.4 Sales Records

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | /api/sales | Required | Any | List all sales records |
| POST | /api/sales | Required | canProcessPOS | Create new sale record |
| PUT | /api/sales/:id | Required | canCollectDues | Update (due collection, status) |
| GET | /api/sales/summary | Required | canViewFinancials | Aggregated revenue/COGS summary |

**POST /api/sales:** Creates SaleRecord; decrements inventory stockQty for sold frame SKU; updates salesman.totalSalesVolume.

**Due Collection Update (PUT /api/sales/:id):**
`json
{
  "collectionAmount": 500,
  "method": "bKash",
  "counterDiscount": 0,
  "collectedBy": "cashier_user"
}
`
Server appends to collectionHistory, recalculates remainingDue, updates status to 'paid' if remainingDue reaches 0.

---

### 4.5 Salesmen

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | /api/salesmen | Required | Any | List all salesmen |
| POST | /api/salesmen | Required | admin | Create salesman |
| PUT | /api/salesmen/:id | Required | admin | Update salesman |
| DELETE | /api/salesmen/:id | Required | admin | Delete salesman |

---

### 4.6 User Accounts

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | /api/users | Required | admin | List all users (no passwordHash) |
| POST | /api/users | Required | admin | Create new user (hash password) |
| PUT | /api/users/:id | Required | admin | Update user (optional new password) |
| DELETE | /api/users/:id | Required | admin | Deactivate/delete user |

**POST /api/users:** bcrypt.hash(password, 10) before storing. Never return passwordHash in any response.

**PUT /api/users/:id:** If password field in body is non-empty, re-hash and update. If empty/absent, keep existing hash.

**DELETE /api/users/:id:** Cannot delete own account OR the last remaining admin account (return 403 with message).

---

### 4.7 SMS Notifications

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| POST | /api/notifications/sms | Required | canDispatchTrays | Send SMS via gateway |
| GET | /api/notifications/sms/logs | Required | Any | List SMS dispatch history |
| GET | /api/notifications/sms/balance | Required | admin | Query gateway account balance |

**POST /api/notifications/sms Request:**
`json
{
  "jobCode": "MH-2506-0042",
  "patientName": "রহিম উদ্দিন",
  "patientPhone": "01712345678",
  "message": "আপনার চশমা প্রস্তুত। ড্রয়ার: A-14। বাকি: ৳500",
  "language": "bn"
}
`
Server calls BD SMS gateway REST API; logs result to sms_logs table; updates linked optical_job.smsNotificationStatus.

---

### 4.8 AI Endpoints (Gemini Proxy)

All AI calls proxied through backend — GEMINI_API_KEY never exposed to frontend.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| POST | /api/gemini/thinking-analysis | Required | canUseAI | AI optics analysis (text) |
| POST | /api/gemini/image-generate | Required | canUseAI | Text-to-image generation |
| POST | /api/gemini/image-edit | Required | canUseAI | Image-to-image editing |

**POST /api/gemini/thinking-analysis Request:**
`json
{
  "prompt": "Check this Rx: OD -3.50/-1.25x85...",
  "rxData": { "od": {...}, "os": {...} },
  "frameSpecs": { "type": "Full Rim", "material": "TR90" }
}
`
**Response:**
`json
{ "success": true, "text": "## ISO 21987 Tolerance Check\n...", "model": "gemini-2.5-flash", "thinkingMode": true }
`

**POST /api/gemini/image-generate Request:**
`json
{ "prompt": "Elegant titanium aviator frame for Asian face", "aspectRatio": "1:1" }
`
**Response:**
`json
{ "success": true, "imageBase64": "data:image/png;base64,...", "caption": "Generated frame design" }
`

**POST /api/gemini/image-edit Request:**
`json
{ "imageBase64": "data:image/jpeg;base64,...", "mimeType": "image/jpeg", "prompt": "Change frame color to rose gold" }
`

---

### 4.9 Database Status

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/db/status | Required | Test DB connection; return latency ms and record counts |

**Response:**
`json
{
  "success": true,
  "connected": true,
  "latencyMs": 42,
  "recordCounts": { "optical_jobs": 84, "inventory_items": 312, "sales_records": 156 }
}
`

---

### 4.10 Extended Domain Endpoints

The following endpoints follow the same REST pattern (GET list, POST create, PUT/:id update, DELETE/:id delete):

| Domain | Base Path | Table |
|---|---|---|
| IBT Orders | /api/ibt | ibt_orders |
| Suppliers | /api/suppliers | suppliers |
| Purchase Orders | /api/purchase-orders | purchase_orders |
| GRN Records | /api/grn | grn_records |
| Expenses | /api/expenses | expense_records |
| Returns | /api/returns | return_records |
| Branches | /api/branches | branch_registry |
| System Config | /api/config | system_config |
| Audit Log | /api/audit-log | audit_log (GET only) |

---

## 5. Business Logic Requirements

### 5.1 Inventory Status Calculation

`
status = 'Critical' if stockQty === 0
status = 'Low'      if stockQty > 0 && stockQty <= minThreshold
status = 'Healthy'  if stockQty > minThreshold
`
Recalculate and persist on every inventory write.

### 5.2 Sale → Inventory Deduction

When POST /api/sales completes successfully:
1. Find inventory item by frameSku
2. Decrement stockQty by 1 (or sale quantity if multi-unit)
3. Recalculate status
4. If status becomes Low or Critical: include alert in response { lowStockAlert: { sku, name, qty } }

### 5.3 Due Collection State Machine

`
Status: 'paid'    — remainingDue === 0
Status: 'partial' — remainingDue > 0 && advancePaid > 0
Status: 'due'     — advancePaid === 0
`
Transition to 'paid' automatically when remainingDue hits 0 after collection.

### 5.4 IBT Status State Machine

`
Requested → Approved (requires canApproveIBT)
Approved  → In Transit (requires gate pass number; requires canDispatchTrays)
In Transit → Received  (records receivedQty per item)
Requested|Approved → Rejected (with reason)
`
On Received: increment destination branch inventory; decrement source branch inventory.

### 5.5 Salesman Commission Calculation

commission_earned = sum of (sale.grossTotal * salesman.commissionPercent / 100) for all sales where sale.salesmanId = salesman.id in the current calendar month. Calculated on the fly; not stored separately.

### 5.6 Audit Log Writes

Append to audit_log table on every:
- Login / Logout
- Cost cipher reveal (canViewPurchaseCost)
- Role assignment change
- IBT dispatch
- Credit/Debit note issuance
- Expense record creation
- Price modification on inventory item
- System config change

Each audit entry: { timestamp, userId, username, role, actionType, details (object), ipAddress, status }

---

## 6. Data Seeding Requirements

Provide a seed script (seed.ts or seed.sql) that inserts:
- 1 admin user: username=admin, password=Admin@1234, role=admin, all permissions true, all views allowed
- 1 cashier user: username=cashier1, password=Test@1234, role=cashier
- 1 lab_tech user: username=labtech1, password=Test@1234, role=lab_tech
- 1 doctor user: username=doctor1, password=Test@1234, role=doctor
- 5+ inventory items (2 frames, 2 lenses, 1 accessory) with varied stock levels (one Critical, one Low, rest Healthy)
- 3+ optical jobs in stages 2, 3, and 5
- 2+ sale records (one paid, one partial)
- 2+ salesmen (one active, one inactive)
- 1+ supplier, 1+ PO

---

## 7. Deployment Notes

### 7.1 Neon Database

- Free tier: 0.5 GB storage, 1 compute unit, auto-suspend after 5 min idle.
- Use @neondatabase/serverless for efficient connection pooling with Neon's HTTP driver.
- All SQL must be compatible with PostgreSQL 16.
- Enable pg_uuid_ossp extension if gen_random_uuid() is unavailable.

### 7.2 Backend Hosting

Backend must expose PORT from environment (default 9000). Support CORS for the frontend origin. Must handle Neon cold-start latency (~1-2s on free tier) gracefully with a connection warmup on startup.

### 7.3 HTTPS & Security

- Serve over HTTPS in production (use reverse proxy: nginx or Cloudflare tunnel)
- Set Secure, HttpOnly, SameSite=Strict on session cookies
- Rate limit all API endpoints
- Sanitize all inputs; use parameterized queries (no string concatenation in SQL)
- GEMINI_API_KEY and DATABASE_URL must never be logged or returned in any response

---

## 8. Phase Deliverable Checklist

### Phase 1 — Frontend Checklist

- [ ] Vite + React 18 + TypeScript project initialized
- [ ] All 16 views implemented with correct feature parity
- [ ] Mock API service layer returns realistic typed data for all endpoints
- [ ] Dark / Light mode toggle persisted in localStorage
- [ ] Bengali / English language toggle working globally
- [ ] Toast notification system for all mutations
- [ ] Print functions working for invoices, tray barcodes, Rx slips
- [ ] Barcode scanner (camera) functional
- [ ] Responsive layout (mobile/tablet/desktop)
- [ ] Role-based view filtering from session user's allowedViews
- [ ] Login page with session persistence via sessionStorage
- [ ] All forms have complete validation as specified

### Phase 2 — Backend Checklist

- [ ] Express server with all REST endpoints implemented
- [ ] Neon PostgreSQL connected via @neondatabase/serverless
- [ ] schema_neon.sql migration applied; seed data inserted
- [ ] bcrypt password hashing for user accounts
- [ ] JWT or session-based auth with middleware guard on all protected routes
- [ ] Permission middleware (requirePermission factory) applied to all endpoints
- [ ] CORS configured for frontend origin
- [ ] Gemini API proxy endpoints working (text + image)
- [ ] SMS gateway integration with BD carrier
- [ ] Audit log writes on all sensitive actions
- [ ] Rate limiting on login, AI, and SMS endpoints
- [ ] Global error handler returning consistent JSON
- [ ] GET /api/db/status operational
- [ ] Phase 1 frontend VITE_API_BASE_URL pointed to live backend (mock layer bypassed)
- [ ] All Phase 1 features functioning end-to-end against real database

---

## 9. Evaluation Scoring Rubric

### Phase 1 — Frontend (100 Points)

| Category | Max Points | Criteria |
|---|---|---|
| Visual Design & UX | 25 | Premium, modern, responsive; dark mode; animation quality |
| Feature Completeness | 30 | All 16 views implemented with correct data and interactions |
| Code Quality | 20 | TypeScript types, component structure, hook usage, readability |
| Mock API Layer | 15 | Correct service layer; typed responses; easy Phase 2 swap |
| Forms & Validation | 10 | Complete validation per spec; good error messages |

### Phase 2 — Backend (100 Points)

| Category | Max Points | Criteria |
|---|---|---|
| API Completeness | 30 | All endpoints functional; correct HTTP status codes |
| Database Design | 20 | Schema matches spec; migrations clean; seed works |
| Security | 20 | Auth middleware; bcrypt; CORS; rate limiting; no secrets leaked |
| Business Logic | 20 | Correct state machines; inventory deduction; commission calc |
| Code Quality | 10 | TypeScript; clean controllers; consistent error handling |

---

*Document Version: 1.0 | Prepared for MEHL OptiVision Technical Assessment | Confidential*
