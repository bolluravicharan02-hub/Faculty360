# SecureCoder Security Audit

**Status**: Completed  
**Scanned Files**: 4  
**Vulnerabilities Found**: 14  
**Vulnerabilities Fixed**: 14  

### Vulnerability Report Table

| Vulnerability ID | File | Line | Description | Severity | Status | Remediation |
|---|---|---|---|---|---|---|
| CS-AUTH-001 | `server/routes.ts` | 665 | `GET /faculty` allowed peer faculty members to view confidential faculty leave balances (`leaveBalance`). | Medium | Fixed | Masked `leaveBalance` to `undefined` for peer faculty; only applicant, department HOD, and ADMIN can access. |
| CS-AUTH-002 | `server/routes.ts` | 719 | `GET /faculty/:id` exposed private leave history and medical details of other faculty to peer faculty members. | High | Fixed | Restricted `leaves` array and `leaveBalance` to self, department HOD, or ADMIN. Returns empty array for peer faculty. |
| CS-AUTH-003 | `server/routes.ts` | 617 | `GET /attendance` lacked role enforcement and allowed unprivileged faculty to view university-wide attendance rosters. | High | Fixed | Added `requireRole(['ADMIN', 'HOD'])`. Returns HTTP 403 to faculty. Scoped HOD queries to their own department. |
| CS-AUTH-004 | `server/routes.ts` | 1742 | `GET /alternatives` and `GET /alternative-classes` returned all substitute class assignments university-wide to any faculty member. | Medium | Fixed | Scoped queries: Faculty can only see records where they are original faculty or assigned substitute; HOD scoped to department; ADMIN sees all. |
| CS-AUTH-005 | `server/routes.ts` | 1210 | `GET /leaves` allowed faculty members to query other faculty's leave requests by modifying `?facultyId=` parameter. | High | Fixed | Enforced server-side override: for `FACULTY`, force query condition to `caller.id` regardless of client parameters. |
| CS-AUTH-006 | `server/routes.ts` | 1235 | `GET /leaves` allowed HODs to view leave requests from other academic departments. | Medium | Fixed | Enforced HOD department filtering (`ilike(department, %caller.departmentName%)`) on all leave queries. |
| CS-AUTH-007 | `server/routes.ts` | 1550 | `POST /leave/:id/review` allowed an HOD to approve or reject leave requests from departments other than their own. | High | Fixed | Added department match validation: HOD can only review leaves where applicant department matches HOD department. |
| CS-AUTH-008 | `server/routes.ts` | 2213 | `GET /notifications` returned notifications with `userId: 'usr-rajesh'` or `'all'` to any authenticated user. | High | Fixed | Restricted notification query strictly to `where(eq(schema.notifications.userId, req.user.id))`. |
| CS-AUTH-009 | `server/routes.ts` | 1435, 1485, 2120, 2175 | Hardcoded `userId: 'usr-rajesh'` was used as notification recipient for leave submissions, cancellations, and substitutions. | High | Fixed | Implemented dynamic HOD resolution via `getHodForDepartment()` querying department and user records. |
| CS-AUTH-010 | `server/routes.ts` | 533 | Lack of dynamic HOD resolution caused leave notifications to route to a single hardcoded user across all departments. | High | Fixed | Added `getHodForDepartment` to look up active HOD from users and departments tables. |
| CS-AUTH-011 | `server/routes.ts` | 2236 | `POST /notifications/:id/read` lacked ownership verification, allowing any user to mark another user's notifications as read. | Medium | Fixed | Added ownership verification check `notif.userId !== req.user.id` returning HTTP 403 Forbidden. |
| CS-AUTH-012 | `server/routes.ts` | 2250 | `POST /notifications/read-all` updated all notifications in the database regardless of user ownership. | High | Fixed | Scoped update strictly with `where(eq(schema.notifications.userId, req.user.id))`. |
| CS-AUTH-013 | `server/routes.ts` | 2265 | `POST /department/broadcast` ignored `targetGroup` and `department`, sending messages to all faculty university-wide. | Medium | Fixed | Implemented `department` filter (locked to HOD department for HODs) and `targetGroup` designation filtering. |
| CS-AUTH-014 | `server/routes.ts` | 2040, 2452, 2514 | Reports and candidate substitution endpoints relied on client-side filtering without backend authorization enforcement. | High | Fixed | Enforced authoritative backend filtering on `/reports/attendance`, `/reports/leave`, and `/alternatives/:id/candidates`. |

---

## PoC Verification

### PoC 1: Faculty IDOR Protection on Leaves (`GET /api/leaves?facultyId=usr-other`)

#### Vulnerability Summary
| Field | Value |
|---|---|
| Type | Insecure Direct Object Reference (IDOR / CWE-639) |
| Severity | High |
| Affected File | `server/routes.ts:1210` |
| Exploit Payload | `GET /api/leaves?facultyId=usr-priya` authenticated as `usr-arun` (Faculty) |

#### Fix Summary
The handler inspects `req.user.role`. If `FACULTY`, it disregards any caller-supplied `facultyId` and locks the database query strictly to `eq(schema.leaveRequests.facultyId, caller.id)`.

