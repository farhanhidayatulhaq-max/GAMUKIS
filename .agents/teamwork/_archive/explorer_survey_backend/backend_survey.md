# Backend Survey: Membership & Subscription System

**Survey Date**: 2026-10-10  
**Surveyed By**: `teamwork_preview_explorer` (Backend Survey Explorer)  
**Target Subsystem**: `Backend/src/routes/membershipRoute.js` & Related Modules  
**Repository**: `gamukis`

---

## 1. Executive Summary & Architecture Overview

The membership and subscription system in `gamukis` is implemented in Express.js backed by MySQL. It provides role-based tiering for learning participants (`siswa`) and educators (`guru`), along with administrative management for operators (`administrator`).

### Key Modules:
- **Route Handler**: `Backend/src/routes/membershipRoute.js`
- **Model & Database Layer**: `Backend/src/models/membershipModel.js`
- **Feature Enforcement Middleware**: `Backend/src/middlewares/membershipMiddleware.js` (`requireFeature`)
- **Authentication Middleware**: `Backend/src/middlewares/anyAuthMiddleware.js` (`authenticateAny`)
- **Permission Matrix**: `Backend/src/config/permissions.js` & `Backend/src/middlewares/roleMiddleware.js`
- **Server Entry Point**: `Backend/index.js` (line 55 mounts router)
- **Database Schema & Seeds**: `Backend/src/config/Database/MySQL/connection.js`

---

## 2. Server Mounting, Base URL & Network Configuration

- **Entry Point**: `Backend/index.js` (line 55)
  ```javascript
  app.use('/api/memberships', require('./src/routes/membershipRoute'));
  ```
- **Base Route Prefix**: `/api/memberships` *(Note plural form `memberships`)*
- **Port**: `Number(process.env.PORT) || 5000` (Default: `5000`)
- **CORS Allowed Origins**:
  ```javascript
  app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
  ```
- **Frontend Target URL**:
  Frontend uses `process.env.REACT_APP_API_URL || "http://localhost:5000/api"`.
  Therefore, full path for membership calls is: `${API_URL}/memberships/<subpath>`.

---

## 3. Authentication & Authorization Mechanism

Every route in `membershipRoute.js` passes through `authenticateAny`:

```javascript
router.use(authenticateAny);
```

### 3.1 Dual-Token Authentication (`authenticateAny`)
Header format:
```http
Authorization: Bearer <token>
```
1. **Manual JWT (MySQL Account)**:
   - Verified via `jwt.verify(token, process.env.JWT_SECRET || 'gamukis-development-secret')`.
   - Populates `req.account = { ownerKey: "manual:<userId>", authType: "manual", userId: String(userId), email, username }`.
2. **Google Firebase ID Token**:
   - Fallback if JWT verification fails; decoded via Firebase Admin SDK `firebaseAuth.verifyIdToken(token)`.
   - Populates `req.account = { ownerKey: "google:<uid>", authType: "google", userId: uid, email, username }`.
3. **Role Resolution**:
   - `RoleModel.resolve(...)` queries MySQL `users` or `google_user_roles` to assign `account.role` (`'siswa'`, `'guru'`, or `'administrator'`).
   - Token claims for role are intentionally ignored in favor of MySQL authoritative role state.

### 3.2 Permission System
- `requirePermission('membership:own')`:
  - Defined in `permissions.js`: Granted to `ALL_ROLES` (`['siswa', 'guru', 'administrator']`).
  - Guards all user endpoints (`/plans`, `/me`, `/history`, `/subscribe`, `/cancel`).
- `requirePermission('membership:manage')`:
  - Granted exclusively to `[ROLES.ADMIN]` (`'administrator'`).
  - Guards all `/admin/...` endpoints.

---

## 4. Comprehensive Endpoint Specifications

### 4.1 GET `/api/memberships/plans`
Fetches available active membership plans filtered by the user's role.

- **Access**: Authenticated (`membership:own`)
- **Query Params**: None
- **Audience Scoping**:
  - `siswa`: Receives plans where `audience = 'siswa'`.
  - `guru`: Receives plans where `audience = 'guru'`.
  - `administrator`: Receives all plans (`audience` not filtered).
- **HTTP Status**: `200 OK`
- **Response Schema**:
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
- **Error Codes**:
  - `401 Unauthorized`: Missing or invalid token.
  - `500 Internal Server Error`: `{"message": "Daftar paket gagal dimuat."}`

