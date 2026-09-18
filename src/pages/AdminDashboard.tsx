import React, { useState, useEffect } from 'react';
import {
  Users,
  Building,
  CalendarDays,
  Sparkles,
  BarChart3,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowRight,
  TrendingUp,
  Download,
  Activity,
  UserCheck,
  GraduationCap,
  Filter,
  Check,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import {
  Department,
  FacultyMember,
  LeaveRequest,
  AuditLog
} from '../types';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [reportsSummary, setReportsSummary] = useState<any>(null);
  const [attendanceReport, setAttendanceReport] = useState<any>(null);
  const [altReport, setAltReport] = useState<any>(null);

  // Filters
  const [facultySearch, setFacultySearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [auditModuleFilter, setAuditModuleFilter] = useState('All');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const [
        deptData,
        facData,
        leaveData,
        auditData,
        repSummary,
        attData,
        altData
      ] = await Promise.all([
        api.getDepartments().catch(() => []),
        api.getFaculty().catch(() => []),
        api.getLeaves().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getReportsSummary().catch(() => null),
        api.getAttendanceReport().catch(() => null),
        api.getAlternativeClassesReport().catch(() => null)
      ]);

      setDepartments(deptData || []);
      setFacultyList(facData || []);
      setLeaves(leaveData || []);
      setAuditLogs(auditData || []);
      setReportsSummary(repSummary || null);
      setAttendanceReport(attData || null);
      setAltReport(altData || null);
    } catch (err: any) {
      console.error('Failed to load admin dashboard data:', err);
      setHasError(true);
      showToast('Error loading administrative overview metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = async (type: string) => {
    try {
      setIsExporting(true);
      await api.exportCsv(type);
      showToast(`University ${type} report downloaded successfully.`);
    } catch (err: any) {
      showToast(err.message || 'Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 1. Faculty stats calculation
  const totalFaculty = facultyList.length;
  const facultyPresent = facultyList.filter(f => f.status === 'Present' || f.status === 'In Lecture').length;
  const facultyInLecture = facultyList.filter(f => f.status === 'In Lecture').length;
  const facultyOnLeave = facultyList.filter(f => f.status === 'On Leave').length;
  const facultyOffDuty = facultyList.filter(f => f.status === 'Off Duty').length;

  // 2. Attendance stats calculation
  const attendanceMetrics = attendanceReport?.metrics || {
    total: totalFaculty,
    presentCount: facultyPresent,
    inLectureCount: facultyInLecture,
    onLeaveCount: facultyOnLeave,
    absentCount: facultyOffDuty,
    avgAttendanceRate: totalFaculty > 0 ? Math.round((facultyPresent / totalFaculty) * 100) : 0
  };

  // 3. Leave summary stats calculation
  const totalLeaves = leaves.length;
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;
  const approvedLeaves = leaves.filter(l => l.status === 'APPROVED').length;
  const rejectedLeaves = leaves.filter(l => l.status === 'REJECTED').length;
  const totalLeaveDays = leaves.reduce((sum, l) => sum + (l.daysCount || 1), 0);

  // 4. Alternative class summary calculation
  const altMetrics = altReport?.metrics || {
    total: 0,
    pendingAssignment: 0,
    offered: 0,
    accepted: 0,
    declined: 0,
    resolutionRate: 0
  };

  // Filtered faculty for table
  const filteredFaculty = facultyList.filter(f => {
    const matchesDept = selectedDeptFilter === 'All' || f.department === selectedDeptFilter;
    const matchesSearch = !facultySearch.trim() ||
      f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
      f.email.toLowerCase().includes(facultySearch.toLowerCase()) ||
      f.designation.toLowerCase().includes(facultySearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditModuleFilter === 'All') return true;
    return log.module === auditModuleFilter;
  });

  if (role !== 'ADMIN') {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-xs max-w-lg mx-auto mt-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-lg font-bold text-slate-900 mb-1">
          Administrator Access Restricted
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          This portal is reserved for University Administration. Please return to your designated academic dashboard.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="px-4 py-2 bg-[#312e81] text-white rounded-xl text-xs font-semibold hover:bg-[#1a146b] transition-colors cursor-pointer"
        >
          Return to Workspace
        </button>
      </div>
    );
  }

  if (hasError && facultyList.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-100 shadow-xs max-w-lg mx-auto mt-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-lg font-bold text-slate-900 mb-1">
          Unable to Load Governance Metrics
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Could not establish secure connection to the institutional database to load university administration metrics.
        </p>
        <button
          type="button"
          onClick={loadDashboardData}
          className="px-4 py-2 bg-[#312e81] text-white rounded-xl text-xs font-semibold hover:bg-[#1a146b] transition-colors cursor-pointer"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  if (isLoading && facultyList.length === 0) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 text-[#312e81] animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Loading university governance metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. University Executive Banner */}
      <div className="bg-gradient-to-r from-[#1a146b] via-[#241c8f] to-[#312e81] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-indigo-200 font-mono text-xs border border-white/10">
              <Building className="w-3.5 h-3.5 text-indigo-300" />
              <span>Takshashila University • Executive Administration</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
              University Governance &amp; Administration
            </h1>
            <p className="text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
              Real-time oversight of university faculties, departmental rosters, daily attendance, institutional leave flows, and alternative class coverage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-xs transition-all border border-white/10 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#1a146b] hover:bg-indigo-50 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#1a146b]" />
              <span>Full Reports</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('audit')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-white text-xs font-medium border border-indigo-400/30 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span>Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Executive High-Level Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-white">
          <div>
            <span className="text-[11px] font-mono text-indigo-200 uppercase tracking-wider">Total Faculty</span>
            <p className="font-serif text-2xl font-bold mt-0.5">{totalFaculty}</p>
            <span className="text-[10px] text-indigo-200">Across {departments.length} departments</span>
          </div>
          <div>
            <span className="text-[11px] font-mono text-indigo-200 uppercase tracking-wider">Attendance Rate</span>
            <p className="font-serif text-2xl font-bold mt-0.5">{attendanceMetrics.avgAttendanceRate}%</p>
            <span className="text-[10px] text-emerald-300">✓ Within target benchmark</span>
          </div>
          <div>
            <span className="text-[11px] font-mono text-indigo-200 uppercase tracking-wider">Active Leaves</span>
            <p className="font-serif text-2xl font-bold mt-0.5">{facultyOnLeave}</p>
            <span className="text-[10px] text-indigo-200">{pendingLeaves} awaiting HOD review</span>
          </div>
          <div>
            <span className="text-[11px] font-mono text-indigo-200 uppercase tracking-wider">Alt Class Resolution</span>
            <p className="font-serif text-2xl font-bold mt-0.5">{altMetrics.resolutionRate}%</p>
            <span className="text-[10px] text-emerald-300">Disrupted slots covered</span>
          </div>
        </div>
      </div>

      {/* 2. Key Operational Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Summary Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Attendance</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-slate-900">{attendanceMetrics.presentCount}</span>
              <span className="text-xs text-slate-500">/ {totalFaculty} Present</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (attendanceMetrics.presentCount / Math.max(1, totalFaculty)) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span>{attendanceMetrics.inLectureCount} in lecture</span>
              <span>{attendanceMetrics.onLeaveCount} on leave</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs text-indigo-700 hover:text-indigo-900 font-medium flex items-center justify-between group cursor-pointer"
          >
            <span>View Attendance Log</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Leave Summary Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Leave Summary</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-slate-900">{totalLeaves}</span>
              <span className="text-xs text-slate-500">Applications</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-3 pt-1 text-center">
              <div className="bg-amber-50 rounded-lg p-1.5 border border-amber-100/60">
                <span className="text-[10px] text-amber-700 font-medium block">Pending</span>
                <span className="text-xs font-bold text-amber-900">{pendingLeaves}</span>
              </div>
              <div className="bg-emerald-50 rounded-lg p-1.5 border border-emerald-100/60">
                <span className="text-[10px] text-emerald-700 font-medium block">Approved</span>
                <span className="text-xs font-bold text-emerald-900">{approvedLeaves}</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200/60">
                <span className="text-[10px] text-slate-600 font-medium block">Total Days</span>
                <span className="text-xs font-bold text-slate-900">{totalLeaveDays}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('leave')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs text-indigo-700 hover:text-indigo-900 font-medium flex items-center justify-between group cursor-pointer"
          >
            <span>University Leave Oversight</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Alternative Class Coverage Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">Substitutions</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-slate-900">{altMetrics.resolutionRate}%</span>
              <span className="text-xs text-slate-500">Coverage Rate</span>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{altMetrics.accepted} Accepted</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 ml-2" />
              <span>{altMetrics.offered + altMetrics.pendingAssignment} Pending</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              All slots affected by faculty leaves are routed to department substitutions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('classes')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs text-indigo-700 hover:text-indigo-900 font-medium flex items-center justify-between group cursor-pointer"
          >
            <span>Alternative Classes</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Security & Audit Summary Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">System Audit</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-slate-900">{auditLogs.length}</span>
              <span className="text-xs text-slate-500">Logged Events</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Strict RBAC Active</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Database security enforced via PostgreSQL and Supabase Auth JWTs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('audit')}
            className="mt-4 pt-3 border-t border-slate-100 text-xs text-indigo-700 hover:text-indigo-900 font-medium flex items-center justify-between group cursor-pointer"
          >
            <span>View Governance Logs</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* 3. Department Overview Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building className="w-5 h-5 text-[#1a146b]" />
              <span>University Departments Overview</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Academic divisions, faculty distribution, and current operational status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              {departments.length} Active Departments
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const deptFaculty = facultyList.filter(f => f.department === dept.name);
            const activeInLecture = deptFaculty.filter(f => f.status === 'In Lecture').length;
            const onLeaveCount = deptFaculty.filter(f => f.status === 'On Leave').length;

            return (
              <div
                key={dept.id || dept.code}
                className="p-4 rounded-xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 font-bold border border-indigo-100">
                      {dept.code}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-medium">
                      {dept.attendanceRate || 95}% Attendance
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-semibold text-slate-900 leading-snug">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span className="font-medium text-slate-700">HOD:</span>
                    <span>{dept.hodName || 'Not Assigned'}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Faculty</span>
                    <span className="font-semibold text-slate-800">{deptFaculty.length || dept.facultyCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">In Lecture</span>
                    <span className="font-semibold text-indigo-700">{activeInLecture}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">On Leave</span>
                    <span className={`font-semibold ${onLeaveCount > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                      {onLeaveCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. University-Wide Faculty Roster & Overview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1a146b]" />
              <span>University Faculty Roster</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive staff directory, current teaching schedule, and presence monitoring
            </p>
          </div>

          {/* Search & Department Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search faculty by name..."
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#f0f3ff] text-xs text-slate-800 rounded-lg outline-none border border-transparent focus:border-indigo-300 focus:bg-white transition-all w-48 sm:w-56"
              />
            </div>

            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="py-1.5 px-3 bg-[#f0f3ff] text-xs text-slate-700 rounded-lg outline-none border border-transparent focus:border-indigo-300 cursor-pointer"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.code} value={d.name}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onNavigate('faculty')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <span>Manage Directory</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Faculty Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Faculty Member</th>
                <th className="pb-3 font-semibold">Department</th>
                <th className="pb-3 font-semibold">Designation</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Classes Today</th>
                <th className="pb-3 font-semibold">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No faculty members match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredFaculty.slice(0, 8).map((faculty) => {
                const isPresent = faculty.status === 'Present';
                const isInLecture = faculty.status === 'In Lecture';
                const isOnLeave = faculty.status === 'On Leave';

                return (
                  <tr key={faculty.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#1a146b] font-semibold shrink-0">
                          {faculty.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{faculty.name}</p>
                          <p className="text-[11px] text-slate-400">{faculty.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      <span className="font-medium">{faculty.department}</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {faculty.designation}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                          isInLecture
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : isPresent
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : isOnLeave
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isInLecture ? 'bg-blue-500' : isPresent ? 'bg-emerald-500' : isOnLeave ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{faculty.status}</span>
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700 font-mono">
                      {faculty.classesToday || 0} Slots
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-slate-800">
                          {faculty.attendanceRate || 95}%
                        </span>
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${faculty.attendanceRate || 95}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>

          {filteredFaculty.length > 8 && (
            <div className="pt-3 mt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => onNavigate('faculty')}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer"
              >
                View all {filteredFaculty.length} faculty members in directory →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Reports & System Governance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports Quick Access Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#1a146b]" />
                  <span>Institutional Reports</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analytical summaries and certified institutional exports
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-100 font-semibold">
                ADMIN ACCESS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div
                onClick={() => onNavigate('reports')}
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Faculty Attendance</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Daily presence logs &amp; trends</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-700 font-semibold">{attendanceMetrics.avgAttendanceRate}% Avg</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <div
                onClick={() => onNavigate('reports')}
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Leave Audit Report</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Department leave usage &amp; days</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-xs text-indigo-700 font-semibold">{totalLeaves} Recorded</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <div
                onClick={() => onNavigate('reports')}
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Alternative Classes</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Substitution performance metrics</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-xs text-blue-700 font-semibold">{altMetrics.resolutionRate}% Resolved</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <div
                onClick={() => onNavigate('reports')}
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Timetable Completion</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Slot fulfillment &amp; coverage</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-700 font-semibold">98.4% Covered</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">Quick institutional CSV downloads:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExportCsv('attendance')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Attendance CSV</span>
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExportCsv('leave')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Leave CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent System Activity / Audit Trail Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#1a146b]" />
                  <span>Recent System Activity</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Immutable audit trail of university events &amp; administrative decisions
                </p>
              </div>

              <select
                value={auditModuleFilter}
                onChange={(e) => setAuditModuleFilter(e.target.value)}
                className="py-1 px-2.5 bg-[#f0f3ff] text-[11px] text-slate-700 rounded-lg outline-none border border-transparent focus:border-indigo-300 cursor-pointer font-mono"
              >
                <option value="All">All Modules</option>
                <option value="AUTH">Auth</option>
                <option value="LEAVE">Leave</option>
                <option value="SUBSTITUTION">Substitution</option>
                <option value="TIMETABLE">Timetable</option>
                <option value="FACULTY">Faculty</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>

            <div className="space-y-3 divide-y divide-slate-50">
              {filteredAuditLogs.slice(0, 5).map((log) => {
                const getBadge = (mod: string) => {
                  switch (mod) {
                    case 'LEAVE': return 'bg-amber-50 text-amber-800 border-amber-100';
                    case 'SUBSTITUTION': return 'bg-blue-50 text-blue-800 border-blue-100';
                    case 'AUTH': return 'bg-purple-50 text-purple-800 border-purple-100';
                    case 'TIMETABLE': return 'bg-emerald-50 text-emerald-800 border-emerald-100';
                    default: return 'bg-slate-100 text-slate-700 border-slate-200';
                  }
                };

                return (
                  <div key={log.id} className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getBadge(log.module)}`}>
                          {log.module}
                        </span>
                        <span className="font-semibold text-slate-800">{log.userName}</span>
                        <span className="text-[11px] font-mono text-slate-400">• {log.action}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-1">{log.details}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {filteredAuditLogs.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  No activity events recorded for module "{auditModuleFilter}".
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Strictly accessible by ADMIN role</span>
            <button
              type="button"
              onClick={() => onNavigate('audit')}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Explore Complete Audit Trail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
