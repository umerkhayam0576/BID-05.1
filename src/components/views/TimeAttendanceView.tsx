import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Search,
  Download,
  Check
} from 'lucide-react';

interface TimesheetEntry {
  id: string;
  estimator: string;
  project: string;
  weekEnding: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  total: number;
  billable: boolean;
  status: 'Approved' | 'Submitted';
}

const INITIAL_TIMESHEETS: TimesheetEntry[] = [
  {
    id: 'TS-881',
    estimator: 'Marcus Vance',
    project: 'Metro Heights Tower (BID-884)',
    weekEnding: '2024-08-23',
    mon: 8,
    tue: 8.5,
    wed: 8,
    thu: 9,
    fri: 7.5,
    total: 41,
    billable: true,
    status: 'Approved',
  },
  {
    id: 'TS-882',
    estimator: 'Elena Rostova',
    project: 'St. Jude Expansion 3D BIM (BID-912)',
    weekEnding: '2024-08-23',
    mon: 8,
    tue: 8,
    wed: 8,
    thu: 8,
    fri: 8,
    total: 40,
    billable: true,
    status: 'Approved',
  },
  {
    id: 'TS-883',
    estimator: 'Umer Khayam',
    project: 'Biotech Innovation Lab (BID-779)',
    weekEnding: '2024-08-23',
    mon: 8.5,
    tue: 8,
    wed: 8.5,
    thu: 8,
    fri: 8,
    total: 41,
    billable: true,
    status: 'Submitted',
  },
  {
    id: 'TS-884',
    estimator: 'Syed Ahmed',
    project: 'Harbor Logistics Warehouse (BID-955)',
    weekEnding: '2024-08-23',
    mon: 7.5,
    tue: 8,
    wed: 7.5,
    thu: 8,
    fri: 7,
    total: 38,
    billable: true,
    status: 'Submitted',
  },
  {
    id: 'TS-885',
    estimator: 'Rachel Green',
    project: 'Pre-Con Estimating Operations Core',
    weekEnding: '2024-08-23',
    mon: 8,
    tue: 8,
    wed: 8,
    thu: 8,
    fri: 8,
    total: 40,
    billable: false,
    status: 'Approved',
  },
];

export const TimeAttendanceView: React.FC = () => {
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>(INITIAL_TIMESHEETS);
  const [allApproved, setAllApproved] = useState(false);

  const totalHours = timesheets.reduce((sum, t) => sum + t.total, 0);
  const billableHours = timesheets.filter((t) => t.billable).reduce((sum, t) => sum + t.total, 0);
  const billablePercentage = Math.round((billableHours / totalHours) * 100);

  const handleApproveAll = () => {
    setTimesheets((prev) =>
      prev.map((t) => ({ ...t, status: 'Approved' }))
    );
    setAllApproved(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>WORKFORCE</span>
            <span>/</span>
            <span>TIME & BILLABLE HOURS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Time & Attendance Tracker
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Estimator time allocations, billable utilization rates, and client project hours
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(timesheets, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", "bid_exact_timesheets.json");
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#86948a]" />
            <span>Export Timesheets</span>
          </button>
          <button
            onClick={handleApproveAll}
            disabled={allApproved}
            className={`h-9 px-4 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              allApproved
                ? 'bg-[#171f33] text-[#86948a] border border-[#2d3449] cursor-not-allowed'
                : 'bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824]'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{allApproved ? 'All Timesheets Approved' : 'Approve All Timesheets'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Total Logged (Week 34)
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalHours} Hours</div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            Target: 200h across active crew
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Billable Utilization
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">{billablePercentage}%</div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Benchmark threshold: &gt;85%
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Overtime Variance
          </div>
          <div className="text-2xl font-bold font-mono text-white">2.0 Hours</div>
          <div className="text-[11px] text-[#adc6ff] mt-2">
            Normal operational bounds
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Approval Clearance
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            {timesheets.filter((t) => t.status === 'Approved').length} / {timesheets.length}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            {allApproved ? '100% Signed Off' : 'Pending Manager Sign-off'}
          </div>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] uppercase text-[10px] tracking-wider border-b border-[#222a3d]">
              <tr>
                <th className="p-3">Estimator</th>
                <th className="p-3">Assigned Scope / Project</th>
                <th className="p-3 text-center">Mon</th>
                <th className="p-3 text-center">Tue</th>
                <th className="p-3 text-center">Wed</th>
                <th className="p-3 text-center">Thu</th>
                <th className="p-3 text-center">Fri</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Type</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d] text-[#dae2fd]">
              {timesheets.map((ts) => (
                <tr key={ts.id} className="hover:bg-[#171f33]/70 transition-colors">
                  <td className="p-3 font-sans font-semibold text-white">{ts.estimator}</td>
                  <td className="p-3 font-sans text-xs text-[#bbcabf]">{ts.project}</td>
                  <td className="p-3 text-center text-[#86948a]">{ts.mon}</td>
                  <td className="p-3 text-center text-[#86948a]">{ts.tue}</td>
                  <td className="p-3 text-center text-[#86948a]">{ts.wed}</td>
                  <td className="p-3 text-center text-[#86948a]">{ts.thu}</td>
                  <td className="p-3 text-center text-[#86948a]">{ts.fri}</td>
                  <td className="p-3 text-right font-bold text-white">{ts.total}h</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        ts.billable ? 'bg-[#4edea3]/10 text-[#4edea3]' : 'bg-[#86948a]/10 text-[#86948a]'
                      }`}
                    >
                      {ts.billable ? 'Billable' : 'Overhead'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        ts.status === 'Approved'
                          ? 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20'
                          : 'bg-[#e0b44a]/10 text-[#e0b44a] border border-[#e0b44a]/20'
                      }`}
                    >
                      {ts.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