---

### 4.2 GET `/api/memberships/me`
Retrieves the user's active/effective membership and any pending subscriptions.

- **Access**: Authenticated (`membership:own`)
- **Query Params**: None
- **HTTP Status**: `200 OK`
- **Response Schema**:
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
      "expiresAt": "2026-11-10T22:30:00.000Z"
    },
    "pending": null
  }
  ```
- **Field Details**:
  - `membership.source`:
    - `"membership"`: User has an active paid or granted subscription in `memberships`.
    - `"default"`: User has no active paid subscription and is using the baseline `<role>_free` plan (`expiresAt` is `null`).
    - `"administrator"`: User is admin (`plan` is `null`, `features: { unlimited: true, maxCharacters: 50 }`).
  - `pending`:
    - `null` if no pending order exists.
    - If pending:
      ```json
      {
        "membershipId": 14,
        "createdAt": "2026-10-10T22:30:00.000Z",
        "plan": {
          "id": 2,
          "code": "siswa_premium",
          "name": "Siswa Premium",
          "audience": "siswa",
          "price": 29000,
          "durationDays": 30,
          "features": { "maxCharacters": 10, "extraAvatars": true, "progressReport": true },
          "isActive": true
        }
      }
      ```
- **Error Codes**:
  - `401 Unauthorized`: Missing or invalid token.
  - `500 Internal Server Error`: `{"message": "Status membership gagal dimuat."}`

---

### 4.3 GET `/api/memberships/history`
Returns all past and present membership transactions for the logged-in user.

- **Access**: Authenticated (`membership:own`)
- **HTTP Status**: `200 OK`
- **Response Schema**:
  ```json
  {
    "history": [
      {
        "id": 14,
        "status": "pending",
        "started_at": null,
        "expires_at": null,
        "payment_ref": null,
        "created_at": "2026-10-10T22:30:00.000Z",
        "code": "siswa_premium",
        "name": "Siswa Premium",
        "price": 29000
      },
      {
        "id": 9,
        "status": "active",
        "started_at": "2026-09-10T10:00:00.000Z",
        "expires_at": "2026-10-10T10:00:00.000Z",
        "payment_ref": "manual:admin",
        "created_at": "2026-09-10T09:55:00.000Z",
        "code": "siswa_premium",
        "name": "Siswa Premium",
        "price": 29000
      },
      {
        "id": 3,
        "status": "cancelled",
        "started_at": "2026-08-01T08:00:00.000Z",
        "expires_at": null,
        "payment_ref": null,
        "created_at": "2026-08-01T08:00:00.000Z",
        "code": "siswa_free",
        "name": "Siswa Gratis",
        "price": 0
      }
    ]
  }
  ```
- **Field Nomenclature Note**:
  The history array items use snake_case for DB columns:
  - `id`: integer
  - `status`: `"pending"` | `"active"` | `"cancelled"`
  - `started_at`: ISO timestamp string or `null`
  - `expires_at`: ISO timestamp string or `null`
  - `payment_ref`: string or `null`
  - `created_at`: ISO timestamp string
  - `code`: string
  - `name`: string
  - `price`: integer
- **Error Codes**:
  - `401 Unauthorized`
  - `500 Internal Server Error`: `{"message": "Riwayat membership gagal dimuat."}`

---

### 4.4 POST `/api/memberships/subscribe`
Subscribes the user to a selected membership plan.

- **Access**: Authenticated (`membership:own`), non-admin only
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "planCode": "siswa_premium"
  }
  ```
- **Workflow & Responses**:
  1. **Administrator Block**:
     - Status: `400 Bad Request`
     - Body: `{"message": "Administrator tidak memerlukan membership."}`
  2. **Plan Validation**:
     - If plan not found or `!isActive`: Status `404 Not Found` `{"message": "Paket tidak ditemukan."}`
     - If `plan.audience !== req.account.role`: Status `403 Forbidden` `{"message": "Paket ini khusus untuk <audience>."}`
  3. **Free Plan (`price === 0`)**:
     - Cancels previous active and pending subscriptions.
     - Creates active record immediately.
     - Status: `201 Created`
     - Response:
       ```json
       {
         "message": "Paket aktif.",
         "membershipId": 15,
         "status": "active"
       }
       ```
  4. **Paid Plan (`price > 0`)**:
     - Cancels any prior pending subscription.
     - Inserts record with `status: "pending"`, `started_at: null`, `expires_at: null`.
     - Status: `202 Accepted`
     - Response:
       ```json
       {
         "message": "Menunggu pembayaran.",
         "membershipId": 16,
         "status": "pending",
         "paymentUrl": null
       }
       ```
