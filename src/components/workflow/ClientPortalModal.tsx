import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  ArrowRight,
  FileCheck2,
  FileText,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { QuoteEntity, ProjectEntity } from '../../types/workflow';

interface ClientPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: QuoteEntity;
  activeProject?: ProjectEntity;
  onApproveAndPayDeposit: (
    quoteId: string,
    signerName: string,
    signerTitle: string,
    paymentMethod: 'card' | 'ach',
    cardLast4: string
  ) => void;
}

export const ClientPortalModal: React.FC<ClientPortalModalProps> = ({
  isOpen,
  onClose,
  quote,
  activeProject,
  onApproveAndPayDeposit,
}) => {
  const [signerName, setSignerName] = useState(quote.client.name || 'Gregory Scott');
  const [signerTitle, setSignerTitle] = useState('VP Pre-Construction');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [paymentTab, setPaymentTab] = useState<'card' | 'ach'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('884');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<'review' | 'sign_and_pay' | 'success'>(
    quote.status === 'paid_and_activated' ? 'success' : 'review'
  );

  if (!isOpen) return null;

  const isAlreadyPaid = quote.status === 'paid_and_activated';

  const handleProcessPayment = () => {
    if (!termsAgreed && !isAlreadyPaid) return;
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setActiveStep('success');
      onApproveAndPayDeposit(
        quote.id,
        signerName,
        signerTitle,
        paymentTab,
        paymentTab === 'card' ? '4242' : '9812'
      );
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0f172a] border border-[#334155] rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-[#e2e8f0]">
        {/* Top Portal Banner */}
        <div className="bg-[#0b1329] border-b border-[#1e293b] px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#4edea3]/20 border border-[#4edea3]/40 flex items-center justify-center text-[#4edea3] font-bold text-sm">
              BE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Bid Exact Client Gateway
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-[#4edea3]/20 text-[#4edea3] rounded">
                  256-BIT ENCRYPTED
                </span>
              </div>
              <div className="text-[11px] text-[#94a3b8]">
                Authorized Client: <span className="text-white font-medium">{quote.client.company}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#94a3b8]">
              <Lock className="w-3.5 h-3.5 text-[#4edea3]" />
              <span>Token ID: <code className="text-[#38bdf8] font-mono">{quote.approvalToken}</code></span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#94a3b8] hover:text-white rounded-md hover:bg-[#1e293b] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Stepper Bar */}
        <div className="bg-[#1e293b]/60 border-b border-[#334155] px-6 py-2.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 sm:gap-6 flex-wrap">
            <button
              onClick={() => setActiveStep('review')}
              className={`flex items-center gap-1.5 cursor-pointer ${
                activeStep === 'review' ? 'text-[#4edea3] font-bold' : 'text-[#94a3b8]'
              }`}
            >
              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">1</span>
              <span>Review Scope &amp; Pricing</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#64748b]" />
            <button
              onClick={() => setActiveStep('sign_and_pay')}
              className={`flex items-center gap-1.5 cursor-pointer ${
                activeStep === 'sign_and_pay' ? 'text-[#4edea3] font-bold' : 'text-[#94a3b8]'
              }`}
            >
              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">2</span>
              <span>Sign &amp; Pay Deposit</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#64748b]" />
            <button
              onClick={() => setActiveStep('success')}
              className={`flex items-center gap-1.5 cursor-pointer ${
                activeStep === 'success' || isAlreadyPaid ? 'text-[#4edea3] font-bold' : 'text-[#64748b]'
              }`}
            >
              <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">3</span>
              <span>Project Activation &amp; Vault</span>
            </button>
          </div>

          <div className="text-[11px] text-[#94a3b8] hidden md:block">
            Quote #{quote.quoteNumber} &bull; Valid Thru {quote.validUntil}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeStep === 'review' && (
            <div className="space-y-6">
              {/* Proposal Header Banner */}
              <div className="p-5 rounded-xl bg-[#1e293b] border border-[#334155] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#38bdf8] mb-1">
                    <span>PRE-CONSTRUCTION ESTIMATING PROPOSAL</span>
                    <span>&bull;</span>
                    <span>CSI DIVISION LEVEL TAKEOFF</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">{quote.title}</h1>
                  <p className="text-xs sm:text-sm text-[#94a3b8] mt-1 max-w-2xl">
                    {quote.scopeSummary}
                  </p>
                </div>

                <div className="text-left md:text-right font-mono bg-[#0b1329] p-3.5 rounded-lg border border-[#334155] min-w-[200px]">
                  <div className="text-[10px] text-[#94a3b8] uppercase">Total Scope Value</div>
                  <div className="text-2xl font-bold text-[#4edea3]">
                    ${quote.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-[#38bdf8] mt-0.5">
                    Deposit Required: ${quote.requiredDepositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({quote.requiredDepositPercent}%)
                  </div>
                </div>
              </div>

              {/* Itemized CSI Division Scope Table */}
              <div className="rounded-xl border border-[#334155] bg-[#1e293b] overflow-hidden">
                <div className="p-4 border-b border-[#334155] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#4edea3]" />
                    <span>Itemized Pre-Con Scope &amp; Deliverables</span>
                  </h3>
                  <span className="text-xs font-mono text-[#94a3b8]">
                    {quote.lineItems.length} Billable Divisions
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0b1329] text-[#94a3b8] uppercase text-[10px] tracking-wider border-b border-[#334155]">
                      <tr>
                        <th className="p-3">CSI Division Scope</th>
                        <th className="p-3">Scope Description</th>
                        <th className="p-3 text-right">Quantity</th>
                        <th className="p-3 text-right">Unit Rate</th>
                        <th className="p-3 text-right">Total ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155] text-[#e2e8f0]">
                      {quote.lineItems.map((item) => (
                        <tr key={item.id} className="hover:bg-[#334155]/30">
                          <td className="p-3 font-semibold text-[#38bdf8]">{item.csiDivision}</td>
                          <td className="p-3 font-sans text-white">{item.description}</td>
                          <td className="p-3 text-right">
                            {item.quantity.toLocaleString()} {item.unit}
                          </td>
                          <td className="p-3 text-right">${item.unitCost.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-white">
                            ${item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotals calculation */}
                <div className="p-4 bg-[#0b1329] border-t border-[#334155] flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 font-mono text-xs">
                  <div className="text-[#94a3b8] font-sans">
                    Includes 99.8% takeoff accuracy guarantee &amp; dual senior auditor sign-off.
                  </div>
                  <div className="space-y-1 w-full sm:w-64 text-right">
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Subtotal:</span>
                      <span>${quote.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Overhead / Margin ({quote.markupPercent}%):</span>
                      <span>${((quote.subtotal * quote.markupPercent) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[#94a3b8]">
                      <span>Performance Bonding:</span>
                      <span>${quote.bondingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-[#334155]">
                      <span>Contract Total:</span>
                      <span className="text-[#4edea3]">
                        ${quote.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-[#94a3b8] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
                  <span>Bid Exact LLC Pre-Construction Services Agreement v4.2</span>
                </div>
                <button
                  onClick={() => setActiveStep('sign_and_pay')}
                  className="px-6 py-2.5 bg-[#4edea3] hover:bg-[#3ec490] text-[#0f172a] font-bold rounded-lg text-xs font-mono flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>Proceed to Sign &amp; Pay Deposit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeStep === 'sign_and_pay' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: E-Signature Agreement */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155] space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#334155] pb-3">
                    <FileCheck2 className="w-5 h-5 text-[#38bdf8]" />
                    <h3 className="text-sm font-bold text-white">
                      Electronic Sign-Off &amp; Agreement
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs font-sans">
                    <div>
                      <label className="block text-[11px] font-mono text-[#94a3b8] mb-1">
                        Authorized Signatory Full Name
                      </label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0b1329] border border-[#334155] rounded-lg text-white font-medium text-xs focus:outline-none focus:border-[#4edea3]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#94a3b8] mb-1">
                        Signatory Corporate Title
                      </label>
                      <input
                        type="text"
                        value={signerTitle}
                        onChange={(e) => setSignerTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0b1329] border border-[#334155] rounded-lg text-white font-medium text-xs focus:outline-none focus:border-[#4edea3]"
                      />
                    </div>

                    {/* Simulated Signature Pad */}
                    <div>
                      <label className="block text-[11px] font-mono text-[#94a3b8] mb-1">
                        Digital Signature Preview
                      </label>
                      <div className="p-3 rounded-lg bg-[#0b1329] border border-[#334155] flex items-center justify-between h-16">
                        <span className="font-serif italic text-lg text-[#38bdf8] select-none tracking-wide">
                          {signerName || 'Digital Signature Required'}
                        </span>
                        <div className="text-[10px] font-mono text-[#64748b] text-right">
                          <div>IP: 198.51.100.42</div>
                          <div>{new Date().toISOString().slice(0, 10)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={termsAgreed}
                          onChange={(e) => setTermsAgreed(e.target.checked)}
                          className="mt-0.5 rounded border-[#334155] text-[#4edea3] focus:ring-0"
                        />
                        <span className="text-[11px] text-[#94a3b8] leading-relaxed">
                          I acknowledge that I am an authorized representative of <strong className="text-white">{quote.client.company}</strong>. By checking this box, I accept Quote <span className="font-mono text-[#38bdf8]">#{quote.quoteNumber}</span> and agree that payment of the deposit authorizes instant kickoff and team resource allocation.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Stripe Payment Gateway */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-4 rounded-xl bg-[#1e293b] border border-[#334155] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#334155] pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#4edea3]" />
                      <h3 className="text-sm font-bold text-white">
                        Stripe Payment Gateway
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] text-[10px] font-mono font-bold">
                      INSTANT CLEARANCE
                    </span>
                  </div>

                  {/* Payment Method Switcher */}
                  <div className="flex rounded-lg bg-[#0b1329] p-1 border border-[#334155] font-mono text-xs">
                    <button
                      onClick={() => setPaymentTab('card')}
                      className={`flex-1 py-1.5 rounded text-center transition-colors cursor-pointer ${
                        paymentTab === 'card' ? 'bg-[#334155] text-white font-bold' : 'text-[#94a3b8]'
                      }`}
                    >
                      Credit Card (Instant)
                    </button>
                    <button
                      onClick={() => setPaymentTab('ach')}
                      className={`flex-1 py-1.5 rounded text-center transition-colors cursor-pointer ${
                        paymentTab === 'ach' ? 'bg-[#334155] text-white font-bold' : 'text-[#94a3b8]'
                      }`}
                    >
                      ACH Bank Transfer (Same Day)
                    </button>
                  </div>

                  {/* Card Simulator */}
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <label className="block text-[11px] text-[#94a3b8] mb-1">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0b1329] border border-[#334155] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#4edea3]"
                        />
                        <span className="absolute right-3 top-2 text-[10px] text-[#4edea3] font-bold">VISA</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#94a3b8] mb-1">Expires (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExp}
                          onChange={(e) => setCardExp(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0b1329] border border-[#334155] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#4edea3]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#94a3b8] mb-1">CVC Code</label>
                        <input
                          type="password"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0b1329] border border-[#334155] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#4edea3]"
                        />
                      </div>
                    </div>

                    {/* Deposit Amount Box */}
                    <div className="p-3 rounded-lg bg-[#0b1329] border border-[#4edea3]/30 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[#94a3b8] uppercase font-sans">
                          Mobilization Deposit Due Now
                        </div>
                        <div className="text-xl font-bold text-[#4edea3]">
                          ${quote.requiredDepositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-[#94a3b8]">
                        <div>25% Upfront</div>
                        <div>Balance Net-30</div>
                      </div>
                    </div>

                    <button
                      disabled={!termsAgreed || isProcessing}
                      onClick={handleProcessPayment}
                      className={`w-full py-3 rounded-lg font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                        termsAgreed && !isProcessing
                          ? 'bg-[#4edea3] hover:bg-[#3ec490] text-[#0f172a] active:scale-[0.99]'
                          : 'bg-[#334155] text-[#64748b] cursor-not-allowed'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />
                          <span>Contacting Stripe Gateway...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            Authorize &amp; Pay Deposit ($
                            {quote.requiredDepositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'success' && (
            <div className="space-y-6">
              {/* Success Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#132728] to-[#1e293b] border border-[#4edea3]/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#4edea3]/20 border border-[#4edea3] text-[#4edea3] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Payment Verified &amp; Project Instantly Activated!
                </h2>
                <p className="text-xs sm:text-sm text-[#94a3b8] max-w-xl mx-auto">
                  Your deposit of <strong className="text-[#4edea3]">${quote.requiredDepositAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> has been processed via Stripe. Project <code className="font-mono text-[#38bdf8]">#{activeProject?.projectCode || 'PRJ-2024-041'}</code> has transitioned to <strong className="text-white">Active Pre-Construction</strong>.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded bg-[#0b1329] text-[#4edea3] border border-[#4edea3]/30">
                    Stripe Txn: pi_3Pz7Q12eZvKYlo2...
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#0b1329] text-[#38bdf8] border border-[#38bdf8]/30">
                    Smart Resource: Assigned
                  </span>
                </div>
              </div>

              {/* Deliverables & Real-Time Milestones Section */}
              <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#334155] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-[#4edea3]" />
                      <span>Client Deliverables &amp; Secure Vault</span>
                    </h3>
                    <p className="text-xs text-[#94a3b8]">
                      Final takeoff spreadsheets, 3D BIM coordination sets, and quality audit sign-offs
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] text-[10px] font-mono font-bold">
                    PORTAL ACCESS ENABLED
                  </span>
                </div>

                {activeProject?.deliverables && activeProject.deliverables.length > 0 ? (
                  <div className="space-y-2">
                    {activeProject.deliverables.map((del) => (
                      <div
                        key={del.id}
                        className="p-3 rounded-lg bg-[#0b1329] border border-[#334155] flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-[#38bdf8]" />
                          <div>
                            <div className="font-bold text-white">{del.fileName}</div>
                            <div className="text-[10px] text-[#94a3b8]">{del.fileSize} &bull; Verified 0.04% Variance</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            alert(`Simulating secure download for: ${del.fileName}`);
                          }}
                          className="px-3 py-1 rounded bg-[#4edea3]/20 hover:bg-[#4edea3]/30 text-[#4edea3] font-bold border border-[#4edea3]/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-[#0b1329] border border-[#334155] text-center space-y-2">
                    <Clock className="w-6 h-6 text-[#38bdf8] mx-auto animate-pulse" />
                    <div className="text-xs font-bold text-white">Pre-Construction Takeoff in Active Execution</div>
                    <div className="text-[11px] text-[#94a3b8] max-w-md mx-auto">
                      Assigned estimators are currently compiling the quantity takeoff. As soon as the 4-point QA protocol is approved, your final packages will unlock here automatically.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#0b1329] border-t border-[#1e293b] px-6 py-3 flex items-center justify-between">
          <div className="text-xs text-[#94a3b8]">
            Questions? Contact Bid Exact Pre-Con Desk: <span className="text-white">estimating@bidexact.com</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-xs text-white font-medium border border-[#334155] cursor-pointer"
          >
            Close Client Portal
          </button>
        </div>
      </div>
    </div>
  );
};
