import React from 'react';
import {
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  Calendar,
} from 'lucide-react';
import { BidItem } from '../types';

interface UpcomingBidsListProps {
  bids: BidItem[];
  onSelectBid: (bid: BidItem) => void;
  onOpenSubmissionDeck: () => void;
}

export const UpcomingBidsList: React.FC<UpcomingBidsListProps> = ({
  bids,
  onSelectBid,
  onOpenSubmissionDeck,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-[#171f33] border border-[#222a3d] rounded-lg p-4 sm:p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#86948a] font-bold">
            Submission Pipeline
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 font-semibold">
            Next 7 Days
          </span>
        </div>

        <h2 className="text-base font-bold text-[#dae2fd] tracking-tight mb-1">
          Upcoming Bids & Estimates
        </h2>
        <p className="text-xs text-[#86948a] mb-4">
          Live win probability analytics keyed to RFI clearance
        </p>

        {/* Bids List */}
        <div className="space-y-3">
          {bids.map((bid) => (
            <div
              key={bid.id}
              onClick={() => onSelectBid(bid)}
              className="p-3.5 rounded-md bg-[#131b2e] border border-[#222a3d] hover:border-[#3c4a42] hover:bg-[#1a233a] transition-all cursor-pointer group"
            >
              {/* Header: ID + Amount + Due Date */}
              <div className="flex items-start justify-between mb-1">
                <span className="font-mono text-xs font-bold text-[#3b82f6] tracking-wide">
                  {bid.id}
                </span>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-[#dae2fd]">
                    {formatCurrency(bid.amount)}
                  </div>
                  <div className={`text-[10px] font-mono ${
                    bid.dueDate.includes('48h') ? 'text-[#ff7886] font-semibold' : 'text-[#86948a]'
                  }`}>
                    {bid.dueDate}
                  </div>
                </div>
              </div>

              {/* Title & Client */}
              <div className="font-semibold text-xs text-[#dae2fd] group-hover:text-white transition-colors mb-0.5">
                {bid.title}
              </div>
              <div className="text-[11px] text-[#86948a] mb-2.5">
                {bid.client}
              </div>

              {/* Win Probability Bar */}
              <div className="space-y-1 mb-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#86948a] uppercase">Win Probability</span>
                  <span className={`font-semibold ${
                    bid.winProbability.level === 'Strong'
                      ? 'text-[#4edea3]'
                      : bid.winProbability.level === 'High'
                      ? 'text-[#4edea3]'
                      : 'text-[#adc6ff]'
                  }`}>
                    {bid.winProbability.label}
                  </span>
                </div>
                <div className="w-full bg-[#0b1326] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${bid.winProbability.percent}%`,
                      backgroundColor:
                        bid.winProbability.percent >= 55 ? '#4edea3' : '#3b82f6',
                    }}
                  />
                </div>
              </div>

              {/* Status / Blockers & Takeoff Progress */}
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#222a3d]/60 font-mono">
                <div>
                  {bid.rfiBlocker ? (
                    <div className="flex items-center gap-1 text-[#ff7886]">
                      <AlertTriangle className="w-3 h-3 text-[#ff7886]" />
                      <span className="font-medium text-[10px]">{bid.rfiBlocker}</span>
                    </div>
                  ) : bid.specValidated ? (
                    <div className="flex items-center gap-1 text-[#4edea3]">
                      <CheckCircle2 className="w-3 h-3 text-[#4edea3]" />
                      <span className="font-medium text-[10px]">Spec Validated</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[#86948a]">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px]">Estimator: {bid.estimator}</span>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-[#86948a]">
                  TAKEOFF:{' '}
                  <strong className="text-[#dae2fd] font-bold">
                    {bid.takeoffProgress}% DONE
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Calendar & Submission Deck Card */}
      <div
        id="banner-bid-submission-deck"
        onClick={onOpenSubmissionDeck}
        className="mt-4 p-3 rounded-md bg-[#131b2e] border border-[#222a3d] hover:border-[#3c4a42] flex items-center justify-between cursor-pointer transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#171f33] border border-[#222a3d] flex items-center justify-center text-[#adc6ff]">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#dae2fd]">
              Bid Submission Deck
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#86948a] group-hover:text-[#4edea3] transition-colors">
          <span>Open Calendar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
