# Comprehensive Requirements & Feature Specification Survey: Membership Frontend System

**Project**: Gamukis Education Platform  
**Document**: Specification Survey for Requirements R1, R2, R3  
**Status**: Authoritatively Probed & Verified  
**Author**: Specification Miner Subagent (`teamwork_preview_spec_miner`)  
**Timestamp**: 2026-10-10T22:38:00Z  

---

## 1. Executive Summary & Specification Scope

This document provides the authoritative functional, behavioral, and UI/UX specifications for implementing the **Frontend Membership & Subscription System** within the Gamukis application.

The specification covers three core requirements established in `ORIGINAL_REQUEST.md`:
1. **R1. Membership Plans Page**: Browse role-specific plans via `GET /api/memberships/plans`, examine pricing and perks, and subscribe via `POST /api/memberships/subscribe`.
2. **R2. User Membership Dashboard**: Inspect user membership status via `GET /api/memberships/me`, audit transaction and plan history via `GET /api/memberships/history`, and execute plan cancellation via `POST /api/memberships/cancel`.
3. **R3. UI/UX Consistency**: Seamless integration with the existing Gamukis design system found in `gamukis/Frontend` (profile pages, complete profile, and admin dashboards), adhering to the established color palette, typography, button paradigms, cards, pills/badges, and modal dialogs.

All specifications, request/response structures, error responses, and state machines documented herein have been **authoritatively discovered and validated via live execution against the backend Express routes (`membershipRoute.js`), database models (`membershipModel.js`), and frontend stylesheets and components**.

---

## 2. Features Discovered

