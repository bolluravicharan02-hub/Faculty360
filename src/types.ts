export type Role = 'FACULTY' | 'HOD' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  facultyId?: string;
  departmentId?: string;
  departmentName?: string;
  designation?: string;
  avatarUrl?: string;
  phone?: string;
  leaveBalance?: {
    casual: number;
    medical: number;
    earned: number;
    total: number;
  };
}

export interface Department {
  id: string;
  code: string;
  name: string;
  hodName: string;
  facultyCount: number;
  attendanceRate: number;
}

export interface FacultyMember {
  id: string;
  facultyId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: 'Present' | 'On Leave' | 'In Lecture' | 'Off Duty';
  avatarUrl: string;
  specialization: string[];
  classesToday: number;
  attendanceRate: number;
  leaveBalance: number;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "10:00 AM"
  subjectCode: string;
  subjectName: string;
  department: string;
  section: string;
  semester: string;
  classroom: string;
  facultyId: string;
  facultyName: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED' | 'SUBSTITUTION_PENDING' | 'SUBSTITUTED' | 'CANCELLED';
  substitutedBy?: string;
  substitutedByName?: string;
  enrolledStudents?: number;
  notes?: string;
}

export type LeaveType = 'Casual Leave' | 'Medical Leave' | 'On Duty' | 'Earned Leave';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  facultyId: string;
  facultyName: string;
  facultyEmail: string;
  department: string;
  designation: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  attachmentName?: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
  affectedSlots?: TimetableSlot[];
}

export type AlternativeClassStatus = 'PENDING_FACULTY_ASSIGNMENT' | 'OFFERED_TO_FACULTY' | 'ACCEPTED' | 'DECLINED' | 'RESOLVED';

export interface AlternativeClassAssignment {
  id: string;
  leaveRequestId: string;
  originalFacultyId: string;
  originalFacultyName: string;
  subjectCode: string;
  subjectName: string;
  date: string;
  startTime: string;
  endTime: string;
  classroom: string;
  section: string;
  reason: string;
  assignedFacultyId?: string;
  assignedFacultyName?: string;
  assignedAt?: string;
  status: AlternativeClassStatus;
  notes?: string;
}

export interface CandidateFaculty {
  id: string;
  name: string;
  department: string;
  designation: string;
  workloadToday: number;
  isAvailable: boolean;
  matchScore: number;
  matchReasons: string[];
  avatarUrl: string;
  conflictReason?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'leave' | 'substitution' | 'timetable' | 'announcement';
  read: boolean;
  timestamp: string;
  actionUrl?: string;
  actionPayload?: any;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: 'AUTH' | 'LEAVE' | 'TIMETABLE' | 'SUBSTITUTION' | 'FACULTY' | 'SYSTEM';
  timestamp: string;
  details: string;
  metadata?: Record<string, any>;
}

export type ReportType = 'attendance' | 'leave' | 'alternative' | 'completion';

export interface AttendanceReportItem {
  id: string;
  facultyId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: string;
  attendanceRate: number;
  classesToday: number;
  leaveBalance: number;
}

export interface LeaveReportItem {
  id: string;
  facultyId: string;
  facultyName: string;
  department: string;
  designation: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: string;
  appliedAt: string;
  reviewedBy?: string | null;
  reviewRemarks?: string | null;
}

export interface AlternativeClassReportItem {
  id: string;
  leaveRequestId?: string | null;
  subjectCode: string;
  subjectName: string;
  section: string;
  date: string;
  startTime: string;
  endTime: string;
  classroom: string;
  originalFacultyName: string;
  assignedFacultyName?: string | null;
  status: string;
  reason: string;
  notes?: string | null;
}

export interface ClassCompletionReportItem {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName: string;
  department: string;
  section: string;
  semester: string;
  classroom: string;
  facultyName: string;
  status: string;
  substitutedByName?: string | null;
  enrolledStudents?: number | null;
  notes?: string | null;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  departmentId?: string | null;
  departmentName: string;
  credits: number;
  semester: string;
  type: string;
  weeklyHours: number;
  syllabusSummary?: string | null;
}

export interface Classroom {
  id: string;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  type: string;
  facilities?: string[] | null;
  status: string;
}

export interface AcademicLeaveType {
  id: string;
  name: string;
  code: string;
  defaultQuota: number;
  description?: string | null;
  requiresDocument: boolean;
}
