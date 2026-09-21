import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Building,
  User,
  CheckCircle2,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { TimetableSlot } from '../types';
import { ACADEMIC_CONFIG } from '../config/academic';

export const SchedulePage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState('Tuesday');
  const [selectedDept, setSelectedDept] = useState('All');
  const [viewMode, setViewMode] = useState<'timeline' | 'weekly'>('timeline');
  const [isLoading, setIsLoading] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadSchedule();
  }, [selectedDay, selectedDept]);

  const loadSchedule = async () => {
    try {
      setIsLoading(true);
      const data = await api.getTimetable({
        day: viewMode === 'timeline' ? selectedDay : undefined,
        department: selectedDept !== 'All' ? selectedDept : undefined
      });
      setTimetable(data);
    } catch (err: any) {
      showToast('Failed to load timetable', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const timeSlots = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM'
  ];

  return (
    <div className="flex flex-col w-full font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-[11px] text-[#3947dd] uppercase tracking-widest font-semibold block mb-1">
            Academic Schedule
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1a146b] font-medium tracking-tight">
            Class Timetable &amp; Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {ACADEMIC_CONFIG.currentSemester} • Verified slot allocations and room bookings
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 shadow-2xs text-xs">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-[#312e81] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'weekly'
                  ? 'bg-[#312e81] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly Grid
            </button>
          </div>
        </div>
      </div>

      {/* Day Selector & Department Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 bg-white rounded-xl border border-slate-100 shadow-xs mb-6">
        {/* Day Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {days.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#312e81] text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:bg-[#f0f3ff] hover:text-slate-900'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Department Filter (Admin only) */}
        {role === 'ADMIN' && (
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-8 px-2.5 bg-[#f0f3ff] rounded-lg text-xs text-slate-700 outline-none border border-transparent focus:border-indigo-300"
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Commerce">Commerce</option>
              <option value="Management">Management</option>
            </select>
          </div>
        )}
      </div>

      {/* TIMELINE VIEW */}
      {viewMode === 'timeline' ? (
        <div className="flex flex-col gap-3">
          {timetable.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-100 text-slate-500 text-xs">
              No classes scheduled for {selectedDay}.
            </div>
          ) : (
            timetable.map((slot) => {
              const isOngoing = slot.status === 'IN_PROGRESS';
              const isSubstituted = slot.status === 'SUBSTITUTED';
              const isPendingSub = slot.status === 'SUBSTITUTION_PENDING';
              const isCompleted = slot.status === 'COMPLETED';

              return (
                <div
                  key={slot.id}
                  className={`p-4 bg-white rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isOngoing
                      ? 'border-indigo-200 shadow-[0_4px_16px_-2px_rgba(49,46,129,0.08)]'
                      : isPendingSub
                      ? 'border-amber-200 shadow-xs'
                      : 'border-slate-100 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className="w-20 flex flex-col shrink-0">
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        {slot.startTime}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {slot.endTime}
                      </span>
                    </div>

                    <div className="w-1 h-10 rounded-full bg-slate-200 shrink-0 hidden sm:block" />

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                          {slot.subjectCode}
                        </span>
                        <h3 className="text-base font-semibold text-slate-900 truncate">
                          {slot.subjectName}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500 text-xs mt-1">
                        <span>{slot.section}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Building className="w-3 h-3 text-slate-400" />
                          {slot.classroom}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {slot.facultyName}
                        </span>
                        {slot.enrolledStudents && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>{slot.enrolledStudents} students</span>
                          </>
                        )}
                      </div>
                      {slot.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic">
                          Note: {slot.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isOngoing && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#e0e0ff] text-[#000668] font-mono text-[11px] font-semibold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3947dd] animate-pulse" />
                        In Progress
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-medium uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    )}
                    {isSubstituted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[11px] font-medium">
                        Substituted
                      </span>
                    )}
                    {isPendingSub && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-mono text-[11px] font-medium">
                        Coverage Needed
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
            })
          )}
        </div>
      ) : (
        /* WEEKLY GRID VIEW */
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 font-mono uppercase tracking-wider text-slate-500 font-semibold w-24">
                  Day
                </th>
                <th className="p-3 font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  09:00 - 11:00 AM
                </th>
                <th className="p-3 font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  11:00 AM - 01:00 PM
                </th>
                <th className="p-3 font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  01:00 - 02:00 PM
                </th>
                <th className="p-3 font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  02:00 - 04:00 PM
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {days.map((d) => (
                <tr key={d} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-medium text-slate-800 font-mono whitespace-nowrap bg-slate-50/30">
                    {d}
                  </td>
                  <td className="p-3">
                    <div className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100/60">
                      <p className="font-semibold text-slate-800">CS-201 Data Structures</p>
                      <p className="text-[11px] text-slate-500">Room 204 • Dr. Rajesh</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100/60">
                      <p className="font-semibold text-slate-800">CS-301 DBMS</p>
                      <p className="text-[11px] text-slate-500">Room 305 • Dr. Rajesh</p>
                    </div>
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-[11px] italic">Lunch Break</td>
                  <td className="p-3">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="font-semibold text-slate-800">CS-202P Python Lab</p>
                      <p className="text-[11px] text-slate-500">Lab 4 • Dr. Rajesh</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