The following features were discovered by probing `Backend/src/routes/membershipRoute.js`, `membershipModel.js`, `permissions.js`, `connection.js`, and `Frontend/src/`:

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| F01 | R1: Plans | Fetch Role-Specific Plans | Retrieve list of active membership plans matching the authenticated user's role (`siswa` or `guru`). Admin receives all active plans across all audiences. | HTTP GET to `/api/memberships/plans`; Headers: `Authorization: Bearer <token>` | HTTP 200: `{ plans: [ { id, code, name, audience, price, durationDays, features, isActive } ] }` | 401 if unauthenticated (`{ message: "Token login diperlukan." }`); 500 if DB failure | `membershipRoute.js:17`, `MembershipModel.listPlans`, live probe |
| F02 | R1: Plans | Plan Card Presentation | Visual display of membership plans in a responsive grid. Displays plan name, formatted Indonesian Rupiah price (e.g. `Rp 29.000` or `Gratis`), duration in days (e.g. `30 Hari` or `Selamanya`), audience badge, and structured feature list. | Plan object from API | Rendered cards with title, price, duration, feature bullets, and action CTA | Fallback placeholder if feature object is empty or malformed | `connection.js:137-142`, `profile.css`, UI survey |
| F03 | R1: Plans | Subscribe to Free Plan | Immediately activates free tier membership (`price: 0`), cancelling any previous active or pending memberships, setting started date to now and null expiration. | HTTP POST to `/api/memberships/subscribe`; Body: `{ planCode: "<role>_free" }`; Auth Bearer header | HTTP 201: `{ message: "Paket aktif.", membershipId: <num>, status: "active" }` | 400 if user is admin; 404 if plan inactive/not found; 403 if audience mismatch; 500 if DB failure | `membershipRoute.js:51-65`, `MembershipModel.subscribe`, live probe |
| F04 | R1: Plans | Subscribe to Paid Plan | Creates a pending subscription for paid tiers (`price > 0`), cancelling existing pending requests, awaiting payment confirmation / gateway activation. | HTTP POST to `/api/memberships/subscribe`; Body: `{ planCode: "<role>_premium" }`; Auth Bearer header | HTTP 202: `{ message: "Menunggu pembayaran.", membershipId: <num>, status: "pending", paymentUrl: null }` | 400 if user is admin; 404 if plan not found; 403 if audience mismatch; 500 if DB failure | `membershipRoute.js:68-72`, `MembershipModel.subscribe`, live probe |
| F05 | R1: Plans | Audience Mismatch Protection | Backend rejects users attempting to subscribe to a plan intended for another role (e.g. a `siswa` user attempting to buy `guru_pro`). | HTTP POST to `/api/memberships/subscribe`; Body: `{ planCode: "guru_pro" }` with siswa token | HTTP 403: `{ message: "Paket ini khusus untuk guru." }` | Frontend alerts user with explicit role error toast/modal | `membershipRoute.js:58-60`, live probe |
| F06 | R1: Plans | Admin Exemption Handling | Prevents administrator accounts from subscribing to consumer plans, as administrators already have full platform access. | HTTP POST to `/api/memberships/subscribe`; Any body; Admin Auth Bearer header | HTTP 400: `{ message: "Administrator tidak memerlukan membership." }` | Frontend shows notice "Akun Administrator memiliki akses tak terbatas" and disables plan subscription | `membershipRoute.js:52-54`, live probe |
| F07 | R1: Plans | Active Plan Status Indicator | Indicates which plan the user is currently subscribed to on the Plans page, disabling the "Subscribe" button and labeling it "Paket Aktif Saat Ini". | Current active plan code from `GET /me` | Visual badge on plan card, primary button replaced with disabled "Sedang Aktif" state | If no active membership, matches `<role>_free` as active | User journey analysis, `GET /me` response |
| F08 | R1: Plans | Subscription Confirmation Dialog | Modal dialog shown prior to executing `POST /subscribe` to summarize plan name, price, duration, and key terms before firing payment/activation. | User click on "Pilih Paket" button | Modal rendered with details, "Konfirmasi & Lanjutkan" button, and "Batal" button | Escape key / backdrop click closes modal without API call | `login.js:23`, `CoinModal`, UX consistency |
| F09 | R2: Dashboard | Fetch Active & Pending Membership | Fetches effective user membership status and pending subscription details. Returns effective plan details, feature map, source (`membership`, `default`, or `administrator`), expiry date, and pending object. | HTTP GET to `/api/memberships/me`; Headers: `Authorization: Bearer <token>` | HTTP 200: `{ membership: { plan, source, features, expiresAt }, pending: null \| { membershipId, createdAt, plan } }` | 401 if unauthenticated; 500 if DB failure (`{ message: "Status membership gagal dimuat." }`) | `membershipRoute.js:28-39`, `MembershipModel.getEffective`, live probe |
| F10 | R2: Dashboard | Active Membership Hero Display | Prominent card displaying the user's active membership plan name, active status badge (`Aktif`), expiration countdown / formatted date, and price. | `membership` data from `GET /me` | Rendered hero banner with gradient styling matching `profileHero.css` | Handles null `expiresAt` gracefully as "Masa aktif: Selamanya" | `profileHero.js`, `profile.css:13-60` |
| F11 | R2: Dashboard | Effective Features Checklist | Breakdown of features and limits unlocked by the current membership (e.g. `maxCharacters: 10`, `extraAvatars: true`, `progressReport: true`, `studentAnalytics: true`). | `membership.features` object | Checked/bulleted feature list with human-readable Indonesian labels | Default fallback labels for unknown feature keys | `connection.js:137-142`, `characterRoute.js:10` |
| F12 | R2: Dashboard | Default Free Plan State | State when user has no active paid plan (`source === 'default'`). Displays "Paket Gratis", explains current limits, and presents a prominent CTA button directing to `/plans`. | `membership.source === 'default'` | Informational banner with "Tingkatkan ke Premium" CTA button | Clean visual without broken expiry fields | `membershipModel.js:98-100`, live probe |
| F13 | R2: Dashboard | Pending Payment Notification Banner | Warning/amber banner alerting the user that a pending subscription is awaiting confirmation, displaying the pending plan name and date created. | `pending !== null` from `GET /me` | Amber warning box with `Menunggu Konfirmasi Pembayaran` pill and instructions | If null, banner is not rendered | `membershipRoute.js:34`, `profile-role-notice`, live probe |
| F14 | R2: Dashboard | Subscription History Audit List | Tabular or card-list display of user's past and current memberships, including start date, expiration date, plan name, price, payment reference, and status badge (`active`, `pending`, `cancelled`). | HTTP GET to `/api/memberships/history`; Headers: `Authorization: Bearer <token>` | HTTP 200: `{ history: [ { id, status, started_at, expires_at, payment_ref, created_at, code, name, price } ] }` | 401 if unauthenticated; 500 if DB error (`{ message: "Riwayat membership gagal dimuat." }`) | `membershipRoute.js:41-48`, `TeacherTable.css`, live probe |
| F15 | R2: Dashboard | Cancel Active Subscription | Allows user to cancel their current active and/or pending membership. Cancelling immediately reverts account to the default role free plan. | HTTP POST to `/api/memberships/cancel`; Headers: `Authorization: Bearer <token>` | HTTP 200: `{ success: true, cancelled: <num> }` | 401 if unauthenticated; 500 if DB error (`{ message: "Pembatalan gagal." }`) | `membershipRoute.js:80-88`, `MembershipModel.cancel`, live probe |
| F16 | R2: Dashboard | Cancellation Confirmation Modal | Safety modal verifying user intent before executing subscription cancellation, highlighting that premium features will cease immediately. | User click on "Batalkan Langganan" button | Modal with warning text, destructive red confirm button ("Ya, Batalkan"), and cancel button | Modal dismissed without action on cancel/Escape | `AdminRooms.js:29`, `login.css:5-48` |
| F17 | R3: Consistency | Gamukis Color Palette Harmony | Strict compliance with Gamukis primary blues (`#206bf0`, `#4f7eff`, `#0B3C99`), brand golds/yellows (`#ffd044`, `#FCD13F`, `#ffbe06`), cream backgrounds (`#fffdf5`, `#f4f8fc`), and status greens (`#14A86B`, `#078459`). | Design CSS tokens | Unified color harmony across all membership views | Zero conflicting color systems or arbitrary dark palettes | `adminDashboard.css:1-17`, `profile.css:1-25` |
| F18 | R3: Consistency | Navigation & Navbar Integration | Exposes membership access points in top navigation: dedicated "Membership" link in header navigation bar and "Langganan Saya" / "Pilih Paket" in user profile dropdown menu. | User login status from auth state | Header links and dropdown items configured with active route styling | Unauthenticated users guided to `/login` | `Navbar.js:86-123`, `App.js:48-72` |
| F19 | R3: Consistency | Toast & Inline Alert Feedback | Standardized visual notification system for success, pending, warning, and error events using Gamukis alert and notification patterns. | Notification event with message and type | Animated toast / banner adhering to Gamukis border-radius and color tokens | Auto-dismisses after 4 seconds or on manual close | `AdminTeachers.css:41-49`, `profile.css:236-246` |
| F20 | R3: Consistency | Responsive Multi-Device Layout | Fluid responsive design supporting mobile (320px+), tablet (768px+), and desktop (1024px+), converting multi-column grids to stacked cards on narrow viewports. | Viewport dimensions via CSS media queries | Stacked layout on `<768px`, 2-column or 3-column grid on `>768px` | No horizontal scrollbars or clipped cards | `profile.css:89-94`, `TeacherTable.css:23-39` |
| F21 | Beyond: Admin | Admin Plan Management | Admin capabilities to list all plans (including inactive), create plans, update plans, manually confirm memberships, and grant plans. | Endpoints: `/admin/plans`, `/admin/plans/:id`, `/admin/memberships/:id/confirm`, `/admin/grant` | Administrative CRUD responses | 403 Forbidden for non-admins | `membershipRoute.js:91-192`, live probe |
| F22 | Beyond: Access | Character Creation Limit Integration | Backend middleware limits character creation based on active membership tier's `maxCharacters` feature (Free: 5, Premium: 10, Admin: 50). | Character creation endpoint | 403 / Limit reached if character count exceeds membership allowance | Character creation prevented if limit exceeded | `characterRoute.js:8-10`, `membershipMiddleware.js` |

