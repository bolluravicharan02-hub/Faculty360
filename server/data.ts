import {
  UserProfile,
  Department,
  FacultyMember,
  TimetableSlot,
  LeaveRequest,
  AlternativeClassAssignment,
  NotificationItem,
  AuditLog
} from '../src/types.js';

export class UniversityDataStore {
  users: UserProfile[] = [
    {
      id: 'usr-rajesh',
      email: 'rajesh.sharma@takshashila.edu',
      name: 'Dr. Rajesh Sharma',
      role: 'HOD',
      facultyId: 'FAC-CSE-001',
      departmentId: 'dept-cse',
      departmentName: 'Department of Computer Science & Engineering',
      designation: 'Assoc. Professor & HOD',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      phone: '+91 98450 12345',
      leaveBalance: { casual: 6, medical: 4, earned: 2, total: 12 }
    },
    {
      id: 'usr-admin',
      email: 'admin@faculty360.demo',
      name: 'Dr. K. S. Somnath',
      role: 'ADMIN',
      facultyId: 'ADMIN-001',
      departmentId: 'dept-admin',
      departmentName: 'Academic Administration',
      designation: 'Dean of Academic Affairs',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      phone: '+91 94440 99881',
      leaveBalance: { casual: 10, medical: 8, earned: 12, total: 30 }
    },
    {
      id: 'usr-arun',
      email: 'arun.kumar@takshashila.edu',
      name: 'Dr. Arun Kumar',
      role: 'FACULTY',
      facultyId: 'FAC-CSE-014',
      departmentId: 'dept-cse',
      departmentName: 'Department of Computer Science & Engineering',
      designation: 'Associate Professor',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      phone: '+91 98765 43210',
      leaveBalance: { casual: 6, medical: 5, earned: 3, total: 14 }
    },
    {
      id: 'usr-priya',
      email: 'priya.menon@takshashila.edu',
      name: 'Prof. S. Menon',
      role: 'FACULTY',
      facultyId: 'FAC-CSE-008',
      departmentId: 'dept-cse',
      departmentName: 'Department of Computer Science & Engineering',
      designation: 'Professor',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      phone: '+91 98840 55667',
      leaveBalance: { casual: 1, medical: 0, earned: 4, total: 5 }
    }
  ];

  departments: Department[] = [
    {
      id: 'dept-cse',
      code: 'CSE',
      name: 'Computer Science & Engineering',
      hodName: 'Dr. Rajesh Sharma',
      facultyCount: 38,
      attendanceRate: 96
    },
    {
      id: 'dept-comm',
      code: 'COMM',
      name: 'Commerce & Accounting',
      hodName: 'Dr. Vandana Rao',
      facultyCount: 31,
      attendanceRate: 94
    },
    {
      id: 'dept-mgmt',
      code: 'MGMT',
      name: 'Management Studies',
      hodName: 'Dr. Alok Verma',
      facultyCount: 29,
      attendanceRate: 93
    },
    {
      id: 'dept-ece',
      code: 'ECE',
      name: 'Electronics & Communication',
      hodName: 'Dr. M. Srinivasan',
      facultyCount: 46,
      attendanceRate: 91
    },
    {
      id: 'dept-mech',
      code: 'MECH',
      name: 'Mechanical Engineering',
      hodName: 'Dr. Hemant Joshi',
      facultyCount: 40,
      attendanceRate: 89
    }
  ];

