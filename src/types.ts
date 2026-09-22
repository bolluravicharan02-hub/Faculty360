export type Role = 'STUDENT' | 'FACULTY' | 'HOD' | 'ADMIN';

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
  studentId?: string;
  program?: string;
  semester?: string;
  section?: string;
  yearOfStudy?: string;
  leaveBalance?: {
    casual: number;
    medical: number;
    earned: number;
    total: number;
  };
}

export interface StudentProfile {
  id: string;
  studentId: string;
  userId: string;
  name: string;
  email: string;
  departmentId?: string;
  departmentName: string;
  program: string;
  semester: string;
  section: string;
  yearOfStudy: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  userId: string;
  subjectCode: string;
  subjectName: string;
  classesHeld: number;
  classesAttended: number;
  classesAbsent: number;
  percentage: number;
  status: 'Good Standing' | 'Warning' | 'Critical';
  facultyName?: string;
}

export interface StudentDashboardData {
  profile: StudentProfile;
  overallAttendance: {
    totalClasses: number;
    attended: number;
    percentage: number;
    status: string;
  };
  subjectsAttendance: StudentAttendanceRecord[];
  todaySchedule: TimetableSlot[];
  recentAnnouncements: {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: string;
    category?: string;
  }[];
  academicStatus: {
    enrollmentStatus: string;
    currentSemester: string;
    academicYear: string;
    cgpa?: number;
    totalCredits: number;
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
  sessionDate?: string; // YYYY-MM-DD when resolved for a specific date
  sessionId?: string;   // Associated class_sessions record ID
}

export interface ClassSession {
  id: string;
  timetableSlotId?: string | null;
  sessionDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  originalFacultyId: string;
  originalFacultyName?: string;
  actualFacultyId?: string | null;
  actualFacultyName?: string | null;
  status: 'SCHEDULED' | 'SUBSTITUTION_PENDING' | 'SUBSTITUTED' | 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';
  classroom: string;
  subjectCode: string;
  subjectName: string;
  section: string;
  semester: string;
  department?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
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

export interface AcademicWeekDay {
  date: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue, etc.
  dayOfMonth: number;
  isToday: boolean;
  isInstructional: boolean;
  activityLabel?: string;
  eventNote?: string;
}

export interface AcademicWeekInfo {
  weekNumber: number;
  totalWeeks: number;
  academicYear: string;
  semesterName: string;
  startDate: string;
  endDate: string;
  phaseTitle: string;
  phaseDescription: string;
  days: AcademicWeekDay[];
  progressPercent: number;
  daysRemainingInSemester: number;
}

export interface AcademicHoliday {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  durationDays: number;
  type: 'Gazetted' | 'National' | 'Institutional' | 'Observance';
  description?: string;
  daysUntil: number; // >= 0
  isNextUpcoming: boolean;
}

export interface ExamDeadline {
  id: string;
  title: string;
  deadlineDate: string; // YYYY-MM-DD or date range
  category: 'Mid-Term Exam' | 'End-Term Exam' | 'Marks Submission' | 'Syllabus & Papers' | 'Practical / Viva';
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  affectedRoles: string[]; // e.g. ['Faculty', 'HOD', 'Students']
  description: string;
  daysUntil: number; // >= 0
  isPassed: boolean;
  statusText?: string;
}

export interface AcademicCalendarData {
  institution: string;
  currentSemester: string;
  academicYear: string;
  currentWeek: AcademicWeekInfo;
  upcomingHolidays: AcademicHoliday[];
  examDeadlines: ExamDeadline[];
  totalHolidaysCount: number;
  totalExamDeadlinesCount: number;
}
