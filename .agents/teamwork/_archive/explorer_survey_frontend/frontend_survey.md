# Comprehensive Frontend Survey Report: Gamukis UI Architecture & Design System

**Date**: 2026-10-10  
**Author**: teamwork_preview_explorer (Frontend Survey Explorer)  
**Project**: Gamukis Frontend (`c:\Users\LOQ\Documents\gamukis\Frontend`)  
**Context**: Blueprint for Implementing R1 (Membership Plans Page) & R2 (User Membership Dashboard) in full alignment with the existing design system.

---

## 1. Executive Summary & Tech Stack Overview

### 1.1 Tooling & Framework
- **Framework**: React 18.3.1 (`react`, `react-dom` v18.3.1)
- **Bundler / Build System**: Create React App (`react-scripts` v5.0.1 with Webpack 5). **Note**: The project does *not* use Vite.
- **Routing**: `react-router-dom` v6.23.1 (`BrowserRouter`, `Routes`, `Route`, `NavLink`, `useNavigate`).
- **Icons**: `react-icons` v5.2.1 and inline SVG symbols/assets.
- **Modals**: Custom CSS overlay dialogs and `react-modal` v3.16.1.
- **Analytics & Realtime**: `react-ga4` v2.1.0, `socket.io-client` v4.8.3, `firebase` v10.14.1.

### 1.2 Styling Paradigm
- **Architecture**: Modular vanilla CSS stylesheets per page and component (e.g. `Navbar.css`, `profile.css`, `adminDashboard.css`, `completeProfile.css`).
- **CSS Preprocessors / Frameworks**:
  - **No Tailwind CSS**: While `tailwindcss` exists as an indirect dev dependency in `package-lock.json`, there is **no** `tailwind.config.js` and **no** `@tailwind` directives in `src/`.
  - **styled-components**: Listed in `package.json` (`^6.1.12`), but unused in `src/`.
  - **Recommendation**: Write clean, modular CSS paired with each new page (`membershipPlans.css` and `membershipDashboard.css`) using CSS variables and established BEM-like class naming matching `profile.css` and `adminDashboard.css`.

---

## 2. Gamukis UI Design System & Visual Tokens

The Gamukis visual design is playful, modern, game-oriented, and accessible, characterized by vibrant yellows, primary blues, soft cream/light-blue background canvases, prominent rounded corners, and subtle 3D tactile button elevations.

The authoritative brand colors are directly documented in `src/images/palette.svg` and `src/pages/adminDashboard.css`:

### 2.1 Complete Brand Color Palette

| Token / Role | HEX / Value | CSS Variable | Common Usage |
|---|---|---|---|
| **Primary Yellow (Brand)** | `#FCD13F` / `#FCD03E` | `--y: #FCD13F` | Active nav pill, logo highlight, primary button background, table accent borders |
| **Accent / Button Yellow** | `#FFC926` | `--y2: #FFC926` | Main CTA button background, interactive highlights |
| **Deep Yellow (3D Shadow)** | `#F5A623` | `--yd: #F5A623` | Bottom 3D shadow for yellow buttons (`box-shadow: 0 4px 0 #F5A623`) |
| **Cream / Warm Pastel** | `#FFF8D6` | `--cream: #FFF8D6` | Sidebar background, pending status badge, soft alert cards |
| **Primary Blue (Gamukis Blue)**| `#5B8DFE` / `#206bf0` | `--b: #5B8DFE` | Hero gradient start, primary action buttons, links, brand badges |
| **Deep Blue (3D Shadow / Dark)**| `#0B3C99` / `#0b2d6b` | `--bd: #0B3C99` | Bottom 3D shadow for blue buttons (`box-shadow: 0 4px 0 #0B3C99`), modal borders |
| **Cyan / Sky Blue** | `#5BCBF5` / `#08b9c9` | `--cy: #5BCBF5` | Hero gradient end (`linear-gradient(110deg, #5BCBF5, #5B8DFE)`), badge accents |
| **Success Green** | `#14A86B` / `#078459` | `--green: #14A86B` | Active status pills, positive validation messages, success alerts |
| **Success Tint Background** | `#DDF7EC` / `#e2fff2` | — | Background for active/success status badges |
| **Danger / Alert Coral Red** | `#F0605D` / `#d94841` | `--red: #F0605D` | Cancel button, error banners, notification dot, overdue indicators |
| **Danger Tint Background** | `#FFE7E6` / `#FFF1F0` | — | Background for cancel/delete buttons and alert banners |
| **Canvas Background (Warm)** | `#FFFDF3` | `--bg: #FFFDF3` | Admin dashboard canvas background |
| **Canvas Background (Cool)** | `#f4f8fc` | — | Profile page canvas background |
| **Card / Surface Background**| `#ffffff` | `--card: #ffffff` | Panels, cards, modal popups, dropdown menus |
| **Primary Dark Text (Ink)** | `#19324d` / `#333333` | `--ink: #333333` | Headings, titles, active labels, table text |
| **Secondary Text (Body)** | `#274761` / `#555555` | — | Descriptions, body copy, form input text |
| **Muted Text / Metadata** | `#7890a6` / `#777777` | `--mut: #777777` | Timestamps, subtitles, input labels, table column headers |
| **Border / Divider Line** | `#e3ebf3` / `#dbe5ee` / `#eee` | `--line: #eeeeee` | Card borders, table rows, input boundaries |

