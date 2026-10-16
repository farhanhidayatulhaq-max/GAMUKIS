# Project: Gamukis Membership & Subscription Frontend

## Architecture
- **Tech Stack**: React 18.3.1, Create React App (react-scripts 5.0.1, Webpack 5), React Router DOM 6.23.1, Custom Modular CSS.
- **Backend API**: Express.js server mounting routes at `/api/memberships`. Default base URL: `http://localhost:5000/api`.
- **Authentication**: Dual Auth Mechanism (`authenticateAny`):
  - Manual MySQL JWT stored in `localStorage` under `gamukis_manual_token`.
  - Google Firebase ID token via `auth.currentUser.getIdToken()`.
  - API Client dynamically resolves whichever token is present and attaches `Authorization: Bearer <token>`.
- **UI Design System**:
  - Authoritative Gamukis visual design: primary blues (`#206bf0`, `#4f7eff`, `#0B3C99`), brand golds/yellows (`#ffd044`, `#FCD13F`, `#ffbe06`), cream/pastel backgrounds (`#fffdf5`, `#f4f8fc`), and status greens (`#14A86B`, `#078459`).
  - Cards: `border-radius: 18px - 24px`, white surface background `#ffffff`, subtle border `#e3ebf3`, elevation shadow `0 10px 28px rgba(52, 91, 128, 0.08)`.
  - 3D tactile buttons: Primary yellow button with `#F5A623` 4px drop shadow, primary blue button with `#0B3C99` 4px drop shadow, destructive soft-red button (`#fff0ec` / `#d85e4d`).
  - Modals: Accessible dialog with dark blue border `3px solid #0b2d6b` and backdrop blur overlay `rgba(10, 24, 63, 0.48)`.
  - Responsive multi-device layout supporting mobile (320px+), tablet (768px+), and desktop (1024px+).

## Feature Inventory
Every feature from the Survey phase is mapped to an assigned milestone.
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Fetch Role-Specific Plans | Retrieve active plans from `GET /api/memberships/plans` filtered by role (`siswa` or `guru`) | M1, M2 | Survey |
| F02 | Plan Card Presentation | Responsive cards displaying plan name, formatted Rupiah price, duration, and feature bullets | M2 | Survey |
| F03 | Subscribe to Free Plan | Immediately activate free tier via `POST /api/memberships/subscribe` returning HTTP 201 | M1, M2 | Survey |
| F04 | Subscribe to Paid Plan | Submit order for paid plan via `POST /api/memberships/subscribe` returning HTTP 202 (pending) | M1, M2 | Survey |
| F05 | Audience Mismatch Protection | Gracefully handle role incompatibility errors (HTTP 403) with clear user feedback | M1, M2 | Survey |
| F06 | Admin Exemption Handling | Display informational banner for administrator accounts noting unlimited access | M2 | Survey |
| F07 | Active Plan Status Indicator | Visual badge and disabled "Paket Aktif Saat Ini" button on the user's current plan | M2 | Survey |
| F08 | Subscription Confirmation Dialog | Modal summarizing plan details before triggering `POST /subscribe` | M2 | Survey |
| F09 | Fetch Active & Pending Status | Retrieve active plan and pending orders from `GET /api/memberships/me` | M1, M3 | Survey |
| F10 | Active Membership Hero Display | Gradient hero banner showing current plan name, active status pill, and expiration date | M3 | Survey |
| F11 | Effective Features Checklist | Visual grid displaying unlocked perks and character/class limits | M3 | Survey |
| F12 | Default Free Plan State | State representation when user is on baseline free tier (`source === 'default'`) with upgrade CTA | M3 | Survey |
| F13 | Pending Payment Notice Banner | Amber warning card showing details when an order is awaiting payment confirmation | M3 | Survey |
| F14 | Subscription History Audit Table | Tabular display of past transactions from `GET /api/memberships/history` with status pills | M1, M3 | Survey |
| F15 | Cancel Active Subscription | Allow user to cancel active/pending membership via `POST /api/memberships/cancel` | M1, M3 | Survey |
| F16 | Cancellation Confirmation Modal | Safety dialog confirming intent to revert to free tier before executing cancellation | M3 | Survey |
| F17 | Gamukis Color Palette Harmony | Strict compliance with Gamukis design tokens and visual styling across all views | M2, M3, M4 | Survey |
| F18 | Navigation & Navbar Integration | Header link to Membership Plans and profile dropdown link to Membership Dashboard | M4 | Survey |
| F19 | Toast & Inline Alert Feedback | Responsive toast/banner alerts for success, error, and pending operations | M2, M3 | Survey |
| F20 | Responsive Multi-Device Layout | Fluid layout adapting grids to stacked cards on mobile viewports | M2, M3 | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Test Suite Creation | Design and build comprehensive opaque-box E2E test suite (Tiers 1-4, 105 tests), publish `TEST_READY.md` | none | DONE |
| M1 | Membership API Service Layer | Implement `Frontend/src/database/membershipApi.js` with dual auth token extraction and full endpoint wrappers | none | DONE |
| M2 | Membership Plans Page (R1) | Build `Frontend/src/pages/membershipPlans.js` and `membershipPlans.css` | M1 | DONE |
| M3 | User Membership Dashboard (R2) | Build `Frontend/src/pages/membershipDashboard.js` and `membershipDashboard.css` | M1 | DONE |
| M4 | Navigation & Routing (R3) | Register routes in `Frontend/src/App.js` and add links in `Frontend/src/component/Navbar.js` | M2, M3 | DONE |
| M5 | Final Milestone: E2E Pass & Hardening | Pass 100% of E2E test suite (Tiers 1-4), adversarial test hardening (Tier 5), forensic audit | E2E, M4 | IN_PROGRESS |

