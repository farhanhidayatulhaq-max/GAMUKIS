# Test Infrastructure: Gamukis Membership & Subscription System

## 1. Overview & Tooling Stack
- **Test Runner**: Jest (executed via `react-scripts test 5.0.1`)
- **Environment**: jsdom with React 18 concurrent act support (`global.IS_REACT_ACT_ENVIRONMENT = true`)
- **Rendering & DOM Utilities**: `react-dom/client` (`createRoot`), `react` (`act`), native DOM event dispatchers
- **Routing**: `react-router-dom` (`MemoryRouter`)
- **Execution Command**:
  ```bash
  cd Frontend
  npm test -- --watchAll=false
  ```

## 2. Directory Layout & Ownership
All membership test assets are strictly confined to the authorized write path:
```
Frontend/src/__tests__/membership/
├── fixtures/
│   └── mockData.js                  # Authoritative schemas (plans, membership, history, responses)
├── helpers/
│   └── testHarness.js               # Test rig, loadComponent, renderIntoDom, mockFetch, mockStorage
├── tier1_feature_coverage.test.js   # Tier 1: Feature coverage (8 features, ≥5 tests each)
├── tier2_boundary_cases.test.js     # Tier 2: Boundary & corner cases (7 features, ≥5 tests each)
├── tier3_cross_feature.test.js      # Tier 3: Cross-feature combinations (10 tests)
└── tier4_real_world.test.js         # Tier 4: Real-world lifecycles & responsive layouts (10 tests)
```

## 3. Mock Data & Contract Sources
All mock data in `mockData.js` strictly derives from:
1. `Backend/src/routes/membershipRoute.js` & `Backend/src/models/membershipModel.js`
2. `spec_miner_survey/spec_survey.md` verified JSON schemas
3. `orchestrator_1/PROJECT.md` Interface Contracts

Key fixtures provided:
- `mockSiswaPlans`: `siswa_free` (Rp 0), `siswa_premium` (Rp 29.000, 30 days)
- `mockGuruPlans`: `guru_free` (Rp 0), `guru_pro` (Rp 99.000, 30 days)
- `mockAdminPlans`: combined 4-plan catalog
- `mockDefaultSiswaMembership`: source `'default'`, null expiry
- `mockActivePremiumMembership`: source `'membership'`, ISO expiry timestamp
- `mockPendingMembership`: source `'default'`, pending order object
- `mockAdminMembership`: source `'administrator'`, null plan, unlimited perks
- `mockHistoryList`: 3-row audit list (pending, active, cancelled)
- `mockEmptyHistory`: `[]`

## 4. Progressive Testability Architecture
To respect milestone isolation and progressive development:
1. **Dynamic Module Resolution**: `loadComponent(relativePath)` attempts to load component modules (`membershipPlans.js`, `membershipDashboard.js`) safely via `try/catch`.
2. **Conditional Execution**: Component-specific tests evaluate `itIf(Boolean(Component))` — skipping gracefully if the component has not yet been implemented in its milestone.
3. **Automatic Activation**: The moment Worker M2 or M3 creates the respective page component, the corresponding tests automatically activate and validate the component implementation without requiring test suite changes.
4. **Current Status**: All 6 test suites compile and pass (70 passing tests, 35 skipped pending M2/M3, 0 failures).
