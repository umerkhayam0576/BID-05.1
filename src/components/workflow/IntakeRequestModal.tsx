import React, { useState } from 'react';
import {
  X,
  Mail,
  Globe,
  Paperclip,
  Calendar,
  Building2,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus
} from 'lucide-react';
import { IntakeRequestItem } from '../../types/workflow';

interface IntakeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  intakeItem?: IntakeRequestItem | null;
  onConvertToQuote: (item: IntakeRequestItem) => void;
  onCreateNewIntake: (newItem: IntakeRequestItem) => void;
}

export const IntakeRequestModal: React.FC<IntakeRequestModalProps> = ({
  isOpen,
  onClose,
  intakeItem,
  onConvertToQuote,
  onCreateNewIntake,
}) => {
  const [activeTab, setActiveTab] = useState<'inspect' | 'simulate_email' | 'client_portal_form'>(
    intakeItem ? 'inspect' : 'simulate_email'
  );

  // New Inbound Simulation State
  const [simSender, setSimSender] = useState('dave.miller@webcor.com');
  const [simCompany, setSimCompany] = useState('Webcor Builders');
  const [simSubject, setSimSubject] = useState('RFQ: Transbay Block 4 Concrete & MEP Takeoff');
  const [simBody, setSimBody] = useState(
    'Attached please find the Architectural and Structural package Rev 2. We need a comprehensive quantity takeoff for 28-story residential tower concrete core, post-tensioned slabs, and HVAC risers by next Friday.'
  );
  const [simUrgency, setSimUrgency] = useState<'critical' | 'high' | 'normal'>('high');

  if (!isOpen) return null;

  const handleSimulateInboundEmail = () => {
    const newIntake: IntakeRequestItem = {
      id: `INTAKE-2024-${Math.floor(110 + Math.random() * 890)}`,
      source: 'email_parsing',
      submittedAt: 'Just now',
      clientName: 'Dave Miller (Estimating Dir)',
      clientEmail: simSender,
      clientCompany: simCompany,
      clientPhone: '+1 (415) 398-5500',
      projectTitle: 'Transbay Block 4 Residential Tower',
      projectLocation: 'San Francisco, CA',
      scopeSummary: simBody,
      targetSubmittalDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
      estimatedBudgetRange: '$95,000 - $130,000 Fee',
      detectedCsiDivisions: ['Division 03 Concrete', 'Division 23 HVAC', 'Division 05 Metals'],
      attachments: [
        { fileName: 'Transbay_Block4_Structural_Rev2.dwg', fileSize: '64.2 MB', fileType: 'dwg' },
        { fileName: 'Project_Manual_Specifications_Vol1.pdf', fileSize: '18.7 MB', fileType: 'pdf' },
      ],
      rawEmailMetadata: {
        from: `Dave Miller <${simSender}>`,
        subject: simSubject,
        receivedTimestamp: new Date().toISOString(),
        dkimValid: true,
        spfPass: true,
      },
      status: 'pending_review',
      urgency: simUrgency,
    };

    onCreateNewIntake(newIntake);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#dae2fd]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6]">
              <Mail className="w-5 h-5 text-[#adc6ff]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Quote Intake &amp; Request Visibility
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#3b82f6]/20 text-[#adc6ff] text-[10px] font-mono font-semibold">
                  NLP Ingestion Engine
                </span>
              </div>
              <p className="text-xs text-[#86948a]">
                Multi-channel intake ingestion via email parser webhook and client web portal
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

        {/* Tab switcher */}
        <div className="px-5 py-2.5 bg-[#0e1628] border-b border-[#222a3d] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            {intakeItem && (
              <button
                onClick={() => setActiveTab('inspect')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'inspect'
                    ? 'bg-[#3b82f6]/20 text-[#adc6ff] font-bold border border-[#3b82f6]/40'
                    : 'text-[#86948a] hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Inspect Request #{intakeItem.id}</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('simulate_email')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'simulate_email'
                  ? 'bg-[#3b82f6]/20 text-[#adc6ff] font-bold border border-[#3b82f6]/40'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Simulate Inbound Email RFQ</span>
            </button>
          </div>

          <div className="text-[#86948a] text-[11px] hidden sm:block">
            Auto-parses BIM, DWG &amp; PDF attachments
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#0b1326]">
          {activeTab === 'inspect' && intakeItem && (
            <div className="space-y-5">
              {/* Header Box */}
              <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#adc6ff] mb-1">
                    <span>{intakeItem.source === 'email_parsing' ? 'EMAIL PARSING WEBHOOK' : 'WEB CLIENT PORTAL'}</span>
                    <span>&bull;</span>
                    <span>Received: {intakeItem.submittedAt}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{intakeItem.projectTitle}</h3>
                  <div className="text-xs text-[#86948a] flex items-center gap-2 mt-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{intakeItem.clientCompany}</span>
                    <span>&bull;</span>
                    <span>{intakeItem.clientName} ({intakeItem.clientEmail})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                      intakeItem.urgency === 'critical'
                        ? 'bg-[#ff7886]/20 text-[#ff7886] border border-[#ff7886]/30'
                        : 'bg-[#ffb356]/20 text-[#ffb356] border border-[#ffb356]/30'
                    }`}
                  >
                    Urgency: {intakeItem.urgency}
                  </span>
                </div>
              </div>

              {/* Scope & CSI Detection */}
              <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold">
                  Scope Narrative &amp; Detected CSI Divisions
                </div>
                <p className="text-xs sm:text-sm text-[#dae2fd] leading-relaxed">
                  {intakeItem.scopeSummary}
                </p>

                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-[#86948a]">AI Classifier Tags:</span>
                  {intakeItem.detectedCsiDivisions.map((csi) => (
                    <span
                      key={csi}
                      className="px-2.5 py-1 rounded bg-[#0b1326] border border-[#4edea3]/40 text-[#4edea3] text-xs font-mono font-medium"
                    >
                      {csi}
                    </span>
                  ))}
                </div>
              </div>

              {/* Attachments */}
              <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold">
                    Attached Drawings &amp; Specifications ({intakeItem.attachments.length})
                  </span>
                  <span className="text-[11px] font-mono text-[#4edea3]">SHA-256 Verified</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {intakeItem.attachments.map((att) => (
                    <div
                      key={att.fileName}
                      className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        <Paperclip className="w-4 h-4 text-[#adc6ff] flex-shrink-0" />
                        <span className="truncate text-white font-medium">{att.fileName}</span>
                      </div>
                      <span className="text-[#86948a] flex-shrink-0">{att.fileSize}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Email Verification Info */}
              {intakeItem.rawEmailMetadata && (
                <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] font-mono text-xs space-y-1">
                  <div className="text-[#86948a] uppercase text-[10px]">Email Authentication Headers</div>
                  <div className="text-[#adc6ff]">From: {intakeItem.rawEmailMetadata.from}</div>
                  <div className="text-[#bbcabf]">Subject: {intakeItem.rawEmailMetadata.subject}</div>
                  <div className="flex items-center gap-3 pt-1 text-[11px]">
                    <span className="text-[#4edea3] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> DKIM Validated
                    </span>
                    <span className="text-[#4edea3] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> SPF Pass
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'simulate_email' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-4 font-mono text-xs">
                <div className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold">
                  Inbound RFQ Email Simulation Form
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#86948a] mb-1">Sender Email</label>
                    <input
                      type="email"
                      value={simSender}
                      onChange={(e) => setSimSender(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#86948a] mb-1">GC Organization</label>
                    <input
                      type="text"
                      value={simCompany}
                      onChange={(e) => setSimCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#86948a] mb-1">Email Subject Line</label>
                  <input
                    type="text"
                    value={simSubject}
                    onChange={(e) => setSimSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-[#86948a] mb-1">Email Body Content</label>
                  <textarea
                    rows={4}
                    value={simBody}
                    onChange={(e) => setSimBody(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white font-sans text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#86948a] mb-1">Urgency Flag</label>
                    <select
                      value={simUrgency}
                      onChange={(e) => setSimUrgency(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white"
                    >
                      <option value="critical">Critical (48hr turnaround)</option>
                      <option value="high">High (7 days)</option>
                      <option value="normal">Normal (14 days)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateInboundEmail}
                  className="w-full py-2.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold font-mono text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Inbound Email through Parser Webhook</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
          <div className="text-xs text-[#86948a]">
            {intakeItem?.convertedQuoteId ? (
              <span className="text-[#4edea3] font-mono">
                Already converted to Quote #{intakeItem.convertedQuoteId}
              </span>
            ) : (
              <span>Ready for quotation drafting</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-[#171f33] hover:bg-[#222a3d] text-xs text-[#86948a] font-medium border border-[#2d3449] cursor-pointer"
            >
              Close
            </button>
            {intakeItem && !intakeItem.convertedQuoteId && (
              <button
                onClick={() => {
                  onConvertToQuote(intakeItem);
                  onClose();
                }}
                className="px-5 py-2 rounded bg-[#4edea3] hover:bg-[#3ec490] text-[#0b1326] font-bold text-xs font-mono flex items-center gap-2 cursor-pointer shadow-lg transition-all active:scale-[0.98]"
              >
                <span>Convert to Quotation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