## Interface Contracts

### Frontend API Client ↔ Backend (`membershipApi.js`)
- `getPlans()`: `GET /api/memberships/plans` -> Promise<{ plans: Array<Plan> }>
- `getMyMembership()`: `GET /api/memberships/me` -> Promise<{ membership: Membership, pending: PendingOrder | null }>
- `getMembershipHistory()`: `GET /api/memberships/history` -> Promise<{ history: Array<HistoryItem> }>
- `subscribePlan(planCode)`: `POST /api/memberships/subscribe`, Body: `{ planCode }` -> Promise<{ message, membershipId, status, paymentUrl? }>
- `cancelMembership()`: `POST /api/memberships/cancel`, Body: `{}` -> Promise<{ success: boolean, cancelled: number }>

### Data Types
- `Plan`: `{ id: number, code: string, name: string, audience: 'siswa'|'guru', price: number, durationDays: number|null, features: Record<string, any>, isActive: boolean }`
- `Membership`: `{ plan: Plan|null, source: 'membership'|'default'|'administrator', features: Record<string, any>, expiresAt: string|null }`
- `PendingOrder`: `{ membershipId: number, createdAt: string, plan: Plan }`
- `HistoryItem`: `{ id: number, status: 'active'|'pending'|'cancelled', started_at: string|null, expires_at: string|null, payment_ref: string|null, created_at: string, code: string, name: string, price: number }`

## Code Layout
- `Frontend/src/database/membershipApi.js`: API client module (Implemented & Verified)
- `Frontend/src/pages/membershipPlans.js`: Membership plans page component (In progress)
- `Frontend/src/pages/membershipPlans.css`: Styles for membership plans page (In progress)
- `Frontend/src/pages/membershipDashboard.js`: User membership dashboard component (In progress)
- `Frontend/src/pages/membershipDashboard.css`: Styles for user membership dashboard (In progress)
- `Frontend/src/App.js`: Route registration (`/membership/plans`, `/membership`, `/membership/dashboard`)
- `Frontend/src/component/Navbar.js`: Main header navigation and profile dropdown links
- `Frontend/src/__tests__/membership/`: E2E and component test suite (105 tests, Ready)