### 2.2 Typography Hierarchy

- **Main Font Families**:
  - UI, Panels & Admin: `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Navbar: `"Roboto", sans-serif`
  - Table Emphasis / Serif Accents: `Georgia, "Times New Roman", serif`
- **Typographic Scale**:
  - **Hero Title**: `font-size: clamp(26px, 4vw, 42px); font-weight: 800;`
  - **Section Title (`h1`, `h2`)**: `font-size: clamp(20px, 2.2vw, 26px); font-weight: 700;`
  - **Card / Subsection Header (`h3`)**: `font-size: 16px - 18px; font-weight: 700;`
  - **Eyebrow / Category Label**: `font-size: 11px - 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;`
  - **Body Text**: `font-size: 14px - 15px; line-height: 1.5;`
  - **Metadata / Small Details**: `font-size: 11px - 13px;`

### 2.3 Elevations, Shadows & Border Radii

- **Border Radii**:
  - Pills / Badges: `999px` (or `20px` / `40px`)
  - Input Fields & Selects: `9px` - `12px`
  - Buttons: `10px` - `14px` (or `40px` pill-style for navbar login)
  - Cards & Panels: `18px` - `24px`
  - Hero Banners: `24px`
- **Box Shadows**:
  - Card / Panel Shadow: `box-shadow: 0 10px 28px rgba(52, 91, 128, 0.08);`
  - Admin Card Shadow: `box-shadow: 0 6px 24px rgba(91, 141, 254, 0.14);`
  - Hero Banner Glow: `box-shadow: 0 18px 40px rgba(38, 107, 200, 0.22);`
  - Modal Elevation: `box-shadow: 0 14px 36px rgba(0, 0, 0, 0.22);`
  - Dropdown Menu Elevation: `box-shadow: 0 10px 24px rgba(67, 87, 128, 0.18);`
  - 3D Button Shadows:
    - Yellow: `box-shadow: 0 4px 0 #F5A623;`
    - Blue: `box-shadow: 0 4px 0 #0B3C99;`
    - Button Active State: `transform: translateY(2px); box-shadow: none;`

---

## 3. Component Catalog & Implementation Specifications

### 3.1 Buttons

1. **Primary Yellow CTA (3D Tactical Style)**:
   ```css
   .btn-primary-yellow {
     background: #FFC926;
     color: #25344d;
     border: none;
     border-radius: 12px;
     padding: 12px 24px;
     font-weight: 700;
     font-size: 14px;
     cursor: pointer;
     box-shadow: 0 4px 0 #F5A623;
     transition: transform 0.1s ease, box-shadow 0.1s ease;
   }
   .btn-primary-yellow:hover {
     background: #fcd13f;
   }
   .btn-primary-yellow:active {
     transform: translateY(2px);
     box-shadow: none;
   }
   ```
