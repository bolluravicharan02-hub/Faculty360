import React, { useState, useEffect } from 'react';
import { ShieldCheck, Filter, Clock, User, ShieldAlert, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { AccessDenied } from '../components/common/AccessDenied';

export const AuditLogsPage: React.FC = () => {
  const { role } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [moduleFilter, setModuleFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If non-admin and non-HOD attempts direct access
  if (role !== 'ADMIN' && role !== 'HOD') {
    return <AccessDenied allowedRoles={['ADMIN', 'HOD']} requiredRole="Department Head or Administrator" />;
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to load audit trail records');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = moduleFilter === 'All'
    ? logs
    : logs.filter(l => l.module === moduleFilter);

  return (
    <div className="flex flex-col w-full font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-[11px] text-[#3947dd] uppercase tracking-widest font-semibold block mb-1">
            Institutional Governance • Audit &amp; Compliance Trail
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1a146b] font-medium tracking-tight">
            Audit Logs &amp; Integrity Records
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable trace of all administrative approvals, substitution acceptances, and schedule changes
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-9 px-3 bg-white rounded-lg text-xs text-slate-700 border border-slate-200 outline-none cursor-pointer"
          >
            <option value="All">All Modules</option>
            <option value="LEAVE">Leave Module</option>
            <option value="SUBSTITUTION">Substitution Module</option>
            <option value="TIMETABLE">Timetable Module</option>
            <option value="AUTH">Authentication</option>
            <option value="SYSTEM">System Broadcasts</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-xs text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Logs Table Card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Loading immutable compliance trail...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No audit logs found for the selected filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const isLeave = log.module === 'LEAVE';
              const isSub = log.module === 'SUBSTITUTION';
              const isTimetable = log.module === 'TIMETABLE';
              const isAuth = log.module === 'AUTH';

              return (
                <div key={log.id} className="p-4 hover:bg-[#f0f3ff]/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isLeave
                          ? 'bg-amber-50 text-amber-700'
                          : isSub
                          ? 'bg-indigo-50 text-indigo-700'
                          : isAuth
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isLeave && <FileText className="w-4 h-4" />}
                      {isSub && <ShieldCheck className="w-4 h-4" />}
                      {isAuth && <ShieldAlert className="w-4 h-4" />}
                      {isTimetable && <Clock className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {log.action}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-800">{log.userName}</span>
                        <span className="text-slate-400 font-mono text-[10px]">({log.userId})</span>
                      </div>
                      <p className="text-slate-600 mt-1">{log.details}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0 font-mono text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