- **Error Codes**:
  - `400 Bad Request`: Plan validation failure or admin role.
  - `403 Forbidden`: Audience role mismatch.
  - `404 Not Found`: Plan code does not exist.
  - `500 Internal Server Error`: `{"message": "Berlangganan gagal."}`

---

### 4.5 POST `/api/memberships/cancel`
Cancels the user's active and pending subscriptions, effectively downgrading them back to the free default tier.

- **Access**: Authenticated (`membership:own`)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: None / `{}`
- **Database Action**:
  `UPDATE memberships SET status = 'cancelled' WHERE owner_key = ? AND status IN ('active', 'pending')`
- **HTTP Status**: `200 OK`
- **Response Schema**:
  ```json
  {
    "success": true,
    "cancelled": 1
  }
  ```
  *(Note: `cancelled` indicates the count of rows updated. If already cancelled/on free tier, `cancelled` is `0`)*
- **Error Codes**:
  - `401 Unauthorized`
  - `500 Internal Server Error`: `{"message": "Pembatalan gagal."}`

---

### 4.6 Administrator Endpoints (`requirePermission('membership:manage')`)
For operational and administrative monitoring:

| Method | Endpoint | Description | Key Body / Params |
|---|---|---|---|
| `GET` | `/api/memberships/admin/plans` | List all plans (including `is_active = 0`) | None |
| `POST` | `/api/memberships/admin/plans` | Create a new membership plan | `{ code, name, audience, price, durationDays, features }` |
| `PATCH` | `/api/memberships/admin/plans/:id` | Update an existing plan | `{ name, price, durationDays, features, isActive }` |
| `POST` | `/api/memberships/admin/memberships/:id/confirm` | Confirm & activate pending payment | Optional `{ paymentRef }` |
| `POST` | `/api/memberships/admin/grant` | Directly grant plan to user for free | `{ authType, userId, planCode }` |

---

## 5. Database Schema & Seed Data

Defined in `Backend/src/config/Database/MySQL/connection.js`:

### 5.1 `membership_plans`
```sql
CREATE TABLE IF NOT EXISTS membership_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  audience VARCHAR(20) NOT NULL,
  price INT NOT NULL DEFAULT 0,
  duration_days INT NULL,
  features JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_membership_plans_audience (audience)
)
```

### 5.2 `memberships`
```sql
CREATE TABLE IF NOT EXISTS memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_key VARCHAR(160) NOT NULL,
  auth_type VARCHAR(10) NOT NULL,
  owner_id VARCHAR(128) NOT NULL,
  plan_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  started_at DATETIME NULL,
  expires_at DATETIME NULL,
  payment_ref VARCHAR(100) NULL,
  granted_by VARCHAR(160) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_memberships_owner (owner_key, status),
  CONSTRAINT fk_memberships_plan FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
)
```

### 5.3 Default Seed Plans
| Code | Name | Audience | Price (IDR) | Duration | Features |
|---|---|---|---|---|---|
| `siswa_free` | Siswa Gratis | `siswa` | 0 | `null` | `{"maxCharacters": 5}` |
| `siswa_premium` | Siswa Premium | `siswa` | 29,000 | 30 days | `{"maxCharacters": 10, "extraAvatars": true, "progressReport": true}` |
| `guru_free` | Guru Gratis | `guru` | 0 | `null` | `{"maxCharacters": 5, "maxClasses": 1}` |
| `guru_pro` | Guru Pro | `guru` | 99,000 | 30 days | `{"maxCharacters": 10, "maxClasses": 20, "studentAnalytics": true, "exportReport": true}` |

---

## 6. Lifecycle & State Transitions

