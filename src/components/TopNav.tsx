import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Menu,
  CalendarClock
} from 'lucide-react';

export type NotificationRole = 'admin' | 'employee' | 'client' | 'hr' | 'team-lead';

type RoleNotification = {
  id: string;
  title: string;
  time: string;
  desc: string;
  unread: boolean;
  type: 'quote' | 'delta' | 'info' | 'alert';
  audience: NotificationRole[];
};

interface TopNavProps {
  viewerRole?: NotificationRole;
  onOpenCommandPalette: () => void;
  notificationCount: number;
  onToggleMobileMenu?: () => void;
  onNavigateToReminders?: () => void;
  urgentReminderCount?: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenCommandPalette,
  notificationCount,
  onToggleMobileMenu,
  onNavigateToReminders,
  urgentReminderCount = 0,
  viewerRole = 'admin',
}) => {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState<RoleNotification[]>([]);
  const [activeRole, setActiveRole] = useState<NotificationRole>(viewerRole);

  const notificationFeed: RoleNotification[] = [
    ...liveNotifications,
    {
      id: 'notif-1', title: 'RFI-2024-089 Delta Calculated', time: '12m ago',
      desc: 'Structural schedule rebar revision calculated: +$48,150.00 to Bid #BID-8849', unread: true, type: 'delta',
      audience: ['admin', 'team-lead', 'employee'],
    },
    {
      id: 'notif-2', title: 'Skanska USA Addendum Received', time: '1h ago',
      desc: 'MEP clash resolution package uploaded for Biotech Innovation Lab', unread: true, type: 'info',
      audience: ['admin', 'team-lead', 'employee'],
    },
    {
      id: 'notif-3', title: 'SLA Escalation Warning', time: '3h ago',
      desc: 'RFI-2024-092 ceiling plenum clash SLA response due within 6 hours', unread: false, type: 'alert',
      audience: ['admin', 'team-lead', 'employee'],
    },
    {
      id: 'notif-4', title: 'HR policy acknowledgement due', time: 'Today',
      desc: 'Please review and acknowledge the updated employee handbook.', unread: true, type: 'info',
      audience: ['hr', 'employee'],
    },
    {
      id: 'notif-5', title: 'Quotation status updated', time: 'Today',
      desc: 'Your quotation request is now being reviewed by the estimating team.', unread: true, type: 'quote',
      audience: ['client'],
    },
  ];
  const notifications = notificationFeed.filter((notification) => notification.audience.includes(activeRole));

  // Listen for new client quotation requests from the intake workflow.
  useEffect(() => {
    const handleQuoteIntake = (event: Event) => {
      const detail = (event as CustomEvent<{ title: string; description: string; intakeId: string; audience?: NotificationRole[] }>).detail;
      const audience = detail.audience ?? ['admin', 'team-lead', 'employee', 'hr'];
      const notification: RoleNotification = { id: detail.intakeId, title: detail.title, time: 'Just now', desc: detail.description, unread: true, type: 'quote', audience };
      setLiveNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)]);
      if (audience.includes(activeRole) && 'Notification' in window) {
        const showDesktopAlert = () => new Notification('New quotation request', { body: detail.description, tag: detail.intakeId });
        if (Notification.permission === 'granted') showDesktopAlert();
        else if (Notification.permission === 'default') void Notification.requestPermission().then((permission) => { if (permission === 'granted') showDesktopAlert(); });
      }
    };
    window.addEventListener('bid-exact:quote-intake-received', handleQuoteIntake);
    return () => window.removeEventListener('bid-exact:quote-intake-received', handleQuoteIntake);
  }, [activeRole]);

  // Close menus on click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  return (
    <header
      id="app-top-header"
      className="h-14 min-w-0 overflow-visible border-b border-[#222a3d] bg-[#0b1326] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-50 select-none gap-2 sm:gap-4"
    >
      {/* Left Area: Mobile Menu Toggle & Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
        {onToggleMobileMenu && (
          <button
            id="btn-mobile-sidebar-toggle"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-[#86948a] hover:text-white bg-[#131b2e] hover:bg-[#171f33] border border-[#222a3d] rounded-md transition-colors shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Search Bar with Cmd+K */}
        <button
          id="btn-search-command-palette"
          onClick={onOpenCommandPalette}
          className="flex-1 h-9 bg-[#131b2e] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#3c4a42] rounded-md px-2.5 sm:px-3 flex items-center justify-between text-xs text-[#86948a] transition-colors group cursor-pointer overflow-hidden"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-[#86948a] group-hover:text-[#4edea3] transition-colors shrink-0" />
            <span className="text-[#86948a] group-hover:text-[#bbcabf] truncate hidden sm:inline">
              Search transactions, RFIs, projects (Cmd+K)...
            </span>
            <span className="text-[#86948a] group-hover:text-[#bbcabf] truncate sm:hidden">
              Search (⌘K)...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] bg-[#0b1326] text-[#86948a] px-1.5 py-0.5 rounded border border-[#222a3d] shrink-0 ml-1">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Notification Bell */}
        <div className="relative">
          <button
            id="btn-notification-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-md bg-[#131b2e] hover:bg-[#171f33] border border-[#222a3d] flex items-center justify-center text-[#86948a] hover:text-[#dae2fd] relative transition-colors cursor-pointer"
            title="Notifications & SLA Alerts"
            aria-label="Notifications & SLA Alerts"
            aria-expanded={showNotifications}
            aria-controls="menu-notifications-popover"
          >
            <Bell className="w-4 h-4" />
            {(notificationCount > 0 || notifications.some((notification) => notification.unread)) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff7886] rounded-full ring-2 ring-[#0b1326]" />
            )}
          </button>

          {showNotifications && (
            <div
              id="menu-notifications-popover"
              className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-1.5rem))] max-h-[calc(100vh-5rem)] bg-[#171f33] border border-[#2d3449] rounded-lg shadow-2xl z-[100] overflow-hidden"
            >
              <div className="px-3 py-2.5 border-b border-[#222a3d] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#dae2fd] flex items-center gap-1.5">
                  Live Notifications & SLA Alerts
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#ff7886]/20 text-[#ffb4ab] rounded">
                    {notifications.filter((notification) => notification.unread).length} unread
                  </span>
                </span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[#86948a] hover:text-[#dae2fd]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-[#222a3d] max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-left hover:bg-[#222a3d]/50 transition-colors ${
                      n.unread ? 'bg-[#131b2e]/60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {n.type === 'delta' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3]" />
                        )}
                        {n.type === 'alert' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#ff7886]" />
                        )}
                        {n.type === 'info' && (
                          <Clock className="w-3.5 h-3.5 text-[#adc6ff]" />
                        )}
                        <span className="text-xs font-medium text-[#dae2fd]">
                          {n.title}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#86948a]">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#bbcabf] pl-5 leading-relaxed">
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-[#222a3d] bg-[#0b1326]">
                <button
                  id="btn-nav-to-reminders-from-notifs"
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigateToReminders?.();
                  }}
                  className="w-full py-1.5 px-3 rounded bg-[#1f2b48] hover:bg-[#28375c] text-xs font-semibold text-[#4edea3] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Company Reminders ({urgentReminderCount > 0 ? `${urgentReminderCount} Urgent` : 'Schedule & Filings'})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div
          id="user-profile-pill"
          className="flex items-center gap-2 pl-2 border-l border-[#222a3d]"
        >
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Marcus Vance"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-[#4edea3]/40"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#4edea3] rounded-full ring-2 ring-[#0b1326]" />
          </div>
          <div className="hidden lg:block text-left leading-tight">
            <div className="text-xs font-semibold text-[#dae2fd]">Marcus Vance</div>
            <select
              aria-label="Preview notification role"
              value={activeRole}
              onChange={(event) => { setActiveRole(event.target.value as NotificationRole); setShowNotifications(false); }}
              className="mt-0.5 max-w-32 bg-transparent text-[10px] font-mono tracking-wider text-[#86948a] uppercase outline-none cursor-pointer"
            >
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
              <option value="client">Client</option>
              <option value="hr">HR</option>
              <option value="team-lead">Team Lead</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
