import React, { useState } from 'react';
import {
  ShieldAlert,
  DollarSign,
  TrendingUp,
  Percent,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Landmark,
  PiggyBank,
  X,
  Sparkles,
  Layers
} from 'lucide-react';
import { EmergencyFundState, CashTransaction } from '../../types';

interface EmergencyFundViewProps {
  fundState: EmergencyFundState;
  onUpdateFundState: (updated: EmergencyFundState, txn: CashTransaction) => void;
}

export const EmergencyFundView: React.FC<EmergencyFundViewProps> = ({
  fundState,
  onUpdateFundState,
}) => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isDrawdownModalOpen, setIsDrawdownModalOpen] = useState(false);

  // Form states
  const [amount, setAmount] = useState<string>('25000');
  const [monthlyContribution, setMonthlyContribution] = useState<string>('5000');
  const [isRecurringAllocation, setIsRecurringAllocation] = useState(false);
  const [memo, setMemo] = useState<string>('Q3 Operating Cash Surplus Allocation');

  // Stress test state
  const [stressScenario, setStressScenario] = useState<'none' | 'zero_revenue_3mo' | 'market_drop_40' | 'delayed_receivables'>('none');

  const fundingPercentage = Math.min(100, (fundState.currentBalance / fundState.targetAmount) * 100);
  const currentRunwayMonths = (fundState.currentBalance / fundState.monthlyBurnRate).toFixed(1);

  // Stress test computations
  let simulatedRunway = parseFloat(currentRunwayMonths);
  let stressDescription = 'Normal operating state. 6.0 months of runway supported.';

  if (stressScenario === 'zero_revenue_3mo') {
    simulatedRunway = Math.max(0, parseFloat(currentRunwayMonths) - 3.0);
    stressDescription = 'Severe stress: 3 full months of zero billing revenue. Fund absorbs $174,000 operating burn.';
  } else if (stressScenario === 'market_drop_40') {
    simulatedRunway = Math.max(0, parseFloat(currentRunwayMonths) * 0.75);
    stressDescription = 'Moderate stress: 40% reduction in incoming cash receipts. Burn rate increases by 25%.';
  } else if (stressScenario === 'delayed_receivables') {
    simulatedRunway = Math.max(0, parseFloat(currentRunwayMonths) - 1.5);
    stressDescription = 'Liquidity buffer: $85,000 in delayed 90+ day client receivables absorbed by liquid reserves.';
  }

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newBalance = fundState.currentBalance + amountNum;
    const newHistory = [
      {
        id: `EF-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'Deposit' as const,
        amount: amountNum,
        description: memo || 'Surplus Treasury Allocation',
        balanceAfter: newBalance,
      },
      ...fundState.history,
    ];

    const updatedState: EmergencyFundState = {
      ...fundState,
      currentBalance: newBalance,
      runwayMonths: parseFloat((newBalance / fundState.monthlyBurnRate).toFixed(1)),
      history: newHistory,
    };

    const txn: CashTransaction = {
      id: `TXN-2024-${Math.floor(5000 + Math.random() * 5000)}`,
      date: new Date().toISOString().slice(0, 10),
      description: `${isRecurringAllocation ? 'Recurring reserve allocation' : 'Reserve fund deposit'}${isRecurringAllocation ? ` ($${parseFloat(monthlyContribution || '0').toLocaleString()}/month)` : ''}`,
      category: 'Emergency & Capital Reserves',
      counterparty: 'Bid Exact Capital Reserve Trust',
      type: 'outflow', // outflow from operating cash into protected emergency reserve
      amount: amountNum,
      status: 'reconciled',
      paymentMethod: 'Internal Treasury Transfer',
      account: 'Chase Operating ••8491',
      referenceNumber: `RES-${Date.now().toString().slice(-6)}`,
    };

    onUpdateFundState(updatedState, txn);
    setIsDepositModalOpen(false);
  };

  const handleDrawdownSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newBalance = Math.max(0, fundState.currentBalance - amountNum);
    const newHistory = [
      {
        id: `EF-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'Drawdown' as const,
        amount: amountNum,
        description: memo || 'Emergency Working Capital Liquidity Draw',
        balanceAfter: newBalance,
      },
      ...fundState.history,
    ];

    const updatedState: EmergencyFundState = {
      ...fundState,
      currentBalance: newBalance,
      runwayMonths: parseFloat((newBalance / fundState.monthlyBurnRate).toFixed(1)),
      history: newHistory,
    };

    const txn: CashTransaction = {
      id: `TXN-2024-${Math.floor(5000 + Math.random() * 5000)}`,
      date: new Date().toISOString().slice(0, 10),
      description: `Emergency Reserve Drawdown to Operating Account`,
      category: 'Working Capital Inflow',
      counterparty: 'Bid Exact Capital Reserve Trust',
      type: 'inflow', // inflow into operating cash from reserve
      amount: amountNum,
      status: 'reconciled',
      paymentMethod: 'Internal Treasury Transfer',
      account: 'Chase Operating ••8491',
      referenceNumber: `RES-DRAW-${Date.now().toString().slice(-6)}`,
    };

    onUpdateFundState(updatedState, txn);
    setIsDrawdownModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>TREASURY & RISK MANAGEMENT</span>
            <span>/</span>
            <span>CORPORATE EMERGENCY RESERVE & RUNWAY</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Emergency Fund & Capital Reserves
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Dedicated 6-month operational runway reserve, government Treasury yields, and macroeconomic stress simulations
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setAmount('15000');
              setMemo('Emergency Operating Liquidity Transfer');
              setIsDrawdownModalOpen(true);
            }}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#ffb4ab]/40 text-[#ffb4ab] rounded-md text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Drawdown Reserve</span>
          </button>
          <button
            onClick={() => {
              setAmount('25000');
              setMonthlyContribution('5000');
              setIsRecurringAllocation(false);
              setMemo('Operating Cash Surplus Allocation');
              setIsDepositModalOpen(true);
            }}
            className="h-9 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Allocate to Emergency Fund</span>
          </button>
        </div>
      </div>

      {/* 4 Key Treasury Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Total Liquid Reserve Balance
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${fundState.currentBalance.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            Target: ${fundState.targetAmount.toLocaleString()} ({fundingPercentage.toFixed(1)}% funded)
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Operating Runway (Zero Revenue)
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            {currentRunwayMonths} Months
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            At ${fundState.monthlyBurnRate.toLocaleString()} monthly base burn
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Annualized Risk-Free Yield
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            4.95% APY
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            Generating ~${Math.round((fundState.currentBalance * 0.0495) / 12).toLocaleString()} / month passive income
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            FDIC / Treasury Backing
          </div>
          <div className="text-2xl font-bold font-mono text-[#adc6ff]">
            100% Guaranteed
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Diversified across 3 segregated institutions
          </div>
        </div>
      </div>

      {/* Progress towards 6-Month Target Reserve */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-[#4edea3]" />
              Capital Reserve Target Progression (6-Month Runway Goal)
            </h3>
            <p className="text-[11px] text-[#86948a]">
              ${(fundState.targetAmount - fundState.currentBalance).toLocaleString()} remaining to reach full $500,000 corporate fortress threshold
            </p>
          </div>
          <div className="text-right font-mono">
            <span className="text-lg font-bold text-[#4edea3]">{fundingPercentage.toFixed(1)}%</span>
            <span className="text-xs text-[#86948a]"> of $500,000 goal</span>
          </div>
        </div>

        <div className="w-full h-3 bg-[#0b1326] rounded-full overflow-hidden p-0.5 border border-[#222a3d] my-3">
          <div
            className="h-full bg-linear-to-r from-[#4edea3] to-[#25a26f] rounded-full transition-all duration-500"
            style={{ width: `${fundingPercentage}%` }}
          />
        </div>

      </div>

      {/* Interactive Stress-Test Scenario Simulator */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-[#ffb4ab]" />
          <h3 className="text-sm font-bold text-white">Macroeconomic Stress-Testing & Shock Simulator</h3>
        </div>
        <p className="text-[11px] text-[#86948a] mb-4">
          Test Bid Exact's solvency under adverse macroeconomic, client default, or industry shock conditions
        </p>

        {/* Scenario Select Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => setStressScenario('none')}
            className={`p-2.5 rounded text-left text-xs transition-all cursor-pointer ${
              stressScenario === 'none'
                ? 'bg-[#4edea3]/15 border border-[#4edea3] text-white'
                : 'bg-[#0b1326] border border-[#222a3d] text-[#86948a] hover:text-white'
            }`}
          >
            <div className="font-bold">Base Case Scenario</div>
            <div className="text-[10px] mt-0.5">Standard steady growth</div>
          </button>

          <button
            onClick={() => setStressScenario('zero_revenue_3mo')}
            className={`p-2.5 rounded text-left text-xs transition-all cursor-pointer ${
              stressScenario === 'zero_revenue_3mo'
                ? 'bg-[#ffb4ab]/15 border border-[#ffb4ab] text-white'
                : 'bg-[#0b1326] border border-[#222a3d] text-[#86948a] hover:text-white'
            }`}
          >
            <div className="font-bold">Zero Revenue (3 Months)</div>
            <div className="text-[10px] mt-0.5">Sudden commercial halt</div>
          </button>

          <button
            onClick={() => setStressScenario('market_drop_40')}
            className={`p-2.5 rounded text-left text-xs transition-all cursor-pointer ${
              stressScenario === 'market_drop_40'
                ? 'bg-[#ffb4ab]/15 border border-[#ffb4ab] text-white'
                : 'bg-[#0b1326] border border-[#222a3d] text-[#86948a] hover:text-white'
            }`}
          >
            <div className="font-bold">-40% Market Downturn</div>
            <div className="text-[10px] mt-0.5">Protracted bidding freeze</div>
          </button>

          <button
            onClick={() => setStressScenario('delayed_receivables')}
            className={`p-2.5 rounded text-left text-xs transition-all cursor-pointer ${
              stressScenario === 'delayed_receivables'
                ? 'bg-[#adc6ff]/15 border border-[#adc6ff] text-white'
                : 'bg-[#0b1326] border border-[#222a3d] text-[#86948a] hover:text-white'
            }`}
          >
            <div className="font-bold">Receivables Delay (90 Days)</div>
            <div className="text-[10px] mt-0.5">Enterprise payment stalls</div>
          </button>
        </div>

        {/* Simulation Output Box */}
        <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#4edea3]" />
              <span>Solvency Verdict: Fully Solvent with Zero Layoffs</span>
            </div>
            <p className="text-xs text-[#86948a] mt-1">{stressDescription}</p>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs">
            <div>
              <div className="text-[10px] text-[#86948a]">Remaining Runway</div>
              <div className="text-xl font-bold text-[#4edea3]">{simulatedRunway.toFixed(1)} Months</div>
            </div>
            <div>
              <div className="text-[10px] text-[#86948a]">Fund Status</div>
              <div className="text-xl font-bold text-white">Protected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Reserve Transaction Ledger */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#4edea3]" />
          Reserve Allocations & Yield History
        </h3>
        <p className="text-[11px] text-[#86948a] mb-4">
          Log of surplus deposits, interest yield credit payments, and liquidity distributions
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] font-mono border-b border-[#222a3d]">
              <tr>
                <th className="py-2.5 px-4">Record ID / Date</th>
                <th className="py-2.5 px-4">Action Type</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d]">
              {fundState.history.map((record) => (
                <tr key={record.id} className="hover:bg-[#171f33]/60 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <div className="font-semibold text-white">{record.id}</div>
                    <div className="text-[11px] text-[#86948a]">{record.date}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                        record.type === 'Deposit'
                          ? 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20'
                          : record.type === 'Yield' || record.type === 'Sweep'
                          ? 'bg-[#adc6ff]/10 text-[#adc6ff] border border-[#adc6ff]/20'
                          : 'bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/20'
                      }`}
                    >
                      {record.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#dae2fd]">
                    {record.description}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-bold ${
                      record.type === 'Drawdown' ? 'text-[#ffb4ab]' : 'text-[#4edea3]'
                    }`}
                  >
                    {record.type === 'Drawdown' ? '-' : '+'}${record.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-white">
                    ${record.balanceAfter.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocate / Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#222a3d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#4edea3]/10 text-[#4edea3]">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Allocate to Emergency Fund</h3>
                  <p className="text-[11px] text-[#86948a]">Transfer operating cash surplus to reserve asset</p>
                </div>
              </div>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="p-1 rounded hover:bg-[#171f33] text-[#86948a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Allocation Amount ($ USD)*</label>
                <input
                  type="number"
                  step="1000"
                  required
                  placeholder="25000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white font-mono focus:outline-none focus:border-[#4edea3]"
                />
              </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>
  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Monthly Contribution ($ USD)</label>
  <input
  type="number"
  min="0"
  step="500"
  placeholder="5000"
  value={monthlyContribution}
  onChange={(e) => setMonthlyContribution(e.target.value)}
  disabled={!isRecurringAllocation}
  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white font-mono focus:outline-none focus:border-[#4edea3] disabled:opacity-40 disabled:cursor-not-allowed"
  />
  <p className="mt-1 text-[10px] text-[#86948a]">Recurring amount added each month.</p>
  </div>
  <div className="flex items-start pt-6">
  <label className="flex items-center gap-2 text-[11px] text-[#dae2fd] cursor-pointer">
  <input
  type="checkbox"
  checked={isRecurringAllocation}
  onChange={(e) => setIsRecurringAllocation(e.target.checked)}
  className="h-3.5 w-3.5 accent-[#4edea3]"
  />
  <span>Enable recurring allocation</span>
  </label>
  </div>
  </div>



              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Allocation Description / Note</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="p-3 bg-[#4edea3]/5 border border-[#4edea3]/20 rounded text-[11px] text-[#dae2fd]">
                Transfers from <strong>Chase Operating ••8491</strong>. The initial allocation increases company runway by ~{(parseFloat(amount || '0') / fundState.monthlyBurnRate).toFixed(1)} months{isRecurringAllocation && `, followed by $${parseFloat(monthlyContribution || '0').toLocaleString()} each month`}.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-3 py-1.5 rounded text-[#86948a] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Execute Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawdown Modal */}
      {isDrawdownModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#222a3d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#ffb4ab]/10 text-[#ffb4ab]">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Emergency Fund Drawdown</h3>
                  <p className="text-[11px] text-[#86948a]">Liquidate reserve cash into operating account</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawdownModalOpen(false)}
                className="p-1 rounded hover:bg-[#171f33] text-[#86948a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDrawdownSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Drawdown Amount ($ USD)*</label>
                <input
                  type="number"
                  step="1000"
                  required
                  placeholder="15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white font-mono focus:outline-none focus:border-[#ffb4ab]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Purpose / Justification</label>
                <input
                  type="text"
                  required
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="p-3 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 rounded text-[11px] text-[#dae2fd]">
                Funds will be liquidated from Vanguard Money Market into <strong>Chase Operating ••8491</strong> for immediate operational deployment.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDrawdownModalOpen(false)}
                  className="px-3 py-1.5 rounded text-[#86948a] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#ffb4ab] hover:bg-[#ff897d] text-[#690005] rounded font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Authorize Drawdown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
