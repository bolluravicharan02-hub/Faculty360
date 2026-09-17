import React, { useState, useEffect } from 'react';
import { Search, X, Calendar, User, FileText, Bell, Sparkles, ArrowRight } from 'lucide-react';

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const CommandSearch: React.FC<CommandSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { label: 'Today\'s Schedule', path: 'schedule', category: 'Schedule', icon: Calendar },
    { label: 'Apply for Leave', path: 'leave', category: 'Leave', icon: FileText },
    { label: 'Alternative Classes & Substitutions', path: 'classes', category: 'Classes', icon: Sparkles },
    { label: 'Department Academic Reports', path: 'reports', category: 'Reports', icon: FileText },
    { label: 'Faculty Directory & Profiles', path: 'faculty', category: 'Faculty', icon: User },
    { label: 'System Notifications', path: 'notifications', category: 'Alerts', icon: Bell },
  ];

  const filteredLinks = query.trim()
    ? quickLinks.filter(l => l.label.toLowerCase().includes(query.toLowerCase()) || l.category.toLowerCase().includes(query.toLowerCase()))
    : quickLinks;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Input bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search classes, faculty, leave requests, or tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-50">
          <div className="px-3 py-1.5 text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
            Jump to
          </div>
          {filteredLinks.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No matching pages or faculty found for "{query}"
            </div>
          ) : (
            filteredLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    onNavigate(item.path);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-[#f0f3ff] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#f0f3ff] group-hover:bg-white text-[#312e81] flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 group-hover:text-[#1a146b]">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-400">{item.category}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Navigate with ⌘K</span>
          <span>Takshashila University Faculty360</span>
        </div>
      </div>
    </div>
  );
};
