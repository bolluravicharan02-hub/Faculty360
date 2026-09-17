import React from 'react';
import {
  Home,
  Calendar,
  CalendarDays,
  GraduationCap,
  BarChart3,
  Users,
  Bell,
  Settings,
  ChevronDown,
  RotateCcw,
  ShieldAlert,
  Lock,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, unreadCount = 2 }) => {
  const { user, role, switchRole, logout, isLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const mainNavItems: Array<{
    path: string;
    label: string;
    icon: any;
    roles?: Role[];
    badgeText?: string;
  }> = [
    { path: 'home', label: 'Home', icon: Home },
    { path: 'schedule', label: 'Schedule', icon: Calendar },
    { path: 'leave', label: 'Leave', icon: CalendarDays },
    { path: 'classes', label: 'Classes', icon: GraduationCap },
    { path: 'reports', label: 'Reports', icon: BarChart3, roles: ['HOD', 'ADMIN'], badgeText: 'HOD' },
  ];

  const secondaryNavItems: Array<{
    path: string;
    label: string;
    icon: any;
    badge?: boolean;
    roles?: Role[];
    badgeText?: string;
  }> = [
    { path: 'faculty', label: 'Faculty', icon: Users },
    { path: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 },
    { path: 'audit', label: 'Audit Logs', icon: ShieldAlert, roles: ['ADMIN', 'HOD'], badgeText: 'Audit' },
    { path: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-100 shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-50 flex flex-col justify-between pt-6 pb-5">
      <div className="flex flex-col gap-4 px-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-lg bg-[#312e81] flex items-center justify-center text-white shadow-sm shrink-0">
            <GraduationCap className="w-5 h-5 text-indigo-100" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-semibold text-[#1a146b] tracking-tight leading-tight">
              Faculty360
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              Takshashila Univ
            </span>
          </div>
        </div>

        {/* Role Segmented Switcher */}
        <div className="px-1">
          <div className="flex items-center justify-between mb-1 text-[11px] font-medium text-slate-500">
            <span>Role Perspective</span>
            {isLoading && <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />}
          </div>
          <div className="bg-[#f0f3ff] rounded-lg p-1 flex items-center justify-between text-slate-600">
            {(['FACULTY', 'HOD', 'ADMIN'] as Role[]).map((r) => {
              const isActive = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  disabled={isLoading}
                  onClick={() => switchRole(r)}
                  className={`flex-1 text-center py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1a146b] shadow-[0_1px_4px_rgba(0,0,0,0.06)] font-semibold'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  {r === 'FACULTY' ? 'Faculty' : r === 'HOD' ? 'HOD' : 'Admin'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col gap-1 mt-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            const isRestricted = item.roles && !item.roles.includes(role);

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                className={`flex items-center justify-between px-3 py-2 text-left rounded-lg text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#312e81] text-white font-medium shadow-[0_2px_8px_rgba(49,46,129,0.12)]'
                    : isRestricted
                    ? 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    : 'text-slate-600 hover:bg-[#f0f3ff] hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : isRestricted ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {isRestricted && (
                  <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{item.badgeText}</span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Subtle Divider */}
        <div className="my-0.5 px-2">
          <div className="h-[1px] w-full bg-slate-100" />
        </div>

        {/* Secondary Navigation */}
        <div className="px-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            System &amp; More
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            const isRestricted = item.roles && !item.roles.includes(role);

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => onNavigate(item.path)}
                className={`flex items-center justify-between px-3 py-2 text-left rounded-lg text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#312e81] text-white font-medium shadow-[0_2px_8px_rgba(49,46,129,0.12)]'
                    : isRestricted
                    ? 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    : 'text-slate-600 hover:bg-[#f0f3ff] hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : isRestricted ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && !isRestricted && (
                  <span className="w-2 h-2 rounded-full bg-[#3947dd] animate-pulse" />
                )}
                {isRestricted && (
                  <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{item.badgeText}</span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="px-4 relative">
        {showUserMenu && (
          <div className="absolute bottom-16 left-4 right-4 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
              <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-mono uppercase font-semibold">
                  {role} Access
                </span>
                <span className="text-[10px] font-mono text-slate-400">Takshashila</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default View</span>
            </button>
          </div>
        )}

        <div
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2.5 p-2 rounded-xl bg-[#f0f3ff] hover:bg-[#e7eeff] transition-colors cursor-pointer"
        >
          <img
            alt={user?.name || 'User'}
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-white shadow-xs"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs text-[#111c2d] font-semibold truncate leading-tight">
              {user?.name || 'Dr. Rajesh Sharma'}
            </span>
            <span className="text-[10px] text-slate-500 truncate font-sans">
              {user?.designation || (role === 'HOD' ? 'Assoc. Professor & HOD' : role === 'ADMIN' ? 'Dean Academics' : 'Assoc. Professor, CS')}
            </span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
        </div>
      </div>
    </aside>
  );
};
