/**
 * Centralized Academic Calendar Configuration for Takshashila University
 * Standardizes academic year, semester, and dynamic date formatting across all portals.
 */

import {
  AcademicCalendarData,
  AcademicHoliday,
  ExamDeadline,
  AcademicWeekDay,
  AcademicWeekInfo,
} from '../types';

/**
 * Centralized Academic Calendar Configuration for Takshashila University
 * Standardizes academic year, semester, dynamic date formatting, holidays, and exam deadlines across all portals.
 */

const resolvedAcademicYear =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ACADEMIC_YEAR) ||
  (typeof process !== 'undefined' && process.env?.ACADEMIC_YEAR) ||
  '2026-2027';

export const ACADEMIC_CONFIG = {
  UNIVERSITY_NAME: 'Takshashila University',
  ACADEMIC_YEAR: resolvedAcademicYear,
  currentAcademicYear: resolvedAcademicYear,
  currentSemester: `Fall Semester ${resolvedAcademicYear}`,
  startDate: '2026-08-01',
  endDate: '2026-12-20',
  totalSemesterWeeks: 16,
  SEMESTER_LABEL: `Fall Semester ${resolvedAcademicYear}`,
  TERM_LABEL: `Academic Session ${resolvedAcademicYear}`,
} as const;

export const currentAcademicYear = ACADEMIC_CONFIG.currentAcademicYear;
export const currentSemester = ACADEMIC_CONFIG.currentSemester;
export const startDate = ACADEMIC_CONFIG.startDate;
export const endDate = ACADEMIC_CONFIG.endDate;

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function getCurrentDayName(): string {
  const dayIndex = new Date().getDay();
  return WEEKDAY_NAMES[dayIndex];
}

export function getFormattedCurrentDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Master Institutional Holidays List for Takshashila University (Fall 2026)
export const INSTITUTIONAL_HOLIDAYS: Array<Omit<AcademicHoliday, 'daysUntil' | 'isNextUpcoming'>> = [
  {
    id: 'hol-gandhi-jayanti-2026',
    name: 'Gandhi Jayanti',
    startDate: '2026-10-02',
    endDate: '2026-10-02',
    durationDays: 1,
    type: 'National',
    description: 'National holiday commemorating Mahatma Gandhi’s birth anniversary. All administrative offices and classes closed.',
  },
  {
    id: 'hol-dussehra-break-2026',
    name: 'Dussehra / Autumn Recess',
    startDate: '2026-10-19',
    endDate: '2026-10-23',
    durationDays: 5,
    type: 'Institutional',
    description: 'Annual autumn mid-term recess for students and academic staff following Mid-Term Examinations.',
  },
  {
    id: 'hol-diwali-2026',
    name: 'Diwali Festival Break',
    startDate: '2026-11-08',
    endDate: '2026-11-12',
    durationDays: 5,
    type: 'National',
    description: 'Deepavali institutional break. Campus libraries operate under holiday schedule.',
  },
  {
    id: 'hol-guru-nanak-2026',
    name: 'Guru Nanak Jayanti',
    startDate: '2026-11-24',
    endDate: '2026-11-24',
    durationDays: 1,
    type: 'Gazetted',
    description: 'University gazetted holiday observing Prakash Utsav.',
  },
  {
    id: 'hol-winter-recess-2026',
    name: 'Winter Vacation / Christmas',
    startDate: '2026-12-25',
    endDate: '2026-12-31',
    durationDays: 7,
    type: 'Institutional',
    description: 'Winter inter-semester break preceding Spring 2027 semester commencement.',
  },
];

