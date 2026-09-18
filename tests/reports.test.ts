/**
 * Test Suite: Reports & Analytics Access Control
 * 
 * Workflows tested:
 * - HOD access: HOD can view department executive summaries, attendance, and leave reports
 * - Admin access: Admin can view university-wide metrics, export CSV reports, and comprehensive statistics
 * - Faculty blocked: Faculty is strictly blocked (HTTP 403) from all reporting and analytics endpoints
 */

import { apiRequest, expect, TestRunner, TOKENS } from './test-utils.ts';

export async function runReportTests() {
  TestRunner.setSuite('Reports & Analytics');
  console.log('\n\x1b[1m▶ Running Test Suite: Reports & Analytics\x1b[0m');

  // 1. HOD Access
  await TestRunner.test('HOD access: HOD successfully retrieves summary and department reports', async () => {
    const summaryRes = await apiRequest('GET', '/api/reports/summary', undefined, TOKENS.HOD);
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.data.role).toBe('HOD');
    expect(summaryRes.data.metrics).toBeDefined();

    const attendanceRes = await apiRequest('GET', '/api/reports/attendance', undefined, TOKENS.HOD);
    expect(attendanceRes.status).toBe(200);
    expect(Array.isArray(attendanceRes.data.records)).toBe(true);

    const leaveRes = await apiRequest('GET', '/api/reports/leave', undefined, TOKENS.HOD);
    expect(leaveRes.status).toBe(200);
    expect(Array.isArray(leaveRes.data.records)).toBe(true);

    const altsRes = await apiRequest('GET', '/api/reports/alternative-classes', undefined, TOKENS.HOD);
    expect(altsRes.status).toBe(200);
    expect(Array.isArray(altsRes.data.records)).toBe(true);
  });

  // 2. Admin Access
  await TestRunner.test('Admin access: Admin retrieves executive reports and export datasets', async () => {
    const summaryRes = await apiRequest('GET', '/api/reports/summary', undefined, TOKENS.ADMIN);
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.data.role).toBe('ADMIN');
    expect(summaryRes.data.metrics.totalFaculty).toBeGreaterThan(0);

    const csvRes = await apiRequest('GET', '/api/reports/export-csv?type=faculty', undefined, TOKENS.ADMIN);
    expect(csvRes.status).toBe(200);
  });

  // 3. Faculty Blocked
  await TestRunner.test('Faculty blocked: Faculty requests to reports are rejected with HTTP 403', async () => {
    const summaryRes = await apiRequest('GET', '/api/reports/summary', undefined, TOKENS.FACULTY);
    expect(summaryRes.status).toBe(403);
    expect(summaryRes.data.code).toBe('FORBIDDEN_ROLE');

    const attendanceRes = await apiRequest('GET', '/api/reports/attendance', undefined, TOKENS.FACULTY);
    expect(attendanceRes.status).toBe(403);
    expect(attendanceRes.data.code).toBe('FORBIDDEN_ROLE');

    const leaveReportRes = await apiRequest('GET', '/api/reports/leave', undefined, TOKENS.FACULTY);
    expect(leaveReportRes.status).toBe(403);
    expect(leaveReportRes.data.code).toBe('FORBIDDEN_ROLE');

    const exportRes = await apiRequest('GET', '/api/reports/export-csv?type=faculty', undefined, TOKENS.FACULTY);
    expect(exportRes.status).toBe(403);
    expect(exportRes.data.code).toBe('FORBIDDEN_ROLE');
  });
}
