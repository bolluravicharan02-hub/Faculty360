/**
 * Test Suite: Leave Management Workflow
 * 
 * Workflows tested:
 * - submit leave: faculty applies for leave, creates record with status PENDING
 * - view own leave: faculty receives only their own records, blocked from snooping other faculty
 * - HOD approve: HOD approves leave, updates status to APPROVED, creates alternative class records
 * - HOD reject: HOD rejects leave with remarks, updates status to REJECTED
 * - cancellation: faculty can cancel their own pending leave, blocked from cancelling reviewed leaves
 */

import { apiRequest, expect, TestRunner, TOKENS } from './test-utils.ts';

export async function runLeaveTests() {
  TestRunner.setSuite('Leave Management');
  console.log('\n\x1b[1m▶ Running Test Suite: Leave Management\x1b[0m');

  let testLeaveId = '';
  let rejectLeaveId = '';
  let cancelLeaveId = '';

  // 1. Submit Leave
  await TestRunner.test('submit leave: faculty submits leave application with status PENDING', async () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000);

    const startDateStr = nextWeek.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const submitRes = await apiRequest(
      'POST',
      '/api/leave',
      {
        leaveType: 'Casual Leave',
        startDate: startDateStr,
        endDate: endDateStr,
        reason: 'Attending National Academic Conference on Cloud Systems',
      },
      TOKENS.FACULTY
    );

    expect(submitRes.status).toBe(201);
    expect(submitRes.data.status).toBe('PENDING');
    expect(submitRes.data.facultyId).toBe('usr-arun');
    expect(submitRes.data.leaveType).toBe('Casual Leave');
    expect(typeof submitRes.data.id).toBe('string');
    testLeaveId = submitRes.data.id;

    // Create a second leave for rejection test
    const submitRejectRes = await apiRequest(
      'POST',
      '/api/leave',
      {
        leaveType: 'Medical Leave',
        startDate: startDateStr,
        endDate: endDateStr,
        reason: 'Dental Surgery Appointment',
      },
      TOKENS.FACULTY
    );
    rejectLeaveId = submitRejectRes.data.id;

    // Create a third leave for cancellation test
    const submitCancelRes = await apiRequest(
      'POST',
      '/api/leave',
      {
        leaveType: 'Casual Leave',
        startDate: startDateStr,
        endDate: endDateStr,
        reason: 'Family Event (Will Cancel)',
      },
      TOKENS.FACULTY
    );
    cancelLeaveId = submitCancelRes.data.id;
  });

  // 2. View Own Leave
  await TestRunner.test('view own leave: faculty receives only own records, cannot snoop other faculty', async () => {
    // Faculty queries leaves
    const facRes = await apiRequest('GET', '/api/leave', undefined, TOKENS.FACULTY);
    expect(facRes.status).toBe(200);
    expect(Array.isArray(facRes.data)).toBe(true);

    // Every returned leave must belong to usr-arun or faculty@faculty360.demo
    for (const l of facRes.data) {
      const isOwner =
        l.facultyId === 'usr-arun' ||
        l.facultyEmail?.toLowerCase() === 'faculty@faculty360.demo' ||
        l.facultyEmail?.toLowerCase() === 'arun.kumar@takshashila.edu';
      expect(isOwner).toBe(true);
    }

    // Faculty attempting to query another faculty's leaves explicitly gets 403 Forbidden
    const snoopRes = await apiRequest('GET', '/api/leave?facultyId=usr-priya', undefined, TOKENS.FACULTY);
    expect(snoopRes.status).toBe(403);
    expect(snoopRes.data.code).toBe('FORBIDDEN_RESOURCE');

    // HOD queries leaves (receives department records)
    const hodRes = await apiRequest('GET', '/api/leave', undefined, TOKENS.HOD);
    expect(hodRes.status).toBe(200);
    expect(Array.isArray(hodRes.data)).toBe(true);

    // Admin queries leaves (receives university-wide records)
    const adminRes = await apiRequest('GET', '/api/leave', undefined, TOKENS.ADMIN);
    expect(adminRes.status).toBe(200);
    expect(Array.isArray(adminRes.data)).toBe(true);
  });

  // 3. HOD Approve
  await TestRunner.test('HOD approve: HOD reviews and approves leave, triggers alternative classes', async () => {
    expect(testLeaveId).toBeTruthy();

    const reviewRes = await apiRequest(
      'POST',
      `/api/leave/${testLeaveId}/review`,
      {
        status: 'APPROVED',
        remarks: 'Approved by HOD. Substitute faculty required for scheduled lectures.',
      },
      TOKENS.HOD
    );

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.data.status).toBe('APPROVED');
    expect(reviewRes.data.reviewedBy).toBe('Dr. Rajesh Sharma');

    // Verify leave is now approved
    const fetchRes = await apiRequest('GET', `/api/leave`, undefined, TOKENS.FACULTY);
    const approvedLeave = fetchRes.data.find((l: any) => l.id === testLeaveId);
    expect(approvedLeave).toBeDefined();
    expect(approvedLeave.status).toBe('APPROVED');
  });

  // 4. HOD Reject
  await TestRunner.test('HOD reject: HOD rejects leave application with remarks', async () => {
    expect(rejectLeaveId).toBeTruthy();

    const rejectRes = await apiRequest(
      'POST',
      `/api/leave/${rejectLeaveId}/review`,
      {
        status: 'REJECTED',
        remarks: 'Examinations scheduled on this date; leave cannot be granted.',
      },
      TOKENS.HOD
    );

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.data.status).toBe('REJECTED');
    expect(rejectRes.data.reviewRemarks).toContain('Examinations');
  });

  // 5. Cancellation
  await TestRunner.test('cancellation: faculty cancels pending leave; cannot cancel finalized leave', async () => {
    expect(cancelLeaveId).toBeTruthy();

    // Cancel pending leave
    const cancelRes = await apiRequest(
      'POST',
      `/api/leave/${cancelLeaveId}/cancel`,
      undefined,
      TOKENS.FACULTY
    );

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.data.status).toBe('CANCELLED');

    // Attempting to cancel already approved leave fails with 400
    const cancelApprovedRes = await apiRequest(
      'POST',
      `/api/leave/${testLeaveId}/cancel`,
      undefined,
      TOKENS.FACULTY
    );
    expect(cancelApprovedRes.status).toBe(400);
    expect(cancelApprovedRes.data.error).toContain('Only pending');
  });
}
