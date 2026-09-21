import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { CommandSearch } from '../common/CommandSearch';
import { Home, Calendar, CalendarDays, MoreHorizontal, X, Users, BarChart3, ShieldAlert, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
  unreadCount?: number;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
  unreadCount = 0
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { role } = useAuth();

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d] flex flex-col">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar currentPath={currentPath} onNavigate={onNavigate} unreadCount={unreadCount} />
      </div>

      {/* Mobile Slide-out Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <span className="font-serif font-semibold text-[#1a146b]">Faculty360</span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                currentPath={currentPath}
                onNavigate={(p) => {
                  onNavigate(p);
                  setIsMobileMenuOpen(false);
                }}
                unreadCount={unreadCount}
              />
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <TopHeader
        currentPath={currentPath}
        onNavigate={onNavigate}
        unreadCount={unreadCount}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Main Content Area */}
      <main className="lg:pl-64 pt-16 flex-1 flex flex-col pb-20 lg:pb-8">
        <div className="w-full max-w-[72rem] mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 shadow-md flex items-center justify-around px-2 z-40">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center w-16 py-1 ${
            currentPath === 'home' ? 'text-[#312e81] font-semibold' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {role === 'ADMIN' ? (
          <>
            <button
              type="button"
              onClick={() => onNavigate('faculty')}
              className={`flex flex-col items-center justify-center w-16 py-1 ${
                currentPath === 'faculty' ? 'text-[#312e81] font-semibold' : 'text-slate-500'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Faculty</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className={`flex flex-col items-center justify-center w-16 py-1 ${
                currentPath === 'reports' ? 'text-[#312e81] font-semibold' : 'text-slate-500'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Reports</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('audit')}
              className={`flex flex-col items-center justify-center w-16 py-1 ${
                currentPath === 'audit' ? 'text-[#312e81] font-semibold' : 'text-slate-500'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Audit</span>
            </button>
          </>
        ) : role === 'HOD' ? (
          <>
            <button
              type="button"
              onClick={() => onNavigate('schedule')}
              className={`flex flex-col items-center justify-center w-16 py-1 ${
                currentPath === 'schedule' ? 'text-[#312e81] font-semibold' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('leave')}
              className={`flex flex-col items-center justify-center w-16 py-1 ${
                currentPath === 'leave' ? 'text-[#312e81] font-semibold' : 'text-slate-500'
              }`}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Leave</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className={`flex flex-col items-center justify-center w-16 py-1 ${
                currentPath === 'reports' ? 'text-[#312e81] font-semibold' : 'text-slate-500'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Reports</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onNavigate('schedule')}
              className={`flex flex-col items-center justify-center w-16 py-1 ${
                currentPath === 'schedule' ? 'text-[#312e81] font-semibold' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('leave')}
              className={`flex flex-col items-center justify-center w-16 py-1 ${
                currentPath === 'leave' ? 'text-[#312e81] font-semibold' : 'text-slate-500'
              }`}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Leave</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('classes')}
              className={`flex flex-col items-center justify-center w-16 py-1 ${
                currentPath === 'classes' ? 'text-[#312e81] font-semibold' : 'text-slate-500'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Classes</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center w-16 py-1 text-slate-500"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </div>

      {/* Command Search Modal */}
      <CommandSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
