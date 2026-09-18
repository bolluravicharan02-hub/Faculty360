import React, { useState } from 'react';
import {
  User,
  Shield,
  Bell,
  Building,
  Key,
  Database,
  CheckCircle2,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export const SettingsPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useToast();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [substituteAutoOffer, setSubstituteAutoOffer] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Settings saved successfully.');
  };

  return (
    <div className="flex flex-col w-full font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <span className="font-mono text-[11px] text-[#3947dd] uppercase tracking-widest font-semibold block mb-1">
          Preferences &amp; System Configuration
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1a146b] font-medium tracking-tight">
          Account &amp; Academic Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your faculty credentials, institutional alerts, and role testing environment
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Profile Card */}
        <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-xs flex flex-col gap-4">
          <h2 className="font-serif text-lg font-semibold text-slate-900">
            Institutional Identity
          </h2>
          <div className="flex items-center gap-4">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 shadow-xs"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.designation}</p>
              <p className="font-mono text-xs text-[#3947dd]">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700">Department</label>
              <input
                type="text"
                disabled
                value={user?.departmentName || 'Computer Science & Engineering'}
                className="h-10 px-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700">Faculty ID Code</label>
              <input
                type="text"
                disabled
                value={user?.facultyId || 'FAC-CSE-001'}
                className="h-10 px-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Verified Institutional Role & Identity */}
        <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-semibold text-slate-900">
                Institutional Security &amp; Identity
              </h2>
              <p className="text-xs text-slate-500">
                Academic privilege and department affiliations managed by Supabase Auth and Takshashila Registry
              </p>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Identity</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f9f9ff] flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">Assigned Role</p>
                <p className="text-sm font-semibold text-[#1a146b] mt-0.5">{role}</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Enforced by PostgreSQL DB</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f9f9ff] flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">Department</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{user?.departmentName || 'Computer Science'}</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Takshashila University</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-[#f9f9ff] flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">Authentication Provider</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">Supabase Auth</p>
              </div>
              <p className="text-[10px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Strict Token Validation</span>
              </p>
            </div>
          </div>
        </div>

        {/* Notifications and Automations */}
        <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-xs flex flex-col gap-4">
          <h2 className="font-serif text-lg font-semibold text-slate-900">
            System Alerts &amp; Automation
          </h2>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-800">Email alerts on substitution requests</p>
              <p className="text-[11px] text-slate-500">Receive immediate dispatch when offered a replacement lecture</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#312e81]"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-800">Automated Smart Substitute Ranking</p>
              <p className="text-[11px] text-slate-500">Pre-compute rule-based rankings when leave requests are approved</p>
            </div>
            <input
              type="checkbox"
              checked={substituteAutoOffer}
              onChange={(e) => setSubstituteAutoOffer(e.target.checked)}
              className="w-4 h-4 accent-[#312e81]"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-semibold text-slate-800">SMS urgent class cancellation notices</p>
              <p className="text-[11px] text-slate-500">Send alerts to student reps if no substitute available</p>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 accent-[#312e81]"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#312e81] hover:bg-[#1a146b] text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
