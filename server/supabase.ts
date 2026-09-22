import { createClient, SupabaseClient, User, AuthError } from '@supabase/supabase-js';

/**
 * Derives a valid HTTP or HTTPS Supabase project API URL.
 * Guarantees createClient will never receive an invalid URL protocol (such as postgresql://).
 */
export function resolveSupabaseHttpUrl(
  preferredUrl?: string,
  fallbackUrls: (string | undefined)[] = []
): string {
  const candidates = [preferredUrl, ...fallbackUrls];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;

    // 1. Direct HTTP or HTTPS URL
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
      return trimmed.replace(/\/+$/, '');
    }

    // 2. Postgres connection string: postgresql://postgres.REF:... or ...@db.REF.supabase.co
    if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
      const userMatch = trimmed.match(/postgres\.([a-zA-Z0-9_-]+):/);
      if (userMatch && userMatch[1]) {
        return `https://${userMatch[1]}.supabase.co`;
      }
      const hostMatch = trimmed.match(/db\.([a-zA-Z0-9_-]+)\.supabase\.co/);
      if (hostMatch && hostMatch[1]) {
        return `https://${hostMatch[1]}.supabase.co`;
      }
      const poolerMatch = trimmed.match(/([a-zA-Z0-9_-]+)\.pooler\.supabase\.co/);
      if (poolerMatch && poolerMatch[1]) {
        return `https://${poolerMatch[1]}.supabase.co`;
      }
    }

    // 3. Plain domain like xxx.supabase.co without protocol
    if (trimmed.includes('.supabase.co')) {
      const clean = trimmed.replace(/^[a-zA-Z0-9_-]+:\/\//, '');
      return `https://${clean.replace(/\/+$/, '')}`;
    }
  }

  return 'https://placeholder.supabase.co';
}

// Derive authoritative server-side Supabase credentials
// Primary key: SUPABASE_SERVICE_ROLE_KEY (Server secret, bypasses RLS for privileged management)
// Primary key: SUPABASE_SERVICE_ROLE_KEY (Server secret, bypasses RLS for privileged management)
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (process.env.NODE_ENV === 'production' && !serviceKey) {
  throw new Error(
    'FATAL CONFIGURATION ERROR: SUPABASE_SERVICE_ROLE_KEY is required for privileged server authentication in production.'
  );
}

// Derive HTTP/HTTPS project API endpoint (checking SUPABASE_URL, then database URL derived endpoints)
let supabaseUrl = resolveSupabaseHttpUrl(process.env.SUPABASE_URL, [
  process.env.DATABASE_URL,
  process.env.SUPABASE_DB_URL,
  process.env.VITE_SUPABASE_URL,
]);

// If still placeholder, try extracting ref from JWT format if key has dots
if (supabaseUrl === 'https://placeholder.supabase.co' && serviceKey && serviceKey.includes('.')) {
  try {
    const payload = JSON.parse(Buffer.from(serviceKey.split('.')[1], 'base64url').toString('utf8'));
    if (payload && payload.ref) {
      supabaseUrl = `https://${payload.ref}.supabase.co`;
    }
  } catch {}
}

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  serviceKey &&
  serviceKey !== 'placeholder-service-key'
);

/**
 * Authoritative Server-Side Supabase Client
 * - Uses SUPABASE_SERVICE_ROLE_KEY to perform privileged operations, verify tokens, and manage auth.
 * - This client and its key must NEVER be exposed to the browser or frontend bundle.
 */
export const supabaseServer: SupabaseClient = createClient(
  supabaseUrl,
  serviceKey || 'placeholder-service-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Validates a Bearer Supabase JWT access token on the server against Supabase Auth.
 * Returns the verified Supabase User object or an error.
 */
export async function verifySupabaseToken(
  token: string
): Promise<{ user: User | null; error: AuthError | null }> {
  if (!token || !token.trim()) {
    return {
      user: null,
      error: { name: 'AuthError', message: 'Empty authentication token', status: 401 } as AuthError,
    };
  }

  const cleanToken = token.trim();

  // Test token handling: Strictly forbidden in production.
  // In non-production environments (development & automated test suites), permitted.
  if (cleanToken.startsWith('test-token-')) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      return {
        user: null,
        error: {
          name: 'AuthError',
          message: 'Unauthorized: Test authentication tokens are strictly disabled in this environment',
          status: 401,
        } as AuthError,
      };
    }

    if (cleanToken === 'test-token-expired') {
      return {
        user: null,
        error: { name: 'AuthError', message: 'JWT session expired', status: 401 } as AuthError,
      };
    }
    if (cleanToken === 'test-token-invalid') {
      return {
        user: null,
        error: { name: 'AuthError', message: 'Invalid token signature', status: 401 } as AuthError,
      };
    }
    if (cleanToken === 'test-token-admin') {
      return {
        user: { id: 'usr-admin', email: 'admin@faculty360.demo' } as any,
        error: null,
      };
    }
    if (cleanToken === 'test-token-hod') {
      return {
        user: { id: 'usr-rajesh', email: 'rajesh.sharma@takshashila.edu' } as any,
        error: null,
      };
    }
    if (cleanToken === 'test-token-faculty') {
      return {
        user: { id: 'usr-arun', email: 'arun.kumar@takshashila.edu' } as any,
        error: null,
      };
    }
    if (cleanToken === 'test-token-student') {
      return {
        user: { id: 'usr-student', email: 'student@faculty360.demo' } as any,
        error: null,
      };
    }
    if (cleanToken === 'test-token-priya') {
      return {
        user: { id: 'usr-priya', email: 'priya.menon@takshashila.edu' } as any,
        error: null,
      };
    }
    if (cleanToken === 'test-token-unregistered') {
      return {
        user: { id: 'test-unregistered-uid', email: 'unregistered.user@takshashila.edu' } as any,
        error: null,
      };
    }
  }

  try {
    const { data, error } = await supabaseServer.auth.getUser(cleanToken);
    return {
      user: data?.user || null,
      error: error || null,
    };
  } catch (err: any) {
    return {
      user: null,
      error: {
        name: 'AuthError',
        message: err?.message || 'Failed to verify token with Supabase',
        status: 500,
      } as AuthError,
    };
  }
}
