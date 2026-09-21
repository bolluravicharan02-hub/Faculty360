/**
 * Master Test Runner for Faculty360
 * 
 * Executes all automated test suites:
 * 1. Authentication
 * 2. Roles & Permissions
 * 3. Leave Management
 * 4. Alternative Classes & Substitution
 * 5. Notifications
 * 6. Reports & Analytics
 */

import { BASE_URL, TestRunner } from './test-utils.ts';
import { runAuthTests } from './auth.test.ts';
import { runRoleTests } from './roles.test.ts';
import { runLeaveTests } from './leave.test.ts';
import { runAlternativeClassTests } from './alternative-class.test.ts';
import { runNotificationTests } from './notifications.test.ts';
import { runReportTests } from './reports.test.ts';

async function checkServerReady(): Promise<boolean> {
  console.log(`Checking API health at ${BASE_URL}/api/health ...`);
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        console.log(`\x1b[32m✔ Connected to Faculty360 API server at ${BASE_URL}\x1b[0m\n`);
        return true;
      }
    } catch {
      // Wait and retry
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

async function main() {
  console.log('\x1b[1;34m╔══════════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1;34m║             FACULTY360 AUTOMATED TEST & QA SUITE                 ║\x1b[0m');
  console.log('\x1b[1;34m╚══════════════════════════════════════════════════════════════════╝\x1b[0m\n');

  const serverReady = await checkServerReady();
  if (!serverReady) {
    console.error(`\x1b[31mError: Faculty360 API server is not running on ${BASE_URL}.\x1b[0m`);
    console.error('Please start the dev server before running tests: npm run dev');
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    // 1. Authentication Tests
    await runAuthTests();

    // 2. Roles Tests
    await runRoleTests();

    // 3. Leave Management Tests
    await runLeaveTests();

    // 4. Alternative Class Tests
    await runAlternativeClassTests();

    // 5. Notifications Tests
    await runNotificationTests();

    // 6. Reports Tests
    await runReportTests();
  } catch (fatalErr) {
    console.error('\x1b[31mFatal error during test suite execution:\x1b[0m', fatalErr);
    process.exit(1);
  }

  const success = TestRunner.printSummary();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Completed in ${elapsed}s\n`);

  if (!success) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
