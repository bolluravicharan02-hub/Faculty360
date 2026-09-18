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
  LogOut,
  ShieldAlert,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, unreadCount = 2 }) => {
  const { user, role, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const roleTitle = role === 'ADMIN' ? 'University Administrator' : role === 'HOD' ? 'Head of Department' : 'Faculty Member';

  // Role-specific navigation definitions
  const { mainNavItems, secondaryNavItems } = React.useMemo(() => {
    if (role === 'ADMIN') {
      return {
        mainNavItems: [
          { path: 'home', label: 'Admin Dashboard', icon: Home },
          { path: 'faculty', label: 'Faculty Directory', icon: Users },
          { path: 'reports', label: 'University Reports', icon: BarChart3 },
          { path: 'audit', label: 'Audit Logs', icon: ShieldAlert },
        ],
        secondaryNavItems: [
          { path: 'schedule', label: 'Timetable Oversight', icon: Calendar },
          { path: 'leave', label: 'Leave Oversight', icon: CalendarDays },
          { path: 'classes', label: 'Alternative Classes', icon: GraduationCap },
          { path: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 },
          { path: 'settings', label: 'System Settings', icon: Settings },
        ],
      };
    }

    if (role === 'HOD') {
      return {
        mainNavItems: [
          { path: 'home', label: 'HOD Dashboard', icon: Home },
          { path: 'schedule', label: 'Department Schedule', icon: Calendar },
          { path: 'leave', label: 'Leave Reviews', icon: CalendarDays },
          { path: 'classes', label: 'Alternative Classes', icon: GraduationCap },
          { path: 'reports', label: 'Department Reports', icon: BarChart3 },
        ],
        secondaryNavItems: [
          { path: 'faculty', label: 'Department Faculty', icon: Users },
          { path: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 },
          { path: 'settings', label: 'Settings', icon: Settings },
        ],
      };
    }

    // Default: FACULTY
    return {
      mainNavItems: [
        { path: 'home', label: 'My Workspace', icon: Home },
        { path: 'schedule', label: 'My Timetable', icon: Calendar },
        { path: 'leave', label: 'My Leaves', icon: CalendarDays },
        { path: 'classes', label: 'Substitute Classes', icon: GraduationCap },
      ],
      secondaryNavItems: [
        { path: 'faculty', label: 'Faculty Directory', icon: Users },
        { path: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 },
        { path: 'settings', label: 'Settings', icon: Settings },
      ],
    };
  }, [role, unreadCount]);

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

        {/* Institutional Verified Role Badge */}
        <div className="px-1">
          <div className="bg-[#f0f3ff] rounded-xl p-2.5 border border-indigo-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#1a146b] leading-tight">
                  {roleTitle}
                </span>
                <span className="text-[10px] text-slate-500 truncate max-w-[130px]">
                  {user?.departmentName || 'Academic Staff'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-indigo-900 border border-slate-200/60 font-semibold uppercase">
              {role}
            </span>
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
              onClick={async () => {
                setShowUserMenu(false);
                await logout();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-medium cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
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
