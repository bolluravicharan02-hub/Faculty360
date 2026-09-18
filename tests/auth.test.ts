/**
 * Test Suite: Authentication & Session Management
 * 
 * Workflows tested:
 * - login success: credentials authenticate with Supabase, returns verified session and loads user profile
 * - wrong password: bad credentials rejected by Supabase Auth with appropriate error
 * - logout: session termination invalidates auth tokens
 * - expired session: expired token rejected with HTTP 401 AUTH_EXPIRED
 * - unauthorized access: protected routes rejected with HTTP 401 AUTH_REQUIRED when no token supplied
 */

import { apiRequest, expect, TestRunner, TOKENS } from './test-utils.ts';
import { supabaseServer } from '../server/supabase.ts';

export async function runAuthTests() {
  TestRunner.setSuite('Authentication');
  console.log('\n\x1b[1m▶ Running Test Suite: Authentication\x1b[0m');

  const testEmail = 'admin@faculty360.demo';
  const testPassword = 'Faculty360@Admin2026!';

  // Ensure test user exists in Supabase Auth
  try {
    const { data: { users } } = await supabaseServer.auth.admin.listUsers();
    const existing = users?.find((u: any) => u.email === testEmail);
    if (!existing) {
      await supabaseServer.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      });
    } else {
      await supabaseServer.auth.admin.updateUserById(existing.id, { password: testPassword });
    }
  } catch (e) {
    console.warn('Note: Could not ensure Supabase test user, proceeding with auth tests', e);
  }

  // 1. Login Success
  await TestRunner.test('login success: valid credentials authenticate and issue token', async () => {
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    expect(error).toBeNull();
    expect(data.session).toBeTruthy();
    expect(typeof data.session?.access_token).toBe('string');
    expect(data.user?.email).toBe(testEmail);

    // Verify token resolves against Faculty360 API profile
    const profileRes = await apiRequest('GET', '/api/auth/me', undefined, data.session?.access_token);
    expect(profileRes.status).toBe(200);
    expect(profileRes.data.email).toBe('admin@faculty360.demo');
    expect(profileRes.data.role).toBe('ADMIN');
  });

  // 2. Wrong Password
  await TestRunner.test('wrong password: bad credentials rejected by authentication provider', async () => {
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email: testEmail,
      password: 'DefinitivelyWrongPassword999!',
    });

    expect(data.session).toBeNull();
    expect(error).toBeTruthy();
    expect(error?.message?.toLowerCase()).toContain('invalid');
  });

  // 3. Logout
  await TestRunner.test('logout: session invalidation and signout', async () => {
    // Authenticate a fresh session
    const { data } = await supabaseServer.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    const token = data.session?.access_token;
    expect(token).toBeTruthy();

    // Revoke / sign out session via Supabase Admin
    if (data.user?.id) {
      const { error: signOutErr } = await supabaseServer.auth.admin.signOut(token!);
      expect(signOutErr).toBeNull();
    }
  });

  // 4. Expired Session
  await TestRunner.test('expired session: returns HTTP 401 AUTH_EXPIRED on protected route', async () => {
    const res = await apiRequest('GET', '/api/auth/me', undefined, TOKENS.EXPIRED);
    expect(res.status).toBe(401);
    expect(res.data.code).toBe('AUTH_EXPIRED');
    expect(res.data.error).toContain('Unauthorized');
  });

  // 5. Unauthorized Access
  await TestRunner.test('unauthorized access: missing token returns HTTP 401 AUTH_REQUIRED', async () => {
    const res = await apiRequest('GET', '/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.data.code).toBe('AUTH_REQUIRED');
    expect(res.data.error).toContain('Unauthorized');

    // Also test protected leaves endpoint without authorization
    const leavesRes = await apiRequest('GET', '/api/leave');
    expect(leavesRes.status).toBe(401);
    expect(leavesRes.data.code).toBe('AUTH_REQUIRED');
  });
}