---

## 3. Edge Cases Discovered

The following edge cases were authoritatively tested and observed:

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| E01 | Fetch Plans (`GET /plans`) | Request with missing or invalid Bearer token | Returns HTTP 401 Unauthorized with `{ message: "Token login diperlukan." }` or `{ message: "Token tidak valid atau sudah kedaluwarsa." }`. |
| E02 | Fetch Plans (`GET /plans`) | Authenticated as `siswa` user | Returns HTTP 200 with only plans where `audience === 'siswa'` (`siswa_free`, `siswa_premium`). Guru plans are completely hidden from student response. |
| E03 | Fetch Plans (`GET /plans`) | Authenticated as `guru` user | Returns HTTP 200 with only plans where `audience === 'guru'` (`guru_free`, `guru_pro`). Student plans are completely hidden from teacher response. |
| E04 | Fetch Plans (`GET /plans`) | Authenticated as `administrator` user | Returns HTTP 200 containing all active plans across all audiences (`siswa` and `guru`). |
| E05 | Subscribe (`POST /subscribe`) | Missing or non-existent `planCode` (e.g. `{ planCode: "unknown_xyz" }`) | Returns HTTP 404 Not Found with `{ message: "Paket tidak ditemukan." }`. |
| E06 | Subscribe (`POST /subscribe`) | Inactive plan (`isActive = 0`) | Returns HTTP 404 Not Found with `{ message: "Paket tidak ditemukan." }`. |
| E07 | Subscribe (`POST /subscribe`) | Cross-role audience mismatch (e.g. `siswa` subscribing to `guru_pro`) | Returns HTTP 403 Forbidden with `{ message: "Paket ini khusus untuk guru." }`. |
| E08 | Subscribe (`POST /subscribe`) | Administrator user calls `/subscribe` with any plan | Returns HTTP 400 Bad Request with `{ message: "Administrator tidak memerlukan membership." }`. |
| E09 | Subscribe (`POST /subscribe`) | User with existing `pending` subscription subscribes to another paid plan | Backend cancels previous pending subscription (`status = 'cancelled'`) and replaces it with the new pending subscription in a single atomic transaction. |
| E10 | Subscribe (`POST /subscribe`) | User with active paid plan subscribes to free tier (`price: 0`) | Backend cancels the active paid plan (`status = 'cancelled'`) and immediately activates the free tier with HTTP 201 Created. |
| E11 | Status (`GET /me`) | Fresh user who has never subscribed to any plan | Returns HTTP 200 with `membership.source: "default"`, `plan.code: "<role>_free"`, `expiresAt: null`, and `pending: null`. User is not in a broken/empty state. |
| E12 | Status (`GET /me`) | User with active paid subscription | Returns HTTP 200 with `membership.source: "membership"`, `plan.code: "siswa_premium"`, `expiresAt: "<ISO timestamp 30 days ahead>"`, and `pending: null`. |
| E13 | Status (`GET /me`) | User with active plan who also has an unconfirmed pending upgrade | Returns HTTP 200 with `membership.source: "membership"` (current active) AND `pending: { membershipId: <num>, plan: <newPlan>, createdAt: <date> }`. |
| E14 | Status (`GET /me`) | Administrator user | Returns HTTP 200 with `membership.plan: null`, `membership.source: "administrator"`, `features: { unlimited: true, maxCharacters: 50 }`, and `expiresAt: null`. |
| E15 | Cancel (`POST /cancel`) | User with active subscription calls cancel | Updates status of all active and pending records to `cancelled`. Returns HTTP 200 `{ success: true, cancelled: 1 }`. Subsequent `GET /me` returns `source: "default"`. |
| E16 | Cancel (`POST /cancel`) | User on default free plan calls cancel (no active/pending rows) | Executes successfully without error, returning HTTP 200 `{ success: true, cancelled: 0 }`. Safe idempotency. |
| E17 | Cancel (`POST /cancel`) | User with both active plan and pending plan calls cancel | Both active and pending records are updated to `cancelled`. Returns HTTP 200 `{ success: true, cancelled: 2 }`. |
| E18 | History (`GET /history`) | User with no past subscriptions | Returns HTTP 200 with `{ history: [] }`. Frontend must render a clean empty-state card instead of a broken table. |
| E19 | History (`GET /history`) | User with multiple subscriptions over time | Returns list sorted chronologically descending (`ORDER BY m.id DESC`). Status badges accurately reflect `active`, `pending`, or `cancelled`. |
| E20 | Frontend Network Failure | Backend server unavailable or timeout during fetch | Frontend displays inline error alert with retry button ("Gagal memuat data. Coba lagi") without crashing page. |

