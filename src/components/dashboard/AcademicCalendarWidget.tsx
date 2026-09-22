import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CalendarDays,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Sun,
  FileText,
  ExternalLink,
  X,
  Info,
  ArrowRight,
  RefreshCw,
  Bell,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  AcademicCalendarData,
  AcademicHoliday,
  ExamDeadline,
  AcademicWeekDay,
} from '../../types';
import { ACADEMIC_CONFIG, getAcademicCalendarData } from '../../config/academic';

interface AcademicCalendarWidgetProps {
  onNavigate?: (path: string) => void;
  className?: string;
  variant?: 'full' | 'compact';
}

export const AcademicCalendarWidget: React.FC<AcademicCalendarWidgetProps> = ({
  onNavigate,
  className = '',
  variant = 'full',
}) => {
  // Initialize with deterministic instant local data to prevent layout shift
  const [calendarData, setCalendarData] = useState<AcademicCalendarData>(() =>
    getAcademicCalendarData(new Date())
  );
  const [activeTab, setActiveTab] = useState<'all' | 'week' | 'holidays' | 'exams'>('all');
  const [selectedDay, setSelectedDay] = useState<AcademicWeekDay | null>(null);
  const [isAlmanacModalOpen, setIsAlmanacModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadLiveCalendar();
  }, []);

  const loadLiveCalendar = async () => {
    try {
      setIsRefreshing(true);
      const data = await api.getAcademicCalendar();
      setCalendarData(data);
      // Select today by default if available
      const today = data.currentWeek.days.find((d) => d.isToday);
      if (today) {
        setSelectedDay(today);
      } else if (data.currentWeek.days.length > 0) {
        setSelectedDay(data.currentWeek.days[0]);
      }
    } catch (err) {
      console.warn('AcademicCalendarWidget: loaded fallback config', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const { currentWeek, upcomingHolidays, examDeadlines } = calendarData;
  const nextHoliday = upcomingHolidays.find((h) => h.isNextUpcoming) || upcomingHolidays[0];
  const nextExam = examDeadlines.find((e) => !e.isPassed) || examDeadlines[0];

  return (
    <div
      id="academic-calendar-widget"
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow overflow-hidden ${className}`}
    >
      {/* Widget Header */}
      <div
        id="academic-calendar-header"
        className="px-5 py-4 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#312e81] text-white flex items-center justify-center shadow-xs shrink-0">
            <GraduationCap className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-wider uppercase font-semibold text-[#3947dd]">
                Academic Almanac
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-[11px] text-slate-500 font-medium">
                {currentWeek.academicYear}
              </span>
            </div>
            <h2
              id="academic-calendar-title"
              className="font-serif text-lg sm:text-xl text-[#1a146b] font-medium tracking-tight"
            >
              Academic Calendar & Milestones
            </h2>
          </div>
        </div>

        {/* View Switcher / Quick Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div
            id="academic-calendar-tabs"
            className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60 text-xs"
          >
            <button
              type="button"
              id="tab-btn-all"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-[#1a146b] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              id="tab-btn-week"
              onClick={() => setActiveTab('week')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'week'
                  ? 'bg-white text-[#1a146b] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Week {currentWeek.weekNumber}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>
            <button
              type="button"
              id="tab-btn-holidays"
              onClick={() => setActiveTab('holidays')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'holidays'
                  ? 'bg-white text-[#1a146b] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Holidays</span>
              <span className="px-1 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-semibold">
                {upcomingHolidays.length}
              </span>
            </button>
            <button
              type="button"
              id="tab-btn-exams"
              onClick={() => setActiveTab('exams')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'exams'
                  ? 'bg-white text-[#1a146b] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Exams</span>
              <span className="px-1 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-semibold">
                {examDeadlines.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            id="open-almanac-modal-btn"
            onClick={() => setIsAlmanacModalOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-[#1a146b] hover:bg-slate-100 transition-colors"
            title="View Full Semester Almanac"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-5 flex flex-col gap-6">
        {/* 1. CURRENT WEEK STRIP & SEMESTER PROGRESSION (Visible in 'all' and 'week' tabs) */}
        {(activeTab === 'all' || activeTab === 'week') && (
          <section id="current-week-section" aria-label="Current academic week">
            <div className="bg-[#f8faff] rounded-xl p-4 sm:p-5 border border-indigo-100/70">
              {/* Top Row: Week status & Semester Progress */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#312e81] text-white flex items-center justify-center font-serif font-bold text-base shadow-xs shrink-0">
                    W{currentWeek.weekNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#1a146b]">
                        Week {currentWeek.weekNumber} of {currentWeek.totalWeeks}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Active Week
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {currentWeek.phaseTitle}
                    </p>
                  </div>
                </div>

                {/* Progress Metric */}
                <div className="flex flex-col sm:items-end gap-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Semester Progress:</span>
                    <span className="font-mono font-semibold text-[#1a146b]">
                      {currentWeek.progressPercent}%
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium">
                      {currentWeek.daysRemainingInSemester} days left
                    </span>
                  </div>
                  {/* Visual Bar */}
                  <div className="w-full sm:w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3947dd] rounded-full transition-all duration-500"
                      style={{ width: `${currentWeek.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Day-by-Day Interactive Week Strip */}
              <div className="mb-3">
                <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Current Teaching Week Dates</span>
                  <span className="font-sans font-medium lowercase text-slate-400">
                    Click day for activity schedule
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {currentWeek.days.map((day) => {
                    const isSelected = selectedDay?.date === day.date;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        id={`calendar-day-btn-${day.dayName.toLowerCase()}`}
                        onClick={() => setSelectedDay(day)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                          day.isToday
                            ? 'bg-[#1a146b] text-white border-[#1a146b] shadow-sm'
                            : isSelected
                            ? 'bg-white border-[#3947dd] text-slate-900 shadow-xs ring-2 ring-indigo-100'
                            : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700 hover:bg-slate-50/80'
                        }`}
                      >
                        <span
                          className={`font-mono text-[10px] uppercase font-semibold ${
                            day.isToday ? 'text-indigo-200' : 'text-slate-500'
                          }`}
                        >
                          {day.dayName}
                        </span>
                        <span
                          className={`font-serif text-lg font-bold my-0.5 ${
                            day.isToday ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {day.dayOfMonth}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium truncate max-w-full ${
                            day.isToday
                              ? 'bg-indigo-700/80 text-white'
                              : !day.isInstructional
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {day.isToday ? 'Today' : day.isInstructional ? 'Class' : 'Holiday'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day Context Banner */}
              {selectedDay && (
                <div
                  id="selected-day-details-banner"
                  className="mt-3 p-3 rounded-lg bg-white border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-[#3947dd] shrink-0" />
                    <span className="font-semibold text-slate-900">
                      {selectedDay.dayName}, {selectedDay.date}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>{selectedDay.activityLabel || 'Regular Teaching & Department Hours'}</span>
                  </div>
                  {onNavigate && (
                    <button
                      type="button"
                      id="view-schedule-link-btn"
                      onClick={() => onNavigate('schedule')}
                      className="text-xs font-semibold text-[#3947dd] hover:text-[#1a146b] flex items-center gap-1 self-start sm:self-auto hover:underline"
                    >
                      <span>View Timetable</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 2. UPCOMING HOLIDAYS & EXAM DEADLINES (Overview or Filtered) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUMN A: UPCOMING HOLIDAYS */}
          {(activeTab === 'all' || activeTab === 'holidays') && (
            <section
              id="upcoming-holidays-section"
              aria-labelledby="upcoming-holidays-heading"
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h3
                      id="upcoming-holidays-heading"
                      className="font-serif text-base text-[#1a146b] font-medium"
                    >
                      Upcoming Holidays
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Takshashila University Gazetted & Institutional Recesses
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {upcomingHolidays.length} Remaining
                </span>
              </div>

              {/* Spotlight: Next Holiday Card */}
              {nextHoliday && (
                <div
                  id="spotlight-holiday-card"
                  className="p-4 rounded-xl bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 border border-amber-200/80 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-amber-100 text-amber-900 border border-amber-200">
                        Next Holiday
                      </span>
                      <span className="text-xs text-slate-500">
                        {nextHoliday.durationDays === 1 ? '1 Day' : `${nextHoliday.durationDays} Days`}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                      {nextHoliday.daysUntil === 0
                        ? 'Today!'
                        : `In ${nextHoliday.daysUntil} ${nextHoliday.daysUntil === 1 ? 'day' : 'days'}`}
                    </span>
                  </div>

                  <h4 className="font-serif text-lg font-semibold text-slate-900">
                    {nextHoliday.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-900 mt-1">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-700" />
                    <span>
                      {nextHoliday.startDate === nextHoliday.endDate
                        ? nextHoliday.startDate
                        : `${nextHoliday.startDate} to ${nextHoliday.endDate}`}
                    </span>
                    <span className="text-amber-400">•</span>
                    <span className="text-slate-600">{nextHoliday.type} Holiday</span>
                  </div>
                  {nextHoliday.description && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {nextHoliday.description}
                    </p>
                  )}
                </div>
              )}

              {/* Holidays List */}
              <div id="holidays-list" className="flex flex-col gap-2">
                {upcomingHolidays.slice(activeTab === 'holidays' ? 0 : 1, 4).map((holiday) => (
                  <div
                    key={holiday.id}
                    id={`holiday-item-${holiday.id}`}
                    className="p-3 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-mono text-slate-400 uppercase">
                          {holiday.startDate.split('-')[1] === '10'
                            ? 'OCT'
                            : holiday.startDate.split('-')[1] === '11'
                            ? 'NOV'
                            : 'DEC'}
                        </span>
                        <span className="font-bold text-xs text-slate-800 leading-none">
                          {holiday.startDate.split('-')[2]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 truncate">
                            {holiday.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium bg-slate-100 text-slate-600">
                            {holiday.type}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                          {holiday.startDate === holiday.endDate
                            ? holiday.startDate
                            : `${holiday.startDate} – ${holiday.endDate}`}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-medium text-slate-500 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      In {holiday.daysUntil}d
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* COLUMN B: EXAM DEADLINES & MILESTONES */}
          {(activeTab === 'all' || activeTab === 'exams') && (
            <section
              id="exam-deadlines-section"
              aria-labelledby="exam-deadlines-heading"
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3
                      id="exam-deadlines-heading"
                      className="font-serif text-base text-[#1a146b] font-medium"
                    >
                      Exam Deadlines & Milestones
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Question papers, continuous assessment, and terminal exams
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {examDeadlines.length} Milestones
                </span>
              </div>

              {/* Spotlight: Next Immediate Exam Deadline */}
              {nextExam && (
                <div
                  id="spotlight-exam-card"
                  className="p-4 rounded-xl bg-gradient-to-br from-rose-50/70 via-white to-indigo-50/30 border border-rose-200/80 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-rose-100 text-rose-900 border border-rose-200">
                        {nextExam.category}
                      </span>
                      {nextExam.priority === 'CRITICAL' && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-red-600 text-white">
                          Critical
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs font-bold text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded-md">
                      Due in {nextExam.daysUntil} days
                    </span>
                  </div>

                  <h4 className="font-serif text-lg font-semibold text-slate-900">
                    {nextExam.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs font-medium text-rose-900 mt-1">
                    <Clock className="w-3.5 h-3.5 text-rose-700" />
                    <span>Target Date: {nextExam.deadlineDate}</span>
                    {nextExam.statusText && (
                      <>
                        <span className="text-rose-400">•</span>
                        <span className="text-slate-600">{nextExam.statusText}</span>
                      </>
                    )}
                  </div>
                  {nextExam.description && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {nextExam.description}
                    </p>
                  )}
                </div>
              )}

              {/* Deadlines List */}
              <div id="exam-deadlines-list" className="flex flex-col gap-2">
                {examDeadlines.slice(activeTab === 'exams' ? 0 : 1, 4).map((exam) => (
                  <div
                    key={exam.id}
                    id={`exam-item-${exam.id}`}
                    className="p-3 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-[#3947dd]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 truncate">
                            {exam.title}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                              exam.priority === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : exam.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {exam.priority}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                          {exam.category} • Target: {exam.deadlineDate}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-medium text-slate-600 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      In {exam.daysUntil}d
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer Quick Links & Synchronized Status */}
        <div
          id="calendar-widget-footer"
          className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Takshashila Academic Almanac Synchronized</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-[11px] text-slate-400">
              Session {ACADEMIC_CONFIG.ACADEMIC_YEAR}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="view-almanac-text-btn"
              onClick={() => setIsAlmanacModalOpen(true)}
              className="text-[#3947dd] hover:text-[#1a146b] font-medium flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>View Full Semester Almanac</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* FULL SEMESTER ALMANAC MODAL */}
      {isAlmanacModalOpen && (
        <div
          id="semester-almanac-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#312e81] text-white flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#1a146b]">
                    Takshashila University Academic Almanac
                  </h3>
                  <p className="text-xs text-slate-500">
                    {ACADEMIC_CONFIG.currentSemester} • Schedule of Instruction & Examinations
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="close-almanac-modal-btn"
                onClick={() => setIsAlmanacModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs">
              {/* Semester Milestones Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="font-mono text-[10px] text-slate-400 uppercase">Commencement</span>
                  <p className="font-serif text-base font-semibold text-slate-900 mt-0.5">Aug 01, 2026</p>
                  <span className="text-[11px] text-slate-500">Classes Start</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="font-mono text-[10px] text-slate-400 uppercase">Mid-Term Exams</span>
                  <p className="font-serif text-base font-semibold text-slate-900 mt-0.5">Oct 12, 2026</p>
                  <span className="text-[11px] text-slate-500">Week 11</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="font-mono text-[10px] text-slate-400 uppercase">Terminal Exams</span>
                  <p className="font-serif text-base font-semibold text-slate-900 mt-0.5">Dec 07, 2026</p>
                  <span className="text-[11px] text-slate-500">End-Term Theory</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="font-mono text-[10px] text-slate-400 uppercase">Semester Closes</span>
                  <p className="font-serif text-base font-semibold text-slate-900 mt-0.5">Dec 20, 2026</p>
                  <span className="text-[11px] text-slate-500">Winter Recess</span>
                </div>
              </div>

              {/* Complete Holidays Table */}
              <div>
                <h4 className="font-serif text-sm font-semibold text-[#1a146b] mb-2 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span>Official University Holidays (Fall 2026)</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px]">
                        <th className="py-2.5 px-3">Holiday Name</th>
                        <th className="py-2.5 px-3">Dates</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Classification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {upcomingHolidays.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-900">{h.name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {h.startDate === h.endDate ? h.startDate : `${h.startDate} to ${h.endDate}`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {h.durationDays === 1 ? '1 Day' : `${h.durationDays} Days`}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {h.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Complete Examination & Deadline Milestones */}
              <div>
                <h4 className="font-serif text-sm font-semibold text-[#1a146b] mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <span>Academic Deadlines & Evaluation Milestones</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px]">
                        <th className="py-2.5 px-3">Milestone</th>
                        <th className="py-2.5 px-3">Deadline Date</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Urgency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {examDeadlines.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-slate-900 block">{e.title}</span>
                            <span className="text-[10px] text-slate-400">{e.description}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {e.deadlineDate}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                              {e.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                e.priority === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-800'
                                  : e.priority === 'HIGH'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {e.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Office of the Dean (Academic Affairs) • Takshashila
              </span>
              <button
                type="button"
                id="almanac-modal-close-confirm"
                onClick={() => setIsAlmanacModalOpen(false)}
                className="px-4 py-2 bg-[#312e81] hover:bg-[#1a146b] text-white rounded-lg font-medium text-xs transition-colors"
              >
                Close Almanac
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
