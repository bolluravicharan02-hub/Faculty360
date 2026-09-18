/**
 * Test Suite: Alternative Class & Substitute Workflow
 * 
 * Workflows tested:
 * - affected class detection: automatic detection of scheduled timetable slots during leave period
 * - candidate recommendation: scoring candidates based on availability, department, and specialization
 * - assignment: HOD assigns substitute faculty, sends offer and notification
 * - faculty acceptance: assigned faculty accepts substitution, updates status to ACCEPTED
 * - faculty decline: assigned faculty declines substitution with reason, flags urgent alert for HOD
 */

import { apiRequest, expect, TestRunner, TOKENS } from './test-utils.ts';
import { db } from '../src/db/index.ts';
import * as schema from '../src/db/schema.ts';

export async function runAlternativeClassTests() {
  TestRunner.setSuite('Alternative Classes');
  console.log('\n\x1b[1m▶ Running Test Suite: Alternative Classes\x1b[0m');

  let testAltId = '';
  let declineAltId = '';

  // Prepare test alternative classes in the database
  const altId1 = `alt-test-${Date.now()}-1`;
  const altId2 = `alt-test-${Date.now()}-2`;
  testAltId = altId1;
  declineAltId = altId2;

  await db.insert(schema.alternativeClasses).values([
    {
      id: altId1,
      originalFacultyId: 'usr-arun',
      originalFacultyName: 'Dr. Arun Kumar',
      subjectCode: 'CS301',
      subjectName: 'Design & Analysis of Algorithms',
      date: '2026-09-22',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      classroom: 'LH-101',
      section: 'CSE-A',
      reason: 'Faculty on approved Casual Leave',
      status: 'PENDING_FACULTY_ASSIGNMENT',
    },
    {
      id: altId2,
      originalFacultyId: 'usr-arun',
      originalFacultyName: 'Dr. Arun Kumar',
      subjectCode: 'CS302',
      subjectName: 'Database Management Systems',
      date: '2026-09-23',
      startTime: '11:00 AM',
      endTime: '12:00 PM',
      classroom: 'LH-102',
      section: 'CSE-B',
      reason: 'Faculty on approved Medical Leave',
      status: 'PENDING_FACULTY_ASSIGNMENT',
    },
  ]);

  // 1. Affected Class Detection
  await TestRunner.test('affected class detection: preview detects timetable slots during leave window', async () => {
    const previewRes = await apiRequest(
      'GET',
      '/api/leave/preview-affected?facultyId=usr-arun&startDate=2026-09-22&endDate=2026-09-25',
      undefined,
      TOKENS.FACULTY
    );

    expect(previewRes.status).toBe(200);
    expect(Array.isArray(previewRes.data.affectedClasses)).toBe(true);
    expect(previewRes.data.totalAffectedClasses).toBeGreaterThan(0);

    // Also verify alternatives list endpoint displays pending alternatives
    const listRes = await apiRequest('GET', '/api/alternatives', undefined, TOKENS.HOD);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.data)).toBe(true);
    const found = listRes.data.find((a: any) => a.id === testAltId);
    expect(found).toBeDefined();
    expect(found.status).toBe('PENDING_FACULTY_ASSIGNMENT');
  });

  // 2. Candidate Recommendation
  await TestRunner.test('candidate recommendation: ranks substitute faculty by availability and match score', async () => {
    const candRes = await apiRequest(
      'GET',
      `/api/alternatives/${testAltId}/candidates`,
      undefined,
      TOKENS.HOD
    );

    expect(candRes.status).toBe(200);
    expect(Array.isArray(candRes.data)).toBe(true);
    expect(candRes.data.length).toBeGreaterThan(0);

    const firstCand = candRes.data[0];
    expect(typeof firstCand.id).toBe('string');
    expect(typeof firstCand.name).toBe('string');
    expect(typeof firstCand.matchScore).toBe('number');
    expect(typeof firstCand.isAvailable).toBe('boolean');
    expect(Array.isArray(firstCand.matchReasons)).toBe(true);

    // Candidates should not include the original faculty member
    const selfIncluded = candRes.data.some((c: any) => c.id === 'usr-arun');
    expect(selfIncluded).toBe(false);
  });

  // 3. Assignment
  await TestRunner.test('assignment: HOD assigns substitute faculty and notifies them', async () => {
    const assignRes = await apiRequest(
      'POST',
      `/api/alternatives/${testAltId}/assign`,
      { facultyId: 'usr-priya' },
      TOKENS.HOD
    );

    expect(assignRes.status).toBe(200);
    expect(assignRes.data.status).toBe('OFFERED_TO_FACULTY');
    expect(assignRes.data.assignedFacultyId).toBe('usr-priya');

    // Also assign the second alternative for decline test
    await apiRequest(
      'POST',
      `/api/alternatives/${declineAltId}/assign`,
      { facultyId: 'usr-priya' },
      TOKENS.HOD
    );

    // Verify substitute faculty received notification
    const notifRes = await apiRequest('GET', '/api/notifications', undefined, TOKENS.PRIYA);
    expect(notifRes.status).toBe(200);
    const subNotif = notifRes.data.find((n: any) => n.type === 'substitution');
    expect(subNotif).toBeDefined();
    expect(subNotif.title).toContain('Substitute');
  });

  // 4. Faculty Acceptance
  await TestRunner.test('faculty acceptance: assigned faculty accepts substitution and updates status', async () => {
    const acceptRes = await apiRequest(
      'POST',
      `/api/alternatives/${testAltId}/respond`,
      { action: 'accept' },
      TOKENS.PRIYA
    );

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.data.status).toBe('ACCEPTED');
    expect(acceptRes.data.notes).toContain('Accepted by');
  });

  // 5. Faculty Decline
  await TestRunner.test('faculty decline: assigned faculty declines substitution with reason and alerts HOD', async () => {
    const declineReason = 'Prior university research symposium presentation';
    const declineRes = await apiRequest(
      'POST',
      `/api/alternatives/${declineAltId}/respond`,
      { action: 'decline', reason: declineReason },
      TOKENS.PRIYA
    );

    expect(declineRes.status).toBe(200);
    expect(declineRes.data.status).toBe('DECLINED');
    expect(declineRes.data.notes).toContain(declineReason);

    // Verify HOD received urgent decline notification
    const hodNotifRes = await apiRequest('GET', '/api/notifications', undefined, TOKENS.HOD);
    expect(hodNotifRes.status).toBe(200);
    const urgentNotif = hodNotifRes.data.find(
      (n: any) => n.title?.includes('URGENT') || n.message?.includes('DECLINED')
    );
    expect(urgentNotif).toBeDefined();
    expect(urgentNotif.message).toContain('DECLINED');
  });
}
