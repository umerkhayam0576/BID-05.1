import React, { useState } from 'react';
import { History, X, Search, Bell, Mail, Monitor, Trash2, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';
import { NotificationLogItem, LoanNotificationService, OverdueLoanAlert } from '../../services/loanNotificationService';

interface LoanNotificationAuditModalProps {
  logs: NotificationLogItem[];
  onClose: () => void;
  onClearLogs: () => void;
  onPreviewEmail: (log: NotificationLogItem) => void;
  onRetriggerDesktop: (log: NotificationLogItem) => void;
}

export const LoanNotificationAuditModal: React.FC<LoanNotificationAuditModalProps> = ({
  logs,
  onClose,
  onClearLogs,
  onPreviewEmail,
  onRetriggerDesktop,
}) => {
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'browser_desktop' | 'email_smtp'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchesChannel =
      channelFilter === 'ALL' || log.channels.includes(channelFilter);
    const matchesSearch =
      searchQuery.trim() === '' ||
      log.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.loanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  return (
    <div
      id="loan-notification-audit-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#131b2e] border border-[#38bdf8]/40 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Loan Notification &amp; Alert Dispatch Audit Trail</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#38bdf8]/20 text-[#38bdf8]">
                  {logs.length} Logged Events
                </span>
              </h3>
              <p className="text-[11px] text-[#86948a]">
                Immutable timeline of all automated 3-day overdue browser desktop notifications and email dispatches.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#171f33] text-[#86948a] hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search and Filter */}
        <div className="p-4 bg-[#0b1326]/70 border-b border-[#222a3d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#86948a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by borrower, loan name, or email..."
              className="w-full bg-[#131b2e] border border-[#222a3d] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#38bdf8]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#86948a]">Channel:</span>
            <div className="flex items-center bg-[#131b2e] p-0.5 rounded-lg border border-[#222a3d]">
              <button
                type="button"
                onClick={() => setChannelFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-mono cursor-pointer transition-colors ${
                  channelFilter === 'ALL'
                    ? 'bg-[#38bdf8] text-[#0b1326] font-bold'
                    : 'text-[#dae2fd] hover:bg-[#171f33]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('browser_desktop')}
                className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                  channelFilter === 'browser_desktop'
                    ? 'bg-[#38bdf8] text-[#0b1326] font-bold'
                    : 'text-[#dae2fd] hover:bg-[#171f33]'
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('email_smtp')}
                className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                  channelFilter === 'email_smtp'
                    ? 'bg-[#38bdf8] text-[#0b1326] font-bold'
                    : 'text-[#dae2fd] hover:bg-[#171f33]'
                }`}
              >
                <Mail className="w-3 h-3" />
                <span>Email</span>
              </button>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-[#86948a] font-mono text-xs">
              <History className="w-8 h-8 mx-auto mb-2 text-[#475569]" />
              <p>No notification audit logs found matching criteria.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-lg bg-[#0b1326] border border-[#222a3d] hover:border-[#38bdf8]/30 transition-colors font-mono text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222a3d] pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30">
                      {log.daysOverdue} DAYS OVERDUE
                    </span>
                    <span className="font-bold text-white">{log.borrowerName}</span>
                    <span className="text-[#86948a]">({log.loanName})</span>
                    <span className="text-[#ffb4ab] font-bold">
                      &bull; ${log.amountDue.toLocaleString()} Due
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#86948a]">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="text-[#86948a]">Dispatched via:</span>
                    {log.channels.includes('browser_desktop') && (
                      <span className="px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        <span>Desktop Notification</span>
                      </span>
                    )}
                    {log.channels.includes('email_smtp') && (
                      <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>Email to {log.recipientEmail}</span>
                      </span>
                    )}
                    <span className="text-[#86948a] line-clamp-1">{log.summary}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onPreviewEmail(log)}
                      className="px-2.5 py-1 rounded bg-[#171f33] hover:bg-[#222a3d] border border-[#38bdf8]/30 text-[#38bdf8] text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Preview Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRetriggerDesktop(log)}
                      className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-[#334155] text-[#dae2fd] text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      title="Test/Re-display desktop alert on screen"
                    >
                      <Bell className="w-3 h-3 text-[#ffb4ab]" />
                      <span>Re-Pop Desktop</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222a3d] bg-[#0b1326] flex items-center justify-between gap-3 flex-shrink-0">
          <div>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#ffb4ab] font-mono">Clear all history?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearLogs();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1 rounded bg-[#ffb4ab] text-[#0b1326] font-bold text-xs font-mono cursor-pointer"
                >
                  Yes, Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 rounded bg-[#222a3d] text-white text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-xs font-mono text-[#86948a] hover:text-[#ffb4ab] flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Audit Logs</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#222a3d] hover:bg-[#334155] text-white text-xs font-mono cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