2. **Primary Blue CTA**:
   ```css
   .btn-primary-blue {
     background: #206bf0;
     color: #ffffff;
     border: none;
     border-radius: 12px;
     padding: 12px 24px;
     font-weight: 700;
     font-size: 14px;
     cursor: pointer;
     box-shadow: 0 4px 0 #0B3C99;
     transition: transform 0.1s ease, box-shadow 0.1s ease;
   }
   .btn-primary-blue:hover {
     background: #3b7ee8;
   }
   .btn-primary-blue:active {
     transform: translateY(2px);
     box-shadow: none;
   }
   ```
3. **Danger / Cancel Button**:
   ```css
   .btn-danger-cancel {
     background: #FFE7E6;
     color: #F0605D;
     border: 1px solid #ffd0cf;
     border-radius: 10px;
     padding: 8px 16px;
     font-weight: 700;
     font-size: 13px;
     cursor: pointer;
     transition: background 0.15s ease, transform 0.1s ease;
   }
   .btn-danger-cancel:hover {
     background: #ffd8d6;
     transform: translateY(-1px);
   }
   ```
4. **Secondary / Outline Button**:
   ```css
   .btn-secondary {
     background: #ffffff;
     color: #274761;
     border: 1px solid #dbe5ee;
     border-radius: 10px;
     padding: 10px 18px;
     font-weight: 600;
     font-size: 14px;
     cursor: pointer;
   }
   .btn-secondary:hover {
     background: #f4f8fc;
     border-color: #5B8DFE;
   }
   ```

### 3.2 Cards & Hero Panels

1. **Hero Header Banner (Profile / Dashboard Style)**:
   ```css
   .membership-hero {
     display: grid;
     grid-template-columns: auto 1fr auto;
     align-items: center;
     gap: 24px;
     padding: clamp(24px, 4vw, 42px);
     border-radius: 24px;
     background: linear-gradient(120deg, #206bf0, #08b9c9);
     color: #ffffff;
     box-shadow: 0 18px 40px rgba(38, 107, 200, 0.22);
     margin-bottom: 24px;
   }
   ```
2. **Standard Surface Panel**:
   ```css
   .membership-panel {
     padding: clamp(20px, 3vw, 30px);
     border: 1px solid #e3ebf3;
     border-radius: 18px;
     background: #ffffff;
     box-shadow: 0 10px 28px rgba(52, 91, 128, 0.08);
   }
   ```
3. **Plan Tier Card (Pricing Grid)**:
   ```css
   .plan-card {
     display: flex;
     flex-direction: column;
     border: 2px solid #e3ebf3;
     border-radius: 22px;
     background: #ffffff;
     padding: 28px 24px;
     box-shadow: 0 8px 24px rgba(52, 91, 128, 0.06);
     position: relative;
     transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
   }
   .plan-card:hover {
     transform: translateY(-4px);
     box-shadow: 0 16px 36px rgba(38, 107, 200, 0.14);
   }
   .plan-card.featured {
     border-color: #FFC926;
     background: linear-gradient(180deg, #FFFDF3 0%, #FFFFFF 100%);
     box-shadow: 0 12px 32px rgba(255, 201, 38, 0.2);
   }
   .plan-card.featured::before {
     content: "POPULER";
     position: absolute;
     top: -12px;
     right: 24px;
     background: #FFC926;
     color: #25344d;
     font-size: 11px;
     font-weight: 800;
     padding: 4px 12px;
     border-radius: 999px;
     letter-spacing: 0.05em;
   }
   ```

### 3.3 Badges & Status Pills

```css
/* Active / Subscribed */
.badge-active {
  padding: 6px 12px;
  border-radius: 999px;
  background: #e2fff2;
  color: #078459;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Pending / Waiting Payment */
.badge-pending {
  padding: 6px 12px;
  border-radius: 999px;
  background: #FFF8D6;
  color: #8a6400;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Cancelled / Inactive */
.badge-cancelled {
  padding: 6px 12px;
  border-radius: 999px;
  background: #FFE7E6;
  color: #F0605D;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
```

