import React from 'react';
import { CheckCircle2, Clock3, Link2, ShieldCheck, XCircle } from 'lucide-react';

type Provider = 'Wise' | 'Payoneer' | 'Airwallex' | 'Mercury';
type ConnectionStatus = 'connected' | 'pending' | 'not_connected';

export interface Connection {
  provider: Provider;
  mode: 'company' | 'personal';
  status: ConnectionStatus;
  balance: string;
  lastSync: string;
}

const statusMeta = {
  connected: { label: 'Connected', icon: CheckCircle2, className: 'text-[#4edea3] bg-[#4edea3]/10 border-[#4edea3]/30' },
  pending: { label: 'Pending approval', icon: Clock3, className: 'text-[#f6c453] bg-[#f6c453]/10 border-[#f6c453]/30' },
  not_connected: { label: 'Not connected', icon: XCircle, className: 'text-[#86948a] bg-[#0b1326] border-[#222a3d]' },
};

interface FinancialConnectionsPanelProps {
  connections?: Connection[];
  onRequest?: (index: number) => void;
  onApprove?: (index: number) => void;
  onRemove?: (index: number) => void;
}

const fallbackConnections: Connection[] = [
  { provider: 'Wise', mode: 'company', status: 'pending', balance: '—', lastSync: 'Partner approval required' },
  { provider: 'Payoneer', mode: 'company', status: 'not_connected', balance: '—', lastSync: 'Not connected' },
  { provider: 'Airwallex', mode: 'company', status: 'not_connected', balance: '—', lastSync: 'Not connected' },
  { provider: 'Mercury', mode: 'personal', status: 'not_connected', balance: '—', lastSync: 'Not connected' },
];

export const FinancialConnectionsPanel: React.FC<FinancialConnectionsPanelProps> = ({
  connections = fallbackConnections,
  onRequest = () => undefined,
  onApprove = () => undefined,
  onRemove = () => undefined,
}) => {
  const stripeConnected = true;

  return (
    <section className="rounded-xl border border-[#222a3d] bg-[#131b2e] p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div><p className="text-[10px] uppercase tracking-[0.18em] text-[#4edea3] font-mono font-bold">Connected account dashboard</p><h2 className="mt-1 text-lg font-bold text-[#dae2fd]">Company and personal connections</h2><p className="mt-1 text-sm text-[#86948a]">Read-only balances and transactions. Company accounts require partner approval.</p></div>
        <div className="flex items-center gap-2 text-[11px] text-[#9aa9a0]"><ShieldCheck className="h-4 w-4 text-[#4edea3]" />Read-only access</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {connections.map((connection, index) => { const meta = statusMeta[connection.status]; const Icon = meta.icon; return <article key={connection.provider} className="rounded-lg border border-[#222a3d] bg-[#0b1326] p-3"><div className="flex items-start justify-between gap-2"><div><h3 className="text-sm font-bold text-[#dae2fd]">{connection.provider}</h3><p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#86948a]">{connection.mode} account</p></div><Link2 className="h-4 w-4 text-[#86948a]" /></div><div className={`mt-3 flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold ${meta.className}`}><Icon className="h-3.5 w-3.5" />{meta.label}</div><p className="mt-3 text-lg font-bold text-[#dae2fd]">{connection.balance}</p><p className="text-[10px] text-[#86948a]">{connection.lastSync}</p>{connection.status === 'not_connected' && <button type="button" onClick={() => onRequest(index)} className="mt-3 h-8 w-full rounded-md border border-[#4edea3]/40 text-xs font-bold text-[#4edea3] hover:bg-[#4edea3]/10">Request connection</button>}{connection.status === 'pending' && <button type="button" onClick={() => onApprove(index)} className="mt-3 h-8 w-full rounded-md border border-[#f6c453]/30 text-xs font-bold text-[#f6c453] hover:bg-[#f6c453]/10">Approve as partner</button>}<button type="button" onClick={() => onRemove(index)} className="mt-3 h-8 w-full rounded-md border border-red-400/30 text-xs font-bold text-red-300 hover:bg-red-400/10">Remove connection</button></article>; })}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#635bff]/30 bg-[#635bff]/10 p-3"><div><p className="text-xs font-bold text-[#dae2fd]">Stripe company account</p><p className="mt-0.5 text-[11px] text-[#b5b9e8]">Used for client payments and deposit checkout.</p></div>{stripeConnected ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4edea3]"><CheckCircle2 className="h-4 w-4" />Connected via Stripe integration</span> : null}</div>
    </section>
  );
};

export default FinancialConnectionsPanel;
