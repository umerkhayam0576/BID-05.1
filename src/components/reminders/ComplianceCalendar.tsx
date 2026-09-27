import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Landmark,
  PhoneCall,
  FileText,
  Users,
  DollarSign,
  Plus,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  CalendarDays,
  Sparkles,
  X,
  Building2,
  Check,
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';
import {
  CompanyReminderItem,
  ReminderCategory,
  ReminderPriority,
  ReminderStatus
} from '../../types';
import { NavTabId } from '../Sidebar';

interface ComplianceCalendarProps {
  reminders: CompanyReminderItem[];
  onUpdateReminder: (updated: CompanyReminderItem) => void;
  onOpenCallModal: (reminder: CompanyReminderItem) => void;
  onOpenTaxModal: (reminder: CompanyReminderItem) => void;
  onAddNewReminderForDate: (dateStr: string) => void;
  onNavigateTab: (tab: NavTabId) => void;
}

export const ComplianceCalendar: React.FC<ComplianceCalendarProps> = ({
  reminders,
  onUpdateReminder,
  onOpenCallModal,
  onOpenTaxModal,
  onAddNewReminderForDate,
  onNavigateTab,
}) => {
  // Navigation State - defaults to September 2024 (the core compliance cycle in data)
  const [currentYear, setCurrentYear] = useState<number>(2024);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 0-indexed: 8 = September

  // Sub-view mode: 'calendar' (grid) vs 'timeline' (milestone roadmap)
  const [calendarSubMode, setCalendarSubMode] = useState<'grid' | 'timeline'>('grid');

  // Filter states within calendar
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<ReminderCategory | 'all'>('all');
  const [filterUrgentOnly, setFilterUrgentOnly] = useState<boolean>(false);
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);

  // Selected Day for Detail Drawer/Modal
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>('2024-09-15');
  const [isDayDrawerOpen, setIsDayDrawerOpen] = useState<boolean>(false);

  // Quick snooze menu state
  const [snoozeMenuReminderId, setSnoozeMenuReminderId] = useState<string | null>(null);

  // Helper names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNamesShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToMonth = (year: number, monthIndex: number) => {
    setCurrentYear(year);
    setCurrentMonth(monthIndex);
  };

  // Category visual metadata
  const getCategoryMeta = (cat: ReminderCategory) => {
    switch (cat) {
      case 'tax_compliance':
        return {
          label: 'Tax & Statutory',
          pillBg: 'bg-[#a78bfa]/15 text-[#c4b5fd] border-[#a78bfa]/40 hover:bg-[#a78bfa]/25',
          chipBg: 'bg-[#8b5cf6]/20 text-[#c4b5fd] border-[#a78bfa]/30',
          dotBg: 'bg-[#a78bfa]',
          icon: Landmark,
        };
      case 'client_calls':
        return {
          label: 'Client Calls',
          pillBg: 'bg-[#38bdf8]/15 text-[#7dd3fc] border-[#38bdf8]/40 hover:bg-[#38bdf8]/25',
          chipBg: 'bg-[#0284c7]/20 text-[#7dd3fc] border-[#38bdf8]/30',
          dotBg: 'bg-[#38bdf8]',
          icon: PhoneCall,
        };
      case 'bids_rfis':
        return {
          label: 'Bids & RFIs',
          pillBg: 'bg-[#4edea3]/15 text-[#6ee7b7] border-[#4edea3]/40 hover:bg-[#4edea3]/25',
          chipBg: 'bg-[#059669]/20 text-[#6ee7b7] border-[#4edea3]/30',
          dotBg: 'bg-[#4edea3]',
          icon: FileText,
        };
      case 'payroll_hr':
        return {
          label: 'Payroll & HR',
          pillBg: 'bg-[#fbbf24]/15 text-[#fde047] border-[#fbbf24]/40 hover:bg-[#fbbf24]/25',
          chipBg: 'bg-[#d97706]/20 text-[#fde047] border-[#fbbf24]/30',
          dotBg: 'bg-[#fbbf24]',
          icon: Users,
        };
      case 'finance_legal':
        return {
          label: 'Finance & Legal',
          pillBg: 'bg-[#f43f5e]/15 text-[#fda4af] border-[#f43f5e]/40 hover:bg-[#f43f5e]/25',
          chipBg: 'bg-[#e11d48]/20 text-[#fda4af] border-[#f43f5e]/30',
          dotBg: 'bg-[#f43f5e]',
          icon: ShieldAlert,
        };
    }
  };

  // Group reminders by due date
  const remindersByDate = useMemo(() => {
    const map = new Map<string, CompanyReminderItem[]>();
    reminders.forEach((rem) => {
      // Apply filters
      if (activeCategoryFilter !== 'all' && rem.category !== activeCategoryFilter) {
        return;
      }
      if (filterUrgentOnly && rem.priority !== 'URGENT') {
        return;
      }
      if (hideCompleted && rem.status === 'completed') {
        return;
      }

      const list = map.get(rem.dueDate) || [];
      list.push(rem);
      map.set(rem.dueDate, list);
    });
    return map;
  }, [reminders, activeCategoryFilter, filterUrgentOnly, hideCompleted]);

  // High-level compliance statistics for the currently displayed month
  const monthStats = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const inMonthReminders = reminders.filter((r) => r.dueDate.startsWith(monthPrefix));

    const total = inMonthReminders.length;
    const completed = inMonthReminders.filter((r) => r.status === 'completed').length;
    const urgent = inMonthReminders.filter((r) => r.priority === 'URGENT' && r.status !== 'completed').length;
    const taxItems = inMonthReminders.filter((r) => r.category === 'tax_compliance');
    const totalTaxes = taxItems.reduce((acc, r) => acc + (r.monetaryAmount || 0), 0);
    const clientCalls = inMonthReminders.filter((r) => r.category === 'client_calls').length;
    const bidDeadlines = inMonthReminders.filter((r) => r.category === 'bids_rfis').length;

    return {
      total,
      completed,
      urgent,
      totalTaxes,
      taxCount: taxItems.length,
      clientCalls,
      bidDeadlines,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [reminders, currentYear, currentMonth]);

  // Calendar Grid Calculation
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    interface CalendarDayCell {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      items: CompanyReminderItem[];
      urgentCount: number;
      totalLiability: number;
      isWeekend: boolean;
    }

    const cells: CalendarDayCell[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const items = remindersByDate.get(dateStr) || [];
      const urgentCount = items.filter((r) => r.priority === 'URGENT' && r.status !== 'completed').length;
      const totalLiability = items.reduce((sum, r) => sum + (r.monetaryAmount || 0), 0);

      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: false,
        items,
        urgentCount,
        totalLiability,
        isWeekend: (firstDayIndex - 1 - i) % 7 === 0 || (firstDayIndex - 1 - i) % 7 === 6,
      });
    }

    // Days of current month
    // Today reference: 2024-09-20 (or current real date)
    const todayStr = '2024-09-20';

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const items = remindersByDate.get(dateStr) || [];
      const urgentCount = items.filter((r) => r.priority === 'URGENT' && r.status !== 'completed').length;
      const totalLiability = items.reduce((sum, r) => sum + (r.monetaryAmount || 0), 0);
      const dayOfWeek = (firstDayIndex + d - 1) % 7;

      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        items,
        urgentCount,
        totalLiability,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    // Trailing days from next month to complete 5 or 6 rows (multiple of 7)
    const totalSlots = Math.ceil(cells.length / 7) * 7;
    const remaining = totalSlots - cells.length;
    const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;

    for (let d = 1; d <= remaining; d++) {
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const items = remindersByDate.get(dateStr) || [];
      const urgentCount = items.filter((r) => r.priority === 'URGENT' && r.status !== 'completed').length;
      const totalLiability = items.reduce((sum, r) => sum + (r.monetaryAmount || 0), 0);

      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
        items,
        urgentCount,
        totalLiability,
        isWeekend: (cells.length % 7 === 0 || cells.length % 7 === 6),
      });
    }

    return cells;
  }, [currentYear, currentMonth, remindersByDate]);

  // Selected Day Items for Drawer/Modal
  const selectedDayItems = useMemo(() => {
    if (!selectedDateStr) return [];
    return reminders.filter((r) => r.dueDate === selectedDateStr);
  }, [reminders, selectedDateStr]);

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
    const current = new Date(reminder.dueDate);
    current.setDate(current.getDate() + days);
    const dateStr = current.toISOString().slice(0, 10);

    const updated: CompanyReminderItem = {
      ...reminder,
      status: 'snoozed',
      snoozedUntil: dateStr,
      dueDate: dateStr,
    };
    onUpdateReminder(updated);
    setSnoozeMenuReminderId(null);
  };

  // Format date readable
  const formatReadableDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // High-level timeline milestone groups (Chronological weeks)
  const timelineWeeks = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const inMonthReminders = reminders
      .filter((r) => r.dueDate.startsWith(monthPrefix))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    // Group into 4-5 calendar weekly segments
    const weekGroups: { title: string; range: string; items: CompanyReminderItem[] }[] = [
      {
        title: 'Week 1: Early Cycle Readiness',
        range: `${monthNames[currentMonth]} 01 – 07`,
        items: [],
      },
      {
        title: 'Week 2: Mid-Cycle Operational Filings',
        range: `${monthNames[currentMonth]} 08 – 14`,
        items: [],
      },
      {
        title: 'Week 3: Mid-Month Taxes & Client Key Calls',
        range: `${monthNames[currentMonth]} 15 – 21`,
        items: [],
      },
      {
        title: 'Week 4: Major Tender Submissions & Payroll ACH',
        range: `${monthNames[currentMonth]} 22 – 28`,
        items: [],
      },
      {
        title: 'Week 5: Month-End Compliance Reconciliation',
        range: `${monthNames[currentMonth]} 29 – 31`,
        items: [],
      },
    ];

    inMonthReminders.forEach((rem) => {
      const day = parseInt(rem.dueDate.split('-')[2], 10);
      if (day <= 7) weekGroups[0].items.push(rem);
      else if (day <= 14) weekGroups[1].items.push(rem);
      else if (day <= 21) weekGroups[2].items.push(rem);
      else if (day <= 28) weekGroups[3].items.push(rem);
      else weekGroups[4].items.push(rem);
    });

    return weekGroups;
  }, [reminders, currentYear, currentMonth, monthNames]);

  return (
    <div className="space-y-5">
      {/* 1. High-Level Compliance Horizon Bar */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-56 h-56 bg-[#4edea3]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-[#4edea3]" />
              <span>Executive Compliance Calendar</span>
            </h2>
            <p className="text-xs text-[#86948a] mt-0.5 max-w-2xl">
              Statutory filings, client calls, tender deadlines, and banking cutoffs in one view.
            </p>
          </div>

          {/* Quick Month Quarter Nav Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleJumpToMonth(2024, 8)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
                currentMonth === 8 && currentYear === 2024
                  ? 'bg-[#4edea3] text-[#0b1326] border-[#4edea3] shadow-sm font-bold'
                  : 'bg-[#0b1326] text-[#dae2fd] border-[#222a3d] hover:border-[#4edea3]/40'
              }`}
            >
              Sep 2024 · Taxes
            </button>
            <button
              onClick={() => handleJumpToMonth(2024, 9)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
                currentMonth === 9 && currentYear === 2024
                  ? 'bg-[#4edea3] text-[#0b1326] border-[#4edea3] shadow-sm font-bold'
                  : 'bg-[#0b1326] text-[#dae2fd] border-[#222a3d] hover:border-[#4edea3]/40'
              }`}
            >
              Oct 2024 · Franchise
            </button>
            <button
              onClick={() => handleJumpToMonth(2024, 10)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
                currentMonth === 10 && currentYear === 2024
                  ? 'bg-[#4edea3] text-[#0b1326] border-[#4edea3] shadow-sm font-bold'
                  : 'bg-[#0b1326] text-[#dae2fd] border-[#222a3d] hover:border-[#4edea3]/40'
              }`}
            >
              Nov 2024 · 1099 prep
            </button>
            <button
              onClick={() => handleJumpToMonth(2024, 11)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
                currentMonth === 11 && currentYear === 2024
                  ? 'bg-[#4edea3] text-[#0b1326] border-[#4edea3] shadow-sm font-bold'
                  : 'bg-[#0b1326] text-[#dae2fd] border-[#222a3d] hover:border-[#4edea3]/40'
              }`}
            >
              Dec 2024 · Year-end
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip for this Month */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-[#222a3d]/80 text-xs">
          <div className="p-2.5 rounded-lg bg-[#0b1326]/80 border border-[#222a3d]">
            <div className="text-[10px] uppercase font-mono text-[#86948a] flex items-center justify-between">
              <span>Statutory Taxes Due</span>
              <Landmark className="w-3.5 h-3.5 text-[#a78bfa]" />
            </div>
            <div className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
              ${monthStats.totalTaxes.toLocaleString()}
            </div>
            <div className="text-[10px] text-[#a78bfa] font-mono">
              {monthStats.taxCount} filings this month
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0b1326]/80 border border-[#222a3d]">
            <div className="text-[10px] uppercase font-mono text-[#86948a] flex items-center justify-between">
              <span>Urgent Deadlines</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#f43f5e]" />
            </div>
            <div className="text-base sm:text-lg font-bold text-[#f43f5e] font-mono mt-0.5 flex items-center gap-1.5">
              <span>{monthStats.urgent}</span>
              {monthStats.urgent > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-ping" />
              )}
            </div>
            <div className="text-[10px] text-[#86948a]">Immediate action required</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0b1326]/80 border border-[#222a3d]">
            <div className="text-[10px] uppercase font-mono text-[#86948a] flex items-center justify-between">
              <span>Client Touchpoints</span>
              <PhoneCall className="w-3.5 h-3.5 text-[#38bdf8]" />
            </div>
            <div className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
              {monthStats.clientCalls}
            </div>
            <div className="text-[10px] text-[#38bdf8]">Bids & AR collections</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0b1326]/80 border border-[#222a3d]">
            <div className="text-[10px] uppercase font-mono text-[#86948a] flex items-center justify-between">
              <span>Tender & RFI Cutoffs</span>
              <FileText className="w-3.5 h-3.5 text-[#4edea3]" />
            </div>
            <div className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
              {monthStats.bidDeadlines}
            </div>
            <div className="text-[10px] text-[#4edea3]">Estimating & takeoffs</div>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-2.5 rounded-lg bg-[#0b1326]/80 border border-[#222a3d]">
            <div className="text-[10px] uppercase font-mono text-[#86948a] flex items-center justify-between">
              <span>Month Compliance Score</span>
              <span className="text-[#4edea3] font-bold">{monthStats.completionRate}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#171f33] overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-[#38bdf8] to-[#4edea3] rounded-full transition-all duration-500"
                style={{ width: `${monthStats.completionRate}%` }}
              />
            </div>
            <div className="text-[10px] text-[#86948a] mt-1 flex justify-between">
              <span>{monthStats.completed} completed</span>
              <span>{monthStats.total - monthStats.completed} pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Calendar Controls & Category Legend Toolbar */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Month Stepper & Date Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#0b1326] border border-[#222a3d] rounded-lg p-1">
              <button
                id="btn-calendar-prev-month"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-1.5 rounded hover:bg-[#1f2b48] text-[#86948a] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 font-mono font-bold text-sm text-white min-w-[140px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </div>
              <button
                id="btn-calendar-next-month"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1.5 rounded hover:bg-[#1f2b48] text-[#86948a] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => handleJumpToMonth(2024, 8)}
              className="px-2.5 py-1.5 rounded-lg bg-[#1f2b48] hover:bg-[#28375c] text-[11px] font-mono text-[#4edea3] border border-[#222a3d] transition-colors cursor-pointer"
            >
              Today (Sept 20)
            </button>
          </div>

          {/* Submode Switcher & Quick Add */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher: Grid vs Timeline */}
            <div className="flex items-center bg-[#0b1326] p-1 border border-[#222a3d] rounded-lg">
              <button
                id="btn-switch-calendar-grid"
                onClick={() => setCalendarSubMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
                  calendarSubMode === 'grid'
                    ? 'bg-[#1f2b48] text-[#4edea3] font-bold shadow-sm'
                    : 'text-[#86948a] hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Month Grid</span>
              </button>
              <button
                id="btn-switch-compliance-timeline"
                onClick={() => setCalendarSubMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
                  calendarSubMode === 'timeline'
                    ? 'bg-[#1f2b48] text-[#4edea3] font-bold shadow-sm'
                    : 'text-[#86948a] hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Timeline Roadmap</span>
              </button>
            </div>

            <button
              id="btn-calendar-quick-add"
              onClick={() => onAddNewReminderForDate(selectedDateStr || '2024-09-20')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4edea3] hover:bg-[#3ec48e] text-[#0b1326] text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule on Date</span>
            </button>
          </div>
        </div>

        {/* Category Legend & Filter Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#222a3d] text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[#86948a] text-[11px] font-mono mr-1">Filter View:</span>

            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${
                activeCategoryFilter === 'all'
                  ? 'bg-[#dae2fd] text-[#0b1326] border-[#dae2fd] font-bold'
                  : 'bg-[#0b1326] text-[#86948a] border-[#222a3d] hover:text-white'
              }`}
            >
              All Types ({reminders.length})
            </button>

            <button
              onClick={() => setActiveCategoryFilter('tax_compliance')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer border flex items-center gap-1 ${
                activeCategoryFilter === 'tax_compliance'
                  ? 'bg-[#a78bfa] text-[#0b1326] border-[#a78bfa] font-bold'
                  : 'bg-[#0b1326] text-[#c4b5fd] border-[#222a3d] hover:border-[#a78bfa]/40'
              }`}
            >
              <Landmark className="w-3 h-3" />
              <span>Taxes & Statutory</span>
            </button>

            <button
              onClick={() => setActiveCategoryFilter('client_calls')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer border flex items-center gap-1 ${
                activeCategoryFilter === 'client_calls'
                  ? 'bg-[#38bdf8] text-[#0b1326] border-[#38bdf8] font-bold'
                  : 'bg-[#0b1326] text-[#7dd3fc] border-[#222a3d] hover:border-[#38bdf8]/40'
              }`}
            >
              <PhoneCall className="w-3 h-3" />
              <span>Client Calls</span>
            </button>

            <button
              onClick={() => setActiveCategoryFilter('bids_rfis')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer border flex items-center gap-1 ${
                activeCategoryFilter === 'bids_rfis'
                  ? 'bg-[#4edea3] text-[#0b1326] border-[#4edea3] font-bold'
                  : 'bg-[#0b1326] text-[#6ee7b7] border-[#222a3d] hover:border-[#4edea3]/40'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Bids & RFIs</span>
            </button>

            <button
              onClick={() => setActiveCategoryFilter('payroll_hr')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer border flex items-center gap-1 ${
                activeCategoryFilter === 'payroll_hr'
                  ? 'bg-[#fbbf24] text-[#0b1326] border-[#fbbf24] font-bold'
                  : 'bg-[#0b1326] text-[#fde047] border-[#222a3d] hover:border-[#fbbf24]/40'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Payroll & HR</span>
            </button>

            <button
              onClick={() => setActiveCategoryFilter('finance_legal')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer border flex items-center gap-1 ${
                activeCategoryFilter === 'finance_legal'
                  ? 'bg-[#f43f5e] text-[#0b1326] border-[#f43f5e] font-bold'
                  : 'bg-[#0b1326] text-[#fda4af] border-[#222a3d] hover:border-[#f43f5e]/40'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Finance & Legal</span>
            </button>
          </div>

          {/* Urgent and Completed Toggles */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#86948a] hover:text-white">
              <input
                type="checkbox"
                checked={filterUrgentOnly}
                onChange={(e) => setFilterUrgentOnly(e.target.checked)}
                className="rounded border-[#222a3d] bg-[#0b1326] text-[#f43f5e] focus:ring-0 cursor-pointer"
              />
              <span className={filterUrgentOnly ? 'text-[#f43f5e] font-bold' : ''}>Urgent Only</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#86948a] hover:text-white">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
                className="rounded border-[#222a3d] bg-[#0b1326] text-[#4edea3] focus:ring-0 cursor-pointer"
              />
              <span>Hide Done</span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. CALENDAR SUB-VIEWS */}
      {calendarSubMode === 'grid' ? (
        /* ========================================================================= */
        /* SUB-VIEW A: FULL MONTH CALENDAR GRID                                      */
        /* ========================================================================= */
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl overflow-hidden shadow-xl">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-[#222a3d] bg-[#0b1326] text-center text-[11px] font-mono text-[#86948a] font-semibold">
            {dayNamesShort.map((day, idx) => (
              <div
                key={day}
                className={`py-2.5 uppercase tracking-wider ${
                  idx === 0 || idx === 6 ? 'text-[#86948a]/60 bg-[#070e1e]/40' : ''
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#222a3d] bg-[#0b1326]/40">
            {calendarCells.map((cell, idx) => {
              const hasItems = cell.items.length > 0;
              const isSelected = selectedDateStr === cell.dateStr;

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  id={`calendar-cell-${cell.dateStr}`}
                  onClick={() => {
                    setSelectedDateStr(cell.dateStr);
                    setIsDayDrawerOpen(true);
                  }}
                  className={`min-h-[110px] sm:min-h-[125px] p-2 flex flex-col justify-between transition-all cursor-pointer group relative ${
                    !cell.isCurrentMonth
                      ? 'bg-[#070e1e]/30 text-[#86948a]/40 hover:bg-[#0f172a]/40'
                      : cell.isWeekend
                      ? 'bg-[#0e1628]/50 hover:bg-[#152038]'
                      : 'bg-[#11192e] hover:bg-[#17223b]'
                  } ${
                    cell.isToday
                      ? 'ring-2 ring-[#4edea3] ring-inset bg-[#132238]'
                      : ''
                  } ${
                    isSelected
                      ? 'border-2 border-[#38bdf8] bg-[#16233d]'
                      : ''
                  }`}
                >
                  {/* Top Bar of Day Cell: Number & Badges */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-mono font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          cell.isToday
                            ? 'bg-[#4edea3] text-[#0b1326] font-extrabold shadow-sm'
                            : cell.isCurrentMonth
                            ? 'text-white group-hover:text-[#4edea3]'
                            : 'text-[#86948a]/50'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Urgent Pulse Dot */}
                      {cell.urgentCount > 0 && (
                        <span
                          title={`${cell.urgentCount} urgent compliance task(s) due`}
                          className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse"
                        />
                      )}
                    </div>

                    {/* Right side: daily total cash/tax liability or count */}
                    <div className="flex items-center gap-1">
                      {cell.totalLiability > 0 && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#a78bfa]/15 text-[#c4b5fd] font-semibold border border-[#a78bfa]/20 hidden sm:inline-block">
                          ${(cell.totalLiability / 1000).toFixed(0)}k
                        </span>
                      )}

                      {hasItems && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#1f2b48] text-[#dae2fd] border border-[#222a3d]">
                          {cell.items.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reminder Items Container (Pills) */}
                  <div className="space-y-1 overflow-hidden flex-1">
                    {cell.items.slice(0, 3).map((item) => {
                      const meta = getCategoryMeta(item.category);
                      const Icon = meta.icon;
                      const isCompleted = item.status === 'completed';
                      const isUrgent = item.priority === 'URGENT' && !isCompleted;

                      return (
                        <div
                          key={item.id}
                          title={`${item.title} (${item.category}) - ${item.priority}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(cell.dateStr);
                            setIsDayDrawerOpen(true);
                          }}
                          className={`px-1.5 py-1 rounded text-[10px] truncate border flex items-center gap-1 transition-all ${
                            isCompleted
                              ? 'bg-[#171f33]/40 text-[#86948a] border-[#222a3d] line-through opacity-60'
                              : isUrgent
                              ? 'bg-[#f43f5e]/15 text-[#fda4af] border-[#f43f5e]/40 font-bold'
                              : meta.chipBg
                          }`}
                        >
                          <Icon className="w-3 h-3 shrink-0" />
                          <span className="truncate font-medium">
                            {item.category === 'tax_compliance' && item.taxFormNumber
                              ? `${item.taxFormNumber.split('/')[0]} ${item.monetaryAmount ? `($${(item.monetaryAmount / 1000).toFixed(0)}k)` : ''}`
                              : item.category === 'client_calls' && item.relatedEntity
                              ? item.relatedEntity.name
                              : item.title}
                          </span>
                        </div>
                      );
                    })}

                    {/* More items indicator */}
                    {cell.items.length > 3 && (
                      <div className="text-[9px] font-mono text-[#86948a] hover:text-[#4edea3] text-center pt-0.5">
                        +{cell.items.length - 3} more...
                      </div>
                    )}
                  </div>

                  {/* Cell Hover Quick Action (Add to Date) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddNewReminderForDate(cell.dateStr);
                      }}
                      title="Add reminder on this date"
                      className="p-1 rounded bg-[#1f2b48] hover:bg-[#4edea3] text-[#dae2fd] hover:text-[#0b1326] transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* SUB-VIEW B: HIGH-LEVEL COMPLIANCE ROADMAP & MILESTONE TIMELINE           */
        /* ========================================================================= */
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-5 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#4edea3]" />
                Compliance Milestones & Gateways: {monthNames[currentMonth]} {currentYear}
              </h3>
              <p className="text-xs text-[#86948a] mt-0.5">
                Week-by-week sequencing of regulatory filings, critical phone calls, tender deliveries, and cash disbursements.
              </p>
            </div>
            <div className="text-xs font-mono text-[#86948a]">
              {reminders.filter((r) => r.dueDate.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)).length} Tasks Scheduled
            </div>
          </div>

          <div className="space-y-6">
            {timelineWeeks.map((week, wIdx) => {
              const weekLiability = week.items.reduce((s, r) => s + (r.monetaryAmount || 0), 0);
              const weekUrgent = week.items.filter((r) => r.priority === 'URGENT' && r.status !== 'completed').length;

              return (
                <div
                  key={wIdx}
                  className="bg-[#0b1326] border border-[#222a3d] rounded-xl p-4 transition-all hover:border-[#38bdf8]/40"
                >
                  {/* Week Group Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#222a3d] gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]" />
                      <h4 className="text-sm font-bold text-white">{week.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#171f33] text-[#dae2fd] border border-[#222a3d]">
                        {week.range}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      {weekUrgent > 0 && (
                        <span className="px-2 py-0.5 rounded bg-[#f43f5e]/15 text-[#f43f5e] font-bold border border-[#f43f5e]/30 animate-pulse">
                          {weekUrgent} Urgent
                        </span>
                      )}
                      {weekLiability > 0 && (
                        <span className="text-[#a78bfa] font-semibold">
                          Total Due: ${weekLiability.toLocaleString()}
                        </span>
                      )}
                      <span className="text-[#86948a]">{week.items.length} items</span>
                    </div>
                  </div>

                  {/* Week Items Timeline List */}
                  {week.items.length === 0 ? (
                    <div className="py-4 text-center text-xs text-[#86948a]/60 italic">
                      No statutory or relationship deadlines scheduled for this week.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#1f2b48] mt-2">
                      {week.items.map((rem) => {
                        const meta = getCategoryMeta(rem.category);
                        const Icon = meta.icon;
                        const isCompleted = rem.status === 'completed';
                        const isUrgent = rem.priority === 'URGENT' && !isCompleted;

                        return (
                          <div
                            key={rem.id}
                            className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                              isCompleted ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                                  isUrgent
                                    ? 'bg-[#f43f5e]/20 border-[#f43f5e]/40 text-[#f43f5e]'
                                    : meta.pillBg
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-white">
                                    {rem.dueDate}
                                  </span>
                                  {rem.dueTime && (
                                    <span className="text-[10px] font-mono text-[#86948a]">
                                      @ {rem.dueTime}
                                    </span>
                                  )}
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${meta.pillBg}`}>
                                    {meta.label}
                                  </span>
                                  {isUrgent && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/30 animate-pulse">
                                      URGENT
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30">
                                      COMPLETED
                                    </span>
                                  )}
                                </div>

                                <h5 className={`text-xs font-bold mt-1 ${isCompleted ? 'line-through text-[#86948a]' : 'text-white'}`}>
                                  {rem.title}
                                </h5>
                                <p className="text-[11px] text-[#86948a] mt-0.5 line-clamp-1 max-w-xl">
                                  {rem.description}
                                </p>

                                {rem.relatedEntity && (
                                  <div className="text-[10px] font-mono text-[#38bdf8] mt-1 flex items-center gap-1.5">
                                    <Building2 className="w-3 h-3" />
                                    <span>{rem.relatedEntity.name}</span>
                                    {rem.relatedEntity.contactPerson && (
                                      <span className="text-[#86948a]">• Contact: {rem.relatedEntity.contactPerson}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Action buttons */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              {rem.monetaryAmount && (
                                <div className="text-right mr-2">
                                  <div className="text-xs font-bold text-white font-mono">
                                    ${rem.monetaryAmount.toLocaleString()}
                                  </div>
                                  <div className="text-[9px] text-[#86948a]">Obligation</div>
                                </div>
                              )}

                              {rem.category === 'client_calls' ? (
                                <button
                                  onClick={() => onOpenCallModal(rem)}
                                  className="px-2.5 py-1 rounded bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] text-xs font-semibold border border-[#38bdf8]/30 cursor-pointer"
                                >
                                  Log Call
                                </button>
                              ) : rem.category === 'tax_compliance' ? (
                                <button
                                  onClick={() => onOpenTaxModal(rem)}
                                  className="px-2.5 py-1 rounded bg-[#a78bfa]/15 hover:bg-[#a78bfa]/25 text-[#c4b5fd] text-xs font-semibold border border-[#a78bfa]/30 cursor-pointer"
                                >
                                  Submit Filing
                                </button>
                              ) : rem.actionUrlOrTab ? (
                                <button
                                  onClick={() => onNavigateTab(rem.actionUrlOrTab as NavTabId)}
                                  className="px-2.5 py-1 rounded bg-[#1f2b48] hover:bg-[#28375c] text-[#dae2fd] text-xs font-semibold border border-[#222a3d] cursor-pointer"
                                >
                                  View
                                </button>
                              ) : null}

                              <button
                                onClick={() => handleToggleComplete(rem)}
                                title={isCompleted ? 'Mark Pending' : 'Mark Done'}
                                className={`w-7 h-7 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                                  isCompleted
                                    ? 'bg-[#4edea3] border-[#4edea3] text-[#0b1326]'
                                    : 'border-[#364366] hover:border-[#4edea3] text-transparent hover:text-[#4edea3]'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. DAY COMPLIANCE DETAIL DRAWER / POP-OUT */}
      {isDayDrawerOpen && selectedDateStr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#222a3d] bg-[#0b1326] flex items-center justify-between sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#4edea3] uppercase tracking-wider">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>COMPLIANCE SCHEDULE FOR DATE</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {formatReadableDate(selectedDateStr)}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-add-reminder-on-selected-date"
                  onClick={() => {
                    setIsDayDrawerOpen(false);
                    onAddNewReminderForDate(selectedDateStr);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4edea3] hover:bg-[#3ec48e] text-[#0b1326] text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Reminder</span>
                </button>

                <button
                  onClick={() => setIsDayDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-[#86948a] hover:text-white hover:bg-[#1f2b48] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 flex-1">
              {selectedDayItems.length === 0 ? (
                <div className="p-8 text-center bg-[#0b1326] border border-[#222a3d] rounded-xl">
                  <CalendarIcon className="w-10 h-10 text-[#86948a] mx-auto mb-2 opacity-50" />
                  <div className="text-sm font-bold text-white">No Reminders on this Date</div>
                  <p className="text-xs text-[#86948a] mt-1">
                    No statutory tax filings, client calls, or operational deliverables are scheduled for {selectedDateStr}.
                  </p>
                  <button
                    onClick={() => {
                      setIsDayDrawerOpen(false);
                      onAddNewReminderForDate(selectedDateStr);
                    }}
                    className="mt-4 px-3 py-1.5 rounded-lg bg-[#1f2b48] hover:bg-[#28375c] text-xs font-semibold text-[#4edea3] border border-[#222a3d] cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule Task for this Date</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#86948a] pb-1">
                    <span>{selectedDayItems.length} Compliance Task(s) Scheduled</span>
                    <span className="font-mono text-[#dae2fd]">
                      Total Financial Obligation: $
                      {selectedDayItems
                        .reduce((sum, r) => sum + (r.monetaryAmount || 0), 0)
                        .toLocaleString()}
                    </span>
                  </div>

                  {selectedDayItems.map((rem) => {
                    const meta = getCategoryMeta(rem.category);
                    const Icon = meta.icon;
                    const isCompleted = rem.status === 'completed';
                    const isUrgent = rem.priority === 'URGENT' && !isCompleted;

                    return (
                      <div
                        key={rem.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isCompleted
                            ? 'bg-[#0b1326]/60 border-[#222a3d] opacity-75'
                            : isUrgent
                            ? 'bg-[#151c2e] border-[#f43f5e]/40 shadow-sm'
                            : 'bg-[#0b1326] border-[#222a3d]'
                        }`}
                      >
                        {/* Item Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleToggleComplete(rem)}
                              className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                                isCompleted
                                  ? 'bg-[#4edea3] border-[#4edea3] text-[#0b1326]'
                                  : 'border-[#364366] hover:border-[#4edea3] text-transparent hover:text-[#4edea3]'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>

                            <div>
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.pillBg}`}>
                                  {meta.label}
                                </span>
                                {rem.priority === 'URGENT' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/30 animate-pulse">
                                    URGENT
                                  </span>
                                )}
                                {rem.dueTime && (
                                  <span className="text-[10px] font-mono text-[#86948a] flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {rem.dueTime}
                                  </span>
                                )}
                              </div>

                              <h4 className={`text-sm font-bold ${isCompleted ? 'line-through text-[#86948a]' : 'text-white'}`}>
                                {rem.title}
                              </h4>
                            </div>
                          </div>

                          {rem.monetaryAmount && (
                            <div className="text-right shrink-0">
                              <div className="text-sm font-mono font-bold text-white">
                                ${rem.monetaryAmount.toLocaleString()}
                              </div>
                              <div className="text-[9px] text-[#86948a]">Liability</div>
                            </div>
                          )}
                        </div>

                        {/* Description & Metadata */}
                        <p className="text-xs text-[#86948a] mt-2 pl-8 leading-relaxed">
                          {rem.description}
                        </p>

                        {/* Details Badges */}
                        <div className="mt-3 pl-8 flex flex-wrap items-center gap-3 text-[11px] text-[#86948a]">
                          {rem.statutoryAgency && (
                            <div className="flex items-center gap-1 text-[#c4b5fd]">
                              <Landmark className="w-3.5 h-3.5" />
                              <span>Agency: {rem.statutoryAgency}</span>
                            </div>
                          )}

                          {rem.relatedEntity && (
                            <div className="flex items-center gap-1 text-[#7dd3fc]">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{rem.relatedEntity.name}</span>
                              {rem.relatedEntity.contactPerson && (
                                <span>({rem.relatedEntity.contactPerson})</span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <span className="text-[#86948a]">Owner:</span>
                            <span className="text-white font-semibold">{rem.assignee.name}</span>
                            <span className="text-[10px] text-[#86948a]">({rem.assignee.role})</span>
                          </div>
                        </div>

                        {/* Action Buttons Toolbar */}
                        <div className="mt-4 pt-3 border-t border-[#1f2b48] flex flex-wrap items-center justify-between gap-2 pl-8">
                          <div className="flex items-center gap-2">
                            {/* Primary Contextual Action */}
                            {rem.category === 'client_calls' ? (
                              <button
                                onClick={() => {
                                  setIsDayDrawerOpen(false);
                                  onOpenCallModal(rem);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#38bdf8] hover:bg-[#0284c7] text-[#0b1326] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                <span>Log Client Call</span>
                              </button>
                            ) : rem.category === 'tax_compliance' ? (
                              <button
                                onClick={() => {
                                  setIsDayDrawerOpen(false);
                                  onOpenTaxModal(rem);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#a78bfa] hover:bg-[#8b5cf6] text-[#0b1326] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <Landmark className="w-3.5 h-3.5" />
                                <span>Record Tax Filing</span>
                              </button>
                            ) : null}

                            {rem.actionUrlOrTab && (
                              <button
                                onClick={() => {
                                  setIsDayDrawerOpen(false);
                                  onNavigateTab(rem.actionUrlOrTab as NavTabId);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#1f2b48] hover:bg-[#28375c] text-xs font-semibold text-[#dae2fd] border border-[#222a3d] cursor-pointer flex items-center gap-1.5"
                              >
                                <span>{rem.actionLabel || 'Open Module'}</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Secondary: Snooze & Toggle */}
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <button
                                onClick={() => setSnoozeMenuReminderId(snoozeMenuReminderId === rem.id ? null : rem.id)}
                                className="px-2.5 py-1 rounded bg-[#0b1326] hover:bg-[#171f33] text-[11px] text-[#86948a] hover:text-white border border-[#222a3d] cursor-pointer flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Snooze</span>
                              </button>

                              {snoozeMenuReminderId === rem.id && (
                                <div className="absolute right-0 bottom-full mb-1 bg-[#0b1326] border border-[#222a3d] rounded-lg shadow-xl p-1 z-20 w-32 space-y-0.5">
                                  <button
                                    onClick={() => handleSnooze(rem, 1)}
                                    className="w-full text-left px-2 py-1 text-[11px] text-[#dae2fd] hover:bg-[#1f2b48] rounded"
                                  >
                                    +1 Day
                                  </button>
                                  <button
                                    onClick={() => handleSnooze(rem, 3)}
                                    className="w-full text-left px-2 py-1 text-[11px] text-[#dae2fd] hover:bg-[#1f2b48] rounded"
                                  >
                                    +3 Days
                                  </button>
                                  <button
                                    onClick={() => handleSnooze(rem, 7)}
                                    className="w-full text-left px-2 py-1 text-[11px] text-[#dae2fd] hover:bg-[#1f2b48] rounded"
                                  >
                                    +1 Week
                                  </button>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleToggleComplete(rem)}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold border cursor-pointer ${
                                isCompleted
                                  ? 'bg-[#171f33] text-[#86948a] border-[#222a3d]'
                                  : 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30 hover:bg-[#4edea3]/25'
                              }`}
                            >
                              {isCompleted ? 'Re-open Task' : 'Mark as Done'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#222a3d] bg-[#0b1326] flex items-center justify-between text-xs text-[#86948a]">
              <span>Click on any item to view its details or record completion.</span>
              <button
                onClick={() => setIsDayDrawerOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#1f2b48] hover:bg-[#28375c] text-white font-semibold transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
