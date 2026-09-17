import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { FacultyHome } from './pages/FacultyHome';
import { HODDashboard } from './pages/HODDashboard';
import { SchedulePage } from './pages/SchedulePage';
import { LeavePage } from './pages/LeavePage';
import { AlternativeClassesPage } from './pages/AlternativeClassesPage';
import { ReportsPage } from './pages/ReportsPage';
import { FacultyDirectoryPage } from './pages/FacultyDirectoryPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AccessDenied } from './components/common/AccessDenied';
import { Role } from './types';

// Role route permissions
const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  home: ['FACULTY', 'HOD', 'ADMIN'],
  schedule: ['FACULTY', 'HOD', 'ADMIN'],
  leave: ['FACULTY', 'HOD', 'ADMIN'],
  classes: ['FACULTY', 'HOD', 'ADMIN'],
  faculty: ['FACULTY', 'HOD', 'ADMIN'],
  notifications: ['FACULTY', 'HOD', 'ADMIN'],
  settings: ['FACULTY', 'HOD', 'ADMIN'],
  reports: ['HOD', 'ADMIN'], // Restricted to HOD & Admin
  audit: ['ADMIN'],          // Restricted to Admin
};

function MainApp() {
  const { role } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('home');

  const renderContent = () => {
    // 1. Frontend Route Guard Check
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

    // 2. Render target page
    switch (currentPath) {
      case 'home':
        return role === 'HOD' || role === 'ADMIN' ? (
          <HODDashboard onNavigate={setCurrentPath} />
        ) : (
          <FacultyHome onNavigate={setCurrentPath} />
        );
      case 'schedule':
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
        return role === 'HOD' || role === 'ADMIN' ? (
          <HODDashboard onNavigate={setCurrentPath} />
        ) : (
          <FacultyHome onNavigate={setCurrentPath} />
        );
    }
  };

  return (
    <AppLayout currentPath={currentPath} onNavigate={setCurrentPath} unreadCount={2}>
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
