import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Download,
  Lock,
  FileCheck2,
  FileText,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  CheckCircle2,
  FileQuestion,
  Search,
  Filter,
  Send,
  Plus,
  ArrowRight,
  RefreshCw,
  Sparkles,
  UserCheck,
  Paperclip,
  Check,
  Eye,
  AlertTriangle,
  LogOut,
  FolderDown,
  Mail,
  Phone,
  Shield,
  FileSpreadsheet,
  FolderArchive,
  Upload
} from 'lucide-react';
import { RfiItem, RfiStatus, BidItem, ClientItem } from '../../types';
import { INITIAL_PROJECT_TRACKS, INITIAL_ARCHIVED_DELIVERABLES } from '../../data/projectTrackingData';
import { INITIAL_PROJECTS, INITIAL_QUOTES } from '../../data/workflowData';
import { INITIAL_CLIENTS } from '../../data/initialData';
import { DocumentManagementSection } from './DocumentManagementSection';

interface ClientPortalViewProps {
  rfis: RfiItem[];
  bids?: BidItem[];
  clients?: ClientItem[];
  onUpdateRfiStatus?: (rfiId: string, newStatus: RfiStatus, note?: string) => void;
  onCreateRfi?: (newRfi: RfiItem) => void;
  onExitPortal?: () => void;
}

