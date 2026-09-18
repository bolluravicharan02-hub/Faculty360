/**
 * Centralized Academic Calendar Configuration for Takshashila University
 * Standardizes academic year, semester, and dynamic date formatting across all portals.
 */

export const ACADEMIC_CONFIG = {
  UNIVERSITY_NAME: 'Takshashila University',
  ACADEMIC_YEAR: (typeof process !== 'undefined' && process.env?.ACADEMIC_YEAR) || '2026-27',
  currentAcademicYear: '2026-27',
  currentSemester: 'Fall Semester 2026-27',
  startDate: '2026-08-01',
  endDate: '2026-12-20',
  SEMESTER_LABEL: 'Fall Semester 2026-27',
  TERM_LABEL: 'Academic Session 2026-27',
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
