# Faculty360 — Academic Workload & Operations System

Faculty360 is a full-stack university operations management platform designed for higher education institutions. It manages faculty allocation, automated timetable scheduling, leave management, substitute teacher assignments, and academic infrastructure auditing.

---

## 🏗️ Target Architecture

The application follows a clean, decoupled architecture:

```
[ Browser / React SPA ]
        │
        ▼ (HTTP REST API with Supabase Bearer JWT)
[ Express API Server (Node.js) ]
   ├── Supabase Server SDK (Service Role Key) ──> Supabase Auth (User validation)
   └── Drizzle ORM (Connection Pool) ────────────> Supabase PostgreSQL Database
```

1. **Frontend (React 19 + Vite + Tailwind CSS + Lucide)**
   - Renders role-specific dashboards (`ADMIN`, `HOD`, `FACULTY`).
   - Authenticates users via Supabase Client Auth.
   - Passes the signed Supabase session access token via `Authorization: Bearer <token>` to Express API routes.
   - Exposes **ONLY** public publishable keys to the browser bundle (`VITE_` prefixed).

2. **Backend (Express + Node.js + TypeScript)**
   - Protects API routes via the `authenticateToken` and `requireRole` middleware.
   - Validates Bearer tokens server-side using the `SUPABASE_SERVICE_ROLE_KEY`.
   - Queries the authoritative user profile and RBAC role directly from the PostgreSQL database (`schema.users`).
   - Enforces business logic and prevents privilege escalation.

3. **Database & Auth (Supabase + PostgreSQL)**
   - **Auth**: Manages credentials, sessions, and multi-factor authentication.
   - **Database**: Full relational PostgreSQL instance managed via Drizzle ORM.

---

## 🔑 Environment Variables Specification

All environment variables must be declared in `.env.example`. Never commit `.env` or production secrets to source control.

### Frontend Environment Variables (Browser-Accessible)

| Variable | Required | Description |
| :--- | :---: | :--- |
| `VITE_SUPABASE_URL` | **Yes** | The public HTTPS endpoint of your Supabase project (e.g. `https://xyzcompany.supabase.co`). |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Yes** | The public/publishable anon API key for Supabase client-side authentication. Safe for browser exposure. |

> **Security Note:** The browser bundle only contains `VITE_` prefixed variables. Secrets like database passwords and service keys must **NEVER** be prefixed with `VITE_`.

### Backend Environment Variables (Server-Only Secrets)

| Variable | Required | Description |
| :--- | :---: | :--- |
| `SUPABASE_URL` | **Yes** | The Supabase project HTTPS endpoint used by the Express server for server-side auth verification. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | The administrative service role secret key. Bypasses Row Level Security (RLS) for backend operations. **NEVER expose to the browser.** |
| `DATABASE_URL` | **Yes** | Direct or pooled PostgreSQL connection string to your Supabase database instance. Example: `postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres`. |

### Platform & Fallback Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | Optional | Google Gemini API key used by the backend for AI-assisted scheduling conflict detection and analytics. Injected automatically in AI Studio. |
| `APP_URL` | Optional | The canonical hosting URL of the application (e.g., Cloud Run ingress domain). |
| `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME` | Optional | Legacy standalone PostgreSQL credentials. Supported as a seamless fallback if `DATABASE_URL` is not provided. |

---

## 🛡️ Security & Role-Based Access Control (RBAC)

Faculty360 enforces strict 3-tier Role-Based Access Control:

1. **`ADMIN` (University Administrator)**
   - University-wide overview: total faculty, department rosters, campus-wide timetable, system audit logs, reports, and academic infrastructure.
   - Cannot be granted from client requests.

2. **`HOD` (Head of Department)**
   - Department-scoped workload, pending leave approvals, substitute allocations, and department notices.
   - Scoped strictly to the HOD's assigned department.

3. **`FACULTY` (Academic Teaching Staff)**
   - Personal lecture schedules, leave requests, alternative class invitations, and teaching profile.

### Zero Client Trust Model
- User roles are **NEVER** trusted from JWT claims or client request payloads.
- After Supabase validates the token signature, the backend fetches the user's role from the PostgreSQL `users` table.
- If a user exists in Supabase Auth but lacks a profile in the university database, access is blocked (`HTTP 403 NO_PROFILE`).

---

## 🚀 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase project credentials:
```bash
cp .env.example .env
```

### 3. Apply Database Migrations (Drizzle ORM)
```bash
npx drizzle-kit push
```

### 4. Run Development Server
```bash
npm run dev
```
The server will start on port `3000` (`http://localhost:3000`).

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🧪 Automated Testing & QA Layer

Faculty360 includes an automated test suite covering all critical institution workflows.