```
                    [User selects Paid Plan]
                          │ (POST /subscribe)
                          ▼
                    ┌───────────┐
         ┌─────────▶│  Pending  │─────────────┐
         │          └─────┬─────┘             │
         │                │                   │
         │                │ (Admin Confirm /  │ (Cancel /
         │                │  Payment Webhook) │  New Sub)
         │                ▼                   │
  (Re-subscribe)    ┌───────────┐             │
         │          │  Active   │             ▼
         │          └─────┬─────┘       ┌───────────┐
         │                │             │ Cancelled │
         │                ├────────────▶│ (Fallback │
         │                │  (Cancel /  │  to Free) │
         │                │   Expired)  └───────────┘
         │                ▼                   ▲
         │          ┌───────────┐             │
         └──────────│  Expired  ├─────────────┘
                    └───────────┘
```

1. **Active Checking**: `expires_at IS NULL OR expires_at > NOW()`. If expired, query returns null, causing `getEffective()` to fall back to `<role>_free`.
2. **Cancellation**: Marking records `cancelled` in DB preserves history while immediately falling back to `<role>_free`.
3. **Pending Cleanup**: Starting any new subscription cancels any existing `pending` records first.

---

## 7. Frontend Integration Blueprint

### 7.1 Existing Patterns in `gamukis/Frontend`
- **HTTP Client**: Native `window.fetch()` wrapped in helper functions (`manualAuth.js`, `firebaseDatabase.js`).
- **Base URL**: `const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"`.
- **Token Resolution**:
  - Manual Auth token stored in: `localStorage.getItem("gamukis_manual_token") || sessionStorage.getItem("gamukis_manual_token")`.
  - Google/Firebase token obtained via: `auth.currentUser?.getIdToken()`.
- **Event Bus**: `window.dispatchEvent(new Event("gamukis-manual-auth-change"))` informs components on manual login/logout.

### 7.2 Recommended API Client (`Frontend/src/database/membershipApi.js`)
To support both manual JWT and Firebase Google users transparently, the API client should resolve tokens dynamically:

```javascript
import { auth } from "./firebaseAuth";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const MANUAL_TOKEN_KEY = "gamukis_manual_token";

const getAuthToken = async () => {
  const manualToken = localStorage.getItem(MANUAL_TOKEN_KEY) || sessionStorage.getItem(MANUAL_TOKEN_KEY);
  if (manualToken) return manualToken;
  if (auth.currentUser) return await auth.currentUser.getIdToken();
  return null;
};

const membershipRequest = async (path, options = {}) => {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/memberships${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Permintaan ke server gagal.");
  }
  return data;
};

export const getPlans = async () => {
  const data = await membershipRequest("/plans");
  return data.plans || [];
};

export const getMyMembership = async () => {
  return await membershipRequest("/me");
};

export const getMembershipHistory = async () => {
  const data = await membershipRequest("/history");
  return data.history || [];
};

export const subscribePlan = async (planCode) => {
  return await membershipRequest("/subscribe", {
    method: "POST",
    body: JSON.stringify({ planCode })
  });
};

export const cancelMembership = async () => {
  return await membershipRequest("/cancel", {
    method: "POST"
  });
};
```

---

## 8. Summary Checklist for Frontend Implementation

1. **Plans Display (`GET /api/memberships/plans`)**:
   - Filtered automatically by backend per role (`siswa` or `guru`).
   - Cards should display: Plan Name, Price (formatted in IDR, e.g. `Rp 29.000 / 30 hari`), Duration, List of features.
   - Distinct badges for "Gratis" vs "Berbayar".
2. **Subscription Action (`POST /api/memberships/subscribe`)**:
   - For free plan (`price === 0`): Status 201 -> Immediate activation. Show confirmation alert/modal.
   - For paid plan (`price > 0`): Status 202 -> "Menunggu Pembayaran" (Pending). Provide instruction for confirmation.
3. **Active Dashboard (`GET /api/memberships/me`)**:
   - Active Plan card showing: Tier name, Expiration date (or "Permanen / Tanpa Kedaluwarsa" if free), Active features checklist.
   - If `pending` exists, display pending invoice banner with option to see pending details or cancel.
   - "Batalkan Langganan" button triggering `POST /api/memberships/cancel` with confirmation prompt.
4. **History Table (`GET /api/memberships/history`)**:
   - Columns: Tanggal Transaksi (`created_at`), Paket (`name`), Status badge (`active` = Hijau, `pending` = Kuning/Oranye, `cancelled` = Abu-abu/Merah), Harga (`price`), Masa Aktif (`started_at` - `expires_at`).
