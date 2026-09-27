import React, { useState } from 'react';
import {
  Users,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Plus,
  Search,
  Download,
  AlertCircle
} from 'lucide-react';

interface EmployeeRecord {
  id: string;
  name: string;
  role: string;
  department: string;
  type: 'Full-Time W-2' | 'Part-Time W-2';
  annualSalary: number;
  periodGross: number;
  ytdGross: number;
  directDeposit: string;
  status: 'Active' | 'On Leave';
}

const INITIAL_EMPLOYEES: EmployeeRecord[] = [
  {
    id: 'EMP-101',
    name: 'Marcus Vance',
    role: 'Principal Chief Estimator',
    department: 'Pre-Construction Direct',
    type: 'Full-Time W-2',
    annualSalary: 185000,
    periodGross: 7708,
    ytdGross: 123328,
    directDeposit: 'Chase Bank ••8192 (Verified)',
    status: 'Active',
  },
  {
    id: 'EMP-102',
    name: 'Elena Rostova',
    role: 'Senior BIM / VDC Specialist',
    department: 'Virtual Design & Construction',
    type: 'Full-Time W-2',
    annualSalary: 155000,
    periodGross: 6458,
    ytdGross: 103328,
    directDeposit: 'Wells Fargo ••4019 (Verified)',
    status: 'Active',
  },
  {
    id: 'EMP-103',
    name: 'Umer Khayam',
    role: 'Lead Commercial Estimator & Tech',
    department: 'Estimating Operations',
    type: 'Full-Time W-2',
    annualSalary: 165000,
    periodGross: 6875,
    ytdGross: 110000,
    directDeposit: 'Bank of America ••9410 (Verified)',
    status: 'Active',
  },
  {
    id: 'EMP-104',
    name: 'Syed Ahmed',
    role: 'Senior Civil & Structural Estimator',
    department: 'Pre-Construction Direct',
    type: 'Full-Time W-2',
    annualSalary: 145000,
    periodGross: 6041,
    ytdGross: 96656,
    directDeposit: 'Citi ••1298 (Verified)',
    status: 'Active',
  },
  {
    id: 'EMP-105',
    name: 'Rachel Green',
    role: 'Operations & Bid Coordinator',
    department: 'Client Relations & Bids',
    type: 'Full-Time W-2',
    annualSalary: 95000,
    periodGross: 3958,
    ytdGross: 63328,
    directDeposit: 'Chase Bank ••5501 (Verified)',
    status: 'Active',
  },
  {
    id: 'EMP-106',
    name: 'Liam Scott',
    role: 'Junior MEP Quantity Surveyor',
    department: 'Pre-Construction Direct',
    type: 'Full-Time W-2',
    annualSalary: 85000,
    periodGross: 3541,
    ytdGross: 56656,
    directDeposit: 'PNC Bank ••7712 (Verified)',
    status: 'Active',
  },
];

export const PayrollView: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeRecord[]>(INITIAL_EMPLOYEES);
  const [payrollRan, setPayrollRan] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const totalPeriodGross = employees.reduce((sum, e) => sum + e.periodGross, 0);

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRunPayroll = () => {
    setPayrollRan(true);
    setTimeout(() => {
      alert('Bi-weekly Payroll Cycle for Bid Exact LLC processed successfully! Direct deposit ACH batch generated.');
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>PEOPLE & TALENT</span>
            <span>/</span>
            <span>W-2 PAYROLL REGISTER</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Employees & Payroll Operations
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Bi-weekly direct deposit disbursements, tax withholdings, and staff compensation ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(employees, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", "bid_exact_payroll_register.json");
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#86948a]" />
            <span>Export Payroll (CSV)</span>
          </button>
          <button
            onClick={handleRunPayroll}
            disabled={payrollRan}
            className={`h-9 px-4 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              payrollRan
                ? 'bg-[#171f33] text-[#86948a] border border-[#2d3449] cursor-not-allowed'
                : 'bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{payrollRan ? 'Payroll Cycle Reconciled' : 'Process Bi-Weekly Payroll'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Current Period Gross
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${totalPeriodGross.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            Cycle: Aug 16 - Aug 31, 2024
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Active W-2 Staff
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {employees.length} Full-Time
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            100% Direct Deposit enrolled
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            YTD Payroll Disbursed
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            $553,296
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            Federal/State Taxes Reconciled
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Next ACH Disbursement
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            Aug 31, 2024
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Status: Fully Funded in Reserve
          </div>
        </div>
      </div>

      {/* Employee Roster Table */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#222a3d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#86948a] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search employee by name, role, or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
            />
          </div>
          <div className="text-xs font-mono text-[#86948a]">
            Showing {filteredEmployees.length} of {employees.length} Staff Members
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] uppercase text-[10px] tracking-wider border-b border-[#222a3d]">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Department</th>
                <th className="p-3">Annual Salary</th>
                <th className="p-3 text-right">Period Gross</th>
                <th className="p-3 text-right">YTD Total</th>
                <th className="p-3">Disbursement Routing</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d] text-[#dae2fd]">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#171f33]/70 transition-colors">
                  <td className="p-3 font-sans">
                    <div className="font-semibold text-white">{emp.name}</div>
                    <div className="text-[11px] font-mono text-[#86948a]">{emp.role}</div>
                  </td>
                  <td className="p-3 text-[#bbcabf] font-sans">{emp.department}</td>
                  <td className="p-3 font-semibold text-white">
                    ${emp.annualSalary.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-bold text-[#4edea3]">
                    ${emp.periodGross.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-[#86948a]">
                    ${emp.ytdGross.toLocaleString()}
                  </td>
                  <td className="p-3 text-[11px] text-[#86948a]">{emp.directDeposit}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20">
                      {emp.status}
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