// Client Portal Deliverable Package Definition
interface PortalDeliverable {
  id: string;
  projectId: string;
  projectTitle: string;
  fileName: string;
  fileSize: string;
  fileType: 'xlsx' | 'pdf' | 'ifc' | 'zip';
  category: 'Quantity Takeoff' | 'BIM & Clash Report' | 'Accuracy Certificate' | 'Bid Summary';
  releasedDate: string;
  sha256Hash: string;
  isUnlocked: boolean;
  auditorSignoff: string;
  downloadCount: number;
  description: string;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  rfis,
  bids = [],
  clients = INITIAL_CLIENTS,
  onUpdateRfiStatus,
  onCreateRfi,
  onExitPortal,
}) => {
  // Available client profiles for external switching/preview
  const availableClients = clients.length > 0 ? clients : INITIAL_CLIENTS;

  // Selected Client Session State
  const [selectedClientId, setSelectedClientId] = useState<string>(availableClients[0]?.id || 'client-1');
  const activeClient = availableClients.find((c) => c.id === selectedClientId) || availableClients[0];

  // Active Navigation Sub-tab
  const [activeTab, setActiveTab] = useState<'projects' | 'rfis' | 'deliverables' | 'contracts' | 'documents' | 'quote' | 'hiring' | 'tasks' | 'pricing' | 'notifications' | 'people' | 'messages' | 'execution' | 'finance'>('projects');
  const [clientUploads, setClientUploads] = useState<string[]>([]);
  const [hiringSubmitted, setHiringSubmitted] = useState(false);
  const [companyPeople, setCompanyPeople] = useState([{ name: 'Maya Chen', role: 'Project manager', source: 'Our team', status: 'Active' }, { name: 'Luis Rivera', role: 'Estimator', source: 'Our team', status: 'Active' }, { name: 'Jordan Blake', role: 'Site coordinator', source: 'Your employee', status: 'Invited' }]);
  const [teamRequests, setTeamRequests] = useState<string[]>([]);
  const [portalMessages, setPortalMessages] = useState([{ from: 'Maya Chen', text: 'The takeoff package is ready for your review.', time: '10 min ago' }, { from: 'You', text: 'Please prioritize the foundation scope.', time: '28 min ago' }]);
  const [messageDraft, setMessageDraft] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('Maya Chen');
  const [companyTasks, setCompanyTasks] = useState([{ title: 'Review foundation scope', assignee: 'Maya Chen', status: 'In progress' }, { title: 'Confirm material allowances', assignee: 'Jordan Blake', status: 'To do' }]);
  const [employeeInvite, setEmployeeInvite] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [quoteApproved, setQuoteApproved] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<'Smart assigned' | 'Manual assigned' | 'Outsourced'>('Smart assigned');
  const [demoMode, setDemoMode] = useState(true);
  const resetDemoScenario = () => { setQuoteMessage(''); setQuoteSubmitted(false); setQuoteApproved(false); setTeamRequests([]); setCompanyTasks([{ title: 'Review foundation scope', assignee: 'Maya Chen', status: 'In progress' }, { title: 'Confirm material allowances', assignee: 'Jordan Blake', status: 'To do' }]); setPortalMessages([{ from: 'Maya Chen', text: 'The takeoff package is ready for your review.', time: '10 min ago' }, { from: 'You', text: 'Please prioritize the foundation scope.', time: '28 min ago' }]); setActiveTab('projects'); };
  const [clientPriceList, setClientPriceList] = useState([{ code: 'CL-MAT-001', name: 'Client concrete allowance', unit: 'CY', price: 172.5 }, { code: 'CL-MAT-002', name: 'Client rebar allowance', unit: 'LB', price: 0.86 }]);
  const [selectedEstimateMaterials, setSelectedEstimateMaterials] = useState<string[]>([]);

  // RFI Filter & Search State
  const [rfiSearchQuery, setRfiSearchQuery] = useState('');
  const [rfiStatusFilter, setRfiStatusFilter] = useState<'ALL' | RfiStatus>('ALL');
  const [selectedRfiForDetail, setSelectedRfiForDetail] = useState<RfiItem | null>(null);
  const [clientResponseText, setClientResponseText] = useState('');
  const [responseSuccessMessage, setResponseSuccessMessage] = useState('');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');

  const startStripeCheckout = async () => {
    setStripeLoading(true);
    setStripeError('');
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 2058175,
          description: 'QTE-2024-041 mobilization deposit',
          referenceId: 'QTE-2024-041-deposit',
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || 'Unable to start Stripe Checkout');
      window.location.href = result.url;
    } catch (error) {
      setStripeError(error instanceof Error ? error.message : 'Unable to start Stripe Checkout');
      setStripeLoading(false);
    }
  };

  // New RFI Modal State for External Client
  const [isNewRfiModalOpen, setIsNewRfiModalOpen] = useState(false);
  const [newRfiTitle, setNewRfiTitle] = useState('');
  const [newRfiProject, setNewRfiProject] = useState('');
  const [newRfiDivision, setNewRfiDivision] = useState('03 20 00 Concrete Reinforcing');
  const [newRfiPriority, setNewRfiPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [newRfiQuery, setNewRfiQuery] = useState('');
  const [newRfiAttachment, setNewRfiAttachment] = useState<string | null>(null);

  // Deliverables Download Toast Feedback
  const [downloadToast, setDownloadToast] = useState<{ fileName: string; hash: string } | null>(null);

  // Authenticated Token & Session simulation
  const [sessionToken] = useState('bx_tok_' + Math.random().toString(36).substring(2, 10));

  // Filter projects matching this client
  const clientProjects = useMemo(() => {
    return INITIAL_PROJECT_TRACKS.filter((p) =>
      p.gc.toLowerCase().includes(activeClient.name.toLowerCase()) ||
      activeClient.name.toLowerCase().includes(p.gc.toLowerCase())
    );
  }, [activeClient]);

  // Fallback project list if specific matching yields empty
  const displayedProjects = clientProjects.length > 0 ? clientProjects : [
    {
      id: 'BID-2024-884',
      title: `${activeClient.name} Regional Headquarters - Core & Shell`,
      gc: activeClient.name,
      scopeType: 'Commercial High-Rise Takeoff',
      status: 'ACTIVE_TAKEOFF' as const,
      statusLabel: 'Active Takeoff',
      estimateValue: 485000,
      completionPace: 92,
      targetDue: 'Tomorrow, 5:00 PM',
      daysRemaining: 1,
      budgetedHours: 160,
      paceStatus: 'On Track',
      paceStatusType: 'success' as const,
      milestones: [
        { id: 'm1', title: 'Perimeter Wall & Grade Beams', status: 'complete' as const },
        { id: 'm2', title: 'Rebar Reinforcing Schedule', status: 'complete' as const },
        { id: 'm3', title: 'QA Peer Verification & Sign-off', status: 'in_progress' as const },
      ],
      leadEstimators: [
        { name: 'Marcus Vance', initials: 'MV' },
        { name: 'Umer Farooq', initials: 'UF' }
      ],
      leadRole: 'Lead Estimator & Quality Reviewer',
      actionType: 'inspect' as const,
      actionLabel: 'Inspect',
      qtoSpecs: ['Division 03 Concrete', 'Division 05 Metals', 'Foundation QTO'],
    }
  ];

  // Filter RFIs matching this client
  const clientRfis = useMemo(() => {
    return rfis.filter((rfi) => {
      const matchClient =
        rfi.client.toLowerCase().includes(activeClient.name.toLowerCase()) ||
        activeClient.name.toLowerCase().includes(rfi.client.toLowerCase());
      return matchClient;
    });
  }, [rfis, activeClient]);

  // Fallback to all RFIs if none match specifically, but tag with active client
  const displayedRfis = useMemo(() => {
    const baseList = clientRfis.length > 0 ? clientRfis : rfis.slice(0, 4).map(r => ({ ...r, client: activeClient.name }));
    return baseList.filter((rfi) => {
      const matchFilter = rfiStatusFilter === 'ALL' || rfi.status === rfiStatusFilter;
      const matchSearch =
        rfi.title.toLowerCase().includes(rfiSearchQuery.toLowerCase()) ||
        rfi.id.toLowerCase().includes(rfiSearchQuery.toLowerCase()) ||
        (rfi.csiDivision && rfi.csiDivision.toLowerCase().includes(rfiSearchQuery.toLowerCase()));
      return matchFilter && matchSearch;
    });
  }, [clientRfis, rfis, activeClient, rfiStatusFilter, rfiSearchQuery]);

  // Client Deliverables Vault list
  const deliverablesList: PortalDeliverable[] = useMemo(() => {
    return [
      {
        id: 'del-01',
        projectId: displayedProjects[0]?.id || 'BID-2024-884',
        projectTitle: displayedProjects[0]?.title || 'Metro Heights Tower',
        fileName: `${activeClient.name.replace(/\s+/g, '_')}_Final_Takeoff_Master.xlsx`,
        fileSize: '34.8 MB',
        fileType: 'xlsx',
        category: 'Quantity Takeoff',
        releasedDate: 'Verified 2h ago',
        sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        isUnlocked: true,
        auditorSignoff: 'Marcus Vance (Senior Auditor)',
        downloadCount: 3,
        description: 'Complete dual-takeoff spreadsheet with itemized CSI divisions 03, 05, and 26 schedule quantities.',
      },
      {
        id: 'del-02',
        projectId: displayedProjects[0]?.id || 'BID-2024-884',
        projectTitle: displayedProjects[0]?.title || 'Metro Heights Tower',
        fileName: `BidExact_10k_Accuracy_Guarantee_Certificate.pdf`,
        fileSize: '2.4 MB',
        fileType: 'pdf',
        category: 'Accuracy Certificate',
        releasedDate: 'Verified Yesterday',
        sha256Hash: 'a7c93e4492da6f149bfbf4c8996fb92427ae41e4649b934ca495991b78521199',
        isUnlocked: true,
        auditorSignoff: 'Syed Ahmed (Partner)',
        downloadCount: 2,
        description: 'Legal bond warranty: Zero variance guarantee coverage up to $10,000 for any QTO variance > 0.5%.',
      },
      {
        id: 'del-03',
        projectId: displayedProjects[0]?.id || 'BID-2024-884',
        projectTitle: displayedProjects[0]?.title || 'Metro Heights Tower',
        fileName: `BIM_LOD350_Clash_Detection_Audit_Summary.pdf`,
        fileSize: '19.1 MB',
        fileType: 'pdf',
        category: 'BIM & Clash Report',
        releasedDate: 'Verified Sep 18, 2024',
        sha256Hash: 'b5f2c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c001',
        isUnlocked: true,
        auditorSignoff: 'Elena Rostova (BIM Lead)',
        downloadCount: 1,
        description: 'Navisworks clash resolution audit showing zero unresolved structural-to-plenum MEP conflicts.',
      },
      {
        id: 'del-04',
        projectId: displayedProjects[1]?.id || 'BID-2024-912',
        projectTitle: displayedProjects[1]?.title || 'St. Jude Medical Center Expansion',
        fileName: `Preliminary_Foundation_Takeoff_Draft.xlsx`,
        fileSize: '14.2 MB',
        fileType: 'xlsx',
        category: 'Quantity Takeoff',
        releasedDate: 'In Progress (Milestone 2)',
        sha256Hash: 'c4e1a44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852e902',
        isUnlocked: false, // Locked until QA sign-off
        auditorSignoff: 'Pending Senior Auditor Sign-Off',
        downloadCount: 0,
        description: 'Foundation and earthwork quantities. Package automatically unlocks upon completion of Milestone 3 QA audit.',
      },
    ];
  }, [displayedProjects, activeClient]);

  // Handle client simulated download with real text file trigger
  const handleDownloadDeliverable = (deliverable: PortalDeliverable) => {
    if (!deliverable.isUnlocked) return;

    // Create simulated file content
    const content = `==================================================================
BID EXACT LLC - VERIFIED PROJECT DELIVERABLE PACKAGE
==================================================================
File Name: ${deliverable.fileName}
File Type: ${deliverable.fileType.toUpperCase()}
Category: ${deliverable.category}
Authorized Client: ${activeClient.name}
Authorized Representative: ${activeClient.contact?.name || 'Executive PM'}
Project: ${deliverable.projectTitle} (${deliverable.projectId})
Audit Verification: ${deliverable.auditorSignoff}
Released Date: ${deliverable.releasedDate}
SHA-256 Checksum: ${deliverable.sha256Hash}
Accuracy Guarantee: $10,000 Bonded Guarantee / Max 0.5% Variance
==================================================================
Package Verification Status: PASSED ALL DUAL AUDIT CRITERIA
This document certifies that all quantities were calculated using dual-takeoff
methodology and audited by Bid Exact Senior Estimators.
==================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = deliverable.fileName.endsWith('.xlsx')
      ? deliverable.fileName.replace('.xlsx', '_Takeoff_Data.txt')
      : deliverable.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadToast({
      fileName: deliverable.fileName,
      hash: deliverable.sha256Hash.substring(0, 16) + '...',
    });

    setTimeout(() => {
      setDownloadToast(null);
    }, 4000);
  };

  // Handle Client Response to an RFI
  const handleSendClientResponse = (rfiId: string) => {
    if (!clientResponseText.trim()) return;

    if (onUpdateRfiStatus) {
      onUpdateRfiStatus(
        rfiId,
        'UNDER_REVIEW',
        `Client Clarification (${activeClient.contact?.name || 'Client PM'}): ${clientResponseText}`
      );
    }

    setResponseSuccessMessage('Your response has been transmitted directly to the Lead Estimator.');
    setClientResponseText('');
    setTimeout(() => {
      setResponseSuccessMessage('');
      setSelectedRfiForDetail(null);
    }, 1800);
  };

  // Handle Create New RFI by Client
  const handleClientSubmitNewRfi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRfiTitle.trim()) return;

    const newId = `RFI-2024-${Math.floor(100 + Math.random() * 900)}`;
    const newRfiItem: RfiItem = {
      id: newId,
      submittedTime: 'Just now (Client Portal)',
      title: newRfiTitle,
      description: newRfiQuery || 'Inquiry submitted through external client portal.',
      fullQuery: newRfiQuery,
      client: activeClient.name,
      project: newRfiProject || displayedProjects[0]?.title || 'Active Project',
      assignedLead: {
        name: 'Marcus Vance',
        initials: 'MV',
        role: 'Managing Principal & Senior Auditor',
        avatarColor: '#172554',
      },
      status: 'AWAITING_RESPONSE',
      statusLabel: 'AWAITING RESPONSE',
      priority: newRfiPriority,
      csiDivision: newRfiDivision,
      deltaCost: 0,
      deltaTonnage: 0,
      bimOverlayAvailable: true,
    };

    if (onCreateRfi) {
      onCreateRfi(newRfiItem);
    }

    setIsNewRfiModalOpen(false);
    setNewRfiTitle('');
    setNewRfiQuery('');
    setNewRfiAttachment(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Secure Client Portal Header & Session Isolation Banner */}
      <div className="bg-[#0f172a] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Trust & Isolation Banner */}
        <div className="bg-[#0b1329] border-b border-[#1e293b] px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#4edea3]/15 border border-[#4edea3]/30 text-[#4edea3] text-[10px] font-mono font-bold">
              <Lock className="w-3 h-3" />
              <span>ISOLATED CLIENT GATEWAY</span>
            </div>
            <span className="text-[11px] text-[#94a3b8] font-mono hidden md:inline">
              Single-Tenant Session: <code className="text-[#38bdf8]">{sessionToken}</code>
            </span>
            <span className="text-[11px] text-[#94a3b8] font-mono hidden lg:inline">
              &bull; 256-Bit SSL Encrypted
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#94a3b8]">Client Identity:</span>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-[#1e293b] border border-[#475569] text-xs font-semibold text-white rounded px-2.5 py-1 focus:outline-none focus:border-[#38bdf8] cursor-pointer"
              >
                {availableClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.contact?.name || 'GC Team'})
                  </option>
                ))}
              </select>
            </div>

            {onExitPortal && (
              <button
                onClick={onExitPortal}
                className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-[#334155] border border-[#475569] text-[#94a3b8] hover:text-white text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                title="Exit Client Portal and return to Internal ERP"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Return to Internal ERP</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary Client Welcome & Profile Row */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-[#0f172a] via-[#131b2e] to-[#0f172a]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0566d9] to-[#38bdf8] border border-[#38bdf8]/40 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {activeClient.initials || activeClient.name.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {activeClient.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-xs font-mono text-[#38bdf8] font-semibold">
                    {activeClient.agreementTier || 'MASTER PRE-CON AGREEMENT'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#94a3b8] mt-1 flex-wrap font-sans">
                  <span>
                    Authorized Lead: <strong className="text-white">{activeClient.contact?.name || 'Project Executive'}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>{activeClient.contact?.title || 'Pre-Construction Director'}</span>
                  <span>&bull;</span>
                  <span className="text-[#38bdf8]">{activeClient.contact?.email || 'estimating@client.com'}</span>
                </div>
              </div>
            </div>

            {/* Accuracy Guarantee Shield Callout */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1e293b]/60 border border-[#334155] max-w-sm">
              <div className="w-10 h-10 rounded-lg bg-[#4edea3]/15 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>$10,000 Accuracy Guarantee</span>
                  <span className="text-[10px] px-1 bg-[#4edea3]/20 text-[#4edea3] rounded font-mono">ACTIVE</span>
                </div>
                <div className="text-[11px] text-[#94a3b8] leading-tight mt-0.5">
                  Max 0.5% variance tolerance. 100% bonded liability protection on all verified takeoffs.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar for the Client */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#1e293b]">
            <div className="p-3 rounded-xl bg-[#0b1329] border border-[#1e293b]">
              <div className="text-[10px] font-mono text-[#94a3b8] uppercase flex items-center justify-between">
                <span>Active Pre-Con Projects</span>
                <Building2 className="w-3.5 h-3.5 text-[#38bdf8]" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
                {displayedProjects.length} Active
              </div>
              <div className="text-[10px] text-[#4edea3] font-mono mt-0.5 flex items-center gap-1">
                <Check className="w-3 h-3" /> Pacing on Schedule
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0b1329] border border-[#1e293b]">
              <div className="text-[10px] font-mono text-[#94a3b8] uppercase flex items-center justify-between">
                <span>Open Project RFIs</span>
                <FileQuestion className="w-3.5 h-3.5 text-[#e0b44a]" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
                {displayedRfis.filter((r) => r.status !== 'RESOLVED').length} Open
              </div>
              <div className="text-[10px] text-[#e0b44a] font-mono mt-0.5">
                {displayedRfis.filter((r) => r.status === 'AWAITING_RESPONSE').length} Awaiting Response
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0b1329] border border-[#1e293b]">
              <div className="text-[10px] font-mono text-[#94a3b8] uppercase flex items-center justify-between">
                <span>Verified Deliverables</span>
                <Download className="w-3.5 h-3.5 text-[#4edea3]" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-[#4edea3] mt-1">
                {deliverablesList.filter((d) => d.isUnlocked).length} Packages
              </div>
              <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">
                Unlocked in Vault
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0b1329] border border-[#1e293b]">
              <div className="text-[10px] font-mono text-[#94a3b8] uppercase flex items-center justify-between">
                <span>Total Scope Tracked</span>
                <DollarSign className="w-3.5 h-3.5 text-[#38bdf8]" />
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
                ${(activeClient.lifetimeValue || 1280000).toLocaleString()}
              </div>
              <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">
                Master Submittal Volume
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Feedback Toast */}
      {downloadToast && (
        <div className="p-3.5 rounded-xl bg-[#132728] border border-[#4edea3]/50 text-[#4edea3] text-xs font-mono flex items-center justify-between shadow-xl animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#4edea3] flex-shrink-0" />
            <div>
              <span className="font-bold text-white">Downloaded Package:</span>{' '}
              <span>{downloadToast.fileName}</span>
              <span className="text-[10px] text-[#94a3b8] ml-2 font-mono">
                [SHA-256: {downloadToast.hash}]
              </span>
            </div>
          </div>
          <span className="text-[11px] text-[#4edea3] font-bold">100% VERIFIED</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)] items-start">
        <aside className="sticky top-4 rounded-2xl border border-[#222a3d] bg-[#0d1728] p-2 shadow-xl">
          <div className="flex items-center justify-between gap-2 px-3 py-2"><div className="text-[10px] font-mono uppercase tracking-wider text-[#86948a]">Client workspace</div><span className="rounded-full bg-[#e0b44a]/15 px-2 py-0.5 text-[9px] font-bold text-[#e0b44a]">Demo mode</span></div>
          <button type="button" onClick={() => { setDemoMode((enabled) => !enabled); resetDemoScenario(); }} className="mx-2 mb-2 w-[calc(100%-1rem)] rounded-lg border border-[#2b3851] px-3 py-2 text-left text-[10px] font-semibold text-[#94a3b8] hover:border-[#38bdf8] hover:text-white">{demoMode ? 'Reset demo scenario' : 'Start demo scenario'}</button>
          <div className="space-y-1">
            {[['projects','Overview',Building2],['execution','Project execution',Layers],['tasks','Tasks',CheckCircle2],['people','People',UserCheck],['messages','Messages',Mail],['quote','New quotation',Upload],['pricing','Estimate pricing',DollarSign],['finance','Finance & allocation',FileSpreadsheet],['rfis','RFIs & responses',FileQuestion],['deliverables','Delivered files',FolderDown],['hiring','Hire approved team',UserCheck],['contracts','Contracts & invoices',FileText],['documents','Documents',FolderArchive],['notifications','Notifications',AlertCircle]].map(([tab,label,Icon]) => <button key={tab as string} type="button" onClick={() => setActiveTab(tab as typeof activeTab)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${activeTab === tab ? 'bg-[#38bdf8] font-bold text-[#0b1326]' : 'text-[#94a3b8] hover:bg-[#131b2e] hover:text-white'}`}><Icon className="h-3.5 w-3.5" /><span>{label as string}</span>{tab === 'notifications' && <span className="ml-auto rounded-full bg-[#e0b44a] px-1.5 text-[9px] font-bold text-[#0b1326]">3</span>}</button>)}
          </div>
        </aside>
        <div className="min-w-0">
        <div className="hidden">
        <div className="flex items-center gap-1.5 p-1 bg-[#131b2e] border border-[#222a3d] rounded-xl font-mono text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-[#38bdf8] text-[#0b1326] font-bold shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Project Status ({displayedProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rfis')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'rfis'
                ? 'bg-[#38bdf8] text-[#0b1326] font-bold shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>2. Open Assigned RFIs ({displayedRfis.length})</span>
            {displayedRfis.filter((r) => r.status === 'AWAITING_RESPONSE').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#ffb356] text-[#0b1326] text-[10px] font-bold">
                {displayedRfis.filter((r) => r.status === 'AWAITING_RESPONSE').length} Action
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('deliverables')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'deliverables'
                ? 'bg-[#38bdf8] text-[#0b1326] font-bold shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <FolderDown className="w-3.5 h-3.5" />
            <span>3. Deliverables Vault ({deliverablesList.filter((d) => d.isUnlocked).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'contracts'
                ? 'bg-[#38bdf8] text-[#0b1326] font-bold shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>4. Contracts &amp; Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-[#38bdf8] text-[#0b1326] font-bold shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>5. Document Management</span>
            <span className="font-mono text-[9px] px-1.5 py-0.2 bg-[#38bdf8]/20 text-[#38bdf8] rounded font-bold border border-[#38bdf8]/30">
              SERVICE
            </span>
          </button>
        </div>

        {/* Action Button for External Client */}
        {activeTab === 'rfis' && (
          <button
            onClick={() => setIsNewRfiModalOpen(true)}
            className="h-9 px-3.5 rounded-lg bg-[#4edea3] hover:bg-[#3ec490] text-[#0b1326] font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit New RFI / Clarification</span>
          </button>
        )}

        {activeTab === 'documents' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#4edea3] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Mock File Service Online</span>
            </span>
          </div>
        )}
      </div>

      {activeTab === 'execution' && <section className="rounded-2xl border border-[#222a3d] bg-[#0d1728] p-5"><div className="flex items-start justify-between"><div><h2 className="text-base font-bold text-white">Project execution</h2><p className="mt-1 text-xs text-[#94a3b8]">One calm view of what is moving, what needs you, and what is delivered.</p></div><span className="rounded-full bg-[#4edea3]/15 px-2.5 py-1 text-[10px] font-bold text-[#4edea3]">{quoteApproved ? 'Active project' : 'On track'}</span></div>{quoteApproved && <div className="mt-4 rounded-xl border border-[#38bdf8]/30 bg-[#0b1d31] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold text-white">Riverside Office Fitout</p><p className="mt-1 text-[10px] text-[#94a3b8]">Added to Active Project Catalog · $248,000 allocated</p></div><label className="text-[10px] text-[#94a3b8]">Assignment mode<select value={assignmentMode} onChange={(event) => setAssignmentMode(event.target.value as typeof assignmentMode)} className="ml-2 rounded-lg border border-[#2b3851] bg-[#131b2e] px-2 py-1.5 text-[10px] text-white"><option>Smart assigned</option><option>Manual assigned</option><option>Outsourced</option></select></label></div><div className="mt-3 flex items-center gap-2 text-[10px] text-[#4edea3]"><Clock className="h-3.5 w-3.5" /> Employee timer starts when the assignment is accepted</div></div>}<div className="mt-5 grid gap-3 sm:grid-cols-3">{[['Design & scope','Complete','100%'],['Estimating','In progress','72%'],['Construction handoff','Next','24%']].map(([label,status,progress]) => <div key={label} className="rounded-xl border border-[#222a3d] bg-[#0b1329] p-4"><p className="text-xs font-semibold text-white">{label}</p><p className="mt-2 text-[10px] text-[#94a3b8]">{status}</p><div className="mt-3 h-1.5 rounded-full bg-[#1d2940]"><div className="h-1.5 rounded-full bg-[#38bdf8]" style={{ width: progress }} /></div></div>)}</div></section>}

      {activeTab === 'people' && <section className="rounded-2xl border border-[#222a3d] bg-[#0d1728] p-5"><div className="flex items-start justify-between"><div><h2 className="text-base font-bold text-white">Your company people</h2><p className="mt-1 text-xs text-[#94a3b8]">Run your approved team and your own employees together.</p></div><span className="text-xs text-[#4edea3]">{companyPeople.length} people</span></div><div className="mt-4 space-y-2">{companyPeople.map((person) => <div key={person.name} className="flex items-center justify-between rounded-xl border border-[#222a3d] bg-[#0b1329] p-3"><div><p className="text-xs font-semibold text-white">{person.name}</p><p className="mt-1 text-[10px] text-[#94a3b8]">{person.role} · {person.source}</p></div><span className="rounded-full bg-[#4edea3]/15 px-2 py-1 text-[10px] text-[#4edea3]">{person.status}</span></div>)}</div><div className="mt-4 flex gap-2"><input value={employeeInvite} onChange={(event) => setEmployeeInvite(event.target.value)} placeholder="employee@yourcompany.com" className="min-w-0 flex-1 rounded-lg border border-[#2b3851] bg-[#131b2e] px-3 py-2 text-xs text-white placeholder:text-[#64748b]" /><button type="button" onClick={() => { if (!employeeInvite.trim()) return; setCompanyPeople((people) => [...people, { name: employeeInvite.split('@')[0], role: 'Company employee', source: 'Your employee', status: 'Invited' }]); setInviteMessage('Invite sent'); setEmployeeInvite(''); }} className="rounded-lg bg-[#38bdf8] px-3 py-2 text-xs font-bold text-[#0b1326]">Invite</button></div>{inviteMessage && <p className="mt-2 text-[10px] text-[#4edea3]">{inviteMessage}</p>}</section>}

      {activeTab === 'messages' && <section className="rounded-2xl border border-[#222a3d] bg-[#0d1728] p-5"><h2 className="text-base font-bold text-white">Project messages</h2><p className="mt-1 text-xs text-[#94a3b8]">Keep decisions with the project so your team always has context.</p><div className="mt-4 space-y-2">{portalMessages.map((message, index) => <div key={`${message.from}-${index}`} className={`max-w-[85%] rounded-xl border border-[#222a3d] p-3 ${message.from === 'You' ? 'ml-auto bg-[#133044]' : 'bg-[#0b1329]'}`}><p className="text-[10px] font-bold text-[#38bdf8]">{message.from}<span className="ml-2 font-normal text-[#64748b]">{message.time}</span></p><p className="mt-1 text-xs text-white">{message.text}</p></div>)}</div><div className="mt-4 flex gap-2"><input value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229 && messageDraft.trim()) { setPortalMessages((messages) => [...messages, { from: 'You', text: messageDraft.trim(), time: 'Just now' }]); setMessageDraft(''); } }} placeholder="Write a project update..." className="min-w-0 flex-1 rounded-lg border border-[#2b3851] bg-[#131b2e] px-3 py-2 text-xs text-white placeholder:text-[#64748b]" /><button type="button" onClick={() => { if (!messageDraft.trim()) return; setPortalMessages((messages) => [...messages, { from: 'You', text: messageDraft.trim(), time: 'Just now' }]); setMessageDraft(''); }} className="rounded-lg bg-[#4edea3] px-3 py-2 text-xs font-bold text-[#0b1326]">Send</button></div></section>}

      {activeTab === 'finance' && <section className="rounded-2xl border border-[#222a3d] bg-[#0d1728] p-5"><h2 className="text-base font-bold text-white">Finance & allocation</h2><p className="mt-1 text-xs text-[#94a3b8]">See the money picture without opening a finance system.</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{[['Approved budget','$248,000','bg-[#38bdf8]'],['Committed','$161,400','bg-[#4edea3]'],['Available','$86,600','bg-[#e0b44a]']].map(([label,value,color]) => <div key={label} className="rounded-xl border border-[#222a3d] bg-[#0b1329] p-4"><p className="text-[10px] text-[#94a3b8]">{label}</p><p className="mt-2 text-xl font-bold text-white">{value}</p><div className={`mt-3 h-1 rounded-full ${color}`} /></div>)}</div><div className="mt-4 rounded-xl border border-[#222a3d] bg-[#0b1329] p-4"><div className="flex justify-between text-xs"><span className="text-white">Estimating & preconstruction</span><span className="text-[#4edea3]">$42,800</span></div><div className="mt-3 flex justify-between text-xs"><span className="text-white">Materials allocation</span><span className="text-[#e0b44a]">$118,600</span></div><div className="mt-3 flex justify-between text-xs"><span className="text-white">Team services</span><span className="text-[#38bdf8]">$36,900</span></div></div></section>}

      {activeTab === 'hiring' && <section className="rounded-2xl border border-[#222a3d] bg-[#0d1728] p-5"><h2 className="text-base font-bold text-white">Hire approved team members</h2><p className="mt-1 text-xs text-[#94a3b8]">Choose who you need. We handle approval and onboarding so you stay in control.</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{[['Avery Stone','Senior estimator','$95/hr'],['Priya Nair','BIM coordinator','From $85/hr'],['Noah Williams','Project manager','From $110/hr']].map(([name,role,rate]) => <div key={name} className="rounded-xl border border-[#222a3d] bg-[#0b1329] p-4"><div className="flex items-center justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#38bdf8]/15 text-xs font-bold text-[#38bdf8]">{name.split(' ').map((part) => part[0]).join('')}</div><span className="text-[10px] text-[#4edea3]">Available</span></div><p className="mt-3 text-xs font-bold text-white">{name}</p><p className="mt-1 text-[10px] text-[#94a3b8]">{role}</p><p className="mt-3 font-mono text-[10px] text-[#e0b44a]">{rate}</p><button type="button" onClick={() => setTeamRequests((requests) => requests.includes(name) ? requests : [...requests, name])} className="mt-3 w-full rounded-lg bg-[#4edea3] px-3 py-2 text-[10px] font-bold text-[#0b1326]">{teamRequests.includes(name) ? 'Request sent' : 'Request this person'}</button></div>)}</div>{teamRequests.length > 0 && <p className="mt-3 text-xs text-[#4edea3]">{teamRequests.length} team request(s) sent. Your team lead will confirm next steps.</p>}</section>}

      {activeTab === 'tasks' && <section className="rounded-2xl border border-[#222a3d] bg-[#0d1728] p-5"><h2 className="text-base font-bold text-white">Tasks for your team</h2><p className="mt-1 text-xs text-[#94a3b8]">Assign work to our team or your own employees, then follow it in one place.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="What needs to be done?" className="min-w-0 flex-1 rounded-lg border border-[#2b3851] bg-[#131b2e] px-3 py-2 text-xs text-white placeholder:text-[#64748b]" /><select value={taskAssignee} onChange={(event) => setTaskAssignee(event.target.value)} className="rounded-lg border border-[#2b3851] bg-[#131b2e] px-3 py-2 text-xs text-white">{companyPeople.map((person) => <option key={person.name}>{person.name}</option>)}</select><button type="button" onClick={() => { if (!newTaskTitle.trim()) return; setCompanyTasks((tasks) => [...tasks, { title: newTaskTitle.trim(), assignee: taskAssignee, status: 'To do' }]); setNewTaskTitle(''); }} className="rounded-lg bg-[#4edea3] px-3 py-2 text-xs font-bold text-[#0b1326]">Assign task</button></div><div className="mt-4 space-y-2">{companyTasks.map((task, index) => <div key={`${task.title}-${index}`} className="flex items-center justify-between rounded-xl border border-[#222a3d] bg-[#0b1329] p-3"><div><p className="text-xs font-semibold text-white">{task.title}</p><p className="mt-1 text-[10px] text-[#94a3b8]">Assigned to {task.assignee} · {displayedProjects[0]?.title}</p></div><button type="button" onClick={() => setCompanyTasks((tasks) => tasks.map((item, itemIndex) => itemIndex === index ? { ...item, status: item.status === 'Done' ? 'To do' : 'Done' } : item))} className={`rounded-full px-2 py-1 text-[10px] font-bold ${task.status === 'Done' ? 'bg-[#4edea3]/15 text-[#4edea3]' : 'bg-[#e0b44a]/15 text-[#e0b44a]'}`}>{task.status}</button></div>)}</div></section>}

      {activeTab === 'quote' && <section className="space-y-4"><div className="rounded-2xl border border-[#222a3d] bg-[#0d1728] p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-white">Start a quotation</h2><p className="mt-1 text-xs text-[#94a3b8]">Tell us what you need. Admin gets an alert immediately and your request stays visible here.</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${quoteSubmitted ? 'bg-[#4edea3]/15 text-[#4edea3]' : 'bg-[#38bdf8]/15 text-[#38bdf8]'}`}>{quoteSubmitted ? 'Sent to admin' : 'Draft'}</span></div><textarea value={quoteMessage} onChange={(event) => setQuoteMessage(event.target.value)} placeholder="Describe your project, scope, location, deadline, or anything the estimating team should know..." className="mt-4 min-h-28 w-full rounded-xl border border-[#2b3851] bg-[#0b1329] p-3 text-xs text-white outline-none placeholder:text-[#64748b] focus:border-[#38bdf8]" /><label className="mt-3 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#38bdf8]/50 bg-[#0b1329] text-center"><Upload className="h-5 w-5 text-[#38bdf8]" /><span className="mt-1 text-xs font-semibold text-white">Attach plans and bid documents</span><input type="file" multiple className="sr-only" onChange={(event) => setClientUploads(Array.from(event.target.files ?? []).map((file) => file.name))} /></label>{clientUploads.length > 0 && <div className="mt-3 rounded-lg bg-[#132728] p-3 text-xs text-[#4edea3]">{clientUploads.length} file(s) attached: {clientUploads.join(', ')}</div>}<button type="button" disabled={!quoteMessage.trim() && !clientUploads.length} onClick={() => setQuoteSubmitted(true)} className="mt-4 rounded-lg bg-[#4edea3] px-4 py-2 text-xs font-bold text-[#07101f] disabled:cursor-not-allowed disabled:opacity-40">Send quotation request</button>{quoteSubmitted && <p className="mt-3 text-xs text-[#4edea3]">Admin notification sent. You will receive an email and portal update when your quote is ready.</p>}</div>{quoteSubmitted && <div className="rounded-2xl border border-[#e0b44a]/40 bg-[#211b0e] p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-wider text-[#e0b44a]">Quotation ready for approval</p><h3 className="mt-1 text-lg font-bold text-white">QTE-2026-184 · Riverside Office Fitout</h3></div><span className="rounded-full bg-[#e0b44a]/15 px-2 py-1 text-[10px] font-bold text-[#e0b44a]">Email sent</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div><p className="text-[10px] text-[#94a3b8]">Total project quote</p><p className="mt-1 text-xl font-bold text-white">$248,000</p></div><div><p className="text-[10px] text-[#94a3b8]">Valid until</p><p className="mt-1 text-sm font-semibold text-white">Oct 21, 2026</p></div><div><p className="text-[10px] text-[#94a3b8]">Approval</p><p className="mt-1 text-sm font-semibold text-[#e0b44a]">{quoteApproved ? 'Approved' : 'Waiting for you'}</p></div></div><button type="button" onClick={() => setQuoteApproved(true)} disabled={quoteApproved} className="mt-4 rounded-lg bg-[#e0b44a] px-4 py-2 text-xs font-bold text-[#15100a] disabled:opacity-60">{quoteApproved ? 'Approved — project activated' : 'Review and approve securely'}</button>{quoteApproved && <div className="mt-4 rounded-xl border border-[#4edea3]/30 bg-[#0b2725] p-3 text-xs text-[#4edea3]">Secure approval recorded. Project added to Active Project Catalog and finance allocation updated.</div>}</div>}</section>}

      {activeTab === 'pricing' && <section className="rounded-2xl border border-[#222a3d] bg-[#0d1728] p-5"><h2 className="text-base font-bold text-white">Client estimate pricing</h2><p className="mt-1 text-xs text-[#94a3b8]">These client-specific prices are visible to the estimating team and can be used in this project estimate.</p><div className="mt-4 space-y-2">{clientPriceList.map((item) => <div key={item.code} className="flex items-center justify-between rounded-xl border border-[#222a3d] bg-[#0b1329] p-3"><div><p className="text-xs font-semibold text-white">{item.name}</p><p className="mt-1 font-mono text-[10px] text-[#94a3b8]">{item.code} · {item.unit}</p></div><div className="flex items-center gap-3"><span className="font-mono text-sm text-[#4edea3]">${item.price.toFixed(2)}</span><button type="button" onClick={() => setSelectedEstimateMaterials((items) => items.includes(item.code) ? items : [...items, item.code])} className="rounded-lg bg-[#38bdf8] px-2.5 py-1.5 text-[10px] font-bold text-[#0b1326]">{selectedEstimateMaterials.includes(item.code) ? 'Added' : 'Add to estimate'}</button></div></div>)}</div><div className="mt-4 border-t border-[#222a3d] pt-3 text-xs text-[#94a3b8]">{selectedEstimateMaterials.length} client-priced material(s) selected for estimate</div></section>}

      {activeTab === 'notifications' && <section className="rounded-2xl border border-[#222a3d] bg-[#0d1728] p-5"><h2 className="text-base font-bold text-white">Notifications and responses</h2><div className="mt-4 space-y-2">{['Final takeoff package delivered and ready to download.', 'Team lead responded to RFI-1042.', 'New project task assigned for client price review.'].map((notice) => <div key={notice} className="rounded-xl border border-[#222a3d] bg-[#0b1329] p-3 text-xs text-white"><span className="mr-2 text-[#e0b44a]">●</span>{notice}<p className="mt-1 pl-4 text-[10px] text-[#94a3b8]">Just now · linked to your active project</p></div>)}</div></section>}

      {/* ========================================================================= */}
      {/* TAB 1: PROJECT STATUS & LIVE MILESTONE TRACKER */}
      {/* ========================================================================= */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Active Pre-Construction Packages</span>
              <span className="text-xs font-mono text-[#94a3b8] font-normal">
                (Real-time Takeoff &amp; Dual QA Peer Audit Status)
              </span>
            </h2>
            <span className="text-xs font-mono text-[#4edea3] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Live Sync with Bid Exact PM Engine
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {displayedProjects.map((project) => (
              <div
                key={project.id}
                className="p-5 rounded-xl bg-[#131b2e] border border-[#222a3d] hover:border-[#38bdf8]/40 transition-all space-y-4 shadow-lg"
              >
                {/* Project Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222a3d] pb-4">
                  <div>
                    <div className="flex items-center gap-2.5 font-mono text-xs mb-1">
                      <span className="px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-bold">
                        {project.id}
                      </span>
                      <span className="text-white font-medium">{project.scopeType}</span>
                      <span className="text-[#94a3b8]">&bull;</span>
                      <span className="text-[#4edea3]">Value: ${(project.estimateValue || 450000).toLocaleString()}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {project.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-3 py-1 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 font-bold uppercase flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>{project.statusLabel || 'ACTIVE TAKEOFF'}</span>
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Schedule Target */}
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-[#94a3b8] text-[11px]">
                    <span className="flex items-center gap-1.5 text-[#dae2fd]">
                      <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
                      <span>Takeoff Completion Pace: <strong>{project.completionPace}%</strong></span>
                    </span>
                    <span className="text-[#4edea3]">Target Delivery: {project.targetDue}</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#0b1326] rounded-full overflow-hidden border border-[#222a3d]">
                    <div
                      className="h-full bg-gradient-to-r from-[#0566d9] to-[#4edea3] transition-all duration-500 rounded-full"
                      style={{ width: `${project.completionPace}%` }}
                    />
                  </div>
                </div>

                {/* Milestones Flow */}
                <div className="p-3.5 rounded-lg bg-[#0b1326] border border-[#222a3d] space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#94a3b8] font-bold">
                    Milestone Progress &amp; Quality Gates
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                    {project.milestones.map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className={`p-2.5 rounded-lg border flex items-center justify-between ${
                          m.status === 'complete'
                            ? 'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]'
                            : m.status === 'in_progress'
                            ? 'bg-[#38bdf8]/10 border-[#38bdf8]/30 text-[#38bdf8]'
                            : 'bg-[#131b2e] border-[#222a3d] text-[#94a3b8]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {m.status === 'complete' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#4edea3]" />
                          ) : m.status === 'in_progress' ? (
                            <Clock className="w-4 h-4 text-[#38bdf8] animate-pulse" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-[#475569] flex items-center justify-center text-[9px]">
                              {idx + 1}
                            </div>
                          )}
                          <span className="font-semibold">{m.title}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold">
                          {m.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Scope Divisions & Assigned Bid Exact Leads */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#94a3b8]">Covered CSI Divisions:</span>
                    {(project.qtoSpecs || ['Division 03 Concrete', 'Division 05 Metals']).map((csi) => (
                      <span
                        key={csi}
                        className="px-2 py-0.5 rounded bg-[#0b1326] border border-[#222a3d] text-[#4edea3] text-[11px]"
                      >
                        {csi}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[#94a3b8]">Assigned Bid Exact Leads:</span>
                    <div className="flex items-center gap-1.5">
                      {project.leadEstimators.map((lead, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0b1326] border border-[#222a3d] text-[#dae2fd] text-[11px]"
                          title={lead.name}
                        >
                          <span className="w-4 h-4 rounded-full bg-[#0566d9] text-white text-[9px] flex items-center justify-center font-bold">
                            {lead.initials}
                          </span>
                          <span>{lead.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OPEN ASSIGNED RFIS & DIRECT CLIENT CLARIFICATION */}
      {/* ========================================================================= */}
      {activeTab === 'rfis' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Requests for Information (RFIs)</span>
                <span className="text-xs font-mono text-[#94a3b8] font-normal">
                  (Clarifications, Drawing Schedule Discrepancies, and Addenda)
                </span>
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              {(['ALL', 'AWAITING_RESPONSE', 'UNDER_REVIEW', 'DRAFT_READY', 'RESOLVED'] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setRfiStatusFilter(status)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      rfiStatusFilter === status
                        ? 'bg-[#38bdf8] text-[#0b1326] font-bold'
                        : 'bg-[#131b2e] border border-[#222a3d] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {status === 'ALL'
                      ? 'All'
                      : status === 'AWAITING_RESPONSE'
                      ? 'Needs Action'
                      : status.replace(/_/g, ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search RFIs by title, ID, or CSI Division..."
              value={rfiSearchQuery}
              onChange={(e) => setRfiSearchQuery(e.target.value)}
              className="w-full bg-[#131b2e] border border-[#222a3d] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#38bdf8]"
            />
          </div>

          {/* RFI Cards List */}
          <div className="grid grid-cols-1 gap-3">
            {displayedRfis.length === 0 ? (
              <div className="p-8 text-center bg-[#131b2e] border border-[#222a3d] rounded-xl text-[#94a3b8] font-mono text-xs">
                No RFIs matching the current filter.
              </div>
            ) : (
              displayedRfis.map((rfi) => {
                const isNeedsAction = rfi.status === 'AWAITING_RESPONSE';
                return (
                  <div
                    key={rfi.id}
                    className={`p-4 sm:p-5 rounded-xl border transition-all ${
                      isNeedsAction
                        ? 'bg-[#131b2e] border-[#e0b44a]/60 shadow-md'
                        : 'bg-[#131b2e] border-[#222a3d] hover:border-[#38bdf8]/40'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2.5 font-mono text-xs flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-[#0b1326] text-[#38bdf8] font-bold border border-[#222a3d]">
                            {rfi.id}
                          </span>
                          <span className="text-white font-medium">{rfi.project}</span>
                          <span className="text-[#94a3b8]">&bull;</span>
                          <span className="text-[#94a3b8]">{rfi.submittedTime}</span>
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                              rfi.priority === 'CRITICAL'
                                ? 'bg-[#ff7886]/20 text-[#ff7886]'
                                : 'bg-[#e0b44a]/20 text-[#e0b44a]'
                            }`}
                          >
                            {rfi.priority} PRIORITY
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-white">
                          {rfi.title}
                        </h3>

                        <p className="text-xs text-[#bbcabf] line-clamp-2">
                          {rfi.description}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-[#94a3b8] flex-wrap">
                          {rfi.csiDivision && (
                            <span className="text-[#4edea3] font-semibold">{rfi.csiDivision}</span>
                          )}
                          {rfi.deltaCost ? (
                            <>
                              <span>&bull;</span>
                              <span className="text-[#e0b44a]">
                                Cost Impact: +${rfi.deltaCost.toLocaleString()}
                              </span>
                            </>
                          ) : null}
                          {rfi.deltaTonnage ? (
                            <>
                              <span>&bull;</span>
                              <span className="text-[#38bdf8]">
                                Scope Impact: +{rfi.deltaTonnage} MT
                              </span>
                            </>
                          ) : null}
                          <span>&bull;</span>
                          <span>Assigned Lead: {rfi.assignedLead.name}</span>
                        </div>
                      </div>

                      {/* Right Action & Status Button */}
                      <div className="flex items-center gap-2 font-mono text-xs w-full md:w-auto justify-end">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                            rfi.status === 'RESOLVED'
                              ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30'
                              : rfi.status === 'AWAITING_RESPONSE'
                              ? 'bg-[#e0b44a]/20 text-[#e0b44a] border border-[#e0b44a]/40 animate-pulse'
                              : 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30'
                          }`}
                        >
                          {rfi.statusLabel || rfi.status.replace(/_/g, ' ')}
                        </span>

                        <button
                          onClick={() => {
                            setSelectedRfiForDetail(rfi);
                            setClientResponseText('');
                          }}
                          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isNeedsAction
                              ? 'bg-[#e0b44a] hover:bg-[#d4a339] text-[#0b1326]'
                              : 'bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155]'
                          }`}
                        >
                          <span>{isNeedsAction ? 'Provide Clarification' : 'View Query'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DELIVERABLES VAULT & DOWNLOAD CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'deliverables' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Verified Deliverables Vault</span>
                <span className="text-xs font-mono text-[#94a3b8] font-normal">
                  (Cryptographically Signed Quantity Takeoffs &amp; BIM Reports)
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Packages have passed the Bid Exact 4-point peer quality audit with $\le 0.5\%$ variance.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('documents')}
              className="px-3.5 py-1.5 rounded-lg bg-[#131b2e] hover:bg-[#1f283d] border border-[#38bdf8]/40 text-[#38bdf8] text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow transition-all"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Open Full Document Management &amp; Contract Uploader</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliverablesList.map((del) => (
              <div
                key={del.id}
                className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  del.isUnlocked
                    ? 'bg-[#131b2e] border-[#222a3d] hover:border-[#4edea3]/50 shadow-md'
                    : 'bg-[#131b2e]/60 border-[#222a3d] opacity-75'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#0b1326] text-[#38bdf8] font-bold border border-[#222a3d]">
                      {del.category}
                    </span>
                    <span className="text-[11px] text-[#94a3b8]">{del.releasedDate}</span>
                  </div>

                  <div className="flex items-start gap-3 pt-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      del.fileType === 'xlsx'
                        ? 'bg-[#107c41]/20 text-[#4edea3] border border-[#107c41]/40'
                        : 'bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/40'
                    }`}>
                      {del.fileType === 'xlsx' ? (
                        <FileSpreadsheet className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate" title={del.fileName}>
                        {del.fileName}
                      </h3>
                      <div className="text-[11px] font-mono text-[#94a3b8]">
                        Project: {del.projectTitle} &bull; {del.fileSize}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#bbcabf] font-sans">
                    {del.description}
                  </p>

                  <div className="p-2.5 rounded bg-[#0b1326] border border-[#222a3d] text-[10px] font-mono text-[#94a3b8] space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Peer Sign-off: <strong className="text-white">{del.auditorSignoff}</strong></span>
                      <span className="text-[#4edea3] font-bold">QA PASSED</span>
                    </div>
                    <div className="truncate text-[#64748b]">
                      SHA-256: {del.sha256Hash}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#222a3d] flex items-center justify-between">
                  <span className="text-xs font-mono text-[#94a3b8]">
                    {del.isUnlocked ? (
                      <span className="text-[#4edea3] flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Download
                      </span>
                    ) : (
                      <span className="text-[#e0b44a] flex items-center gap-1 font-bold">
                        <Lock className="w-3.5 h-3.5" /> Locked during Milestone 2
                      </span>
                    )}
                  </span>

                  {del.isUnlocked ? (
                    <button
                      onClick={() => handleDownloadDeliverable(del)}
                      className="px-4 py-2 rounded-lg bg-[#4edea3] hover:bg-[#3ec490] text-[#0b1326] font-bold font-mono text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-[0.98]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Package</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-3.5 py-2 rounded-lg bg-[#1e293b] text-[#64748b] font-mono text-xs cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Pending QA Audit</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONTRACTS, QUOTATIONS & MOBILIZATION DEPOSITS */}
      {/* ========================================================================= */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Contracts, Proposals &amp; Invoices</span>
              <span className="text-xs font-mono text-[#94a3b8] font-normal">
                (Client Billing &amp; Deposit Clearance Vault)
              </span>
            </h2>
            <button
              onClick={() => setActiveTab('documents')}
              className="px-3.5 py-1.5 rounded-lg bg-[#38bdf8] hover:bg-[#0284c7] text-[#0b1326] font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Signed Agreement PDF</span>
            </button>
          </div>

          <div className="p-5 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222a3d] pb-3">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] font-bold">
                    QTE-2024-041
                  </span>
                  <span className="text-white font-medium">Master Pre-Con Scope Agreement</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Full Architectural &amp; MEP Dual Quantity Takeoff Package
                </h3>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={startStripeCheckout}
                  disabled={stripeLoading}
                  className="px-3 py-1.5 rounded-lg bg-[#635bff] hover:bg-[#5148d8] disabled:opacity-60 text-white font-bold transition-colors"
                >
                  {stripeLoading ? 'Opening Stripe...' : 'Pay deposit with Stripe'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d]">
                <div className="text-[10px] text-[#94a3b8] uppercase">Contract Total</div>
                <div className="text-base font-bold text-white mt-0.5">$82,327.00 USD</div>
                <div className="text-[10px] text-[#94a3b8]">Net 30 Terms</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d]">
                <div className="text-[10px] text-[#94a3b8] uppercase">25% Mobilization Deposit</div>
                <div className="text-base font-bold text-[#4edea3] mt-0.5">$20,581.75 USD</div>
                <div className="text-[10px] text-[#4edea3]">Cleared via Stripe Direct</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d]">
                <div className="text-[10px] text-[#94a3b8] uppercase">Remaining Milestones Balance</div>
                <div className="text-base font-bold text-[#38bdf8] mt-0.5">$61,745.25 USD</div>
                <div className="text-[10px] text-[#94a3b8]">Billed Upon Final Delivery</div>
              </div>
            </div>

            {stripeError && <p className="text-xs text-red-300" role="alert">{stripeError}</p>}

            <div className="pt-2 flex items-center justify-between text-xs font-mono">
              <span className="text-[#94a3b8]">
                Stripe Receipt Ref: <code className="text-white">ch_3Pz7Q12eZvKYlo2C</code>
              </span>
              <button
                onClick={() => {
                  const receiptText = `RECEIPT FOR PAYMENT
Date: September 18, 2024
Payer: ${activeClient.name}
Amount: $20,581.75 USD
Status: Paid in Full (Mobilization Deposit)
Payment Method: Stripe Elements (Visa ending in 4242)
Transaction ID: pi_3Pz7Q12eZvKYlo2C`;
                  const blob = new Blob([receiptText], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `BidExact_Deposit_Receipt_QTE-2024-041.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Download Payment Receipt</span>
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DOCUMENT MANAGEMENT & SIGNED CONTRACT VAULT (MOCK FILE SERVICE) */}
      {/* ========================================================================= */}
      {activeTab === 'documents' && (
        <DocumentManagementSection
          activeClient={activeClient}
          displayedProjects={displayedProjects}
          onDocumentDownloaded={(fileName, hash) => {
            setDownloadToast({
              fileName,
              hash: hash.substring(0, 16) + '...',
            });
            setTimeout(() => {
              setDownloadToast(null);
            }, 4000);
          }}
        />
      )}

      </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CLIENT RFI INSPECT & DIRECT CLARIFICATION RESPONSE */}
      {/* ========================================================================= */}
      {selectedRfiForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#131b2e] border border-[#334155] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#dae2fd]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                  <FileQuestion className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#38bdf8]">
                      {selectedRfiForDetail.id}
                    </span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-[#e0b44a]/20 text-[#e0b44a] uppercase">
                      {selectedRfiForDetail.statusLabel || selectedRfiForDetail.status}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {selectedRfiForDetail.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedRfiForDetail(null)}
                className="p-1.5 rounded hover:bg-[#1f283d] text-[#94a3b8] hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#0b1326] text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-[#131b2e] border border-[#222a3d] space-y-2">
                <div className="text-[10px] uppercase text-[#94a3b8] font-bold">
                  Technical Discrepancy Query
                </div>
                <p className="text-white text-xs font-sans leading-relaxed">
                  {selectedRfiForDetail.fullQuery || selectedRfiForDetail.description}
                </p>
                {selectedRfiForDetail.csiDivision && (
                  <div className="text-[#4edea3] text-[11px] pt-1">
                    CSI Division: {selectedRfiForDetail.csiDivision}
                  </div>
                )}
              </div>

              {/* Cost and Schedule Impact Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#131b2e] border border-[#222a3d]">
                  <div className="text-[10px] text-[#94a3b8] uppercase">Potential Cost Delta</div>
                  <div className="text-sm font-bold text-[#e0b44a] mt-0.5">
                    {selectedRfiForDetail.deltaCost
                      ? `+$${selectedRfiForDetail.deltaCost.toLocaleString()}`
                      : 'Pending Drawing Clarification'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#131b2e] border border-[#222a3d]">
                  <div className="text-[10px] text-[#94a3b8] uppercase">Assigned Estimator</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {selectedRfiForDetail.assignedLead.name}
                  </div>
                </div>
              </div>

              {/* Direct Client Response Box */}
              <div className="p-3.5 rounded-lg bg-[#131b2e] border border-[#38bdf8]/40 space-y-2">
                <div className="flex items-center justify-between text-white font-bold font-sans">
                  <span>Submit Client Direction / Drawing Clarification</span>
                  <span className="text-[10px] text-[#38bdf8] font-mono">Direct to Takeoff Lead</span>
                </div>
                <textarea
                  rows={3}
                  value={clientResponseText}
                  onChange={(e) => setClientResponseText(e.target.value)}
                  placeholder="E.g., Per revised Addendum #2 S-204, use #8 rebar at 6'' oc. Proceed with takeoffs accordingly..."
                  className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#38bdf8] font-sans"
                />

                {responseSuccessMessage ? (
                  <div className="p-2 rounded bg-[#4edea3]/20 border border-[#4edea3]/40 text-[#4edea3] flex items-center gap-1.5 font-sans">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{responseSuccessMessage}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#94a3b8] font-sans">
                      Will update RFI state to <code>UNDER_REVIEW</code> in Bid Exact team queue.
                    </span>
                    <button
                      onClick={() => handleSendClientResponse(selectedRfiForDetail.id)}
                      disabled={!clientResponseText.trim()}
                      className="px-4 py-1.5 rounded-lg bg-[#38bdf8] hover:bg-[#0284c7] disabled:bg-[#1e293b] disabled:text-[#64748b] text-[#0b1326] font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors shadow"
                    >
                      <Send className="w-3 h-3" />
                      <span>Transmit Clarification</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-[#222a3d] flex justify-end bg-[#0b1326]">
              <button
                onClick={() => setSelectedRfiForDetail(null)}
                className="px-4 py-1.5 rounded bg-[#1e293b] hover:bg-[#334155] text-xs text-[#94a3b8] hover:text-white font-mono cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CLIENT SUBMIT NEW RFI / INQUIRY */}
      {/* ========================================================================= */}
      {isNewRfiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#131b2e] border border-[#334155] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden text-[#dae2fd]">
            <div className="p-4 sm:p-5 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#4edea3]/15 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Submit New RFI to Bid Exact
                  </h3>
                  <p className="text-xs text-[#94a3b8]">
                    Inquire regarding drawing revisions, schedule shifts, or scope questions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewRfiModalOpen(false)}
                className="p-1.5 rounded hover:bg-[#1f283d] text-[#94a3b8] hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleClientSubmitNewRfi} className="p-5 space-y-4 bg-[#0b1326] text-xs">
              <div className="space-y-1">
                <label className="block text-white font-bold">RFI Title / Scope Topic</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Structural Steel Column Base Plate Thickness Revision"
                  value={newRfiTitle}
                  onChange={(e) => setNewRfiTitle(e.target.value)}
                  className="w-full bg-[#131b2e] border border-[#222a3d] rounded-lg p-2.5 text-white placeholder-[#64748b] focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-white font-bold">Associated Project</label>
                  <select
                    value={newRfiProject}
                    onChange={(e) => setNewRfiProject(e.target.value)}
                    className="w-full bg-[#131b2e] border border-[#222a3d] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#4edea3]"
                  >
                    {displayedProjects.map((p) => (
                      <option key={p.id} value={p.title}>
                        {p.title} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-white font-bold">Urgency / Priority</label>
                  <select
                    value={newRfiPriority}
                    onChange={(e) => setNewRfiPriority(e.target.value as any)}
                    className="w-full bg-[#131b2e] border border-[#222a3d] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#4edea3]"
                  >
                    <option value="CRITICAL">Critical (Blocks Submittal Schedule)</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-white font-bold">Question Details &amp; Drawing References</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the specific drawing sheet, detail numbers, or specification clauses requiring clarification..."
                  value={newRfiQuery}
                  onChange={(e) => setNewRfiQuery(e.target.value)}
                  className="w-full bg-[#131b2e] border border-[#222a3d] rounded-lg p-2.5 text-white placeholder-[#64748b] focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="p-3 rounded-lg bg-[#131b2e] border border-[#222a3d] flex items-center justify-between font-mono">
                <div className="flex items-center gap-2 text-[#94a3b8]">
                  <Paperclip className="w-4 h-4 text-[#38bdf8]" />
                  <span>Attach Revised Sheet / Addendum (PDF/DWG)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewRfiAttachment('Addendum_Rev2_Architectural_Sheet.pdf')}
                  className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-[#334155] text-white border border-[#475569] cursor-pointer"
                >
                  {newRfiAttachment ? newRfiAttachment : 'Upload File'}
                </button>
              </div>

              <div className="pt-3 border-t border-[#222a3d] flex items-center justify-between">
                <span className="text-[10px] text-[#94a3b8] font-mono">
                  Transmits immediately to Lead Estimator Marcus Vance
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewRfiModalOpen(false)}
                    className="px-3.5 py-2 rounded bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-[#94a3b8] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-[#4edea3] hover:bg-[#3ec490] text-[#0b1326] font-bold font-mono text-xs flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit RFI</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
