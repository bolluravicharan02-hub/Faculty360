import React from 'react';
import { ClassCompletionReportItem } from '../../types';
import { CheckCircle2, Clock, Calendar, Users, AlertCircle } from 'lucide-react';

interface Props {
  records: ClassCompletionReportItem[];
  isLoading: boolean;
}

export const ClassCompletionReportTable: React.FC<Props> = ({ records, isLoading }) => {
  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Querying class schedule and delivery status from database...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
        <p className="text-sm font-medium text-slate-600">No timetable records match the selected filter</p>
        <p className="text-xs text-slate-400 mt-1">Try selecting a different day or department</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Calendar className="w-3 h-3" /> Scheduled
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
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
            <th className="py-3 px-4">Day &amp; Time</th>
            <th className="py-3 px-4">Subject &amp; Code</th>
            <th className="py-3 px-4">Department &amp; Sem</th>
            <th className="py-3 px-4">Venue &amp; Section</th>
            <th className="py-3 px-4">Primary Faculty</th>
            <th className="py-3 px-4">Substitute Coverage</th>
            <th className="py-3 px-4 text-center">Enrolled</th>
            <th className="py-3 px-4">Delivery Status</th>
            <th className="py-3 px-4">Session Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {records.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-4 whitespace-nowrap">
                <div className="font-semibold text-slate-900">{item.dayOfWeek}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {item.startTime} - {item.endTime}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="font-semibold text-slate-900">{item.subjectName}</div>
                <div className="text-[11px] font-mono text-indigo-600">{item.subjectCode}</div>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <div className="text-slate-800">{item.department}</div>
                <div className="text-[11px] text-slate-400">{item.semester}</div>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <div className="font-medium text-slate-900">{item.classroom}</div>
                <div className="text-[11px] text-slate-400">{item.section}</div>
              </td>
              <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                {item.facultyName}
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                {item.substitutedByName ? (
                  <div>
                    <span className="font-medium text-indigo-700">{item.substitutedByName}</span>
                    <span className="block text-[10px] text-indigo-500 font-medium">Alternative</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-[11px]">Regular Faculty</span>
                )}
              </td>
              <td className="py-3 px-4 text-center whitespace-nowrap">
                <span className="inline-flex items-center gap-1 font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  <Users className="w-3 h-3 text-slate-400" />
                  {item.enrolledStudents || 60}
                </span>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                {getStatusBadge(item.status)}
              </td>
              <td className="py-3 px-4 max-w-xs">
                <p className="line-clamp-2 text-slate-500 text-xs" title={item.notes || 'Curriculum delivery as scheduled'}>
                  {item.notes || 'Standard curriculum delivery'}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