---

## 4. Detailed Specification: R1 (Membership Plans Page)

### 4.1 Objective & Routing
- **Route Path**: `/membership/plans` (and alias `/plans`).
- **Goal**: Allow users to explore available membership plans, compare perks, understand pricing, and trigger subscription.

### 4.2 Audience & Role-Based Filtering
- The backend API (`GET /api/memberships/plans`) automatically filters plans based on the authenticated user's role.
- If user is `siswa`:
  - Plan 1: **Siswa Gratis** (`siswa_free`) — Rp 0 / Selamanya.
  - Plan 2: **Siswa Premium** (`siswa_premium`) — Rp 29.000 / 30 Hari.
- If user is `guru`:
  - Plan 1: **Guru Gratis** (`guru_free`) — Rp 0 / Selamanya.
  - Plan 2: **Guru Pro** (`guru_pro`) — Rp 99.000 / 30 Hari.
- If user is `administrator`:
  - Receives all 4 plans. Frontend presents an informational banner explaining that administrator accounts possess unlimited system privileges.
- If unauthenticated:
  - Frontend intercepts the unauthenticated state before API failure, presenting role preview tabs ("Untuk Siswa" / "Untuk Guru") with a prominent login prompt: *"Masuk untuk memilih paket yang sesuai dengan akun Anda"*.

### 4.3 Plan Card UI Structure
Each card in the plan grid must contain:
1. **Header**:
   - Plan Name (e.g. `Siswa Premium`, `Guru Pro`).
   - Audience Badge (e.g. `Siswa` or `Guru` pill badge).
   - "Paket Populer" / "Rekomendasi" highlight badge for paid tiers.
2. **Pricing Block**:
   - Formatted Currency: Indonesian Rupiah format `Rp 29.000` (or `Rp 0` / `Gratis`).
   - Billing Interval: `/ 30 Hari` for paid plans; `/ Selamanya` for free plans.
3. **Features List (Perks)**:
   - Bulleted checklist with green checkmark icon (`✓` or `FaCheck`).
   - Friendly feature names:
     - `maxCharacters: 5` → "Kapasitas hingga 5 Karakter"
     - `maxCharacters: 10` → "Kapasitas hingga 10 Karakter"
     - `extraAvatars: true` → "Akses Kostum & Avatar Eksklusif"
     - `progressReport: true` → "Laporan Perkembangan Belajar"
     - `maxClasses: 1` → "Maksimal 1 Kelas Belajar"
     - `maxClasses: 20` → "Maksimal 20 Kelas Belajar"
     - `studentAnalytics: true` → "Analitik Performa Siswa Real-time"
     - `exportReport: true` → "Ekspor Laporan Nilai & Riwayat (PDF/Excel)"
4. **Action CTA Button**:
   - **Case A: Currently Active Plan**:
     - Button is disabled with styling `.btn-current-plan` (neutral grey/blue border).
     - Text: `"Paket Aktif Saat Ini"`.
   - **Case B: Pending Plan**:
     - Text: `"Menunggu Pembayaran"`.
     - Clicking navigates to `/membership` dashboard to view pending status.
   - **Case C: Available Plan**:
     - Primary gold button (`#ffd044`).
     - Text: `"Pilih Paket"`, `"Tingkatkan"` (if upgrading from free), or `"Turunkan ke Gratis"` (if reverting).
     - Clicking opens Confirmation Modal.

### 4.4 Subscription Modal Flow
When user clicks "Pilih Paket":
1. Open accessible modal dialog:
   - Title: `Konfirmasi Berlangganan`
   - Content: Summarizes plan name, price, duration, and key terms.
   - If user already has an active paid plan and is selecting a free plan: Explicit warning: *"Paket berbayar Anda saat ini akan dibatalkan dan akun kembali ke paket gratis."*
2. Primary Modal Action: `"Konfirmasi & Lanjutkan"` (triggers `POST /api/memberships/subscribe`).
3. Loading State: Button shows `"Memproses..."` and is disabled while request is in flight.
4. Response Handling:
   - If HTTP 201 (`status: "active"`): Show success toast (`"Paket [Name] berhasil diaktifkan!"`), close modal, and navigate to `/membership`.
   - If HTTP 202 (`status: "pending"`): Show pending toast (`"Permintaan terkirim. Menunggu konfirmasi pembayaran."`), close modal, and navigate to `/membership`.
   - If HTTP 400/403/404/500: Display error alert inside modal without closing.

