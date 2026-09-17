import React, { useState } from 'react';
import { GraduationCap, Eye, EyeOff, AtSign, ArrowRight, Lock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, isLoading, error } = useAuth();

  const [selectedRole, setSelectedRole] = useState<Role>('FACULTY');
  const [email, setEmail] = useState('rajesh.sharma@takshashila.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setLoginError(null);
    if (role === 'ADMIN') {
      setEmail('admin@faculty360.demo');
    } else if (role === 'HOD') {
      setEmail('rajesh.sharma@takshashila.edu');
    } else {
      setEmail('rajesh.sharma@takshashila.edu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      await login(email, password, selectedRole);
      onSuccess?.();
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed. Please verify university credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient delicate background depth accents */}
      <div className="absolute -top-16 -left-12 w-64 h-64 rounded-full bg-indigo-100/50 blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-16 -right-12 w-64 h-64 rounded-full bg-blue-100/60 blur-3xl pointer-events-none -z-10" />

      <main className="w-full max-w-md">
        <div className="w-full bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-8 sm:p-10 transition-all duration-300">
          {/* Academic Emblem and Header Block */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 mb-4 rounded-xl bg-[#f0f3ff] flex items-center justify-center shadow-xs border border-indigo-50">
              <GraduationCap className="w-7 h-7 text-[#1a146b]" />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#3947dd] font-semibold mb-1.5">
              Academic Portal
            </span>
            <h1 className="font-serif text-3xl text-[#111c2d] tracking-tight font-semibold">
              Faculty360
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Takshashila University <span className="mx-1 text-slate-300">•</span> Welcome back
            </p>
          </div>

          {/* Segmented Role Selector */}
          <div className="mb-6">
            <div className="grid grid-cols-3 p-1 rounded-lg bg-[#f0f3ff]" role="tablist">
              {(['FACULTY', 'HOD', 'ADMIN'] as Role[]).map((r) => {
                const isActive = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleRoleChange(r)}
                    className={`py-1.5 px-3 rounded text-center text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-white text-[#1a146b] shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {r === 'FACULTY' ? 'Faculty' : r === 'HOD' ? 'HOD' : 'Admin'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message if any */}
          {(loginError || error) && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError || error}</span>
            </div>
          )}

          {/* Form Area */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* University Email Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-800" htmlFor="university-email">
                  University Email
                </label>
                <span className="font-mono text-[11px] text-slate-400">SSO Identity</span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="university-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh.sharma@takshashila.edu"
                  className="w-full h-11 px-3.5 pr-10 bg-[#f0f3ff] hover:bg-[#e7eeff]/60 transition-colors rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-300"
                />
                <AtSign className="w-4 h-4 absolute right-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-800" htmlFor="account-password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('SSO password reset link sent to registered university ID.')}
                  className="text-xs text-[#3947dd] hover:text-[#1a146b] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  id="account-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-3.5 pr-10 bg-[#f0f3ff] hover:bg-[#e7eeff]/60 transition-colors rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-300"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox Row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-device"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#312e81] accent-[#312e81] cursor-pointer"
                />
                <span className="text-xs text-slate-600">Remember this device</span>
              </label>
              <div className="flex items-center gap-1 text-emerald-700 font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>2FA Ready</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 bg-[#312e81] hover:bg-[#1a146b] text-white text-sm font-medium rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice Pill */}
          <div className="mt-6 pt-5 bg-transparent flex flex-col items-center text-center border-t border-slate-100">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0f3ff] text-slate-600 font-mono text-[11px]">
              <Lock className="w-3 h-3 text-[#3947dd]" />
              <span>Secure access for university faculty &amp; staff • Single Sign-On enabled</span>
            </div>
          </div>
        </div>

        {/* Understated Footer Meta */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            © 2025 Takshashila University <span className="mx-1 text-slate-300">•</span>
            <span className="hover:text-slate-600 cursor-pointer"> Privacy</span> &amp;
            <span className="hover:text-slate-600 cursor-pointer"> Terms</span>
          </p>
        </div>
      </main>
    </div>
  );
};
