import React, { useState } from 'react';
import {
  GraduationCap,
  Eye,
  EyeOff,
  AtSign,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, isLoading: authLoading, error: authContextError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password flow
  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      onSuccess?.();
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetMessage('Please enter your university email address.');
      setResetStatus('error');
      return;
    }

    setResetStatus('loading');
    setResetMessage(null);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) {
          throw new Error(error.message);
        }
      }
      setResetStatus('success');
      setResetMessage(
        'Password reset instructions have been sent to your institutional email. Please follow the instructions to set a new password.'
      );
    } catch (err: any) {
      setResetStatus('error');
      setResetMessage(
        err.message || 'Unable to send reset instructions. Please contact IT Administration.'
      );
    }
  };

  const isLoading = authLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient accents */}
      <div className="absolute -top-16 -left-12 w-64 h-64 rounded-full bg-indigo-100/50 blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-16 -right-12 w-64 h-64 rounded-full bg-blue-100/60 blur-3xl pointer-events-none -z-10" />

      <main className="w-full max-w-md">
        <div className="w-full bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-8 sm:p-10 transition-all duration-300">
          {/* Academic Emblem and Branding */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 mb-3.5 rounded-xl bg-[#f0f3ff] flex items-center justify-center shadow-xs border border-indigo-50">
              <GraduationCap className="w-7 h-7 text-[#1a146b]" />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#3947dd] font-semibold mb-1">
              Takshashila University
            </span>
            <h1 className="font-serif text-3xl text-[#111c2d] tracking-tight font-semibold">
              Faculty360
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Academic &amp; Faculty Administration Portal
            </p>
          </div>

          {!isForgotPasswordView ? (
            <>
              {/* Error Message Banner */}
              {(formError || authContextError) && (
                <div
                  id="login-error-banner"
                  role="alert"
                  className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-xs text-rose-700"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="leading-relaxed">{formError || authContextError}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                {/* University Email Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-800" htmlFor="login-email">
                    University Email
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="username"
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
                    <label className="text-xs font-medium text-slate-800" htmlFor="login-password">
                      Password
                    </label>
                    <button
                      type="button"
                      id="forgot-password-toggle-btn"
                      onClick={() => {
                        setResetEmail(email);
                        setIsForgotPasswordView(true);
                        setFormError(null);
                      }}
                      className="text-xs font-medium text-[#3947dd] hover:text-[#1a146b] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-11 pl-3.5 pr-10 bg-[#f0f3ff] hover:bg-[#e7eeff]/60 transition-colors rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-300"
                    />
                    <button
                      type="button"
                      id="toggle-password-visibility-btn"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors rounded"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Session Security Indicator */}
                <div className="flex items-center justify-end pt-0.5">
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Supabase Institutional Session</span>
                  </div>
                </div>

                {/* Sign In Submit Button */}
                <button
                  type="submit"
                  id="login-submit-button"
                  disabled={isLoading}
                  className="w-full h-11 mt-1 bg-[#312e81] hover:bg-[#1a146b] text-white text-sm font-medium rounded-xl shadow-xs hover:shadow transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75"
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
            </>
          ) : (
            /* Forgot Password Flow */
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  id="back-to-login-btn"
                  onClick={() => {
                    setIsForgotPasswordView(false);
                    setResetStatus('idle');
                    setResetMessage(null);
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 text-slate-900 font-medium text-sm">
                  <KeyRound className="w-4 h-4 text-[#3947dd]" />
                  <span>Reset Institutional Password</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered university email. We will send a secure link to reset your account credentials.
              </p>

              {resetMessage && (
                <div
                  id="reset-message-banner"
                  role="alert"
                  className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                    resetStatus === 'success'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                      : 'bg-rose-50 border-rose-100 text-rose-700'
                  }`}
                >
                  {resetStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{resetMessage}</span>
                </div>
              )}

              {resetStatus !== 'success' && (
                <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-800" htmlFor="reset-email">
                      University Email
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="reset-email"
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="name@takshashila.edu"
                        className="w-full h-11 px-3.5 pr-10 bg-[#f0f3ff] hover:bg-[#e7eeff]/60 transition-colors rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-300"
                      />
                      <AtSign className="w-4 h-4 absolute right-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="send-reset-link-btn"
                    disabled={resetStatus === 'loading'}
                    className="w-full h-11 bg-[#312e81] hover:bg-[#1a146b] text-white text-sm font-medium rounded-xl shadow-xs hover:shadow transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {resetStatus === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending reset link...</span>
                      </>
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>
                </form>
              )}

              <button
                type="button"
                id="return-to-signin-btn"
                onClick={() => {
                  setIsForgotPasswordView(false);
                  setResetStatus('idle');
                  setResetMessage(null);
                }}
                className="w-full py-2 text-center text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Return to Sign In
              </button>
            </div>
          )}
        </div>

        {/* Footer Meta */}
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