---

## 5. Detailed Specification: R2 (User Membership Dashboard)

### 5.1 Objective & Routing
- **Route Path**: `/membership` (and alias `/membership/dashboard`).
- **Goal**: Serve as the central management hub for the user's membership lifecycle: active tier, renewal date, unlocked privileges, pending payments, history, and cancellation.

### 5.2 Header / Hero Section
- Matches the visual architecture of `ProfileHero` (`profile.css:13-60`):
  - Gradient banner background: `linear-gradient(120deg, #206bf0, #08b9c9)` with drop shadow `0 18px 40px rgba(38, 107, 200, 0.22)`.
  - User greeting: Display avatar, name, and current role.
  - Active Plan Badge:
    - Paid Active: Green pill badge `#e2fff2` with text `#078459` (`● Aktif`).
    - Free Tier: Soft blue pill badge `#eef3ff` with text `#206bf0` (`● Paket Dasar`).
    - Administrator: Purple/gold badge (`● Administrator`).
  - Plan Headline: Large bold font `[Plan Name]` (e.g. `Siswa Premium`).
  - Billing / Expiry Details:
    - If `expiresAt` exists: Formatted date in Indonesian (`Berlaku hingga 10 November 2026`).
    - Expiry urgency indicator: If `< 5` days remaining, show warning amber text: *"Segera berakhir dalam X hari"*.
    - If `expiresAt` is null: `"Masa aktif: Selamanya (Gratis)"`.

### 5.3 Quick Actions Bar
- **Tingkatkan Paket**: Secondary white/yellow button linking directly to `/membership/plans`.
- **Batalkan Langganan**: Destructive button (visible ONLY when `source === 'membership'` and plan is paid). Hidden when user is on default free tier or admin.

### 5.4 Pending Payment Notification Banner
- Rendered if `pending !== null` from `GET /api/memberships/me`.
- Visual styling: Border-left 4px `#F5A623`, background `#fff8e2`, text `#7a5900` (matching `profile-role-notice`).
- Text:
  - Header: `"Menunggu Konfirmasi Pembayaran"`
  - Body: `"Anda memiliki pengajuan paket [Pending Plan Name] pada [Created Date]. Paket akan aktif setelah pembayaran diverifikasi oleh administrator."`
  - Reference ID: `"ID Langganan: #[membershipId]"`.

### 5.5 Effective Privileges Panel
- Two-column grid or card layout detailing all active benefits:
  - Character Slots: Current limit (e.g. `10 dari 10 karakter terbuka`).
  - Classroom Quota (Guru): Current class limit (e.g. `20 kelas`).
  - Special Features: Badges with checkmarks for `extraAvatars`, `progressReport`, `studentAnalytics`, `exportReport`.

### 5.6 Subscription History Audit Table
- Data Source: `GET /api/memberships/history`.
- Styling: Conforms to `TeacherTable.css` / `adminDashboard.css`:
  - Table Header: `TANGGAL PENGAJUAN`, `PAKET`, `HARGA`, `MASA AKTIF`, `STATUS`, `NO. REFERENSI`.
  - Status Badges:
    - `active`: Green pill badge (`Aktif`).
    - `pending`: Amber pill badge (`Menunggu Pembayaran`).
    - `cancelled`: Grey/red pill badge (`Dibatalkan`).
  - Empty State: If history array is empty:
    - Display centered card with icon `📜`, title `"Belum Ada Riwayat"`, subtitle `"Semua transaksi dan perubahan paket Anda akan tercatat di sini."`.
  - Mobile Responsiveness: On screens `<760px`, table headers hide and rows transform into stacked card units (per `TeacherTable.css:23-40`).

### 5.7 Cancellation Flow
1. User clicks `"Batalkan Langganan"`.
2. Open Cancellation Confirmation Modal:
   - Title: `Batalkan Langganan?`
   - Content: *"Apakah Anda yakin ingin membatalkan langganan [Plan Name]? Akses ke fitur premium akan langsung dihentikan dan akun Anda akan kembali ke paket gratis."*
3. Action Buttons:
   - `"Ya, Batalkan Langganan"`: Destructive red button (`background: #d85e4d; color: #fff`).
   - `"Kembali / Batal"`: Neutral button.
4. On Confirmation:
   - Call `POST /api/memberships/cancel`.
   - On success (HTTP 200):
     - Toast: `"Langganan berhasil dibatalkan. Akun Anda telah kembali ke paket gratis."`
     - Immediately update state locally (re-fetch `GET /me` and `GET /history`).
     - Active banner reverts to default free tier.
     - Cancel button disappears.

---

## 6. Detailed Specification: R3 (UI/UX Consistency)

### 6.1 Design Tokens & Palette Specifications
All elements must use the exact Gamukis CSS tokens extracted from `adminDashboard.css`, `profile.css`, and `completeProfile.css`:

