import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { FacultyHome } from './pages/FacultyHome';
import { HODDashboard } from './pages/HODDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { SchedulePage } from './pages/SchedulePage';
import { LeavePage } from './pages/LeavePage';
import { AlternativeClassesPage } from './pages/AlternativeClassesPage';
import { ReportsPage } from './pages/ReportsPage';
import { FacultyDirectoryPage } from './pages/FacultyDirectoryPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { AccessDenied } from './components/common/AccessDenied';
import { Role } from './types';
import { api } from './services/api';
import { GraduationCap, Loader2 } from 'lucide-react';

// Strict Role route permissions
const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  home: ['STUDENT', 'FACULTY', 'HOD', 'ADMIN'],
  schedule: ['STUDENT', 'FACULTY', 'HOD', 'ADMIN'],
  attendance: ['STUDENT'],
  leave: ['FACULTY', 'HOD', 'ADMIN'],
  classes: ['FACULTY', 'HOD', 'ADMIN'],
  faculty: ['FACULTY', 'HOD', 'ADMIN'],
  notifications: ['STUDENT', 'FACULTY', 'HOD', 'ADMIN'],
  settings: ['STUDENT', 'FACULTY', 'HOD', 'ADMIN'],
  reports: ['HOD', 'ADMIN'],        // Restricted to HOD & Admin
  audit: ['ADMIN'],                 // Strictly Admin only
  admin_dashboard: ['ADMIN'],       // Strictly Admin only
  hod_dashboard: ['HOD'],           // Strictly HOD only
};

function MainApp() {
  const { user, role, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('home');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }
    try {
      const items = await api.getNotifications(user.id);
      const unread = items.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notification count:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUnreadCount();
    const handleUpdate = () => {
      fetchUnreadCount();
    };
    window.addEventListener('notifications-updated', handleUpdate);
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
      clearInterval(interval);
    };
  }, [fetchUnreadCount, currentPath]);

  // 1. Initial Session Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 mb-4 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-[#312e81]" />
        </div>
        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-[#312e81]" />
          <span>Verifying institutional session...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Gate: Unauthenticated users ALWAYS see Login
  if (!user || !role) {
    return <LoginPage />;
  }

  // 3. Authenticated Content with Role-Based Route Protection
  const renderContent = () => {
    const allowedRoles = ROUTE_PERMISSIONS[currentPath] || ['FACULTY', 'HOD', 'ADMIN'];

    if (!allowedRoles.includes(role)) {
      return (
        <AccessDenied
          allowedRoles={allowedRoles}
          requiredRole={allowedRoles.join(' or ')}
          onNavigateHome={() => setCurrentPath('home')}
        />
      );
    }

    switch (currentPath) {
      case 'home':
        if (role === 'STUDENT') return <StudentDashboard onNavigate={setCurrentPath} />;
        if (role === 'ADMIN') return <AdminDashboard onNavigate={setCurrentPath} />;
        if (role === 'HOD') return <HODDashboard onNavigate={setCurrentPath} />;
        return <FacultyHome onNavigate={setCurrentPath} />;
      case 'admin_dashboard':
        return <AdminDashboard onNavigate={setCurrentPath} />;
      case 'hod_dashboard':
        return <HODDashboard onNavigate={setCurrentPath} />;
      case 'attendance':
        return <StudentDashboard onNavigate={setCurrentPath} initialTab="attendance" />;
      case 'schedule':
        if (role === 'STUDENT') return <StudentDashboard onNavigate={setCurrentPath} initialTab="schedule" />;
        return <SchedulePage />;
      case 'leave':
        return <LeavePage onNavigate={setCurrentPath} />;
      case 'classes':
        return <AlternativeClassesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'faculty':
        return <FacultyDirectoryPage />;
      case 'notifications':
        return <NotificationsPage onNavigate={setCurrentPath} />;
      case 'audit':
        return <AuditLogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        if (role === 'STUDENT') return <StudentDashboard onNavigate={setCurrentPath} />;
        if (role === 'ADMIN') return <AdminDashboard onNavigate={setCurrentPath} />;
        if (role === 'HOD') return <HODDashboard onNavigate={setCurrentPath} />;
        return <FacultyHome onNavigate={setCurrentPath} />;
    }
  };

  return (
    <AppLayout currentPath={currentPath} onNavigate={setCurrentPath} unreadCount={unreadCount}>
      {renderContent()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}