### 3.4 Responsive History Table

Matches `TeacherTable.css` and `adminDashboard.css`:
```css
.history-table-wrap {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid #e3ebf3;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  text-align: left;
}

.history-table th {
  background: #f8fafc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #7890a6;
  text-transform: uppercase;
  padding: 12px 16px;
  border-bottom: 2px solid #e3ebf3;
}

.history-table td {
  padding: 16px;
  font-size: 14px;
  color: #274761;
  border-bottom: 1px solid #edf1f5;
  vertical-align: middle;
}

/* Mobile responsive card stacking */
@media (max-width: 768px) {
  .history-table, .history-table tbody, .history-table tr, .history-table td {
    display: block;
    width: 100%;
  }
  .history-table thead { display: none; }
  .history-table tr {
    margin-bottom: 12px;
    padding: 14px;
    border-radius: 14px;
    background: #fff;
    border: 1px solid #e3ebf3;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  }
  .history-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px dashed #edf1f5;
  }
  .history-table td:last-child { border-bottom: none; }
  .history-table td::before {
    content: attr(data-label);
    font-weight: 700;
    font-size: 12px;
    color: #7890a6;
    text-transform: uppercase;
  }
}
```

### 3.5 Modals & Confirmation Dialogs

Matches the modal in `login.css`:
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(10, 24, 63, 0.5);
  backdrop-filter: blur(2px);
  animation: modal-fade-in 180ms ease-out both;
}