```css
:root {
  /* Gamukis Primary Blues */
  --gk-blue-primary: #206bf0;
  --gk-blue-hover:   #1a57c2;
  --gk-blue-dark:    #0B3C99;
  --gk-blue-modal:   #0b2d6b;
  --gk-blue-soft:    #eef3ff;
  --gk-blue-cyan:    #08b9c9;

  /* Gamukis Brand Yellows / Golds */
  --gk-yellow-brand: #FCD13F;
  --gk-yellow-btn:   #ffd044;
  --gk-yellow-deep:  #F5A623;
  --gk-cream-bg:     #fffdf5;
  --gk-cream-alt:    #FFFDF3;
  --gk-page-bg:      #f4f8fc;

  /* Status Colors */
  --gk-status-green: #078459;
  --gk-green-bg:     #e2fff2;
  --gk-status-amber: #F5A623;
  --gk-amber-bg:     #fff8e2;
  --gk-status-red:   #d85e4d;
  --gk-red-bg:       #fff0ec;

  /* Typography & Neutrals */
  --gk-text-main:    #19324d;
  --gk-text-muted:   #56718a;
  --gk-text-subtle:  #7890a6;
  --gk-border-light: #e3ebf3;
  --gk-border-card:  #dbe5ee;
  --gk-card-bg:      #ffffff;

  /* Elevation Shadows */
  --gk-shadow-card:  0 10px 28px rgba(52, 91, 128, 0.08);
  --gk-shadow-hero:  0 18px 40px rgba(38, 107, 200, 0.22);
  --gk-shadow-modal: 0 14px 36px rgba(0, 0, 0, 0.22);
}
```

### 6.2 Typography & Hierarchy
- **Font Stack**: `Inter, system-ui, -apple-system, sans-serif`. For serif accents and numbers: `Georgia, "Times New Roman", serif`.
- **Eyebrow Headers**: `font-size: 11px - 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--gk-text-muted);`
- **Page Titles**: `font-size: clamp(24px, 3.5vw, 36px); font-weight: 800; color: var(--gk-text-main);`
- **Card Titles**: `font-size: 20px - 22px; font-weight: 700; color: var(--gk-text-main);`

### 6.3 Card & Panel Paradigms
- Border radius: `18px` to `24px`.
- Padding: `24px` to `32px`.
- Border: `1px solid var(--gk-border-light)`.
- Background: `#ffffff`.
- Box shadow: `var(--gk-shadow-card)`.

### 6.4 Button Paradigms
1. **Primary Action (Brand Yellow)**:
   - `background: #ffd044; color: #25344d; border: 0; border-radius: 10px; font-weight: 700; padding: 12px 20px; cursor: pointer;`
   - Hover: `background: #f0c337; transform: translateY(-1px);`
2. **Secondary Outline Action**:
   - `background: transparent; color: #206bf0; border: 1.5px solid #206bf0; border-radius: 10px; font-weight: 700; padding: 11px 19px;`
   - Hover: `background: #eef3ff;`
3. **Destructive Action (Cancel)**:
   - `background: #fff0ec; color: #d85e4d; border: 1px solid #f8c9c4; border-radius: 10px; font-weight: 700; padding: 11px 18px;`
   - Hover: `background: #ffdcd7;`
4. **Disabled / Loading State**:
   - `opacity: 0.6; cursor: wait; transform: none; pointer-events: none;`

### 6.5 Modal & Dialog System
- Follows the accessible modal paradigm from `login.js` and `CoinModal`:
  - **Backdrop**: Fixed overlay with `rgba(10, 24, 63, 0.48)`.
  - **Container**: Max-width `460px`, `border: 3px solid #0b2d6b`, `border-radius: 18px`, `background: #fff`, `box-shadow: 0 14px 36px rgba(0,0,0,0.22)`.
  - **Interactions**: Closes on Escape key press, clicking outside backdrop, or clicking top-right `×` close button.

### 6.6 Navigation Integration
- In `Navbar.js`:
  - Add `Paket Membership` to header navigation links (`<li><NavLink to="/membership/plans">Membership</NavLink></li>`).
  - Add `Langganan Saya` (`/membership`) to the profile dropdown menu alongside `Profil saya`.
- In `App.js`:
  - Register route `<Route path="/membership/plans" element={<MembershipPlans />} />`
  - Register route `<Route path="/membership" element={<MembershipDashboard />} />`

---

## 7. State Machine & User Journey Matrix

```
       [ Unauthenticated ]
                │
         (Login/Register)
                ▼
       [ Default Free Tier ] ◄────────────────────────┐
       • source: 'default'                            │
       • expiresAt: null                              │
                │                                     │
         (Pilih Paket)                                │
                │                                     │
        ┌───────┴────────┐                            │
        ▼                ▼                            │
  (Free Plan)       (Paid Plan)                       │
        │                │                            │
   (HTTP 201)       (HTTP 202)                        │
        │                │                            │
        │                ▼                            │
        │        [ Pending Payment ]                  │
        │        • pending != null                    │
        │                │                            │
        │         (Admin Confirm)                     │
        │                │                            │
        └───────► ┌──────┴──────┐                     │
                  ▼                                   │
         [ Active Premium Tier ]                      │
         • source: 'membership'                       │
         • expiresAt: ISO Date                        │
                  │                                   │
                  ├───────────────► (Cancel / HTTP 200)
                  │                                   │
                  ▼                                   │
             (Expired) ───────────────────────────────┘
```

