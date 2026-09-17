import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CalendarDays,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Send,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  Check,
  Building,
  Monitor,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { TimetableSlot, AlternativeClassAssignment } from '../types';

interface FacultyHomeProps {
  onNavigate: (path: string) => void;
}

export const FacultyHome: React.FC<FacultyHomeProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [altClass, setAltClass] = useState<AlternativeClassAssignment | null>(null);
  const [altStatus, setAltStatus] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [slots, alts] = await Promise.all([
        api.getTimetable({ day: 'Tuesday' }),
        api.getAlternativeClasses()
      ]);
      setTimetable(slots);
      // Find substitution requested for this faculty (or alt-201)
      const requested = alts.find(a => a.id === 'alt-201' || a.assignedFacultyId === user?.id);
      if (requested) {
        setAltClass(requested);
        if (requested.status === 'ACCEPTED') setAltStatus('accepted');
        else if (requested.status === 'DECLINED') setAltStatus('declined');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: 'accept' | 'decline') => {
    if (!altClass) return;
    try {
      await api.respondToAlternative(altClass.id, action, {
        id: user?.id || 'usr-rajesh',
        name: user?.name || 'Dr. Rajesh Sharma'
      });
      setAltStatus(action === 'accept' ? 'accepted' : 'declined');
      if (action === 'accept') {
        showToast('Substitute session accepted! Added to your schedule at 03:00 PM.');
        // Refresh timetable to reflect the newly assigned class
        loadData();
      } else {
        showToast('Substitute request declined.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

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
              Good morning, {user?.name ? user.name.split(' ')[0] + ' ' + (user.name.split(' ')[1] || '') : 'Dr. Rajesh'}{' '}
              <span className="inline-block transition-transform hover:rotate-12 duration-200 cursor-default">
                👋
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Here's what's happening today <span className="text-slate-300 mx-1.5">•</span> Tuesday, 24 October
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-xs border border-slate-100 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-[#3947dd] animate-pulse" />
              <span className="font-mono text-[11px] font-medium">Fall Semester 2024</span>
            </div>
          </div>
        </div>
      </header>

      {/* Lightweight Summary Row */}
      <section aria-label="Quick metrics" className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Metric 1 */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-lg bg-[#f0f3ff] flex items-center justify-center text-[#1a146b] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Today's Classes
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-serif text-2xl text-[#1a146b] font-semibold">3</span>
                <span className="text-xs text-slate-500">lectures</span>
              </div>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-lg bg-[#f0f3ff] flex items-center justify-center text-[#3947dd] shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Leave Balance
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-serif text-2xl text-[#1a146b] font-semibold">12</span>
                <span className="text-xs text-slate-500">days remaining</span>
              </div>
            </div>
          </div>

          {/* Metric 3 */}
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
                  {altStatus === 'pending' ? '1' : '0'}
                </span>
                <span className="text-xs text-slate-500">
                  {altStatus === 'pending' ? 'substitution' : 'resolved'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Asymmetric 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 1. ACTION REQUIRED BANNER */}
          {altStatus === 'pending' && (
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
                      <span className="font-mono text-[11px] text-[#b45309]/80">Response by 1:30 PM</span>
                    </div>
                    <h2 className="font-serif text-lg text-slate-900 font-semibold tracking-tight">
                      Substitute session requested
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      <strong className="text-slate-800 font-medium">Advanced Algorithms</strong> (B.Tech CSE Sem 6) at{' '}
                      <strong className="text-slate-800 font-medium">03:00 PM</strong> in{' '}
                      <strong className="text-slate-800 font-medium">Room 204</strong>.
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                      <UserCheck className="w-3.5 h-3.5 text-[#b45309]" />
                      <span>
                        Replaced: <strong className="text-slate-800 font-medium">Prof. S. Menon</strong> (On Medical Leave)
                      </span>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-3 mt-4 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAction('accept')}
                        className="px-4 py-2 rounded-xl bg-[#312e81] text-white text-xs font-medium hover:bg-[#1a146b] shadow-xs hover:shadow transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Session</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction('decline')}
                        className="px-4 py-2 rounded-xl bg-white text-slate-600 hover:text-slate-900 text-xs font-medium hover:bg-slate-50 border border-slate-200 transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {altStatus === 'accepted' && (
            <div className="bg-[#ecfdf5] border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-medium">Substitute session accepted</p>
                <p className="text-xs text-emerald-700">
                  Added to today's schedule at 03:00 PM in Room 204 (Advanced Algorithms).
                </p>
              </div>
            </div>
          )}

          {/* 2. TODAY'S SCHEDULE */}
          <section aria-labelledby="schedule-heading">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  Timeline
                </span>
                <h2 id="schedule-heading" className="font-serif text-2xl text-[#1a146b] font-medium tracking-tight">
                  Today's Schedule
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('schedule')}
                className="text-xs text-[#3947dd] hover:underline flex items-center gap-1 font-medium"
              >
                <span>View 7-day calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Class Item 1: Completed */}
              <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-150">
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <div className="w-16 flex flex-col shrink-0">
                    <span className="font-mono text-sm text-slate-900 font-semibold">09:00</span>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">AM</span>
                  </div>
                  <div className="w-1 h-8 rounded-full bg-slate-200 shrink-0 hidden sm:block" />
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-base text-slate-900 font-medium truncate">Data Structures</h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-500 text-xs mt-0.5">
                      <span>B.Tech CSE II</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        Room 204
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>62 Students</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center sm:self-center shrink-0 pl-20 sm:pl-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#047857] font-mono text-[11px] font-medium uppercase tracking-wide">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                </div>
              </div>

              {/* Class Item 2: Up Next */}
              <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-indigo-100 shadow-[0_4px_16px_-2px_rgba(49,46,129,0.06)] hover:shadow-md transition-all duration-150">
                {/* Left accent pip */}
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#3947dd] rounded-r" />
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <div className="w-16 flex flex-col shrink-0">
                    <span className="font-mono text-sm text-[#3947dd] font-semibold">11:00</span>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">AM</span>
                  </div>
                  <div className="w-1 h-8 rounded-full bg-indigo-100 shrink-0 hidden sm:block" />
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-base text-[#1a146b] font-semibold truncate">
                      Database Management Systems
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-500 text-xs mt-0.5">
                      <span>B.Tech CSE III</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        Room 305
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>Module 4: Normalization</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center sm:self-center shrink-0 pl-20 sm:pl-0">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#e0e0ff] text-[#000668] font-mono text-[11px] font-semibold uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3947dd] animate-pulse" />
                    Next in 45m
                  </span>
                </div>
              </div>

              {/* Class Item 3: Scheduled */}
              <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-150">
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <div className="w-16 flex flex-col shrink-0">
                    <span className="font-mono text-sm text-slate-900 font-semibold">02:00</span>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">PM</span>
                  </div>
                  <div className="w-1 h-8 rounded-full bg-slate-200 shrink-0 hidden sm:block" />
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-base text-slate-900 font-medium truncate">
                      Python Programming Lab
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-500 text-xs mt-0.5">
                      <span>B.Tech CSE IV</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Monitor className="w-3 h-3 text-slate-400" />
                        Computing Lab 4
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>30 Workstations</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center sm:self-center shrink-0 pl-20 sm:pl-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f0f3ff] text-slate-600 font-mono text-[11px] font-medium uppercase tracking-wide">
                    Scheduled
                  </span>
                </div>
              </div>

              {/* Accepted substitute session if accepted */}
              {altStatus === 'accepted' && (
                <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#ecfdf5]/40 rounded-xl border border-emerald-200 shadow-xs hover:shadow-md transition-all duration-150">
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className="w-16 flex flex-col shrink-0">
                      <span className="font-mono text-sm text-emerald-800 font-semibold">03:00</span>
                      <span className="font-mono text-[10px] text-slate-400 uppercase">PM</span>
                    </div>
                    <div className="w-1 h-8 rounded-full bg-emerald-200 shrink-0 hidden sm:block" />
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-base text-emerald-900 font-medium truncate">
                        Advanced Algorithms (Substitute)
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-500 text-xs mt-0.5">
                        <span>B.Tech CSE Sem 6</span>
                        <span className="text-slate-300">•</span>
                        <span>Room 204</span>
                        <span className="text-slate-300">•</span>
                        <span>Coverage for Prof. S. Menon</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center sm:self-center shrink-0 pl-20 sm:pl-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[11px] font-medium uppercase tracking-wide">
                      Assigned
                    </span>
                  </div>
                </div>
              )}
            </div>
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
              <h2 id="quick-actions-heading" className="font-serif text-xl text-[#1a146b] font-medium tracking-tight">
                Quick Actions
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate('leave')}
                className="group flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow hover:bg-[#f0f3ff]/50 transition-all text-left"
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
                className="group flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow hover:bg-[#f0f3ff]/50 transition-all text-left"
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
                className="group flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-xs hover:shadow hover:bg-[#f0f3ff]/50 transition-all text-left"
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
              <h2 id="updates-heading" className="font-serif text-xl text-[#1a146b] font-medium tracking-tight">
                Recent Updates
              </h2>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs flex flex-col gap-4">
              {/* Update 1 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#ecfdf5] text-[#047857] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate-900 font-medium leading-snug">
                    Medical Leave approved by HOD
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 mt-0.5">
                    Yesterday at 4:15 PM • Casual Leave Grant
                  </span>
                </div>
              </div>

              <div className="h-[1px] w-full bg-slate-100" />

              {/* Update 2 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#e0e0ff] text-[#000668] flex items-center justify-center shrink-0 mt-0.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate-900 font-medium leading-snug">
                    Timetable swap confirmed for Friday
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 mt-0.5">
                    Oct 20 • Exchanged slot with Prof. S. Sen
                  </span>
                </div>
              </div>

              <div className="h-[1px] w-full bg-slate-100" />

              {/* Update 3 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#f0f3ff] text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate-900 font-medium leading-snug">
                    Mid-term marks verified
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 mt-0.5">
                    Oct 18 • Dean's Office Archive
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. DEPARTMENT NOTICE CARD */}
          <div className="bg-[#f0f3ff] rounded-xl p-5 border border-indigo-50 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#3947dd] font-mono text-[11px] uppercase font-semibold">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Faculty Senate</span>
            </div>
            <p className="font-serif text-base text-[#1a146b] font-medium mt-0.5">
              Curriculum Review Meeting
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thursday, Oct 26 at 04:30 PM in Senate Hall. Agendas uploaded to academic repository.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