.modal-card {
  position: relative;
  width: min(440px, 100%);
  padding: 32px 28px 24px;
  border: 3px solid #206bf0;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.22);
  text-align: center;
  animation: modal-pop-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes modal-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes modal-pop-in {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

---

## 4. Auth State & API Layer Survey

### 4.1 Dual Authentication Mechanism
Gamukis supports two authentication providers:
1. **Manual Email/Password Authentication (MySQL)**:
   - Tokens stored in `localStorage` or `sessionStorage` under key `gamukis_manual_token`.
   - Serialized user object stored under key `gamukis_manual_user`.
   - State updates trigger a window event: `window.dispatchEvent(new Event("gamukis-manual-auth-change"))`.
2. **Google OAuth / Firebase Authentication**:
   - Managed via Firebase Auth SDK (`onAuthStateChanged(auth, callback)`).
   - ID Token obtained via `auth.currentUser.getIdToken()`.
3. **Backend Middleware (`authenticateAny`)**:
   - `Backend/src/middlewares/anyAuthMiddleware.js` inspects `Authorization: Bearer <token>`.
   - It seamlessly verifies either manual JWTs or Firebase ID tokens and resolves the user's account role (`req.account.role`).

### 4.2 Membership API Endpoints & Contract

All membership routes are registered in `Backend/index.js` under `/api/memberships` and defined in `Backend/src/routes/membershipRoute.js`:

| Method | Endpoint | Permission | Request Body | Response Payload |
|---|---|---|---|---|
| `GET` | `/api/memberships/plans` | `membership:own` | None | `{ plans: [ { id, code, name, audience, price, durationDays, features, isActive } ] }`<br>*Note: automatically filtered by user's role (siswa/guru).* |
| `GET` | `/api/memberships/me` | `membership:own` | None | `{ membership: { plan, source, features, expiresAt }, pending: { membershipId, createdAt, plan } \| null }` |
| `GET` | `/api/memberships/history` | `membership:own` | None | `{ history: [ { id, status, started_at, expires_at, payment_ref, created_at, code, name, price } ] }` |
| `POST` | `/api/memberships/subscribe` | `membership:own` | `{ planCode: string }` | Free plan: `201 { message: 'Paket aktif.', membershipId, status: 'active' }`<br>Paid plan: `202 { message: 'Menunggu pembayaran.', membershipId, status: 'pending', paymentUrl: null }` |
| `POST` | `/api/memberships/cancel` | `membership:own` | None | `{ success: true, cancelled: count }` *(reverts account back to `<role>_free`)* |

### 4.3 Default Seed Plans in Database
From `Backend/src/config/Database/MySQL/connection.js`:
- **Siswa Plans**:
  - `siswa_free`: Rp 0 (Gratis) - `{ maxCharacters: 5 }`
  - `siswa_premium`: Rp 29.000 (30 Hari) - `{ maxCharacters: 10, extraAvatars: true, progressReport: true }`
- **Guru Plans**:
  - `guru_free`: Rp 0 (Gratis) - `{ maxCharacters: 5, maxClasses: 1 }`
  - `guru_pro`: Rp 99.000 (30 Hari) - `{ maxCharacters: 10, maxClasses: 20, studentAnalytics: true, exportReport: true }`

### 4.4 Recommended Membership API Client (`src/database/membershipApi.js`)
To avoid duplicating token extraction logic, create a dedicated `src/database/membershipApi.js` that abstracts both manual tokens and Firebase tokens:

```javascript
import { auth } from "./firebaseAuth";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const MANUAL_TOKEN_KEY = "gamukis_manual_token";

const getActiveToken = async () => {
  const manual = localStorage.getItem(MANUAL_TOKEN_KEY) || sessionStorage.getItem(MANUAL_TOKEN_KEY);
  if (manual) return manual;
  const firebaseUser = auth.currentUser;
  if (firebaseUser) return await firebaseUser.getIdToken();
  return null;
};

export const membershipRequest = async (path, options = {}) => {
  const token = await getActiveToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Permintaan membership gagal.");
  }
  return data;
};

export const getPlans = () => membershipRequest("/memberships/plans");
export const getMyMembership = () => membershipRequest("/memberships/me");
export const getMembershipHistory = () => membershipRequest("/memberships/history");
export const subscribePlan = (planCode) => membershipRequest("/memberships/subscribe", {
  method: "POST",
  body: JSON.stringify({ planCode })
});
export const cancelMembership = () => membershipRequest("/memberships/cancel", {
  method: "POST"
});
```

---

## 5. Routing & Navigation Integration Points

### 5.1 Route Setup in `src/App.js`
In `src/App.js`, import the new pages:
```javascript
import MembershipPlans from "./pages/membershipPlans";
import MembershipDashboard from "./pages/membershipDashboard";
```
Add route entries within `<Routes>`:
```jsx
<Route path="/membership/plans" element={<MembershipPlans />} />
<Route path="/membership/dashboard" element={<MembershipDashboard />} />
```

### 5.2 Navigation Integration in `src/component/Navbar.js`
In `Navbar.js`:
1. **Primary Navigation Bar**:
   Add a link to the Membership Plans page in `<ul className='navigation'>`:
   ```jsx
   <li>
     <NavLink to="/membership/plans" className={({ isActive }) => isActive ? 'active' : ''}>
       Membership
     </NavLink>
   </li>
   ```
2. **Profile Dropdown Menu**:
   Add a direct link to the User Membership Dashboard in the user dropdown:
   ```jsx
   <div className="profile-dropdown" role="menu">
     <NavLink to="/profile" role="menuitem" onClick={() => setIsProfileMenuOpen(false)}>
       Profil saya
     </NavLink>
     <NavLink to="/membership/dashboard" role="menuitem" onClick={() => setIsProfileMenuOpen(false)}>
       Membership Saya
     </NavLink>
     <button type="button" role="menuitem" onClick={handleSignOut}>
       Keluar
     </button>
   </div>
   ```

### 5.3 Quick Links in `src/pages/profile.js` & `profileSummary.js`
In `ProfileSummary.js`:
Add a membership status row showing the user's current tier and a button/link navigating directly to `/membership/dashboard`:
```jsx
<div>
  <span>Status Membership</span>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <strong style={{ color: '#206bf0' }}>{membershipPlanName || 'Paket Gratis'}</strong>
    <NavLink to="/membership/dashboard" style={{ fontSize: '12px', color: '#5B8DFE', textDecoration: 'none', fontWeight: 700 }}>
      Kelola →
    </NavLink>
  </div>
</div>
```

---

## 6. Page Specifications for Implementers

### 6.1 Page R1: Membership Plans Page (`/membership/plans`)
- **Page Container**: Follows `.profile-page` styling (`min-height: 100vh; background: #f4f8fc;`).
- **Navbar**: Standard `<Navbar />` rendered at top.
- **Hero Section**:
  - Eyebrow: `PAKET LANGGANAN GAMUKIS`
  - Title: `Tingkatkan Petualangan Belajarmu`
  - Subtitle: `Pilih paket membership terbaik yang sesuai untuk kebutuhan belajarmu.`
- **Unauthenticated Handling**:
  - When no active user is detected, display `.profile-auth-message`: "Silakan masuk terlebih dahulu untuk melihat dan memilih paket membership" with CTA button redirecting to `/login`.
- **Role Audience Filter / Badge**:
  - Display user's detected role ("Siswa" or "Guru") badge to clarify why specific plans are presented.
- **Plans Grid**:
  - CSS Grid with `repeat(auto-fit, minmax(280px, 1fr))`, max-width `1120px`, margin `0 auto`.
  - Free card: Rp 0 / Selamanya. Button: "Paket Dasar" or "Pilih Gratis".
  - Premium / Pro card: Highlighted with amber border (`#FFC926`), badge "POPULER", formatted price (`Rp 29.000` / `Rp 99.000` per 30 hari).
  - Feature checklist items with checkmark icons (`✔`).
  - Active Plan indication: If user already has this plan active, button is labeled "Paket Anda Saat Ini" and disabled.
- **Confirmation Modal**:
  - When clicking "Langganan Sekarang", display confirmation modal detailing plan name, price, duration, and "Konfirmasi Langganan" button.
- **Feedback & Redirect**:
  - On successful subscription: display success message and provide option to navigate to `/membership/dashboard`.

### 6.2 Page R2: User Membership Dashboard (`/membership/dashboard`)
- **Page Container**: Same theme and canvas (`#f4f8fc`), with `<Navbar />`.
- **Hero / Header**:
  - Shows user name, active plan name, expiration date countdown, and role.
- **Active Subscription Status Card**:
  - Plan title with `.badge-active` or `.badge-pending`.
  - Expiration Date formatted in Indonesian (`new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(...)`).
  - Active Features grid displaying pills (e.g., "Karakter: 10", "Analitik Guru", "Laporan Belajar").
  - Cancellation Button:
    - If active plan is paid (`price > 0`), display "Batalkan Langganan" button (`.btn-danger-cancel`).
    - Clicking triggers a confirmation modal: "Apakah Anda yakin ingin membatalkan langganan? Anda akan kembali ke paket gratis."
    - Calling `POST /api/memberships/cancel` refreshes active status and moves status to cancelled.
- **Pending Payment Notice**:
  - If a pending subscription exists, show warning box (`.admin-note` or `.profile-role-notice` style) stating payment confirmation is pending.
- **Subscription History Section**:
  - Card titled "Riwayat Langganan".
  - Table displaying Date, Plan Name, Price, Status Badge, and Transaction Reference.
  - Empty state with illustration or icon if history is empty.

---

## 7. Checklist for Frontend Implementation

- [ ] Create `Frontend/src/database/membershipApi.js` supporting dual auth tokens.
- [ ] Create `Frontend/src/pages/membershipPlans.js` and `membershipPlans.css`.
- [ ] Create `Frontend/src/pages/membershipDashboard.js` and `membershipDashboard.css`.
- [ ] Register `/membership/plans` and `/membership/dashboard` routes in `Frontend/src/App.js`.
- [ ] Add navigation link to `/membership/plans` in `Frontend/src/component/Navbar.js`.
- [ ] Add navigation link to `/membership/dashboard` in `Navbar.js` profile dropdown.
- [ ] Verify responsiveness across Mobile (360px - 480px), Tablet (768px), and Desktop (1024px+).
- [ ] Verify Indonesian formatting for currency (`Rp xx.xxx`) and dates (`DD MMMM YYYY`).
