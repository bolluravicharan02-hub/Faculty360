import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Users,
  CalendarDays,
  RefreshCw,
  Send,
  AlertTriangle,
  UserCheck,
  Building,
  Clock,
  Sparkles,
  Search,
  Check,
  X,
  Radio,
  FileText,
  ChevronRight,
  ShieldCheck,
  Megaphone,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import {
  AlternativeClassAssignment,
  LeaveRequest,
  TimetableSlot,
  CandidateFaculty
} from '../types';

interface HODDashboardProps {
  onNavigate: (path: string) => void;
}

export const HODDashboard: React.FC<HODDashboardProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [altClasses, setAltClasses] = useState<AlternativeClassAssignment[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'ongoing' | 'upcoming' | 'substitutions'>('all');

  // Smart Substitute Modal State
  const [selectedAlt, setSelectedAlt] = useState<AlternativeClassAssignment | null>(null);
  const [candidates, setCandidates] = useState<CandidateFaculty[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Broadcast Modal State
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [slots, leaveList, alts] = await Promise.all([
        api.getTimetable({ department: 'Computer Science' }),
        api.getLeaves(),
        api.getAlternativeClasses()
      ]);
      setTimetable(slots);
      setLeaves(leaveList);
      setAltClasses(alts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSmartAssign = async (alt: AlternativeClassAssignment) => {
    setSelectedAlt(alt);
    try {
      const candidateList = await api.getCandidates(alt.id);
      setCandidates(candidateList);
    } catch (err: any) {
      showToast('Could not load smart faculty suggestions', 'error');
    }
  };

  const handleAssignFaculty = async (candidateId: string) => {
    if (!selectedAlt) return;
    try {
      setIsAssigning(true);
      await api.assignCandidate(selectedAlt.id, candidateId);
      showToast('Substitute faculty assigned successfully! Notification dispatched.');
      setSelectedAlt(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Assignment failed', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleReviewLeave = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await api.reviewLeave(leaveId, {
        status,
        reviewerName: user?.name || 'Dr. Rajesh Sharma (HOD)'
      });
      if (status === 'APPROVED') {
        const count = res.affectedSlotsCount || 0;
        showToast(
          `Leave approved! ${count} timetable class${count === 1 ? '' : 'es'} identified and queued for substitute assignment.`
        );
      } else {
        showToast('Leave request declined.');
      }
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Review failed', 'error');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    try {
      setIsSendingBroadcast(true);
      await api.sendBroadcast(broadcastMessage);
      showToast('Broadcast notice dispatched to all department faculty members.');
      setBroadcastMessage('');
      setIsBroadcastOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Broadcast failed', 'error');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'PENDING');
  const criticalAlt = altClasses.find(a => a.status === 'PENDING_FACULTY_ASSIGNMENT');

  const filteredSessions = timetable.filter(slot => {
    if (activeTab === 'ongoing') return slot.status === 'IN_PROGRESS';
    if (activeTab === 'upcoming') return slot.status === 'SCHEDULED';
    if (activeTab === 'substitutions') return slot.status === 'SUBSTITUTION_PENDING' || slot.status === 'SUBSTITUTED';
    return true;
  });

  return (
    <div className="flex flex-col w-full font-sans">
      {/* Editorial Header Block */}
      <header className="mb-6 pt-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[11px] text-[#3947dd] uppercase tracking-widest font-semibold block mb-1">
              {role === 'ADMIN'
                ? 'Office of the Dean • Institutional Governance'
                : 'Department of Computer Science & Engineering'}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1a146b] font-medium tracking-tight">
              {role === 'ADMIN'
                ? 'University Academic Monitoring & Faculty Attendance'
                : 'Faculty Attendance & Academic Monitoring'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Fall Semester 2024 <span className="text-slate-300 mx-1.5">•</span> Academic Week 8{' '}
              <span className="text-slate-300 mx-1.5">•</span> Real-time Faculty Roster
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBroadcastOpen(true)}
              className="px-4 py-2 bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-medium rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Broadcast Notice</span>
            </button>
          </div>
        </div>
      </header>

      {/* KPI Cards Row (Image 5) */}
      <section aria-label="Department Metrics" className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div className="p-4 bg-white rounded-xl shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Faculty Present
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#ecfdf5] text-[#047857] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl text-[#1a146b] font-semibold">36</span>
              <span className="text-xs text-slate-400">/ 38</span>
            </div>
            <p className="font-mono text-[11px] text-emerald-600 mt-1">96% Attendance rate today</p>
          </div>

          {/* KPI 2 */}
          <div className="p-4 bg-white rounded-xl shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                On Leave
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl text-amber-700 font-semibold">2</span>
              <span className="text-xs text-slate-400">faculty</span>
            </div>
            <p className="font-mono text-[11px] text-slate-500 mt-1">1 Approved • 1 Pending review</p>
          </div>

          {/* KPI 3 */}
          <div className="p-4 bg-white rounded-xl shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Active Lectures
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#f0f3ff] text-[#312e81] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl text-[#1a146b] font-semibold">14</span>
              <span className="text-xs text-slate-400">sessions</span>
            </div>
            <p className="font-mono text-[11px] text-slate-500 mt-1">8 Theory • 6 Laboratories</p>
          </div>

          {/* KPI 4 */}
          <div className="p-4 bg-white rounded-xl shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Substitutions
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl text-rose-600 font-semibold">
                {altClasses.filter(a => a.status === 'PENDING_FACULTY_ASSIGNMENT').length}
              </span>
              <span className="text-xs text-slate-400">action required</span>
            </div>
            <p className="font-mono text-[11px] text-rose-600 mt-1">Requires substitute faculty</p>
          </div>
        </div>
      </section>

      {/* 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* CRITICAL ACTION NEEDED (Matches Image 5!) */}
          {criticalAlt && (
            <section aria-labelledby="critical-action-heading">
              <div className="bg-[#fffbeb] border border-amber-200/70 rounded-xl p-5 shadow-xs transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-[#fef3c7] text-[#b45309] flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        id="critical-action-heading"
                        className="font-mono text-[11px] text-[#b45309] font-semibold uppercase tracking-widest"
                      >
                        Critical Action Needed
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#b45309] font-medium bg-amber-100/60 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Substitution Pending
                      </span>
                    </div>

                    <h2 className="font-serif text-lg text-slate-900 font-semibold tracking-tight">
                      {criticalAlt.subjectName} ({criticalAlt.subjectCode})
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Today <strong className="text-slate-800 font-medium">{criticalAlt.startTime}</strong> •{' '}
                      <strong className="text-slate-800 font-medium">{criticalAlt.classroom}</strong> •{' '}
                      <strong className="text-slate-800 font-medium">{criticalAlt.section}</strong> (62 Enrolled)
                    </p>
                    <p className="text-xs text-slate-500 mt-1 italic">
                      Originally: {criticalAlt.originalFacultyName} (On Leave) • Medical emergency
                    </p>

                    <div className="mt-4 pt-1 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenSmartAssign(criticalAlt)}
                        className="px-4 py-2 rounded-xl bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-medium shadow-xs transition-all flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                        <span>Smart Suggest Substitute Faculty</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('schedule')}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200 transition-colors"
                      >
                        View Room Timetable
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* REAL-TIME CLASS SESSIONS */}
          <section aria-labelledby="sessions-heading">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  Department Timetable
                </span>
                <h2 id="sessions-heading" className="font-serif text-2xl text-[#1a146b] font-medium tracking-tight">
                  Real-time Class Sessions (Today)
                </h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs text-xs">
                {(['all', 'ongoing', 'upcoming', 'substitutions'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 rounded capitalize transition-all ${
                      activeTab === tab
                        ? 'bg-[#312e81] text-white font-medium shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {filteredSessions.map((slot) => {
                const isOngoing = slot.status === 'IN_PROGRESS';
                const isPendingSub = slot.status === 'SUBSTITUTION_PENDING';
                const isSubstituted = slot.status === 'SUBSTITUTED';
                const isCompleted = slot.status === 'COMPLETED';

                return (
                  <div
                    key={slot.id}
                    className={`p-4 bg-white rounded-xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isPendingSub
                        ? 'border-amber-200 shadow-xs'
                        : isOngoing
                        ? 'border-indigo-100 shadow-[0_4px_16px_-2px_rgba(49,46,129,0.06)]'
                        : 'border-slate-100 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <div className="w-16 flex flex-col shrink-0">
                        <span
                          className={`font-mono text-sm font-semibold ${
                            isOngoing ? 'text-[#3947dd]' : isPendingSub ? 'text-amber-700' : 'text-slate-900'
                          }`}
                        >
                          {slot.startTime.split(' ')[0]}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 uppercase">
                          {slot.startTime.split(' ')[1]}
                        </span>
                      </div>

                      <div className="w-1 h-8 rounded-full bg-slate-200 shrink-0 hidden sm:block" />

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-400 font-semibold">{slot.subjectCode}</span>
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{slot.subjectName}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-500 text-xs mt-0.5">
                          <span>{slot.section}</span>
                          <span className="text-slate-300">•</span>
                          <span>{slot.classroom}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-medium text-slate-700">
                            {slot.facultyName}
                            {isSubstituted && (
                              <span className="text-indigo-600 ml-1 font-normal">(Sub: {slot.substitutedByName})</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {isOngoing && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e0e0ff] text-[#000668] font-mono text-[11px] font-semibold uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3947dd] animate-pulse" />
                          Ongoing ({slot.enrolledStudents || 52})
                        </span>
                      )}

                      {isPendingSub && (
                        <button
                          type="button"
                          onClick={() => {
                            const alt = altClasses.find(a => a.subjectCode === slot.subjectCode) || criticalAlt;
                            if (alt) handleOpenSmartAssign(alt);
                          }}
                          className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Assign Substitute</span>
                        </button>
                      )}

                      {isSubstituted && (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[11px] font-medium">
                          Substituted
                        </span>
                      )}

                      {isCompleted && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-medium">
                          Completed
                        </span>
                      )}

                      {slot.status === 'SCHEDULED' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px]">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Sidebar Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* PENDING LEAVE REQUESTS */}
          <section aria-labelledby="pending-leave-heading">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  Approval Queue
                </span>
                <h2 id="pending-leave-heading" className="font-serif text-xl text-[#1a146b] font-medium tracking-tight">
                  Pending Leave Requests
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('leave')}
                className="text-xs text-[#3947dd] hover:underline font-medium"
              >
                View all ({leaves.length})
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {pendingLeaves.length === 0 ? (
                <div className="bg-white rounded-xl p-5 border border-slate-100 text-center text-xs text-slate-500">
                  No pending leave requests requiring review.
                </div>
              ) : (
                pendingLeaves.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{req.facultyName}</h3>
                        <p className="font-mono text-[11px] text-slate-500">
                          {req.leaveType} • {req.daysCount} Day(s) ({req.startDate} to {req.endDate})
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-[10px] font-medium">
                        Pending
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                      "{req.reason}"
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleReviewLeave(req.id, 'APPROVED')}
                        className="flex-1 py-1.5 rounded-lg bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewLeave(req.id, 'REJECTED')}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-medium transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* DEPARTMENT ATTENDANCE OVERVIEW */}
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Attendance Snapshot
            </span>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-serif text-[#1a146b] font-semibold">96%</p>
                <p className="text-xs text-slate-500">
                  {role === 'ADMIN' ? 'University overall' : 'CSE Department overall'}
                </p>
              </div>
              <span className="font-mono text-xs text-emerald-600 font-medium">Above target (90%)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#312e81] h-full rounded-full" style={{ width: '96%' }} />
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>36/38 checked in • Gates 2 &amp; 4 synced</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">09:30 AM</span>
            </div>
          </div>
        </div>
      </div>

      {/* SMART SUBSTITUTE CANDIDATES MODAL */}
      {selectedAlt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <div className="flex items-center gap-1.5 text-[#3947dd] font-mono text-[10px] uppercase tracking-wider font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Smart Alternative Faculty Engine</span>
                </div>
                <h3 className="font-serif text-lg text-slate-900 font-semibold mt-0.5">
                  Substitute Candidates for {selectedAlt.subjectName}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedAlt.startTime} • {selectedAlt.classroom} • {selectedAlt.section}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlt(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidates List */}
            <div className="p-4 overflow-y-auto flex flex-col gap-3">
              <div className="px-1 text-xs text-slate-500">
                Rule-based ranking considers syllabus alignment, availability at {selectedAlt.startTime}, and current daily lecture workload.
              </div>

              {candidates.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">Loading candidate faculty...</div>
              ) : (
                candidates.map((cand, idx) => (
                  <div
                    key={cand.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-[#f0f3ff]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={cand.avatarUrl}
                        alt={cand.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">{cand.name}</h4>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-medium">
                              Top Match
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{cand.designation}</p>

                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {cand.matchReasons.map((reason, rIdx) => (
                            <span
                              key={rIdx}
                              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600"
                            >
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="font-mono text-sm font-semibold text-[#1a146b]">{cand.matchScore}%</span>
                        <span className="block text-[10px] text-slate-400">Match score</span>
                      </div>
                      <button
                        type="button"
                        disabled={isAssigning}
                        onClick={() => handleAssignFaculty(cand.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
                      >
                        Assign &amp; Notify
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Automatic notification sent upon assignment</span>
              <button
                type="button"
                onClick={() => setSelectedAlt(null)}
                className="px-3 py-1 text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST NOTICE MODAL */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-[#3947dd] uppercase tracking-wider font-semibold">
                  HOD Announcement
                </span>
                <h3 className="font-serif text-lg text-slate-900 font-semibold mt-0.5">
                  Broadcast Notice to Faculty
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-800">Target Group</label>
                <select className="h-10 px-3 bg-[#f0f3ff] rounded-lg text-xs text-slate-800 outline-none border border-transparent focus:border-indigo-300">
                  <option>All CSE Department Faculty (38)</option>
                  <option>Theory Instructors Only</option>
                  <option>Laboratory Coordinators &amp; TAs</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-800">Notice Content</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g., Department staff meeting scheduled for Friday at 3:30 PM regarding ABET/NAAC syllabus review."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="p-3 bg-[#f0f3ff] rounded-lg text-xs text-slate-800 outline-none border border-transparent focus:border-indigo-300 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingBroadcast}
                  className="px-4 py-2 rounded-xl bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingBroadcast ? 'Dispatching...' : 'Dispatch Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
