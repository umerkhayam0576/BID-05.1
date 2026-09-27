import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  DollarSign,
  Send,
  Sparkles,
  Layers,
  FileText,
  Calculator,
  Mail,
  Lock,
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { QuoteEntity, QuoteLineItem, IntakeRequestItem } from '../../types/workflow';

const CSI_DIVISIONS = [
  'Division 01 General Requirements', 'Division 02 Existing Conditions', 'Division 03 Concrete', 'Division 04 Masonry', 'Division 05 Metals',
  'Division 06 Wood, Plastics & Composites', 'Division 07 Thermal & Moisture Protection', 'Division 08 Openings', 'Division 09 Finishes', 'Division 10 Specialties',
  'Division 11 Equipment', 'Division 12 Furnishings', 'Division 13 Special Construction', 'Division 14 Conveying Equipment', 'Division 21 Fire Suppression',
  'Division 22 Plumbing', 'Division 23 HVAC', 'Division 25 Integrated Automation', 'Division 26 Electrical', 'Division 27 Communications',
  'Division 28 Electronic Safety & Security', 'Division 31 Earthwork', 'Division 32 Exterior Improvements', 'Division 33 Utilities', 'Division 34 Transportation',
  'Division 35 Waterway & Marine Construction', 'Division 40 Process Interconnections', 'Division 41 Material Processing & Handling Equipment', 'Division 42 Process Heating, Cooling & Drying Equipment', 'Division 43 Process Gas & Liquid Handling',
  'Division 44 Pollution & Waste Control Equipment', 'Division 45 Industry-Specific Manufacturing Equipment', 'Division 46 Water & Wastewater Equipment', 'Division 48 Electrical Power Generation', 'Division 49 Reserved for Future Use',
  'VDC / BIM Coordination', 'General Estimating & Quantity Takeoff'
];

interface QuotationBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  intakeRequest?: IntakeRequestItem | null;
  onCreateQuote: (quote: QuoteEntity) => void;
}

