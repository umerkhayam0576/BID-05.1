import React, { useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, LockKeyhole, UserRound, X } from 'lucide-react';

type ConnectionMode = 'company' | 'personal';
type Provider = 'Wise' | 'Payoneer' | 'Airwallex' | 'Mercury';

interface ConnectFinancialAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequested: (provider: Provider, mode: ConnectionMode) => void;
}

const providers: { name: Provider; description: string }[] = [
  { name: 'Wise', description: 'Balances and transaction history' },
  { name: 'Payoneer', description: 'Balances and transaction history' },
  { name: 'Airwallex', description: 'Balances and transaction history' },
  { name: 'Mercury', description: 'Balances and transaction history' },
];

export const ConnectFinancialAccountModal: React.FC<ConnectFinancialAccountModalProps> = ({ isOpen, onClose, onRequested }) => {
  const [mode, setMode] = useState<ConnectionMode>('company');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [requested, setRequested] = useState(false);

  if (!isOpen) return null;

  const submit = () => {
    if (!selectedProvider) return;
    onRequested(selectedProvider, mode);
    setRequested(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="connect-financial-account-title">
      <div className="w-full max-w-xl rounded-2xl border border-[#2d3449] bg-[#131b2e] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#222a3d] p-5">
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#4edea3]">Read-only connections</p>
            <h2 id="connect-financial-account-title" className="mt-1 text-xl font-bold text-[#dae2fd]">Connect financial account</h2>
            <p className="mt-1 text-sm text-[#86948a]">Import balances and transactions without enabling transfers.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-[#86948a] hover:bg-[#222a3d] hover:text-[#dae2fd]"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#222a3d] bg-[#0b1326] p-1">
            <button type="button" onClick={() => setMode('company')} className={`rounded-lg px-3 py-3 text-left text-xs ${mode === 'company' ? 'bg-[#4edea3]/15 text-[#4edea3]' : 'text-[#86948a]'}`}><Building2 className="mb-1 h-4 w-4" /><span className="font-bold">Company account</span><span className="mt-1 block text-[11px] opacity-80">Partner approval required</span></button>
            <button type="button" onClick={() => setMode('personal')} className={`rounded-lg px-3 py-3 text-left text-xs ${mode === 'personal' ? 'bg-[#4edea3]/15 text-[#4edea3]' : 'text-[#86948a]'}`}><UserRound className="mb-1 h-4 w-4" /><span className="font-bold">Personal account</span><span className="mt-1 block text-[11px] opacity-80">Only you can view it</span></button>
          </div>

          {requested ? (
            <div className="rounded-xl border border-[#4edea3]/30 bg-[#4edea3]/10 p-5 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-[#4edea3]" /><h3 className="mt-3 font-bold text-[#dae2fd]">Connection request recorded</h3><p className="mt-1 text-sm text-[#9aa9a0]">{mode === 'company' ? 'A partner must approve this company connection before account access is enabled.' : 'Your personal connection can be authorized once provider access is configured.'}</p><button type="button" onClick={onClose} className="mt-4 h-9 rounded-md bg-[#4edea3] px-4 text-xs font-bold text-[#003824]">Done</button></div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {providers.map((provider) => <button key={provider.name} type="button" onClick={() => setSelectedProvider(provider.name)} className={`rounded-xl border p-3 text-left transition-colors ${selectedProvider === provider.name ? 'border-[#4edea3] bg-[#4edea3]/10' : 'border-[#222a3d] bg-[#0b1326] hover:border-[#3b455b]'}`}><span className="text-sm font-bold text-[#dae2fd]">{provider.name}</span><span className="mt-1 block text-[11px] text-[#86948a]">{provider.description}</span></button>)}
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-[#222a3d] bg-[#0b1326] p-3 text-xs text-[#9aa9a0]"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#4edea3]" /><span>Access is read-only. Credentials and tokens stay server-side and are never shown in the portal.</span></div>
              <button type="button" disabled={!selectedProvider} onClick={submit} className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#4edea3] text-sm font-bold text-[#003824] disabled:cursor-not-allowed disabled:opacity-40">Request connection <ArrowRight className="h-4 w-4" /></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectFinancialAccountModal;
