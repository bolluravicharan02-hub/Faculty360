import {
  UserProfile,
  Department,
  FacultyMember,
  TimetableSlot,
  LeaveRequest,
  AlternativeClassAssignment,
  CandidateFaculty,
  NotificationItem,
  AuditLog,
  Role,
  Subject,
  Classroom,
  AcademicLeaveType,
  ClassSession,
} from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'faculty360_auth_token';

let authToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
let unauthorizedHandler: (() => void) | null = null;

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response, fallbackError: string): Promise<T> {
  if (res.status === 401) {
    if (unauthorizedHandler) {
      unauthorizedHandler();
    }
    let errDetail: any = {};
    try {
      errDetail = await res.json();
    } catch {}
    const error = new Error(errDetail.error || 'Session expired or unauthenticated. Please sign in.') as Error & { status?: number; code?: string };
    error.status = 401;
    error.code = errDetail.code || 'AUTH_EXPIRED';
    throw error;
  }

  if (!res.ok) {
    let errDetail: any;
    try {
      errDetail = await res.json();
    } catch {
      errDetail = {};
    }
    const message = errDetail.error || `${fallbackError} (${res.status} ${res.statusText})`;
    const error = new Error(message) as Error & { status?: number; code?: string; requiredRoles?: string[] };
    error.status = res.status;
    error.code = errDetail.code;
    error.requiredRoles = errDetail.requiredRoles;
    throw error;
  }
  return res.json();
}