export const QuotationBuilderModal: React.FC<QuotationBuilderModalProps> = ({
  isOpen,
  onClose,
  intakeRequest,
  onCreateQuote,
}) => {
  const [projectTitle, setProjectTitle] = useState(
    intakeRequest?.projectTitle || 'Embarcadero Transit Plaza - Substructure QTO'
  );
  const [clientCompany, setClientCompany] = useState(
    intakeRequest?.clientCompany || 'Skanska USA Building Inc.'
  );
  const [clientName, setClientName] = useState(
    intakeRequest?.clientName || 'Sarah Jenkins'
  );
  const [clientEmail, setClientEmail] = useState(
    intakeRequest?.clientEmail || 'sjenkins@skanska-usa.com'
  );
  const [scopeSummary, setScopeSummary] = useState(
    intakeRequest?.scopeSummary ||
      'Complete turnkey cast-in-place concrete quantity takeoff, slurry wall reinforcement, and excavation leveling.'
  );
  const [scopePreset, setScopePreset] = useState(intakeRequest?.scopeSummary || '');
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(true);
  const [markupPercent, setMarkupPercent] = useState<number>(10);
  const [bondingFee, setBondingFee] = useState<number>(1850);
  const [depositPercent, setDepositPercent] = useState<number>(25);
  const [validDays, setValidDays] = useState<number>(30);
  const [currency, setCurrency] = useState('USD');
  const currencyOptions = [
    { code: 'USD', name: 'US Dollar', locale: 'en-US' },
    { code: 'CAD', name: 'Canadian Dollar', locale: 'en-CA' },
    { code: 'EUR', name: 'Euro', locale: 'de-DE' },
    { code: 'GBP', name: 'British Pound', locale: 'en-GB' },
    { code: 'AED', name: 'UAE Dirham', locale: 'en-AE' },
    { code: 'SAR', name: 'Saudi Riyal', locale: 'ar-SA' },
    { code: 'AUD', name: 'Australian Dollar', locale: 'en-AU' },
    { code: 'PKR', name: 'Pakistani Rupee', locale: 'en-PK' },
  ];
  const formatMoney = (value: number) => new Intl.NumberFormat(currencyOptions.find((option) => option.code === currency)?.locale || 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);

  // Line items state
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
    {
      id: 'li-new-1',
      csiDivision: 'Division 03 Concrete',
      description: '35,000 CY deep foundation raft and cast-in-place slurry walls',
      quantity: 35000,
      unit: 'CY',
      unitCost: 1.65,
      totalCost: 57750,
    },
    {
      id: 'li-new-2',
      csiDivision: 'Division 31 Earthwork',
      description: 'Deep soil mixing, soldier pile shoring, and dewatering volume calculations',
      quantity: 1,
      unit: 'PACKAGE',
      unitCost: 18500,
      totalCost: 18500,
    },
    {
      id: 'li-new-3',
      csiDivision: 'Division 05 Metals',
      description: 'Embedded anchor bolts, structural baseplates, and rebar tonnage modeling',
      quantity: 620,
      unit: 'TON',
      unitCost: 22.0,
      totalCost: 13640,
    },
  ]);

  if (!isOpen) return null;

  const subtotal = lineItems.reduce((acc, curr) => acc + curr.totalCost, 0);
  const markupAmount = (subtotal * markupPercent) / 100;
  const totalAmount = subtotal + markupAmount + bondingFee;
  const requiredDepositAmount = (totalAmount * depositPercent) / 100;

  const handleAddLineItem = () => {
    const newItem: QuoteLineItem = {
      id: `li-new-${Date.now()}`,
      csiDivision: 'Division 03 Concrete',
      description: 'Additional QTO Scope Item',
      quantity: 1,
      unit: 'PACKAGE',
      unitCost: 5000,
      totalCost: 5000,
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((i) => i.id !== id));
  };

  const handleUpdateLineItem = (
    id: string,
    field: keyof QuoteLineItem,
    val: string | number
  ) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === 'quantity' || field === 'unitCost') {
          updated.totalCost = Number(updated.quantity) * Number(updated.unitCost);
        }
        return updated;
      })
    );
  };

  const handleGenerateAndDispatch = () => {
    const quoteCode = `QTE-2024-${Math.floor(100 + Math.random() * 900)}`;
    const approvalToken = `sec_${Math.random().toString(36).substring(2, 10)}`;

    const newQuote: QuoteEntity = {
      id: quoteCode,
      intakeRequestId: intakeRequest?.id,
      quoteNumber: quoteCode,
      title: projectTitle,
      client: {
        name: clientName,
        company: clientCompany,
        email: clientEmail,
        phone: intakeRequest?.clientPhone || '+1 (415) 555-0192',
        billingAddress: '525 Market St, Suite 2600, San Francisco, CA 94105',
      },
      scopeSummary,
      csiDivisions: Array.from(new Set(lineItems.map((li) => li.csiDivision))),
      lineItems,
      subtotal,
      markupPercent,
      bondingFee,
      totalAmount,
      currency,
      requiredDepositPercent: depositPercent,
      requiredDepositAmount,
      paymentTerms: `Net 30 with ${depositPercent}% Mobilization Deposit`,
      validUntil: new Date(Date.now() + validDays * 86400000).toISOString().slice(0, 10),
      approvalToken,
      dynamicApprovalLink: `https://ais-dev-fd4f3wgrktm45vl6vwtbsl-437062701540.asia-southeast1.run.app/client-portal?quote=${quoteCode}&token=${approvalToken}`,
      status: 'sent',
      generatedBy: {
        userId: 'usr-est-04',
        name: 'Syed Ahmed',
        role: 'PM Lead & Estimating Director',
      },
      generatedAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
    };

    onCreateQuote(newQuote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-[#dae2fd]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4edea3]/10 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Structured Quotation Generation &amp; Dispatch</span>
                <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] text-[10px] font-mono font-semibold">
                  Auto-Email Delivery Ready
                </span>
              </h2>
              <p className="text-xs text-[#86948a]">
                Build itemized estimates, configure required mobilization deposit, and generate instant client portal approval links
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#86948a] hover:text-white rounded-md hover:bg-[#1f283d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#0b1326]">
          {/* Client & Project Overview */}
          <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold">
              Project &amp; Client Metadata
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block text-[11px] text-[#86948a] mb-1">Project Name / Scope</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded-lg text-white font-sans text-xs focus:outline-none focus:border-[#4edea3]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#86948a] mb-1">Target General Contractor (Client)</label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded-lg text-white font-sans text-xs focus:outline-none focus:border-[#4edea3]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#86948a] mb-1">Recipient Contact Person</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded-lg text-white font-sans text-xs focus:outline-none focus:border-[#4edea3]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#86948a] mb-1">Recipient Email (Auto-Notification)</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#4edea3]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-3">
              <div>
                <label className="block text-[11px] text-[#86948a] mb-1 font-mono">Client-linked scope preset</label>
                <select
                  value={scopePreset}
                  onChange={(e) => { setScopePreset(e.target.value); if (e.target.value) setScopeSummary(e.target.value); }}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded-lg text-white font-sans text-xs focus:outline-none focus:border-[#4edea3]"
                >
                  <option value="">Manual scope entry</option>
                  {intakeRequest?.scopeSummary && <option value={intakeRequest.scopeSummary}>Auto-selected from {intakeRequest.clientCompany}</option>}
                  <option value="Complete quantity takeoff, trade-specific pricing, and constructability review per issued drawings.">Standard estimating package</option>
                </select>
                <p className="mt-1 text-[10px] text-[#4edea3]">Client, contact, and scope are linked to this draft.</p>
              </div>
              <div>
                <label className="block text-[11px] text-[#86948a] mb-1 font-mono">Scope Narrative &amp; Takeoff Specifications</label>
                <textarea
                rows={2}
                value={scopeSummary}
                onChange={(e) => setScopeSummary(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded-lg text-white font-sans text-xs focus:outline-none focus:border-[#4edea3]"
              />
              </div>
            </div>
          </div>

          {/* CSI Division Line Items Builder */}
          <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold">
                  CSI Division Itemized Pricing Breakdown
                </div>
                <div className="text-xs text-[#86948a]">
                  Quantities and unit pricing extracted from drawings
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="px-3 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#222a3d] border border-[#2d3449] text-xs font-mono text-[#4edea3] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add CSI Line Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center font-mono text-xs"
                >
                  <div className="md:col-span-3">
                    <select
                      value={item.csiDivision}
                      onChange={(e) => handleUpdateLineItem(item.id, 'csiDivision', e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-white text-xs focus:outline-none"
                    >
                      {CSI_DIVISIONS.map((division) => <option key={division} value={division}>{division}</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                      placeholder="Scope description"
                      className="w-full px-2 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateLineItem(item.id, 'quantity', Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-white text-xs text-right focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleUpdateLineItem(item.id, 'unit', e.target.value)}
                      placeholder="Unit"
                      className="w-full px-2 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-[#86948a] text-xs text-center focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) => handleUpdateLineItem(item.id, 'unitCost', Number(e.target.value))}
                      placeholder="Rate"
                      className="w-full px-2 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-white text-xs text-right focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-1 text-right font-bold text-[#4edea3]">
                    ${item.totalCost.toLocaleString()}
                  </div>

                  <div className="md:col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(item.id)}
                      className="p-1 text-[#86948a] hover:text-[#ff7886] rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Financial Adjustments */}
          <div className="mb-3 rounded-xl border border-[#4edea3]/25 bg-[#0b1326] p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p className="text-xs font-semibold text-white">Quotation currency</p><p className="text-[10px] text-[#86948a]">Line items, deposits, balances, payments, and expenses use this currency.</p></div><select aria-label="Quotation currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className="rounded-lg border border-[#2b3851] bg-[#131b2e] px-3 py-2 text-xs font-mono text-white"><option value="USD">USD · US Dollar</option><option value="CAD">CAD · Canadian Dollar</option><option value="EUR">EUR · Euro</option><option value="GBP">GBP · British Pound</option><option value="AED">AED · UAE Dirham</option><option value="SAR">SAR · Saudi Riyal</option><option value="AUD">AUD · Australian Dollar</option><option value="PKR">PKR · Pakistani Rupee</option></select></div>
          <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <label className="block text-[11px] text-[#86948a] mb-1">Overhead &amp; Markup (%)</label>
              <input
                type="number"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded-lg text-white font-mono text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#86948a] mb-1">Performance Bonding Fee ($)</label>
              <input
                type="number"
                value={bondingFee}
                onChange={(e) => setBondingFee(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded-lg text-white font-mono text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#4edea3] mb-1 font-bold">Required Mobilization Deposit (%)</label>
              <input
                type="number"
                value={depositPercent}
                onChange={(e) => setDepositPercent(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0b1326] border border-[#4edea3]/40 rounded-lg text-[#4edea3] font-mono text-xs font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Summary Calculation Box */}
          <div className="p-4 rounded-xl bg-[#172036] border border-[#4edea3]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#86948a]">
                Gross Quotation Amount
              </div>
              <div className="text-2xl font-bold text-white">
                {formatMoney(totalAmount)}
              </div>
              <div className="text-xs text-[#86948a] mt-0.5">
                Subtotal: ${subtotal.toLocaleString()} &bull; Markup: ${markupAmount.toLocaleString()}
              </div>
            </div>

            <div className="text-left sm:text-right p-3 rounded-lg bg-[#0b1326] border border-[#4edea3]/40 min-w-[220px]">
              <div className="text-[10px] uppercase text-[#4edea3] font-bold">
                Upfront Mobilization Deposit ({depositPercent}%)
              </div>
              <div className="text-xl font-bold text-[#4edea3]">
                ${requiredDepositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-[#86948a]">
                Required for Automated Activation
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#2d3449] bg-[#0b1326] overflow-hidden">
            <button type="button" onClick={() => setEmailPreviewOpen((open) => !open)} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#131b2e] transition-colors">
              <span className="text-xs font-mono uppercase tracking-wider text-[#dae2fd] font-semibold">Quotation email draft preview</span>
              <span className="text-[10px] font-mono text-[#4edea3]">{emailPreviewOpen ? 'Hide preview' : 'Show preview'}</span>
            </button>
            {emailPreviewOpen && <div className="border-t border-[#222a3d] p-4 text-xs text-[#bbcabf] space-y-2 font-sans">
              <p><strong className="text-white">Subject:</strong> Quotation for {projectTitle} - {lineItems[0]?.csiDivision || 'Shop Drawing'}</p>
              <p>Dear {clientName || 'Client'},</p>
              <p>We are pleased to submit our quotation for the {projectTitle} project as outlined below:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 rounded-lg bg-[#131b2e] p-3 font-mono text-[11px]"><span>Client: {clientCompany}</span><span>Scope: {scopeSummary}</span><span>Total Quotation: ${totalAmount.toLocaleString()}</span><span>Pending Cost: ${Math.max(0, totalAmount - requiredDepositAmount).toLocaleString()}</span></div>
              <p>Click here to pay ${requiredDepositAmount.toLocaleString()}: We confirm that our team will complete the work as per the agreed scope and deliver it within the specified timeframe.</p>
              <p>Best regards,<br />Bid Exact Estimating Team</p>
            </div>}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
          <div className="text-xs text-[#86948a] flex items-center gap-1.5 font-mono">
            <Mail className="w-4 h-4 text-[#4edea3]" />
            <span>Client will receive automated email with dynamic payment token link</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-xs text-[#86948a] font-medium border border-[#2d3449] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateAndDispatch}
              className="px-5 py-2 rounded-lg bg-[#4edea3] hover:bg-[#3ec490] text-[#0b1326] font-bold text-xs font-mono flex items-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Generate &amp; Dispatch to Client</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
