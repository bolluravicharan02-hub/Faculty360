import React from 'react';
import { AttendanceReportItem } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  records: AttendanceReportItem[];
  isLoading: boolean;
}

export const AttendanceReportTable: React.FC<Props> = ({ records, isLoading }) => {
  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Querying faculty attendance records from database...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
        <p className="text-sm font-medium text-slate-600">No attendance records match the selected filters</p>
        <p className="text-xs text-slate-400 mt-1">Try resetting the department or status filter</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Present':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Present
          </span>
        );
      case 'In Lecture':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3 h-3" /> In Lecture
          </span>
        );
      case 'On Leave':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            On Leave
          </span>
        );
      case 'Absent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Absent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-600 border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-4">Faculty ID</th>
            <th className="py-3 px-4">Faculty Name &amp; Contact</th>
            <th className="py-3 px-4">Department</th>
            <th className="py-3 px-4">Designation</th>
            <th className="py-3 px-4">Today's Status</th>
            <th className="py-3 px-4 text-center">Attendance %</th>
            <th className="py-3 px-4 text-center">Classes Today</th>
            <th className="py-3 px-4 text-center">Leave Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {records.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-4 font-mono font-medium text-indigo-900 whitespace-nowrap">
                {item.facultyId}
              </td>
              <td className="py-3 px-4">
                <div className="font-medium text-slate-900">{item.name}</div>
                <div className="text-[11px] text-slate-400">{item.email}</div>
              </td>
              <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                {item.department}
              </td>
              <td className="py-3 px-4 text-slate-600">
                {item.designation}
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                {getStatusBadge(item.status)}
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`font-semibold inline-block px-2 py-0.5 rounded ${
                  item.attendanceRate >= 95
                    ? 'bg-emerald-50 text-emerald-700'
                    : item.attendanceRate >= 90
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {item.attendanceRate}%
                </span>
              </td>
              <td className="py-3 px-4 text-center font-medium text-slate-800">
                {item.classesToday}
              </td>
              <td className="py-3 px-4 text-center text-slate-600">
                <span className="font-mono text-slate-700 font-medium">{item.leaveBalance}</span> days
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
