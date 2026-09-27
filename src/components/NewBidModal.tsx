import React, { useState } from 'react';
import { X, FileSpreadsheet, Plus } from 'lucide-react';
import { BidItem } from '../types';

interface NewBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bid: BidItem) => void;
}

export const NewBidModal: React.FC<NewBidModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('Turner Construction');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('Due in 5 days');
  const [estimator, setEstimator] = useState('Marcus Vance');
  const [winProb, setWinProb] = useState(55);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const bidNum = Math.floor(8865 + Math.random() * 50);
    const probLevel = winProb >= 60 ? 'Strong' : winProb >= 45 ? 'High' : 'Moderate';

    const newBid: BidItem = {
      id: `BID-${bidNum}`,
      title: title.trim(),
      client,
      amount: parseFloat(amount),
      dueDate,
      winProbability: {
        percent: winProb,
        label: `${winProb}% ${probLevel}`,
        level: probLevel as any,
      },
      takeoffProgress: 15,
      estimator,
      status: 'active',
    };

    onSubmit(newBid);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between bg-[#171f33]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#4edea3]/10 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#dae2fd]">
                Initiate New Proposal / Bid Estimate
              </h3>
              <p className="text-[11px] text-[#86948a]">
                Creates takeoff tracking package and assigns lead estimator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
              Proposal Scope / Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Life Sciences Phase II Concrete Package"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Client General Contractor
              </label>
              <select
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
              >
                <option value="Turner Construction">Turner Construction</option>
                <option value="Skanska USA">Skanska USA</option>
                <option value="Balfour Beatty">Balfour Beatty</option>
                <option value="Clark Construction">Clark Construction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Estimated Amount ($) *
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 680000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs font-mono text-[#dae2fd] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Submission Due Window
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Assigned Lead Estimator
              </label>
              <select
                value={estimator}
                onChange={(e) => setEstimator(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
              >
                <option value="Marcus Vance">Marcus Vance</option>
                <option value="David Chen">David Chen</option>
                <option value="Umer">Umer</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-[#86948a] uppercase">Initial Win Probability:</span>
              <span className="text-[#4edea3] font-bold">{winProb}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              value={winProb}
              onChange={(e) => setWinProb(parseInt(e.target.value))}
              className="w-full accent-[#4edea3] cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-[#222a3d] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-mono text-[#86948a] hover:text-[#dae2fd]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Proposal Package</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
