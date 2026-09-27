import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  PhoneCall,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Search,
  Plus,
  ArrowUpRight,
  Download,
  Building2,
  Landmark,
  Receipt,
  Users,
  ShieldAlert,
  DollarSign,
  RefreshCw,
  Phone,
  Mail,
  FileCheck,
  X,
  ExternalLink,
  Layers,
  ChevronDown,
  Briefcase,
  SlidersHorizontal,
  AlarmClockOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ComplianceCalendar } from '../reminders/ComplianceCalendar';
import {
  CompanyReminderItem,
  ReminderCategory,
  ReminderPriority,
  ReminderStatus,
  ReminderFrequency,
  CashTransaction,
} from '../../types';
import { NavTabId } from '../Sidebar';

interface CompanyRemindersViewProps {
  reminders: CompanyReminderItem[];
  onUpdateReminder: (updatedReminder: CompanyReminderItem) => void;
  onAddReminder: (newReminder: CompanyReminderItem) => void;
  onNavigateTab: (tab: NavTabId) => void;
  onRecordCashOutflow?: (txn: CashTransaction) => void;
}

export const CompanyRemindersView: React.FC<CompanyRemindersViewProps> = ({
  reminders,
  onUpdateReminder,
  onAddReminder,
  onNavigateTab,
  onRecordCashOutflow,
}) => {
  // Filters & View Mode
  const [selectedCategory, setSelectedCategory] = useState<ReminderCategory | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<ReminderPriority | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ReminderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'cards' | 'timeline' | 'table'>('calendar');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeCallReminder, setActiveCallReminder] = useState<CompanyReminderItem | null>(null);
  const [activeTaxReminder, setActiveTaxReminder] = useState<CompanyReminderItem | null>(null);
  const [snoozeMenuReminderId, setSnoozeMenuReminderId] = useState<string | null>(null);

  // Call Logging Form State
  const [callOutcome, setCallOutcome] = useState('Connected & Discussed');
  const [callNotes, setCallNotes] = useState('');
  const [callMarkComplete, setCallMarkComplete] = useState(true);

  // Tax Filing Form State
  const [taxConfirmationNumber, setTaxConfirmationNumber] = useState('');
  const [taxActualAmount, setTaxActualAmount] = useState<number>(0);
  const [taxPaymentMethod, setTaxPaymentMethod] = useState('EFTPS Treasury Portal Direct Debit');
  const [taxRecordInflowTxn, setTaxRecordInflowTxn] = useState(true);
  const [taxNotes, setTaxNotes] = useState('');

  // New Reminder Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ReminderCategory>('tax_compliance');
  const [newDueDate, setNewDueDate] = useState('2024-09-30');
  const [newDueTime, setNewDueTime] = useState('5:00 PM EST');
  const [newPriority, setNewPriority] = useState<ReminderPriority>('HIGH');
  const [newDescription, setNewDescription] = useState('');
  const [newAssigneeName, setNewAssigneeName] = useState('Brandon Vance');
  const [newAssigneeRole, setNewAssigneeRole] = useState('Chief Estimator & Partner');
  const [newStatutoryAgency, setNewStatutoryAgency] = useState('');
  const [newTaxForm, setNewTaxForm] = useState('');
  const [newEntityName, setNewEntityName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newFrequency, setNewFrequency] = useState<ReminderFrequency>('one_time');
  const [newTags, setNewTags] = useState('Compliance, Deadline');

  // Filter calculations
  const filteredReminders = useMemo(() => {
    return reminders.filter((rem) => {
      // Category filter
      if (selectedCategory !== 'all' && rem.category !== selectedCategory) {
        return false;
      }
      // Priority filter
      if (selectedPriority !== 'all' && rem.priority !== selectedPriority) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && rem.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = rem.title.toLowerCase().includes(q);
        const matchesDesc = rem.description.toLowerCase().includes(q);
        const matchesAgency = rem.statutoryAgency?.toLowerCase().includes(q) || false;
        const matchesForm = rem.taxFormNumber?.toLowerCase().includes(q) || false;
        const matchesEntity = rem.relatedEntity?.name.toLowerCase().includes(q) || false;
        const matchesContact = rem.relatedEntity?.contactPerson?.toLowerCase().includes(q) || false;
        const matchesAssignee = rem.assignee.name.toLowerCase().includes(q);
        const matchesTags = rem.tags.some((t) => t.toLowerCase().includes(q));

        if (!matchesTitle && !matchesDesc && !matchesAgency && !matchesForm && !matchesEntity && !matchesContact && !matchesAssignee && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [reminders, selectedCategory, selectedPriority, selectedStatus, searchQuery]);

  // Key KPI metrics
  const stats = useMemo(() => {
    const total = reminders.length;
    const pending = reminders.filter((r) => r.status === 'pending');
    const completed = reminders.filter((r) => r.status === 'completed');
    const urgent = reminders.filter((r) => r.priority === 'URGENT' && r.status !== 'completed');
    const clientCalls = reminders.filter((r) => r.category === 'client_calls' && r.status !== 'completed');
    const taxFilings = reminders.filter((r) => r.category === 'tax_compliance' && r.status !== 'completed');
    const totalPendingTaxes = taxFilings.reduce((sum, r) => sum + (r.monetaryAmount || 0), 0);

    return {
      total,
      pendingCount: pending.length,
      completedCount: completed.length,
      urgentCount: urgent.length,
      clientCallsCount: clientCalls.length,
      taxFilingsCount: taxFilings.length,
      totalPendingTaxes,
      completionRate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
    };
  }, [reminders]);

  // Quick Action Handlers
  const handleToggleComplete = (reminder: CompanyReminderItem) => {
    const isCurrentlyDone = reminder.status === 'completed';
    const updated: CompanyReminderItem = {
      ...reminder,
      status: isCurrentlyDone ? 'pending' : 'completed',
      completedAt: isCurrentlyDone ? undefined : new Date().toISOString(),
      completedBy: isCurrentlyDone ? undefined : 'Current User',
    };
    onUpdateReminder(updated);
  };

  const handleSnooze = (reminder: CompanyReminderItem, days: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const dateStr = targetDate.toISOString().slice(0, 10);

    const updated: CompanyReminderItem = {
      ...reminder,
      status: 'snoozed',
      snoozedUntil: dateStr,
      dueDate: dateStr,
    };
    onUpdateReminder(updated);
    setSnoozeMenuReminderId(null);
  };

  // Submit Call Logging
  const handleSaveCallLog = () => {
    if (!activeCallReminder) return;

    const updated: CompanyReminderItem = {
      ...activeCallReminder,
      callOutcomeNote: `[Call Logged ${new Date().toLocaleDateString()}]: ${callOutcome} - ${callNotes}`,
      status: callMarkComplete ? 'completed' : 'in_progress',
      completedAt: callMarkComplete ? new Date().toISOString() : undefined,
      completedBy: callMarkComplete ? 'Current User' : undefined,
    };

    onUpdateReminder(updated);
    setActiveCallReminder(null);
    setCallNotes('');
    setCallOutcome('Connected & Discussed');
  };

  // Submit Tax Filing Completion
  const handleSaveTaxFiling = () => {
    if (!activeTaxReminder) return;

    const finalAmount = taxActualAmount > 0 ? taxActualAmount : (activeTaxReminder.monetaryAmount || 0);
    const confirmation = taxConfirmationNumber.trim() || `EFTPS-${Math.floor(100000 + Math.random() * 900000)}`;

    const updated: CompanyReminderItem = {
      ...activeTaxReminder,
      filingConfirmationNumber: confirmation,
      status: 'completed',
      completedAt: new Date().toISOString(),
      completedBy: 'Sarah Lin, CPA',
      description: `${activeTaxReminder.description} [FILING CONFIRMED #${confirmation}: Paid $${finalAmount.toLocaleString()} via ${taxPaymentMethod}]`,
    };

    onUpdateReminder(updated);

    // If requested, record cash outflow transaction in Treasury
    if (taxRecordInflowTxn && onRecordCashOutflow && finalAmount > 0) {
      const outflowTxn: CashTransaction = {
        id: `TXN-TAX-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().slice(0, 10),
        amount: finalAmount,
        type: 'outflow',
        category: 'Statutory Taxes',
        description: `Tax Filing Payment: ${activeTaxReminder.title} (Conf #${confirmation})`,
        counterparty: activeTaxReminder.statutoryAgency || 'IRS EFTPS Treasury',
        status: 'reconciled',
        paymentMethod: taxPaymentMethod,
        account: 'Operating Primary (FN-4991)',
        referenceNumber: confirmation,
      };
      onRecordCashOutflow(outflowTxn);
    }

    setActiveTaxReminder(null);
    setTaxConfirmationNumber('');
    setTaxActualAmount(0);
    setTaxNotes('');
  };

  // Submit Create New Reminder
  const handleCreateReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const parsedAmount = parseFloat(newAmount) || 0;
    const tagsList = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newReminderItem: CompanyReminderItem = {
      id: `REM-${Date.now().toString().slice(-6)}`,
      title: newTitle.trim(),
      category: newCategory,
      dueDate: newDueDate,
      dueTime: newDueTime,
      priority: newPriority,
      status: 'pending',
      description: newDescription.trim() || 'Scheduled company milestone and regulatory compliance task.',
      assignee: {
        name: newAssigneeName,
        role: newAssigneeRole,
        avatarColor: 'bg-[#4edea3]',
        initials: newAssigneeName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase(),
      },
      statutoryAgency: newStatutoryAgency.trim() || undefined,
      taxFormNumber: newTaxForm.trim() || undefined,
      monetaryAmount: parsedAmount > 0 ? parsedAmount : undefined,
      frequency: newFrequency,
      relatedEntity: newEntityName
        ? {
            type: newCategory === 'client_calls' ? 'client' : newCategory === 'tax_compliance' ? 'tax_agency' : 'vendor',
            name: newEntityName.trim(),
            contactPerson: newContactPerson.trim() || undefined,
            phone: newContactPhone.trim() || undefined,
            email: newContactEmail.trim() || undefined,
          }
        : undefined,
      tags: tagsList.length > 0 ? tagsList : ['Company Reminder'],
    };

    onAddReminder(newReminderItem);
    setIsAddModalOpen(false);

    // Reset Form
    setNewTitle('');
    setNewDescription('');
    setNewStatutoryAgency('');
    setNewTaxForm('');
    setNewEntityName('');
    setNewContactPerson('');
    setNewContactPhone('');
    setNewContactEmail('');
    setNewAmount('');
  };

  // Export summary report
  const handleExportSummary = () => {
    const reportText = `BID EXACT LLC - EXECUTIVE REMINDERS & COMPLIANCE BRIEFING
Generated: ${new Date().toLocaleString()}
============================================================
Total Reminders: ${stats.total} | Pending: ${stats.pendingCount} | Urgent: ${stats.urgentCount}
Scheduled Client Calls: ${stats.clientCallsCount}
Pending Tax Liabilities: $${stats.totalPendingTaxes.toLocaleString()}

TAX & STATUTORY FILINGS:
${reminders
  .filter((r) => r.category === 'tax_compliance')
  .map(
    (r) =>
      `• [${r.status.toUpperCase()}] ${r.title} | Due: ${r.dueDate} ${r.dueTime || ''} | Agency: ${r.statutoryAgency || 'N/A'} | Est Liability: $${(r.monetaryAmount || 0).toLocaleString()}`
  )
  .join('\n')}

CLIENT CALLS & RELATIONSHIPS:
${reminders
  .filter((r) => r.category === 'client_calls')
  .map(
    (r) =>
      `• [${r.status.toUpperCase()}] ${r.title} | Due: ${r.dueDate} | Contact: ${r.relatedEntity?.contactPerson || 'N/A'} (${r.relatedEntity?.phone || 'No phone'})`
  )
  .join('\n')}

OPERATIONAL BIDS & PAYROLL:
${reminders
  .filter((r) => r.category === 'bids_rfis' || r.category === 'payroll_hr')
  .map((r) => `• [${r.status.toUpperCase()}] ${r.title} | Due: ${r.dueDate} | Assignee: ${r.assignee.name}`)
  .join('\n')}
============================================================
`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BidExact-Reminders-Compliance-Report-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper category badge styling
  const getCategoryBadge = (cat: ReminderCategory) => {
    switch (cat) {
      case 'tax_compliance':
        return {
          label: 'Taxes & Statutory',
          bg: 'bg-[#a78bfa]/15 text-[#c4b5fd] border-[#a78bfa]/30',
          icon: Landmark,
        };
      case 'client_calls':
        return {
          label: 'Client Calls',
          bg: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30',
          icon: PhoneCall,
        };
      case 'bids_rfis':
        return {
          label: 'Bids & RFIs',
          bg: 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30',
          icon: FileText,
        };
      case 'payroll_hr':
        return {
          label: 'Payroll & HR',
          bg: 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/30',
          icon: Users,
        };
      case 'finance_legal':
        return {
          label: 'Finance & Legal',
          bg: 'bg-[#f43f5e]/15 text-[#fda4af] border-[#f43f5e]/30',
          icon: ShieldAlert,
        };
    }
  };

  // Helper priority styling
  const getPriorityBadge = (pri: ReminderPriority) => {
    switch (pri) {
      case 'URGENT':
        return 'bg-[#f43f5e]/20 text-[#f43f5e] border-[#f43f5e]/40 font-bold animate-pulse';
      case 'HIGH':
        return 'bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]/30 font-semibold';
      case 'NORMAL':
        return 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30';
      case 'LOW':
        return 'bg-[#86948a]/20 text-[#86948a] border-[#86948a]/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#131b2e] border border-[#222a3d] rounded-xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider uppercase text-[#86948a] mb-1">
            <span className="text-[#4edea3] font-bold">ENTERPRISE ERP GOVERNANCE</span>
            <span>/</span>
            <span>COMPLIANCE & SCHEDULE COMMAND</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-[#4edea3]" />
            Company Reminders & Compliance
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-1 max-w-2xl">
            Centralized schedule of statutory corporate tax submissions, client follow-up calls, pre-con bid deadlines,
            direct deposit payroll cutoffs, and regulatory compliance filings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-export-reminders-summary"
            onClick={handleExportSummary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1f2b48] hover:bg-[#28375c] text-[#dae2fd] text-xs font-semibold border border-[#222a3d] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Briefing</span>
          </button>

          <button
            id="btn-add-company-reminder"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#4edea3] hover:bg-[#3ec48e] text-[#0b1326] text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Company Reminder</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[#86948a] mb-1">
            <span>Pending Reminders</span>
            <Clock className="w-4 h-4 text-[#4edea3]" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.pendingCount}</div>
          <div className="text-[11px] text-[#86948a] mt-0.5 flex items-center gap-1.5">
            <span className="text-[#4edea3] font-semibold">{stats.completionRate}%</span> completed ({stats.completedCount} done)
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[#86948a] mb-1">
            <span>Urgent / Action Required</span>
            <AlertTriangle className="w-4 h-4 text-[#f43f5e]" />
          </div>
          <div className="text-2xl font-bold text-[#f43f5e] font-mono">{stats.urgentCount}</div>
          <div className="text-[11px] text-[#86948a] mt-0.5">High priority tasks due immediately</div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[#86948a] mb-1">
            <span>Pending Tax Liabilities</span>
            <Landmark className="w-4 h-4 text-[#a78bfa]" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${stats.totalPendingTaxes.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#c4b5fd] mt-0.5">
            {stats.taxFilingsCount} statutory tax returns to submit
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[#86948a] mb-1">
            <span>Client Calls Scheduled</span>
            <PhoneCall className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="text-2xl font-bold text-[#38bdf8] font-mono">{stats.clientCallsCount}</div>
          <div className="text-[11px] text-[#86948a] mt-0.5">Follow-ups, leveling, and collections</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#86948a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reminders by tax form, client name, contact person, assignee, or tag..."
              className="w-full pl-9 pr-8 py-2 bg-[#0b1326] border border-[#222a3d] rounded-lg text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86948a] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#0b1326] p-1 border border-[#222a3d] rounded-lg self-end md:self-auto shrink-0">
            <button
              id="btn-view-mode-calendar"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                viewMode === 'calendar' ? 'bg-[#1f2b48] text-[#4edea3] font-bold shadow-sm' : 'text-[#86948a] hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              id="btn-view-mode-cards"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-[#1f2b48] text-[#4edea3] font-bold' : 'text-[#86948a] hover:text-white'
              }`}
            >
              Cards
            </button>
            <button
              id="btn-view-mode-timeline"
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                viewMode === 'timeline' ? 'bg-[#1f2b48] text-[#4edea3] font-bold' : 'text-[#86948a] hover:text-white'
              }`}
            >
              Agenda
            </button>
            <button
              id="btn-view-mode-table"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#1f2b48] text-[#4edea3] font-bold' : 'text-[#86948a] hover:text-white'
              }`}
            >
              Table
            </button>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer font-semibold ${
              selectedCategory === 'all'
                ? 'bg-[#4edea3] text-[#0b1326] border-[#4edea3]'
                : 'bg-[#0b1326] text-[#86948a] border-[#222a3d] hover:text-white'
            }`}
          >
            All Reminders ({reminders.length})
          </button>
          <button
            onClick={() => setSelectedCategory('tax_compliance')}
            className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'tax_compliance'
                ? 'bg-[#a78bfa] text-[#0b1326] border-[#a78bfa] font-bold'
                : 'bg-[#0b1326] text-[#c4b5fd] border-[#222a3d] hover:border-[#a78bfa]/40'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Taxes & Statutory ({reminders.filter((r) => r.category === 'tax_compliance').length})</span>
          </button>
          <button
            onClick={() => setSelectedCategory('client_calls')}
            className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'client_calls'
                ? 'bg-[#38bdf8] text-[#0b1326] border-[#38bdf8] font-bold'
                : 'bg-[#0b1326] text-[#38bdf8] border-[#222a3d] hover:border-[#38bdf8]/40'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Client Calls ({reminders.filter((r) => r.category === 'client_calls').length})</span>
          </button>
          <button
            onClick={() => setSelectedCategory('bids_rfis')}
            className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'bids_rfis'
                ? 'bg-[#4edea3] text-[#0b1326] border-[#4edea3] font-bold'
                : 'bg-[#0b1326] text-[#4edea3] border-[#222a3d] hover:border-[#4edea3]/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Bids & RFIs ({reminders.filter((r) => r.category === 'bids_rfis').length})</span>
          </button>
          <button
            onClick={() => setSelectedCategory('payroll_hr')}
            className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'payroll_hr'
                ? 'bg-[#fbbf24] text-[#0b1326] border-[#fbbf24] font-bold'
                : 'bg-[#0b1326] text-[#fbbf24] border-[#222a3d] hover:border-[#fbbf24]/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Payroll & HR ({reminders.filter((r) => r.category === 'payroll_hr').length})</span>
          </button>
          <button
            onClick={() => setSelectedCategory('finance_legal')}
            className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'finance_legal'
                ? 'bg-[#fda4af] text-[#0b1326] border-[#fda4af] font-bold'
                : 'bg-[#0b1326] text-[#fda4af] border-[#222a3d] hover:border-[#fda4af]/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Finance & Legal ({reminders.filter((r) => r.category === 'finance_legal').length})</span>
          </button>
        </div>

        {/* Priority & Status Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#222a3d] text-xs text-[#86948a]">
          <div className="flex items-center gap-1.5">
            <span>Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as any)}
              className="bg-[#0b1326] border border-[#222a3d] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#4edea3]"
            >
              <option value="all">All Priorities</option>
              <option value="URGENT">Urgent Only</option>
              <option value="HIGH">High Priority</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-[#0b1326] border border-[#222a3d] rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#4edea3]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="snoozed">Snoozed</option>
            </select>
          </div>

          <div className="ml-auto text-[11px] font-mono">
            Showing <span className="text-white font-bold">{filteredReminders.length}</span> of {reminders.length}
          </div>
        </div>
      </div>

      {/* Main Content Area: Rendering Based on View Mode */}
      {viewMode === 'calendar' ? (
        <ComplianceCalendar
          reminders={filteredReminders}
          onUpdateReminder={onUpdateReminder}
          onOpenCallModal={(rem) => setActiveCallReminder(rem)}
          onOpenTaxModal={(rem) => setActiveTaxReminder(rem)}
          onAddNewReminderForDate={(dateStr) => {
            setNewDueDate(dateStr);
            setIsAddModalOpen(true);
          }}
          onNavigateTab={onNavigateTab}
        />
      ) : filteredReminders.length === 0 ? (
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 text-[#86948a] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-white mb-1">No matching reminders found</h3>
          <p className="text-xs text-[#86948a] max-w-md mx-auto mb-4">
            Try adjusting your search keywords, priority levels, or category filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedPriority('all');
              setSelectedStatus('all');
              setSearchQuery('');
            }}
            className="px-3 py-1.5 rounded bg-[#1f2b48] text-xs font-semibold text-[#dae2fd] hover:bg-[#28375c]"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReminders.map((rem) => {
            const catBadge = getCategoryBadge(rem.category);
            const isCompleted = rem.status === 'completed';
            const isTax = rem.category === 'tax_compliance';
            const isCall = rem.category === 'client_calls';

            return (
              <motion.div
                key={rem.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex flex-col justify-between bg-[#131b2e] border rounded-xl p-4 transition-all duration-200 ${
                  isCompleted
                    ? 'border-[#222a3d]/60 opacity-60 bg-[#0e1526]'
                    : rem.priority === 'URGENT'
                    ? 'border-[#f43f5e]/40 shadow-[0_0_15px_rgba(244,63,94,0.08)]'
                    : 'border-[#222a3d] hover:border-[#38bdf8]/40'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${catBadge.bg}`}
                    >
                      <catBadge.icon className="w-3 h-3" />
                      {catBadge.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider ${getPriorityBadge(
                          rem.priority
                        )}`}
                      >
                        {rem.priority}
                      </span>
                      {rem.frequency !== 'one_time' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#1f2b48] text-[#86948a] border border-[#222a3d] uppercase">
                          {rem.frequency}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Complete Checkbox */}
                  <div className="flex items-start gap-2.5 mb-2">
                    <button
                      onClick={() => handleToggleComplete(rem)}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        isCompleted
                          ? 'bg-[#4edea3] border-[#4edea3] text-[#0b1326]'
                          : 'border-[#364366] hover:border-[#4edea3] text-transparent'
                      }`}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <h4
                        className={`text-sm font-semibold tracking-tight text-white leading-snug ${
                          isCompleted ? 'line-through text-[#86948a]' : ''
                        }`}
                      >
                        {rem.title}
                      </h4>
                      {rem.taxFormNumber && (
                        <span className="inline-block mt-1 font-mono text-[10px] text-[#c4b5fd] bg-[#a78bfa]/10 px-1.5 py-0.2 rounded border border-[#a78bfa]/20">
                          {rem.taxFormNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#86948a] line-clamp-3 mb-3 leading-relaxed">
                    {rem.description}
                  </p>

                  {/* Entity Information (Client / Tax Agency / Phone) */}
                  {rem.relatedEntity && (
                    <div className="bg-[#0b1326] border border-[#222a3d] rounded-lg p-2.5 mb-3 text-xs space-y-1">
                      <div className="font-semibold text-[#dae2fd] flex items-center justify-between">
                        <span>{rem.relatedEntity.name}</span>
                        {rem.monetaryAmount !== undefined && rem.monetaryAmount > 0 && (
                          <span className="font-mono text-[#4edea3] font-bold">
                            ${rem.monetaryAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {rem.relatedEntity.contactPerson && (
                        <div className="text-[11px] text-[#86948a] flex items-center gap-1">
                          <span>{rem.relatedEntity.contactPerson}</span>
                        </div>
                      )}
                      {rem.relatedEntity.phone && (
                        <div className="text-[11px] text-[#38bdf8] flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3" />
                          <span>{rem.relatedEntity.phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Outcome Note or Confirmation Number if Completed */}
                  {rem.filingConfirmationNumber && (
                    <div className="bg-[#4edea3]/10 border border-[#4edea3]/30 rounded-lg p-2 mb-3 text-[11px] text-[#4edea3] font-mono">
                      <span className="font-bold">FILING CONFIRMATION:</span> #{rem.filingConfirmationNumber}
                    </div>
                  )}

                  {rem.callOutcomeNote && (
                    <div className="bg-[#38bdf8]/10 border border-[#38bdf8]/30 rounded-lg p-2 mb-3 text-[11px] text-[#38bdf8]">
                      {rem.callOutcomeNote}
                    </div>
                  )}
                </div>

                {/* Footer Controls & Due Date */}
                <div className="pt-3 border-t border-[#222a3d] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#86948a]">
                      <Calendar className="w-3 h-3 text-[#4edea3]" />
                      <span className="font-medium text-white">{rem.dueDate}</span>
                      {rem.dueTime && <span>({rem.dueTime})</span>}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-4 h-4 rounded-full ${rem.assignee.avatarColor || 'bg-[#4edea3]'} text-[#0b1326] text-[9px] font-bold flex items-center justify-center`}
                        title={`Assigned to ${rem.assignee.name} (${rem.assignee.role})`}
                      >
                        {rem.assignee.initials || rem.assignee.name[0]}
                      </div>
                      <span className="text-[10px] text-[#86948a] truncate max-w-[80px]">
                        {rem.assignee.name.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Primary Action Button based on category */}
                    {isCall ? (
                      <button
                        onClick={() => {
                          setActiveCallReminder(rem);
                          setCallNotes('');
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] text-xs font-semibold border border-[#38bdf8]/30 transition-colors cursor-pointer"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Log Client Call</span>
                      </button>
                    ) : isTax ? (
                      <button
                        onClick={() => {
                          setActiveTaxReminder(rem);
                          setTaxActualAmount(rem.monetaryAmount || 0);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#a78bfa]/15 hover:bg-[#a78bfa]/25 text-[#c4b5fd] text-xs font-semibold border border-[#a78bfa]/30 transition-colors cursor-pointer"
                      >
                        <Landmark className="w-3 h-3" />
                        <span>Submit / Record Tax</span>
                      </button>
                    ) : rem.actionUrlOrTab ? (
                      <button
                        onClick={() => onNavigateTab(rem.actionUrlOrTab as NavTabId)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1f2b48] hover:bg-[#28375c] text-[#dae2fd] text-xs font-semibold border border-[#222a3d] transition-colors cursor-pointer"
                      >
                        <span>{rem.actionLabel || 'Inspect in Workspace'}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleComplete(rem)}
                        className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          isCompleted
                            ? 'bg-[#1f2b48] text-[#86948a] border-[#222a3d]'
                            : 'bg-[#4edea3]/15 hover:bg-[#4edea3]/25 text-[#4edea3] border-[#4edea3]/30'
                        }`}
                      >
                        {isCompleted ? 'Mark Pending' : 'Mark as Completed'}
                      </button>
                    )}

                    {/* Snooze Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setSnoozeMenuReminderId(snoozeMenuReminderId === rem.id ? null : rem.id)
                        }
                        className="p-1.5 rounded-lg bg-[#171f33] hover:bg-[#1f2b48] text-[#86948a] hover:text-white border border-[#222a3d] transition-colors cursor-pointer"
                        title="Snooze reminder"
                      >
                        <AlarmClockOff className="w-3.5 h-3.5" />
                      </button>

                      {snoozeMenuReminderId === rem.id && (
                        <div className="absolute right-0 bottom-full mb-1 w-32 bg-[#0b1326] border border-[#222a3d] rounded-lg shadow-2xl py-1 z-20 text-xs">
                          <button
                            onClick={() => handleSnooze(rem, 1)}
                            className="w-full text-left px-3 py-1.5 hover:bg-[#171f33] text-[#dae2fd]"
                          >
                            + 1 Day
                          </button>
                          <button
                            onClick={() => handleSnooze(rem, 3)}
                            className="w-full text-left px-3 py-1.5 hover:bg-[#171f33] text-[#dae2fd]"
                          >
                            + 3 Days
                          </button>
                          <button
                            onClick={() => handleSnooze(rem, 7)}
                            className="w-full text-left px-3 py-1.5 hover:bg-[#171f33] text-[#dae2fd]"
                          >
                            + 1 Week
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : viewMode === 'timeline' ? (
        /* AGENDA / TIMELINE GROUPED VIEW */
        <div className="space-y-6">
          {['2024-09-20', '2024-09-21', '2024-09-23', '2024-09-26', '2024-09-30', '2024-10-01', '2024-10-15'].map(
            (dateKey) => {
              const dayReminders = filteredReminders.filter((r) => r.dueDate === dateKey);
              if (dayReminders.length === 0) return null;

              const isToday = dateKey === '2024-09-20';

              return (
                <div key={dateKey} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-[#222a3d] pb-2">
                    <Calendar className="w-4 h-4 text-[#4edea3]" />
                    <span className="font-bold text-sm text-white font-mono">{dateKey}</span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded bg-[#f43f5e]/20 text-[#f43f5e] font-bold font-mono text-[10px] border border-[#f43f5e]/30 animate-pulse">
                        TODAY'S DEADLINES
                      </span>
                    )}
                    <span className="text-xs text-[#86948a] ml-auto">
                      {dayReminders.length} event{dayReminders.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-[#222a3d]">
                    {dayReminders.map((rem) => {
                      const catBadge = getCategoryBadge(rem.category);
                      const isCompleted = rem.status === 'completed';

                      return (
                        <div
                          key={rem.id}
                          className={`p-3 rounded-lg border bg-[#131b2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isCompleted ? 'border-[#222a3d] opacity-60' : 'border-[#222a3d] hover:border-[#4edea3]/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleToggleComplete(rem)}
                              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isCompleted
                                  ? 'bg-[#4edea3] border-[#4edea3] text-[#0b1326]'
                                  : 'border-[#364366] text-transparent'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </button>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-xs text-white">{rem.title}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${catBadge.bg}`}
                                >
                                  {catBadge.label}
                                </span>
                                <span
                                  className={`px-1 py-0.2 rounded text-[9px] font-mono border uppercase ${getPriorityBadge(
                                    rem.priority
                                  )}`}
                                >
                                  {rem.priority}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#86948a] mt-0.5">
                                {rem.description}
                              </div>
                              {rem.relatedEntity && (
                                <div className="text-[11px] text-[#38bdf8] mt-1 font-mono">
                                  {rem.relatedEntity.name} {rem.relatedEntity.phone ? `(${rem.relatedEntity.phone})` : ''}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            {rem.category === 'client_calls' ? (
                              <button
                                onClick={() => setActiveCallReminder(rem)}
                                className="px-2.5 py-1 rounded bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] text-xs font-semibold border border-[#38bdf8]/30 cursor-pointer"
                              >
                                Call Client
                              </button>
                            ) : rem.category === 'tax_compliance' ? (
                              <button
                                onClick={() => setActiveTaxReminder(rem)}
                                className="px-2.5 py-1 rounded bg-[#a78bfa]/15 hover:bg-[#a78bfa]/25 text-[#c4b5fd] text-xs font-semibold border border-[#a78bfa]/30 cursor-pointer"
                              >
                                Record Filing
                              </button>
                            ) : rem.actionUrlOrTab ? (
                              <button
                                onClick={() => onNavigateTab(rem.actionUrlOrTab as NavTabId)}
                                className="px-2.5 py-1 rounded bg-[#1f2b48] hover:bg-[#28375c] text-[#dae2fd] text-xs font-semibold border border-[#222a3d] cursor-pointer"
                              >
                                View
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>
      ) : (
        /* DENSE TABLE AUDIT LEDGER VIEW */
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#222a3d] bg-[#0b1326] text-[#86948a] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Reminder & Subject</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Entity / Agency</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222a3d]">
                {filteredReminders.map((rem) => {
                  const catBadge = getCategoryBadge(rem.category);
                  const isCompleted = rem.status === 'completed';

                  return (
                    <tr
                      key={rem.id}
                      className={`hover:bg-[#171f33]/60 transition-colors ${
                        isCompleted ? 'opacity-60 bg-[#0e1526]' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleComplete(rem)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            isCompleted
                              ? 'bg-[#4edea3] border-[#4edea3] text-[#0b1326]'
                              : 'border-[#364366] hover:border-[#4edea3] text-transparent'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </button>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="font-semibold text-white">{rem.dueDate}</div>
                        {rem.dueTime && <div className="text-[10px] text-[#86948a]">{rem.dueTime}</div>}
                      </td>

                      <td className="py-3 px-4 max-w-sm">
                        <div className={`font-semibold text-white ${isCompleted ? 'line-through text-[#86948a]' : ''}`}>
                          {rem.title}
                        </div>
                        <div className="text-[11px] text-[#86948a] truncate">{rem.description}</div>
                        {rem.taxFormNumber && (
                          <span className="font-mono text-[10px] text-[#c4b5fd] bg-[#a78bfa]/10 px-1 py-0.2 rounded mt-0.5 inline-block">
                            {rem.taxFormNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${catBadge.bg}`}>
                          <catBadge.icon className="w-3 h-3" />
                          {catBadge.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider ${getPriorityBadge(rem.priority)}`}>
                          {rem.priority}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#dae2fd]">{rem.relatedEntity?.name || rem.statutoryAgency || '—'}</div>
                        {rem.relatedEntity?.phone && (
                          <div className="text-[10px] text-[#38bdf8] font-mono">{rem.relatedEntity.phone}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-[#4edea3]">
                        {rem.monetaryAmount ? `$${rem.monetaryAmount.toLocaleString()}` : '—'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-4 h-4 rounded-full ${rem.assignee.avatarColor || 'bg-[#4edea3]'} text-[#0b1326] text-[9px] font-bold flex items-center justify-center`}>
                            {rem.assignee.initials || rem.assignee.name[0]}
                          </div>
                          <span className="text-[11px] text-[#86948a]">{rem.assignee.name.split(' ')[0]}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {rem.category === 'client_calls' ? (
                          <button
                            onClick={() => setActiveCallReminder(rem)}
                            className="px-2 py-1 rounded bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] text-xs font-semibold border border-[#38bdf8]/30 cursor-pointer"
                          >
                            Call
                          </button>
                        ) : rem.category === 'tax_compliance' ? (
                          <button
                            onClick={() => setActiveTaxReminder(rem)}
                            className="px-2 py-1 rounded bg-[#a78bfa]/15 hover:bg-[#a78bfa]/25 text-[#c4b5fd] text-xs font-semibold border border-[#a78bfa]/30 cursor-pointer"
                          >
                            File
                          </button>
                        ) : rem.actionUrlOrTab ? (
                          <button
                            onClick={() => onNavigateTab(rem.actionUrlOrTab as NavTabId)}
                            className="px-2 py-1 rounded bg-[#1f2b48] hover:bg-[#28375c] text-[#dae2fd] text-xs font-semibold border border-[#222a3d] cursor-pointer"
                          >
                            Inspect
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleComplete(rem)}
                            className="text-xs text-[#86948a] hover:text-white"
                          >
                            {isCompleted ? 'Reopen' : 'Done'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: LOG CLIENT CALL OUTCOME                                          */}
      {/* ========================================================================= */}
      {activeCallReminder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#131b2e] border border-[#222a3d] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <PhoneCall className="w-5 h-5 text-[#38bdf8]" />
                <h3>Client Call Communications Hub</h3>
              </div>
              <button
                onClick={() => setActiveCallReminder(null)}
                className="p-1 rounded text-[#86948a] hover:text-white hover:bg-[#1f2b48]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#0b1326] border border-[#222a3d] rounded-xl p-4 space-y-2 text-xs">
              <div className="font-bold text-white text-sm">
                {activeCallReminder.relatedEntity?.name || activeCallReminder.title}
              </div>
              <div className="text-[#86948a]">{activeCallReminder.description}</div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#222a3d]">
                <div>
                  <span className="text-[#86948a] block text-[10px] uppercase font-mono">Contact Person</span>
                  <span className="text-[#dae2fd] font-semibold">
                    {activeCallReminder.relatedEntity?.contactPerson || 'Project Executive'}
                  </span>
                </div>
                <div>
                  <span className="text-[#86948a] block text-[10px] uppercase font-mono">Phone Direct</span>
                  <span className="text-[#38bdf8] font-mono font-bold">
                    {activeCallReminder.relatedEntity?.phone || '+1 (555) 019-2000'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#86948a] mb-1">Call Disposition / Outcome</label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
                >
                  <option value="Connected & Discussed Scope">Connected & Discussed Scope</option>
                  <option value="Tender Shortlisted - Interview Scheduled">Tender Shortlisted - Interview Scheduled</option>
                  <option value="Payment Promised by Accounting">Payment Promised by Accounting</option>
                  <option value="Left Voicemail / Callback Requested">Left Voicemail / Callback Requested</option>
                  <option value="Sent Follow-up Email with Takeoff Files">Sent Follow-up Email with Takeoff Files</option>
                  <option value="Scope Revision Requested">Scope Revision Requested</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#86948a] mb-1">Call Notes & Action Items</label>
                <textarea
                  rows={3}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Record summary of discussion, agreed next steps, delivery milestones, or payment terms..."
                  className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2.5 text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-mark-call-complete"
                  checked={callMarkComplete}
                  onChange={(e) => setCallMarkComplete(e.target.checked)}
                  className="rounded bg-[#0b1326] border-[#364366] text-[#38bdf8] focus:ring-0"
                />
                <label htmlFor="chk-mark-call-complete" className="text-xs text-[#dae2fd] cursor-pointer">
                  Mark this call reminder as completed and record in audit log
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222a3d]">
              <button
                onClick={() => setActiveCallReminder(null)}
                className="px-4 py-2 rounded-lg bg-[#1f2b48] text-xs font-semibold text-[#86948a] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCallLog}
                className="px-4 py-2 rounded-lg bg-[#38bdf8] hover:bg-[#0284c7] text-[#0b1326] text-xs font-bold transition-colors cursor-pointer"
              >
                Save Call Record
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MARK STATUTORY TAX AS FILED & PAID                               */}
      {/* ========================================================================= */}
      {activeTaxReminder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#131b2e] border border-[#222a3d] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Landmark className="w-5 h-5 text-[#a78bfa]" />
                <h3>Record Tax Submission & Payment</h3>
              </div>
              <button
                onClick={() => setActiveTaxReminder(null)}
                className="p-1 rounded text-[#86948a] hover:text-white hover:bg-[#1f2b48]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#0b1326] border border-[#222a3d] rounded-xl p-4 space-y-2 text-xs">
              <div className="font-bold text-white text-sm">{activeTaxReminder.title}</div>
              <div className="text-[#86948a]">{activeTaxReminder.description}</div>
              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#222a3d]">
                <span className="text-[#86948a]">Statutory Agency:</span>
                <span className="text-[#c4b5fd] font-semibold">{activeTaxReminder.statutoryAgency || 'IRS EFTPS'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#86948a]">Form / Return:</span>
                <span className="text-white font-mono">{activeTaxReminder.taxFormNumber || 'Standard Return'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#86948a] mb-1">
                    EFTPS / State Confirmation #
                  </label>
                  <input
                    type="text"
                    value={taxConfirmationNumber}
                    onChange={(e) => setTaxConfirmationNumber(e.target.value)}
                    placeholder="e.g. EFTPS-99214028"
                    className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2.5 text-xs text-white font-mono placeholder-[#86948a] focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#86948a] mb-1">Remitted Tax Amount ($)</label>
                  <input
                    type="number"
                    value={taxActualAmount}
                    onChange={(e) => setTaxActualAmount(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 42500"
                    className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2.5 text-xs text-[#4edea3] font-mono font-bold focus:outline-none focus:border-[#a78bfa]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#86948a] mb-1">Payment Method / Channel</label>
                <select
                  value={taxPaymentMethod}
                  onChange={(e) => setTaxPaymentMethod(e.target.value)}
                  className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                >
                  <option value="EFTPS Treasury Portal Direct Debit">EFTPS Treasury Portal Direct Debit</option>
                  <option value="State Dept of Revenue Web Portal (ACH)">State Dept of Revenue Web Portal (ACH)</option>
                  <option value="Secretary of State Online Card Filing">Secretary of State Online Card Filing</option>
                  <option value="Certified Corporate Check / Mail Delivery">Certified Corporate Check / Mail Delivery</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-record-tax-outflow"
                  checked={taxRecordInflowTxn}
                  onChange={(e) => setTaxRecordInflowTxn(e.target.checked)}
                  className="rounded bg-[#0b1326] border-[#364366] text-[#a78bfa] focus:ring-0"
                />
                <label htmlFor="chk-record-tax-outflow" className="text-xs text-[#dae2fd] cursor-pointer">
                  Automatically post Cash Outflow transaction to Treasury Inflow/Outflow ledger
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222a3d]">
              <button
                onClick={() => setActiveTaxReminder(null)}
                className="px-4 py-2 rounded-lg bg-[#1f2b48] text-xs font-semibold text-[#86948a] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTaxFiling}
                className="px-4 py-2 rounded-lg bg-[#a78bfa] hover:bg-[#8b5cf6] text-[#0b1326] text-xs font-bold transition-colors cursor-pointer"
              >
                Confirm Tax Submission
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE NEW COMPANY REMINDER                                      */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#131b2e] border border-[#222a3d] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Plus className="w-5 h-5 text-[#4edea3]" />
                <h3>Schedule New Company Reminder</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-[#86948a] hover:text-white hover:bg-[#1f2b48]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReminderSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#86948a] mb-1">Reminder Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q4 State Franchise Tax Filing / Call Clark Construction on Invoiced AR"
                  className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2.5 text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#86948a] mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ReminderCategory)}
                    className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#4edea3]"
                  >
                    <option value="tax_compliance">Tax & Statutory Compliance</option>
                    <option value="client_calls">Client Calls & Relationship</option>
                    <option value="bids_rfis">Bids, RFIs & Pre-Con Deadlines</option>
                    <option value="payroll_hr">Payroll, HR & Subcontractors</option>
                    <option value="finance_legal">Corporate Finance, Debt & Legal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#86948a] mb-1">Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as ReminderPriority)}
                    className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#4edea3]"
                  >
                    <option value="URGENT">URGENT (Action Required)</option>
                    <option value="HIGH">HIGH Priority</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#86948a] mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#86948a] mb-1">Cutoff Time</label>
                  <input
                    type="text"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    placeholder="e.g. 5:00 PM EST"
                    className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#86948a] mb-1">Frequency</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value as ReminderFrequency)}
                    className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#4edea3]"
                  >
                    <option value="one_time">One-Time</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                    <option value="bi_weekly">Bi-Weekly</option>
                  </select>
                </div>
              </div>

              {/* Conditional Fields based on category */}
              {newCategory === 'tax_compliance' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#0b1326] rounded-xl border border-[#222a3d]">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#c4b5fd] mb-1">Tax Form / Return</label>
                    <input
                      type="text"
                      value={newTaxForm}
                      onChange={(e) => setNewTaxForm(e.target.value)}
                      placeholder="e.g. Form 1120-S, Form 941"
                      className="w-full bg-[#131b2e] border border-[#222a3d] rounded p-2 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#c4b5fd] mb-1">Statutory Agency</label>
                    <input
                      type="text"
                      value={newStatutoryAgency}
                      onChange={(e) => setNewStatutoryAgency(e.target.value)}
                      placeholder="e.g. IRS EFTPS, State Comptroller"
                      className="w-full bg-[#131b2e] border border-[#222a3d] rounded p-2 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                    />
                  </div>
                </div>
              )}

              {newCategory === 'client_calls' && (
                <div className="p-3 bg-[#0b1326] rounded-xl border border-[#222a3d] space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#38bdf8] mb-1">Client Company</label>
                      <input
                        type="text"
                        value={newEntityName}
                        onChange={(e) => setNewEntityName(e.target.value)}
                        placeholder="e.g. Turner Construction"
                        className="w-full bg-[#131b2e] border border-[#222a3d] rounded p-2 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#38bdf8] mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={newContactPerson}
                        onChange={(e) => setNewContactPerson(e.target.value)}
                        placeholder="e.g. David Miller (VP Pre-Con)"
                        className="w-full bg-[#131b2e] border border-[#222a3d] rounded p-2 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#38bdf8] mb-1">Direct Phone</label>
                      <input
                        type="text"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        placeholder="+1 (555) 019-2000"
                        className="w-full bg-[#131b2e] border border-[#222a3d] rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-[#38bdf8]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#38bdf8] mb-1">Email</label>
                      <input
                        type="email"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        placeholder="dmiller@client.com"
                        className="w-full bg-[#131b2e] border border-[#222a3d] rounded p-2 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#86948a] mb-1">Assigned Executive / Lead</label>
                  <input
                    type="text"
                    value={newAssigneeName}
                    onChange={(e) => setNewAssigneeName(e.target.value)}
                    placeholder="e.g. Sarah Lin, CPA"
                    className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#86948a] mb-1">
                    Liability or Bid Value ($ optional)
                  </label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="e.g. 42500"
                    className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2 text-xs text-[#4edea3] font-mono focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#86948a] mb-1">Detailed Description & Instructions</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide statutory guidelines, RFI blockers, or specific discussion topics..."
                  className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2 text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#86948a] mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Taxes, IRS, Turner, Collections"
                  className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222a3d]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#1f2b48] text-xs font-semibold text-[#86948a] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#4edea3] hover:bg-[#3ec48e] text-[#0b1326] text-xs font-bold transition-colors cursor-pointer"
                >
                  Add Reminder
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
