import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Megaphone,
  Check,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { NotificationItem } from '../types';

interface NotificationsPageProps {
  onNavigate: (path: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const items = await api.getNotifications(user?.id);
      setNotifications(items);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      window.dispatchEvent(new Event('notifications-updated'));
      showToast('All notifications marked as read.');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'substitution': return <RefreshCw className="w-4 h-4 text-amber-600" />;
      case 'leave': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'timetable': return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'announcement': return <Megaphone className="w-4 h-4 text-purple-600" />;
      default: return <Bell className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="flex flex-col w-full font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-[11px] text-[#3947dd] uppercase tracking-widest font-semibold block mb-1">
            Activity Stream
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1a146b] font-medium tracking-tight">
            Notifications &amp; Alerts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time updates regarding substitutions, leave decisions, and administrative announcements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors"
          >
            Mark all read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-[#312e81] text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            filter === 'unread'
              ? 'bg-[#312e81] text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unread ({notifications.filter(n => !n.read).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-100 text-slate-500 text-xs">
            No notifications in this folder.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkRead(item.id)}
              className={`p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer ${
                item.read
                  ? 'bg-white border-slate-100 text-slate-700'
                  : 'bg-[#f0f3ff]/40 border-indigo-100 shadow-xs'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={`text-sm font-medium ${item.read ? 'text-slate-800' : 'text-[#1a146b] font-semibold'}`}>
                    {item.title}
                  </h3>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">{item.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>

                {item.actionUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(item.actionUrl!.replace('/', ''));
                    }}
                    className="mt-2 text-xs text-[#3947dd] font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <span>View details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {!item.read && (
                <div className="w-2 h-2 rounded-full bg-[#3947dd] shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
