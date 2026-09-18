# Implementation Plan: Role Authorization & Notification Security Audit

## Overview & Architecture
Faculty360 has unified authentication under Supabase Auth with server-side PostgreSQL role enforcement. This security audit targets backend authorization, multi-tenant/departmental data isolation, private information protection, and notification delivery controls.

The 14 specific security requirements being audited and remediated:
1. `GET /faculty`: Enforce proper authorization and mask private information (`leaveBalance`).
2. `GET /attendance`: Enforce proper role authorization (restricted to `ADMIN` and `HOD` scoped to department).
3. `GET /alternatives`: Restrict records strictly to user role (Faculty: only own/assigned; HOD: department; Admin: all).
4. Faculty leave scoping: Faculty can only see their own leave records.
5. HOD leave scoping: HOD can only see department leave records.
6. Admin leave scoping: Admin can see university-wide records.
7. Faculty private information: Prevent leakage of private leaves and leave balances across faculty members.
8. Notifications isolation: Return only notifications intended for the authenticated user or valid broadcasts addressed to them.
9. Notification recipient: Remove hardcoded `usr-rajesh` recipient.
10. Dynamic HOD resolution: Dynamically determine the correct HOD from the faculty member's department.
11. `POST /notifications/:id/read`: Enforce ownership verification before marking read.
12. `POST /notifications/read-all`: Mark only the authenticated user's notifications as read.
13. Broadcast filtering: Respect `targetGroup` and `department` when dispatching broadcasts.
14. Server-side authorization: Enforce all checks authoritatively on the backend, not solely on the frontend.

---

## Security Threat Model

### Component Overview
Faculty360 is a full-stack university academic monitoring and faculty management system with a React SPA frontend, Node.js/Express API layer, and Cloud SQL PostgreSQL database, using Supabase Auth as the identity provider.

### Entry Points and Untrusted Inputs
| Entry Point | Type | Trusted? | Validation |
|---|---|---|---|
| `GET /api/faculty` & `/api/faculty/:id` | Query Params, Path Params | No | Bearer token validated, role-based PII masking |
| `GET /api/attendance` | HTTP Request | No | Restricted to `ADMIN` and `HOD` (department-scoped) |
| `GET /api/alternatives` | HTTP Request | No | Scoped: Faculty (own/assigned), HOD (dept), Admin (all) |
| `GET /api/leaves` | Query Params (`facultyId`, `status`) | No | Scoped: Faculty (own only), HOD (dept only), Admin (all) |
| `POST /api/leave/:id/review` | Path & Body | No | Role check `[ADMIN, HOD]` + HOD department match check |
| `POST /api/alternatives/:id/assign` | Path & Body | No | Role check `[ADMIN, HOD]` + HOD department match check |
| `GET /api/notifications` | HTTP Request | No | Restricted to `userId = req.user.id` |
| `POST /api/notifications/:id/read` | Path Param | No | Ownership check: `userId == req.user.id` |
| `POST /api/notifications/read-all` | HTTP Request | No | Scoped update: `WHERE user_id = req.user.id` |
| `POST /api/department/broadcast` | JSON Body | No | Role check `[ADMIN, HOD]` + HOD department lockdown + targetGroup filter |

### Trust Boundaries and Auth Assumptions
- **Authentication**: Supabase Auth handles password verification, JWT issuance, and session expiration.
- **Authorization**: University PostgreSQL database stores authoritative roles (`ADMIN`, `HOD`, `FACULTY`) and departments. Client cannot choose or override its role or department.
- **Boundary Crossing**: All client requests to `/api/*` cross the trust boundary with `Authorization: Bearer <supabase_token>`. The backend validates the token against Supabase and binds identity to the internal PostgreSQL profile.
- **Authorization Enforcement**: Every endpoint authoritatively enforces ownership and role/department boundaries in SQL queries.

### Sensitive Data Paths
| Data Type | Source | Destination | Protection |
|---|---|---|---|
| Faculty Leave History & Medical Details | Database | Client API response | Accessible only by applicant, their department HOD, or Admin |
| Faculty Leave Balance | Database | Directory & Profile | Masked for peer faculty; visible only to self, dept HOD, Admin |
| Faculty Attendance Roster | Database | Client API response | 403 for Faculty; HOD scoped to department; Admin university-wide |
| User Notifications | Database | Client API response | Strictly filtered to `userId = req.user.id`; no cross-user leaks |
| System Audit Trail | Database | Admin UI | Restricted strictly to `ADMIN` role |

### Privileged Actions
| Action | Location | Guard |
|---|---|---|
| View Faculty Attendance | `GET /api/attendance` | `requireRole(['ADMIN', 'HOD'])`, department filter for HOD |
| View Alternatives | `GET /api/alternatives` | Filtered by role (Faculty: own/assigned, HOD: department, Admin: all) |
| Approve/Reject Leave | `POST /api/leave/:id/review` | `requireRole(['ADMIN', 'HOD'])` + department match check |
| Assign Substitute | `POST /api/alternatives/:id/assign` | `requireRole(['ADMIN', 'HOD'])` + department match check |
| Mark Notification Read | `POST /api/notifications/:id/read` | Ownership verification (`notif.userId === req.user.id`) |
| Mark All Notifications Read | `POST /api/notifications/read-all` | Scoped update (`WHERE user_id = req.user.id`) |
| Send Broadcast | `POST /api/department/broadcast` | `requireRole(['ADMIN', 'HOD'])` + department lock + targetGroup filter |

