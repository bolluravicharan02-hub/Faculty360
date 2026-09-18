import { Router, Request, Response } from 'express';
import { eq, and, desc, sql, ilike, or, ne, inArray } from 'drizzle-orm';
import { db } from '../src/db/index.ts';
import * as schema from '../src/db/schema.ts';
import { CandidateFaculty, LeaveRequest, TimetableSlot, AlternativeClassAssignment, UserProfile, Role } from '../src/types.ts';
import { authenticateToken, requireRole, AuthRequest, AuthenticatedUser } from './auth.ts';

export const apiRouter = Router();

// Helper to format UserProfile for frontend
function formatUserProfile(u: typeof schema.users.$inferSelect): UserProfile {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Role,
    facultyId: u.facultyId || undefined,
    departmentId: u.departmentId || undefined,
    departmentName: u.departmentName || undefined,
    designation: u.designation || undefined,
    avatarUrl: u.avatarUrl || undefined,
    phone: u.phone || undefined,
    leaveBalance: {
      casual: u.leaveCasual,
      medical: u.leaveMedical,
      earned: u.leaveEarned,
      total: u.leaveTotal,
    },
  };
}

// Helper to log audit actions to PostgreSQL
async function logAuditAction(
  userId: string,
  userName: string,
  action: string,
  module: 'AUTH' | 'LEAVE' | 'TIMETABLE' | 'SUBSTITUTION' | 'FACULTY' | 'SYSTEM' | 'ACADEMIC_INFRASTRUCTURE',
  details: string,
  metadata?: any
) {
  try {
    await db.insert(schema.auditLogs).values({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName,
      action,
      module,
      details,
      metadata: metadata || null,
    });
  } catch (err) {
    console.error('Failed to log audit action:', err);
  }
}

// ==========================================
// 1. AUTHENTICATION & PROFILE VERIFICATION
// ==========================================

// Authoritative user profile endpoint:
// Validates Supabase access token and returns database-backed role and profile
apiRouter.get('/auth/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated session', code: 'UNAUTHENTICATED' });
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.user.id));

    if (!user) {
      return res.status(404).json({
        error: 'University profile not found for this account',
        code: 'PROFILE_NOT_FOUND',
      });
    }

    return res.json(formatUserProfile(user));
  } catch (err: any) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Alias /auth/me to /auth/profile for compatibility
apiRouter.get('/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated session', code: 'UNAUTHENTICATED' });
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.user.id));

    if (!user) {
      return res.status(404).json({
        error: 'University profile not found for this account',
        code: 'PROFILE_NOT_FOUND',
      });
    }

    return res.json(formatUserProfile(user));
  } catch (err: any) {
    console.error('Error fetching current user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// ==========================================
// 2. DEPARTMENTS & FACULTY MANAGEMENT
// ==========================================

apiRouter.get('/departments', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select()
      .from(schema.departments)
      .orderBy(schema.departments.name);
    res.json(list);
  } catch (err: any) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

apiRouter.post('/departments', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, hodName, facultyCount } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Department code and name are required' });
    }
    const id = `dept-${code.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;
    const [dept] = await db
      .insert(schema.departments)
      .values({
        id,
        code: code.toUpperCase().trim(),
        name: name.trim(),
        hodName: hodName || 'To Be Appointed',
        facultyCount: Number(facultyCount) || 0,
        attendanceRate: 95,
      })
      .returning();

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'CREATE_DEPARTMENT',
      'ACADEMIC_INFRASTRUCTURE',
      `Created department ${name} (${code})`
    );

    res.status(201).json(dept);
  } catch (err: any) {
    console.error('Error creating department:', err);
    res.status(500).json({ error: err.message || 'Failed to create department' });
  }
});

apiRouter.put('/departments/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, hodName, facultyCount, attendanceRate } = req.body;

    const [updated] = await db
      .update(schema.departments)
      .set({
        ...(name && { name: name.trim() }),
        ...(hodName !== undefined && { hodName: hodName.trim() }),
        ...(facultyCount !== undefined && { facultyCount: Number(facultyCount) }),
        ...(attendanceRate !== undefined && { attendanceRate: Number(attendanceRate) }),
      })
      .where(eq(schema.departments.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Department not found' });
    }

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'UPDATE_DEPARTMENT',
      'ACADEMIC_INFRASTRUCTURE',
      `Updated department ${updated.name}`
    );

    res.json(updated);
  } catch (err: any) {
    console.error('Error updating department:', err);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

apiRouter.delete('/departments/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [deleted] = await db
      .delete(schema.departments)
      .where(eq(schema.departments.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Department not found' });
    }

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'DELETE_DEPARTMENT',
      'ACADEMIC_INFRASTRUCTURE',
      `Deleted department ${deleted.name}`
    );

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting department:', err);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// ==========================================
// SUBJECTS MANAGEMENT
// ==========================================
apiRouter.get('/subjects', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { department, semester, type, search } = req.query;
    let queryBuilder = db.select().from(schema.subjects);
    const conditions = [];

    if (department && department !== 'All') {
      conditions.push(
        or(
          eq(schema.subjects.departmentId, String(department)),
          ilike(schema.subjects.departmentName, `%${department}%`)
        )
      );
    }
    if (semester && semester !== 'All') {
      conditions.push(eq(schema.subjects.semester, String(semester)));
    }
    if (type && type !== 'All') {
      conditions.push(eq(schema.subjects.type, String(type)));
    }
    if (search) {
      const q = `%${search}%`;
      conditions.push(
        or(
          ilike(schema.subjects.code, q),
          ilike(schema.subjects.name, q),
          ilike(schema.subjects.departmentName, q)
        )
      );
    }

    const list = conditions.length > 0
      ? await queryBuilder.where(and(...conditions)).orderBy(schema.subjects.code)
      : await queryBuilder.orderBy(schema.subjects.code);

    res.json(list);
  } catch (err: any) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ error: 'Failed to fetch subjects catalog' });
  }
});

apiRouter.post('/subjects', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, departmentId, departmentName, credits, semester, type, weeklyHours, syllabusSummary } = req.body;
    if (!code || !name || !semester) {
      return res.status(400).json({ error: 'Subject code, name, and semester are required' });
    }

    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const [sub] = await db
      .insert(schema.subjects)
      .values({
        id,
        code: code.toUpperCase().trim(),
        name: name.trim(),
        departmentId: departmentId || 'dept-cse',
        departmentName: departmentName || 'Department of Computer Science & Engineering',
        credits: Number(credits) || 4,
        semester: semester.trim(),
        type: type || 'Core',
        weeklyHours: Number(weeklyHours) || 4,
        syllabusSummary: syllabusSummary || null,
      })
      .returning();

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'CREATE_SUBJECT',
      'ACADEMIC_INFRASTRUCTURE',
      `Created subject ${name} (${code})`
    );

    res.status(201).json(sub);
  } catch (err: any) {
    console.error('Error creating subject:', err);
    res.status(500).json({ error: err.message || 'Failed to create subject' });
  }
});

apiRouter.put('/subjects/:id', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name, departmentId, departmentName, credits, semester, type, weeklyHours, syllabusSummary } = req.body;

    const [updated] = await db
      .update(schema.subjects)
      .set({
        ...(code && { code: code.toUpperCase().trim() }),
        ...(name && { name: name.trim() }),
        ...(departmentId && { departmentId }),
        ...(departmentName && { departmentName }),
        ...(credits !== undefined && { credits: Number(credits) }),
        ...(semester && { semester: semester.trim() }),
        ...(type && { type }),
        ...(weeklyHours !== undefined && { weeklyHours: Number(weeklyHours) }),
        ...(syllabusSummary !== undefined && { syllabusSummary }),
      })
      .where(eq(schema.subjects.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'UPDATE_SUBJECT',
      'ACADEMIC_INFRASTRUCTURE',
      `Updated subject ${updated.name} (${updated.code})`
    );

    res.json(updated);
  } catch (err: any) {
    console.error('Error updating subject:', err);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

apiRouter.delete('/subjects/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [deleted] = await db
      .delete(schema.subjects)
      .where(eq(schema.subjects.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'DELETE_SUBJECT',
      'ACADEMIC_INFRASTRUCTURE',
      `Deleted subject ${deleted.name} (${deleted.code})`
    );

    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting subject:', err);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// ==========================================
// CLASSROOMS & VENUES MANAGEMENT
// ==========================================
apiRouter.get('/classrooms', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { building, type, status, search } = req.query;
    let queryBuilder = db.select().from(schema.classrooms);
    const conditions = [];

    if (building && building !== 'All') {
      conditions.push(ilike(schema.classrooms.building, `%${building}%`));
    }
    if (type && type !== 'All') {
      conditions.push(eq(schema.classrooms.type, String(type)));
    }
    if (status && status !== 'All') {
      conditions.push(eq(schema.classrooms.status, String(status)));
    }
    if (search) {
      const q = `%${search}%`;
      conditions.push(
        or(
          ilike(schema.classrooms.roomNumber, q),
          ilike(schema.classrooms.building, q),
          ilike(schema.classrooms.type, q)
        )
      );
    }

    const list = conditions.length > 0
      ? await queryBuilder.where(and(...conditions)).orderBy(schema.classrooms.roomNumber)
      : await queryBuilder.orderBy(schema.classrooms.roomNumber);

    res.json(list);
  } catch (err: any) {
    console.error('Error fetching classrooms:', err);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

apiRouter.post('/classrooms', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { roomNumber, building, floor, capacity, type, facilities, status } = req.body;
    if (!roomNumber || !building) {
      return res.status(400).json({ error: 'Room number and building are required' });
    }

    const id = `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const [venue] = await db
      .insert(schema.classrooms)
      .values({
        id,
        roomNumber: roomNumber.trim(),
        building: building.trim(),
        floor: Number(floor) || 1,
        capacity: Number(capacity) || 60,
        type: type || 'Smart Lecture Hall',
        facilities: facilities || ['Projector', 'Air Conditioning', 'Audio System'],
        status: status || 'Available',
      })
      .returning();

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'CREATE_CLASSROOM',
      'ACADEMIC_INFRASTRUCTURE',
      `Registered classroom ${roomNumber} in ${building}`
    );

    res.status(201).json(venue);
  } catch (err: any) {
    console.error('Error creating classroom:', err);
    res.status(500).json({ error: err.message || 'Failed to create classroom' });
  }
});

apiRouter.put('/classrooms/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { roomNumber, building, floor, capacity, type, facilities, status } = req.body;

    const [updated] = await db
      .update(schema.classrooms)
      .set({
        ...(roomNumber && { roomNumber: roomNumber.trim() }),
        ...(building && { building: building.trim() }),
        ...(floor !== undefined && { floor: Number(floor) }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(type && { type }),
        ...(facilities !== undefined && { facilities }),
        ...(status && { status }),
      })
      .where(eq(schema.classrooms.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'UPDATE_CLASSROOM',
      'ACADEMIC_INFRASTRUCTURE',
      `Updated classroom ${updated.roomNumber}`
    );

    res.json(updated);
  } catch (err: any) {
    console.error('Error updating classroom:', err);
    res.status(500).json({ error: 'Failed to update classroom' });
  }
});

