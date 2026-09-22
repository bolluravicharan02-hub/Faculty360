import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Bell,
  Award,
  ChevronRight,
  TrendingUp,
  MapPin,
  User,
  ShieldCheck,
  CalendarDays,
  FileText,
  School,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  StudentDashboardData,
  StudentAttendanceRecord,
  TimetableSlot,
} from '../types';
import { AcademicCalendarWidget } from '../components/dashboard/AcademicCalendarWidget';
import { getCurrentDayName, getFormattedCurrentDate } from '../config/academic';

interface StudentDashboardProps {
  onNavigate?: (path: string) => void;
  initialTab?: 'overview' | 'attendance' | 'schedule' | 'calendar';
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  initialTab = 'overview',
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'schedule' | 'calendar'>(initialTab);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const today = getCurrentDayName();
    return WEEKDAYS.includes(today) ? today : 'Monday';
  });
  const [daySchedule, setDaySchedule] = useState<TimetableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const [data, schedule] = await Promise.all([
        api.getStudentDashboard(),
        api.getStudentSchedule(selectedDay),
      ]);

      setDashboardData(data);
      setDaySchedule(schedule);
    } catch (err: any) {
      console.error('Failed to load student dashboard:', err);
      setError(err.message || 'Unable to fetch student records from university database.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.id]);

  useEffect(() => {
    // When selected day changes, fetch that day's schedule
    const fetchDaySlots = async () => {
      try {
        const slots = await api.getStudentSchedule(selectedDay);
        setDaySchedule(slots);
      } catch (err) {
        console.error('Failed to fetch schedule for day:', err);
      }
    };
    fetchDaySlots();
  }, [selectedDay]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 animate-pulse">
          <GraduationCap className="w-5 h-5 text-[#312e81]" />
        </div>
        <p className="text-xs font-medium text-slate-500">Loading student records &amp; timetable...</p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-rose-100 shadow-xs max-w-xl mx-auto my-12 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">Academic Records Unavailable</h3>
        <p className="text-xs text-slate-500 mb-6">{error || 'Could not retrieve authoritative student profile.'}</p>
        <button
          type="button"
          onClick={() => fetchDashboard()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#312e81] text-white text-xs font-medium rounded-xl hover:bg-[#1a146b] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const { profile, overallAttendance, subjectsAttendance, todaySchedule, recentAnnouncements, academicStatus } = dashboardData;

  // Calculate attendance margins
  const calculateMargin = (record: StudentAttendanceRecord) => {
    const { classesHeld, classesAttended, percentage } = record;
    if (percentage >= 75) {
      // How many classes can be missed while remaining >= 75%
      // (attended) / (held + miss) >= 0.75  =>  held + miss <= attended / 0.75  =>  miss <= (attended / 0.75) - held
      const safeMisses = Math.floor(classesAttended / 0.75 - classesHeld);
      return safeMisses > 0
        ? `Can safely miss ${safeMisses} class${safeMisses > 1 ? 'es' : ''}`
        : 'On track (borderline)';
    } else {
      // How many consecutive classes must be attended to reach 75%
      // (attended + needed) / (held + needed) >= 0.75  =>  attended + needed >= 0.75*held + 0.75*needed
      // 0.25*needed >= 0.75*held - attended  =>  needed >= 3*held - 4*attended
      const needed = Math.max(1, Math.ceil(3 * classesHeld - 4 * classesAttended));
      return `Must attend next ${needed} class${needed > 1 ? 'es' : ''} to reach 75%`;
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* 1. Institutional Student Header */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_6px_rgba(0,0,0,0.03)] p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-linear-to-bl from-indigo-50/70 via-blue-50/30 to-transparent rounded-bl-full pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 font-semibold px-2 py-0.5 rounded-md">
                  Student Portal
                </span>
                <span className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                  ID: {profile.studentId}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {academicStatus.enrollmentStatus}
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl text-slate-900 font-semibold tracking-tight leading-tight">
                {profile.name}
              </h1>

              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="font-medium text-slate-700">{profile.program}</span>
                <span>•</span>
                <span>{profile.semester} (Section {profile.section})</span>
                <span>•</span>
                <span className="truncate max-w-[280px]">{profile.departmentName}</span>
              </div>
            </div>
          </div>

          {/* Action / Refresh & Today info */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <div className="text-right hidden sm:block">
              <p className="font-mono text-[10px] uppercase text-slate-400 font-medium tracking-wider">Academic Term</p>
              <p className="text-xs font-semibold text-slate-800">{academicStatus.academicYear} • Term 2</p>
            </div>
            <button
              type="button"
              id="student-dashboard-refresh-btn"
              onClick={() => fetchDashboard(true)}
              disabled={isRefreshing}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/80 cursor-pointer"
              title="Refresh student records"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Schedule', icon: School },
            { id: 'attendance', label: 'Attendance Records', icon: TrendingUp },
            { id: 'schedule', label: 'Full Timetable', icon: Calendar },
            { id: 'calendar', label: 'Academic Calendar', icon: CalendarDays },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`student-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#312e81] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Primary KPI Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance KPI */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
              Overall Attendance
            </span>
            <div className={`p-2 rounded-xl ${overallAttendance.percentage >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-serif text-3xl font-semibold text-slate-900 tracking-tight">
              {overallAttendance.percentage}%
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              overallAttendance.percentage >= 75
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
              {overallAttendance.status}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallAttendance.percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, overallAttendance.percentage)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{overallAttendance.attended} of {overallAttendance.totalClasses} classes attended</span>
            <span className="font-mono text-[10px] text-slate-400">Min 75% req</span>
          </div>
        </div>

        {/* CGPA & Academic Standing */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
              Academic Standing
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-3xl font-semibold text-slate-900 tracking-tight">
              {academicStatus.cgpa}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 10.0 CGPA</span>
          </div>
          <p className="text-xs font-medium text-indigo-900 mb-2">Semester Rank: Top 5%</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-50">
            <span>Total Credits Earned</span>
            <span className="font-semibold text-slate-700">{academicStatus.totalCredits} Credits</span>
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
              Active Courses
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-3xl font-semibold text-slate-900 tracking-tight">
              {subjectsAttendance.length}
            </span>
            <span className="text-xs text-slate-500">Subjects Registered</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">4 Theory Courses • 1 Practical Lab</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-50">
            <span>Semester Credits</span>
            <span className="font-semibold text-slate-700">22 Credits</span>
          </div>
        </div>

        {/* Today's Schedule count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-medium">
              Today's Schedule
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-serif text-3xl font-semibold text-slate-900 tracking-tight">
              {todaySchedule.length}
            </span>
            <span className="text-xs text-slate-500">Sessions Scheduled</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            {todaySchedule.length > 0 ? `First class: ${todaySchedule[0].startTime}` : 'No lectures scheduled today'}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-50">
            <span>Current Day</span>
            <span className="font-medium text-slate-700">{getCurrentDayName()}</span>
          </div>
        </div>
      </section>

      {/* 3. Tab Specific Views */}

      {/* TAB 1: OVERVIEW & SCHEDULE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Today's Schedule & Academic Calendar */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Today's Classes Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Today's Class Schedule</h2>
                    <p className="text-xs text-slate-500">
                      {getFormattedCurrentDate()} • Section {profile.section}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('schedule')}
                  className="text-xs font-medium text-[#3947dd] hover:text-[#1a146b] flex items-center gap-1 transition-colors"
                >
                  <span>View Weekly Timetable</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {todaySchedule.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50/60 border border-slate-100">
                  <School className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">No lectures scheduled today</p>
                  <p className="text-xs text-slate-500 mt-1">Enjoy your study time or check the weekly schedule for upcoming lectures.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {todaySchedule.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-[#f9f9ff]/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-[#f0f3ff] text-indigo-900 flex flex-col items-center justify-center shrink-0 border border-indigo-50">
                          <span className="font-mono text-xs font-semibold">{slot.startTime.split(' ')[0]}</span>
                          <span className="text-[9px] uppercase text-indigo-600 font-medium">{slot.startTime.split(' ')[1]}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#1a146b] bg-indigo-50 px-1.5 py-0.5 rounded">
                              {slot.subjectCode}
                            </span>
                            <span className="text-sm font-semibold text-slate-900">
                              {slot.subjectName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {slot.facultyName}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {slot.classroom}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="font-mono text-xs text-slate-500">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {slot.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Academic Calendar Widget (Highlights Current Week, Holidays, Exam Deadlines) */}
            <AcademicCalendarWidget variant="compact" />
          </div>

          {/* Right Col: Quick Attendance Snapshot & Announcements */}
          <div className="flex flex-col gap-6">
            {/* Subject Attendance Snapshot */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#3947dd]" />
                  <h3 className="text-sm font-semibold text-slate-900">Subject Attendance</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('attendance')}
                  className="text-xs font-medium text-[#3947dd] hover:text-[#1a146b]"
                >
                  View All
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {subjectsAttendance.map((sub) => (
                  <div key={sub.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-800 truncate max-w-[160px]">
                        {sub.subjectCode}: {sub.subjectName}
                      </span>
                      <span className={`font-mono font-semibold ${sub.percentage >= 75 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {sub.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full ${sub.percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, sub.percentage)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{sub.classesAttended}/{sub.classesHeld} attended</span>
                      <span>{calculateMargin(sub)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* University Announcements */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-[#3947dd]" />
                <h3 className="text-sm font-semibold text-slate-900">University Notices</h3>
              </div>

              <div className="flex flex-col gap-3">
                {recentAnnouncements.map((ann) => (
                  <div key={ann.id} className="p-3.5 rounded-xl border border-slate-100 bg-[#fbfbff] flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                        {ann.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{ann.timestamp}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 leading-snug">{ann.title}</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{ann.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED ATTENDANCE BREAKDOWN */}
      {activeTab === 'attendance' && (
        <div className="flex flex-col gap-6">
          {/* Statutory Regulations Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
            <School className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 leading-relaxed">
              <p className="font-semibold text-indigo-900 mb-0.5">University Academic Attendance Directive</p>
              Under Takshashila University Academic Regulations Section 14.2, students must maintain a minimum attendance of <strong>75%</strong> in each registered course to be eligible for end-semester examinations. Course registrations with attendance below 65% require academic board review.
            </div>
          </div>

          {/* Subject Attendance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectsAttendance.map((sub) => {
              const isSafe = sub.percentage >= 75;
              const isWarning = sub.percentage >= 65 && sub.percentage < 75;
              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-semibold text-[#1a146b] bg-indigo-50 px-2 py-0.5 rounded">
                        {sub.subjectCode}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isSafe
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : isWarning
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {sub.status}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 mb-1">{sub.subjectName}</h3>
                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Instructor: {sub.facultyName || 'Faculty Member'}</span>
                    </p>

                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="font-serif text-3xl font-semibold text-slate-900">
                        {sub.percentage}%
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {sub.classesAttended} / {sub.classesHeld} classes
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                      {/* 75% threshold indicator line */}
                      <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-slate-400 z-10" title="75% Regulatory Threshold" />
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSafe ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, sub.percentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="text-slate-500">Margin Analysis:</span>
                    <span className={`font-medium ${isSafe ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {calculateMargin(sub)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: FULL WEEKLY TIMETABLE */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Weekly Lecture Timetable</h2>
              <p className="text-xs text-slate-500">
                {profile.program} • {profile.semester} • Section {profile.section}
              </p>
            </div>

            {/* Day Selector */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
              {WEEKDAYS.map((day) => {
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-indigo-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule list for selected day */}
          <div className="flex flex-col gap-3">
            {daySchedule.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50/60 border border-slate-100">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">No classes scheduled on {selectedDay}</p>
                <p className="text-xs text-slate-500 mt-1">Check other weekdays to see your full schedule.</p>
              </div>
            ) : (
              daySchedule.map((slot) => (
                <div
                  key={slot.id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-[#f9f9ff]/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#f0f3ff] text-indigo-900 flex flex-col items-center justify-center shrink-0 border border-indigo-50">
                      <span className="font-mono text-xs font-semibold">{slot.startTime.split(' ')[0]}</span>
                      <span className="text-[9px] uppercase text-indigo-600 font-medium">{slot.startTime.split(' ')[1]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#1a146b] bg-indigo-50 px-1.5 py-0.5 rounded">
                          {slot.subjectCode}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {slot.subjectName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {slot.facultyName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {slot.classroom}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="font-mono text-xs text-slate-500">
                      {slot.startTime} – {slot.endTime}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {slot.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ACADEMIC CALENDAR & MILESTONES */}
      {activeTab === 'calendar' && (
        <AcademicCalendarWidget variant="full" />
      )}
    </div>
  );
};
