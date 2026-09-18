import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface AccessDeniedProps {
  requiredRole?: string;
  allowedRoles?: Role[];
  onNavigateHome?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRole,
  allowedRoles = ['ADMIN'],
  onNavigateHome,
}) => {
  const { role } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center relative overflow-hidden">
        {/* Ambient indicator */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600" />

        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-rose-600 px-2.5 py-1 rounded-full bg-rose-50 inline-block mb-3">
          403 Access Forbidden
        </span>

        <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Restricted Academic Permission
        </h2>

        <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
          This section requires{' '}
          <strong className="text-slate-900 font-semibold">
            {requiredRole || allowedRoles.join(' or ')}
          </strong>{' '}
          privileges. You are currently authenticated with the{' '}
          <span className="px-2 py-0.5 rounded font-mono text-xs font-semibold bg-slate-100 text-slate-700">
            {role || 'UNAUTHENTICATED'}
          </span>{' '}
          institutional role.
        </p>

        {/* Role Comparison Table */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left mb-6 text-xs text-slate-600">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 font-medium text-slate-800">
            <span>Required Role</span>
            <span>Your Verified Session</span>
          </div>
          <div className="flex items-center justify-between pt-2.5">
            <span className="font-mono text-indigo-700 font-semibold">
              {allowedRoles.join(', ')}
            </span>
            <span className="font-mono text-rose-600 font-semibold">
              {role || 'NONE'} (Unauthorized)
            </span>
          </div>
        </div>

        {/* Security Policy Information */}
        <div className="border-t border-slate-100 pt-5 mt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 font-mono text-[11px] mb-4">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Role-based access enforced by PostgreSQL profile</span>
          </div>

          {onNavigateHome && (
            <div>
              <button
                type="button"
                onClick={onNavigateHome}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Overview</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
