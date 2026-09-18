import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserProfile, Role } from '../types';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: Role | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: Role | Role[]) => boolean;
  can: (action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'faculty360_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Derive active institutional role strictly from verified user profile
  const role: Role | null = user?.role || null;

  // Sign out cleanly, clear local storage and reset all state
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
    } finally {
      api.setToken(null);
      setUser(null);
      setError(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setIsLoading(false);
    }
  }, []);

  // Initialize and verify authentication state on mount
  useEffect(() => {
    // Register auto-logout handler for HTTP 401 unauthenticated / expired sessions
    api.onUnauthorized(() => {
      logout();
    });

    const initAuth = async () => {
      setIsLoading(true);
      setError(null);

      if (!isSupabaseConfigured || !supabase) {
        console.warn('Supabase is not configured. User remains unauthenticated.');
        setUser(null);
        api.setToken(null);
        setIsLoading(false);
        return;
      }

      try {
        // 1. Check for an active Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session || !session.access_token) {
          api.setToken(null);
          setUser(null);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setIsLoading(false);
          return;
        }

        // 2. Pass Supabase JWT to API client and validate against backend
        api.setToken(session.access_token);
        const profile = await api.getCurrentUser();

        if (profile && profile.role) {
          setUser(profile);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
        } else {
          // Account has no university profile: deny access and sign out
          await logout();
          setError('Access Denied: No registered university profile found for this account.');
        }
      } catch (err: any) {
        console.warn('Authentication verification failed on initial load:', err);
        await logout();
        if (err?.code === 'FORBIDDEN_ROLE' || err?.code === 'NO_PROFILE') {
          setError(err.message || 'Access Denied: Unrecognized academic credentials.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase auth events (TOKEN_REFRESHED, SIGNED_OUT, etc.)
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          api.setToken(null);
          setUser(null);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.access_token) {
          api.setToken(session.access_token);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [logout]);

  // Login strictly via Supabase Auth credentials verification
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      const err = new Error('Supabase authentication service is currently unavailable.');
      setError(err.message);
      throw err;
    }

    try {
      // 1. Authenticate with Supabase Auth
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (sbError || !data.session?.access_token) {
        throw new Error(sbError?.message || 'Invalid university login credentials.');
      }

      // 2. Set the verified Supabase Bearer token
      api.setToken(data.session.access_token);

      // 3. Fetch user profile and institutional role from the university database
      const profile = await api.getCurrentUser();

      if (!profile || !profile.role) {
        await supabase.auth.signOut();
        api.setToken(null);
        throw new Error('Access Denied: No active academic profile registered for this account.');
      }

      setUser(profile);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    } catch (err: any) {
      api.setToken(null);
      setUser(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      const msg = err.message || 'Authentication failed. Please check credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!role) return false;
    if (Array.isArray(roles)) {
      return roles.includes(role);
    }
    return role === roles;
  };

  const can = (action: string): boolean => {
    if (!role) return false;
    switch (action) {
      case 'review_leave':
      case 'assign_substitute':
      case 'broadcast':
      case 'view_reports':
      case 'export_reports':
        return role === 'HOD' || role === 'ADMIN';

      case 'view_audit':
      case 'manage_faculty':
      case 'system_settings':
        return role === 'ADMIN';

      case 'apply_leave':
      case 'respond_substitute':
      case 'view_schedule':
      case 'view_notifications':
        return true; // All authenticated roles

      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        error,
        login,
        logout,
        hasRole,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