### Priority Review Areas
1. `GET /faculty/:id` leaking private leaves of other faculty members to peer faculty.
2. `GET /faculty` exposing private leave balance to peer faculty members.
3. `GET /attendance` missing authorization and exposing university-wide attendance rosters to any role.
4. `GET /alternatives` returning all substitution records university-wide to any faculty member.
5. `GET /leaves` allowing Faculty A to view Faculty B's leaves via `?facultyId=`.
6. `GET /notifications` returning HOD (`usr-rajesh`) notifications to other users.
7. Dynamic HOD resolution for department notifications instead of hardcoded `usr-rajesh`.
8. `POST /notifications/:id/read` and `read-all` updating notifications across users without ownership verification.

---

## Safe Remediation Steps

1. **Dynamic HOD Resolution Helper (`server/routes.ts`)**:
   - Implement `getHodForDepartment(departmentIdOrName)` that dynamically queries `schema.users` and `schema.departments` to find the active HOD for a department.
   - Replace all instances of hardcoded `'usr-rajesh'` in leave submissions, leave cancellations, substitute acceptances, and substitute declines with dynamically resolved HOD IDs.

2. **Faculty Directory & Profile Authorization (`server/routes.ts`)**:
   - In `GET /faculty`: For non-admin/non-HOD users, mask `leaveBalance` for peer faculty records.
   - In `GET /faculty/:id`: Only include `leaves` and `leaveBalance` if requester is the faculty member themselves, their department HOD, or an ADMIN. For peer faculty, return empty `leaves: []` and mask `leaveBalance`.

3. **Attendance Authorization & Scoping (`server/routes.ts`)**:
   - In `GET /attendance`: Restrict access to `['ADMIN', 'HOD']`. Reject `FACULTY` with HTTP 403.
   - For `HOD`, scope `records` and `summary` metrics to the HOD's department.
   - For `ADMIN`, return university-wide records and metrics.

4. **Alternative Classes Scoping (`server/routes.ts`)**:
   - In `GET /alternatives` and `GET /alternative-classes`:
     - If `FACULTY`: return only records where `originalFacultyId = req.user.id` OR `assignedFacultyId = req.user.id`.
     - If `HOD`: return records where `department` matches HOD department or involved faculty belongs to HOD department.
     - If `ADMIN`: return university-wide records.

5. **Leave Requests Authorization & Scoping (`server/routes.ts`)**:
   - In `fetchLeaveRequestsHandler` (`GET /leaves`, `GET /leave`, `GET /leave-requests`):
     - If `FACULTY`: strictly enforce `facultyId = req.user.id` or `facultyEmail = req.user.email`. Disallow viewing any other faculty's leaves even if `facultyId` query param is supplied.
     - If `HOD`: scope to HOD's department. If `facultyId` query param is provided, ensure faculty belongs to HOD department.
     - If `ADMIN`: allow university-wide search and query filtering.
   - In `GET /leave/preview-affected`:
     - If `FACULTY`: enforce `facultyId = req.user.id`.
     - If `HOD`: ensure target faculty belongs to HOD department.

6. **Leave Review & Substitute Assignment Protection (`server/routes.ts`)**:
   - In `POST /leave/:id/review`:
     - Disallow `FACULTY` (enforced via `requireRole(['ADMIN', 'HOD'])`).
     - For `HOD`: verify the leave belongs to the HOD's department. If not, return HTTP 403.
   - In `POST /alternatives/:id/assign`:
     - Disallow `FACULTY` (enforced via `requireRole(['ADMIN', 'HOD'])`).
     - For `HOD`: verify the class belongs to the HOD's department. If not, return HTTP 403.

7. **Notifications & Broadcast Hardening (`server/routes.ts`)**:
   - In `GET /notifications`: Remove `eq(schema.notifications.userId, 'usr-rajesh')` so that only `eq(schema.notifications.userId, req.user.id)` is returned.
   - In `POST /notifications/:id/read`: Verify that the notification exists and `notif.userId === req.user.id`. If not, return HTTP 403.
   - In `POST /notifications/read-all`: Only update notifications `WHERE userId = req.user.id`.
   - In `POST /department/broadcast`:
     - If `HOD`: lock `department` to HOD's department.
     - If `ADMIN`: allow targeting 'All' or specific department.
     - Filter recipient faculty by `targetGroup` (e.g. 'all', 'professors', 'assistant_professors', 'hod', etc.).
     - Insert notifications with explicit `userId = recipient.id` for each matching recipient.

---

## Verification Plan

### Security Verification
- **Security Scan**: Inspect all newly created and modified files for common CWE vulnerabilities (CWE-285 Improper Authorization, CWE-639 Authorization Bypass Through User-Controlled Key, CWE-200 Exposure of Sensitive Information, CWE-862 Missing Authorization).
- **Security Audit**: Audit the implementation against the component's threat model (`## Security Threat Model`). Document all findings, dispositions, and remediations in `walkthrough.md` using the `generate-security-audit-report` skill.
- **PoC Verification**: Validate using the `run-poc` skill in `walkthrough.md` that:
  - Faculty A cannot view Faculty B's private leave information (via `/leaves` or `/faculty/:id`).
  - Faculty cannot view HOD notifications.
  - Faculty cannot mark HOD notifications as read (HTTP 403).
  - Faculty cannot approve leave (HTTP 403).
  - Faculty cannot assign substitutes (HTTP 403).
  - HOD cannot perform Admin-only operations (HTTP 403).
  - Admin can access university-wide reports.