### Running Automated Tests
```bash
# Execute the entire automated test suite
npm test
```

### Automated Test Coverage
The automated test harness (`npm test` / `tsx tests/run-all-tests.ts`) validates:

1. **Authentication (`tests/auth.test.ts`)**
   - ✅ **Login Success**: Valid institutional credentials authenticate via Supabase, issue valid JWT, and resolve the correct academic user profile.
   - ✅ **Wrong Password**: Invalid credentials are definitively rejected by Supabase Auth with appropriate error messages.
   - ✅ **Logout**: User session termination invalidates auth tokens.
   - ✅ **Expired Session**: Expired JWT tokens return `HTTP 401 AUTH_EXPIRED`.
   - ✅ **Unauthorized Access**: Requests without authorization headers return `HTTP 401 AUTH_REQUIRED`.

2. **Roles & Permissions (`tests/roles.test.ts`)**
   - ✅ **Admin Permissions**: Unrestricted access to university audit logs, departments management, and executive reports.
   - ✅ **HOD Permissions**: Access to department-level analytics; blocked from system audit logs and administrative department creation (`HTTP 403 FORBIDDEN_ROLE`).
   - ✅ **Faculty Permissions**: Access to teaching timetable and notifications; strictly blocked from executive reports, system audit logs, and candidate recommendation scoring (`HTTP 403 FORBIDDEN_ROLE`).

3. **Leave Management (`tests/leave.test.ts`)**
   - ✅ **Submit Leave**: Faculty submits leave request with dates, category, and justification; status initialized to `PENDING`.
   - ✅ **View Own Leave**: Faculty can only access their own leave records; cross-faculty snooping is forbidden (`HTTP 403 FORBIDDEN_RESOURCE`). HODs can view department leaves; Admins view all leaves.
   - ✅ **HOD Approve**: HOD reviews and approves leave; updates status to `APPROVED`, logs reviewer details, and generates substitution records.
   - ✅ **HOD Reject**: HOD rejects leave application with required justification remarks.
   - ✅ **Cancellation**: Faculty can cancel their own `PENDING` leave; cancellation of already reviewed leaves is prevented (`HTTP 400`).

4. **Alternative Classes (`tests/alternative-class.test.ts`)**
   - ✅ **Affected Class Detection**: Automated detection of scheduled timetable slots coinciding with approved leave dates.
   - ✅ **Candidate Recommendation**: Intelligent recommendation algorithm ranking eligible substitute teachers by availability, department match, workload, and subject relevance.
   - ✅ **Assignment**: HOD assigns candidate substitute; status transitions to `OFFERED_TO_FACULTY` and dispatches notification.
   - ✅ **Faculty Acceptance**: Assigned faculty accepts substitution; status transitions to `ACCEPTED` and timetable slot is updated with the substitute teacher.
   - ✅ **Faculty Decline**: Assigned faculty declines substitution with a reason; status transitions to `DECLINED` and an urgent alert is dispatched to the HOD.

5. **Notifications (`tests/notifications.test.ts`)**
   - ✅ **Correct Recipient**: In-app notifications are isolated strictly to the designated recipient user ID.
   - ✅ **Read State**: Marking a notification as read updates its state; unauthorized cross-user modifications are blocked (`HTTP 403`).
   - ✅ **Read All for Current User Only**: Calling read-all marks all unread notifications for the active session user while leaving other faculty members' notifications untouched.

6. **Reports & Analytics (`tests/reports.test.ts`)**
   - ✅ **HOD Access**: HOD retrieves department attendance metrics, leave breakdowns, and substitution logs (`HTTP 200`).
   - ✅ **Admin Access**: Admin retrieves university-wide analytics and CSV data export feeds (`HTTP 200`).
   - ✅ **Faculty Blocked**: Faculty access to any reporting or analytics endpoint is rejected (`HTTP 403 FORBIDDEN_ROLE`).

---

## 📋 Manual QA Checklist

Use this structured checklist for manual exploratory testing, staging sign-offs, and pre-deployment validation.

### 1. Authentication & Session Validation
- [ ] **Login with Valid Credentials**: Navigate to `/login`. Sign in using demo accounts (`admin@faculty360.demo`, `hod@faculty360.demo`, or `faculty@faculty360.demo`). Verify successful redirection to the appropriate dashboard.
- [ ] **Invalid Password Feedback**: Attempt login with an incorrect password. Verify an inline, user-friendly error message is displayed and no authentication state is established.
- [ ] **Session Expiration / Token Invalidation**: Clear local storage or simulate an expired token. Verify that protected API calls redirect the user to the login screen without infinite loader loops.
- [ ] **Logout Flow**: Click the user profile menu and choose "Log Out". Verify tokens are cleared, the user is navigated back to the sign-in screen, and the browser back button cannot access protected views.
- [ ] **Role Indicator**: Confirm the top-bar displays the correct user name, designation, department, and role badge (`ADMIN`, `HOD`, or `FACULTY`).

