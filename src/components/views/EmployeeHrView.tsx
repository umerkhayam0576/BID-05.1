import React, { useState } from 'react';
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  Award,
  Clock,
  X,
  UserCheck,
  Briefcase,
  ChevronRight
} from 'lucide-react';
import { EmployeeItem } from '../../types';

interface EmployeeHrViewProps {
  employees: EmployeeItem[];
  onAddEmployee: (employee: EmployeeItem) => void;
  onNavigateToPayroll: () => void;
}

export const EmployeeHrView: React.FC<EmployeeHrViewProps> = ({
  employees,
  onAddEmployee,
  onNavigateToPayroll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeItem | null>(null);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

  // Form State for Onboarding
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState<EmployeeItem['department']>('Pre-Construction');
  const [type, setType] = useState<EmployeeItem['type']>('Full-Time W-2');
  const [annualSalary, setAnnualSalary] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [manager, setManager] = useState('Umer Khayam');
  const [directDeposit, setDirectDeposit] = useState('Chase Bank ••1029 (Verified)');

  // Calculations
  const totalEmployees = employees.length;
  const totalPayrollBurden = employees.reduce((sum, e) => sum + e.annualSalary, 0);
  const avgSalary = totalEmployees > 0 ? totalPayrollBurden / totalEmployees : 0;
  const activeCount = employees.filter((e) => e.status === 'Active').length;

  const departmentGroups: Record<string, string[]> = {
    Sales: ['Client Relations'],
    Services: ['Estimating Operations', 'VDC & BIM', 'Pre-Construction'],
  };

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === 'all' ||
      departmentGroups[departmentFilter]?.includes(e.department) ||
      e.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const salaryNum = parseFloat(annualSalary);
    if (isNaN(salaryNum) || salaryNum <= 0) return;

    const monthlyGross = salaryNum / 12;
    const fedTax = monthlyGross * 0.22;
    const stateTax = monthlyGross * 0.07;
    const fica = monthlyGross * 0.0765;
    const retirement = monthlyGross * 0.05;
    const health = 350;
    const net = monthlyGross - (fedTax + stateTax + fica + retirement + health);

    const names = name.trim().split(' ');
    const initials = names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();

    const newEmp: EmployeeItem = {
      id: `EMP-${100 + employees.length + 1}`,
      name,
      initials,
      role,
      department,
      type,
      annualSalary: salaryNum,
      monthlyGross,
      deductions: {
        federalTax: fedTax,
        stateTax: stateTax,
        ficaMedicare: fica,
        retirement401k: retirement,
        healthInsurance: health,
      },
      netPay: net,
      hireDate: new Date().toISOString().slice(0, 10),
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@bidexact.com`,
      phone: phone || '+1 (555) 000-1122',
      status: 'Active',
      directDeposit: directDeposit || 'Verified Direct Deposit',
      ptoDaysRemaining: 15,
      performanceRating: 5.0,
      manager,
    };

    onAddEmployee(newEmp);
    setIsOnboardModalOpen(false);

    // Reset
    setName('');
    setRole('');
    setAnnualSalary('');
    setEmail('');
    setPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>HUMAN RESOURCES</span>
            <span>/</span>
            <span>EMPLOYEE MANAGEMENT & DIRECTORY</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Workforce & Employee Management
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Full-time staff records, compensation structures, department headcounts, and HR compliance
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onNavigateToPayroll}
            className="h-9 px-3.5 bg-[#131b2e] hover:bg-[#171f33] border border-[#4edea3]/40 text-[#4edea3] rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Open Salary & Payroll Runs</span>
          </button>
          <button
            onClick={() => setIsOnboardModalOpen(true)}
            className="h-9 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Onboard New Employee</span>
          </button>
        </div>
      </div>

      {/* 4 Workforce KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Total Staff Headcount
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalEmployees} Employees
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{activeCount} Active on payroll • 0 pending</span>
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Annualized Payroll Burden
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            ${(totalPayrollBurden / 1000000).toFixed(2)}M / yr
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            ${(totalPayrollBurden / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} / month gross
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Average Base Compensation
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${Math.round(avgSalary).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#adc6ff] mt-2">
            Top 15% industry benchmark for pre-con tech
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            HR Compliance & Retention
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            97.8%
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            100% I-9 & W-4 e-verified on Gusto
          </div>
        </div>
      </div>

      {/* Main Staff Directory Table & Filter Bar */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
        {/* Filter Controls */}
        <div className="p-4 border-b border-[#222a3d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#86948a] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, role, ID, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
            <span className="text-[#86948a] text-[11px] hidden sm:inline">Department:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-[#dae2fd] focus:outline-none focus:border-[#4edea3]"
            >
              <option value="all">All Departments</option>
              <option value="Sales">Sales</option>
              <option value="Services">Services</option>
              <option value="Pre-Construction">Pre-Construction</option>
              <option value="Estimating Operations">Estimating Operations</option>
              <option value="VDC & BIM">VDC & BIM</option>
              <option value="Executive Leadership">Executive Leadership</option>
              <option value="Client Relations">Client Relations</option>
              <option value="Finance & Legal">Finance & Legal</option>
            </select>
          </div>
        </div>

        {/* Employee Grid / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] font-mono border-b border-[#222a3d]">
              <tr>
                <th className="py-2.5 px-4">Employee Name / ID</th>
                <th className="py-2.5 px-4">Role & Department</th>
                <th className="py-2.5 px-4">Contact Details</th>
                <th className="py-2.5 px-4">Annual Base / Mo. Gross</th>
                <th className="py-2.5 px-4">Direct Deposit Account</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#86948a]">
                    No employees found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-[#171f33]/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center font-mono font-bold text-xs text-[#4edea3]">
                          {emp.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-white hover:text-[#4edea3] transition-colors">
                            {emp.name}
                          </div>
                          <div className="font-mono text-[10px] text-[#86948a]">{emp.id} • {emp.type}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-[#dae2fd] font-medium">{emp.role}</div>
                      <div className="text-[11px] text-[#86948a]">{emp.department}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-[#dae2fd] flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-[#86948a]" />
                        <span>{emp.email}</span>
                      </div>
                      <div className="text-[#86948a] flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-[#86948a]" />
                        <span>{emp.phone}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-white">
                        ${emp.annualSalary.toLocaleString()} / yr
                      </div>
                      <div className="text-[11px] text-[#4edea3]">
                        ${Math.round(emp.monthlyGross).toLocaleString()} / mo
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-[#dae2fd]">
                      <div>{emp.directDeposit}</div>
                      <div className="text-[10px] text-[#86948a]">Manager: {emp.manager}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                        {emp.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployee(emp);
                        }}
                        className="p-1.5 text-[#86948a] hover:text-[#4edea3] rounded hover:bg-[#222a3d] transition-colors"
                        title="View Full HR Profile"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Profile Inspection Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#222a3d] flex items-center justify-between bg-[#171f33]/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#4edea3]/15 border border-[#4edea3]/40 flex items-center justify-center font-mono font-bold text-base text-[#4edea3]">
                  {selectedEmployee.initials}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {selectedEmployee.name}
                    <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30">
                      {selectedEmployee.status}
                    </span>
                  </h3>
                  <p className="text-xs text-[#86948a]">{selectedEmployee.role} • {selectedEmployee.department}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 rounded-md hover:bg-[#222a3d] text-[#86948a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-5 text-xs">
              {/* Compensation Breakdown Grid */}
              <div>
                <h4 className="text-[11px] font-mono uppercase text-[#86948a] tracking-wider mb-2 font-semibold">
                  Salary & Statutory Deductions
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-[#0b1326] border border-[#222a3d] rounded">
                    <div className="text-[10px] text-[#86948a]">Annual Base</div>
                    <div className="font-mono font-bold text-white text-sm">
                      ${selectedEmployee.annualSalary.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-[#0b1326] border border-[#222a3d] rounded">
                    <div className="text-[10px] text-[#86948a]">Monthly Gross</div>
                    <div className="font-mono font-bold text-[#4edea3] text-sm">
                      ${Math.round(selectedEmployee.monthlyGross).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-[#0b1326] border border-[#222a3d] rounded">
                    <div className="text-[10px] text-[#86948a]">Total Tax / mo</div>
                    <div className="font-mono font-bold text-[#ffb4ab] text-sm">
                      ${Math.round(selectedEmployee.deductions.federalTax + selectedEmployee.deductions.stateTax + selectedEmployee.deductions.ficaMedicare).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-[#0b1326] border border-[#222a3d] rounded">
                    <div className="text-[10px] text-[#86948a]">Net Take-Home</div>
                    <div className="font-mono font-bold text-white text-sm">
                      ${Math.round(selectedEmployee.netPay).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* HR & Employment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#0b1326] border border-[#222a3d] rounded space-y-2">
                  <div className="text-[11px] font-mono uppercase text-[#86948a] font-semibold">
                    Workforce Information
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Employee ID:</span>
                    <span className="font-mono text-white">{selectedEmployee.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Employment Type:</span>
                    <span className="text-white">{selectedEmployee.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Hire Date:</span>
                    <span className="font-mono text-white">{selectedEmployee.hireDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Direct Manager:</span>
                    <span className="text-white">{selectedEmployee.manager}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#0b1326] border border-[#222a3d] rounded space-y-2">
                  <div className="text-[11px] font-mono uppercase text-[#86948a] font-semibold">
                    Benefits & Compliance
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">PTO Balance:</span>
                    <span className="font-mono text-[#4edea3] font-semibold">{selectedEmployee.ptoDaysRemaining} Days Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Performance Score:</span>
                    <span className="font-mono text-white flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#4edea3]" />
                      {selectedEmployee.performanceRating} / 5.0
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Health & 401(k):</span>
                    <span className="text-white">Active Match (5%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Payroll Routing:</span>
                    <span className="font-mono text-[#86948a] truncate">{selectedEmployee.directDeposit}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#222a3d] bg-[#0b1326] flex items-center justify-between">
              <span className="text-[11px] text-[#86948a]">
                Verified against Gusto Enterprise HR & IRS W-2 Ledger
              </span>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-1.5 bg-[#171f33] hover:bg-[#222a3d] text-white rounded font-medium transition-colors"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Employee Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#222a3d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#4edea3]/10 text-[#4edea3]">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Onboard New Team Member</h3>
                  <p className="text-[11px] text-[#86948a]">Add workforce record, salary, and payroll enrollment</p>
                </div>
              </div>
              <button
                onClick={() => setIsOnboardModalOpen(false)}
                className="p-1 rounded hover:bg-[#171f33] text-[#86948a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Full Legal Name*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jonathan Blake"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Job Title / Designation*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Structural Estimator"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                  >
              <option value="Sales">Sales</option>
              <option value="Services">Services</option>
              <option value="Pre-Construction">Pre-Construction</option>
              <option value="VDC & BIM">VDC & BIM</option>
              <option value="Estimating Operations">Estimating Operations</option>
                    <option value="Executive Leadership">Executive Leadership</option>
                    <option value="Client Relations">Client Relations</option>
                    <option value="Finance & Legal">Finance & Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Employment Classification</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                  >
                    <option value="Full-Time W-2">Full-Time W-2 (Salaried)</option>
                    <option value="Part-Time W-2">Part-Time W-2</option>
                    <option value="Contractor 1099">Contractor 1099</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Annual Base Salary ($ USD)*</label>
                  <input
                    type="number"
                    step="1000"
                    required
                    placeholder="e.g. 135000"
                    value={annualSalary}
                    onChange={(e) => setAnnualSalary(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white font-mono focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Direct Manager</label>
                  <input
                    type="text"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Corporate Email</label>
                  <input
                    type="email"
                    placeholder="j.blake@bidexact.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Direct Deposit Account</label>
                  <input
                    type="text"
                    placeholder="Chase Bank ••9912 (Verified)"
                    value={directDeposit}
                    onChange={(e) => setDirectDeposit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#222a3d] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-3 py-1.5 rounded text-[#86948a] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded font-semibold shadow-sm transition-all"
                >
                  Enroll Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
