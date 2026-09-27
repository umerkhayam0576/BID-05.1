import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, RefreshCw, Radio, CheckCircle2 } from 'lucide-react';

interface AccuracyGuaranteeStripProps {
  onOpenAuditLog: () => void;
  syncTimeText?: string;
  autoSyncIntervalMs?: number; // 30 seconds default
}

interface SimulatedWsEvent {
  id: string;
  type: 'CSI_AUDIT_SYNC' | 'RFI_RESOLUTION_HEARTBEAT' | 'TAKE_OFF_VERIFIED';
  timestamp: string;
  itemsAudited: number;
  conflictsFound: number;
  latencyMs: number;
}

export const AccuracyGuaranteeStrip: React.FC<AccuracyGuaranteeStripProps> = ({
  onOpenAuditLog,
  syncTimeText: propSyncTimeText,
  autoSyncIntervalMs = 30000, // 30 seconds
}) => {
  const [lastSyncDate, setLastSyncDate] = useState<Date>(() => new Date());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncCount, setSyncCount] = useState<number>(1);
  const [lastWsEvent, setLastWsEvent] = useState<SimulatedWsEvent | null>({
    id: 'WS-INIT-901',
    type: 'CSI_AUDIT_SYNC',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    itemsAudited: 48,
    conflictsFound: 0,
    latencyMs: 38,
  });

  // Keep a ref to the timer so we can clear/reset it
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger sync function (simulates WebSocket message receipt / polling heartbeat)
  const triggerSync = (forced: boolean = false) => {
    setIsSyncing(true);

    // Simulate WebSocket handshake latency (750ms)
    setTimeout(() => {
      const now = new Date();
      setLastSyncDate(now);
      setSecondsAgo(0);
      setSyncCount((prev) => prev + 1);
      setIsSyncing(false);

      setLastWsEvent({
        id: `WS-${Date.now().toString().slice(-4)}`,
        type: 'CSI_AUDIT_SYNC',
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        itemsAudited: 48 + Math.floor(Math.random() * 4),
        conflictsFound: 0,
        latencyMs: Math.floor(25 + Math.random() * 25),
      });
    }, 750);
  };

  // 1. Polling interval: fires every 30 seconds (30,000 ms)
  useEffect(() => {
    // Set up recurring 30s heartbeat
    syncTimerRef.current = setInterval(() => {
      triggerSync(false);
    }, autoSyncIntervalMs);

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
    };
  }, [autoSyncIntervalMs]);

  // 2. Second-by-second ticker: updates the "Xs ago" counter every 1s
  useEffect(() => {
    const ticker = setInterval(() => {
      const diffInSeconds = Math.max(
        0,
        Math.floor((Date.now() - lastSyncDate.getTime()) / 1000)
      );
      setSecondsAgo(diffInSeconds);
    }, 1000);

    return () => clearInterval(ticker);
  }, [lastSyncDate]);

  // Handle manual sync button click
  const handleManualSync = () => {
    if (isSyncing) return;
    triggerSync(true);

    // Reset the 30-second interval timer
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = setInterval(() => {
        triggerSync(false);
      }, autoSyncIntervalMs);
    }
  };

  // Format the real-time sync time text
  const currentSyncTimeText = propSyncTimeText
    ? propSyncTimeText
    : isSyncing
    ? 'Syncing stream...'
    : secondsAgo === 0
    ? 'Just now'
    : `${secondsAgo}s ago`;

  return (
    <div
      id="accuracy-guarantee-strip"
      className="bg-[#171f33] border border-[#222a3d] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-[#4edea3]/10 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-[#dae2fd]">
              Bid Exact Accuracy Guarantee Engine
            </h4>
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] text-[9px] font-mono font-medium border border-[#4edea3]/20">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              WS Stream Active (30s)
            </span>
          </div>
          <p className="text-[11px] text-[#86948a] leading-relaxed">
            Zero unaddressed RFIs submitted on final bid packages. Automated cross-referencing against CSI MasterFormat divisions.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#222a3d]">
        {/* Real-time WebSocket / Polling Status & Sync Time */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#bbcabf] bg-[#0b1326] px-2.5 py-1.5 rounded border border-[#222a3d]">
          <span
            className={`w-2 h-2 rounded-full ${
              isSyncing
                ? 'bg-[#e5c158] animate-ping'
                : 'bg-[#4edea3] animate-pulse'
            }`}
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 text-[10px] sm:text-[11px]">
            <span className="text-[#86948a]">Sync:</span>
            <strong className="text-[#4edea3] font-medium min-w-[55px]">
              {currentSyncTimeText}
            </strong>
          </div>

          <button
            id="btn-sync-accuracy-engine"
            title="Poll now (resets 30s heartbeat)"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-1 hover:bg-[#1f2b44] rounded text-[#86948a] hover:text-[#4edea3] transition-colors cursor-pointer disabled:opacity-50 ml-1"
          >
            <RefreshCw
              className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#4edea3]' : ''}`}
            />
          </button>
        </div>

        <button
          id="btn-open-audit-log"
          onClick={onOpenAuditLog}
          className="px-3 py-1.5 rounded bg-[#131b2e] hover:bg-[#222a3d] border border-[#2d3449] text-xs font-mono text-[#dae2fd] font-medium transition-colors cursor-pointer"
        >
          Audit Log
        </button>
      </div>
    </div>
  );
};