  facultyList: FacultyMember[] = [
    {
      id: 'usr-rajesh',
      facultyId: 'FAC-CSE-001',
      name: 'Dr. Rajesh Sharma',
      email: 'rajesh.sharma@takshashila.edu',
      department: 'Computer Science & Engineering',
      designation: 'Assoc. Professor & HOD',
      status: 'Present',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      specialization: ['Database Systems', 'Cloud Computing', 'Distributed Systems'],
      classesToday: 3,
      attendanceRate: 98,
      leaveBalance: 12
    },
    {
      id: 'usr-arun',
      facultyId: 'FAC-CSE-014',
      name: 'Dr. Arun Kumar',
      email: 'arun.kumar@takshashila.edu',
      department: 'Computer Science & Engineering',
      designation: 'Associate Professor',
      status: 'On Leave',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      specialization: ['Data Structures & Algorithms', 'Discrete Mathematics'],
      classesToday: 0,
      attendanceRate: 94,
      leaveBalance: 14
    },
    {
      id: 'usr-priya',
      facultyId: 'FAC-CSE-008',
      name: 'Prof. S. Menon',
      email: 'priya.menon@takshashila.edu',
      department: 'Computer Science & Engineering',
      designation: 'Professor',
      status: 'On Leave',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      specialization: ['Advanced Algorithms', 'Graph Theory', 'Automata'],
      classesToday: 0,
      attendanceRate: 88,
      leaveBalance: 5
    },
    {
      id: 'usr-meera',
      facultyId: 'FAC-CSE-021',
      name: 'Dr. Meera Nambiar',
      email: 'meera.nambiar@takshashila.edu',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      status: 'Present',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      specialization: ['Operating Systems', 'System Programming'],
      classesToday: 2,
      attendanceRate: 96,
      leaveBalance: 11
    },
    {
      id: 'usr-raman',
      facultyId: 'FAC-CSE-005',
      name: 'Prof. K. V. Raman',
      email: 'kv.raman@takshashila.edu',
      department: 'Computer Science & Engineering',
      designation: 'Professor',
      status: 'In Lecture',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      specialization: ['Compiler Design', 'Formal Languages'],
      classesToday: 2,
      attendanceRate: 99,
      leaveBalance: 16
    },
    {
      id: 'usr-sunita',
      facultyId: 'FAC-CSE-011',
      name: 'Dr. Sunita Rao',
      email: 'sunita.rao@takshashila.edu',
      department: 'Computer Science & Engineering',
      designation: 'Associate Professor',
      status: 'Present',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      specialization: ['Machine Learning', 'Artificial Intelligence', 'Data Mining'],
      classesToday: 2,
      attendanceRate: 95,
      leaveBalance: 9
    },
    {
      id: 'usr-malini',
      facultyId: 'FAC-CSE-019',
      name: 'Prof. Malini Venkat',
      email: 'malini.venkat@takshashila.edu',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      status: 'Present',
      avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
      specialization: ['Algorithms', 'Data Structures', 'Python Programming'],
      classesToday: 1,
      attendanceRate: 97,
      leaveBalance: 15
    },
    {
      id: 'usr-nitin',
      facultyId: 'FAC-CSE-026',
      name: 'Dr. Nitin Deshmukh',
      email: 'nitin.deshmukh@takshashila.edu',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      status: 'Present',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      specialization: ['Data Structures', 'C++ Programming', 'Object Oriented Design'],
      classesToday: 1,
      attendanceRate: 96,
      leaveBalance: 13
    },
    {
      id: 'usr-bhavna',
      facultyId: 'FAC-CSE-033',
      name: 'Dr. Bhavna Roy',
      email: 'bhavna.roy@takshashila.edu',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      status: 'Present',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      specialization: ['Software Engineering', 'Web Technologies'],
      classesToday: 2,
      attendanceRate: 92,
      leaveBalance: 10
    }
  ];

