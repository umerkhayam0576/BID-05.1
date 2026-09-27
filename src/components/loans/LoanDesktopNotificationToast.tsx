import React from 'react';
import { BellRing, X, CreditCard, Mail } from 'lucide-react';
import { OverdueLoanAlert } from '../../services/loanNotificationService';

interface LoanDesktopNotificationToastProps {
  alert: OverdueLoanAlert;
  adminEmail: string;
  onDismiss: () => void;
  onCollectPayment: (alert: OverdueLoanAlert) => void;
  onViewEmail: (alert: OverdueLoanAlert) => void;
}

export const LoanDesktopNotificationToast: React.FC<LoanDesktopNotificationToastProps> = ({
  alert,
  adminEmail,
  onDismiss,
  onCollectPayment,
  onViewEmail,
}) => {
  return (
    <div
      id="loan-desktop-notification-toast"
      className="fixed bottom-6 right-6 z-50 max-w-md w-[92vw] sm:w-[420px] bg-[#131b2e] border-2 border-[#ffb4ab] rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/40 animate-bounce flex-shrink-0">
          <BellRing className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffb4ab] font-bold">
              🚨 DESKTOP ALERT &bull; {alert.daysOverdue} DAYS OVERDUE
            </span>
            <button
              type="button"
              onClick={onDismiss}
              className="text-[#86948a] hover:text-white p-1 rounded hover:bg-[#222a3d] cursor-pointer"
              title="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-sm font-bold text-white mt-1 truncate">
            {alert.borrowerName} &bull; ${alert.monthlyPayment.toLocaleString()} Due
          </h4>
          <p className="text-xs text-[#dae2fd] mt-1 line-clamp-2">
            Monthly repayment for &ldquo;{alert.loanName}&rdquo; is now {alert.daysOverdue} days overdue. An automated email was sent to {adminEmail}.
          </p>

          <div className="mt-3 pt-2.5 border-t border-[#222a3d] flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onCollectPayment(alert)}
              className="px-3 py-1.5 rounded bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow transition-transform active:scale-95"
            >
              <CreditCard className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Collect ${alert.monthlyPayment}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onViewEmail(alert)}
                className="px-2.5 py-1.5 rounded bg-[#1e293b] hover:bg-[#334155] border border-[#38bdf8]/30 text-[#38bdf8] text-xs font-mono flex items-center gap-1 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>View Email</span>
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="px-2.5 py-1.5 rounded bg-[#222a3d] hover:bg-[#334155] text-[#86948a] hover:text-white text-xs font-mono cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