// Master Examination & Academic Deadlines for Takshashila University (Fall 2026)
export const INSTITUTIONAL_EXAM_DEADLINES: Array<Omit<ExamDeadline, 'daysUntil' | 'isPassed'>> = [
  {
    id: 'exam-midterm-papers-2026',
    title: 'Mid-Term Question Paper & Syllabus Submission',
    deadlineDate: '2026-10-05',
    category: 'Syllabus & Papers',
    priority: 'HIGH',
    affectedRoles: ['Faculty', 'HOD'],
    description: 'Faculty must submit digitized mid-term question paper sets to the Department Exam Committee via Faculty360 portal.',
    statusText: 'Moderation Portal Open',
  },
  {
    id: 'exam-midterm-window-2026',
    title: 'Odd Semester Mid-Term Examinations',
    deadlineDate: '2026-10-12',
    category: 'Mid-Term Exam',
    priority: 'CRITICAL',
    affectedRoles: ['Faculty', 'HOD', 'Students'],
    description: 'Centralized mid-term examinations for B.Tech, M.Tech, and MCA batches across academic blocks.',
    statusText: 'Classrooms Allocated',
  },
  {
    id: 'exam-midterm-marks-2026',
    title: 'Mid-Term Evaluation & Marks Submission Deadline',
    deadlineDate: '2026-10-26',
    category: 'Marks Submission',
    priority: 'HIGH',
    affectedRoles: ['Faculty', 'HOD'],
    description: 'Mandatory deadline to publish evaluated answer booklets and lock internal assessment scores on ERP.',
    statusText: 'Gradebook Entry Active',
  },
  {
    id: 'exam-lab-viva-2026',
    title: 'Practical Laboratory & Project Viva Examinations',
    deadlineDate: '2026-11-23',
    category: 'Practical / Viva',
    priority: 'NORMAL',
    affectedRoles: ['Faculty', 'Lab Instructors'],
    description: 'End-term practical examinations and software viva with external/internal jury evaluation.',
    statusText: 'Lab Slots Scheduled',
  },
  {
    id: 'exam-endterm-theory-2026',
    title: 'End-Term Comprehensive Theory Examinations',
    deadlineDate: '2026-12-07',
    category: 'End-Term Exam',
    priority: 'CRITICAL',
    affectedRoles: ['Faculty', 'HOD', 'Students'],
    description: 'University terminal examinations conducted under Chief Superintendent supervision.',
    statusText: 'Hall Tickets Released',
  },
  {
    id: 'exam-grades-freeze-2026',
    title: 'Final Gradebook Freezing & Senate Approval',
    deadlineDate: '2026-12-24',
    category: 'Marks Submission',
    priority: 'CRITICAL',
    affectedRoles: ['Faculty', 'HOD', 'Dean Academic'],
    description: 'Strict cut-off for semester CGPA/SGPA computation and submission to Controller of Examinations.',
    statusText: 'Senate Review Pending',
  },
];

/**
 * Computes dynamic academic week, day strip, upcoming holidays, and exam deadlines
 * relative to the current date or provided date.
 */
