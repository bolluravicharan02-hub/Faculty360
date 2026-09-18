import { Request, Response, NextFunction } from 'express';
import { db } from '../src/db/index.ts';
import * as schema from '../src/db/schema.ts';
import { eq, or, ilike } from 'drizzle-orm';
import { Role } from '../src/types.ts';
import { supabaseServer, verifySupabaseToken } from './supabase.ts';

export interface AuthenticatedUser {
  id: string;
  uid?: string;
  email: string;
  name: string;
  role: Role;
  facultyId?: string;
  departmentId?: string;
  departmentName?: string;
  designation?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

// Re-export server client for authorized server operations
export { supabaseServer };

/**
 * Express middleware: Authenticate Bearer Supabase access token.
 * 1. Validates the JWT against Supabase Auth using the server-side client.
 * 2. Fetches authoritative user profile and role from the PostgreSQL database.
 * 3. Never allows clients to choose or alter their role.
 * 4. Rejects unauthenticated or expired tokens with HTTP 401.
 * 5. Rejects accounts without a registered university profile with HTTP 403.
 */
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Supabase authentication token required',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Empty authentication token provided',
      code: 'INVALID_TOKEN',
    });
  }

  try {
    // 1. Validate Supabase access token with Supabase Auth
    const { user: sbUser, error: sbError } = await verifySupabaseToken(token);
    if (sbError || !sbUser) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired Supabase session. Please sign in again.',
        code: 'AUTH_EXPIRED',
        detail: sbError?.message || 'Token verification failed',
      });
    }

    // 2. Fetch authoritative user profile and role from the PostgreSQL database.
    // The role must come from the database profile, never from client input.
    let [dbUser] = await db
      .select()
      .from(schema.users)
      .where(
        or(
          eq(schema.users.uid, sbUser.id),
          sbUser.email ? ilike(schema.users.email, sbUser.email.toLowerCase().trim()) : undefined
        )
      )
      .limit(1);

    // If not directly found by email in users, check matching faculty email alias
    if (!dbUser && sbUser.email) {
      const [matchedFaculty] = await db
        .select()
        .from(schema.faculty)
        .where(ilike(schema.faculty.email, sbUser.email.toLowerCase().trim()))
        .limit(1);
      if (matchedFaculty) {
        [dbUser] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, matchedFaculty.id))
          .limit(1);
      }
    }

    if (!dbUser || !dbUser.role) {
      return res.status(403).json({
        error: 'Access Denied: No active university profile registered for this account. Please contact your Academic Administrator.',
        code: 'NO_PROFILE',
        email: sbUser.email,
      });
    }

    // 3. Link Supabase UID in database if not set
    if (dbUser.uid !== sbUser.id) {
      await db
        .update(schema.users)
        .set({ uid: sbUser.id })
        .where(eq(schema.users.id, dbUser.id));
      dbUser.uid = sbUser.id;
    }

    // 4. Attach verified user profile to request
    req.user = {
      id: dbUser.id,
      uid: sbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as Role,
      facultyId: dbUser.facultyId || undefined,
      departmentId: dbUser.departmentId || undefined,
      departmentName: dbUser.departmentName || undefined,
      designation: dbUser.designation || undefined,
    };

    return next();
  } catch (err: any) {
    console.error('Server-side authentication error:', err);
    return res.status(500).json({
      error: 'Internal server error validating authentication session',
      code: 'AUTH_INTERNAL_ERROR',
    });
  }
}

/**
 * Express middleware: Role-based Authorization Guard.
 * Enforces that req.user.role is within the allowedRoles array.
 */
export function requireRole(allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized: Authentication required',
        code: 'UNAUTHENTICATED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your institutional role is [${req.user.role}].`,
        code: 'FORBIDDEN_ROLE',
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
      });
    }

    next();
  };
}
