# Task Dispatch: Explicit Role Selection (Student/Teacher) Prior to API Access

- **Status**: `ready`
- **Execution Mode**: Flexible (Can be picked up by any Agent in Solo Mode or Multi-Agent Mode)
- **Rule Reference**: Must comply with `.agents/docs/prd-standard.md` (§3 Profile Workflow & §4 File Order)

## 1. Root Cause (Current Evidence)
1. `Backend/src/models/roleModel.js`: Google accounts without a role are automatically inserted as `siswa` (student), and invalid roles are normalized to `siswa`.
2. `Frontend/src/pages/completeProfile.js`: Initial role state automatically pre-selects `guru` (teacher) before user selection[cite: 9].
3. `Frontend/src/component/component_profile/molecules/ProfileRoleSelector.js`: Empty default role defaults to `siswa`[cite: 9].
4. Consequently, new users who have not yet selected a role are treated as `siswa` or encounter desynchronization when accessing Teacher-specific endpoints[cite: 9].

## 2. File & Folder Blueprint (Mandatory Execution Sequence)
Agents may touch only the following files strictly in sequence from 1 to 5:

| Sequence | Action | Active File Path Location | Specific Task on File |
| :--- | :--- | :--- | :--- |
| **1** | `MODIFY` | `Backend/src/models/roleModel.js` | Ensure "unselected role" status (`unset`/null) is distinguishable from confirmed `siswa` role without breaking `admin` vs `guru` access separation[cite: 9]. |
| **2** | `MODIFY` | `Backend/src/routes/profileRoute.js` *(if needed)* | Ensure persisting role selections (`siswa` / `guru` application with taught subjects) updates profile state consistently[cite: 9]. |
| **3** | `MODIFY` | `Frontend/src/component/component_profile/molecules/ProfileRoleSelector.js` | Remove silent pre-selection to `siswa`. Make empty selection state explicit until the user explicitly selects Student or Teacher[cite: 9]. |
| **4** | `MODIFY` | `Frontend/src/pages/completeProfile.js` | Remove initial default `guru` state. Render clear indicator when role is unselected, and ensure session/profile updates upon successful submission[cite: 9]. |
| **5** | `MODIFY` | `Frontend/src/__tests__/` & `Backend/test/` | Add test coverage for: unset role before save, select & save Teacher, select & save Student, failed save, Teacher API requests post-save, and non-admin rejections on admin endpoints[cite: 9]. |

## 3. Off-Limits Boundaries
- **STRICTLY PROHIBITED** from editing Membership UI (`membershipPlans.*`, `membershipDashboard.*`), character customization, or `inGame.js`[cite: 9].
- **STRICTLY PROHIBITED** from granting administrator privileges to regular users or Teachers[cite: 9].

## 4. Completion Verification Requirements
Automatically run relevant tests in `Backend/` and `Frontend/`, and execute `npm run build` in `Frontend/`[cite: 9]. Record verification results in `.agents/teamwork/INDEX.md` and `.agents/memory/LESSONS_LEARNED.md`.