import React, { useState } from 'react';
import { X, Building2, Plus } from 'lucide-react';
import { ClientItem } from '../types';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (client: ClientItem) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [division, setDivision] = useState('Commercial & Mixed-Use');
  const [agreementTier, setAgreementTier] = useState('MASTER AGREEMENT');
  const [lifetimeValue, setLifetimeValue] = useState('1500000');
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('Pre-Construction Director');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const words = name.trim().split(' ');
    const initials = words.length > 1
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();

    const contactInitials = contactName
      ? contactName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
      : 'PM';

    const val = parseFloat(lifetimeValue) || 1000000;

    const newClient: ClientItem = {
      id: `client-${Date.now()}`,
      initials,
      name: name.trim(),
      agreementTier,
      division,
      lifetimeValue: val,
      activeProjectsCount: 1,
      activeProjectsLabel: '1 Active Package',
      invoicedAmount: Math.round(val * 0.2),
      paidAmount: Math.round(val * 0.2),
      paidPercent: 100,
      contact: {
        initials: contactInitials,
        name: contactName.trim() || 'Chief Estimator',
        title: contactTitle,
        email: contactEmail.trim(),
        phone: contactPhone.trim(),
      },
    };

    onSubmit(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between bg-[#171f33]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center text-[#adc6ff]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#dae2fd]">
                Register Enterprise General Contractor
              </h3>
              <p className="text-[11px] text-[#86948a]">
                Establish master agreement terms and pre-construction lead contacts
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
              General Contractor / Developer Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Hensel Phelps"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Partnership Tier
              </label>
              <select
                value={agreementTier}
                onChange={(e) => setAgreementTier(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none font-mono"
              >
                <option value="MASTER AGREEMENT">MASTER AGREEMENT</option>
                <option value="STRATEGIC PARTNER">STRATEGIC PARTNER</option>
                <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Primary Division
              </label>
              <input
                type="text"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
              Estimated Lifetime Contract Value ($)
            </label>
            <input
              type="number"
              value={lifetimeValue}
              onChange={(e) => setLifetimeValue(e.target.value)}
              className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs font-mono text-[#dae2fd] outline-none"
            />
          </div>

          {/* Contact Details */}
          <div className="pt-2 border-t border-[#222a3d] space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#86948a] font-semibold block">
              Lead Executive / PM Contact
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#86948a] mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jason Miller"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#86948a] mb-1">Title</label>
                <input
                  type="text"
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                  className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#86948a] mb-1">Direct Phone</label>
                <input
                  type="text"
                  placeholder="+1 (555) 019-2834"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#86948a] mb-1">Corporate Email</label>
                <input
                  type="email"
                  placeholder="jmiller@henselphelps.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
                />
              </div>
            </div>
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
              <span>Save Client Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