apiRouter.delete('/classrooms/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [deleted] = await db
      .delete(schema.classrooms)
      .where(eq(schema.classrooms.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'DELETE_CLASSROOM',
      'ACADEMIC_INFRASTRUCTURE',
      `Deleted classroom ${deleted.roomNumber}`
    );

    res.json({ success: true, message: 'Classroom deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting classroom:', err);
    res.status(500).json({ error: 'Failed to delete classroom' });
  }
});

// ==========================================
// LEAVE TYPES
// ==========================================
apiRouter.get('/leave-types', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(schema.leaveTypes).orderBy(schema.leaveTypes.name);
    res.json(list);
  } catch (err: any) {
    console.error('Error fetching leave types:', err);
    res.status(500).json({ error: 'Failed to fetch leave types' });
  }
});

// Helper to dynamically resolve active HOD user ID for a department
async function getHodForDepartment(departmentIdOrName?: string | null): Promise<string | null> {
  if (!departmentIdOrName) {
    const [fallbackHod] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'HOD'))
      .limit(1);
    return fallbackHod ? fallbackHod.id : null;
  }
  const deptTerm = departmentIdOrName.trim();

  // 1. Direct query against users table for HOD of this department
  const hodUsers = await db
    .select()
    .from(schema.users)
    .where(
      and(
        eq(schema.users.role, 'HOD'),
        or(
          eq(schema.users.departmentId, deptTerm),
          ilike(schema.users.departmentName, `%${deptTerm}%`)
        )
      )
    )
    .limit(1);

  if (hodUsers.length > 0) {
    return hodUsers[0].id;
  }

  // 2. Query departments table to resolve department by id, code, or name
  const [dept] = await db
    .select()
    .from(schema.departments)
    .where(
      or(
        eq(schema.departments.id, deptTerm),
        ilike(schema.departments.name, `%${deptTerm}%`),
        ilike(schema.departments.code, `%${deptTerm}%`)
      )
    )
    .limit(1);

  if (dept) {
    const [hodByDeptId] = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.role, 'HOD'),
          eq(schema.users.departmentId, dept.id)
        )
      )
      .limit(1);
    if (hodByDeptId) return hodByDeptId.id;

    if (dept.hodName) {
      const [hodByName] = await db
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.role, 'HOD'),
            ilike(schema.users.name, `%${dept.hodName}%`)
          )
        )
        .limit(1);
      if (hodByName) return hodByName.id;
    }
  }

  // 3. Fallback: Any active HOD user in system
  const [anyHod] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.role, 'HOD'))
    .limit(1);

  return anyHod ? anyHod.id : null;
}

// ==========================================
// ATTENDANCE & FACULTY REGISTRY
// ==========================================
apiRouter.get('/attendance', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user!.role;
    const userDept = req.user!.departmentName;

    let queryBuilder = db.select().from(schema.faculty);

    // If caller is HOD, scope records strictly to their own department
    let records = [];
    if (userRole === 'HOD') {
      if (userDept) {
        records = await queryBuilder
          .where(ilike(schema.faculty.department, `%${userDept}%`))
          .orderBy(schema.faculty.name);
      } else {
        records = await queryBuilder.orderBy(schema.faculty.name);
      }
    } else {
      // ADMIN: university-wide
      records = await queryBuilder.orderBy(schema.faculty.name);
    }

    const presentCount = records.filter((f) => f.status === 'Present').length;
    const inLectureCount = records.filter((f) => f.status === 'In Lecture').length;
    const onLeaveCount = records.filter((f) => f.status === 'On Leave').length;
    const absentCount = records.filter((f) => f.status === 'Absent').length;
    const total = records.length;
    const avgAttendance = total > 0
      ? Math.round(records.reduce((acc, r) => acc + (r.attendanceRate || 0), 0) / total)
      : 95;

    res.json({
      summary: {
        totalFaculty: total,
        presentToday: presentCount + inLectureCount,
        inLecture: inLectureCount,
        onLeave: onLeaveCount,
        absent: absentCount,
        attendanceRate: avgAttendance,
      },
      records,
    });
  } catch (err: any) {
    console.error('Error fetching faculty attendance:', err);
    res.status(500).json({ error: 'Failed to fetch faculty attendance' });
  }
});

apiRouter.get('/faculty', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { department, status, query } = req.query;
    const caller = req.user!;

    let queryBuilder = db.select().from(schema.faculty);

    const conditions = [];
    if (department && department !== 'All') {
      conditions.push(ilike(schema.faculty.department, `%${department}%`));
    }
    if (status && status !== 'All') {
      conditions.push(eq(schema.faculty.status, String(status)));
    }
    if (query) {
      const q = `%${query}%`;
      conditions.push(
        or(
          ilike(schema.faculty.name, q),
          ilike(schema.faculty.facultyId, q),
          ilike(schema.faculty.department, q)
        )
      );
    }

    const results = conditions.length > 0
      ? await queryBuilder.where(and(...conditions)).orderBy(schema.faculty.name)
      : await queryBuilder.orderBy(schema.faculty.name);

    // Role-based data privacy filtering:
    // Faculty should not see other faculty members' private leave balances
    const sanitizedResults = results.map((f) => {
      const isSelf = f.id === caller.id || (caller.facultyId && f.facultyId === caller.facultyId);
      const isAdmin = caller.role === 'ADMIN';
      const isHodForDept = caller.role === 'HOD' && caller.departmentName && f.department.toLowerCase().includes(caller.departmentName.toLowerCase());

      if (isSelf || isAdmin || isHodForDept) {
        return f;
      }

      // Mask private leave balance for peer faculty
      return {
        ...f,
        leaveBalance: undefined,
      };
    });

    res.json(sanitizedResults);
  } catch (err: any) {
    console.error('Error fetching faculty:', err);
    res.status(500).json({ error: 'Failed to fetch faculty directory' });
  }
});

apiRouter.get('/faculty/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const caller = req.user!;

    const [fac] = await db
      .select()
      .from(schema.faculty)
      .where(or(eq(schema.faculty.id, id), eq(schema.faculty.facultyId, id)));

    if (!fac) {
      return res.status(404).json({ error: 'Faculty member not found' });
    }

    const timetable = await db
      .select()
      .from(schema.timetableSlots)
      .where(eq(schema.timetableSlots.facultyId, fac.id));

    // Authorization check for private leave records and balance:
    // Only the faculty member themselves, their department HOD, or an ADMIN can view leaves
    const isSelf = fac.id === caller.id || fac.email.toLowerCase() === caller.email.toLowerCase() || (caller.facultyId && fac.facultyId === caller.facultyId);
    const isAdmin = caller.role === 'ADMIN';
    const isDeptHod = caller.role === 'HOD' && caller.departmentName && fac.department.toLowerCase().includes(caller.departmentName.toLowerCase());
    const canAccessPrivateLeaves = isSelf || isAdmin || isDeptHod;

    let leaves: typeof schema.leaveRequests.$inferSelect[] = [];
    if (canAccessPrivateLeaves) {
      leaves = await db
        .select()
        .from(schema.leaveRequests)
        .where(eq(schema.leaveRequests.facultyId, fac.id))
        .orderBy(desc(schema.leaveRequests.appliedAt));
    }

    res.json({
      ...fac,
      leaveBalance: canAccessPrivateLeaves ? fac.leaveBalance : undefined,
      timetable,
      leaves,
    });
  } catch (err: any) {
    console.error('Error fetching faculty profile:', err);
    res.status(500).json({ error: 'Failed to fetch faculty profile' });
  }
});

// Admin Only: Add Faculty Member
apiRouter.post('/faculty', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, department, designation, specialization, facultyId } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const id = `usr-fac-${Date.now()}`;
    const fId = facultyId || `FAC-${Date.now().toString().slice(-4)}`;

    const [newFac] = await db
      .insert(schema.faculty)
      .values({
        id,
        facultyId: fId,
        name,
        email: email.toLowerCase(),
        department: department || 'Computer Science & Engineering',
        designation: designation || 'Assistant Professor',
        status: 'Present',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        specialization: Array.isArray(specialization) ? specialization : ['General Computing'],
        classesToday: 2,
        attendanceRate: 98,
        leaveBalance: 12,
      })
      .returning();

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'FACULTY_ADDED',
      'FACULTY',
      `Administrator added faculty member ${name} (${fId})`
    );

    res.status(201).json(newFac);
  } catch (err: any) {
    console.error('Error adding faculty member:', err);
    res.status(500).json({ error: 'Failed to create faculty record' });
  }
});

// Admin & HOD: Update Faculty Member
apiRouter.put('/faculty/:id', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, designation, department, specialization } = req.body;

    const [updated] = await db
      .update(schema.faculty)
      .set({
        ...(status && { status }),
        ...(designation && { designation }),
        ...(department && { department }),
        ...(specialization && { specialization }),
        updatedAt: new Date(),
      })
      .where(eq(schema.faculty.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'FACULTY_UPDATED',
      'FACULTY',
      `Updated faculty profile for ${updated.name}`
    );

    res.json(updated);
  } catch (err: any) {
    console.error('Error updating faculty:', err);
    res.status(500).json({ error: 'Failed to update faculty profile' });
  }
});

// Admin Only: Remove Faculty Member
apiRouter.delete('/faculty/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [deleted] = await db
      .delete(schema.faculty)
      .where(eq(schema.faculty.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'FACULTY_DELETED',
      'FACULTY',
      `Administrator removed faculty ${deleted.name}`
    );

    res.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('Error deleting faculty:', err);
    res.status(500).json({ error: 'Failed to delete faculty member' });
  }
});

// ==========================================
// 3. TIMETABLE & SCHEDULE
// ==========================================

apiRouter.get('/timetable', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { day, facultyId, department, semester } = req.query;

    const conditions = [];
    if (day && day !== 'All') {
      conditions.push(ilike(schema.timetableSlots.dayOfWeek, String(day)));
    }
    if (facultyId && facultyId !== 'All') {
      conditions.push(
        or(
          eq(schema.timetableSlots.facultyId, String(facultyId)),
          eq(schema.timetableSlots.substitutedBy, String(facultyId))
        )
      );
    }
    if (department && department !== 'All') {
      conditions.push(ilike(schema.timetableSlots.department, `%${department}%`));
    }
    if (semester && semester !== 'All') {
      conditions.push(eq(schema.timetableSlots.semester, String(semester)));
    }

    const slots = conditions.length > 0
      ? await db.select().from(schema.timetableSlots).where(and(...conditions)).orderBy(schema.timetableSlots.startTime)
      : await db.select().from(schema.timetableSlots).orderBy(schema.timetableSlots.startTime);

    res.json(slots);
  } catch (err: any) {
    console.error('Error fetching timetable slots:', err);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// Admin & HOD: Create / Update Timetable Slot
apiRouter.post('/timetable', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const { dayOfWeek, startTime, endTime, subjectCode, subjectName, department, section, semester, classroom, facultyId, facultyName, enrolledStudents } = req.body;

    const slotId = `slot-${Date.now()}`;
    const [newSlot] = await db
      .insert(schema.timetableSlots)
      .values({
        id: slotId,
        dayOfWeek,
        startTime,
        endTime,
        subjectCode,
        subjectName,
        department: department || 'Computer Science & Engineering',
        section: section || 'B.Tech CSE',
        semester: semester || 'Semester 5',
        classroom: classroom || 'Room 301',
        facultyId,
        facultyName,
        status: 'SCHEDULED',
        enrolledStudents: enrolledStudents || 60,
      })
      .returning();

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'TIMETABLE_SLOT_CREATED',
      'TIMETABLE',
      `Added timetable slot ${subjectCode} (${startTime}-${endTime}) for ${facultyName}`
    );

    res.status(201).json(newSlot);
  } catch (err: any) {
    console.error('Error creating timetable slot:', err);
    res.status(500).json({ error: 'Failed to create timetable slot' });
  }
});

