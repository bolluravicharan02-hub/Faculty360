/**
 * Test Suite: Notifications Workflow
 * 
 * Workflows tested:
 * - correct recipient: notifications are scoped strictly to the target user
 * - read: marking an individual notification as read updates read state, blocks unauthorized cross-user modifications
 * - read all for current user only: marks all notifications for authenticated user as read, leaves other users' unread records untouched
 */

import { apiRequest, expect, TestRunner, TOKENS } from './test-utils.ts';
import { db } from '../src/db/index.ts';
import * as schema from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

export async function runNotificationTests() {
  TestRunner.setSuite('Notifications');
  console.log('\n\x1b[1m▶ Running Test Suite: Notifications\x1b[0m');

  const notifArun1 = `notif-test-${Date.now()}-arun-1`;
  const notifArun2 = `notif-test-${Date.now()}-arun-2`;
  const notifPriya1 = `notif-test-${Date.now()}-priya-1`;
  const notifPriya2 = `notif-test-${Date.now()}-priya-2`;

  // Seed isolated notifications for Arun and Priya
  await db.insert(schema.notifications).values([
    {
      id: notifArun1,
      userId: 'usr-arun',
      title: 'Department Meeting Scheduled',
      message: 'CSE department curriculum meeting tomorrow at 10 AM.',
      type: 'announcement',
      read: false,
      timestamp: 'Just now',
    },
    {
      id: notifArun2,
      userId: 'usr-arun',
      title: 'Lab Maintenance Notice',
      message: 'Cloud Computing Lab maintenance this Friday.',
      type: 'system',
      read: false,
      timestamp: 'Just now',
    },
    {
      id: notifPriya1,
      userId: 'usr-priya',
      title: 'Research Grant Review',
      message: 'Your research proposal has progressed to stage 2.',
      type: 'academic',
      read: false,
      timestamp: 'Just now',
    },
    {
      id: notifPriya2,
      userId: 'usr-priya',
      title: 'Library Book Due',
      message: 'Distributed Systems 3rd Ed is due this week.',
      type: 'system',
      read: false,
      timestamp: 'Just now',
    },
  ]);

  // 1. Correct Recipient
  await TestRunner.test('correct recipient: notifications scoped strictly to the target user', async () => {
    // Arun fetches notifications
    const arunRes = await apiRequest('GET', '/api/notifications', undefined, TOKENS.FACULTY);
    expect(arunRes.status).toBe(200);
    const arunIds = arunRes.data.map((n: any) => n.id);
    expect(arunIds).toContain(notifArun1);
    expect(arunIds).toContain(notifArun2);
    expect(arunIds.includes(notifPriya1)).toBe(false);
    expect(arunIds.includes(notifPriya2)).toBe(false);

    // Priya fetches notifications
    const priyaRes = await apiRequest('GET', '/api/notifications', undefined, TOKENS.PRIYA);
    expect(priyaRes.status).toBe(200);
    const priyaIds = priyaRes.data.map((n: any) => n.id);
    expect(priyaIds).toContain(notifPriya1);
    expect(priyaIds).toContain(notifPriya2);
    expect(priyaIds.includes(notifArun1)).toBe(false);
    expect(priyaIds.includes(notifArun2)).toBe(false);
  });

  // 2. Read Single Notification
  await TestRunner.test('read: marks single notification as read; cross-user read is forbidden', async () => {
    // Arun marks their own notification as read
    const readRes = await apiRequest(
      'POST',
      `/api/notifications/${notifArun1}/read`,
      undefined,
      TOKENS.FACULTY
    );
    expect(readRes.status).toBe(200);
    expect(readRes.data.success).toBe(true);

    // Verify in database that notifArun1 is read: true
    const [dbNotif] = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, notifArun1));
    expect(dbNotif.read).toBe(true);

    // Cross-user read attempt: Arun attempts to mark Priya's notification as read
    const forbiddenReadRes = await apiRequest(
      'POST',
      `/api/notifications/${notifPriya1}/read`,
      undefined,
      TOKENS.FACULTY
    );
    expect(forbiddenReadRes.status).toBe(403);
    expect(forbiddenReadRes.data.code).toBe('FORBIDDEN_NOTIF_ACCESS');
  });

  // 3. Read All for Current User Only
  await TestRunner.test('read all for current user only: marks user own notifications, leaves others untouched', async () => {
    // Before calling: Arun has notifArun2 unread; Priya has notifPriya1 and notifPriya2 unread
    const [beforePriya1] = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, notifPriya1));
    const [beforePriya2] = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, notifPriya2));
    expect(beforePriya1.read).toBe(false);
    expect(beforePriya2.read).toBe(false);

    // Arun triggers read-all
    const readAllRes = await apiRequest(
      'POST',
      '/api/notifications/read-all',
      undefined,
      TOKENS.FACULTY
    );
    expect(readAllRes.status).toBe(200);

    // Verify Arun's notifications are now all read
    const [afterArun2] = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, notifArun2));
    expect(afterArun2.read).toBe(true);

    // Verify Priya's notifications are STILL UNREAD (untouched)
    const [afterPriya1] = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, notifPriya1));
    const [afterPriya2] = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, notifPriya2));
    expect(afterPriya1.read).toBe(false);
    expect(afterPriya2.read).toBe(false);
  });
}