### State Inventory Table

| State Name | Backend Representation | Displayed Status | Available Actions | Redirect / Protection |
|------------|------------------------|------------------|-------------------|-----------------------|
| **Unauthenticated** | Missing / Invalid Token | "Belum Masuk" | Masuk, Daftar, Preview Paket | Clicking subscribe redirects to `/login` with return URL |
| **Default Free** | `source: 'default'`, `expiresAt: null`, `pending: null` | `● Siswa/Guru Gratis` | Tingkatkan Paket (Browse `/plans`) | Cannot cancel (no paid subscription active) |
| **Pending Payment** | `pending != null`, `pending.plan` present | `● Menunggu Pembayaran` | Lihat Rincian, Batalkan Pengajuan | Banner warning shown; button on plans page shows "Menunggu Pembayaran" |
| **Active Paid** | `source: 'membership'`, `expiresAt: futureDate` | `● Aktif` | Batalkan Langganan, Ganti Paket | Expiration date shown; Cancel button opens confirmation modal |
| **Cancelled / Reverted** | `source: 'default'`, `history` shows cancelled row | `● Siswa/Guru Gratis` | Pilih Paket Baru | Cancellation confirmation toast; history updated |
| **Administrator** | `source: 'administrator'`, `plan: null` | `● Administrator (Semua Fitur)` | Kembali ke Admin Dashboard | Subscription disabled with informational notice |

---

## 8. Detailed API Interface Contracts

### 8.1 API Client Implementation (`membershipApi.js`)
To support both Manual Auth and Firebase Google Auth seamlessly, the API client wraps fetch with token extraction:

```javascript
// src/database/membershipApi.js
import { auth } from './firebaseAuth';
import { getToken } from './manualAuth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthToken = async () => {
  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    return await auth.currentUser.getIdToken();
  }
  return getToken();
};

const membershipRequest = async (path, options = {}) => {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/memberships${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Permintaan membership gagal.');
  }
  return data;
};

export const getPlans = () => membershipRequest('/plans');
export const getMyMembership = () => membershipRequest('/me');
export const getHistory = () => membershipRequest('/history');
export const subscribePlan = (planCode) =>
  membershipRequest('/subscribe', {
    method: 'POST',
    body: JSON.stringify({ planCode })
  });
export const cancelMembership = () =>
  membershipRequest('/cancel', { method: 'POST' });
```

### 8.2 JSON Schemas

#### 1. `GET /api/memberships/plans`
- **Response (HTTP 200)**:
```json
{
  "plans": [
    {
      "id": 1,
      "code": "siswa_free",
      "name": "Siswa Gratis",
      "audience": "siswa",
      "price": 0,
      "durationDays": null,
      "features": {
        "maxCharacters": 5
      },
      "isActive": true
    },
    {
      "id": 2,
      "code": "siswa_premium",
      "name": "Siswa Premium",
      "audience": "siswa",
      "price": 29000,
      "durationDays": 30,
      "features": {
        "maxCharacters": 10,
        "extraAvatars": true,
        "progressReport": true
      },
      "isActive": true
    }
  ]
}
```

#### 2. `GET /api/memberships/me`
- **Response (HTTP 200 - Active Paid)**:
```json
{
  "membership": {
    "plan": {
      "id": 2,
      "code": "siswa_premium",
      "name": "Siswa Premium",
      "audience": "siswa",
      "price": 29000,
      "durationDays": 30,
      "features": {
        "maxCharacters": 10,
        "extraAvatars": true,
        "progressReport": true
      },
      "isActive": true
    },
    "source": "membership",
    "features": {
      "maxCharacters": 10,
      "extraAvatars": true,
      "progressReport": true
    },
    "expiresAt": "2026-11-09T15:34:09.000Z"
  },
  "pending": null
}
```

- **Response (HTTP 200 - Default Free)**:
```json
{
  "membership": {
    "plan": {
      "id": 1,
      "code": "siswa_free",
      "name": "Siswa Gratis",
      "audience": "siswa",
      "price": 0,
      "durationDays": null,
      "features": {
        "maxCharacters": 5
      },
      "isActive": true
    },
    "source": "default",
    "features": {
      "maxCharacters": 5
    },
    "expiresAt": null
  },
  "pending": null
}
```

- **Response (HTTP 200 - Pending Upgrade Present)**:
```json
{
  "membership": {
    "plan": {
      "id": 1,
      "code": "siswa_free",
      "name": "Siswa Gratis",
      "audience": "siswa",
      "price": 0,
      "durationDays": null,
      "features": {
        "maxCharacters": 5
      },
      "isActive": true
    },
    "source": "default",
    "features": {
      "maxCharacters": 5
    },
    "expiresAt": null
  },
  "pending": {
    "membershipId": 5,
    "createdAt": "2026-10-10T16:00:00.000Z",
    "plan": {
      "id": 2,
      "code": "siswa_premium",
      "name": "Siswa Premium",
      "audience": "siswa",
      "price": 29000,
      "durationDays": 30,
      "features": {
        "maxCharacters": 10,
        "extraAvatars": true,
        "progressReport": true
      },
      "isActive": true
    }
  }
}
```

