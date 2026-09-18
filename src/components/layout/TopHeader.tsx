import React, { useState } from 'react';
import { Search, Bell, FolderOpen, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  unreadCount?: number;
  onOpenSearch?: () => void;
  onToggleMobileMenu?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentPath,
  onNavigate,
  unreadCount = 2,
  onOpenSearch,
  onToggleMobileMenu
}) => {
  const { user, role } = useAuth();

  const getPageTitle = (path: string) => {
    switch (path) {
      case 'home': return role === 'ADMIN' ? 'University Administration & Governance' : role === 'HOD' ? 'Department Operations & HOD Overview' : 'Faculty Academic Workspace';
      case 'admin_dashboard': return 'University Administration & Governance';
      case 'hod_dashboard': return 'Department Operations & HOD Overview';
      case 'schedule': return 'Class Timetable & Schedule';
      case 'leave': return 'Faculty Leave Management';
      case 'classes': return 'Alternative & Substitute Classes';
      case 'reports': return 'Academic Monitoring & Reports';
      case 'faculty': return 'Faculty Directory';
      case 'notifications': return 'System Notifications';
      case 'audit': return 'Audit Logs & Governance';
      case 'settings': return 'Account & Academic Settings';
      default: return 'Academic Workspace';
    }
  };

  const getRoleBadgeClasses = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-[#1a146b] text-white font-medium';
      case 'HOD':
        return 'bg-[#e2dfff] text-[#100563] font-semibold';
      case 'FACULTY':
      default:
        return 'bg-[#e2dfff] text-[#100563] font-semibold';
    }
  };

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.02)] z-40 flex items-center justify-between px-4 sm:px-8">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-sans">
          <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="hover:text-slate-800 cursor-pointer hidden sm:inline" onClick={() => onNavigate('home')}>
            Portal
          </span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="text-slate-800 font-medium">
            {getPageTitle(currentPath)}
          </span>
        </div>
      </div>

      {/* Right: Search, Notifications, Role Tag, Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search */}
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search workspace"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f0f3ff] text-slate-500 hover:bg-[#e7eeff] hover:text-slate-800 transition-colors text-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Quick search...</span>
          <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400">
            ⌘K
          </span>
        </button>

        {/* Notifications Icon */}
        <button
          type="button"
          onClick={() => onNavigate('notifications')}
          aria-label="Notifications"
          className="relative p-2 rounded-lg text-slate-600 hover:bg-[#f0f3ff] hover:text-slate-900 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#3947dd] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-2xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Role Indicator Pill */}
        <div className="hidden sm:flex items-center">
          <span
            className={`font-mono text-[10px] px-3 py-1 rounded-full uppercase tracking-wider ${getRoleBadgeClasses(
              role
            )}`}
          >
            {role}
          </span>
        </div>

        {/* Avatar */}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <img
            alt={user?.name || 'Faculty Avatar'}
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs"
          />
        </button>
      </div>
    </header>
  );
};