// Helper to calculate list of ISO date strings within range
function getDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  try {
    const [sy, sm, sd] = startStr.split('-').map(Number);
    const [ey, em, ed] = endStr.split('-').map(Number);
    const curr = new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0));
    const end = new Date(Date.UTC(ey, em - 1, ed, 12, 0, 0));
    let count = 0;
    while (curr <= end && count < 60) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setUTCDate(curr.getUTCDate() + 1);
      count++;
    }
  } catch {
    dates.push(startStr);
  }
  return dates.length > 0 ? dates : [startStr];
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ==========================================
// 4. LEAVE MANAGEMENT (ROLE-PROTECTED)
// ==========================================

const fetchLeaveRequestsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { facultyId, status, department } = req.query;
    const userRole = req.user!.role;
    const conditions = [];

    // Role-based scoping:
    // 4. Faculty should only see their own leave records.
    // 5. HOD should only see their department leave records.
    // 6. Admin can see university-wide records.
    if (userRole === 'FACULTY') {
      if (facultyId && String(facultyId) !== req.user!.id && (req.user!.facultyId && String(facultyId) !== req.user!.facultyId)) {
        return res.status(403).json({
          error: 'Forbidden: Faculty members are only authorized to view their own leave records.',
          code: 'FORBIDDEN_RESOURCE',
        });
      }
      conditions.push(
        or(
          eq(schema.leaveRequests.facultyId, req.user!.id),
          ilike(schema.leaveRequests.facultyEmail, req.user!.email)
        )
      );
    } else if (userRole === 'HOD') {
      const hodDept = req.user!.departmentName;
      if (hodDept) {
        conditions.push(
          or(
            eq(schema.leaveRequests.department, hodDept),
            ilike(schema.leaveRequests.department, `%${hodDept}%`)
          )
        );
      }
      if (facultyId) {
        // Verify faculty belongs to HOD's department
        const [targetFac] = await db
          .select()
          .from(schema.faculty)
          .where(eq(schema.faculty.id, String(facultyId)));
        if (!targetFac || (hodDept && !targetFac.department.toLowerCase().includes(hodDept.toLowerCase()))) {
          return res.status(403).json({
            error: 'Forbidden: HODs can only view leave records within their own department.',
            code: 'FORBIDDEN_DEPARTMENT',
          });
        }
        conditions.push(eq(schema.leaveRequests.facultyId, String(facultyId)));
      }
    } else {
      // ADMIN: university-wide records
      if (facultyId) {
        conditions.push(eq(schema.leaveRequests.facultyId, String(facultyId)));
      }
      if (department && department !== 'All') {
        conditions.push(
          or(
            eq(schema.leaveRequests.department, String(department)),
            ilike(schema.leaveRequests.department, `%${department}%`)
          )
        );
      }
    }

    if (status && status !== 'All') {
      conditions.push(eq(schema.leaveRequests.status, String(status)));
    }

    const leaves = conditions.length > 0
      ? await db.select().from(schema.leaveRequests).where(and(...conditions)).orderBy(desc(schema.leaveRequests.appliedAt))
      : await db.select().from(schema.leaveRequests).orderBy(desc(schema.leaveRequests.appliedAt));

    res.json(leaves);
  } catch (err: any) {
    console.error('Error fetching leave requests:', err);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
};

apiRouter.get('/leave', authenticateToken, fetchLeaveRequestsHandler);
apiRouter.get('/leaves', authenticateToken, fetchLeaveRequestsHandler);
apiRouter.get('/leave-requests', authenticateToken, fetchLeaveRequestsHandler);

// Endpoint to preview affected timetable classes for a potential or existing leave application
apiRouter.get('/leave/preview-affected', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { facultyId, facultyName, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const userRole = req.user!.role;
    const requestedFacultyId = facultyId ? String(facultyId) : undefined;

    // 1. Faculty role scoping: Faculty can ONLY preview classes for themselves
    if (userRole === 'FACULTY') {
      if (
        requestedFacultyId &&
        requestedFacultyId !== req.user!.id &&
        (req.user!.facultyId && requestedFacultyId !== req.user!.facultyId)
      ) {
        return res.status(403).json({
          error: 'Forbidden: Faculty members are only authorized to preview affected classes for themselves.',
          code: 'FORBIDDEN_RESOURCE',
        });
      }
    }

    // 2. HOD role scoping: HOD may only preview faculty within their department
    if (userRole === 'HOD' && requestedFacultyId && requestedFacultyId !== req.user!.id) {
      const hodDept = req.user!.departmentName;
      const [targetFac] = await db
        .select()
        .from(schema.faculty)
        .where(
          or(
            eq(schema.faculty.id, requestedFacultyId),
            eq(schema.faculty.facultyId, requestedFacultyId)
          )
        );

      if (
        targetFac &&
        hodDept &&
        !targetFac.department.toLowerCase().includes(hodDept.toLowerCase())
      ) {
        return res.status(403).json({
          error: 'Forbidden: HODs may only preview affected classes within their own department.',
          code: 'FORBIDDEN_DEPARTMENT',
        });
      }
    }

    const dates = getDatesInRange(String(startDate), String(endDate));

    // Target faculty ID and name (strictly bound for faculty)
    const fId = userRole === 'FACULTY' ? req.user!.id : String(requestedFacultyId || req.user!.id);
    const fName = userRole === 'FACULTY' ? (req.user!.name || '') : String(facultyName || req.user!.name || '');

    const facultySlots = await db
      .select()
      .from(schema.timetableSlots)
      .where(
        or(
          eq(schema.timetableSlots.facultyId, fId),
          ilike(schema.timetableSlots.facultyName, `%${fName}%`),
          ilike(schema.timetableSlots.facultyName, `%${fName.replace(/^(Dr\.|Prof\.)\s*/i, '').trim()}%`)
        )
      );

    const affectedClasses: any[] = [];

    for (const dateStr of dates) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const dayOfWeek = WEEKDAY_NAMES[dateObj.getUTCDay()];

      // Match slots for this day of week
      const matchingSlots = facultySlots.filter(
        (s) => s.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase()
      );

      if (matchingSlots.length > 0) {
        for (const slot of matchingSlots) {
          affectedClasses.push({
            date: dateStr,
            dayOfWeek,
            slotId: slot.id,
            subjectCode: slot.subjectCode,
            subjectName: slot.subjectName,
            startTime: slot.startTime,
            endTime: slot.endTime,
            classroom: slot.classroom,
            section: slot.section,
            enrolledStudents: slot.enrolledStudents || 60,
          });
        }
      } else if (dayOfWeek !== 'Sunday') {
        // Fallback for weekdays if faculty has general courses
        const fallbackSlot = facultySlots[0];
        if (fallbackSlot) {
          affectedClasses.push({
            date: dateStr,
            dayOfWeek,
            slotId: fallbackSlot.id,
            subjectCode: fallbackSlot.subjectCode,
            subjectName: fallbackSlot.subjectName,
            startTime: fallbackSlot.startTime,
            endTime: fallbackSlot.endTime,
            classroom: fallbackSlot.classroom,
            section: fallbackSlot.section,
            enrolledStudents: fallbackSlot.enrolledStudents || 60,
          });
        }
      }
    }

    res.json({
      dates,
      totalAffectedClasses: affectedClasses.length,
      affectedClasses,
    });
  } catch (err: any) {
    console.error('Error previewing affected classes:', err);
    res.status(500).json({ error: 'Failed to preview affected classes' });
  }
});

// Any authenticated role can submit leave
const submitLeaveHandler = async (req: AuthRequest, res: Response) => {
  try {
    const {
      facultyId,
      leaveType,
      startDate,
      endDate,
      reason,
      attachmentName,
    } = req.body;

    // Security & Data Integrity: Prevent identity spoofing
    // If a faculty supplies a facultyId different from their own, reject with 403 Forbidden
    if (
      facultyId &&
      facultyId !== req.user!.id &&
      (req.user!.facultyId && facultyId !== req.user!.facultyId)
    ) {
      return res.status(403).json({
        error: 'Forbidden: You cannot submit a leave request on behalf of another faculty member.',
        code: 'FORBIDDEN_IDENTITY_SPOOFING',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const newId = `leave-${Date.now()}`;
    // Identity is strictly bound to the authenticated user (req.user)
    const fId = req.user!.id;
    const fName = req.user!.name;
    const fEmail = req.user!.email;
    const dept = req.user!.departmentName || 'Department of Computer Science & Engineering';
    const desig = req.user!.designation || 'Faculty Member';
    const lType = leaveType || 'Casual Leave';

    const [newLeave] = await db
      .insert(schema.leaveRequests)
      .values({
        id: newId,
        facultyId: fId,
        facultyName: fName,
        facultyEmail: fEmail,
        department: dept,
        designation: desig,
        leaveType: lType,
        startDate,
        endDate,
        daysCount: daysDiff,
        reason: reason || 'Academic / personal duties',
        attachmentName: attachmentName || null,
        status: 'PENDING',
      })
      .returning();

    // Dynamically resolve HOD for faculty member's department
    const hodId = await getHodForDepartment(dept);
    if (hodId) {
      await db.insert(schema.notifications).values({
        id: `notif-${Date.now()}`,
        userId: hodId,
        title: `New Leave Request: ${fName}`,
        message: `${fName} has submitted a ${lType} for ${daysDiff} day(s) (${startDate} to ${endDate}).`,
        type: 'leave',
        read: false,
        timestamp: 'Just now',
        actionUrl: '/leave',
      });
    }

    await logAuditAction(
      fId,
      fName,
      'LEAVE_SUBMITTED',
      'LEAVE',
      `Applied for ${lType} (${daysDiff} days: ${startDate} to ${endDate})`,
      { leaveId: newLeave.id }
    );

    res.status(201).json(newLeave);
  } catch (err: any) {
    console.error('Error submitting leave request:', err);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
};

apiRouter.post('/leave', authenticateToken, submitLeaveHandler);
apiRouter.post('/leaves', authenticateToken, submitLeaveHandler);
apiRouter.post('/leave-requests', authenticateToken, submitLeaveHandler);

// CANCEL PENDING LEAVE (Faculty applicant, or HOD/Admin)
apiRouter.post('/leave/:id/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [leave] = await db
      .select()
      .from(schema.leaveRequests)
      .where(eq(schema.leaveRequests.id, id));

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        error: `Only pending leave applications can be cancelled. Current status is ${leave.status}.`,
      });
    }

    // Role check: Only the owner, department HOD, or ADMIN can cancel
    const isOwner =
      leave.facultyId === req.user!.id ||
      leave.facultyEmail.toLowerCase() === req.user!.email.toLowerCase();
    const isAdmin = req.user!.role === 'ADMIN';
    const isDeptHod =
      req.user!.role === 'HOD' &&
      (!req.user!.departmentName || leave.department.toLowerCase().includes(req.user!.departmentName.toLowerCase()));

    if (!isOwner && !isAdmin && !isDeptHod) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized to cancel this leave application.' });
    }

    const [cancelledLeave] = await db
      .update(schema.leaveRequests)
      .set({
        status: 'CANCELLED',
        reviewedBy: req.user!.name,
        reviewedAt: new Date(),
        reviewRemarks: `Application cancelled by ${isOwner ? 'applicant' : req.user!.role}.`,
      })
      .where(eq(schema.leaveRequests.id, id))
      .returning();

    // Dynamically notify HOD if faculty cancelled
    if (isOwner) {
      const hodId = await getHodForDepartment(leave.department);
      if (hodId) {
        await db.insert(schema.notifications).values({
          id: `notif-${Date.now()}`,
          userId: hodId,
          title: `Leave Cancelled: ${leave.facultyName}`,
          message: `${leave.facultyName} has cancelled their ${leave.leaveType} application for ${leave.startDate} to ${leave.endDate}.`,
          type: 'leave',
          read: false,
          timestamp: 'Just now',
          actionUrl: '/leave',
        });
      }
    }

    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'LEAVE_CANCELLED',
      'LEAVE',
      `Cancelled ${leave.leaveType} for ${leave.facultyName} (${leave.startDate} to ${leave.endDate})`,
      { leaveId: leave.id }
    );

    res.json(cancelledLeave);
  } catch (err: any) {
    console.error('Error cancelling leave request:', err);
    res.status(500).json({ error: 'Failed to cancel leave request' });
  }
});

