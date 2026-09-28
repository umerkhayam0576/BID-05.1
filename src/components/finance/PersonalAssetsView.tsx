import React, { useEffect, useMemo, useState } from 'react';

interface PersonalAsset {
  id: string;
  name: string;
  assetType: string;
  currentValue: string;
  currency: string;
  status: string;
  notes?: string | null;
}

interface PersonalProperty {
  id: string;
  name: string;
  propertyType: string;
  currentValue: string;
  currency: string;
  mortgageBalance: string;
  rentalIncome: string;
  status: string;
}

const assetTypes = ['cash-equivalent', 'vehicle', 'property', 'equipment', 'investment', 'collectible', 'other'];
const emptyForm = { name: '', assetType: 'equipment', currentValue: '', currency: 'USD', notes: '' };

export const PersonalAssetsView: React.FC = () => {
  const [assets, setAssets] = useState<PersonalAsset[]>([]);
  const [properties, setProperties] = useState<PersonalProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<PersonalAsset | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadAssets = async () => {
    setLoading(true);
    setError('');
    try {
      const [assetsResponse, propertiesResponse] = await Promise.all([
        fetch('/api/personal-finance/assets', { credentials: 'include' }),
        fetch('/api/personal-finance/properties', { credentials: 'include' }),
      ]);
      if (!assetsResponse.ok) throw new Error('Could not load personal assets');
      if (!propertiesResponse.ok) throw new Error('Could not load personal properties');
      setAssets(await assetsResponse.json());
      setProperties(await propertiesResponse.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load personal assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAssets(); }, []);

  const total = useMemo(
    () => assets.reduce((sum, asset) => sum + Number(asset.currentValue || 0), 0)
      + properties.reduce((sum, property) => sum + Number(property.currentValue || 0), 0),
    [assets, properties]
  );

  const saveAsset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.currentValue) {
      setError('Asset name and current value are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const url = editing ? '/api/personal-finance/assets/' + editing.id : '/api/personal-finance/assets';
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          assetType: form.assetType,
          currentValue: Number(form.currentValue),
          currency: form.currency,
          notes: form.notes.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save asset');

      setAssets((current) => editing
        ? current.map((asset) => asset.id === data.id ? data : asset)
        : [data, ...current]
      );
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save asset');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (asset: PersonalAsset) => {
    setEditing(asset);
    setForm({
      name: asset.name,
      assetType: asset.assetType,
      currentValue: asset.currentValue,
      currency: asset.currency,
      notes: asset.notes || '',
    });
    setError('');
  };

  const removeAsset = async (asset: PersonalAsset) => {
    if (!window.confirm('Remove "' + asset.name + '"? It will be archived.')) return;

    setError('');
    try {
      const response = await fetch('/api/personal-finance/assets/' + asset.id, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not remove asset');

      setAssets((current) => current.filter((item) => item.id !== asset.id));
      if (editing?.id === asset.id) {
        setEditing(null);
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove asset');
    }
  };

  return (
    <div className="w-full min-h-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="font-mono text-xs text-[#4edea3] uppercase tracking-wider font-bold">Personal Wealth // Assets</div>
          <h1 className="mt-2 font-['Manrope'] text-2xl sm:text-3xl font-bold text-[#dae2fd]">Personal Assets</h1>
          <p className="mt-1 text-sm text-[#bbcabf]">Real assets and properties stored in your personal finance database and included in net worth.</p>
        </div>
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl px-5 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#bbcabf]">Live asset total</div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#4edea3]">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </section>

      {error && <div className="rounded-lg border border-[#ff7886]/40 bg-[#ff7886]/10 px-4 py-3 text-sm text-[#ffb2b7]">{error}</div>}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <form onSubmit={saveAsset} className="xl:col-span-1 bg-[#131b2e] border border-[#222a3d] rounded-xl p-5 space-y-4">
          <div>
            <h2 className="font-['Manrope'] font-bold text-lg text-[#dae2fd]">{editing ? 'Edit Asset' : 'Add Asset'}</h2>
            <p className="text-xs text-[#bbcabf] mt-1">Changes are saved directly to PostgreSQL.</p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-mono text-[#bbcabf]">Asset name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Personal Car" className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-mono text-[#bbcabf]">Asset type</span>
            <select value={form.assetType} onChange={(e) => setForm({ ...form, assetType: e.target.value })} className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]">
              {assetTypes.map((type) => <option key={type} value={type}>{type.replace('-', ' ')}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-mono text-[#bbcabf]">Current value</span>
              <input type="number" min="0" step="0.01" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} placeholder="0.00" className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-mono text-[#bbcabf]">Currency</span>
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={3} className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-mono text-[#bbcabf]">Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Optional details" className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3] resize-none" />
          </label>

          <button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 px-4 py-2.5 text-sm font-bold text-[#003824] transition-colors">
            <span className="material-symbols-outlined text-sm">{editing ? 'save' : 'add'}</span>
            {saving ? 'Saving...' : editing ? 'Update Asset' : 'Add Personal Asset'}
          </button>

          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); setError(''); }} className="w-full rounded-lg border border-[#2d3449] px-4 py-2 text-xs font-semibold text-[#bbcabf] hover:bg-[#1a2236]">
              Cancel Edit
            </button>
          )}
        </form>

        <section className="xl:col-span-2 bg-[#131b2e] border border-[#222a3d] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between">
            <div>
              <h2 className="font-['Manrope'] font-bold text-lg text-[#dae2fd]">Your Assets</h2>
              <p className="text-xs text-[#bbcabf] mt-1">{assets.length + properties.length} active asset(s), including {properties.length} propert{properties.length === 1 ? 'y' : 'ies'}</p>
            </div>
            <span className="font-mono text-[10px] text-[#4edea3] uppercase font-bold">LIVE</span>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-[#bbcabf]">Loading assets...</div>
          ) : assets.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#bbcabf]">No personal assets have been added yet.</div>
          ) : (
            <div className="divide-y divide-[#222a3d]">
              {assets.map((asset) => (
                <div key={asset.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-['Manrope'] font-semibold text-[#dae2fd]">{asset.name}</div>
                    <div className="mt-1 text-xs text-[#bbcabf] capitalize">{asset.assetType.replace('-', ' ')} • {asset.currency} • {asset.status}</div>
                    {asset.notes && <div className="mt-1 text-xs text-[#91a0c5]">{asset.notes}</div>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-lg font-bold text-[#4edea3]">{asset.currency} {Number(asset.currentValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <button type="button" onClick={() => startEdit(asset)} className="rounded-lg border border-[#2d3449] px-3 py-2 text-xs font-semibold text-[#dae2fd] hover:bg-[#1a2236]">Edit</button>
                    <button type="button" onClick={() => removeAsset(asset)} className="rounded-lg border border-[#ff7886]/40 px-3 py-2 text-xs font-semibold text-[#ffb2b7] hover:bg-[#ff7886]/10">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
};
