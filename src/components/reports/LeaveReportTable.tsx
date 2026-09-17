import React from 'react';
import { LeaveReportItem } from '../../types';
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  records: LeaveReportItem[];
  isLoading: boolean;
}

export const LeaveReportTable: React.FC<Props> = ({ records, isLoading }) => {
  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Querying faculty leave applications from database...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
        <p className="text-sm font-medium text-slate-600">No leave records match the specified criteria</p>
        <p className="text-xs text-slate-400 mt-1">Try selecting a different status or department</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Rejected
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
            <th className="py-3 px-4">Request ID</th>
            <th className="py-3 px-4">Faculty Member</th>
            <th className="py-3 px-4">Department &amp; Role</th>
            <th className="py-3 px-4">Leave Type</th>
            <th className="py-3 px-4">Duration &amp; Dates</th>
            <th className="py-3 px-4">Reason</th>
            <th className="py-3 px-4">Approval Status</th>
            <th className="py-3 px-4">Reviewed By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {records.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3 px-4 font-mono font-medium text-indigo-900 whitespace-nowrap">
                {item.id}
              </td>
              <td className="py-3 px-4">
                <div className="font-medium text-slate-900">{item.facultyName}</div>
              </td>
              <td className="py-3 px-4">
                <div className="text-slate-800">{item.department}</div>
                <div className="text-[11px] text-slate-400">{item.designation}</div>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {item.leaveType}
                </span>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <div className="font-semibold text-slate-900">
                  {item.daysCount} {item.daysCount === 1 ? 'day' : 'days'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {item.startDate} &rarr; {item.endDate}
                </div>
              </td>
              <td className="py-3 px-4 max-w-xs">
                <p className="line-clamp-2 text-slate-600 text-xs" title={item.reason}>
                  {item.reason}
                </p>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                {getStatusBadge(item.status)}
              </td>
              <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                {item.reviewedBy ? (
                  <div>
                    <span className="font-medium text-slate-700">{item.reviewedBy}</span>
                    {item.reviewRemarks && (
                      <div className="text-[11px] text-slate-400 max-w-[140px] truncate" title={item.reviewRemarks}>
                        {item.reviewRemarks}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">Awaiting review</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