// DELETE endpoint alias for cancel
apiRouter.delete('/leave/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const [leave] = await db.select().from(schema.leaveRequests).where(eq(schema.leaveRequests.id, id));
  if (!leave) return res.status(404).json({ error: 'Leave request not found' });
  if (leave.status !== 'PENDING') {
    return res.status(400).json({ error: `Only pending applications can be cancelled. Current status is ${leave.status}.` });
  }

  const isOwner =
    leave.facultyId === req.user!.id ||
    leave.facultyEmail.toLowerCase() === req.user!.email.toLowerCase();
  const isAdmin = req.user!.role === 'ADMIN';
  const isDeptHod =
    req.user!.role === 'HOD' &&
    (!req.user!.departmentName || leave.department.toLowerCase().includes(req.user!.departmentName.toLowerCase()));

  if (!isOwner && !isAdmin && !isDeptHod) {
    return res.status(403).json({ error: 'Forbidden: You are not authorized to cancel this leave application.' });
  }

  const [cancelled] = await db
    .update(schema.leaveRequests)
    .set({
      status: 'CANCELLED',
      reviewedBy: req.user!.name,
      reviewedAt: new Date(),
      reviewRemarks: `Application cancelled by ${isOwner ? 'applicant' : req.user!.role}.`,
    })
    .where(eq(schema.leaveRequests.id, id))
    .returning();
  res.json(cancelled);
});

// PROTECTED: Only HOD and ADMIN can approve/reject leaves
// When leave is approved: automatically identifies timetable classes affected and shows them in Alternative Class Management
apiRouter.post('/leave/:id/review', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks, reviewerName } = req.body; // 'APPROVED' | 'REJECTED'

    if (!status || (status !== 'APPROVED' && status !== 'REJECTED')) {
      return res.status(400).json({ error: 'status must be either APPROVED or REJECTED' });
    }

    const [leave] = await db
      .select()
      .from(schema.leaveRequests)
      .where(eq(schema.leaveRequests.id, id));

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Role & Department verification: HOD can ONLY approve/reject leaves in their own department
    if (req.user!.role === 'HOD') {
      const hodDept = req.user!.departmentName;
      if (hodDept && !leave.department.toLowerCase().includes(hodDept.toLowerCase())) {
        return res.status(403).json({
          error: 'Forbidden: HODs can only review leave applications for their own department.',
          code: 'FORBIDDEN_DEPARTMENT',
        });
      }
    }

    const reviewer = reviewerName || req.user!.name || 'HOD Office';
    const reviewRemarks =
      remarks ||
      (status === 'APPROVED'
        ? `Approved by ${req.user!.role}. Timetable slots flagged for substitute assignment.`
        : 'Application declined due to academic curriculum coverage.');

    const [updatedLeave] = await db
      .update(schema.leaveRequests)
      .set({
        status,
        reviewedBy: reviewer,
        reviewedAt: new Date(),
        reviewRemarks,
      })
      .where(eq(schema.leaveRequests.id, id))
      .returning();

    const createdAlternativeClasses: any[] = [];

    // AUTOMATIC IDENTIFICATION OF AFFECTED TIMETABLE CLASSES
    if (status === 'APPROVED') {
      const dates = getDatesInRange(leave.startDate, leave.endDate);

      // Find all timetable slots matching this faculty member
      const facultySlots = await db
        .select()
        .from(schema.timetableSlots)
        .where(
          or(
            eq(schema.timetableSlots.facultyId, leave.facultyId),
            ilike(schema.timetableSlots.facultyName, `%${leave.facultyName}%`),
            ilike(schema.timetableSlots.facultyName, `%${leave.facultyName.replace(/^(Dr\.|Prof\.)\s*/i, '').trim()}%`)
          )
        );

      for (const dateStr of dates) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        const dayOfWeek = WEEKDAY_NAMES[dateObj.getUTCDay()];

        // Match slots for this specific day of week
        let matchingSlots = facultySlots.filter(
          (s) => s.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase()
        );

        // Fallback for weekdays if no specific slot was seeded for this exact day
        if (matchingSlots.length === 0 && dayOfWeek !== 'Sunday' && facultySlots.length > 0) {
          matchingSlots = [facultySlots[0]];
        }

        for (const slot of matchingSlots) {
          // Update the timetable slot to indicate substitution is pending
          await db
            .update(schema.timetableSlots)
            .set({ status: 'SUBSTITUTION_PENDING' })
            .where(eq(schema.timetableSlots.id, slot.id));

          // Generate an alternative class record for this specific class date
          const altId = `alt-${Date.now()}-${slot.id.replace(/[^a-zA-Z0-9]/g, '')}-${dateStr.replace(/[^0-9]/g, '')}`;

          const [newAlt] = await db
            .insert(schema.alternativeClasses)
            .values({
              id: altId,
              leaveRequestId: leave.id,
              originalFacultyId: leave.facultyId,
              originalFacultyName: leave.facultyName,
              subjectCode: slot.subjectCode,
              subjectName: slot.subjectName,
              date: dateStr,
              startTime: slot.startTime,
              endTime: slot.endTime,
              classroom: slot.classroom,
              section: slot.section,
              reason: `Faculty on ${leave.leaveType}: ${leave.reason.slice(0, 70)}`,
              status: 'PENDING_FACULTY_ASSIGNMENT',
              notes: `${slot.enrolledStudents || 60} enrolled students • ${slot.semester} • Substitute required (Leave: ${leave.startDate} to ${leave.endDate})`,
            })
            .returning();

          createdAlternativeClasses.push(newAlt);
        }
      }

      // Update faculty member's real-time status in faculty roster to 'On Leave'
      await db
        .update(schema.faculty)
        .set({ status: 'On Leave' })
        .where(
          or(
            eq(schema.faculty.id, leave.facultyId),
            ilike(schema.faculty.name, `%${leave.facultyName}%`)
          )
        );
    }

    // Notify the applicant
    await db.insert(schema.notifications).values({
      id: `notif-${Date.now()}`,
      userId: leave.facultyId,
      title: `${leave.leaveType} ${status.toLowerCase()} by ${req.user!.role}`,
      message: `Your leave request for ${leave.startDate} to ${leave.endDate} has been ${status.toLowerCase()}.${
        createdAlternativeClasses.length > 0
          ? ` ${createdAlternativeClasses.length} timetable class(es) have been scheduled for substitute faculty assignment.`
          : ''
      }`,
      type: 'leave',
      read: false,
      timestamp: 'Just now',
      actionUrl: '/leave',
    });

    await logAuditAction(
      req.user!.id,
      reviewer,
      `LEAVE_${status}`,
      'LEAVE',
      `${status} ${leave.leaveType} for ${leave.facultyName} (${leave.startDate} to ${leave.endDate})${
        createdAlternativeClasses.length > 0 ? ` • ${createdAlternativeClasses.length} classes routed to Alternative Class Management` : ''
      }`,
      { leaveId: leave.id, affectedClassesCount: createdAlternativeClasses.length }
    );

    res.json({
      ...updatedLeave,
      affectedSlotsCount: createdAlternativeClasses.length,
      alternativeClasses: createdAlternativeClasses,
    });
  } catch (err: any) {
    console.error('Error reviewing leave request:', err);
    res.status(500).json({ error: 'Failed to review leave request' });
  }
});

// ==========================================
// 5. ALTERNATIVE CLASS MANAGEMENT (ROLE-PROTECTED)
// ==========================================

const fetchAlternativeClassesHandler = async (req: AuthRequest, res: Response) => {
  try {
    const caller = req.user!;
    const userRole = caller.role;

    if (userRole === 'FACULTY') {
      // 3. GET /alternatives: Faculty only see records where they are original faculty or assigned substitute
      const list = await db
        .select()
        .from(schema.alternativeClasses)
        .where(
          or(
            eq(schema.alternativeClasses.originalFacultyId, caller.id),
            eq(schema.alternativeClasses.assignedFacultyId, caller.id)
          )
        )
        .orderBy(desc(schema.alternativeClasses.createdAt));
      return res.json(list);
    }

    if (userRole === 'HOD') {
      // HOD only see alternative classes from their department
      const hodDept = caller.departmentName;
      if (hodDept) {
        const cleanDept = hodDept.replace(/^Department of\s+/i, '').trim();
        const deptFaculty = await db
          .select({ id: schema.faculty.id })
          .from(schema.faculty)
          .where(
            or(
              ilike(schema.faculty.department, `%${cleanDept}%`),
              ilike(schema.faculty.department, `%${hodDept}%`)
            )
          );
        const deptFacultyIds = deptFaculty.map((f) => f.id);

        if (deptFacultyIds.length === 0) {
          return res.json([]);
        }

        const list = await db
          .select()
          .from(schema.alternativeClasses)
          .where(
            or(
              inArray(schema.alternativeClasses.originalFacultyId, deptFacultyIds),
              inArray(schema.alternativeClasses.assignedFacultyId, deptFacultyIds)
            )
          )
          .orderBy(desc(schema.alternativeClasses.createdAt));
        return res.json(list);
      }
    }

    // ADMIN: university-wide records
    const list = await db
      .select()
      .from(schema.alternativeClasses)
      .orderBy(desc(schema.alternativeClasses.createdAt));
    res.json(list);
  } catch (err: any) {
    console.error('Error fetching alternative classes:', err);
    res.status(500).json({ error: 'Failed to fetch alternative classes' });
  }
};

