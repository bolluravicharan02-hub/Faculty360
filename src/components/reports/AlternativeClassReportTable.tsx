import React from 'react';
import { AlternativeClassReportItem } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  records: AlternativeClassReportItem[];
  isLoading: boolean;
}

export const AlternativeClassReportTable: React.FC<Props> = ({ records, isLoading }) => {
  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Querying alternative class arrangements from database...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
        <p className="text-sm font-medium text-slate-600">No alternative class records match the selected filter</p>
        <p className="text-xs text-slate-400 mt-1">Try changing the status or search filter</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Accepted / Active
          </span>
        );
      case 'OFFERED_TO_FACULTY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3 h-3" /> Offered to Faculty
          </span>
        );
      case 'PENDING_FACULTY_ASSIGNMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Needs Substitute
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Declined
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
            <th className="py-3 px-4">Assignment ID</th>
            <th className="py-3 px-4">Subject &amp; Code</th>
            <th className="py-3 px-4">Section &amp; Venue</th>
            <th className="py-3 px-4">Class Date &amp; Time</th>
            <th className="py-3 px-4">Original Faculty</th>
            <th className="py-3 px-4">Assigned Substitute</th>
            <th className="py-3 px-4">Assignment Status</th>
            <th className="py-3 px-4">Reason / Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {records.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-4 font-mono font-medium text-indigo-900 whitespace-nowrap">
                {item.id}
              </td>
              <td className="py-3 px-4">
                <div className="font-semibold text-slate-900">{item.subjectName}</div>
                <div className="text-[11px] font-mono text-indigo-600">{item.subjectCode}</div>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <div className="text-slate-800 font-medium">{item.section}</div>
                <div className="text-[11px] text-slate-400">{item.classroom}</div>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <div className="font-medium text-slate-900">{item.date}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {item.startTime} - {item.endTime}
                </div>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <span className="text-slate-700 font-medium">{item.originalFacultyName}</span>
                <span className="block text-[10px] text-rose-500 font-medium">On Leave</span>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                {item.assignedFacultyName ? (
                  <div>
                    <span className="font-semibold text-slate-900">{item.assignedFacultyName}</span>
                    <span className="block text-[10px] text-emerald-600 font-medium">Designated</span>
                  </div>
                ) : (
                  <span className="text-amber-600 font-medium italic text-[11px]">Unassigned</span>
                )}
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                {getStatusBadge(item.status)}
              </td>
              <td className="py-3 px-4 max-w-xs">
                <p className="line-clamp-2 text-slate-500 text-xs" title={item.notes || item.reason}>
                  {item.notes || item.reason}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