export function getAcademicCalendarData(referenceDate: Date = new Date()): AcademicCalendarData {
  // Normalize reference date to midnight UTC/Local
  const now = new Date(referenceDate);
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const nowDate = now.getDate();
  const todayMidnight = new Date(nowYear, nowMonth, nowDate).getTime();

  // Semester bounds
  const [startYear, startMonth, startDay] = ACADEMIC_CONFIG.startDate.split('-').map(Number);
  const semesterStart = new Date(startYear, startMonth - 1, startDay).getTime();
  const [endYear, endMonth, endDay] = ACADEMIC_CONFIG.endDate.split('-').map(Number);
  const semesterEnd = new Date(endYear, endMonth - 1, endDay).getTime();

  // Calculate week number (1-based)
  const diffDaysFromStart = Math.floor((todayMidnight - semesterStart) / (1000 * 60 * 60 * 24));
  let weekNumber = Math.floor(diffDaysFromStart / 7) + 1;
  if (weekNumber < 1) weekNumber = 1;
  if (weekNumber > ACADEMIC_CONFIG.totalSemesterWeeks) weekNumber = ACADEMIC_CONFIG.totalSemesterWeeks;

  // Days remaining in semester
  const daysRemainingInSemester = Math.max(
    0,
    Math.ceil((semesterEnd - todayMidnight) / (1000 * 60 * 60 * 24))
  );

  // Progress percentage
  const totalSemesterDuration = Math.max(1, semesterEnd - semesterStart);
  const elapsedDuration = Math.max(0, Math.min(totalSemesterDuration, todayMidnight - semesterStart));
  const progressPercent = Math.round((elapsedDuration / totalSemesterDuration) * 100);

  // Current day index (0 = Sunday, 1 = Monday, ...)
  const currentDayOfWeek = now.getDay();
  // Monday of the current week:
  const dayOffsetToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const mondayDate = new Date(nowYear, nowMonth, nowDate + dayOffsetToMonday);

  // Construct Monday to Saturday (6 working days in Indian collegiate timetable)
  const days: AcademicWeekDay[] = [];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 6; i++) {
    const d = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const isToday =
      d.getFullYear() === nowYear &&
      d.getMonth() === nowMonth &&
      d.getDate() === nowDate;

    // Check if this date is a holiday
    const matchedHoliday = INSTITUTIONAL_HOLIDAYS.find(
      (h) => dateStr >= h.startDate && dateStr <= h.endDate
    );

    days.push({
      date: dateStr,
      dayName: dayLabels[i],
      dayOfMonth: d.getDate(),
      isToday,
      isInstructional: !matchedHoliday,
      activityLabel: matchedHoliday ? matchedHoliday.name : i === 5 ? 'Labs & Faculty Hours' : 'Instructional Classes',
      eventNote: matchedHoliday ? `Holiday: ${matchedHoliday.name}` : undefined,
    });
  }

  // Determine current academic phase title & description
  let phaseTitle = 'Mid-Term Instruction & Syllabus Progression';
  let phaseDescription = 'Curriculum delivery is at 50% target. Ensure student attendance registers and lecture notes are updated.';
  if (weekNumber <= 4) {
    phaseTitle = 'Foundation & Course Orientation';
    phaseDescription = 'Syllabus introduction, prerequisites review, and laboratory safety briefings underway.';
  } else if (weekNumber >= 7 && weekNumber <= 9) {
    phaseTitle = 'Mid-Term Preparation & Assessments';
    phaseDescription = 'Preparation of mid-term question sets and laboratory continuous evaluation marks collation.';
  } else if (weekNumber >= 10 && weekNumber <= 13) {
    phaseTitle = 'Advanced Topics & Practical Viva Preparation';
    phaseDescription = 'Capstone projects, advanced elective units, and mock lab examinations active across departments.';
  } else if (weekNumber >= 14) {
    phaseTitle = 'End-Term Revision & Final Examination Period';
    phaseDescription = 'Syllabus completion review, clearance slips, and end-term examination invigilation schedules.';
  }

  const currentWeek: AcademicWeekInfo = {
    weekNumber,
    totalWeeks: ACADEMIC_CONFIG.totalSemesterWeeks,
    academicYear: resolvedAcademicYear,
    semesterName: ACADEMIC_CONFIG.currentSemester,
    startDate: days[0]?.date || '2026-09-21',
    endDate: days[days.length - 1]?.date || '2026-09-26',
    phaseTitle,
    phaseDescription,
    days,
    progressPercent,
    daysRemainingInSemester,
  };

  // Compute upcoming holidays relative to referenceDate
  let upcomingHolidays: AcademicHoliday[] = INSTITUTIONAL_HOLIDAYS.map((h) => {
    const [hy, hm, hd] = h.startDate.split('-').map(Number);
    const holidayStart = new Date(hy, hm - 1, hd).getTime();
    const daysUntil = Math.ceil((holidayStart - todayMidnight) / (1000 * 60 * 60 * 24));
    return {
      ...h,
      daysUntil: Math.max(0, daysUntil),
      isNextUpcoming: false,
    };
  }).filter((h) => {
    // Show upcoming or ongoing within this semester
    const [hy, hm, hd] = h.endDate.split('-').map(Number);
    const holidayEnd = new Date(hy, hm - 1, hd).getTime();
    return holidayEnd >= todayMidnight;
  });

  // Sort by startDate
  upcomingHolidays.sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (upcomingHolidays.length > 0) {
    upcomingHolidays[0].isNextUpcoming = true;
  }

  // Compute exam deadlines relative to referenceDate
  const examDeadlines: ExamDeadline[] = INSTITUTIONAL_EXAM_DEADLINES.map((ed) => {
    const [ey, em, eday] = ed.deadlineDate.split('-').map(Number);
    const deadlineTime = new Date(ey, em - 1, eday).getTime();
    const daysUntil = Math.ceil((deadlineTime - todayMidnight) / (1000 * 60 * 60 * 24));
    return {
      ...ed,
      daysUntil: Math.max(0, daysUntil),
      isPassed: daysUntil < 0,
    };
  }).sort((a, b) => a.deadlineDate.localeCompare(b.deadlineDate));

  return {
    institution: ACADEMIC_CONFIG.UNIVERSITY_NAME,
    currentSemester: ACADEMIC_CONFIG.currentSemester,
    academicYear: resolvedAcademicYear,
    currentWeek,
    upcomingHolidays,
    examDeadlines,
    totalHolidaysCount: upcomingHolidays.length,
    totalExamDeadlinesCount: examDeadlines.length,
  };
}
