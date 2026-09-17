import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Paperclip,
  Check,
  X,
  AlertCircle,
  Filter,
  ShieldCheck,
  Ban,
  ArrowRight,
  Sparkles,
  Building,
  User,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { LeaveRequest } from '../types';

interface LeavePageProps {
  onNavigate?: (path: string) => void;
}

export const LeavePage: React.FC<LeavePageProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('2026-09-24');
  const [endDate, setEndDate] = useState('2026-09-25');
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  // Live preview of affected slots in Apply modal
  const [previewAffected, setPreviewAffected] = useState<any[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // HOD Review Modal state
  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewAffectedSlots, setReviewAffectedSlots] = useState<any[]>([]);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  // Cancel Confirmation Modal state
  const [cancellingLeave, setCancellingLeave] = useState<LeaveRequest | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Newly approved leave banner state
  const [approvedNotification, setApprovedNotification] = useState<{
    leaveId: string;
    facultyName: string;
    count: number;
  } | null>(null);

  useEffect(() => {
    loadLeaves();
  }, [filterStatus]);

  // When Apply modal dates change, load preview of affected timetable classes
  useEffect(() => {
    if (!isApplyModalOpen || !startDate || !endDate) return;

    let isMounted = true;
    const fetchPreview = async () => {
      try {
        setIsPreviewLoading(true);
        const data = await api.previewAffectedSlots({
          facultyId: user?.id,
          facultyName: user?.name,
          startDate,
          endDate,
        });
        if (isMounted) {
          setPreviewAffected(data.affectedClasses || []);
        }
      } catch (err) {
        console.warn('Could not load timetable preview:', err);
      } finally {
        if (isMounted) setIsPreviewLoading(false);
      }
    };

    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [isApplyModalOpen, startDate, endDate, user?.id, user?.name]);

  const loadLeaves = async () => {
    try {
      const data = await api.getLeaves({
        facultyId: role === 'FACULTY' ? user?.id : undefined,
        status: filterStatus !== 'All' ? filterStatus : undefined,
      });
      setLeaves(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('Please specify the reason for leave', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.applyLeave({
        facultyId: user?.id || 'usr-rajesh',
        facultyName: user?.name || 'Dr. Rajesh Sharma',
        facultyEmail: user?.email || 'rajesh.sharma@takshashila.edu',
        department: user?.departmentName || 'Department of Computer Science & Engineering',
        leaveType,
        startDate,
        endDate,
        reason,
        attachmentName: attachmentName || undefined,
      });
      showToast('Leave request submitted successfully for HOD review.');
      setIsApplyModalOpen(false);
      setReason('');
      setAttachmentName('');
      loadLeaves();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit leave', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open HOD Review Modal with affected slots analysis
  const openReviewModal = async (leave: LeaveRequest) => {
    setReviewingLeave(leave);
    setReviewRemarks(
      `Approved by ${role}. Academic coverage scheduled in Alternative Class Management.`
    );
    setIsReviewLoading(true);

    try {
      const preview = await api.previewAffectedSlots({
        facultyId: leave.facultyId,
        facultyName: leave.facultyName,
        startDate: leave.startDate,
        endDate: leave.endDate,
      });
      setReviewAffectedSlots(preview.affectedClasses || []);
    } catch (err) {
      console.warn('Failed to preview slots for review:', err);
      setReviewAffectedSlots([]);
    } finally {
      setIsReviewLoading(false);
    }
  };

  const submitReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewingLeave) return;
    try {
      setIsReviewSubmitting(true);
      const res = await api.reviewLeave(reviewingLeave.id, {
        status,
        remarks: reviewRemarks,
        reviewerName: user?.name || 'HOD Office',
      });

      if (status === 'APPROVED') {
        const count = res.affectedSlotsCount || reviewAffectedSlots.length || 0;
        showToast(
          `Leave approved! ${count} timetable class${count === 1 ? '' : 'es'} identified and queued for substitute assignment.`,
          'success'
        );
        setApprovedNotification({
          leaveId: reviewingLeave.id,
          facultyName: reviewingLeave.facultyName,
          count,
        });
      } else {
        showToast('Leave request has been rejected.', 'info');
      }

      setReviewingLeave(null);
      loadLeaves();
    } catch (err: any) {
      showToast(err.message || 'Failed to review leave', 'error');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  // Faculty: Cancel pending leave
  const confirmCancelLeave = async () => {
    if (!cancellingLeave) return;
    try {
      setIsCancelling(true);
      await api.cancelLeave(cancellingLeave.id);
      showToast('Leave application cancelled successfully.');
      setCancellingLeave(null);
      loadLeaves();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel leave', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="flex flex-col w-full font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-[11px] text-[#3947dd] uppercase tracking-widest font-semibold block mb-1">
            Faculty Services
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1a146b] font-medium tracking-tight">
            Leave Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Submit leave requests, track approvals, and manage automated alternative class scheduling
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="apply-leave-btn"
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2 bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-medium rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Post-Approval Alert Banner with quick navigation to Alternative Classes */}
      {approvedNotification && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-950">
                Leave Approved for {approvedNotification.facultyName}
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                Automatically identified {approvedNotification.count} timetable class(es) needing substitute coverage.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {onNavigate && (
              <button
                type="button"
                id="view-in-alt-classes-btn"
                onClick={() => onNavigate('classes')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>View in Alternative Classes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setApprovedNotification(null)}
              className="p-1.5 text-emerald-700 hover:text-emerald-900 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Leave Balance Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-xs">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium block">
            Casual Leave (CL)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-serif text-2xl font-semibold text-[#1a146b]">6</span>
            <span className="text-xs text-slate-400">/ 12 days</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-xs">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium block">
            Medical Leave (ML)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-serif text-2xl font-semibold text-[#1a146b]">4</span>
            <span className="text-xs text-slate-400">/ 8 days</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-xs">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium block">
            Earned Leave (EL)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-serif text-2xl font-semibold text-[#1a146b]">2</span>
            <span className="text-xs text-slate-400">/ 10 days</span>
          </div>
        </div>

        <div className="p-4 bg-[#f0f3ff] rounded-xl border border-indigo-50 shadow-xs">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#3947dd] font-semibold block">
            Total Balance
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-serif text-2xl font-semibold text-[#1a146b]">12</span>
            <span className="text-xs text-slate-500">days available</span>
          </div>
        </div>
      </div>

      {/* Leave Requests Table Card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="font-serif text-lg font-semibold text-slate-900">
              {role === 'FACULTY' ? 'My Leave Applications' : 'Department Leave Applications'}
            </h2>
            <p className="text-xs text-slate-500">
              {role === 'FACULTY'
                ? 'Review status and cancel pending applications before HOD review'
                : 'Review applications and approve to automatically schedule substitute classes'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 px-2.5 bg-white rounded-lg text-xs text-slate-700 border border-slate-200 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {leaves.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No leave records found matching selection.
            </div>
          ) : (
            leaves.map((l) => {
              const isPending = l.status === 'PENDING';
              const isApproved = l.status === 'APPROVED';
              const isRejected = l.status === 'REJECTED';
              const isCancelled = l.status === 'CANCELLED';

              const isOwner =
                l.facultyId === user?.id ||
                l.facultyEmail?.toLowerCase() === user?.email?.toLowerCase();
              const canCancel = isPending && (isOwner || role === 'HOD' || role === 'ADMIN');
              const canReview = isPending && (role === 'HOD' || role === 'ADMIN');

              return (
                <div
                  key={l.id}
                  className={`p-4 sm:p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isPending ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-[#f0f3ff]/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isApproved
                          ? 'bg-emerald-50 text-emerald-700'
                          : isPending
                          ? 'bg-amber-100 text-amber-800'
                          : isCancelled
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {l.leaveType}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-700 font-medium">
                          {l.facultyName}
                        </span>
                        <span className="font-mono text-xs text-slate-500">
                          ({l.daysCount} Day{l.daysCount > 1 ? 's' : ''})
                        </span>
                        {l.department && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500">{l.department}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 font-mono">
                        Period: {l.startDate} to {l.endDate}
                      </p>
                      <p className="text-xs text-slate-800 mt-1.5 leading-relaxed bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                        <span className="font-medium text-slate-600">Reason:</span> "{l.reason}"
                      </p>
                      {l.attachmentName && (
                        <div className="flex items-center gap-1.5 text-xs text-indigo-700 mt-1 font-mono">
                          <Paperclip className="w-3 h-3" />
                          <span>Attachment: {l.attachmentName}</span>
                        </div>
                      )}
                      {l.reviewRemarks && (
                        <p className="text-xs text-slate-600 mt-1.5 italic flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {l.reviewedBy}: {l.reviewRemarks}
                          </span>
                        </p>
                      )}
                      {isApproved && (
                        <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Classes identified &amp; scheduled in Alternative Class Management</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions / Status Section */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
                    {/* Status Badge */}
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[11px] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending Review
                      </span>
                    )}

                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved
                      </span>
                    )}

                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-mono text-[11px] font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected
                      </span>
                    )}

                    {isCancelled && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[11px] font-medium">
                        <Ban className="w-3.5 h-3.5 text-slate-400" />
                        Cancelled
                      </span>
                    )}

                    {/* Faculty: Cancel button if pending */}
                    {canCancel && (
                      <button
                        type="button"
                        id={`cancel-leave-${l.id}`}
                        onClick={() => setCancellingLeave(l)}
                        className="px-3 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors flex items-center gap-1"
                        title="Cancel this pending leave application"
                      >
                        <Ban className="w-3 h-3 text-rose-600" />
                        <span>Cancel Application</span>
                      </button>
                    )}

                    {/* HOD Review Button */}
                    {canReview && (
                      <button
                        type="button"
                        id={`review-leave-${l.id}`}
                        onClick={() => openReviewModal(l)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Review &amp; Decide</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* HOD REVIEW MODAL: Automatic Timetable Impact Identification */}
      {reviewingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <span className="font-mono text-[10px] text-[#3947dd] uppercase tracking-wider font-semibold">
                  HOD Review &amp; Academic Continuity
                </span>
                <h3 className="font-serif text-xl text-slate-900 font-semibold mt-0.5">
                  Review Leave Application
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewingLeave(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex flex-col gap-4">
              {/* Applicant Card */}
              <div className="p-4 bg-[#f0f3ff]/40 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {reviewingLeave.facultyName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{reviewingLeave.facultyName}</h4>
                    <p className="text-xs text-slate-500">{reviewingLeave.designation || 'Faculty Member'} • {reviewingLeave.department}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-white border border-indigo-100 font-semibold text-indigo-900">
                    {reviewingLeave.leaveType}
                  </span>
                  <p className="text-xs text-slate-600 font-mono mt-1">
                    {reviewingLeave.startDate} to {reviewingLeave.endDate} ({reviewingLeave.daysCount} days)
                  </p>
                </div>
              </div>

              {/* Stated Purpose */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 font-medium block mb-1">
                  Stated Purpose
                </span>
                <p className="text-xs text-slate-800 leading-relaxed">
                  "{reviewingLeave.reason}"
                </p>
                {reviewingLeave.attachmentName && (
                  <p className="text-xs text-indigo-700 mt-2 font-mono flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />
                    <span>Attached Document: {reviewingLeave.attachmentName}</span>
                  </p>
                )}
              </div>

              {/* AUTOMATIC TIMETABLE IMPACT IDENTIFICATION */}
              <div className="border border-indigo-100 rounded-xl p-4 bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider font-mono">
                      Automated Timetable Classes Impact
                    </h4>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                    {reviewAffectedSlots.length} class{reviewAffectedSlots.length === 1 ? '' : 'es'} identified
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  When you approve this leave, these timetable sessions will automatically be moved to Alternative Class Management for substitute assignment.
                </p>

                {isReviewLoading ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Scanning timetable schedule across leave dates...
                  </div>
                ) : reviewAffectedSlots.length === 0 ? (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No timetable conflicts detected for this period. Standard leave coverage applies.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                    {reviewAffectedSlots.map((slot, idx) => (
                      <div key={idx} className="p-3 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-indigo-700">{slot.subjectCode}</span>
                            <span className="font-medium text-slate-900">{slot.subjectName}</span>
                            <span className="text-slate-400 font-mono">({slot.section})</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-500 text-[11px] mt-0.5">
                            <span className="font-mono font-medium text-slate-700">{slot.dayOfWeek}, {slot.date}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              {slot.classroom}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-center font-medium shrink-0">
                          {slot.enrolledStudents} students • Will need sub
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* HOD Remarks */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-800">
                  Review Remarks / Instructions
                </label>
                <textarea
                  rows={2}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="e.g., Approved. Substitute arrangements initiated."
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none resize-none focus:border-indigo-300"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setReviewingLeave(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="reject-leave-btn"
                  disabled={isReviewSubmitting}
                  onClick={() => submitReview('REJECTED')}
                  className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Leave</span>
                </button>
                <button
                  type="button"
                  id="approve-leave-btn"
                  disabled={isReviewSubmitting}
                  onClick={() => submitReview('APPROVED')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isReviewSubmitting ? 'Approving...' : 'Approve Leave & Route Classes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL LEAVE CONFIRMATION MODAL */}
      {cancellingLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-rose-50/50">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Cancel Leave Application</h3>
                <p className="text-xs text-slate-500">Retract your pending request</p>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                Are you sure you want to cancel your <strong>{cancellingLeave.leaveType}</strong> application for{' '}
                <strong>
                  {cancellingLeave.startDate} to {cancellingLeave.endDate}
                </strong>
                ?
              </p>
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                Reason: "{cancellingLeave.reason}"
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Once cancelled, the HOD will be notified and your leave balance will remain intact.
              </p>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setCancellingLeave(null)}
                className="px-3.5 py-2 text-xs text-slate-600 hover:text-slate-800"
              >
                Keep Application
              </button>
              <button
                type="button"
                id="confirm-cancel-leave-btn"
                disabled={isCancelling}
                onClick={confirmCancelLeave}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPLY LEAVE MODAL with Live Affected Classes Preview */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-[#3947dd] uppercase tracking-wider font-semibold">
                  Leave Application
                </span>
                <h3 className="font-serif text-xl text-slate-900 font-semibold mt-0.5">
                  Apply for Academic Leave
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="p-5 overflow-y-auto flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-800">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="h-10 px-3 bg-[#f0f3ff] rounded-lg text-xs text-slate-800 outline-none border border-transparent focus:border-indigo-300"
                >
                  <option value="Casual Leave">Casual Leave (CL)</option>
                  <option value="Medical Leave">Medical Leave (ML)</option>
                  <option value="Earned Leave">Earned Leave (EL)</option>
                  <option value="On Duty">On Duty (OD - Conference/Examiner)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-800">From Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 px-3 bg-[#f0f3ff] rounded-lg text-xs text-slate-800 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-800">To Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 px-3 bg-[#f0f3ff] rounded-lg text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Dynamic preview of affected classes during leave selection */}
              <div className="p-3 bg-[#f0f3ff]/60 border border-indigo-100 rounded-xl text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-indigo-950 flex items-center gap-1 font-mono text-[11px] uppercase">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Affected Timetable Classes
                  </span>
                  <span className="font-mono text-[11px] text-indigo-700 font-medium">
                    {isPreviewLoading ? 'Checking...' : `${previewAffected.length} classes identified`}
                  </span>
                </div>
                {isPreviewLoading ? (
                  <p className="text-[11px] text-slate-500">Scanning scheduled slots...</p>
                ) : previewAffected.length === 0 ? (
                  <p className="text-[11px] text-slate-600">No scheduled teaching slots conflict with these dates.</p>
                ) : (
                  <div className="space-y-1 mt-1 max-h-24 overflow-y-auto pr-1">
                    {previewAffected.map((slot, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded border border-indigo-50">
                        <span className="font-medium text-slate-800">{slot.subjectCode} - {slot.subjectName}</span>
                        <span className="text-slate-500 font-mono">{slot.dayOfWeek} {slot.startTime}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-500 mt-2">
                  * Upon HOD approval, affected classes will automatically route to Alternative Class Management.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-800">Reason / Purpose</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g., Doctoral defense external examiner at IISc Bengaluru for thesis committee evaluation."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="p-3 bg-[#f0f3ff] rounded-lg text-xs text-slate-800 outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-800">Supporting Document / Letter</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Document_Reference_Letter.pdf"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    className="flex-1 h-10 px-3 bg-[#f0f3ff] rounded-lg text-xs text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachmentName('Takshashila_Official_Invitation.pdf')}
                    className="px-3 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attach</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
