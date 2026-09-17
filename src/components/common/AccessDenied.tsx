import React from 'react';
import { ShieldAlert, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
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
  const { role, switchRole, isLoading } = useAuth();

  const handleRoleElevation = async (targetRole: Role) => {
    await switchRole(targetRole);
  };

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
            {role}
          </span>{' '}
          role.
        </p>

        {/* Role Comparison Table */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left mb-6 text-xs text-slate-600">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 font-medium text-slate-800">
            <span>Privilege Requirement</span>
            <span>Your Session</span>
          </div>
          <div className="flex items-center justify-between pt-2.5">
            <span className="font-mono text-indigo-700 font-semibold">
              {allowedRoles.join(', ')}
            </span>
            <span className="font-mono text-rose-600 font-semibold">
              {role} (Unauthorized)
            </span>
          </div>
        </div>

        {/* Demo Role Switch Action for Seamless Evaluation */}
        <div className="border-t border-slate-100 pt-5 mt-2">
          <p className="text-xs text-slate-500 mb-3 flex items-center justify-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
            <span>Switch role to test authorization for this module:</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {allowedRoles.map((r) => (
              <button
                key={r}
                type="button"
                disabled={isLoading}
                onClick={() => handleRoleElevation(r as Role)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#1a146b] font-medium text-xs border border-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3947dd]" />
                <span>Elevate to {r}</span>
              </button>
            ))}
          </div>

          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer mt-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
