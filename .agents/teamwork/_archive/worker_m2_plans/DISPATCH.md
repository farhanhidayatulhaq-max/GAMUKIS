# Dispatch: Milestone 2 — Membership Plans Page (R1 & R3)

**Role**: `teamwork_preview_worker`
**Working Directory**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\worker_m2_plans\
**Authoritative Request**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\ORIGINAL_REQUEST.md
**Project Specification**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\orchestrator_1\PROJECT.md
**Frontend Survey Reference**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\explorer_survey_frontend\frontend_survey.md
**Spec Survey Reference**: c:\Users\LOQ\Documents\gamukis\.agents\teamwork\spec_miner_survey\spec_survey.md

**Write Ownership**:
- `Frontend/src/pages/membershipPlans.js` (Exclusive ownership)
- `Frontend/src/pages/membershipPlans.css` (Exclusive ownership)

**Mandatory Integrity Warning**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Task Requirements**:
1. Create `Frontend/src/pages/membershipPlans.js` and `Frontend/src/pages/membershipPlans.css`.
2. Connect to API:
   - Import `getPlans`, `getMyMembership`, `subscribePlan` from `../database/membershipApi`.
   - Import `Navbar` from `../component/Navbar`.
   - Use `useNavigate` from `react-router-dom` for navigation.
3. Functional Behaviors (Requirement R1):
   - On mount, load plans using `getPlans()` and current status using `getMyMembership()`.
   - Handle unauthenticated users: If not logged in or token missing, show friendly login prompt with link to `/login`, while allowing preview of plans.
   - Display plans in responsive grid.
   - Format pricing in IDR (`new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)` or `Rp 0` / `Gratis`) and duration (`/ 30 Hari` or `/ Selamanya`).
   - Highlight the user's currently active plan with badge and disabled button labeled "Paket Aktif Saat Ini".
   - If user has a pending order for a plan, show "Menunggu Pembayaran" indicator.
   - Subscription flow: Clicking "Pilih Paket" opens a confirmation modal detailing plan name, price, and duration.
   - On confirmation, call `subscribePlan(planCode)`.
   - If response status is active (201) or pending (202), display toast notification and provide option or redirect to `/membership` or `/membership/dashboard`.
   - Error handling: Display error message in toast or modal if API call fails.
4. UI/UX Consistency (Requirement R3):
   - Match Gamukis design tokens: Primary Blue (`#206bf0`), Dark Blue (`#0B3C99`), Brand Yellow (`#FFC926` / `#FCD13F`), Cream background (`#fffdf5` / `#f4f8fc`), Status Green (`#14A86B` / `#e2fff2`).
   - Cards: `border-radius: 20px`, surface `#ffffff`, border `#e3ebf3`, shadow `0 10px 28px rgba(52, 91, 128, 0.08)`.
   - Featured plan badge "POPULER" on paid plans with amber border.
   - 3D tactile button styling for primary CTA (`box-shadow: 0 4px 0 #F5A623`, active `translateY(2px)`).
   - Accessible confirmation modal with dark blue border `3px solid #0b2d6b` and backdrop blur.
   - Responsive design for mobile (320px+), tablet, and desktop.
5. Verification:
   - Check syntax with `node --check` or test compilation.
   - Ensure component renders without crashing.
   - Write `handoff.md` and report back.

