import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, Role } from '../types';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  user: UserProfile;
  role: Role;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password?: string, roleHint?: Role) => Promise<void>;
  logout: () => void;
  switchRole: (role: Role) => Promise<void>;
  hasRole: (roles: Role | Role[]) => boolean;
  can: (action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'faculty360_user';

export const DEFAULT_USER: UserProfile = {
  id: 'usr-rajesh',
  name: 'Dr. Rajesh Sharma',
  email: 'rajesh.sharma@takshashila.edu',
  role: 'HOD',
  facultyId: 'FAC-CSE-001',
  departmentId: 'dept-cse',
  departmentName: 'Department of Computer Science & Engineering',
  designation: 'Assoc. Professor & HOD',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  phone: '+91 98450 12345',
  leaveBalance: { casual: 6, medical: 4, earned: 2, total: 12 },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_USER;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Derive active role with fallback to 'HOD'
  const role: Role = user?.role || 'HOD';

  // Synchronize authentication session with backend on initial load
  useEffect(() => {
    const initAuth = async () => {
      let existingToken = api.getToken();
      if (!existingToken) {
        existingToken = 'demo-hod';
        api.setToken(existingToken);
      }

      try {
        const profile = await api.getCurrentUser();
        if (profile) {
          setUser(profile);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
        }
      } catch (err: any) {
        // Auto-heal session with a fresh role token
        try {
          const res = await api.switchRole(user?.role || 'HOD');
          if (res?.token) api.setToken(res.token);
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.user));
          }
        } catch {
          // Graceful fallback to default demo user
          if (!user) setUser(DEFAULT_USER);
        }
      }

      // If Supabase auth is active, listen to auth state changes
      if (isSupabaseConfigured && supabase) {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user?.email) {
            try {
              const userProfile = await api.getCurrentUser();
              setUser(userProfile);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userProfile));
            } catch {
              // ignore
            }
          }
        });
        return () => {
          authListener.subscription.unsubscribe();
        };
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password?: string, roleHint?: Role) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured && supabase && password) {
        const { error: sbError } = await supabase.auth.signInWithPassword({ email, password });
        if (sbError) {
          throw new Error(sbError.message);
        }
      }

      // Backend verification & role session token generation
      const { token, user: userProfile } = await api.login({ email, password, roleHint });
      if (token) {
        api.setToken(token);
      }
      setUser(userProfile);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userProfile));
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    // In direct-access mode, reset session to default demo user without kicking out to a login screen
    api.setToken('demo-hod');
    setUser(DEFAULT_USER);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_USER));
  };

  // Switch role synchronizes with backend token creation so all backend API guards reflect new role immediately!
  const switchRole = async (newRole: Role) => {
    setIsLoading(true);
    try {
      // 1. Request backend to switch role and issue verified HMAC token
      const res = await api.switchRole(newRole);
      if (res.token) {
        api.setToken(res.token);
      }
      if (res.user) {
        setUser(res.user);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.user));
      }
    } catch (err) {
      console.warn('Backend switch-role fallback to local simulation:', err);
      // Fallback in case of temporary network issue
      if (!user) return;
      let updated: UserProfile;

      if (newRole === 'ADMIN') {
        updated = {
          ...user,
          role: 'ADMIN',
          name: 'Dr. K. S. Somnath',
          email: 'admin@faculty360.demo',
          designation: 'Dean of Academic Affairs',
          departmentName: 'Academic Administration',
        };
      } else if (newRole === 'HOD') {
        updated = {
          ...user,
          role: 'HOD',
          name: 'Dr. Rajesh Sharma',
          email: 'rajesh.sharma@takshashila.edu',
          designation: 'Assoc. Professor & HOD',
          departmentName: 'Department of Computer Science & Engineering',
        };
      } else {
        updated = {
          ...user,
          role: 'FACULTY',
          name: 'Dr. Arun Kumar',
          email: 'arun.kumar@takshashila.edu',
          designation: 'Associate Professor',
          departmentName: 'Department of Computer Science & Engineering',
        };
      }

      setUser(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (Array.isArray(roles)) {
      return roles.includes(role);
    }
    return role === roles;
  };

  const can = (action: string): boolean => {
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
        return true; // All roles

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
        switchRole,
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
