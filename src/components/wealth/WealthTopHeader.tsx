import React, { useState, useRef, useEffect } from 'react';
interface WealthTopHeaderProps {
  onOpenAddCompany: () => void;
  onOpenRecordCapital: () => void;
  onOpenSearch: () => void;
  selectedPeriod: string;
  onSelectPeriod: (period: string) => void;
  privacyMode?: boolean;
  onTogglePrivacy?: () => void;
  activeWorkspace?: 'personal-finance' | 'pre-con-estimating';
  onSwitchWorkspace?: (ws: 'personal-finance' | 'pre-con-estimating') => void;
  onToggleMobileMenu?: () => void;
}

export const WealthTopHeader: React.FC<WealthTopHeaderProps> = ({
  onOpenSearch,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-12 bg-[#0b1326]/90 backdrop-blur-xl border-b border-[#222a3d] z-40 px-3 sm:px-5 flex items-center justify-end gap-2 sm:gap-3 shadow-sm">
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="md:hidden p-2 text-[#bbcabf] hover:text-white rounded hover:bg-[#131b2e] transition-colors"
          aria-label="Search"
          title="Search"
        >
          <span className="material-symbols-outlined text-lg">search</span>
        </button>

        {/* Global Search Button / Trigger */}
        <div
          onClick={onOpenSearch}
          className="hidden md:flex items-center bg-[#131b2e] hover:bg-[#171f33] border border-[#222a3d] px-3 py-1.5 rounded gap-2 w-44 lg:w-60 text-[#bbcabf] cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-sm">search</span>
          <span className="text-xs flex-1 truncate">Search ledger...</span>
          <kbd className="font-mono text-[10px] bg-[#222a3d] px-1.5 py-0.5 rounded text-[#dae2fd]">Cmd+K</kbd>
        </div>

        {/* Notifications Icon with popover */}
        {/* Notifications Icon with popover */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#131b2e] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ff7886] animate-pulse"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#131b2e] border border-[#2d3449] rounded-lg shadow-2xl z-50 p-3 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#222a3d]">
                <span className="font-['Manrope'] font-semibold text-sm text-[#dae2fd]">Notifications</span>
                <span className="font-mono text-[10px] bg-[#ff7886]/20 text-[#ffb2b7] px-2 py-0.5 rounded font-bold">1 Action Required</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="p-2.5 rounded bg-[#222a3d]/80 border border-[#ff7886]/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ffb2b7]">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span>Cap Table Change Request</span>
                  </div>
                  <p className="text-[11px] text-[#bbcabf]">
                    Ahmad Khan proposed equity adjustment in Bid Exact LLC (Ahmad 60%, Umer 40%).
                  </p>
                  <span className="text-[10px] font-mono text-[#bbcabf] block">1 hour ago</span>
                </div>
                <div className="p-2 rounded bg-[#171f33] space-y-0.5">
                  <div className="text-xs font-medium text-[#dae2fd]">Distribution Cleared</div>
                  <p className="text-[11px] text-[#bbcabf]">+$10,000.00 wired from Bid Exact to Chase Personal Checking.</p>
                  <span className="text-[10px] font-mono text-[#bbcabf] block">Sep 14, 2024</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#222a3d]">
          <div className="flex flex-col text-right hidden lg:flex">
            <span className="font-['Manrope'] font-semibold text-sm text-[#dae2fd] leading-tight">
              Sarah Jenkins / Umer
            </span>
            <span className="font-mono text-[10px] text-[#4edea3] font-semibold">
              Personal Principal & Managing Partner
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#10b981] to-[#3b82f6] text-[#002113] font-bold text-xs flex items-center justify-center ring-1 ring-[#3c4a42]">
            UK
          </div>
        </div>
      </div>
    </header>
  );
};