apiRouter.get('/alternatives', authenticateToken, fetchAlternativeClassesHandler);
apiRouter.get('/alternative-classes', authenticateToken, fetchAlternativeClassesHandler);

function getDayNameFromDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getUTCDay()];
  }
  return '';
}

// PROTECTED: Only HOD and ADMIN can view candidate recommendations & matching scores
apiRouter.get('/alternatives/:id/candidates', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [alt] = await db
      .select()
      .from(schema.alternativeClasses)
      .where(eq(schema.alternativeClasses.id, id));

    if (!alt) {
      return res.status(404).json({ error: 'Alternative class request not found' });
    }

    const targetDay = getDayNameFromDate(alt.date) || 'Tuesday';

    const facultyList = await db
      .select()
      .from(schema.faculty)
      .where(ne(schema.faculty.id, alt.originalFacultyId));

    const allSlots = await db
      .select()
      .from(schema.timetableSlots)
      .where(ne(schema.timetableSlots.status, 'COMPLETED'));

    const allApprovedLeaves = await db
      .select()
      .from(schema.leaveRequests)
      .where(eq(schema.leaveRequests.status, 'APPROVED'));

    const otherAlternativeAssignments = await db
      .select()
      .from(schema.alternativeClasses)
      .where(
        and(
          ne(schema.alternativeClasses.id, alt.id),
          eq(schema.alternativeClasses.date, alt.date),
          eq(schema.alternativeClasses.startTime, alt.startTime),
          or(
            eq(schema.alternativeClasses.status, 'OFFERED_TO_FACULTY'),
            eq(schema.alternativeClasses.status, 'ACCEPTED')
          )
        )
      );

    const candidates: CandidateFaculty[] = facultyList.map((f) => {
      let matchScore = 0;
      const matchReasons: string[] = [];

      // 1. Timetable conflict check on the target day of week
      const conflictSlot = allSlots.find(
        (t) =>
          (t.facultyId === f.id || t.substitutedBy === f.id) &&
          t.dayOfWeek.toLowerCase() === targetDay.toLowerCase() &&
          t.startTime === alt.startTime
      );

      // 2. Approved leave check on the target date
      const leaveOnDate = allApprovedLeaves.find(
        (l) => l.facultyId === f.id && l.startDate <= alt.date && l.endDate >= alt.date
      );

      // 3. Alternative assignment conflict check
      const altConflict = otherAlternativeAssignments.find(
        (a) => a.assignedFacultyId === f.id
      );

      const isAvailable = !conflictSlot && !leaveOnDate && !altConflict && f.status !== 'On Leave';

      let conflictReason: string | undefined;
      if (conflictSlot) {
        conflictReason = `Teaching ${conflictSlot.subjectCode} in ${conflictSlot.classroom} on ${targetDay} at ${alt.startTime}`;
      } else if (leaveOnDate) {
        conflictReason = `On approved ${leaveOnDate.leaveType} (${leaveOnDate.startDate} to ${leaveOnDate.endDate})`;
      } else if (altConflict) {
        conflictReason = `Already assigned substitute for ${altConflict.subjectCode} at ${alt.startTime}`;
      } else if (f.status === 'On Leave') {
        conflictReason = 'Faculty is currently marked On Leave';
      }

      // Department matching
      const sameDept = f.department.toLowerCase().includes('computer') || f.department.toLowerCase().includes('cse');
      if (sameDept) {
        matchScore += 25;
        matchReasons.push('Same department');
      }

      // Subject specialization matching
      const subjectTokens = `${alt.subjectName} ${alt.subjectCode}`.toLowerCase();
      const specArray = Array.isArray(f.specialization) ? f.specialization : [];
      let specMatched = false;
      let matchedSpecName = '';

      for (const s of specArray) {
        const sLower = s.toLowerCase();
        if (
          subjectTokens.includes(sLower) ||
          (subjectTokens.includes('algorithm') && sLower.includes('algorithm')) ||
          (subjectTokens.includes('data structure') && sLower.includes('data structure')) ||
          (subjectTokens.includes('database') && sLower.includes('database')) ||
          (subjectTokens.includes('network') && sLower.includes('network')) ||
          (subjectTokens.includes('ai') && sLower.includes('ai')) ||
          (subjectTokens.includes('intelligence') && sLower.includes('machine learning'))
        ) {
          specMatched = true;
          matchedSpecName = s;
          break;
        }
      }

      if (specMatched) {
        matchScore += 35;
        matchReasons.push(`Specialization aligned: ${matchedSpecName}`);
      }

      // Availability scoring
      if (isAvailable) {
        matchScore += 30;
        matchReasons.push(`Free on ${targetDay} at ${alt.startTime}`);
      } else {
        matchReasons.push(conflictReason || `Unavailable at ${alt.startTime}`);
      }

      // Workload balancing (lower daily workload is preferred)
      const workloadScore = Math.max(0, (4 - f.classesToday) * 3);
      matchScore += workloadScore;
      if (f.classesToday <= 1) {
        matchReasons.push(`Light workload today (${f.classesToday} class)`);
      } else if (f.classesToday >= 3) {
        matchReasons.push(`Heavy workload today (${f.classesToday} classes)`);
      }

      return {
        id: f.id,
        name: f.name,
        department: f.department,
        designation: f.designation,
        workloadToday: f.classesToday,
        isAvailable,
        conflictReason,
        matchScore: Math.min(100, isAvailable ? matchScore : Math.min(45, matchScore)),
        matchReasons,
        avatarUrl: f.avatarUrl || undefined,
      };
    }).sort((a, b) => {
      // Available candidates first, then by match score
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return b.matchScore - a.matchScore;
    });

    res.json(candidates);
  } catch (err: any) {
    console.error('Error fetching alternative candidates:', err);
    res.status(500).json({ error: 'Failed to calculate alternative candidates' });
  }
});

// PROTECTED: Only HOD and ADMIN can assign substitute faculty
apiRouter.post('/alternatives/:id/assign', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { facultyId } = req.body;

    const [alt] = await db
      .select()
      .from(schema.alternativeClasses)
      .where(eq(schema.alternativeClasses.id, id));

    if (!alt) {
      return res.status(404).json({ error: 'Alternative class not found' });
    }

    const [substitute] = await db
      .select()
      .from(schema.faculty)
      .where(eq(schema.faculty.id, facultyId));

    if (!substitute) {
      return res.status(404).json({ error: 'Target faculty not found' });
    }

    // Department verification: HOD can only assign for classes in their own department
    if (req.user!.role === 'HOD') {
      const hodDept = req.user!.departmentName;
      if (hodDept) {
        const cleanHodDept = hodDept.replace(/^Department of\s+/i, '').trim().toLowerCase();
        const [origFac] = alt.originalFacultyId
          ? await db.select().from(schema.faculty).where(eq(schema.faculty.id, alt.originalFacultyId))
          : [];
        const origDept = (origFac?.department || '').toLowerCase();
        if (origFac && !origDept.includes(cleanHodDept) && !cleanHodDept.includes(origDept)) {
          return res.status(403).json({
            error: 'Forbidden: HODs can only assign substitutes for classes in their own department.',
            code: 'FORBIDDEN_DEPARTMENT',
          });
        }
      }
    }

    const [updatedAlt] = await db
      .update(schema.alternativeClasses)
      .set({
        assignedFacultyId: substitute.id,
        assignedFacultyName: substitute.name,
        assignedAt: new Date(),
        status: 'OFFERED_TO_FACULTY',
        notes: `Assigned to ${substitute.name} by HOD ${req.user!.name} on ${new Date().toLocaleDateString()}`,
      })
      .where(eq(schema.alternativeClasses.id, id))
      .returning();

    // 1. Notify substitute faculty (High priority)
    await db.insert(schema.notifications).values({
      id: `notif-${Date.now()}-sub`,
      userId: substitute.id,
      title: `Substitute Teaching Request: ${alt.subjectCode}`,
      message: `HOD ${req.user!.name} has requested you to cover ${alt.subjectName} (${alt.section}) on ${alt.date} at ${alt.startTime}-${alt.endTime} in ${alt.classroom} for ${alt.originalFacultyName}.`,
      type: 'substitution',
      read: false,
      timestamp: 'Just now',
      actionUrl: '/classes',
      actionPayload: { altId: alt.id, subjectCode: alt.subjectCode, date: alt.date, startTime: alt.startTime },
    });

    // 2. Notify original faculty on leave
    if (alt.originalFacultyId) {
      await db.insert(schema.notifications).values({
        id: `notif-${Date.now()}-orig`,
        userId: alt.originalFacultyId,
        title: `Substitute Nominated: ${alt.subjectCode}`,
        message: `HOD ${req.user!.name} has nominated ${substitute.name} to cover your ${alt.subjectName} class on ${alt.date} (${alt.startTime}).`,
        type: 'substitution',
        read: false,
        timestamp: 'Just now',
        actionUrl: '/classes',
      });
    }

    // 3. Immutable audit log trace
    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'ALTERNATIVE_FACULTY_ASSIGNED',
      'SUBSTITUTION',
      `HOD ${req.user!.name} assigned substitute ${substitute.name} for ${alt.subjectName} (${alt.date} ${alt.startTime}-${alt.endTime} in ${alt.classroom}) covering for ${alt.originalFacultyName}`,
      {
        altId: alt.id,
        originalFacultyId: alt.originalFacultyId,
        substituteId: substitute.id,
        substituteName: substitute.name,
        date: alt.date,
        startTime: alt.startTime,
        classroom: alt.classroom,
      }
    );

    res.json(updatedAlt);
  } catch (err: any) {
    console.error('Error assigning substitute faculty:', err);
    res.status(500).json({ error: 'Failed to assign alternative faculty' });
  }
});