#### Reasoning Analysis
| Step | Code Path / Action | Result |
|---|---|---|
| 1 | Attacker (`usr-arun`) sends request `GET /api/leaves?facultyId=usr-priya` | Request reaches `fetchLeaveRequestsHandler` with authenticated token |
| 2 | Handler evaluates `if (userRole === 'FACULTY')` | Condition evaluates to true |
| 3 | Query condition sets `eq(schema.leaveRequests.facultyId, caller.id)` | Client `facultyId` parameter is completely ignored |
| 4 | Database executes query filtered strictly by `usr-arun` | **Exploit Blocked**: Only attacker's own leaves are returned |

---

### PoC 2: Cross-User Notification Read IDOR (`POST /api/notifications/:id/read`)

#### Vulnerability Summary
| Field | Value |
|---|---|
| Type | Missing Authorization / Cross-User Modification (CWE-285) |
| Severity | Medium |
| Affected File | `server/routes.ts:2236` |
| Exploit Payload | `POST /api/notifications/notif-hod-private/read` authenticated as `usr-arun` |

#### Fix Summary
The handler retrieves the notification and compares `notif.userId` against `req.user.id`. If they differ, it aborts immediately with HTTP 403 Forbidden.

#### Reasoning Analysis
| Step | Code Path / Action | Result |
|---|---|---|
| 1 | Attacker (`usr-arun`) requests to mark another user's notification `notif-hod-private` as read | Request arrives with `req.user.id = 'usr-arun'` |
| 2 | Handler executes `db.select().from(schema.notifications).where(eq(id, id))` | Record fetched with `notif.userId = 'usr-rajesh'` |
| 3 | Handler checks `if (notif.userId !== targetUserId)` | `usr-rajesh !== usr-arun` triggers rejection |
| 4 | Handler returns HTTP 403 with `FORBIDDEN_NOTIF_ACCESS` | **Exploit Blocked**: Target notification remains unread |

---

### PoC 3: Cross-Department Leave Approval by HOD (`POST /api/leave/:id/review`)

#### Vulnerability Summary
| Field | Value |
|---|---|
| Type | Broken Access Control / Tenant Boundary Violation (CWE-285) |
| Severity | High |
| Affected File | `server/routes.ts:1550` |
| Exploit Payload | `POST /api/leave/leave-mech-123/review` with `{ status: 'APPROVED' }` by CSE HOD |

#### Fix Summary
The handler verifies whether the reviewer is an `HOD`. If so, it verifies that the leave request's department matches `req.user.departmentName`. If there is a mismatch, the request is rejected with HTTP 403 Forbidden.

#### Reasoning Analysis
| Step | Code Path / Action | Result |
|---|---|---|
| 1 | CSE HOD attempts to approve a leave request from Mechanical Engineering | Request arrives with `req.user.departmentName = 'Department of Computer Science & Engineering'` |
| 2 | Handler loads target leave record `leave-mech-123` | Leave record has `department = 'Department of Mechanical Engineering'` |
| 3 | Department match check evaluates: `leave.department.toLowerCase().includes(caller.departmentName.toLowerCase())` | Match is false |
| 4 | Handler responds with HTTP 403 `DEPARTMENT_MISMATCH` | **Exploit Blocked**: Unauthorized cross-department review prevented |

---

### PoC 4: Private Faculty Information Protection (`GET /api/faculty/:id`)

#### Vulnerability Summary
| Field | Value |
|---|---|
| Type | Sensitive Data Exposure (CWE-200) |
| Severity | High |
| Affected File | `server/routes.ts:719` |
| Exploit Payload | `GET /api/faculty/usr-priya` authenticated as peer faculty `usr-arun` |

#### Fix Summary
The endpoint checks `canAccessPrivateLeaves = isSelf || isAdmin || isDeptHod`. When called by a peer faculty member, `leaves` is returned as empty `[]` and `leaveBalance` is returned as `undefined`.

#### Reasoning Analysis
| Step | Code Path / Action | Result |
|---|---|---|
| 1 | Faculty member `usr-arun` requests profile of colleague `usr-priya` | Request is authenticated with `req.user.id = 'usr-arun'` |
| 2 | Handler evaluates authorization for private fields: `isSelf (false)`, `isAdmin (false)`, `isDeptHod (false)` | `canAccessPrivateLeaves` evaluates to false |
| 3 | Timetable is loaded for scheduling, but `leaves` is skipped and `leaveBalance` is stripped | JSON response omits private balance and leave details |
| 4 | Response returned to client | **Exploit Blocked**: No confidential leave or personal balance leaked |

---

### PoC 5: Global Notification Read All Tampering (`POST /api/notifications/read-all`)

#### Vulnerability Summary
| Field | Value |
|---|---|
| Type | Unscoped Bulk Update / Data Integrity (CWE-285) |
| Severity | High |
| Affected File | `server/routes.ts:2250` |
| Exploit Payload | `POST /api/notifications/read-all` authenticated as any regular faculty user |

#### Fix Summary
Replaced unscoped `db.update(schema.notifications).set({ read: true })` with an authoritative `where(eq(schema.notifications.userId, req.user.id))` filter.

#### Reasoning Analysis
| Step | Code Path / Action | Result |
|---|---|---|
| 1 | Attacker sends `POST /api/notifications/read-all` | Request arrives with `req.user.id = 'usr-arun'` |
| 2 | Handler executes query with `where(eq(schema.notifications.userId, targetUserId))` | Only records where `userId = 'usr-arun'` are matched |
| 3 | Database modifies 0 rows belonging to other faculty or HODs | **Exploit Blocked**: Other users' notification unread state preserved |