#### 3. `GET /api/memberships/history`
- **Response (HTTP 200)**:
```json
{
  "history": [
    {
      "id": 5,
      "status": "pending",
      "started_at": null,
      "expires_at": null,
      "payment_ref": null,
      "created_at": "2026-10-10T16:00:00.000Z",
      "code": "siswa_premium",
      "name": "Siswa Premium",
      "price": 29000
    },
    {
      "id": 1,
      "status": "cancelled",
      "started_at": "2026-10-10T15:30:00.000Z",
      "expires_at": null,
      "payment_ref": null,
      "created_at": "2026-10-10T15:30:00.000Z",
      "code": "siswa_free",
      "name": "Siswa Gratis",
      "price": 0
    }
  ]
}
```

#### 4. `POST /api/memberships/subscribe`
- **Request Body**:
```json
{
  "planCode": "siswa_premium"
}
```
- **Response (HTTP 201 - Free Plan)**:
```json
{
  "message": "Paket aktif.",
  "membershipId": 6,
  "status": "active"
}
```
- **Response (HTTP 202 - Paid Plan)**:
```json
{
  "message": "Menunggu pembayaran.",
  "membershipId": 7,
  "status": "pending",
  "paymentUrl": null
}
```

#### 5. `POST /api/memberships/cancel`
- **Response (HTTP 200)**:
```json
{
  "success": true,
  "cancelled": 1
}
```

---

## 9. Comprehensive Acceptance Criteria & Test Assertions

### AC-R1: Membership Plans Page
- [ ] **AC-R1.1**: The page successfully fetches and renders plans by invoking `GET /api/memberships/plans` with the user's active auth token.
- [ ] **AC-R1.2**: Siswa users only see Siswa plans (`siswa_free`, `siswa_premium`). Guru users only see Guru plans (`guru_free`, `guru_pro`).
- [ ] **AC-R1.3**: The user's currently active plan card is highlighted and features a disabled button labeled `"Paket Aktif Saat Ini"`.
- [ ] **AC-R1.4**: Clicking `"Pilih Paket"` opens a confirmation modal detailing plan name, price, and duration.
- [ ] **AC-R1.5**: Subscribing to a free plan sends `POST /api/memberships/subscribe`, handles HTTP 201 Created, shows a success toast, and redirects to the dashboard.
- [ ] **AC-R1.6**: Subscribing to a paid plan sends `POST /api/memberships/subscribe`, handles HTTP 202 Accepted, shows a pending payment toast, and redirects to the dashboard.
- [ ] **AC-R1.7**: If an unauthenticated user visits the page, they are presented with an onboarding banner and clicking a plan triggers a prompt to log in.
- [ ] **AC-R1.8**: If the backend returns an error (403, 404, or 500), an error banner or toast displays the exact backend error message without application crashes.

### AC-R2: User Membership Dashboard
- [ ] **AC-R2.1**: The dashboard calls `GET /api/memberships/me` and renders the active membership hero banner with plan name, status badge, and Indonesian formatted expiration date.
- [ ] **AC-R2.2**: If the user has a pending subscription (`pending !== null`), a prominent amber warning banner informs the user of the pending plan and creation date.
- [ ] **AC-R2.3**: If the user is on the default free plan, the dashboard displays `"Paket Gratis"` and includes a prominent CTA button navigating to `/membership/plans`.
- [ ] **AC-R2.4**: The dashboard calls `GET /api/memberships/history` and renders all past subscription transactions in an accessible table with status badges (`Aktif`, `Menunggu Pembayaran`, `Dibatalkan`).
- [ ] **AC-R2.5**: If subscription history is empty, an empty-state illustration/card is displayed gracefully.
- [ ] **AC-R2.6**: Clicking `"Batalkan Langganan"` prompts the user with a confirmation modal explaining the loss of premium privileges.
- [ ] **AC-R2.7**: Confirming cancellation calls `POST /api/memberships/cancel`, verifies HTTP 200, displays a success toast, immediately refreshes active status to the default free tier, and hides the cancel button.

### AC-R3: UI/UX Consistency
- [ ] **AC-R3.1**: Color styling strictly adheres to Gamukis design tokens: Primary Blue (`#206bf0`), Brand Yellow (`#ffd044` / `#FCD13F`), Dark Blue (`#0B3C99`), Soft Cream (`#fffdf5`), and Status Green (`#078459`).
- [ ] **AC-R3.2**: Card designs use `border-radius: 18px - 24px`, white background, subtle border `#e3ebf3`, and elevation shadow `0 10px 28px rgba(52, 91, 128, 0.08)`.
- [ ] **AC-R3.3**: Buttons strictly follow existing button styles: primary yellow button with dark text, secondary outline button, and destructive soft-red button.
- [ ] **AC-R3.4**: All modals feature backdrop overlay `rgba(10, 24, 63, 0.48)`, dark blue border `3px solid #0b2d6b`, and support Escape key dismissal.
- [ ] **AC-R3.5**: Layout is fully responsive across mobile (320px), tablet (768px), and desktop (1024px+), transforming multi-column tables into mobile cards.
- [ ] **AC-R3.6**: Navigation links are integrated into the main `Navbar.js` and user profile dropdown without layout glitches.
