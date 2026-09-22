import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CalendarDays,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  Check,
  Building,
  Monitor,
  Megaphone,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { TimetableSlot, AlternativeClassAssignment, AlternativeClassStatus } from '../types';
import {
  ACADEMIC_CONFIG,
  getCurrentDayName,
  getFormattedCurrentDate,
} from '../config/academic';
import { AcademicCalendarWidget } from '../components/dashboard/AcademicCalendarWidget';

interface FacultyHomeProps {
  onNavigate: (path: string) => void;
}

export const FacultyHome: React.FC<FacultyHomeProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [altClass, setAltClass] = useState<AlternativeClassAssignment | null>(null);
  const [altStatus, setAltStatus] = useState<AlternativeClassStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const cacheKey = `faculty360_home_cache_${user?.id || 'default'}`;

  // Hydrate from local cache immediately on mount
  useEffect(() => {
    if (!user?.id) return;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.timetable) && parsed.timetable.length > 0) {
          setTimetable(parsed.timetable);
        }
        if (parsed.altClass) {
          setAltClass(parsed.altClass);
          setAltStatus(parsed.altClass.status || null);
        }
      }
    } catch {}
  }, [user?.id, cacheKey]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async (retryAttempt = 0) => {
    if (!user?.id) return;
    try {
      if (retryAttempt === 0) {
        setIsLoading(true);
      } else {
        setIsRetrying(true);
      }
      setHasError(false);
      const currentDay = getCurrentDayName();
      const todayStr = new Date().toISOString().split('T')[0];

      // Query real timetable slots and alternative classes in parallel with Promise.allSettled
      const [slotsResult, altsResult] = await Promise.allSettled([
        api.getTimetable({ day: currentDay, date: todayStr, sessionDate: todayStr }),
        api.getAlternativeClasses(),
      ]);

      let anySuccess = false;
      let userSlots: TimetableSlot[] = [];

      if (slotsResult.status === 'fulfilled') {
        anySuccess = true;
        const allSlots = slotsResult.value;
        userSlots = allSlots.filter(
          (s) =>
            s.facultyId === user?.id ||
            s.substitutedBy === user?.id ||
            (user?.facultyId && s.facultyId === user.facultyId) ||
            (user?.facultyId && s.substitutedBy === user.facultyId)
        );
        setTimetable(userSlots);
      }

      let activeAlt: AlternativeClassAssignment | null = null;
      if (altsResult.status === 'fulfilled') {
        anySuccess = true;
        const alts = altsResult.value;
        const requested = alts.find(
          (a) =>
            (a.assignedFacultyId === user?.id || (user?.facultyId && a.assignedFacultyId === user.facultyId)) &&
            a.status === 'OFFERED_TO_FACULTY'
        );

        if (requested) {
          activeAlt = requested;
          setAltClass(requested);
          setAltStatus(requested.status);
        } else {
          setAltClass(null);
          setAltStatus(null);
        }
      }

      if (anySuccess) {
        setHasError(false);
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              timetable: userSlots.length > 0 ? userSlots : timetable,
              altClass: activeAlt,
              savedAt: Date.now(),
            })
          );
        } catch {}
      } else {
        // Both failed: attempt auto-retry if first try
        if (retryAttempt < 2) {
          setTimeout(() => {
            loadData(retryAttempt + 1);
          }, 1200);
          return;
        }
        setHasError(true);
      }
    } catch (err) {
      console.warn('Could not refresh faculty home data:', err);
      if (retryAttempt < 2) {
        setTimeout(() => {
          loadData(retryAttempt + 1);
        }, 1200);
        return;
      }
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const handleAction = async (action: 'accept' | 'decline') => {
    if (!altClass) return;
    try {
      await api.respondToAlternative(altClass.id, action, {
        id: user?.id,
        name: user?.name,
      });
      const newStatus: AlternativeClassStatus = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
      setAltStatus(newStatus);
      if (action === 'accept') {
        showToast(
          `Substitute session accepted! Added to your schedule at ${altClass.startTime}.`
        );
        loadData();
      } else {
        showToast('Substitute request declined.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const isPendingAction =
    altStatus === 'OFFERED_TO_FACULTY' || altStatus === 'PENDING_FACULTY_ASSIGNMENT';

  return (
    <div className="flex flex-col w-full font-sans">
      {/* Editorial Greeting Header */}
      <header className="mb-6 pt-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[11px] text-[#3947dd] uppercase tracking-widest font-semibold">
                Faculty Workspace
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-[11px] text-slate-500 font-medium">
                {user?.departmentName || 'Department of Computer Science & Engineering'}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1a146b] font-medium tracking-tight">
              Good morning, {user?.name || 'Faculty Member'}{' '}
              <span className="inline-block transition-transform hover:rotate-12 duration-200 cursor-default">
                👋
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Here's what's happening today <span className="text-slate-300 mx-1.5">•</span>{' '}
              {getFormattedCurrentDate()}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-xs border border-slate-100 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-[#3947dd] animate-pulse" />
              <span className="font-mono text-[11px] font-medium">
                {ACADEMIC_CONFIG.currentSemester}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Error state with retry */}
      {hasError && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Could not refresh live schedule from the database. Showing latest available view.</span>
          </div>
          <button
            type="button"
            disabled={isRetrying}
            onClick={() => loadData(0)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {isRetrying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isRetrying ? 'Reconnecting...' : 'Try Again'}</span>
          </button>
        </div>
      )}

      {/* Lightweight Summary Row */}
      <section aria-label="Quick metrics" className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Metric 1: Today's Classes */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-lg bg-[#f0f3ff] flex items-center justify-center text-[#1a146b] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Today's Classes
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-serif text-2xl text-[#1a146b] font-semibold">
                  {isLoading ? '...' : timetable.length}
                </span>
                <span className="text-xs text-slate-500">
                  {timetable.length === 1 ? 'lecture' : 'lectures'}
                </span>
              </div>
            </div>
          </div>

          {/* Metric 2: Leave Balance */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-lg bg-[#f0f3ff] flex items-center justify-center text-[#3947dd] shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Leave Balance
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-serif text-2xl text-[#1a146b] font-semibold">
                  {user?.leaveBalance?.total ?? 12}
                </span>
                <span className="text-xs text-slate-500">days remaining</span>
              </div>
            </div>
          </div>

          {/* Metric 3: Pending Action */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Pending Action
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-serif text-2xl text-rose-600 font-semibold">
                  {isPendingAction ? '1' : '0'}
                </span>
                <span className="text-xs text-slate-500">
                  {isPendingAction ? 'substitution' : 'resolved'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Calendar Almanac Widget */}
      <AcademicCalendarWidget onNavigate={onNavigate} className="mb-8" />

      {/* Asymmetric 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 1. ACTION REQUIRED BANNER (Real database alternative request) */}
          {isPendingAction && altClass && (
            <section aria-labelledby="action-required-heading">
              <div className="bg-[#fffbeb] border border-amber-200/60 rounded-xl p-5 shadow-xs transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-[#fef3c7] text-[#b45309] flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        id="action-required-heading"
                        className="font-mono text-[11px] text-[#b45309] font-semibold uppercase tracking-widest"
                      >
                        Action Required
                      </span>
                      <span className="font-mono text-[11px] text-[#b45309]/80">
                        {altClass.date || 'Today'} • Response Requested
                      </span>
                    </div>
                    <h2 className="font-serif text-lg text-slate-900 font-semibold tracking-tight">
                      Substitute session requested
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      <strong className="text-slate-800 font-medium">
                        {altClass.subjectName} ({altClass.subjectCode})
                      </strong>{' '}
                      at <strong className="text-slate-800 font-medium">{altClass.startTime}</strong> in{' '}
                      <strong className="text-slate-800 font-medium">{altClass.classroom}</strong>.
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                      <UserCheck className="w-3.5 h-3.5 text-[#b45309]" />
                      <span>
                        Coverage for:{' '}
                        <strong className="text-slate-800 font-medium">
                          {altClass.originalFacultyName}
                        </strong>{' '}
                        ({altClass.reason || 'Approved Institutional Leave'})
                      </span>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-3 mt-4 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAction('accept')}
                        className="px-4 py-2 rounded-xl bg-[#312e81] text-white text-xs font-medium hover:bg-[#1a146b] shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Session</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction('decline')}
                        className="px-4 py-2 rounded-xl bg-white text-slate-600 hover:text-slate-900 text-xs font-medium hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {altStatus === 'ACCEPTED' && altClass && (
            <div className="bg-[#ecfdf5] border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-medium">Substitute session accepted</p>
                <p className="text-xs text-emerald-700">
                  Added to today's schedule at {altClass.startTime} in {altClass.classroom} (
                  {altClass.subjectName}).
                </p>
              </div>
            </div>
          )}

          {altStatus === 'DECLINED' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400" />
              <span>Substitute request was declined. The HOD has been notified.</span>
            </div>
          )}

          {/* 2. TODAY'S SCHEDULE (Dynamic from Database) */}
          <section aria-labelledby="schedule-heading">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  Timeline
                </span>
                <h2
                  id="schedule-heading"
                  className="font-serif text-2xl text-[#1a146b] font-medium tracking-tight"
                >
                  Today's Schedule
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('schedule')}
                className="text-xs text-[#3947dd] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>View weekly calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-xl p-8 border border-slate-100 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-[#312e81] mb-2" />
                <span>Loading scheduled classes...</span>
              </div>
            ) : timetable.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-slate-100 text-center">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">No classes scheduled today.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Enjoy your preparation and research hours.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {timetable.map((slot) => {
                  const isCompleted = slot.status === 'COMPLETED';
                  const isInProgress = slot.status === 'IN_PROGRESS';
                  const isSub = Boolean(slot.substitutedBy || slot.substitutedByName);

                  return (
                    <div
                      key={slot.id}
                      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border transition-all duration-150 ${
                        isInProgress
                          ? 'border-indigo-200 shadow-[0_4px_16px_-2px_rgba(49,46,129,0.06)]'
                          : 'border-slate-100 shadow-xs hover:shadow-md'
                      }`}
                    >
                      {isInProgress && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#3947dd] rounded-r" />
                      )}
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        <div className="w-16 flex flex-col shrink-0">
                          <span
                            className={`font-mono text-sm font-semibold ${
                              isInProgress ? 'text-[#3947dd]' : 'text-slate-900'
                            }`}
                          >
                            {slot.startTime.split(' ')[0]}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 uppercase">
                            {slot.startTime.split(' ')[1] || 'AM'}
                          </span>
                        </div>
                        <div className="w-1 h-8 rounded-full bg-slate-200 shrink-0 hidden sm:block" />
                        <div className="flex flex-col min-w-0">
                          <h3
                            className={`text-base font-medium truncate ${
                              isInProgress ? 'text-[#1a146b] font-semibold' : 'text-slate-900'
                            }`}
                          >
                            {slot.subjectName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-500 text-xs mt-0.5">
                            <span>{slot.section || slot.semester}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              {slot.classroom}
                            </span>
                            {slot.enrolledStudents && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>{slot.enrolledStudents} Students</span>
                              </>
                            )}
                            {isSub && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-amber-700 font-medium">
                                  Substituted: {slot.substitutedByName || 'Assigned Faculty'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 sm:mt-0 flex items-center sm:self-center shrink-0 pl-20 sm:pl-0">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#047857] font-mono text-[11px] font-medium uppercase tracking-wide">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#e0e0ff] text-[#000668] font-mono text-[11px] font-semibold uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3947dd] animate-pulse" />
                            In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f0f3ff] text-slate-600 font-mono text-[11px] font-medium uppercase tracking-wide">
                            Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* 1. QUICK ACTIONS */}
          <section aria-labelledby="quick-actions-heading">
            <div className="mb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                Shortcuts
              </span>
              <h2
                id="quick-actions-heading"
                className="font-serif text-xl text-[#1a146b] font-medium tracking-tight"
              >
                Quick Actions
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate('leave')}
                className="group flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow hover:bg-[#f0f3ff]/50 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f0f3ff] text-[#1a146b] flex items-center justify-center group-hover:bg-[#312e81] group-hover:text-white transition-colors">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-800">Apply for Leave</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('schedule')}
                className="group flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow hover:bg-[#f0f3ff]/50 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f0f3ff] text-[#1a146b] flex items-center justify-center group-hover:bg-[#312e81] group-hover:text-white transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-800">View Weekly Schedule</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('classes')}
                className="group flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow hover:bg-[#f0f3ff]/50 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f0f3ff] text-[#1a146b] flex items-center justify-center group-hover:bg-[#312e81] group-hover:text-white transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-800">Substitute Classes Log</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </section>

          {/* 2. RECENT UPDATES */}
          <section aria-labelledby="updates-heading">
            <div className="mb-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                Activity
              </span>
              <h2
                id="updates-heading"
                className="font-serif text-xl text-[#1a146b] font-medium tracking-tight"
              >
                Recent Updates
              </h2>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#ecfdf5] text-[#047857] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate-900 font-medium leading-snug">
                    Department Timetable Active
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 mt-0.5">
                    {ACADEMIC_CONFIG.currentSemester} • Verified
                  </span>
                </div>
              </div>

              <div className="h-[1px] w-full bg-slate-100" />

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#e0e0ff] text-[#000668] flex items-center justify-center shrink-0 mt-0.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate-900 font-medium leading-snug">
                    Automated substitution routing active
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 mt-0.5">
                    Live schedule coverage for on-leave faculty
                  </span>
                </div>
              </div>

              <div className="h-[1px] w-full bg-slate-100" />

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#f0f3ff] text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate-900 font-medium leading-snug">
                    Attendance records verified
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 mt-0.5">
                    Synchronized with university registry
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. DEPARTMENT NOTICE CARD */}
          <div className="bg-[#f0f3ff] rounded-xl p-5 border border-indigo-50 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#3947dd] font-mono text-[11px] uppercase font-semibold">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Academic Notice</span>
            </div>
            <p className="font-serif text-base text-[#1a146b] font-medium mt-0.5">
              Faculty Academic Session
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              All faculty members are requested to mark attendance and verify class syllabus
              progression for {ACADEMIC_CONFIG.currentSemester}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