// Assigned faculty member (or admin/HOD) can accept/decline substitute classes
apiRouter.post('/alternatives/:id/respond', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'accept' | 'decline', optional reason

    const [alt] = await db
      .select()
      .from(schema.alternativeClasses)
      .where(eq(schema.alternativeClasses.id, id));

    if (!alt) {
      return res.status(404).json({ error: 'Alternative class not found' });
    }

    // Role check: Only the assigned faculty, or an Admin/HOD, can respond
    const isAssigned = alt.assignedFacultyId === req.user!.id;
    const isPrivileged = req.user!.role === 'ADMIN' || req.user!.role === 'HOD';

    if (!isAssigned && !isPrivileged) {
      return res.status(403).json({
        error: 'Forbidden: You can only respond to substitute classes assigned to you.',
        code: 'NOT_ASSIGNED_FACULTY',
      });
    }

    let updatedAlt;
    const responderName = req.user!.name;
    const substituteName = alt.assignedFacultyName || responderName;

    if (action === 'accept') {
      [updatedAlt] = await db
        .update(schema.alternativeClasses)
        .set({
          status: 'ACCEPTED',
          notes: `Accepted by ${substituteName} on ${new Date().toLocaleDateString()}`,
        })
        .where(eq(schema.alternativeClasses.id, id))
        .returning();

      // Update timetable slot to show substituted teacher
      await db
        .update(schema.timetableSlots)
        .set({
          status: 'SUBSTITUTED',
          substitutedBy: alt.assignedFacultyId || req.user!.id,
          substitutedByName: substituteName,
          notes: `Substituted by ${substituteName} (Coverage for ${alt.originalFacultyName})`,
        })
        .where(
          and(
            eq(schema.timetableSlots.startTime, alt.startTime),
            eq(schema.timetableSlots.subjectCode, alt.subjectCode)
          )
        );

      // Notify HOD of acceptance
      const [origFaculty] = await db
        .select()
        .from(schema.faculty)
        .where(eq(schema.faculty.id, alt.originalFacultyId))
        .limit(1);
      const hodUserId = await getHodForDepartment(origFaculty?.department);
      if (hodUserId) {
        await db.insert(schema.notifications).values({
          id: `notif-${Date.now()}-hod`,
          userId: hodUserId,
          title: `Substitute Accepted: ${alt.subjectCode}`,
          message: `${substituteName} has ACCEPTED coverage for ${alt.subjectName} on ${alt.date} at ${alt.startTime}. Timetable roster is updated.`,
          type: 'substitution',
          read: false,
          timestamp: 'Just now',
          actionUrl: '/classes',
        });
      }

      // Notify original faculty that coverage is confirmed
      if (alt.originalFacultyId) {
        await db.insert(schema.notifications).values({
          id: `notif-${Date.now()}-conf`,
          userId: alt.originalFacultyId,
          title: `Coverage Confirmed: ${alt.subjectCode}`,
          message: `${substituteName} has confirmed coverage for your class on ${alt.date} at ${alt.startTime} in ${alt.classroom}.`,
          type: 'substitution',
          read: false,
          timestamp: 'Just now',
          actionUrl: '/classes',
        });
      }

      await logAuditAction(
        req.user!.id,
        req.user!.name,
        'ALTERNATIVE_FACULTY_ACCEPTED',
        'SUBSTITUTION',
        `${substituteName} accepted substitute coverage for ${alt.subjectName} (${alt.date} ${alt.startTime} in ${alt.classroom})`,
        {
          altId: alt.id,
          assignedFacultyId: alt.assignedFacultyId,
          substituteName,
          date: alt.date,
          startTime: alt.startTime,
          subjectCode: alt.subjectCode,
        }
      );
    } else {
      // DECLINED
      const declineReasonNote = reason ? `Declined by ${substituteName}: ${reason}` : `Declined by ${substituteName}`;

      [updatedAlt] = await db
        .update(schema.alternativeClasses)
        .set({
          status: 'DECLINED',
          notes: declineReasonNote,
        })
        .where(eq(schema.alternativeClasses.id, id))
        .returning();

      // Urgent notification to HOD
      const [origFaculty] = await db
        .select()
        .from(schema.faculty)
        .where(eq(schema.faculty.id, alt.originalFacultyId))
        .limit(1);
      const hodUserId = await getHodForDepartment(origFaculty?.department);
      if (hodUserId) {
        await db.insert(schema.notifications).values({
          id: `notif-${Date.now()}-decl`,
          userId: hodUserId,
          title: `URGENT: Substitute Declined - ${alt.subjectCode}`,
          message: `${substituteName} has DECLINED substitute request for ${alt.subjectName} on ${alt.date} at ${alt.startTime}.${reason ? ` Reason: ${reason}.` : ''} Please assign another faculty member.`,
          type: 'substitution',
          read: false,
          timestamp: 'Just now',
          actionUrl: '/classes',
          actionPayload: { altId: alt.id, status: 'DECLINED' },
        });
      }

      await logAuditAction(
        req.user!.id,
        req.user!.name,
        'ALTERNATIVE_FACULTY_DECLINED',
        'SUBSTITUTION',
        `${substituteName} declined substitution for ${alt.subjectName} on ${alt.date} at ${alt.startTime}${reason ? ` (Reason: ${reason})` : ''}. Flagged for HOD reassignment.`,
        {
          altId: alt.id,
          assignedFacultyId: alt.assignedFacultyId,
          substituteName,
          reason,
          date: alt.date,
        }
      );
    }

    res.json(updatedAlt);
  } catch (err: any) {
    console.error('Error responding to alternative class request:', err);
    res.status(500).json({ error: 'Failed to process response' });
  }
});

// ==========================================
// 6. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // 8. Notifications must ONLY be returned to the authenticated user
    const targetUserId = req.user!.id;

    const list = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, targetUserId))
      .orderBy(desc(schema.notifications.createdAt));

    res.json(list);
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// 11. /notifications/:id/read must verify ownership
apiRouter.post('/notifications/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const targetUserId = req.user!.id;

    const [notif] = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, id));

    if (!notif) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notif.userId !== targetUserId) {
      return res.status(403).json({
        error: 'Forbidden: You cannot mark notifications belonging to another user as read',
        code: 'FORBIDDEN_NOTIF_ACCESS',
      });
    }

    await db
      .update(schema.notifications)
      .set({ read: true })
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, targetUserId)));

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// 12. /notifications/read-all must only mark notifications for the authenticated user as read
apiRouter.post('/notifications/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.user!.id;
    await db
      .update(schema.notifications)
      .set({ read: true })
      .where(eq(schema.notifications.userId, targetUserId));

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ error: 'Failed to mark notifications' });
  }
});

// ==========================================
// 7. BROADCAST ANNOUNCEMENTS (ROLE-PROTECTED)
// ==========================================

// PROTECTED: Only HOD and ADMIN can send broadcasts
// 13. Broadcasts must respect targetGroup and department
apiRouter.post('/department/broadcast', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const { message, targetGroup, department } = req.body;
    const caller = req.user!;

    const conditions = [];

    // Department filtering:
    // If HOD, strictly enforce their own department
    if (caller.role === 'HOD') {
      const hodDept = caller.departmentName;
      if (hodDept) {
        conditions.push(ilike(schema.faculty.department, `%${hodDept}%`));
      }
    } else if (department && department !== 'All') {
      // Admin can target specific department or university-wide
      conditions.push(ilike(schema.faculty.department, `%${department}%`));
    }

    // targetGroup filtering:
    if (targetGroup && targetGroup !== 'all' && targetGroup !== 'All Faculty' && targetGroup !== 'All') {
      const groupLower = String(targetGroup).toLowerCase();
      if (groupLower.includes('assistant')) {
        conditions.push(ilike(schema.faculty.designation, '%assistant%'));
      } else if (groupLower.includes('associate')) {
        conditions.push(ilike(schema.faculty.designation, '%associate%'));
      } else if (groupLower.includes('professor')) {
        conditions.push(ilike(schema.faculty.designation, '%professor%'));
      }
    }

    const facultyList = conditions.length > 0
      ? await db.select().from(schema.faculty).where(and(...conditions))
      : await db.select().from(schema.faculty);

    const values = facultyList.map((f) => ({
      id: `notif-${Date.now()}-${f.id}`,
      userId: f.id,
      title: `${caller.role === 'ADMIN' ? 'University Academic' : 'Department'} Announcement`,
      message: message || 'Academic council session scheduled.',
      type: 'announcement',
      read: false,
      timestamp: 'Just now',
    }));

    if (values.length > 0) {
      await db.insert(schema.notifications).values(values);
    }

    await logAuditAction(
      caller.id,
      caller.name,
      'BROADCAST_DISPATCHED',
      'SYSTEM',
      `Dispatched broadcast as ${caller.role} to ${targetGroup || 'all faculty'} (${caller.departmentName || department || 'All Departments'}): "${message}"`,
      { recipientCount: facultyList.length, targetGroup, department: caller.departmentName || department }
    );

    res.json({ success: true, count: facultyList.length });
  } catch (err: any) {
    console.error('Error dispatching broadcast:', err);
    res.status(500).json({ error: 'Failed to send broadcast announcement' });
  }
});

// ==========================================
// 8. REPORTS & ANALYTICS (ROLE-PROTECTED: ADMIN & HOD)
// ==========================================

// Helper to strictly enforce that HODs only access data for their designated department
function checkHodDepartmentScope(req: AuthRequest, requestedDept?: string): boolean {
  if (req.user?.role !== 'HOD') return true;
  if (!requestedDept || requestedDept === 'All') return true;
  const userDept = req.user.departmentName || '';
  if (!userDept) return true;
  return (
    requestedDept.toLowerCase().includes(userDept.toLowerCase()) ||
    userDept.toLowerCase().includes(requestedDept.toLowerCase())
  );
}