export const api = {
  // Register unauthorized / session expiration listener
  onUnauthorized(handler: () => void) {
    unauthorizedHandler = handler;
  },

  // Token management
  setToken(token: string | null) {
    authToken = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  getToken() {
    return authToken;
  },

  // Auth Profile: validates Supabase token with backend and fetches DB profile
  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: getHeaders(),
    });
    return handleResponse<UserProfile>(res, 'Failed to fetch user profile');
  },

  // Departments
  async getDepartments() {
    const res = await fetch(`${API_BASE}/departments`, {
      headers: getHeaders(),
    });
    return handleResponse<Department[]>(res, 'Failed to fetch departments');
  },

  // Faculty
  async getFaculty(params?: { department?: string; status?: string; query?: string }) {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.status) query.set('status', params.status);
    if (params?.query) query.set('query', params.query);
    const res = await fetch(`${API_BASE}/faculty?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<FacultyMember[]>(res, 'Failed to fetch faculty');
  },

  async getFacultyProfile(id: string) {
    const res = await fetch(`${API_BASE}/faculty/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<FacultyMember & { timetable: TimetableSlot[]; leaves: LeaveRequest[] }>(
      res,
      'Failed to fetch faculty profile'
    );
  },

  async addFaculty(data: { name: string; email: string; department?: string; designation?: string; specialization?: string[]; facultyId?: string }) {
    const res = await fetch(`${API_BASE}/faculty`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<FacultyMember>(res, 'Failed to add faculty member');
  },

  async updateFaculty(id: string, data: Partial<FacultyMember>) {
    const res = await fetch(`${API_BASE}/faculty/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<FacultyMember>(res, 'Failed to update faculty member');
  },

  async deleteFaculty(id: string) {
    const res = await fetch(`${API_BASE}/faculty/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; deletedId: string }>(res, 'Failed to delete faculty member');
  },

  // Timetable
  async getTimetable(params?: {
    day?: string;
    date?: string;
    sessionDate?: string;
    facultyId?: string;
    department?: string;
    semester?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.day) query.set('day', params.day);
    if (params?.date) query.set('date', params.date);
    if (params?.sessionDate) query.set('sessionDate', params.sessionDate);
    if (params?.facultyId) query.set('facultyId', params.facultyId);
    if (params?.department) query.set('department', params.department);
    if (params?.semester) query.set('semester', params.semester);
    const res = await fetch(`${API_BASE}/timetable?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<TimetableSlot[]>(res, 'Failed to fetch timetable');
  },

  async createTimetableSlot(data: any) {
    const res = await fetch(`${API_BASE}/timetable`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<TimetableSlot>(res, 'Failed to create timetable slot');
  },

  // Class Sessions (Date-specific class occurrences)
  async getClassSessions(params?: {
    date?: string;
    sessionDate?: string;
    facultyId?: string;
    status?: string;
    department?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.sessionDate) query.set('sessionDate', params.sessionDate);
    if (params?.facultyId) query.set('facultyId', params.facultyId);
    if (params?.status) query.set('status', params.status);
    if (params?.department) query.set('department', params.department);
    const res = await fetch(`${API_BASE}/class-sessions?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<ClassSession[]>(res, 'Failed to fetch class sessions');
  },

  async getClassSession(id: string) {
    const res = await fetch(`${API_BASE}/class-sessions/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<ClassSession>(res, 'Failed to fetch class session');
  },

  async updateClassSession(id: string, data: any) {
    const res = await fetch(`${API_BASE}/class-sessions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<ClassSession>(res, 'Failed to update class session');
  },

  // Leave
  async getLeaves(params?: { facultyId?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.facultyId) query.set('facultyId', params.facultyId);
    if (params?.status) query.set('status', params.status);
    const res = await fetch(`${API_BASE}/leave?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<LeaveRequest[]>(res, 'Failed to fetch leaves');
  },

  async applyLeave(data: Partial<LeaveRequest>) {
    const res = await fetch(`${API_BASE}/leave`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<LeaveRequest>(res, 'Failed to submit leave');
  },

  async reviewLeave(id: string, decision: { status: 'APPROVED' | 'REJECTED'; remarks?: string; reviewerName?: string }) {
    const res = await fetch(`${API_BASE}/leave/${id}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(decision),
    });
    return handleResponse<LeaveRequest & { affectedSlotsCount?: number }>(res, 'Failed to review leave');
  },

  async cancelLeave(id: string) {
    const res = await fetch(`${API_BASE}/leave/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<LeaveRequest>(res, 'Failed to cancel leave request');
  },

  async previewAffectedSlots(params: { facultyId?: string; facultyName?: string; startDate: string; endDate: string }) {
    const query = new URLSearchParams();
    if (params.facultyId) query.set('facultyId', params.facultyId);
    if (params.facultyName) query.set('facultyName', params.facultyName);
    query.set('startDate', params.startDate);
    query.set('endDate', params.endDate);
    const res = await fetch(`${API_BASE}/leave/preview-affected?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<{
      dates: string[];
      totalAffectedClasses: number;
      affectedClasses: Array<{
        date: string;
        dayOfWeek: string;
        slotId: string;
        subjectCode: string;
        subjectName: string;
        startTime: string;
        endTime: string;
        classroom: string;
        section: string;
        enrolledStudents: number;
      }>;
    }>(res, 'Failed to preview affected timetable classes');
  },

  // Alternative Classes
  async getAlternativeClasses() {
    const res = await fetch(`${API_BASE}/alternatives`, {
      headers: getHeaders(),
    });
    return handleResponse<AlternativeClassAssignment[]>(res, 'Failed to fetch alternative classes');
  },

  async getCandidates(altId: string) {
    const res = await fetch(`${API_BASE}/alternatives/${altId}/candidates`, {
      headers: getHeaders(),
    });
    return handleResponse<CandidateFaculty[]>(res, 'Failed to load candidate faculty');
  },

  async assignCandidate(altId: string, facultyId: string) {
    const res = await fetch(`${API_BASE}/alternatives/${altId}/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ facultyId }),
    });
    return handleResponse<AlternativeClassAssignment>(res, 'Failed to assign substitute faculty');
  },

  async respondToAlternative(altId: string, action: 'accept' | 'decline', user: { id: string; name: string; reason?: string }) {
    const res = await fetch(`${API_BASE}/alternatives/${altId}/respond`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action, facultyId: user.id, facultyName: user.name, reason: user.reason }),
    });
    return handleResponse<AlternativeClassAssignment>(res, `Failed to ${action} alternative session`);
  },

  // Notifications
  async getNotifications(facultyId?: string) {
    const query = facultyId ? `?facultyId=${encodeURIComponent(facultyId)}` : '';
    const res = await fetch(`${API_BASE}/notifications${query}`, {
      headers: getHeaders(),
    });
    return handleResponse<NotificationItem[]>(res, 'Failed to fetch notifications');
  },

  async markNotificationRead(id: string) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean }>(res, 'Failed to mark notification read');
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean }>(res, 'Failed to mark all notifications read');
  },

  // Broadcast
  async sendBroadcast(message: string, targetGroup?: string) {
    const res = await fetch(`${API_BASE}/department/broadcast`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, targetGroup }),
    });
    return handleResponse<{ success: boolean; count: number }>(res, 'Failed to dispatch broadcast');
  },

  // Reports & Analytics
  async getReportsSummary() {
    const res = await fetch(`${API_BASE}/reports/summary`, {
      headers: getHeaders(),
    });
    return handleResponse<any>(res, 'Failed to fetch reports summary');
  },

  async getAttendanceReport(params?: { department?: string; status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/reports/attendance${qs}`, {
      headers: getHeaders(),
    });
    return handleResponse<{
      records: any[];
      metrics: {
        total: number;
        presentCount: number;
        inLectureCount: number;
        onLeaveCount: number;
        absentCount: number;
        activeOnDuty: number;
        avgAttendanceRate: number;
      };
      departments: string[];
    }>(res, 'Failed to fetch attendance report');
  },

  async getLeaveReport(params?: { department?: string; leaveType?: string; status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.leaveType) query.set('leaveType', params.leaveType);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/reports/leave${qs}`, {
      headers: getHeaders(),
    });
    return handleResponse<{
      records: any[];
      metrics: {
        total: number;
        approvedCount: number;
        pendingCount: number;
        rejectedCount: number;
        totalDaysTaken: number;
        approvedDaysTaken: number;
      };
      departments: string[];
    }>(res, 'Failed to fetch leave report');
  },

  async getAlternativeClassesReport(params?: { status?: string; date?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.date) query.set('date', params.date);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/reports/alternative-classes${qs}`, {
      headers: getHeaders(),
    });
    return handleResponse<{
      records: any[];
      metrics: {
        total: number;
        pendingAssignment: number;
        offered: number;
        accepted: number;
        declined: number;
        resolutionRate: number;
      };
    }>(res, 'Failed to fetch alternative classes report');
  },

  async getClassCompletionReport(params?: { dayOfWeek?: string; status?: string; department?: string; semester?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.dayOfWeek) query.set('dayOfWeek', params.dayOfWeek);
    if (params?.status) query.set('status', params.status);
    if (params?.department) query.set('department', params.department);
    if (params?.semester) query.set('semester', params.semester);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/reports/class-completion${qs}`, {
      headers: getHeaders(),
    });
    return handleResponse<{
      records: any[];
      metrics: {
        total: number;
        completed: number;
        inProgress: number;
        scheduled: number;
        substituted: number;
        totalStudentsCovered: number;
        completionRate: number;
      };
      departments: string[];
    }>(res, 'Failed to fetch class completion report');
  },

  getExportCsvUrl(type: string, filters?: Record<string, string>) {
    const query = new URLSearchParams({ type, ...(filters || {}) });
    return `${API_BASE}/reports/export-csv?${query.toString()}`;
  },

  async exportCsv(type: string, filters?: Record<string, string>) {
    const query = new URLSearchParams({ type, ...(filters || {}) });
    const res = await fetch(`${API_BASE}/reports/export-csv?${query.toString()}`, {
      headers: getHeaders({ 'Content-Type': 'text/csv' }),
    });
    if (!res.ok) {
      let errDetail: any;
      try {
        errDetail = await res.json();
      } catch {
        errDetail = {};
      }
      const message = errDetail.error || `Failed to export CSV (${res.status})`;
      throw new Error(message);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Takshashila_${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Audit Logs
  async getAuditLogs(module?: string) {
    const query = module && module !== 'All' ? `?module=${encodeURIComponent(module)}` : '';
    const res = await fetch(`${API_BASE}/audit-logs${query}`, {
      headers: getHeaders(),
    });
    return handleResponse<AuditLog[]>(res, 'Failed to fetch audit logs');
  },

  // Subjects
  async getSubjects(params?: { department?: string; semester?: string; type?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.department && params.department !== 'All') query.set('department', params.department);
    if (params?.semester && params.semester !== 'All') query.set('semester', params.semester);
    if (params?.type && params.type !== 'All') query.set('type', params.type);
    if (params?.search) query.set('search', params.search);

    const qStr = query.toString();
    const res = await fetch(`${API_BASE}/subjects${qStr ? `?${qStr}` : ''}`, {
      headers: getHeaders(),
    });
    return handleResponse<Subject[]>(res, 'Failed to fetch subjects');
  },

  async createSubject(data: Partial<Subject>) {
    const res = await fetch(`${API_BASE}/subjects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Subject>(res, 'Failed to create subject');
  },

  async updateSubject(id: string, data: Partial<Subject>) {
    const res = await fetch(`${API_BASE}/subjects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Subject>(res, 'Failed to update subject');
  },

  async deleteSubject(id: string) {
    const res = await fetch(`${API_BASE}/subjects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(res, 'Failed to delete subject');
  },

  // Classrooms
  async getClassrooms(params?: { building?: string; type?: string; status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.building && params.building !== 'All') query.set('building', params.building);
    if (params?.type && params.type !== 'All') query.set('type', params.type);
    if (params?.status && params.status !== 'All') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const qStr = query.toString();
    const res = await fetch(`${API_BASE}/classrooms${qStr ? `?${qStr}` : ''}`, {
      headers: getHeaders(),
    });
    return handleResponse<Classroom[]>(res, 'Failed to fetch classrooms');
  },

  async createClassroom(data: Partial<Classroom>) {
    const res = await fetch(`${API_BASE}/classrooms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Classroom>(res, 'Failed to create classroom');
  },

  async updateClassroom(id: string, data: Partial<Classroom>) {
    const res = await fetch(`${API_BASE}/classrooms/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Classroom>(res, 'Failed to update classroom');
  },

  async deleteClassroom(id: string) {
    const res = await fetch(`${API_BASE}/classrooms/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(res, 'Failed to delete classroom');
  },

  // Departments CRUD
  async createDepartment(data: { code: string; name: string; hodName?: string; facultyCount?: number }) {
    const res = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Department>(res, 'Failed to create department');
  },

  async updateDepartment(id: string, data: Partial<Department>) {
    const res = await fetch(`${API_BASE}/departments/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Department>(res, 'Failed to update department');
  },

  async deleteDepartment(id: string) {
    const res = await fetch(`${API_BASE}/departments/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(res, 'Failed to delete department');
  },

  // Leave Types
  async getLeaveTypes() {
    const res = await fetch(`${API_BASE}/leave-types`, {
      headers: getHeaders(),
    });
    return handleResponse<AcademicLeaveType[]>(res, 'Failed to fetch leave types');
  },
};
