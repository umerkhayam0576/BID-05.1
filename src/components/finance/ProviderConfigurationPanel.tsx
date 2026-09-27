import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, LockKeyhole, Save, ShieldCheck } from 'lucide-react';

type Provider = 'Wise' | 'Payoneer' | 'Airwallex' | 'Mercury';

const providers: Provider[] = ['Wise', 'Payoneer', 'Airwallex', 'Mercury'];

export const ProviderConfigurationPanel: React.FC = () => {
  const [provider, setProvider] = useState<Provider>('Wise');
  const [clientId, setClientId] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState<Record<Provider, boolean>>({ Wise: false, Payoneer: false, Airwallex: false, Mercury: false });

  const saveConfiguration = () => {
    if (!clientId.trim() || !secret.trim()) return;
    setSaved((current) => ({ ...current, [provider]: true }));
    setSecret('');
  };

  return (
    <section className="rounded-xl border border-[#39445b] bg-[#111a2d] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#4edea3]"><LockKeyhole className="h-4 w-4" /><p className="text-[10px] uppercase tracking-[0.18em] font-mono font-bold">Secure provider console</p></div>
          <h2 className="mt-1 text-lg font-bold text-[#dae2fd]">Manage API connections without touching code</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#9aa9a0]">Only partners should configure company providers. Secrets are never shown after saving, and read-only access is required for balance and transaction sync.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#4edea3]/25 bg-[#4edea3]/10 px-3 py-2 text-[11px] text-[#9af5c9]"><ShieldCheck className="h-4 w-4" />Partner-controlled</div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[190px_1fr]">
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
          {providers.map((item) => <button key={item} type="button" onClick={() => { setProvider(item); setClientId(''); setSecret(''); }} className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors ${provider === item ? 'border-[#4edea3]/60 bg-[#4edea3]/10 text-[#9af5c9]' : 'border-[#273149] bg-[#0b1326] text-[#9aa9a0] hover:border-[#46536f]'}`}>{item}<span className="mt-1 block text-[10px] font-normal">{saved[item] ? 'Configured' : 'Not configured'}</span></button>)}
        </div>

        <div className="rounded-lg border border-[#273149] bg-[#0b1326] p-4">
          <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-[#f6c453]" /><h3 className="text-sm font-bold text-[#dae2fd]">{provider} read-only credentials</h3></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-[#bbcabf]">Client ID / API key<input value={clientId} onChange={(event) => setClientId(event.target.value)} type="text" autoComplete="off" placeholder="Paste the provider identifier" className="mt-1 h-10 w-full rounded-md border border-[#35415a] bg-[#131b2e] px-3 text-xs text-[#dae2fd] outline-none focus:border-[#4edea3]" /></label>
            <label className="text-xs font-semibold text-[#bbcabf]">Client secret / API secret<div className="relative mt-1"><input value={secret} onChange={(event) => setSecret(event.target.value)} type={showSecret ? 'text' : 'password'} autoComplete="new-password" placeholder="Paste once; it will be masked" className="h-10 w-full rounded-md border border-[#35415a] bg-[#131b2e] px-3 pr-10 text-xs text-[#dae2fd] outline-none focus:border-[#4edea3]" /><button type="button" aria-label={showSecret ? 'Hide secret' : 'Show secret'} onClick={() => setShowSecret((current) => !current)} className="absolute right-2 top-2.5 text-[#86948a] hover:text-[#dae2fd]">{showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-[#86948a]">Use the provider&apos;s sandbox first. Do not paste webhook signing secrets here.</p><button type="button" onClick={saveConfiguration} disabled={!clientId.trim() || !secret.trim()} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#4edea3] px-3 text-xs font-bold text-[#003824] disabled:cursor-not-allowed disabled:opacity-40"><Save className="h-3.5 w-3.5" />Save securely</button></div>
        </div>
      </div>
    </section>
  );
};

export default ProviderConfigurationPanel;
