/**
 * Faculty360 Test Suite Utilities & Runner Harness
 */

export const BASE_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';

export const TOKENS = {
  ADMIN: 'test-token-admin',
  HOD: 'test-token-hod',
  FACULTY: 'test-token-faculty',
  PRIYA: 'test-token-priya',
  EXPIRED: 'test-token-expired',
  INVALID: 'test-token-invalid',
  UNREGISTERED: 'test-token-unregistered',
};

export interface ApiResponse<T = any> {
  status: number;
  ok: boolean;
  data: T;
  headers: Headers;
}

export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  body?: any,
  token?: string
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: any;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
    headers: response.headers,
  };
}

export interface TestResult {
  suite: string;
  testName: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export class TestRunner {
  private static results: TestResult[] = [];
  private static currentSuite = '';

  static setSuite(name: string) {
    this.currentSuite = name;
  }

  static async test(testName: string, fn: () => Promise<void> | void): Promise<boolean> {
    const start = Date.now();
    try {
      await fn();
      const durationMs = Date.now() - start;
      this.results.push({
        suite: this.currentSuite,
        testName,
        passed: true,
        durationMs,
      });
      console.log(`  \x1b[32m✔\x1b[0m ${testName} \x1b[90m(${durationMs}ms)\x1b[0m`);
      return true;
    } catch (err: any) {
      const durationMs = Date.now() - start;
      const errorMsg = err?.message || String(err);
      this.results.push({
        suite: this.currentSuite,
        testName,
        passed: false,
        durationMs,
        error: errorMsg,
      });
      console.log(`  \x1b[31m✖\x1b[0m ${testName} \x1b[90m(${durationMs}ms)\x1b[0m`);
      console.log(`    \x1b[31mError: ${errorMsg}\x1b[0m`);
      return false;
    }
  }

  static getResults(): TestResult[] {
    return [...this.results];
  }

  static clear() {
    this.results = [];
  }

  static printSummary(): boolean {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = total - passed;
    const totalDuration = this.results.reduce((acc, r) => acc + r.durationMs, 0);

    console.log('\n' + '─'.repeat(70));
    console.log(`\x1b[1mFaculty360 Test Execution Summary\x1b[0m`);
    console.log('─'.repeat(70));
    console.log(`Total Tests : ${total}`);
    console.log(`Passed      : \x1b[32m${passed}\x1b[0m`);
    if (failed > 0) {
      console.log(`Failed      : \x1b[31m${failed}\x1b[0m`);
    } else {
      console.log(`Failed      : 0`);
    }
    console.log(`Duration    : ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('─'.repeat(70));

    if (failed > 0) {
      console.log('\x1b[31mFailed Tests:\x1b[0m');
      for (const f of this.results.filter((r) => !r.passed)) {
        console.log(` • [${f.suite}] ${f.testName}: ${f.error}`);
      }
      return false;
    } else {
      console.log('\x1b[32m✔ All automated test suites passed successfully!\x1b[0m\n');
      return true;
    }
  }
}

export function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but received ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected deep equal ${JSON.stringify(expected)}, but received ${JSON.stringify(actual)}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, but received ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value, but received ${JSON.stringify(actual)}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined, but received undefined`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, but received ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(num: number) {
      if (typeof actual !== 'number' || actual <= num) {
        throw new Error(`Expected ${actual} to be greater than ${num}`);
      }
    },
    toBeGreaterThanOrEqual(num: number) {
      if (typeof actual !== 'number' || actual < num) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${num}`);
      }
    },
    toContain(substrOrItem: any) {
      if (typeof actual === 'string') {
        if (!actual.includes(substrOrItem)) {
          throw new Error(`Expected string "${actual}" to contain "${substrOrItem}"`);
        }
      } else if (Array.isArray(actual)) {
        if (!actual.includes(substrOrItem)) {
          throw new Error(`Expected array to contain ${JSON.stringify(substrOrItem)}`);
        }
      } else {
        throw new Error(`Cannot call toContain on type ${typeof actual}`);
      }
    },
    toIncludePartial(obj: Record<string, any>) {
      if (typeof actual !== 'object' || actual === null) {
        throw new Error(`Expected object, but received ${JSON.stringify(actual)}`);
      }
      for (const [key, value] of Object.entries(obj)) {
        if (actual[key] !== value) {
          throw new Error(`Expected property "${key}" to be ${JSON.stringify(value)}, but was ${JSON.stringify(actual[key])}`);
        }
      }
    }
  };
}
