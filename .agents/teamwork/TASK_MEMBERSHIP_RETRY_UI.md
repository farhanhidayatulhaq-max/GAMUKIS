# Task Dispatch: "Continue Payment" Button (Pending Membership Retry UI)

- **Status**: `ready`
- **Backend Contract (Active)**: `POST /api/memberships/pending/retry` returns `{ status: 'pending', paymentUrl, paymentToken }`[cite: 8].

## File & Folder Blueprint (Mandatory Execution Sequence)
| Sequence | Action | Active File Path Location | Specific Task on File |
| :--- | :--- | :--- | :--- |
| **1** | `MODIFY` | `Frontend/src/database/membershipApi.js` | Add caller function for `POST /api/memberships/pending/retry` (without introducing `require('util')`)[cite: 8]. |
| **2** | `MODIFY` | `Frontend/src/pages/membershipDashboard.js` (+ `.css`) | Add "Continue payment" button for paid packages with `pending` status, display loading/error states, prevent double clicks, redirect to `paymentUrl`, and reset/refetch state upon user switch[cite: 8]. |
| **3** | `MODIFY` | `Frontend/src/__tests__/membership/` | Add tests for logged-out state, pending, successful retry, failed retry, and account switch/logout[cite: 8]. |

## Mandatory Verification
Execute `npx react-scripts test --watchAll=false src/__tests__/membership` and `npm run build` in `Frontend/`[cite: 8].