### 2. Role-Based Access Control (RBAC)
- [ ] **Admin Navigation**: Verify tabs for Overview, Faculty Directory, Timetable, Audit Logs, Reports, and System Settings are visible and accessible.
- [ ] **HOD Navigation**: Verify tabs for Department Overview, Faculty Roster, Timetable, Leave Approvals, and Department Reports are accessible. Confirm Audit Logs and System Settings are hidden.
- [ ] **Faculty Navigation**: Verify view is focused on My Schedule, My Leaves, and Substitution Requests. Confirm Reports and Audit Logs are inaccessible.
- [ ] **Direct URL Guard**: As a Faculty user, manually navigate to `/reports` or `/audit-logs`. Verify that the route guard blocks access and displays a 403 Forbidden banner or redirects to the dashboard.

### 3. Leave Management Lifecycle
- [ ] **Submit Leave Request**: As Faculty, click "Apply for Leave". Select leave type (Casual, Medical, or Earned), choose start and end dates, provide a reason, and submit. Verify the leave card appears with `PENDING` badge.
- [ ] **Leave Balance Deduction**: Verify that applying for leave respects available balance and displays the remaining days correctly.
- [ ] **HOD Approval Flow**: Switch to HOD account (`hod@faculty360.demo`). Navigate to "Leave Approvals". View the pending application, click "Approve", enter approval remarks, and confirm. Verify status updates to `APPROVED`.
- [ ] **HOD Rejection Flow**: On a pending leave, click "Reject", enter rejection reasons, and confirm. Verify the application card updates to `REJECTED` and remarks are visible.
- [ ] **Faculty Cancellation**: As Faculty, find a `PENDING` leave and click "Cancel Application". Verify status changes to `CANCELLED`. Verify that approved or rejected leaves cannot be cancelled.

### 4. Alternative Class & Substitution Allocation
- [ ] **Automatic Class Detection**: Upon approving a faculty leave that overlaps with active timetable slots, verify that the system generates corresponding Alternative Class entries for each lecture.
- [ ] **Candidate Recommendation Drawer**: As HOD, click on a pending substitution item. Click "Find Substitute". Verify the system recommends candidates with matching subject expertise, free timetable slots, and match score percentages.
- [ ] **Conflict Highlighting**: Confirm that faculty members with overlapping lecture commitments at the same time slot are either filtered out or highlighted with a conflict warning.
- [ ] **Substitute Offer Dispatch**: Select a recommended faculty member and click "Assign". Verify status updates to `OFFERED_TO_FACULTY`.
- [ ] **Substitute Faculty Acceptance**: Log in as the assigned substitute faculty. Navigate to Substitution Requests or Notifications. Click "Accept". Verify status updates to `ACCEPTED` and the timetable reflects the substitution.
- [ ] **Substitute Faculty Decline**: On a substitution request, click "Decline", provide a reason, and submit. Verify status updates to `DECLINED` and an urgent notification appears for the HOD.

### 5. Notifications & Real-Time Alerts
- [ ] **Notification Delivery**: Trigger a leave approval or substitution request. Verify the bell icon displays an unread count badge on the recipient's top-bar.
- [ ] **Notification Isolation**: Log in as a different faculty member. Verify that notifications belonging to other users are never visible.
- [ ] **Single Read**: Click an unread notification item. Verify the unread dot disappears and the item marks as read.
- [ ] **Mark All as Read**: Click "Mark all as read". Verify all notifications for the active user clear their unread indicator. Verify other users' notification state is unchanged.

### 6. Reports & Executive Analytics
- [ ] **HOD Analytics**: As HOD, open the Reports view. Verify attendance rates, department leave distribution charts, and alternative class resolution metrics render with real data.
- [ ] **Admin Analytics**: As Admin, verify campus-wide metrics, multi-department comparison charts, and audit trail logs.
- [ ] **Export Functionality**: Test the "Export CSV" feature for faculty records, leave histories, and timetable schedules. Confirm downloaded files contain accurate, formatted tabular data.

### 7. Responsive UI & Accessibility
- [ ] **Mobile Layout (375px - 480px)**: Verify navigation collapses into a responsive mobile drawer, timetable switches to day/agenda view, and buttons maintain touch targets of at least 44px.
- [ ] **Tablet Layout (768px - 1024px)**: Verify cards and grid layouts wrap cleanly without horizontal scrollbars.
- [ ] **Desktop Layout (1280px+)**: Verify spacious, high-contrast layouts with proper visual hierarchy and baseline readability.