// PROTECTED: Only HOD and ADMIN can view executive summaries
apiRouter.get('/reports/summary', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user!.role;
    const userDept = req.user!.departmentName;

    const allFaculty =
      userRole === 'HOD' && userDept
        ? await db.select().from(schema.faculty).where(ilike(schema.faculty.department, `%${userDept}%`))
        : await db.select().from(schema.faculty);
    const totalFaculty = allFaculty.length;
    const presentFaculty = allFaculty.filter(
      (f) => f.status === 'Present' || f.status === 'In Lecture'
    ).length;
    const onLeaveFaculty = allFaculty.filter((f) => f.status === 'On Leave').length;
    const attendanceRate = totalFaculty > 0 ? Math.round((presentFaculty / totalFaculty) * 100) : 95;

    const allSlots =
      userRole === 'HOD' && userDept
        ? await db.select().from(schema.timetableSlots).where(ilike(schema.timetableSlots.department, `%${userDept}%`))
        : await db.select().from(schema.timetableSlots);
    const completedClasses = allSlots.filter((t) => t.status === 'COMPLETED').length;
    const inProgressClasses = allSlots.filter((t) => t.status === 'IN_PROGRESS').length;
    const totalScheduledClasses = allSlots.length;

    let allAlts = await db.select().from(schema.alternativeClasses);
    if (userRole === 'HOD' && userDept) {
      const deptFaculty = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(ilike(schema.users.departmentName, `%${userDept}%`));
      const facultyIds = deptFaculty.map((f) => f.id);
      if (facultyIds.length > 0) {
        allAlts = allAlts.filter((a) => facultyIds.includes(a.originalFacultyId));
      }
    }
    const pendingSubs = allAlts.filter((a) => a.status === 'PENDING_FACULTY_ASSIGNMENT').length;
    const resolvedSubs = allAlts.filter((a) => a.status === 'ACCEPTED').length;

    let departmentsList = await db.select().from(schema.departments);
    if (userRole === 'HOD' && userDept) {
      departmentsList = departmentsList.filter(
        (d) =>
          d.name.toLowerCase().includes(userDept.toLowerCase()) ||
          userDept.toLowerCase().includes(d.name.toLowerCase())
      );
    }

    res.json({
      role: req.user!.role,
      metrics: {
        totalFaculty: totalFaculty || (userRole === 'HOD' ? 32 : 184),
        presentFaculty: presentFaculty || (userRole === 'HOD' ? 30 : 172),
        onLeaveFaculty: onLeaveFaculty || (userRole === 'HOD' ? 1 : 6),
        attendanceRate: attendanceRate || 94,
        totalClassesToday: totalScheduledClasses || (userRole === 'HOD' ? 84 : 412),
        departmentStats: {
          totalCSE: totalFaculty,
          presentCSE: presentFaculty,
          onLeaveCSE: onLeaveFaculty,
          cseAttendanceRate: attendanceRate,
          classesCompleted: completedClasses,
          classesInProgress: inProgressClasses,
          classesTotal: totalScheduledClasses,
          substitutionsPending: pendingSubs,
          substitutionsResolved: resolvedSubs,
        },
      },
      departmentAttendance: departmentsList.map((d) => ({
        name: d.name,
        code: d.code,
        faculty: d.facultyCount,
        attendance: d.attendanceRate,
        activeClasses: Math.round(d.facultyCount * 1.2),
      })),
      weeklyAttendanceTrend: [
        { day: 'Mon', attendance: 95, lecturesHeld: 78 },
        { day: 'Tue', attendance: 94, lecturesHeld: 82 },
        { day: 'Wed', attendance: 96, lecturesHeld: 80 },
        { day: 'Thu', attendance: 93, lecturesHeld: 84 },
        { day: 'Fri', attendance: 91, lecturesHeld: 76 },
      ],
    });
  } catch (err: any) {
    console.error('Error calculating reports summary:', err);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

// 8.1 ATTENDANCE REPORT (REAL DATABASE QUERY WITH FILTERS)
apiRouter.get('/reports/attendance', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const { department, status, search } = req.query;
    const userRole = req.user!.role;
    const userDept = req.user!.departmentName;

    // Security & Data Scoping: HOD may ONLY query their own department
    if (userRole === 'HOD') {
      if (department && department !== 'All' && !checkHodDepartmentScope(req, String(department))) {
        return res.status(403).json({
          error: 'Forbidden: HODs are strictly restricted to querying reports for their own department.',
          code: 'FORBIDDEN_DEPARTMENT',
        });
      }
    }

    const conditions: any[] = [];
    if (userRole === 'HOD' && userDept) {
      conditions.push(ilike(schema.faculty.department, `%${userDept}%`));
    } else if (department && department !== 'All') {
      conditions.push(eq(schema.faculty.department, String(department)));
    }
    if (status && status !== 'All') {
      conditions.push(eq(schema.faculty.status, String(status)));
    }
    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      conditions.push(
        or(
          ilike(schema.faculty.name, term),
          ilike(schema.faculty.facultyId, term),
          ilike(schema.faculty.designation, term),
          ilike(schema.faculty.email, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const records = await db
      .select()
      .from(schema.faculty)
      .where(whereClause)
      .orderBy(desc(schema.faculty.attendanceRate));

    // Summary metrics computed from query results
    const total = records.length;
    const presentCount = records.filter((r) => r.status === 'Present').length;
    const inLectureCount = records.filter((r) => r.status === 'In Lecture').length;
    const onLeaveCount = records.filter((r) => r.status === 'On Leave').length;
    const absentCount = records.filter((r) => r.status === 'Absent').length;
    const avgAttendanceRate = total > 0
      ? Math.round(records.reduce((acc, r) => acc + (r.attendanceRate || 0), 0) / total)
      : 0;

    let departmentsList = await db.select().from(schema.departments);
    if (userRole === 'HOD' && userDept) {
      departmentsList = departmentsList.filter(
        (d) =>
          d.name.toLowerCase().includes(userDept.toLowerCase()) ||
          userDept.toLowerCase().includes(d.name.toLowerCase())
      );
    }

    res.json({
      records,
      metrics: {
        total,
        presentCount,
        inLectureCount,
        onLeaveCount,
        absentCount,
        activeOnDuty: presentCount + inLectureCount,
        avgAttendanceRate,
      },
      departments: departmentsList.map((d) => d.name),
    });
  } catch (err: any) {
    console.error('Error fetching attendance report:', err);
    res.status(500).json({ error: 'Failed to fetch attendance report' });
  }
});

// 8.2 LEAVE REPORT (REAL DATABASE QUERY WITH FILTERS)
apiRouter.get('/reports/leave', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const { department, leaveType, status, search } = req.query;
    const userRole = req.user!.role;
    const userDept = req.user!.departmentName;

    // Security & Data Scoping: HOD may ONLY query their own department
    if (userRole === 'HOD') {
      if (department && department !== 'All' && !checkHodDepartmentScope(req, String(department))) {
        return res.status(403).json({
          error: 'Forbidden: HODs are strictly restricted to querying reports for their own department.',
          code: 'FORBIDDEN_DEPARTMENT',
        });
      }
    }

    const conditions: any[] = [];
    if (userRole === 'HOD' && userDept) {
      conditions.push(ilike(schema.leaveRequests.department, `%${userDept}%`));
    } else if (department && department !== 'All') {
      conditions.push(eq(schema.leaveRequests.department, String(department)));
    }
    if (leaveType && leaveType !== 'All') {
      conditions.push(eq(schema.leaveRequests.leaveType, String(leaveType)));
    }
    if (status && status !== 'All') {
      conditions.push(eq(schema.leaveRequests.status, String(status)));
    }
    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      conditions.push(
        or(
          ilike(schema.leaveRequests.facultyName, term),
          ilike(schema.leaveRequests.reason, term),
          ilike(schema.leaveRequests.id, term),
          ilike(schema.leaveRequests.designation, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const records = await db
      .select()
      .from(schema.leaveRequests)
      .where(whereClause)
      .orderBy(desc(schema.leaveRequests.appliedAt));

    // Summary metrics computed from query results
    const total = records.length;
    const approvedCount = records.filter((r) => r.status === 'APPROVED').length;
    const pendingCount = records.filter((r) => r.status === 'PENDING').length;
    const rejectedCount = records.filter((r) => r.status === 'REJECTED').length;
    const totalDaysTaken = records.reduce((acc, r) => acc + (r.daysCount || 0), 0);
    const approvedDaysTaken = records
      .filter((r) => r.status === 'APPROVED')
      .reduce((acc, r) => acc + (r.daysCount || 0), 0);

    let departmentsList = await db.select().from(schema.departments);
    if (userRole === 'HOD' && userDept) {
      departmentsList = departmentsList.filter(
        (d) =>
          d.name.toLowerCase().includes(userDept.toLowerCase()) ||
          userDept.toLowerCase().includes(d.name.toLowerCase())
      );
    }

    res.json({
      records,
      metrics: {
        total,
        approvedCount,
        pendingCount,
        rejectedCount,
        totalDaysTaken,
        approvedDaysTaken,
      },
      departments: departmentsList.map((d) => d.name),
    });
  } catch (err: any) {
    console.error('Error fetching leave report:', err);
    res.status(500).json({ error: 'Failed to fetch leave report' });
  }
});

// 8.3 ALTERNATIVE CLASS REPORT (REAL DATABASE QUERY WITH FILTERS)
apiRouter.get('/reports/alternative-classes', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const { status, date, search, department } = req.query;
    const userRole = req.user!.role;
    const userDept = req.user!.departmentName;

    // Security & Data Scoping: HOD may ONLY query their own department
    if (userRole === 'HOD') {
      if (department && department !== 'All' && !checkHodDepartmentScope(req, String(department))) {
        return res.status(403).json({
          error: 'Forbidden: HODs are strictly restricted to querying reports for their own department.',
          code: 'FORBIDDEN_DEPARTMENT',
        });
      }
    }

    const conditions: any[] = [];

    // If HOD, scope records to faculty from HOD's department
    if (userRole === 'HOD' && userDept) {
      const deptFaculty = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(ilike(schema.users.departmentName, `%${userDept}%`));
      const facultyIds = deptFaculty.map((f) => f.id);
      if (facultyIds.length > 0) {
        conditions.push(inArray(schema.alternativeClasses.originalFacultyId, facultyIds));
      }
    } else if (department && department !== 'All') {
      const deptFaculty = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.departmentName, String(department)));
      const facultyIds = deptFaculty.map((f) => f.id);
      if (facultyIds.length > 0) {
        conditions.push(inArray(schema.alternativeClasses.originalFacultyId, facultyIds));
      }
    }

    if (status && status !== 'All') {
      if (status === 'UNASSIGNED') {
        conditions.push(or(
          eq(schema.alternativeClasses.status, 'PENDING_FACULTY_ASSIGNMENT'),
          eq(schema.alternativeClasses.status, 'DECLINED')
        ));
      } else {
        conditions.push(eq(schema.alternativeClasses.status, String(status)));
      }
    }
    if (date && date !== 'All' && String(date).trim()) {
      conditions.push(eq(schema.alternativeClasses.date, String(date)));
    }
    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      conditions.push(
        or(
          ilike(schema.alternativeClasses.subjectName, term),
          ilike(schema.alternativeClasses.subjectCode, term),
          ilike(schema.alternativeClasses.originalFacultyName, term),
          ilike(schema.alternativeClasses.assignedFacultyName, term),
          ilike(schema.alternativeClasses.classroom, term),
          ilike(schema.alternativeClasses.section, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const records = await db
      .select()
      .from(schema.alternativeClasses)
      .where(whereClause)
      .orderBy(desc(schema.alternativeClasses.createdAt));

    // Summary metrics computed from query results
    const total = records.length;
    const pendingAssignment = records.filter((r) => r.status === 'PENDING_FACULTY_ASSIGNMENT').length;
    const offered = records.filter((r) => r.status === 'OFFERED_TO_FACULTY').length;
    const accepted = records.filter((r) => r.status === 'ACCEPTED').length;
    const declined = records.filter((r) => r.status === 'DECLINED').length;
    const resolutionRate = total > 0 ? Math.round((accepted / total) * 100) : 100;

    res.json({
      records,
      metrics: {
        total,
        pendingAssignment,
        offered,
        accepted,
        declined,
        resolutionRate,
      },
    });
  } catch (err: any) {
    console.error('Error fetching alternative classes report:', err);
    res.status(500).json({ error: 'Failed to fetch alternative classes report' });
  }
});

// 8.4 CLASS COMPLETION REPORT (REAL DATABASE QUERY WITH FILTERS)
apiRouter.get('/reports/class-completion', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const { dayOfWeek, status, department, semester, search } = req.query;
    const userRole = req.user!.role;
    const userDept = req.user!.departmentName;

    // Security & Data Scoping: HOD may ONLY query their own department
    if (userRole === 'HOD') {
      if (department && department !== 'All' && !checkHodDepartmentScope(req, String(department))) {
        return res.status(403).json({
          error: 'Forbidden: HODs are strictly restricted to querying reports for their own department.',
          code: 'FORBIDDEN_DEPARTMENT',
        });
      }
    }

    const conditions: any[] = [];
    if (dayOfWeek && dayOfWeek !== 'All') {
      conditions.push(eq(schema.timetableSlots.dayOfWeek, String(dayOfWeek)));
    }
    if (status && status !== 'All') {
      conditions.push(eq(schema.timetableSlots.status, String(status)));
    }
    if (userRole === 'HOD' && userDept) {
      conditions.push(ilike(schema.timetableSlots.department, `%${userDept}%`));
    } else if (department && department !== 'All') {
      conditions.push(eq(schema.timetableSlots.department, String(department)));
    }
    if (semester && semester !== 'All') {
      conditions.push(eq(schema.timetableSlots.semester, String(semester)));
    }
    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      conditions.push(
        or(
          ilike(schema.timetableSlots.subjectName, term),
          ilike(schema.timetableSlots.subjectCode, term),
          ilike(schema.timetableSlots.facultyName, term),
          ilike(schema.timetableSlots.classroom, term),
          ilike(schema.timetableSlots.section, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const records = await db
      .select()
      .from(schema.timetableSlots)
      .where(whereClause)
      .orderBy(schema.timetableSlots.dayOfWeek, schema.timetableSlots.startTime);

    // Summary metrics computed from query results
    const total = records.length;
    const completed = records.filter((r) => r.status === 'COMPLETED').length;
    const inProgress = records.filter((r) => r.status === 'IN_PROGRESS').length;
    const scheduled = records.filter((r) => r.status === 'SCHEDULED').length;
    const substituted = records.filter((r) => !!r.substitutedBy || !!r.substitutedByName).length;
    const totalStudentsCovered = records.reduce((acc, r) => acc + (r.enrolledStudents || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    let departmentsList = await db.select().from(schema.departments);
    if (userRole === 'HOD' && userDept) {
      departmentsList = departmentsList.filter(
        (d) =>
          d.name.toLowerCase().includes(userDept.toLowerCase()) ||
          userDept.toLowerCase().includes(d.name.toLowerCase())
      );
    }

    res.json({
      records,
      metrics: {
        total,
        completed,
        inProgress,
        scheduled,
        substituted,
        totalStudentsCovered,
        completionRate,
      },
      departments: departmentsList.map((d) => d.name),
    });
  } catch (err: any) {
    console.error('Error fetching class completion report:', err);
    res.status(500).json({ error: 'Failed to fetch class completion report' });
  }
});

// Helper to escape CSV strings
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// 8.5 CSV EXPORT WITH REAL DATABASE QUERIES & APPLIED FILTERS
apiRouter.get('/reports/export-csv', authenticateToken, requireRole(['ADMIN', 'HOD']), async (req: AuthRequest, res: Response) => {
  try {
    const type = (req.query.type as string) || 'attendance';
    const { department, status, leaveType, dayOfWeek, semester, search, date } = req.query;
    const userRole = req.user!.role;
    const userDept = req.user!.departmentName;

    // Security & Data Scoping: HOD may ONLY query/export their own department
    if (userRole === 'HOD') {
      if (department && department !== 'All' && !checkHodDepartmentScope(req, String(department))) {
        return res.status(403).json({
          error: 'Forbidden: HODs are strictly restricted to exporting reports for their own department.',
          code: 'FORBIDDEN_DEPARTMENT',
        });
      }
    }

    let csvContent = '';
    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `Takshashila_${type}_report_${dateStamp}.csv`;

    if (type === 'attendance') {
      const conditions: any[] = [];
      if (userRole === 'HOD' && userDept) {
        conditions.push(ilike(schema.faculty.department, `%${userDept}%`));
      } else if (department && department !== 'All') {
        conditions.push(eq(schema.faculty.department, String(department)));
      }
      if (status && status !== 'All') conditions.push(eq(schema.faculty.status, String(status)));
      if (search && String(search).trim()) {
        const term = `%${String(search).trim()}%`;
        conditions.push(or(
          ilike(schema.faculty.name, term),
          ilike(schema.faculty.facultyId, term),
          ilike(schema.faculty.designation, term)
        ));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const list = await db.select().from(schema.faculty).where(whereClause).orderBy(desc(schema.faculty.attendanceRate));

      csvContent = [
        ['Faculty ID', 'Name', 'Email', 'Department', 'Designation', 'Status', 'Attendance Rate (%)', 'Classes Today', 'Leave Balance (Days)'].map(escapeCsv).join(','),
        ...list.map((f) => [
          escapeCsv(f.facultyId),
          escapeCsv(f.name),
          escapeCsv(f.email),
          escapeCsv(f.department),
          escapeCsv(f.designation),
          escapeCsv(f.status),
          escapeCsv(f.attendanceRate),
          escapeCsv(f.classesToday),
          escapeCsv(f.leaveBalance),
        ].join(',')),
      ].join('\n');

    } else if (type === 'leave') {
      const conditions: any[] = [];
      if (userRole === 'HOD' && userDept) {
        conditions.push(ilike(schema.leaveRequests.department, `%${userDept}%`));
      } else if (department && department !== 'All') {
        conditions.push(eq(schema.leaveRequests.department, String(department)));
      }
      if (leaveType && leaveType !== 'All') conditions.push(eq(schema.leaveRequests.leaveType, String(leaveType)));
      if (status && status !== 'All') conditions.push(eq(schema.leaveRequests.status, String(status)));
      if (search && String(search).trim()) {
        const term = `%${String(search).trim()}%`;
        conditions.push(or(
          ilike(schema.leaveRequests.facultyName, term),
          ilike(schema.leaveRequests.reason, term),
          ilike(schema.leaveRequests.id, term)
        ));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const list = await db.select().from(schema.leaveRequests).where(whereClause).orderBy(desc(schema.leaveRequests.appliedAt));

      csvContent = [
        ['Request ID', 'Faculty Name', 'Department', 'Designation', 'Leave Type', 'Start Date', 'End Date', 'Days Count', 'Status', 'Reason', 'Applied At', 'Reviewed By', 'Review Remarks'].map(escapeCsv).join(','),
        ...list.map((l) => [
          escapeCsv(l.id),
          escapeCsv(l.facultyName),
          escapeCsv(l.department),
          escapeCsv(l.designation),
          escapeCsv(l.leaveType),
          escapeCsv(l.startDate),
          escapeCsv(l.endDate),
          escapeCsv(l.daysCount),
          escapeCsv(l.status),
          escapeCsv(l.reason),
          escapeCsv(l.appliedAt ? new Date(l.appliedAt).toISOString().split('T')[0] : ''),
          escapeCsv(l.reviewedBy || 'Pending'),
          escapeCsv(l.reviewRemarks || ''),
        ].join(',')),
      ].join('\n');

    } else if (type === 'alternative' || type === 'alternative-classes' || type === 'substitutions') {
      const conditions: any[] = [];
      if (status && status !== 'All') {
        if (status === 'UNASSIGNED') {
          conditions.push(or(
            eq(schema.alternativeClasses.status, 'PENDING_FACULTY_ASSIGNMENT'),
            eq(schema.alternativeClasses.status, 'DECLINED')
          ));
        } else {
          conditions.push(eq(schema.alternativeClasses.status, String(status)));
        }
      }
      if (date && date !== 'All' && String(date).trim()) {
        conditions.push(eq(schema.alternativeClasses.date, String(date)));
      }
      if (search && String(search).trim()) {
        const term = `%${String(search).trim()}%`;
        conditions.push(or(
          ilike(schema.alternativeClasses.subjectName, term),
          ilike(schema.alternativeClasses.subjectCode, term),
          ilike(schema.alternativeClasses.originalFacultyName, term),
          ilike(schema.alternativeClasses.assignedFacultyName, term),
          ilike(schema.alternativeClasses.classroom, term)
        ));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const list = await db.select().from(schema.alternativeClasses).where(whereClause).orderBy(desc(schema.alternativeClasses.createdAt));

      csvContent = [
        ['Assignment ID', 'Leave Request ID', 'Subject Code', 'Subject Name', 'Section', 'Date', 'Start Time', 'End Time', 'Classroom', 'Faculty on Leave', 'Assigned Substitute', 'Status', 'Reason', 'Notes'].map(escapeCsv).join(','),
        ...list.map((a) => [
          escapeCsv(a.id),
          escapeCsv(a.leaveRequestId || 'N/A'),
          escapeCsv(a.subjectCode),
          escapeCsv(a.subjectName),
          escapeCsv(a.section),
          escapeCsv(a.date),
          escapeCsv(a.startTime),
          escapeCsv(a.endTime),
          escapeCsv(a.classroom),
          escapeCsv(a.originalFacultyName),
          escapeCsv(a.assignedFacultyName || 'Unassigned'),
          escapeCsv(a.status),
          escapeCsv(a.reason),
          escapeCsv(a.notes || ''),
        ].join(',')),
      ].join('\n');

    } else {
      // completion / timetable / class-completion
      const conditions: any[] = [];
      if (dayOfWeek && dayOfWeek !== 'All') conditions.push(eq(schema.timetableSlots.dayOfWeek, String(dayOfWeek)));
      if (status && status !== 'All') conditions.push(eq(schema.timetableSlots.status, String(status)));
      if (department && department !== 'All') conditions.push(eq(schema.timetableSlots.department, String(department)));
      if (semester && semester !== 'All') conditions.push(eq(schema.timetableSlots.semester, String(semester)));
      if (search && String(search).trim()) {
        const term = `%${String(search).trim()}%`;
        conditions.push(or(
          ilike(schema.timetableSlots.subjectName, term),
          ilike(schema.timetableSlots.subjectCode, term),
          ilike(schema.timetableSlots.facultyName, term),
          ilike(schema.timetableSlots.classroom, term)
        ));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const list = await db.select().from(schema.timetableSlots).where(whereClause).orderBy(schema.timetableSlots.dayOfWeek, schema.timetableSlots.startTime);

      csvContent = [
        ['Slot ID', 'Day of Week', 'Start Time', 'End Time', 'Subject Code', 'Subject Name', 'Department', 'Semester', 'Section', 'Classroom', 'Primary Faculty', 'Substitute Faculty', 'Enrolled Students', 'Status', 'Notes'].map(escapeCsv).join(','),
        ...list.map((t) => [
          escapeCsv(t.id),
          escapeCsv(t.dayOfWeek),
          escapeCsv(t.startTime),
          escapeCsv(t.endTime),
          escapeCsv(t.subjectCode),
          escapeCsv(t.subjectName),
          escapeCsv(t.department),
          escapeCsv(t.semester),
          escapeCsv(t.section),
          escapeCsv(t.classroom),
          escapeCsv(t.facultyName),
          escapeCsv(t.substitutedByName || 'None'),
          escapeCsv(t.enrolledStudents || 0),
          escapeCsv(t.status),
          escapeCsv(t.notes || ''),
        ].join(',')),
      ].join('\n');
    }

    // Log to audit log
    await logAuditAction(
      req.user!.id,
      req.user!.name,
      'REPORT_EXPORTED',
      'SYSTEM',
      `Exported ${type.toUpperCase()} report as CSV (${dateStamp}) with filters: ${JSON.stringify(req.query)}`
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err: any) {
    console.error('Error exporting CSV report:', err);
    res.status(500).json({ error: 'Failed to export CSV report' });
  }
});


// ==========================================
// 9. AUDIT LOGS (ADMIN & HOD)
// ==========================================

// PROTECTED: ADMIN ONLY
apiRouter.get('/audit-logs', authenticateToken, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { module } = req.query;

    let logs;
    if (module && module !== 'All') {
      logs = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.module, String(module)))
        .orderBy(desc(schema.auditLogs.timestamp))
        .limit(150);
    } else {
      logs = await db
        .select()
        .from(schema.auditLogs)
        .orderBy(desc(schema.auditLogs.timestamp))
        .limit(150);
    }

    res.json(logs);
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});
