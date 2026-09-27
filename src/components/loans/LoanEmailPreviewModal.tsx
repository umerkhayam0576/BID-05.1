import React, { useState } from 'react';
import { Mail, X, Check, Copy, Send, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { NotificationLogItem } from '../../services/loanNotificationService';

interface LoanEmailPreviewModalProps {
  logItem: NotificationLogItem | null;
  onClose: () => void;
  onResend?: (logItem: NotificationLogItem) => void;
}

export const LoanEmailPreviewModal: React.FC<LoanEmailPreviewModalProps> = ({
  logItem,
  onClose,
  onResend,
}) => {
  const [activeView, setActiveView] = useState<'html' | 'text'>('html');
  const [copied, setCopied] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  if (!logItem) return null;

  const handleCopy = () => {
    const textToCopy = activeView === 'html' ? (logItem.emailBodyHtml || logItem.summary) : logItem.summary;
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResend = () => {
    if (onResend) {
      onResend(logItem);
    }
    setResendStatus(`Email successfully redispatched to ${logItem.recipientEmail} & ${logItem.borrowerEmail}`);
    setTimeout(() => setResendStatus(null), 3000);
  };

  return (
    <div
      id="loan-email-preview-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#131b2e] border border-[#38bdf8]/40 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Automated Email Dispatch Preview</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30">
                  SMTP SIMULATED
                </span>
              </h3>
              <p className="text-[11px] text-[#86948a] font-mono">
                Log Reference: {logItem.id} &bull; Sent {new Date(logItem.timestamp).toLocaleString()}
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

        {/* Email Metadata Envelope */}
        <div className="p-4 bg-[#0b1326]/60 border-b border-[#222a3d] space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#86948a] w-20 flex-shrink-0">FROM:</span>
            <span className="text-white flex-1 truncate">
              Bid Exact Financial Treasury &lt;automated-notifications@bidexact.com&gt;
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#86948a] w-20 flex-shrink-0">TO:</span>
            <span className="text-[#38bdf8] flex-1 truncate font-semibold">
              {logItem.recipientEmail} <span className="text-[#86948a] font-normal">(Admin / Financial Controller)</span>, {logItem.borrowerEmail}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#86948a] w-20 flex-shrink-0">SUBJECT:</span>
            <span className="text-[#ffb4ab] font-bold flex-1 truncate">
              {logItem.emailSubject || `🚨 URGENT: Loan Payment ${logItem.daysOverdue} Days Overdue - ${logItem.borrowerName} ($${logItem.amountDue.toLocaleString()})`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#222a3d]/50 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-[#86948a]">STATUS:</span>
              <span className="text-[#4edea3] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Dispatched Automatically (3-Day Overdue Rule)</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveView('html')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                  activeView === 'html'
                    ? 'bg-[#38bdf8] text-[#0b1326] font-bold'
                    : 'bg-[#171f33] text-[#dae2fd] hover:bg-[#222a3d]'
                }`}
              >
                Rendered HTML
              </button>
              <button
                type="button"
                onClick={() => setActiveView('text')}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                  activeView === 'text'
                    ? 'bg-[#38bdf8] text-[#0b1326] font-bold'
                    : 'bg-[#171f33] text-[#dae2fd] hover:bg-[#222a3d]'
                }`}
              >
                Plain Text
              </button>
            </div>
          </div>
        </div>

        {/* Email Body Content */}
        <div className="p-5 max-h-[50vh] overflow-y-auto bg-[#070b14]">
          {activeView === 'html' ? (
            logItem.emailBodyHtml ? (
              <div
                className="prose prose-invert max-w-none text-xs"
                dangerouslySetInnerHTML={{ __html: logItem.emailBodyHtml }}
              />
            ) : (
              <div className="p-4 rounded-lg bg-[#0b1326] border border-[#222a3d] text-xs text-[#dae2fd] whitespace-pre-wrap font-mono">
                {logItem.summary}
              </div>
            )
          ) : (
            <pre className="p-4 rounded-lg bg-[#0b1326] border border-[#222a3d] text-xs text-[#dae2fd] whitespace-pre-wrap font-mono font-normal">
              {logItem.summary}
              {`\n\nRecipient: ${logItem.recipientEmail}\nBorrower: ${logItem.borrowerName} (${logItem.borrowerEmail})\nAmount Due: $${logItem.amountDue}\nDays Overdue: ${logItem.daysOverdue}\nChannel: Desktop + Email Alert`}
            </pre>
          )}
        </div>

        {/* Resend Status Banner */}
        {resendStatus && (
          <div className="px-4 py-2 bg-[#4edea3]/20 border-t border-[#4edea3]/40 text-[#4edea3] text-xs font-mono flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>{resendStatus}</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="p-4 border-t border-[#222a3d] bg-[#0b1326] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-[#171f33] hover:bg-[#222a3d] border border-[#222a3d] text-[#dae2fd] text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Email Body'}</span>
            </button>
            <button
              type="button"
              onClick={handleResend}
              className="px-3 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] border border-[#38bdf8]/30 text-[#38bdf8] text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Resend Email Notice</span>
            </button>
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
