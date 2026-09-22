/**
 * Test Suite: Roles & RBAC Permissions
 * 
 * Workflows tested:
 * - Admin permissions: university-wide audit logs, infrastructure, reports, full access
 * - HOD permissions: department operations & reports, restricted from system audit logs
 * - Faculty permissions: teaching schedule & leaves, restricted from reports, admin logs, and candidate scoring
 */

import { apiRequest, expect, TestRunner, TOKENS } from './test-utils.ts';

export async function runRoleTests() {
  TestRunner.setSuite('Roles');
  console.log('\n\x1b[1m▶ Running Test Suite: Roles & Permissions\x1b[0m');

  // 1. Admin Permissions
  await TestRunner.test('Admin permissions: full access to audit logs, departments, and reports', async () => {
    // Audit logs (strictly admin only)
    const auditRes = await apiRequest('GET', '/api/audit-logs', undefined, TOKENS.ADMIN);
    expect(auditRes.status).toBe(200);
    expect(Array.isArray(auditRes.data)).toBe(true);

    // Departments management
    const deptRes = await apiRequest('GET', '/api/departments', undefined, TOKENS.ADMIN);
    expect(deptRes.status).toBe(200);
    expect(Array.isArray(deptRes.data)).toBe(true);

    // Executive reports
    const reportRes = await apiRequest('GET', '/api/reports/summary', undefined, TOKENS.ADMIN);
    expect(reportRes.status).toBe(200);
    expect(reportRes.data.role).toBe('ADMIN');
    expect(reportRes.data.metrics).toBeDefined();
  });

  // 2. HOD Permissions
  await TestRunner.test('HOD permissions: access to department reports, blocked from system audit logs', async () => {
    // Executive reports allowed for HOD
    const reportRes = await apiRequest('GET', '/api/reports/summary', undefined, TOKENS.HOD);
    expect(reportRes.status).toBe(200);
    expect(reportRes.data.role).toBe('HOD');

    // System audit logs blocked for HOD
    const auditRes = await apiRequest('GET', '/api/audit-logs', undefined, TOKENS.HOD);
    expect(auditRes.status).toBe(403);
    expect(auditRes.data.code).toBe('FORBIDDEN_ROLE');
    expect(auditRes.data.error).toContain('Forbidden');

    // Admin infrastructure modification blocked for HOD
    const modifyDeptRes = await apiRequest(
      'POST',
      '/api/departments',
      { name: 'Unauthorized Dept', code: 'UNAUTH' },
      TOKENS.HOD
    );
    expect(modifyDeptRes.status).toBe(403);
    expect(modifyDeptRes.data.code).toBe('FORBIDDEN_ROLE');
  });

  // 3. Faculty Permissions
  await TestRunner.test('Faculty permissions: timetable view allowed, reports and audit logs blocked', async () => {
    // Timetable view allowed
    const timetableRes = await apiRequest('GET', '/api/timetable', undefined, TOKENS.FACULTY);
    expect(timetableRes.status).toBe(200);
    expect(Array.isArray(timetableRes.data)).toBe(true);

    // Notifications view allowed
    const notifRes = await apiRequest('GET', '/api/notifications', undefined, TOKENS.FACULTY);
    expect(notifRes.status).toBe(200);
    expect(Array.isArray(notifRes.data)).toBe(true);

    // Reports blocked for faculty
    const reportRes = await apiRequest('GET', '/api/reports/summary', undefined, TOKENS.FACULTY);
    expect(reportRes.status).toBe(403);
    expect(reportRes.data.code).toBe('FORBIDDEN_ROLE');

    // Audit logs blocked for faculty
    const auditRes = await apiRequest('GET', '/api/audit-logs', undefined, TOKENS.FACULTY);
    expect(auditRes.status).toBe(403);
    expect(auditRes.data.code).toBe('FORBIDDEN_ROLE');

    // Candidate ranking blocked for faculty
    const candidateRes = await apiRequest('GET', '/api/alternatives/alt-sample/candidates', undefined, TOKENS.FACULTY);
    expect(candidateRes.status).toBe(403);
    expect(candidateRes.data.code).toBe('FORBIDDEN_ROLE');
  });

  // 4. Student Permissions
  await TestRunner.test('Student permissions: student dashboard & timetable allowed; faculty/leave/reports strictly blocked', async () => {
    // Student dashboard allowed
    const dashRes = await apiRequest('GET', '/api/student/dashboard', undefined, TOKENS.STUDENT);
    expect(dashRes.status).toBe(200);
    expect(dashRes.data.profile).toBeDefined();
    expect(dashRes.data.overallAttendance).toBeDefined();
    expect(Array.isArray(dashRes.data.subjectsAttendance)).toBe(true);

    // Student schedule allowed
    const schedRes = await apiRequest('GET', '/api/student/schedule', undefined, TOKENS.STUDENT);
    expect(schedRes.status).toBe(200);
    expect(Array.isArray(schedRes.data)).toBe(true);

    // Faculty directory blocked for student
    const facRes = await apiRequest('GET', '/api/faculty', undefined, TOKENS.STUDENT);
    expect(facRes.status).toBe(403);
    expect(facRes.data.code).toBe('FORBIDDEN_ROLE');

    // Faculty leave endpoints blocked for student
    const leaveRes = await apiRequest('GET', '/api/leave', undefined, TOKENS.STUDENT);
    expect(leaveRes.status).toBe(403);
    expect(leaveRes.data.code).toBe('FORBIDDEN_ROLE');

    // Reports blocked for student
    const reportRes = await apiRequest('GET', '/api/reports/summary', undefined, TOKENS.STUDENT);
    expect(reportRes.status).toBe(403);
    expect(reportRes.data.code).toBe('FORBIDDEN_ROLE');

    // Audit logs blocked for student
    const auditRes = await apiRequest('GET', '/api/audit-logs', undefined, TOKENS.STUDENT);
    expect(auditRes.status).toBe(403);
    expect(auditRes.data.code).toBe('FORBIDDEN_ROLE');

    // Alternative class management blocked for student
    const altRes = await apiRequest('GET', '/api/alternatives', undefined, TOKENS.STUDENT);
    expect(altRes.status).toBe(403);
    expect(altRes.data.code).toBe('FORBIDDEN_ROLE');
  });
}
