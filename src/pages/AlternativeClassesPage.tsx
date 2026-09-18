import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Building,
  User,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
  UserCheck,
  Search,
  CalendarDays,
  ShieldCheck,
  BookOpen,
  History,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { AlternativeClassAssignment, CandidateFaculty, AuditLog } from '../types';

export const AlternativeClassesPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [alts, setAlts] = useState<AlternativeClassAssignment[]>([]);
  const [selectedAlt, setSelectedAlt] = useState<AlternativeClassAssignment | null>(null);
  const [candidates, setCandidates] = useState<CandidateFaculty[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateFilter, setCandidateFilter] = useState<'all' | 'available'>('all');
  const [candidateSearch, setCandidateSearch] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unassigned' | 'offered' | 'confirmed' | 'from_leaves'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Decline Dialog State
  const [declineTargetAlt, setDeclineTargetAlt] = useState<AlternativeClassAssignment | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);

  // Workflow Audit Trail Drawer State
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    loadAlts();
  }, []);

  const loadAlts = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAlternativeClasses();
      setAlts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditHistory = async () => {
    try {
      setAuditLoading(true);
      const logs = await api.getAuditLogs('SUBSTITUTION');
      setAuditLogs(logs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleOpenAuditDrawer = () => {
    setShowAuditDrawer(true);
    loadAuditHistory();
  };

  const handleOpenSmartAssign = async (alt: AlternativeClassAssignment) => {
    setSelectedAlt(alt);
    setCandidateSearch('');
    setCandidateFilter('all');
    try {
      setCandidatesLoading(true);
      const candidateList = await api.getCandidates(alt.id);
      setCandidates(candidateList);
    } catch (err: any) {
      showToast('Could not load candidate faculty suggestions', 'error');
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleAssignCandidate = async (candidateId: string) => {
    if (!selectedAlt) return;
    try {
      await api.assignCandidate(selectedAlt.id, candidateId);
      showToast('Substitute candidate assigned and notification dispatched.');
      setSelectedAlt(null);
      await loadAlts();
      if (showAuditDrawer) loadAuditHistory();
    } catch (err: any) {
      showToast(err.message || 'Assignment failed', 'error');
    }
  };

  const handleAcceptSession = async (altId: string) => {
    try {
      await api.respondToAlternative(altId, 'accept', {
        id: user?.id,
        name: user?.name
      });
      showToast('Substitute class accepted! Timetable roster updated.', 'success');
      await loadAlts();
      if (showAuditDrawer) loadAuditHistory();
    } catch (err: any) {
      showToast(err.message || 'Acceptance failed', 'error');
    }
  };

  const handleConfirmDecline = async () => {
    if (!declineTargetAlt) return;
    try {
      setIsSubmittingDecline(true);
      await api.respondToAlternative(declineTargetAlt.id, 'decline', {
        id: user?.id,
        name: user?.name,
        reason: declineReason.trim() || undefined
      });
      showToast('Substitute request declined. HOD has been notified for reassignment.', 'info');
      setDeclineTargetAlt(null);
      setDeclineReason('');
      await loadAlts();
      if (showAuditDrawer) loadAuditHistory();
    } catch (err: any) {
      showToast(err.message || 'Decline failed', 'error');
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  // Filtered alternative classes
  const filteredAlts = useMemo(() => {
    return alts.filter((item) => {
      // Type filter
      if (filterType === 'unassigned' && item.status !== 'PENDING_FACULTY_ASSIGNMENT' && item.status !== 'DECLINED') return false;
      if (filterType === 'offered' && item.status !== 'OFFERED_TO_FACULTY') return false;
      if (filterType === 'confirmed' && item.status !== 'ACCEPTED') return false;
      if (filterType === 'from_leaves' && !item.leaveRequestId) return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubject = item.subjectName.toLowerCase().includes(q) || item.subjectCode.toLowerCase().includes(q);
        const matchesFaculty = item.originalFacultyName.toLowerCase().includes(q) || (item.assignedFacultyName?.toLowerCase().includes(q) ?? false);
        const matchesRoom = item.classroom.toLowerCase().includes(q);
        const matchesDate = item.date.toLowerCase().includes(q);
        if (!matchesSubject && !matchesFaculty && !matchesRoom && !matchesDate) return false;
      }

      return true;
    });
  }, [alts, filterType, searchQuery]);

  // Filtered candidate faculty in smart assign modal
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (candidateFilter === 'available' && !c.isAvailable) return false;
      if (candidateSearch.trim()) {
        const q = candidateSearch.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesDept = c.department.toLowerCase().includes(q);
        const matchesDesig = c.designation.toLowerCase().includes(q);
        const matchesReasons = c.matchReasons.some(r => r.toLowerCase().includes(q));
        if (!matchesName && !matchesDept && !matchesDesig && !matchesReasons) return false;
      }
      return true;
    });
  }, [candidates, candidateFilter, candidateSearch]);

  const fromLeavesCount = alts.filter(a => !!a.leaveRequestId).length;
  const unassignedCount = alts.filter(a => a.status === 'PENDING_FACULTY_ASSIGNMENT' || a.status === 'DECLINED').length;
  const offeredCount = alts.filter(a => a.status === 'OFFERED_TO_FACULTY').length;
  const confirmedCount = alts.filter(a => a.status === 'ACCEPTED').length;

  return (
    <div className="flex flex-col w-full font-sans">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] text-[#3947dd] uppercase tracking-widest font-semibold block mb-1">
            Academic Continuity &bull; Substitution Engine
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1a146b] font-medium tracking-tight">
            Alternative &amp; Substitute Classes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated class identification from approved leaves, smart faculty availability matching, and end-to-end workflow governance
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Audit Trail Button */}
          <button
            type="button"
            onClick={handleOpenAuditDrawer}
            className="px-3.5 py-2 bg-[#f0f3ff] hover:bg-[#e4ebff] text-[#1a146b] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[#3947dd]" />
            <span>Workflow Audit Trail</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadAlts}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
            <span>Refresh Roster</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-xs flex flex-col">
          <span className="font-mono text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
            Total Classes
          </span>
          <span className="font-serif text-2xl font-semibold text-[#1a146b] mt-0.5">
            {alts.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">Affected sessions</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-amber-100/80 shadow-xs flex flex-col">
          <span className="font-mono text-[10px] uppercase text-amber-800 font-semibold tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Needs Substitute
          </span>
          <span className="font-serif text-2xl font-semibold text-amber-900 mt-0.5">
            {unassignedCount}
          </span>
          <span className="text-[11px] text-amber-700 mt-0.5">Action required</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-xs flex flex-col">
          <span className="font-mono text-[10px] uppercase text-indigo-800 font-semibold tracking-wider">
            Offered / Pending
          </span>
          <span className="font-serif text-2xl font-semibold text-indigo-900 mt-0.5">
            {offeredCount}
          </span>
          <span className="text-[11px] text-indigo-600 mt-0.5">Awaiting faculty acceptance</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-xs flex flex-col">
          <span className="font-mono text-[10px] uppercase text-emerald-800 font-semibold tracking-wider">
            Confirmed &amp; Scheduled
          </span>
          <span className="font-serif text-2xl font-semibold text-emerald-900 mt-0.5">
            {confirmedCount}
          </span>
          <span className="text-[11px] text-emerald-700 mt-0.5">Coverage active</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
        {/* Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#312e81] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Classes ({alts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('unassigned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterType === 'unassigned'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Needs Substitute ({unassignedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('offered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterType === 'offered'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Offered / Pending ({offeredCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('confirmed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterType === 'confirmed'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmed ({confirmedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('from_leaves')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterType === 'from_leaves'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>From Approved Leaves ({fromLeavesCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subject, faculty, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-300"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Roster Cards */}
      <div className="flex flex-col gap-4">
        {filteredAlts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-100 text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <BookOpen className="w-8 h-8 text-slate-300" />
            <p className="font-medium text-slate-700">No alternative classes found matching criteria.</p>
            <p className="text-[11px] text-slate-400">
              When faculty leave requests are approved by HOD, their timetable classes automatically populate here for substitution assignment.
            </p>
          </div>
        ) : (
          filteredAlts.map((item) => {
            const isAssignedToMe = item.assignedFacultyId === user?.id;
            const isPendingAssignment = item.status === 'PENDING_FACULTY_ASSIGNMENT';
            const isOffered = item.status === 'OFFERED_TO_FACULTY';
            const isAccepted = item.status === 'ACCEPTED';
            const isDeclined = item.status === 'DECLINED';
            const isFromLeave = !!item.leaveRequestId;

            // Allow responding if offered to current user, OR if testing as HOD/Admin
            const canRespond = isOffered && (isAssignedToMe || role === 'HOD' || role === 'ADMIN');

            return (
              <div
                key={item.id}
                className={`p-5 bg-white rounded-xl border transition-all shadow-xs hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  isOffered
                    ? 'border-blue-200 bg-[#f8faff]'
                    : isAccepted
                    ? 'border-emerald-100 bg-white'
                    : isDeclined
                    ? 'border-rose-200 bg-rose-50/20'
                    : isFromLeave
                    ? 'border-emerald-100/70 bg-gradient-to-r from-emerald-50/20 via-white to-white'
                    : 'border-slate-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isAccepted
                        ? 'bg-emerald-50 text-emerald-700'
                        : isDeclined
                        ? 'bg-rose-100 text-rose-700'
                        : isOffered
                        ? 'bg-blue-100 text-blue-700'
                        : isPendingAssignment
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-[#f0f3ff] text-[#1a146b]'
                    }`}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {item.subjectCode}
                      </span>
                      <h2 className="text-base font-semibold text-slate-900">{item.subjectName}</h2>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs text-slate-500 font-mono">{item.section}</span>

                      {/* Origin tag */}
                      {isFromLeave && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Auto-Identified from Approved Leave
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1.5">
                      <span className="flex items-center gap-1 font-medium text-slate-800 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {item.date} &bull; {item.startTime} - {item.endTime}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {item.classroom}
                      </span>
                    </div>

                    {/* Faculty Details */}
                    <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">Faculty on Leave:</span>{' '}
                        <span className="font-medium text-indigo-950">{item.originalFacultyName}</span>
                        <span className="text-slate-400 mx-1">|</span>
                        <span className="italic text-slate-600">Reason: {item.reason}</span>
                      </div>

                      {item.assignedFacultyName && (
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                          <span className="font-semibold text-indigo-950">Assigned Substitute:</span>{' '}
                          <span className="font-medium text-indigo-700 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            {item.assignedFacultyName}
                          </span>
                          {item.notes && (
                            <>
                              <span className="text-slate-400 mx-1">&bull;</span>
                              <span className="text-slate-500 italic text-[11px]">{item.notes}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Column */}
                <div className="flex flex-col sm:flex-row items-start lg:items-end justify-between lg:justify-center gap-3 shrink-0">
                  {/* Status Badges */}
                  <div>
                    {isPendingAssignment && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[11px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Needs Substitute Faculty
                      </span>
                    )}
                    {isOffered && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[11px] font-medium">
                        <Clock className="w-3 h-3 text-blue-500" />
                        Offered to {item.assignedFacultyName} (Pending)
                      </span>
                    )}
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Confirmed &amp; Scheduled
                      </span>
                    )}
                    {isDeclined && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-mono text-[11px] font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        Declined by Faculty (Reassign)
                      </span>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Faculty Response Controls (Accept / Decline) */}
                    {canRespond && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptSession(item.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Session</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeclineTargetAlt(item);
                            setDeclineReason('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                        >
                          Decline Request
                        </button>
                      </div>
                    )}

                    {/* HOD / Admin: Smart Assign or Reassign */}
                    {(role === 'HOD' || role === 'ADMIN') && (isPendingAssignment || isDeclined) && (
                      <button
                        type="button"
                        id={`smart-assign-${item.id}`}
                        onClick={() => handleOpenSmartAssign(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                        <span>{isDeclined ? 'Reassign Available Faculty' : 'Smart Assign Faculty'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SMART CANDIDATE RECOMMENDATION MODAL */}
      {selectedAlt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div>
                <div className="flex items-center gap-1.5 text-[#3947dd] font-mono text-[10px] uppercase tracking-wider font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-[#3947dd]" />
                  <span>Rule Engine Matching &bull; Conflict Detection</span>
                </div>
                <h3 className="font-serif text-lg text-[#1a146b] font-semibold mt-0.5">
                  Available Faculty Candidates for {selectedAlt.subjectCode}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedAlt.date} &bull; {selectedAlt.startTime} - {selectedAlt.endTime} &bull; {selectedAlt.classroom} &bull; Section {selectedAlt.section}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlt(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Controls: Search & Filter */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCandidateFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                    candidateFilter === 'all' ? 'bg-[#1a146b] text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Candidates ({candidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateFilter('available')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                    candidateFilter === 'available' ? 'bg-emerald-700 text-white font-semibold' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Available Only ({candidates.filter(c => c.isAvailable).length})
                </button>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter candidates..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full h-7 pl-7 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none"
                />
              </div>
            </div>

            {/* Candidates List */}
            <div className="p-5 overflow-y-auto flex flex-col gap-3">
              {candidatesLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span>Computing timetable overlaps, leave schedules, and specialization alignment...</span>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                  No faculty candidates match the selected filters.
                </div>
              ) : (
                filteredCandidates.map((c) => {
                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        c.isAvailable
                          ? 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                          : 'border-slate-200/60 bg-slate-50/70 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 mt-0.5 ${
                            c.isAvailable
                              ? 'bg-[#e2dfff] text-[#1a146b]'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {c.name.split(' ')[1]?.charAt(0) || c.name.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-semibold text-slate-900">{c.name}</h4>
                            <span
                              className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                c.isAvailable
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {c.matchScore}% Match
                            </span>

                            {c.isAvailable ? (
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 font-medium">
                                Available
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium">
                                Unavailable
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 mt-0.5">{c.designation} &bull; {c.department}</p>

                          {/* Match Reasons Tags */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {c.matchReasons.map((r, i) => {
                              const isClash = r.toLowerCase().includes('conflict') || r.toLowerCase().includes('teaching') || r.toLowerCase().includes('leave');
                              return (
                                <span
                                  key={i}
                                  className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                    isClash
                                      ? 'bg-rose-50 text-rose-700 border border-rose-100 font-medium'
                                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                  }`}
                                >
                                  {r}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          disabled={!c.isAvailable}
                          onClick={() => handleAssignCandidate(c.id)}
                          className="px-4 py-2 rounded-xl bg-[#312e81] hover:bg-[#1a146b] disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          {c.isAvailable ? 'Assign Faculty' : 'Clash Detected'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
              <span>Assigning a substitute dispatches instant notifications and logs to the audit record.</span>
              <button
                type="button"
                onClick={() => setSelectedAlt(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DECLINE REASON MODAL */}
      {declineTargetAlt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-semibold text-slate-900">Decline Substitution Request</h3>
                  <p className="text-xs text-slate-500 font-mono">{declineTargetAlt.subjectCode} &bull; {declineTargetAlt.date}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeclineTargetAlt(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Please provide a brief reason for declining this substitution request so the Department Head can reassign coverage appropriately.
              </p>

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Prior academic commitment',
                  'PhD Viva / Defense',
                  'Laboratory supervision clash',
                  'Approved research milestone'
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setDeclineReason(chip)}
                    className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Enter explanation..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-300 resize-none"
              />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isSubmittingDecline}
                onClick={() => setDeclineTargetAlt(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDecline}
                onClick={handleConfirmDecline}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                {isSubmittingDecline ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKFLOW AUDIT TRAIL SLIDE-OUT DRAWER */}
      {showAuditDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#312e81] text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-[#1a146b]">Substitution Audit Trail</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Real-time immutable governance log</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {auditLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span>Loading audit trail...</span>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                  No substitution audit logs recorded yet.
                </div>
              ) : (
                auditLogs.map((log) => {
                  const isAssign = log.action === 'ALTERNATIVE_FACULTY_ASSIGNED';
                  const isAccept = log.action === 'ALTERNATIVE_FACULTY_ACCEPTED';
                  const isDecline = log.action === 'ALTERNATIVE_FACULTY_DECLINED';
                  const isGen = log.action === 'ALTERNATIVE_CLASS_GENERATED';

                  return (
                    <div key={log.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                            isAccept
                              ? 'bg-emerald-100 text-emerald-800'
                              : isDecline
                              ? 'bg-rose-100 text-rose-800'
                              : isAssign
                              ? 'bg-blue-100 text-blue-800'
                              : isGen
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed">{log.details}</p>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <span>Logged by:</span>
                        <strong className="text-slate-700">{log.userName}</strong>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setShowAuditDrawer(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-medium cursor-pointer"
              >
                Close Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
