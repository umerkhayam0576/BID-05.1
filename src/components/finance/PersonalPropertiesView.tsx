import React, { useEffect, useMemo, useState } from 'react';

interface PersonalProperty {
  id: string;
  name: string;
  propertyType: string;
  location?: string | null;
  purchaseDate?: string | null;
  purchasePrice: string;
  currentValue: string;
  currency: string;
  mortgageBalance: string;
  monthlyPayment: string;
  rentalIncome: string;
  status: string;
  notes?: string | null;
}

const propertyTypes = ['residential', 'commercial', 'land', 'apartment', 'office', 'farm', 'other'];

const emptyForm = {
  name: '',
  propertyType: 'residential',
  location: '',
  purchaseDate: '',
  purchasePrice: '',
  currentValue: '',
  currency: 'USD',
  mortgageBalance: '',
  monthlyPayment: '',
  rentalIncome: '',
  notes: '',
};

export const PersonalPropertiesView: React.FC = () => {
  const [properties, setProperties] = useState<PersonalProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<PersonalProperty | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadProperties = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/personal-finance/properties', { credentials: 'include' });
      if (!response.ok) throw new Error('Could not load real estate properties');
      setProperties(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load real estate properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProperties(); }, []);

  const totals = useMemo(() => {
    return properties.reduce(
      (result, property) => {
        result.value += Number(property.currentValue || 0);
        result.mortgage += Number(property.mortgageBalance || 0);
        result.equity += Number(property.currentValue || 0) - Number(property.mortgageBalance || 0);
        result.rental += Number(property.rentalIncome || 0);
        return result;
      },
      { value: 0, mortgage: 0, equity: 0, rental: 0 }
    );
  }, [properties]);

  const saveProperty = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.currentValue) {
      setError('Property name and current market value are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const url = editing
        ? '/api/personal-finance/properties/' + editing.id
        : '/api/personal-finance/properties';

      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          propertyType: form.propertyType,
          location: form.location.trim() || undefined,
          purchaseDate: form.purchaseDate || undefined,
          purchasePrice: Number(form.purchasePrice || 0),
          currentValue: Number(form.currentValue),
          currency: form.currency,
          mortgageBalance: Number(form.mortgageBalance || 0),
          monthlyPayment: Number(form.monthlyPayment || 0),
          rentalIncome: Number(form.rentalIncome || 0),
          notes: form.notes.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save property');

      setProperties((current) =>
        editing
          ? current.map((property) => property.id === data.id ? data : property)
          : [data, ...current]
      );
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save property');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (property: PersonalProperty) => {
    setEditing(property);
    setForm({
      name: property.name,
      propertyType: property.propertyType,
      location: property.location || '',
      purchaseDate: property.purchaseDate || '',
      purchasePrice: property.purchasePrice || '',
      currentValue: property.currentValue || '',
      currency: property.currency || 'USD',
      mortgageBalance: property.mortgageBalance || '',
      monthlyPayment: property.monthlyPayment || '',
      rentalIncome: property.rentalIncome || '',
      notes: property.notes || '',
    });
    setError('');
  };

  const removeProperty = async (property: PersonalProperty) => {
    if (!window.confirm('Remove "' + property.name + '"? It will be archived.')) return;

    setError('');
    try {
      const response = await fetch('/api/personal-finance/properties/' + property.id, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not remove property');

      setProperties((current) => current.filter((item) => item.id !== property.id));
      if (editing?.id === property.id) {
        setEditing(null);
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove property');
    }
  };

  const money = (value: string | number, currency = 'USD') =>
    currency + ' ' + Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <div className="w-full min-h-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="font-mono text-xs text-[#4edea3] uppercase tracking-wider font-bold">Personal Wealth // Real Estate</div>
          <h1 className="mt-2 font-['Manrope'] text-2xl sm:text-3xl font-bold text-[#dae2fd]">Real Estate & Property</h1>
          <p className="mt-1 text-sm text-[#bbcabf]">Manage each personal property separately, including market value, mortgage, equity and rental income.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl px-4 py-3">
            <div className="font-mono text-[9px] uppercase tracking-wider text-[#bbcabf]">Market value</div>
            <div className="mt-1 font-mono text-base font-bold text-[#4edea3]">{money(totals.value)}</div>
          </div>
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl px-4 py-3">
            <div className="font-mono text-[9px] uppercase tracking-wider text-[#bbcabf]">Mortgage</div>
            <div className="mt-1 font-mono text-base font-bold text-[#ffb2b7]">{money(totals.mortgage)}</div>
          </div>
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl px-4 py-3">
            <div className="font-mono text-[9px] uppercase tracking-wider text-[#bbcabf]">Equity</div>
            <div className="mt-1 font-mono text-base font-bold text-[#dae2fd]">{money(totals.equity)}</div>
          </div>
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl px-4 py-3">
            <div className="font-mono text-[9px] uppercase tracking-wider text-[#bbcabf]">Rental / mo.</div>
            <div className="mt-1 font-mono text-base font-bold text-[#adc6ff]">{money(totals.rental)}</div>
          </div>
        </div>
      </section>

      {error && <div className="rounded-lg border border-[#ff7886]/40 bg-[#ff7886]/10 px-4 py-3 text-sm text-[#ffb2b7]">{error}</div>}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <form onSubmit={saveProperty} className="xl:col-span-1 bg-[#131b2e] border border-[#222a3d] rounded-xl p-5 space-y-4">
          <div>
            <h2 className="font-['Manrope'] font-bold text-lg text-[#dae2fd]">{editing ? 'Edit Property' : 'Add Property'}</h2>
            <p className="text-xs text-[#bbcabf] mt-1">Each property is stored as its own personal finance record.</p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-mono text-[#bbcabf]">Property name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Family Home" className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-mono text-[#bbcabf]">Property type</span>
              <select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })} className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]">
                {propertyTypes.map((type) => <option key={type} value={type}>{type.replace('-', ' ')}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-mono text-[#bbcabf]">Purchase date</span>
              <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-mono text-[#bbcabf]">Location / address</span>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, area or address" className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-mono text-[#bbcabf]">Purchase price</span>
              <input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="0.00" className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-mono text-[#bbcabf]">Current market value *</span>
              <input type="number" min="0" step="0.01" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} placeholder="0.00" className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-mono text-[#bbcabf]">Currency</span>
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={3} className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
            </label>
            <label className="block space-y-1.5 col-span-2">
              <span className="text-xs font-mono text-[#bbcabf]">Mortgage / loan balance</span>
              <input type="number" min="0" step="0.01" value={form.mortgageBalance} onChange={(e) => setForm({ ...form, mortgageBalance: e.target.value })} placeholder="0.00" className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-mono text-[#bbcabf]">Monthly payment</span>
              <input type="number" min="0" step="0.01" value={form.monthlyPayment} onChange={(e) => setForm({ ...form, monthlyPayment: e.target.value })} placeholder="0.00" className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-mono text-[#bbcabf]">Rental income / mo.</span>
              <input type="number" min="0" step="0.01" value={form.rentalIncome} onChange={(e) => setForm({ ...form, rentalIncome: e.target.value })} placeholder="0.00" className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-mono text-[#bbcabf]">Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Optional details" className="w-full rounded-lg bg-[#060e20] border border-[#2d3449] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3] resize-none" />
          </label>

          <button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 px-4 py-2.5 text-sm font-bold text-[#003824] transition-colors">
            <span className="material-symbols-outlined text-sm">{editing ? 'save' : 'add_home'}</span>
            {saving ? 'Saving...' : editing ? 'Update Property' : 'Add Property'}
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
              <h2 className="font-['Manrope'] font-bold text-lg text-[#dae2fd]">Your Properties</h2>
              <p className="text-xs text-[#bbcabf] mt-1">{properties.length} active property(s)</p>
            </div>
            <span className="font-mono text-[10px] text-[#4edea3] uppercase font-bold">LIVE</span>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-[#bbcabf]">Loading properties...</div>
          ) : properties.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#bbcabf]">No personal properties have been added yet.</div>
          ) : (
            <div className="divide-y divide-[#222a3d]">
              {properties.map((property) => {
                const equity = Number(property.currentValue || 0) - Number(property.mortgageBalance || 0);
                return (
                  <div key={property.id} className="px-5 py-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="font-['Manrope'] font-semibold text-[#dae2fd]">{property.name}</div>
                        <div className="mt-1 text-xs text-[#bbcabf] capitalize">
                          {property.propertyType.replace('-', ' ')}{property.location ? ' • ' + property.location : ''} • {property.status}
                        </div>
                        {property.purchaseDate && <div className="mt-1 text-xs text-[#91a0c5]">Purchased {property.purchaseDate}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => startEdit(property)} className="rounded-lg border border-[#2d3449] px-3 py-2 text-xs font-semibold text-[#dae2fd] hover:bg-[#1a2236]">Edit</button>
                        <button type="button" onClick={() => removeProperty(property)} className="rounded-lg border border-[#ff7886]/40 px-3 py-2 text-xs font-semibold text-[#ffb2b7] hover:bg-[#ff7886]/10">Remove</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-lg bg-[#060e20] border border-[#222a3d] p-3">
                        <div className="text-[9px] font-mono uppercase text-[#bbcabf]">Market value</div>
                        <div className="mt-1 font-mono font-bold text-[#4edea3]">{money(property.currentValue, property.currency)}</div>
                      </div>
                      <div className="rounded-lg bg-[#060e20] border border-[#222a3d] p-3">
                        <div className="text-[9px] font-mono uppercase text-[#bbcabf]">Mortgage</div>
                        <div className="mt-1 font-mono font-bold text-[#ffb2b7]">{money(property.mortgageBalance, property.currency)}</div>
                      </div>
                      <div className="rounded-lg bg-[#060e20] border border-[#222a3d] p-3">
                        <div className="text-[9px] font-mono uppercase text-[#bbcabf]">Equity</div>
                        <div className="mt-1 font-mono font-bold text-[#dae2fd]">{money(equity, property.currency)}</div>
                      </div>
                      <div className="rounded-lg bg-[#060e20] border border-[#222a3d] p-3">
                        <div className="text-[9px] font-mono uppercase text-[#bbcabf]">Rental / mo.</div>
                        <div className="mt-1 font-mono font-bold text-[#adc6ff]">{money(property.rentalIncome, property.currency)}</div>
                      </div>
                    </div>
                    {property.notes && <div className="text-xs text-[#91a0c5]">{property.notes}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </div>
  );
};
