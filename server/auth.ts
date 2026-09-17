import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../src/lib/firebase-admin.ts';
import { Role } from '../src/types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'faculty360-university-secret-key-2026-secure-auth';

export interface AuthenticatedUser {
  id: string;
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

// Generate secure HMAC-SHA256 signed token
export function generateToken(user: AuthenticatedUser, expiresInHours = 24): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    facultyId: user.facultyId,
    departmentId: user.departmentId,
    departmentName: user.departmentName,
    designation: user.designation,
    exp,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify HMAC-SHA256 signed token
export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSig) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Expired
    }

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role as Role,
      facultyId: payload.facultyId,
      departmentId: payload.departmentId,
      departmentName: payload.departmentName,
      designation: payload.designation,
    };
  } catch (err) {
    return null;
  }
}

// Express middleware: Authenticate Bearer token
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication token required',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // 1. Try verify HMAC token
  const verifiedUser = verifyToken(token);
  if (verifiedUser) {
    req.user = verifiedUser;
    return next();
  }

  // 2. Try Firebase ID token verification
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded && decoded.uid) {
      req.user = {
        id: decoded.uid,
        email: decoded.email || '',
        name: decoded.name || 'Authenticated User',
        role: ((decoded as any).role as Role) || 'FACULTY',
      };
      return next();
    }
  } catch (err) {
    // Firebase verification failed
  }

  // 3. Fallback for legacy demo tokens formatted like pg-token-<userId>-<timestamp> or demo-*
  if (token.startsWith('pg-token-') || token.startsWith('demo-')) {
    let targetId = 'usr-rajesh';
    const lower = token.toLowerCase();
    if (lower.includes('admin')) targetId = 'usr-admin';
    else if (lower.includes('arun') || lower.includes('faculty')) targetId = 'usr-arun';
    else if (lower.includes('rajesh') || lower.includes('hod')) targetId = 'usr-rajesh';

    // Set fallback user
    req.user = {
      id: targetId,
      email: targetId === 'usr-admin' ? 'admin@faculty360.demo' : targetId === 'usr-arun' ? 'arun.kumar@takshashila.edu' : 'rajesh.sharma@takshashila.edu',
      name: targetId === 'usr-admin' ? 'Dr. K. S. Somnath' : targetId === 'usr-arun' ? 'Dr. Arun Kumar' : 'Dr. Rajesh Sharma',
      role: targetId === 'usr-admin' ? 'ADMIN' : targetId === 'usr-arun' ? 'FACULTY' : 'HOD',
      facultyId: targetId === 'usr-admin' ? 'FAC-DIR-001' : targetId === 'usr-arun' ? 'FAC-CSE-002' : 'FAC-CSE-001',
      departmentId: 'dept-cse',
      departmentName: 'Department of Computer Science & Engineering',
      designation: targetId === 'usr-admin' ? 'Director & Administrator' : targetId === 'usr-arun' ? 'Assistant Professor' : 'Assoc. Professor & HOD',
    };
    return next();
  }

  return res.status(401).json({
    error: 'Unauthorized: Invalid or expired authentication token',
    code: 'INVALID_TOKEN',
  });
}

// Express middleware: Optional Bearer token for safe read-only queries
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Attach default demo user context so dashboard read-only queries load cleanly
    req.user = {
      id: 'usr-rajesh',
      email: 'rajesh.sharma@takshashila.edu',
      name: 'Dr. Rajesh Sharma',
      role: 'HOD',
      facultyId: 'FAC-CSE-001',
      departmentId: 'dept-cse',
      departmentName: 'Department of Computer Science & Engineering',
      designation: 'Assoc. Professor & HOD',
    };
    return next();
  }
  return authenticateToken(req, res, next);
}

// Express middleware: Role-based Authorization Guard
export function requireRole(allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized: No authenticated user session found',
        code: 'UNAUTHENTICATED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your current role is [${req.user.role}].`,
        code: 'FORBIDDEN_ROLE',
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
      });
    }

    next();
  };
}