  timetable: TimetableSlot[] = [
    // Today's classes for Dr. Rajesh Sharma (Tuesday)
    {
      id: 'slot-1',
      dayOfWeek: 'Tuesday',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      subjectCode: 'CS-201',
      subjectName: 'Data Structures',
      department: 'Computer Science & Engineering',
      section: 'B.Tech CSE II',
      semester: 'Semester 3',
      classroom: 'Room 204',
      facultyId: 'usr-rajesh',
      facultyName: 'Dr. Rajesh Sharma',
      status: 'COMPLETED',
      enrolledStudents: 62,
      notes: 'Arrays, Stacks, and Queue Implementation verified'
    },
    {
      id: 'slot-2',
      dayOfWeek: 'Tuesday',
      startTime: '11:00 AM',
      endTime: '12:00 PM',
      subjectCode: 'CS-301',
      subjectName: 'Database Management Systems',
      department: 'Computer Science & Engineering',
      section: 'B.Tech CSE III',
      semester: 'Semester 5',
      classroom: 'Room 305',
      facultyId: 'usr-rajesh',
      facultyName: 'Dr. Rajesh Sharma',
      status: 'IN_PROGRESS',
      enrolledStudents: 58,
      notes: 'Module 4: Normalization (3NF & BCNF)'
    },
    {
      id: 'slot-3',
      dayOfWeek: 'Tuesday',
      startTime: '02:00 PM',
      endTime: '04:00 PM',
      subjectCode: 'CS-202P',
      subjectName: 'Python Programming Lab',
      department: 'Computer Science & Engineering',
      section: 'B.Tech CSE IV',
      semester: 'Semester 4',
      classroom: 'Computing Lab 4',
      facultyId: 'usr-rajesh',
      facultyName: 'Dr. Rajesh Sharma',
      status: 'SCHEDULED',
      enrolledStudents: 30,
      notes: 'Workstations Synced • Lab Test evaluation'
    },
    // Other CSE Department sessions today (Matches Image 5 HOD dashboard)
    {
      id: 'slot-4',
      dayOfWeek: 'Tuesday',
      startTime: '01:00 PM',
      endTime: '02:00 PM',
      subjectCode: 'CS-401',
      subjectName: 'Compiler Design',
      department: 'Computer Science & Engineering',
      section: 'B.Tech CSE IV',
      semester: 'Semester 7',
      classroom: 'Room 301',
      facultyId: 'usr-raman',
      facultyName: 'Prof. K. V. Raman',
      status: 'IN_PROGRESS',
      enrolledStudents: 52,
      notes: '48 / 52 attended'
    },
    {
      id: 'slot-5',
      dayOfWeek: 'Tuesday',
      startTime: '02:00 PM',
      endTime: '03:00 PM',
      subjectCode: 'CS-302',
      subjectName: 'Data Structures & Algorithms',
      department: 'Computer Science & Engineering',
      section: 'B.Tech CSE II',
      semester: 'Semester 3',
      classroom: 'Room 204',
      facultyId: 'usr-arun',
      facultyName: 'Dr. Arun Kumar',
      status: 'SUBSTITUTION_PENDING',
      enrolledStudents: 62,
      notes: 'Originally: Dr. Arun Kumar (On Leave) • Medical emergency'
    },
    {
      id: 'slot-6',
      dayOfWeek: 'Tuesday',
      startTime: '02:30 PM',
      endTime: '04:30 PM',
      subjectCode: 'CS-504P',
      subjectName: 'Machine Learning Practical',
      department: 'Computer Science & Engineering',
      section: 'B.Tech CSE III',
      semester: 'Semester 5',
      classroom: 'Computing Lab 4',
      facultyId: 'usr-sunita',
      facultyName: 'Dr. Sunita Rao',
      status: 'SCHEDULED',
      enrolledStudents: 45,
      notes: 'Assigned: Dr. Sunita Rao & 2 TAs (Ready)'
    },
    {
      id: 'slot-7',
      dayOfWeek: 'Tuesday',
      startTime: '03:30 PM',
      endTime: '04:30 PM',
      subjectCode: 'CS-603',
      subjectName: 'Cloud Computing Architecture',
      department: 'Computer Science & Engineering',
      section: 'B.Tech CSE IV',
      semester: 'Semester 7',
      classroom: 'Auditorium B',
      facultyId: 'usr-rajesh',
      facultyName: 'Dr. Rajesh Sharma',
      status: 'SCHEDULED',
      enrolledStudents: 75,
      notes: 'HOD Special Lecture'
    }
  ];

