import React, { useState } from 'react';
import {
  GraduationCap,
  Eye,
  EyeOff,
  AtSign,
  ArrowRight,
  Lock,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, isLoading: authLoading, error: authContextError } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [signUpSuccessMessage, setSignUpSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSignUpSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await login(email.trim(), password);
        onSuccess?.();
      } else {
        // Sign up with Supabase Auth
        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Supabase authentication is not configured.');
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || undefined,
            },
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.session) {
          // Auto-signed in if email confirmation is disabled
          await login(email.trim(), password);
          onSuccess?.();
        } else {
          setSignUpSuccessMessage(
            'Registration initiated! Please check your university email inbox to confirm your account, then sign in.'
          );
          setMode('signin');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickCredential = (credEmail: string) => {
    setEmail(credEmail);
    setPassword('');
    setFormError(null);
  };

  const isLoading = authLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient delicate background depth accents */}
      <div className="absolute -top-16 -left-12 w-64 h-64 rounded-full bg-indigo-100/50 blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-16 -right-12 w-64 h-64 rounded-full bg-blue-100/60 blur-3xl pointer-events-none -z-10" />

      <main className="w-full max-w-md">
        <div className="w-full bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-8 sm:p-10 transition-all duration-300">
          {/* Academic Emblem and Header Block */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 mb-4 rounded-xl bg-[#f0f3ff] flex items-center justify-center shadow-xs border border-indigo-50">
              <GraduationCap className="w-7 h-7 text-[#1a146b]" />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#3947dd] font-semibold mb-1">
              Academic Portal
            </span>
            <h1 className="font-serif text-3xl text-[#111c2d] tracking-tight font-semibold">
              Faculty360
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Takshashila University <span className="mx-1 text-slate-300">•</span> Supabase Identity
            </p>
          </div>

          {/* Mode Selector Tabs (Sign In vs Register Credentials) */}
          <div className="mb-5">
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#f0f3ff]" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => {
                  setMode('signin');
                  setFormError(null);
                  setSignUpSuccessMessage(null);
                }}
                className={`py-1.5 px-3 rounded-lg text-center text-xs font-medium transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white text-[#1a146b] shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => {
                  setMode('signup');
                  setFormError(null);
                  setSignUpSuccessMessage(null);
                }}
                className={`py-1.5 px-3 rounded-lg text-center text-xs font-medium transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-[#1a146b] shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          </div>

          {/* Success Message Banner */}
          {signUpSuccessMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{signUpSuccessMessage}</span>
            </div>
          )}

          {/* Error Message Banner */}
          {(formError || authContextError) && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{formError || authContextError}</span>
            </div>
          )}

          {/* Form Area */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name Input (Sign Up mode only) */}
            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-800" htmlFor="user-fullname">
                  Full Name &amp; Title
                </label>
                <input
                  id="user-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Jane Doe"
                  className="w-full h-11 px-3.5 bg-[#f0f3ff] hover:bg-[#e7eeff]/60 transition-colors rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-300"
                />
              </div>
            )}

            {/* University Email Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-800" htmlFor="university-email">
                  University Email
                </label>
                <span className="font-mono text-[11px] text-slate-400">SSO Identifier</span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="university-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@takshashila.edu"
                  className="w-full h-11 px-3.5 pr-10 bg-[#f0f3ff] hover:bg-[#e7eeff]/60 transition-colors rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-300"
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
                {mode === 'signin' && (
                  <span className="text-[11px] text-slate-400">Supabase Auth</span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  id="account-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-3.5 pr-10 bg-[#f0f3ff] hover:bg-[#e7eeff]/60 transition-colors rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-300"
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

            {/* Checkbox Row (Sign in only) */}
            {mode === 'signin' && (
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="remember-device"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#312e81] accent-[#312e81] cursor-pointer"
                  />
                  <span className="text-xs text-slate-600">Remember session</span>
                </label>
                <div className="flex items-center gap-1 text-emerald-700 font-mono text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure JWT</span>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 mt-2 bg-[#312e81] hover:bg-[#1a146b] text-white text-sm font-medium rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'signin' ? 'Authenticating with Supabase...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Faculty360' : 'Register Supabase Account'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Institutional Directory Reference */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium mb-2 text-center">
              Registered Institutional Profiles
            </p>
            <div className="flex flex-col gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillQuickCredential('rct9096wgl@gmail.com')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-indigo-50/50 text-slate-700 transition-colors text-left cursor-pointer border border-slate-100"
              >
                <span className="truncate">rct9096wgl@gmail.com</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold shrink-0 ml-2">
                  ADMIN
                </span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredential('rajesh.sharma@takshashila.edu')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-indigo-50/50 text-slate-700 transition-colors text-left cursor-pointer border border-slate-100"
              >
                <span className="truncate">rajesh.sharma@takshashila.edu</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold shrink-0 ml-2">
                  HOD
                </span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredential('arun.kumar@takshashila.edu')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-indigo-50/50 text-slate-700 transition-colors text-left cursor-pointer border border-slate-100"
              >
                <span className="truncate">arun.kumar@takshashila.edu</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold shrink-0 ml-2">
                  FACULTY
                </span>
              </button>
            </div>
          </div>

          {/* Security Notice Pill */}
          <div className="mt-5 pt-4 bg-transparent flex flex-col items-center text-center border-t border-slate-100">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0f3ff] text-slate-600 font-mono text-[11px]">
              <Lock className="w-3 h-3 text-[#3947dd]" />
              <span>Password and tokens managed exclusively by Supabase Auth</span>
            </div>
          </div>
        </div>

        {/* Understated Footer Meta */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            © 2025 Takshashila University <span className="mx-1 text-slate-300">•</span>
            <span> Protected Academic Infrastructure</span>
          </p>
        </div>
      </main>
    </div>
  );
};
