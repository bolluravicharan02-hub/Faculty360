import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
  RefreshCw,
  X,
  ChevronDown,
  BarChart3,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  GraduationCap,
  CalendarDays,
  Shuffle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import {
  ReportType,
  AttendanceReportItem,
  LeaveReportItem,
  AlternativeClassReportItem,
  ClassCompletionReportItem
} from '../types';
import { AttendanceReportTable } from '../components/reports/AttendanceReportTable';
import { LeaveReportTable } from '../components/reports/LeaveReportTable';
import { AlternativeClassReportTable } from '../components/reports/AlternativeClassReportTable';
import { ClassCompletionReportTable } from '../components/reports/ClassCompletionReportTable';

export const ReportsPage: React.FC = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  // Active Report Tab
  const [activeReport, setActiveReport] = useState<ReportType>('attendance');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  // Departments List (from DB)
  const [departments, setDepartments] = useState<string[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  
  // Attendance filters
  const [attendanceStatus, setAttendanceStatus] = useState('All');

  // Leave filters
  const [leaveType, setLeaveType] = useState('All');
  const [leaveStatus, setLeaveStatus] = useState('All');

  // Alternative Class filters
  const [altStatus, setAltStatus] = useState('All');
  const [altDate, setAltDate] = useState('All');

  // Class Completion filters
  const [dayOfWeek, setDayOfWeek] = useState('All');
  const [completionStatus, setCompletionStatus] = useState('All');
  const [semester, setSemester] = useState('All');

  // Report Records & Metrics
  const [attendanceData, setAttendanceData] = useState<{ records: AttendanceReportItem[]; metrics: any }>({
    records: [],
    metrics: { total: 0, presentCount: 0, inLectureCount: 0, onLeaveCount: 0, absentCount: 0, activeOnDuty: 0, avgAttendanceRate: 0 },
  });

  const [leaveData, setLeaveData] = useState<{ records: LeaveReportItem[]; metrics: any }>({
    records: [],
    metrics: { total: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0, totalDaysTaken: 0, approvedDaysTaken: 0 },
  });

  const [altData, setAltData] = useState<{ records: AlternativeClassReportItem[]; metrics: any }>({
    records: [],
    metrics: { total: 0, pendingAssignment: 0, offered: 0, accepted: 0, declined: 0, resolutionRate: 100 },
  });

  const [completionData, setCompletionData] = useState<{ records: ClassCompletionReportItem[]; metrics: any }>({
    records: [],
    metrics: { total: 0, completed: 0, inProgress: 0, scheduled: 0, substituted: 0, totalStudentsCovered: 0, completionRate: 0 },
  });

  // Load summary metrics once for charts
  useEffect(() => {
    api.getReportsSummary()
      .then((data) => setSummaryData(data))
      .catch((err) => console.error('Failed to load executive summary:', err));
  }, []);

  // Fetch Report Data on Tab or Filter Change
  const fetchActiveReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (activeReport === 'attendance') {
        const res = await api.getAttendanceReport({
          department: selectedDept,
          status: attendanceStatus,
          search: searchQuery,
        });
        setAttendanceData({ records: res.records, metrics: res.metrics });
        if (res.departments && res.departments.length > 0) {
          setDepartments(res.departments);
        }
      } else if (activeReport === 'leave') {
        const res = await api.getLeaveReport({
          department: selectedDept,
          leaveType,
          status: leaveStatus,
          search: searchQuery,
        });
        setLeaveData({ records: res.records, metrics: res.metrics });
        if (res.departments && res.departments.length > 0) {
          setDepartments(res.departments);
        }
      } else if (activeReport === 'alternative') {
        const res = await api.getAlternativeClassesReport({
          status: altStatus,
          date: altDate,
          search: searchQuery,
        });
        setAltData({ records: res.records, metrics: res.metrics });
      } else if (activeReport === 'completion') {
        const res = await api.getClassCompletionReport({
          dayOfWeek,
          status: completionStatus,
          department: selectedDept,
          semester,
          search: searchQuery,
        });
        setCompletionData({ records: res.records, metrics: res.metrics });
        if (res.departments && res.departments.length > 0) {
          setDepartments(res.departments);
        }
      }
    } catch (err: any) {
      console.error('Report fetch error:', err);
      showToast(err.message || 'Failed to load report data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [
    activeReport,
    selectedDept,
    searchQuery,
    attendanceStatus,
    leaveType,
    leaveStatus,
    altStatus,
    altDate,
    dayOfWeek,
    completionStatus,
    semester,
    showToast,
  ]);

  useEffect(() => {
    fetchActiveReportData();
  }, [fetchActiveReportData]);

  // Check if any filters are active
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedDept !== 'All' ||
    (activeReport === 'attendance' && attendanceStatus !== 'All') ||
    (activeReport === 'leave' && (leaveType !== 'All' || leaveStatus !== 'All')) ||
    (activeReport === 'alternative' && (altStatus !== 'All' || altDate !== 'All')) ||
    (activeReport === 'completion' && (dayOfWeek !== 'All' || completionStatus !== 'All' || semester !== 'All'))
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDept('All');
    setAttendanceStatus('All');
    setLeaveType('All');
    setLeaveStatus('All');
    setAltStatus('All');
    setAltDate('All');
    setDayOfWeek('All');
    setCompletionStatus('All');
    setSemester('All');
  };

  // Build active filter parameters for CSV export
  const getActiveFiltersMap = (): Record<string, string> => {
    const filters: Record<string, string> = {};
    if (searchQuery.trim()) filters.search = searchQuery.trim();
    if (selectedDept !== 'All') filters.department = selectedDept;

    if (activeReport === 'attendance') {
      if (attendanceStatus !== 'All') filters.status = attendanceStatus;
    } else if (activeReport === 'leave') {
      if (leaveType !== 'All') filters.leaveType = leaveType;
      if (leaveStatus !== 'All') filters.status = leaveStatus;
    } else if (activeReport === 'alternative') {
      if (altStatus !== 'All') filters.status = altStatus;
      if (altDate !== 'All') filters.date = altDate;
    } else if (activeReport === 'completion') {
      if (dayOfWeek !== 'All') filters.dayOfWeek = dayOfWeek;
      if (completionStatus !== 'All') filters.status = completionStatus;
      if (semester !== 'All') filters.semester = semester;
    }
    return filters;
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const filters = getActiveFiltersMap();
      await api.exportCsv(activeReport, filters);
      showToast(`${activeReport.toUpperCase()} report exported with active filters.`);
    } catch (err: any) {
      showToast(err.message || 'Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col w-full font-sans pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-[11px] text-[#3947dd] uppercase tracking-widest font-semibold block mb-1">
            Institutional Intelligence
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1a146b] font-medium tracking-tight">
            Academic Reports &amp; Monitoring
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time institutional reports powered by live database records and audit tracking
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCharts(!showCharts)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              showCharts
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{showCharts ? 'Hide Visuals' : 'View Analytics'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export Filtered CSV'}</span>
          </button>
        </div>
      </div>

      {/* Visual Analytics Expandable Panel */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 transition-all">
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
            <h2 className="font-serif text-base font-semibold text-slate-900 mb-1">
              Department Attendance Rate (%)
            </h2>
            <p className="text-xs text-slate-500 mb-4">Biometric check-in percentage across departments</p>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryData?.departmentAttendance || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Attendance Rate']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="attendance" fill="#312e81" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
            <h2 className="font-serif text-base font-semibold text-slate-900 mb-1">
              Weekly Attendance Trend (%)
            </h2>
            <p className="text-xs text-slate-500 mb-4">Daily faculty attendance continuity over the week</p>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summaryData?.weeklyAttendanceTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[85, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Attendance']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="attendance" stroke="#3947dd" strokeWidth={2.5} dot={{ fill: '#1a146b', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Report Module Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveReport('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeReport === 'attendance'
              ? 'bg-[#312e81] text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Attendance Report</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeReport === 'attendance' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {attendanceData.metrics.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('leave')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeReport === 'leave'
              ? 'bg-[#312e81] text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Leave Report</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeReport === 'leave' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {leaveData.metrics.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('alternative')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeReport === 'alternative'
              ? 'bg-[#312e81] text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          <span>Alternative Class Report</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeReport === 'alternative' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {altData.metrics.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('completion')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeReport === 'completion'
              ? 'bg-[#312e81] text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Class Completion Report</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeReport === 'completion' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {completionData.metrics.total}
          </span>
        </button>
      </div>

      {/* Dynamic KPI Metrics Ribbon (Computed from Real DB Queries) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {activeReport === 'attendance' && (
          <>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Total Queried</span>
              <span className="font-serif text-2xl font-semibold text-[#1a146b] mt-0.5 block">
                {attendanceData.metrics.total}
              </span>
              <span className="text-[11px] text-slate-500">Faculty records</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Present Today</span>
              <span className="font-serif text-2xl font-semibold text-emerald-700 mt-0.5 block">
                {attendanceData.metrics.presentCount}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">On campus</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">In Lecture</span>
              <span className="font-serif text-2xl font-semibold text-indigo-600 mt-0.5 block">
                {attendanceData.metrics.inLectureCount}
              </span>
              <span className="text-[11px] text-indigo-500">Currently teaching</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">On Leave</span>
              <span className="font-serif text-2xl font-semibold text-purple-700 mt-0.5 block">
                {attendanceData.metrics.onLeaveCount}
              </span>
              <span className="text-[11px] text-purple-600">Substitutes assigned</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Avg Attendance Rate</span>
              <span className="font-serif text-2xl font-semibold text-[#1a146b] mt-0.5 block">
                {attendanceData.metrics.avgAttendanceRate}%
              </span>
              <span className="text-[11px] text-slate-500">Academic baseline</span>
            </div>
          </>
        )}

        {activeReport === 'leave' && (
          <>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Total Requests</span>
              <span className="font-serif text-2xl font-semibold text-[#1a146b] mt-0.5 block">
                {leaveData.metrics.total}
              </span>
              <span className="text-[11px] text-slate-500">Applications filed</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Approved</span>
              <span className="font-serif text-2xl font-semibold text-emerald-700 mt-0.5 block">
                {leaveData.metrics.approvedCount}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">HOD ratified</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Pending Review</span>
              <span className="font-serif text-2xl font-semibold text-amber-600 mt-0.5 block">
                {leaveData.metrics.pendingCount}
              </span>
              <span className="text-[11px] text-amber-600">Requires action</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Rejected</span>
              <span className="font-serif text-2xl font-semibold text-rose-600 mt-0.5 block">
                {leaveData.metrics.rejectedCount}
              </span>
              <span className="text-[11px] text-slate-400">Declined</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Total Days Taken</span>
              <span className="font-serif text-2xl font-semibold text-[#1a146b] mt-0.5 block">
                {leaveData.metrics.totalDaysTaken}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">({leaveData.metrics.approvedDaysTaken} approved)</span>
            </div>
          </>
        )}

        {activeReport === 'alternative' && (
          <>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Total Classes</span>
              <span className="font-serif text-2xl font-semibold text-[#1a146b] mt-0.5 block">
                {altData.metrics.total}
              </span>
              <span className="text-[11px] text-slate-500">Affected slots</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Needs Substitute</span>
              <span className="font-serif text-2xl font-semibold text-amber-600 mt-0.5 block">
                {altData.metrics.pendingAssignment}
              </span>
              <span className="text-[11px] text-amber-600">Pending candidate</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Offered / Pending</span>
              <span className="font-serif text-2xl font-semibold text-indigo-600 mt-0.5 block">
                {altData.metrics.offered}
              </span>
              <span className="text-[11px] text-indigo-500">Awaiting faculty</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Accepted &amp; Covered</span>
              <span className="font-serif text-2xl font-semibold text-emerald-700 mt-0.5 block">
                {altData.metrics.accepted}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">Fulfillment secured</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Resolution Rate</span>
              <span className="font-serif text-2xl font-semibold text-[#1a146b] mt-0.5 block">
                {altData.metrics.resolutionRate}%
              </span>
              <span className="text-[11px] text-slate-500">Substituted ratio</span>
            </div>
          </>
        )}

        {activeReport === 'completion' && (
          <>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Scheduled Slots</span>
              <span className="font-serif text-2xl font-semibold text-[#1a146b] mt-0.5 block">
                {completionData.metrics.total}
              </span>
              <span className="text-[11px] text-slate-500">Timetable slots</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Completed</span>
              <span className="font-serif text-2xl font-semibold text-emerald-700 mt-0.5 block">
                {completionData.metrics.completed}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">Delivered</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">In Progress</span>
              <span className="font-serif text-2xl font-semibold text-indigo-600 mt-0.5 block">
                {completionData.metrics.inProgress}
              </span>
              <span className="text-[11px] text-indigo-500">Live lecture</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Substituted</span>
              <span className="font-serif text-2xl font-semibold text-purple-700 mt-0.5 block">
                {completionData.metrics.substituted}
              </span>
              <span className="text-[11px] text-purple-600">Alternative coverage</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Completion Rate</span>
              <span className="font-serif text-2xl font-semibold text-[#1a146b] mt-0.5 block">
                {completionData.metrics.completionRate}%
              </span>
              <span className="text-[11px] text-slate-500">Syllabus delivery</span>
            </div>
          </>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeReport === 'attendance'
                  ? 'Search by faculty name, ID, or designation...'
                  : activeReport === 'leave'
                  ? 'Search by faculty name, reason, or ID...'
                  : activeReport === 'alternative'
                  ? 'Search by subject, code, original or substitute faculty...'
                  : 'Search by subject code, subject name, faculty, room...'
              }
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter (For Attendance, Leave, and Completion) */}
          {activeReport !== 'alternative' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Attendance Status Filter */}
          {activeReport === 'attendance' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="In Lecture">In Lecture</option>
                <option value="On Leave">On Leave</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          )}

          {/* Leave Type Filter */}
          {activeReport === 'leave' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Type:</span>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Medical Leave">Medical Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                  <option value="Duty Leave">Duty Leave</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <select
                  value={leaveStatus}
                  onChange={(e) => setLeaveStatus(e.target.value)}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </>
          )}

          {/* Alternative Class Status Filter */}
          {activeReport === 'alternative' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={altStatus}
                onChange={(e) => setAltStatus(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="PENDING_FACULTY_ASSIGNMENT">Needs Substitute</option>
                <option value="OFFERED_TO_FACULTY">Offered to Faculty</option>
                <option value="ACCEPTED">Accepted / Covered</option>
                <option value="DECLINED">Declined</option>
              </select>
            </div>
          )}

          {/* Completion Filters */}
          {activeReport === 'completion' && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Day:</span>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Days</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <select
                  value={completionStatus}
                  onChange={(e) => setCompletionStatus(e.target.value)}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Sem:</span>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="All">All Semesters</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
              </div>
            </>
          )}

          {/* Refresh and Reset Controls */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset all active filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fetchActiveReportData()}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Refresh database records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Report Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900 capitalize">
              {activeReport === 'attendance'
                ? 'Faculty Biometric & Daily Attendance'
                : activeReport === 'leave'
                ? 'Faculty Leave Applications & Utilization'
                : activeReport === 'alternative'
                ? 'Alternative Class Arrangements & Substitutions'
                : 'Class Delivery, Timetable & Completion Log'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              {activeReport === 'attendance'
                ? `${attendanceData.records.length} records`
                : activeReport === 'leave'
                ? `${leaveData.records.length} records`
                : activeReport === 'alternative'
                ? `${altData.records.length} records`
                : `${completionData.records.length} records`}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Direct PostgreSQL Drizzle Query
          </div>
        </div>

        {activeReport === 'attendance' && (
          <AttendanceReportTable records={attendanceData.records} isLoading={isLoading} />
        )}

        {activeReport === 'leave' && (
          <LeaveReportTable records={leaveData.records} isLoading={isLoading} />
        )}

        {activeReport === 'alternative' && (
          <AlternativeClassReportTable records={altData.records} isLoading={isLoading} />
        )}

        {activeReport === 'completion' && (
          <ClassCompletionReportTable records={completionData.records} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
};