  leaveRequests: LeaveRequest[] = [
    {
      id: 'leave-101',
      facultyId: 'usr-arun',
      facultyName: 'Dr. Arun Kumar',
      facultyEmail: 'arun.kumar@takshashila.edu',
      department: 'Computer Science & Engineering',
      designation: 'Associate Professor',
      leaveType: 'Casual Leave',
      startDate: '2026-09-18',
      endDate: '2026-09-20',
      daysCount: 3,
      reason: 'Doctoral defense external examiner at IISc Bengaluru for thesis committee evaluation.',
      status: 'PENDING',
      appliedAt: '2026-09-15T09:30:00Z',
      attachmentName: 'IISc_Invitation_Letter.pdf'
    },
    {
      id: 'leave-102',
      facultyId: 'usr-priya',
      facultyName: 'Prof. S. Menon',
      facultyEmail: 'priya.menon@takshashila.edu',
      department: 'Computer Science & Engineering',
      designation: 'Professor',
      leaveType: 'Medical Leave',
      startDate: '2026-09-16',
      endDate: '2026-09-18',
      daysCount: 3,
      reason: 'Hospitalization and recuperation due to viral pneumonia.',
      status: 'APPROVED',
      appliedAt: '2026-09-14T14:15:00Z',
      reviewedBy: 'Dr. Rajesh Sharma',
      reviewedAt: '2026-09-14T16:15:00Z',
      reviewRemarks: 'Approved as Casual/Medical Grant. Please arrange substitute lectures.'
    },
    {
      id: 'leave-103',
      facultyId: 'usr-rajesh',
      facultyName: 'Dr. Rajesh Sharma',
      facultyEmail: 'rajesh.sharma@takshashila.edu',
      department: 'Computer Science & Engineering',
      designation: 'Assoc. Professor & HOD',
      leaveType: 'On Duty',
      startDate: '2026-09-28',
      endDate: '2026-09-29',
      daysCount: 2,
      reason: 'Keynote Speaker at IEEE International Conference on Cloud Paradigms.',
      status: 'APPROVED',
      appliedAt: '2026-09-10T11:00:00Z',
      reviewedBy: 'Dr. K. S. Somnath',
      reviewedAt: '2026-09-11T10:00:00Z',
      reviewRemarks: 'OD sanctioned. All classes to be pre-recorded or compensated.'
    }
  ];

  alternativeClasses: AlternativeClassAssignment[] = [
    // Matches Image 3 Action Required card:
    {
      id: 'alt-201',
      leaveRequestId: 'leave-102',
      originalFacultyId: 'usr-priya',
      originalFacultyName: 'Prof. S. Menon',
      subjectCode: 'CS-601',
      subjectName: 'Advanced Algorithms',
      date: '2026-09-16',
      startTime: '03:00 PM',
      endTime: '04:00 PM',
      classroom: 'Room 204',
      section: 'B.Tech CSE Sem 6',
      reason: 'Replaced: Prof. S. Menon (On Medical Leave)',
      assignedFacultyId: 'usr-rajesh',
      assignedFacultyName: 'Dr. Rajesh Sharma',
      assignedAt: '2026-09-16T08:00:00Z',
      status: 'OFFERED_TO_FACULTY',
      notes: 'Response requested by 1:30 PM'
    },
    // Matches Image 5 HOD dashboard card:
    {
      id: 'alt-202',
      leaveRequestId: 'leave-101',
      originalFacultyId: 'usr-arun',
      originalFacultyName: 'Dr. Arun Kumar',
      subjectCode: 'CS-302',
      subjectName: 'Data Structures & Algorithms',
      date: '2026-09-16',
      startTime: '02:00 PM',
      endTime: '03:00 PM',
      classroom: 'Room 204',
      section: 'B.Tech CSE II',
      reason: 'Medical emergency & conference absence',
      status: 'PENDING_FACULTY_ASSIGNMENT',
      notes: '62 Enrolled Students • Needs immediate substitute'
    }
  ];

  notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      userId: 'usr-rajesh',
      title: 'Substitute session requested',
      message: 'Advanced Algorithms (B.Tech CSE Sem 6) at 03:00 PM in Room 204. Replaced: Prof. S. Menon (On Medical Leave).',
      type: 'substitution',
      read: false,
      timestamp: 'Today at 08:30 AM',
      actionUrl: '/classes',
      actionPayload: { altId: 'alt-201' }
    },
    {
      id: 'notif-2',
      userId: 'usr-rajesh',
      title: 'Medical Leave approved by HOD',
      message: 'Casual Leave Grant for Prof. S. Menon processed and archived.',
      type: 'leave',
      read: true,
      timestamp: 'Yesterday at 4:15 PM'
    },
    {
      id: 'notif-3',
      userId: 'usr-rajesh',
      title: 'Timetable swap confirmed for Friday',
      message: 'Exchanged afternoon lab slot with Prof. S. Sen for upcoming NAAC accreditation prep.',
      type: 'timetable',
      read: true,
      timestamp: 'Oct 20 at 11:20 AM'
    },
    {
      id: 'notif-4',
      userId: 'usr-rajesh',
      title: 'Curriculum Review Meeting',
      message: 'Thursday, Oct 26 at 04:30 PM in Senate Hall. Agendas uploaded to academic drive.',
      type: 'announcement',
      read: true,
      timestamp: 'Oct 19 at 02:00 PM'
    },
    {
      id: 'notif-5',
      userId: 'usr-rajesh',
      title: 'New Leave Request: Dr. Arun Kumar',
      message: 'Dr. Arun Kumar has applied for Casual Leave (3 days, 18–20 Sep). Review required.',
      type: 'leave',
      read: false,
      timestamp: 'Today at 09:35 AM',
      actionUrl: '/leave'
    }
  ];

  auditLogs: AuditLog[] = [
    {
      id: 'audit-1',
      userId: 'usr-rajesh',
      userName: 'Dr. Rajesh Sharma',
      action: 'SUBSTITUTION_OFFERED',
      module: 'SUBSTITUTION',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: 'Offered substitute class CS-601 to Dr. Rajesh Sharma for Prof. S. Menon on medical leave'
    },
    {
      id: 'audit-2',
      userId: 'usr-arun',
      userName: 'Dr. Arun Kumar',
      action: 'LEAVE_SUBMITTED',
      module: 'LEAVE',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      details: 'Submitted Casual Leave for 3 days (18–20 Sep) - IISc external doctoral defense'
    },
    {
      id: 'audit-3',
      userId: 'usr-rajesh',
      userName: 'Dr. Rajesh Sharma',
      action: 'LEAVE_APPROVED',
      module: 'LEAVE',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      details: 'Approved Medical Leave request for Prof. S. Menon (3 days)'
    },
    {
      id: 'audit-4',
      userId: 'usr-admin',
      userName: 'Dr. K. S. Somnath',
      action: 'TIMETABLE_PUBLISHED',
      module: 'TIMETABLE',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      details: 'Fall Semester 2026 Academic Timetable validated and published across all departments'
    }
  ];

  // Helper methods
  findUserByEmail(email: string): UserProfile | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  logAction(userId: string, userName: string, action: string, module: AuditLog['module'], details: string, metadata?: any) {
    const log: AuditLog = {
      id: `audit-${Date.now()}`,
      userId,
      userName,
      action,
      module,
      timestamp: new Date().toISOString(),
      details,
      metadata
    };
    this.auditLogs.unshift(log);
    return log;
  }
}

export const db = new UniversityDataStore();
