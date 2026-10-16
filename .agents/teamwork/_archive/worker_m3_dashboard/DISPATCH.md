# Dispatch: Milestone 3 — User Membership Dashboard (R2 & R3)

**Role**: `teamwork_preview_worker`
**Working Directory**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\worker_m3_dashboard\
**Authoritative Request**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\ORIGINAL_REQUEST.md
**Project Specification**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\orchestrator_1\PROJECT.md
**Frontend Survey Reference**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\explorer_survey_frontend\frontend_survey.md
**Spec Survey Reference**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\spec_miner_survey\spec_survey.md

**Write Ownership**:
- `Frontend/src/pages/membershipDashboard.js` (Exclusive ownership)
- `Frontend/src/pages/membershipDashboard.css` (Exclusive ownership)

**Mandatory Integrity Warning**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Task Requirements**:
1. Create `Frontend/src/pages/membershipDashboard.js` and `Frontend/src/pages/membershipDashboard.css`.
2. Connect to API:
   - Import `getMyMembership`, `getMembershipHistory` (or `getHistory`), `cancelMembership` from `../database/membershipApi`.
   - Import `Navbar` from `../component/Navbar`.
   - Use `useNavigate` from `react-router-dom` for navigation to `/membership/plans`.
3. Functional Behaviors (Requirement R2):
   - On mount, call `getMyMembership()` and `getMembershipHistory()`.
   - Active Membership Display:
     - Prominent Hero Banner (matching `profileHero.css` style) displaying current plan name (`plan.name` or default free name), status badge (`Aktif`), and expiration date formatted in Indonesian (`new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(...)`). If expiration date is null, show "Masa Aktif: Selamanya (Gratis)".
   - Unlocked Features Checklist:
     - Show list of active perks and limits (`maxCharacters`, `maxClasses`, `extraAvatars`, `progressReport`, `studentAnalytics`, etc.) with green checkmarks.
   - Pending Payment Banner:
     - If `pending !== null`, show amber warning notice with pending plan name and creation date, noting verification is in progress.
   - Default Free Tier State:
     - If `source === 'default'`, show clean notice explaining current free tier limits with CTA button "Tingkatkan ke Premium" linking to `/membership/plans`.
   - Subscription History Audit Table:
     - Display history rows from `getMembershipHistory()`: Tanggal Transaksi, Paket, Harga (IDR), Masa Aktif, Status Badge (`active` = Hijau, `pending` = Kuning, `cancelled` = Merah/Abu-abu).
     - Empty state with friendly illustration/icon and message if history is empty.
     - Responsive mobile card transformation for table on small screens.
   - Cancellation Flow:
     - If user has active paid subscription (`price > 0`), display "Batalkan Langganan" button.
     - Clicking button opens confirmation modal warning that premium perks will cease immediately.
     - On confirmation, call `cancelMembership()`.
     - On success (HTTP 200), show toast alert, refresh active membership (`getMyMembership()`) and history (`getMembershipHistory()`), reverting active banner to default free tier.
4. UI/UX Consistency (Requirement R3):
   - Strictly follow Gamukis visual design tokens (blues, brand yellows, cream backgrounds, status pills).
   - Card elevations and border radii matching `profile.css` and `adminDashboard.css`.
   - Confirmation modal with dark blue border `3px solid #0b2d6b` and backdrop blur overlay.
5. Verification:
   - Check syntax with `node --check` or test compilation.
   - Ensure component renders cleanly.
   - Write `handoff.md` and report back.

## 2026-10-10T22:52:21Z
You are teamwork_preview_worker (Milestone 3 Dashboard Worker).
Your working directory is: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\worker_m3_dashboard\
Project Root: c:\Users\LOQ\Documents\gamukis
Authoritative Request: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\ORIGINAL_REQUEST.md
Project Specification: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\orchestrator_1\PROJECT.md
Frontend Survey Reference: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\explorer_survey_frontend\frontend_survey.md
Spec Survey Reference: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\spec_miner_survey\spec_survey.md
Dispatch details: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\worker_m3_dashboard\DISPATCH.md

Write Ownership:
Frontend/src/pages/membershipDashboard.js (exclusive ownership)
Frontend/src/pages/membershipDashboard.css (exclusive ownership)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Task:
Build the User Membership Dashboard component and stylesheet in Frontend/src/pages/membershipDashboard.js and Frontend/src/pages/membershipDashboard.css:
1. Connect to API: import getMyMembership, getMembershipHistory, cancelMembership from ../database/membershipApi.
2. Render Navbar at top.
3. Hero header matching profileHero.css with active plan name, expiration date in Indonesian (Intl.DateTimeFormat), and status badge (Aktif).
4. Default free tier display (source === 'default') with "Tingkatkan ke Premium" CTA button linking to /membership/plans.
5. Pending subscription warning notice (if pending !== null).
6. Effective features checklist grid with green checkmarks.
7. Subscription history audit table matching TeacherTable.css with responsive mobile card transformation.
8. Cancellation flow: "Batalkan Langganan" button for active paid plans, confirmation modal, triggers cancelMembership(), refreshes active status, toast notification.
9. Strictly follow Gamukis visual design tokens.
10. Verify syntax and rendering, write handoff.md, and send completion message to parent (conversation ID: 444ae9e4-4bba-40fd-b20d-21b6e3d504c9).
